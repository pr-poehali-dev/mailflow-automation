"""YooKassa payment creation handler."""
import json
import os
import re
import uuid
import hmac
import hashlib
import base64
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg2


def _check_verified_user(event: dict, conn, schema_prefix: str) -> tuple[int | None, dict | None]:
    """Возвращает (user_id, None) если юзер залогинен и email подтверждён,
    иначе (None, error_response_dict). Если auth не настроен — пропускает (опционально)."""
    headers_in = event.get('headers') or {}
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-CSRF-Token',
        'Content-Type': 'application/json'
    }

    secret_str = os.environ.get('AUTH_JWT_SECRET', '')
    if not secret_str or len(secret_str) < 16:
        # auth не настроен — не блокируем (для совместимости)
        return None, None

    token = (headers_in.get('X-Auth-Token') or headers_in.get('x-auth-token') or '').strip()
    if not token:
        auth_h = headers_in.get('X-Authorization') or headers_in.get('x-authorization') or ''
        if auth_h.lower().startswith('bearer '):
            token = auth_h[7:].strip()
    if not token:
        return None, {'statusCode': 401, 'headers': cors,
                      'body': json.dumps({'error': 'Войдите в аккаунт, чтобы оплатить'}, ensure_ascii=False)}

    try:
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError()
        user_id_str, raw, sig = parts
        expected = hmac.new(secret_str.encode(), f"{user_id_str}.{raw}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            raise ValueError()
        user_id = int(user_id_str)
    except Exception:
        return None, {'statusCode': 401, 'headers': cors,
                      'body': json.dumps({'error': 'Недействительный токен'}, ensure_ascii=False)}

    token_hash = hashlib.sha256(token.encode()).hexdigest()
    cur = conn.cursor()
    cur.execute(
        f"SELECT s.user_id, u.is_active, u.is_email_verified "
        f"FROM {schema_prefix}user_sessions s JOIN {schema_prefix}users u ON u.id = s.user_id "
        f"WHERE s.token_hash = %s AND s.revoked_at IS NULL AND s.expires_at > NOW()",
        (token_hash,)
    )
    row = cur.fetchone()
    if not row:
        return None, {'statusCode': 401, 'headers': cors,
                      'body': json.dumps({'error': 'Сессия истекла'}, ensure_ascii=False)}
    if not row[1]:
        return None, {'statusCode': 403, 'headers': cors,
                      'body': json.dumps({'error': 'Аккаунт деактивирован'}, ensure_ascii=False)}
    if not row[2]:
        return None, {'statusCode': 403, 'headers': cors,
                      'body': json.dumps({'error': 'email_not_verified',
                                         'message': 'Подтвердите email, чтобы оплатить тариф. Письмо со ссылкой мы уже отправили.'},
                                        ensure_ascii=False)}
    return row[0], None


# =============================================================================
# VALIDATION
# =============================================================================

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
MIN_AMOUNT = 1.00  # Minimum 1 RUB
MAX_AMOUNT = 1_000_000.00  # Maximum 1M RUB


def is_valid_email(email: str) -> bool:
    """Validate email format."""
    return bool(EMAIL_REGEX.match(email))


def is_valid_url(url: str) -> bool:
    """Validate URL (must be https)."""
    return url.startswith('https://')

# =============================================================================
# CONSTANTS
# =============================================================================

YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-CSRF-Token',
    'Content-Type': 'application/json'
}


# =============================================================================
# DATABASE
# =============================================================================

def get_connection():
    """Get database connection."""
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    """Get database schema prefix."""
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


# =============================================================================
# YOOKASSA API
# =============================================================================

def create_yookassa_payment(
    shop_id: str,
    secret_key: str,
    amount: float,
    description: str,
    return_url: str,
    customer_email: str,
    cart_items: list,
    metadata: dict = None
) -> dict:
    """Create payment via YooKassa API with receipt (54-FZ)."""
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()

    idempotence_key = str(uuid.uuid4())

    # Build receipt items for 54-FZ
    receipt_items = []
    for item in cart_items:
        qty = int(item.get('quantity', 1))
        price = float(item.get('price', 0))
        receipt_items.append({
            "description": str(item.get('name', 'Товар'))[:128],
            "quantity": f"{qty:.3f}",
            "amount": {
                "value": f"{price * qty:.2f}",
                "currency": "RUB"
            },
            "vat_code": 1,
            "payment_subject": "commodity",
            "payment_mode": "full_payment"
        })

    payload = {
        "amount": {
            "value": f"{amount:.2f}",
            "currency": "RUB"
        },
        "capture": True,
        "confirmation": {
            "type": "redirect",
            "return_url": return_url
        },
        "description": description,
        "receipt": {
            "customer": {
                "email": customer_email
            },
            "items": receipt_items
        }
    }

    if metadata:
        payload["metadata"] = metadata

    request = Request(
        YOOKASSA_API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Basic {auth_bytes}',
            'Idempotence-Key': idempotence_key,
            'Content-Type': 'application/json'
        },
        method='POST'
    )

    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode())


