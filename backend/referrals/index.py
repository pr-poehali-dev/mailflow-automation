"""
Реферальная программа MAIL-KA.

Эндпоинты (?action=...):
  me          GET  — мой реферальный код, статистика, ссылка
  history     GET  — список приглашённых
  bonuses     GET  — история начислений и баланс
  capture     POST — зафиксировать переход по ref-ссылке (?action=capture body={code, email})
"""
import json
import os
import hmac
import hashlib
import psycopg2


SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
S = f"{SCHEMA}." if SCHEMA else ""

BONUS_PER_REFERRAL = 500  # ₽ за каждого оплатившего реферала
APP_BASE_URL = os.environ.get('APP_BASE_URL', 'https://mail-ka.ru')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def json_response(status: int, body: dict) -> dict:
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, ensure_ascii=False)}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_secret() -> bytes:
    s = os.environ.get('AUTH_JWT_SECRET', '')
    if not s or len(s) < 16:
        raise RuntimeError('AUTH_JWT_SECRET не настроен')
    return s.encode()


def parse_token(token: str):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        user_id_str, raw, sig = parts
        expected = hmac.new(get_secret(), f"{user_id_str}.{raw}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return None
        return int(user_id_str)
    except Exception:
        return None


def auth_required(cur, event: dict):
    headers = event.get('headers') or {}
    token = (headers.get('X-Auth-Token') or headers.get('x-auth-token') or '').strip()
    if not token:
        auth_h = headers.get('X-Authorization') or headers.get('x-authorization') or ''
        if auth_h.lower().startswith('bearer '):
            token = auth_h[7:].strip()
    if not token:
        return None, json_response(401, {'error': 'unauthorized'})
    user_id = parse_token(token)
    if not user_id:
        return None, json_response(401, {'error': 'invalid_token'})
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    cur.execute(
        f"SELECT s.user_id FROM {S}user_sessions s "
        f"WHERE s.token_hash = %s AND s.revoked_at IS NULL AND s.expires_at > NOW()",
        (token_hash,)
    )
    row = cur.fetchone()
    if not row:
        return None, json_response(401, {'error': 'session_expired'})
    return row[0], None


def ensure_referral_code(cur, user_id: int) -> str:
    """Гарантируем что у юзера есть referral_code, возвращаем его."""
    cur.execute(f"SELECT referral_code, email_lower FROM {S}users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row:
        return ''
    code, email = row
    if code:
        return code
    seed = f"{user_id}{email or ''}"
    new_code = hashlib.md5(seed.encode()).hexdigest()[:8].upper()
    cur.execute(
        f"UPDATE {S}users SET referral_code = %s WHERE id = %s AND referral_code IS NULL",
        (new_code, user_id)
    )
    cur.execute(f"SELECT referral_code FROM {S}users WHERE id = %s", (user_id,))
    return cur.fetchone()[0]


def handle_me(cur, user_id: int):
    code = ensure_referral_code(cur, user_id)

    cur.execute(
        f"SELECT COUNT(*) FILTER (WHERE status='pending'), "
        f"       COUNT(*) FILTER (WHERE status='converted'), "
        f"       COALESCE(SUM(bonus_amount) FILTER (WHERE status='converted'), 0) "
        f"FROM {S}referrals WHERE inviter_user_id = %s",
        (user_id,)
    )
    pending, converted, total_earned = cur.fetchone()

    cur.execute(f"SELECT bonus_balance FROM {S}users WHERE id = %s", (user_id,))
    balance = float(cur.fetchone()[0] or 0)

    link = f"{APP_BASE_URL.rstrip('/')}?ref={code}"

    return json_response(200, {
        'ok': True,
        'referral_code': code,
        'referral_link': link,
        'bonus_per_referral': BONUS_PER_REFERRAL,
        'stats': {
            'pending': pending or 0,
            'converted': converted or 0,
            'total_earned': float(total_earned or 0),
            'balance': balance,
        }
    })


def handle_history(cur, user_id: int):
    cur.execute(
        f"SELECT id, invitee_email, status, bonus_amount, created_at, converted_at "
        f"FROM {S}referrals WHERE inviter_user_id = %s "
        f"ORDER BY created_at DESC LIMIT 100",
        (user_id,)
    )
    rows = cur.fetchall()
    items = []
    for r in rows:
        items.append({
            'id': r[0],
            'email': mask_email(r[1]),
            'status': r[2],
            'bonus': float(r[3] or 0),
            'invited_at': r[4].isoformat() if r[4] else None,
            'converted_at': r[5].isoformat() if r[5] else None,
        })
    return json_response(200, {'ok': True, 'items': items})


def handle_bonuses(cur, user_id: int):
    cur.execute(
        f"SELECT id, amount, type, description, created_at "
        f"FROM {S}bonus_transactions WHERE user_id = %s "
        f"ORDER BY created_at DESC LIMIT 100",
        (user_id,)
    )
    rows = cur.fetchall()
    items = []
    for r in rows:
        items.append({
            'id': r[0],
            'amount': float(r[1] or 0),
            'type': r[2],
            'description': r[3] or '',
            'created_at': r[4].isoformat() if r[4] else None,
        })
    cur.execute(f"SELECT bonus_balance FROM {S}users WHERE id = %s", (user_id,))
    balance = float(cur.fetchone()[0] or 0)
    return json_response(200, {'ok': True, 'balance': balance, 'items': items})


def handle_capture(cur, body: dict):
    """Фиксируем переход по реф-ссылке.
    Создаёт pending referral (если кто-то перешёл и оставил email)."""
    code = (body.get('code') or '').strip().upper()
    email = (body.get('email') or '').strip().lower()

    if not code or '@' not in email:
        return json_response(400, {'ok': False, 'error': 'bad_input'})

    cur.execute(f"SELECT id FROM {S}users WHERE referral_code = %s", (code,))
    inviter = cur.fetchone()
    if not inviter:
        return json_response(200, {'ok': False, 'error': 'code_not_found'})

    inviter_id = inviter[0]

    cur.execute(
        f"SELECT id FROM {S}referrals WHERE inviter_user_id = %s AND LOWER(invitee_email) = %s",
        (inviter_id, email)
    )
    if cur.fetchone():
        return json_response(200, {'ok': True, 'already': True})

    cur.execute(
        f"INSERT INTO {S}referrals (inviter_user_id, invitee_email, referral_code, status) "
        f"VALUES (%s, %s, %s, 'pending')",
        (inviter_id, email, code)
    )
    return json_response(200, {'ok': True})


def mask_email(email: str) -> str:
    if not email or '@' not in email:
        return email or ''
    name, dom = email.split('@', 1)
    if len(name) <= 2:
        masked = name[0] + '*'
    else:
        masked = name[0] + '*' * (len(name) - 2) + name[-1]
    return f"{masked}@{dom}"


def handler(event: dict, context) -> dict:
    """Реферальная программа: получение кода, истории, фиксация переходов."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = (params.get('action') or '').lower()

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            if action == 'capture' and method == 'POST':
                try:
                    body = json.loads(event.get('body') or '{}')
                except json.JSONDecodeError:
                    return json_response(400, {'ok': False, 'error': 'invalid_json'})
                resp = handle_capture(cur, body)
                conn.commit()
                return resp

            user_id, err = auth_required(cur, event)
            if err:
                return err

            if action == 'me':
                resp = handle_me(cur, user_id)
                conn.commit()
                return resp

            if action == 'history':
                return handle_history(cur, user_id)

            if action == 'bonuses':
                return handle_bonuses(cur, user_id)

            return json_response(400, {'ok': False, 'error': 'unknown_action'})
    finally:
        conn.close()
