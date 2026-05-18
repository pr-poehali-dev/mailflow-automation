"""YooKassa webhook handler for payment notifications."""
import json
import os
import base64
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg2

# =============================================================================
# CONSTANTS
# =============================================================================

HEADERS = {
    'Content-Type': 'application/json'
}

YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"
SEND_EMAIL_URL = "https://functions.poehali.dev/9861b492-d3a2-48ef-9407-3b07e1d55181"


# =============================================================================
# WELCOME EMAIL
# =============================================================================

def send_welcome_email(user_email: str, user_name: str, plan_id: str,
                       billing_period: str, amount: float, order_number: str) -> None:
    """Send welcome email after successful payment. Errors are silenced."""
    name = (user_name or '').strip() or 'друг'
    period_text = '12 месяцев' if billing_period == 'yearly' else '1 месяц'
    plan_names = {
        'starter': 'Старт',
        'business': 'Бизнес',
        'enterprise': 'Enterprise'
    }
    plan_label = plan_names.get(plan_id, plan_id or 'выбранный')

    subject = f'Добро пожаловать в MAIL-KA! Подписка «{plan_label}» активирована'

    text = (
        f'Привет, {name}!\n\n'
        f'Спасибо за оплату — мы получили платёж и активировали вашу подписку.\n\n'
        f'Ваш заказ:\n'
        f'• Тариф: {plan_label}\n'
        f'• Период: {period_text}\n'
        f'• Сумма: {amount:.2f} RUB\n'
        f'• Номер заказа: {order_number}\n\n'
        f'Что делать дальше:\n'
        f'1. Подключите свой SMTP в разделе Настройки\n'
        f'2. Загрузите базу контактов (CSV или Excel)\n'
        f'3. Соберите первое письмо в визуальном редакторе\n'
        f'4. Запустите автоматизацию — Welcome-серию или брошенную корзину\n\n'
        f'Полезные ссылки:\n'
        f'• AI-копирайтер: придумает заголовок и текст за 5 секунд\n'
        f'• Predictive AI: покажет LTV и риск оттока по каждому контакту\n'
        f'• Omnichannel: добавьте SMS, Telegram и Push в одну воронку\n\n'
        f'Чек по 54-ФЗ придёт отдельным письмом от ЮKassa в течение 5 минут.\n'
        f'Закрывающие документы для бухгалтерии — в личном кабинете в разделе «Биллинг».\n\n'
        f'Если что-то не получается — просто ответьте на это письмо. Мы отвечаем за 2 минуты.\n\n'
        f'Спасибо, что выбрали MAIL-KA! 🚀\n\n'
        f'— Команда MAIL-KA'
    )

    payload = json.dumps({
        'to': user_email,
        'subject': subject,
        'text': text,
        'from_name': 'MAIL-KA'
    }).encode('utf-8')

    sys_token = os.environ.get('SYSTEM_EMAIL_TOKEN', '')
    req_headers = {'Content-Type': 'application/json'}
    if sys_token:
        req_headers['X-System-Token'] = sys_token

    request = Request(SEND_EMAIL_URL, data=payload, headers=req_headers, method='POST')

    try:
        with urlopen(request, timeout=10) as response:
            response.read()
    except Exception:
        pass


# =============================================================================
# SECURITY
# =============================================================================

def verify_payment_via_api(payment_id: str, shop_id: str, secret_key: str) -> dict | None:
    """Verify payment status via YooKassa API.

    YooKassa doesn't use webhook signatures. The recommended approach is to
    verify payment status by making a GET request to the API.
    """
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()

    request = Request(
        f"{YOOKASSA_API_URL}/{payment_id}",
        headers={
            'Authorization': f'Basic {auth_bytes}',
            'Content-Type': 'application/json'
        },
        method='GET'
    )

    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode())
    except (HTTPError, Exception):
        return None


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


REFERRAL_BONUS_AMOUNT = 500  # ₽ инвайтеру за оплатившего реферала