# =============================================================================
# HANDLER
# =============================================================================

def handler(event, context):
    """Handle payment creation request."""
    # CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    # Parse body
    body = event.get('body', '{}')
    if event.get('isBase64Encoded'):
        body = base64.b64decode(body).decode('utf-8')

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Invalid JSON'})
        }

    # Validate required fields
    amount = data.get('amount', 0)
    user_name = data.get('user_name', '').strip()
    user_email = data.get('user_email', '').strip()
    user_phone = data.get('user_phone', '').strip()
    return_url = data.get('return_url', '').strip()
    description = data.get('description', 'Оплата заказа')
    cart_items = data.get('cart_items', [])
    plan_id = (data.get('plan_id') or '').strip()
    billing_period = (data.get('billing_period') or '').strip()

    if amount < MIN_AMOUNT or amount > MAX_AMOUNT:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': f'Amount must be between {MIN_AMOUNT} and {MAX_AMOUNT} RUB'})
        }

    if not user_email or not is_valid_email(user_email):
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Valid email is required'})
        }

    if not return_url or not is_valid_url(return_url):
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'return_url must be a valid HTTPS URL'})
        }

    # If no cart_items, create a single item with total amount
    if not cart_items:
        cart_items = [{
            'id': '1',
            'name': description or 'Оплата',
            'price': amount,
            'quantity': 1
        }]

    # Get credentials
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '')

    if not shop_id or not secret_key:
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': 'YooKassa credentials not configured'})
        }

    S = get_schema()
    conn = get_connection()

    # Защита: только авторизованный пользователь с подтверждённым email
    _uid, _err = _check_verified_user(event, conn, S)
    if _err:
        conn.close()
        return _err

    try:
        cur = conn.cursor()
        now = datetime.utcnow().isoformat()

        # Generate order number
        order_number = f"YK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

        # Auto-detect plan_id / billing_period from cart_items if not provided
        if not plan_id and cart_items:
            plan_id = str(cart_items[0].get('id', ''))[:50]
        if not billing_period:
            # Heuristic: if total >= monthly_price * 6, it's yearly
            billing_period = 'yearly' if amount >= 5000 else 'monthly'

        # Create order in DB
        cur.execute(f"""
            INSERT INTO {S}orders
            (order_number, user_name, user_email, user_phone, amount, status,
             plan_id, billing_period, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s, %s)
            RETURNING id
        """, (order_number, user_name, user_email, user_phone, amount,
              plan_id, billing_period, now, now))

        order_id = cur.fetchone()[0]

        # Insert cart items
        for item in cart_items:
            cur.execute(f"""
                INSERT INTO {S}order_items
                (order_id, product_id, product_name, product_price, quantity, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                order_id,
                str(item.get('id', '')),
                item.get('name', ''),
                item.get('price', 0),
                item.get('quantity', 1),
                now
            ))

        # Create YooKassa payment
        metadata = {
            "order_id": str(order_id),
            "order_number": order_number
        }

        payment_response = create_yookassa_payment(
            shop_id=shop_id,
            secret_key=secret_key,
            amount=amount,
            description=f"{description} ({order_number})",
            return_url=return_url,
            customer_email=user_email,
            cart_items=cart_items,
            metadata=metadata
        )

        payment_id = payment_response.get('id')
        confirmation_url = payment_response.get('confirmation', {}).get('confirmation_url', '')

        # Update order with payment info
        cur.execute(f"""
            UPDATE {S}orders
            SET yookassa_payment_id = %s, payment_url = %s, updated_at = %s
            WHERE id = %s
        """, (payment_id, confirmation_url, now, order_id))

        conn.commit()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'payment_url': confirmation_url,
                'payment_id': payment_id,
                'order_id': order_id,
                'order_number': order_number
            })
        }

    except HTTPError as e:
        conn.rollback()
        error_body = e.read().decode() if e.fp else str(e)
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': f'YooKassa API error: {error_body}'})
        }
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        conn.close()