def process_referral_bonus(cur, S: str, order_id: int, user_email: str) -> None:
    """Если покупатель пришёл по реф-коду, начисляем бонус инвайтеру.
    Защищено от повторного начисления через статус referral=converted."""
    try:
        cur.execute(
            f"SELECT id, referred_by_code FROM {S}users WHERE LOWER(email_lower) = LOWER(%s)",
            (user_email or '',)
        )
        urow = cur.fetchone()
        if not urow:
            return
        invitee_id, ref_code = urow
        if not ref_code:
            return

        cur.execute(
            f"SELECT id FROM {S}users WHERE referral_code = %s",
            (ref_code,)
        )
        inv = cur.fetchone()
        if not inv:
            return
        inviter_id = inv[0]
        if inviter_id == invitee_id:
            return

        cur.execute(
            f"SELECT id, status FROM {S}referrals "
            f"WHERE inviter_user_id = %s AND LOWER(invitee_email) = LOWER(%s) "
            f"ORDER BY id DESC LIMIT 1",
            (inviter_id, user_email)
        )
        ref_row = cur.fetchone()

        if ref_row:
            ref_id, ref_status = ref_row
            if ref_status == 'converted':
                return
            cur.execute(
                f"UPDATE {S}referrals "
                f"SET status='converted', bonus_amount=%s, order_id=%s, "
                f"    invitee_user_id=%s, converted_at=CURRENT_TIMESTAMP "
                f"WHERE id = %s",
                (REFERRAL_BONUS_AMOUNT, order_id, invitee_id, ref_id)
            )
        else:
            cur.execute(
                f"INSERT INTO {S}referrals "
                f"(inviter_user_id, invitee_user_id, invitee_email, referral_code, "
                f" status, bonus_amount, order_id, converted_at) "
                f"VALUES (%s, %s, %s, %s, 'converted', %s, %s, CURRENT_TIMESTAMP) "
                f"RETURNING id",
                (inviter_id, invitee_id, user_email, ref_code, REFERRAL_BONUS_AMOUNT, order_id)
            )
            ref_id = cur.fetchone()[0]

        cur.execute(
            f"UPDATE {S}users SET bonus_balance = bonus_balance + %s WHERE id = %s",
            (REFERRAL_BONUS_AMOUNT, inviter_id)
        )
        cur.execute(
            f"INSERT INTO {S}bonus_transactions "
            f"(user_id, amount, type, description, referral_id, order_id) "
            f"VALUES (%s, %s, 'referral', %s, %s, %s)",
            (inviter_id, REFERRAL_BONUS_AMOUNT,
             f'Бонус за оплатившего реферала ({user_email})', ref_id, order_id)
        )
    except Exception as e:
        print(f"[referral_bonus] FAIL: {type(e).__name__}: {str(e)[:200]}")


# =============================================================================
# HANDLER
# =============================================================================

def handler(event, context):
    """Handle YooKassa webhook notification."""
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

    # Extract payment info
    event_type = data.get('event', '')
    payment_object = data.get('object', {})
    payment_id = payment_object.get('id', '')
    metadata = payment_object.get('metadata', {})

    if not payment_id:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Missing payment id'})
        }

    # Security: Verify payment via API (most reliable)
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '')

    if shop_id and secret_key:
        verified_payment = verify_payment_via_api(payment_id, shop_id, secret_key)
        if not verified_payment:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Payment verification failed'})
            }
        # Use verified status instead of webhook data
        payment_status = verified_payment.get('status', '')
    else:
        # Fallback to webhook data (less secure, only if credentials missing)
        payment_status = payment_object.get('status', '')

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()
        now = datetime.utcnow().isoformat()

        # Find order by payment_id
        cur.execute(f"""
            SELECT id, status, user_email, user_name, plan_id,
                   billing_period, amount, order_number
            FROM {S}orders
            WHERE yookassa_payment_id = %s
        """, (payment_id,))

        row = cur.fetchone()

        if not row:
            # Try to find by order_id from metadata
            order_id_meta = metadata.get('order_id')
            if order_id_meta:
                cur.execute(f"""
                    SELECT id, status, user_email, user_name, plan_id,
                           billing_period, amount, order_number
                    FROM {S}orders WHERE id = %s
                """, (int(order_id_meta),))
                row = cur.fetchone()

        if not row:
            return {
                'statusCode': 404,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Order not found'})
            }

        (order_id, current_status, user_email, user_name,
         plan_id, billing_period, amount, order_number) = row

        # Update based on verified payment status
        if payment_status == 'succeeded':
            if current_status != 'paid':
                cur.execute(f"""
                    UPDATE {S}orders
                    SET status = 'paid', paid_at = %s, updated_at = %s
                    WHERE id = %s
                """, (now, now, order_id))

                # Начисляем реф-бонус инвайтеру (если есть)
                try:
                    process_referral_bonus(cur, S, order_id, user_email or '')
                except Exception:
                    pass

                conn.commit()

                # Отправляем приветственное письмо только при первом переходе в paid
                if user_email:
                    try:
                        send_welcome_email(
                            user_email=user_email,
                            user_name=user_name or '',
                            plan_id=plan_id or '',
                            billing_period=billing_period or 'monthly',
                            amount=float(amount or 0),
                            order_number=order_number or ''
                        )
                    except Exception:
                        pass

        elif payment_status == 'canceled':
            if current_status not in ('paid', 'canceled'):
                cur.execute(f"""
                    UPDATE {S}orders
                    SET status = 'canceled', updated_at = %s
                    WHERE id = %s
                """, (now, order_id))
                conn.commit()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({'status': 'ok'})
        }

    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Internal error'})
        }
    finally:
        conn.close()