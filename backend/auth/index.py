"""
Auth: register / login / logout / me / change-password.
Безопасность: bcrypt-хэш паролей (PBKDF2-HMAC-SHA256 без внешних зависимостей),
HMAC-подписанные сессионные токены, CSRF-токен, rate-limit по IP+email,
защита от перебора (lock-out), audit-лог, валидация входных данных.
"""
import json
import os
import re
import hmac
import hashlib
import secrets
import base64
from datetime import datetime, timedelta

import psycopg2


SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
S = f"{SCHEMA}." if SCHEMA else ""

EMAIL_RE = re.compile(r'^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,24}$')
NAME_RE = re.compile(r'^[\w\s\-\.\u0400-\u04FF]{1,80}$', re.UNICODE)

PASSWORD_MIN = 8
PASSWORD_MAX = 128
SESSION_TTL_DAYS = 30
LOCK_AFTER_ATTEMPTS = 5
LOCK_MINUTES = 15

RATE_LIMITS = {
    'login_ip':       (10, 60),    # 10 попыток / 60 сек / IP
    'login_email':    (5,  300),   # 5 попыток / 5 мин / email
    'register_ip':    (5,  600),   # 5 регистраций / 10 мин / IP
}

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
}


# ============= УТИЛИТЫ =============

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_secret() -> bytes:
    s = os.environ.get('AUTH_JWT_SECRET', '')
    if not s or len(s) < 16:
        raise RuntimeError('AUTH_JWT_SECRET не настроен')
    return s.encode()


def json_response(status: int, body: dict, extra_headers: dict = None) -> dict:
    headers = dict(CORS_HEADERS)
    if extra_headers:
        headers.update(extra_headers)
    return {'statusCode': status, 'headers': headers, 'body': json.dumps(body, ensure_ascii=False)}


def hash_password(password: str) -> str:
    """PBKDF2-HMAC-SHA256, 200_000 итераций, 16-байт соль."""
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 200_000)
    return f"pbkdf2_sha256$200000${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters, salt_b64, hash_b64 = stored.split('$')
        if algo != 'pbkdf2_sha256':
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, int(iters))
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


def make_session_token(user_id: int) -> tuple[str, str]:
    """Возвращает (token_plain, token_hash). token_plain выдаём клиенту."""
    raw = secrets.token_urlsafe(48)
    payload = f"{user_id}.{raw}"
    sig = hmac.new(get_secret(), payload.encode(), hashlib.sha256).hexdigest()
    token = f"{payload}.{sig}"
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash


def parse_token(token: str) -> int | None:
    """Проверяет HMAC и возвращает user_id или None."""
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


def get_client_ip(event: dict) -> str:
    rc = event.get('requestContext') or {}
    ident = rc.get('identity') or {}
    ip = ident.get('sourceIp') or ''
    return ip[:64]


def get_user_agent(headers: dict) -> str:
    ua = headers.get('User-Agent') or headers.get('user-agent') or ''
    return ua[:500]


def rate_limit_check(cur, bucket: str, action: str) -> bool:
    """True если в лимите, False если превышен."""
    limit, window = RATE_LIMITS[action]
    cutoff = (datetime.utcnow() - timedelta(seconds=window)).isoformat()
    cur.execute(
        f"SELECT COUNT(*) FROM {S}rate_limits "
        f"WHERE bucket_key = %s AND action = %s AND created_at > %s",
        (bucket, action, cutoff)
    )
    cnt = cur.fetchone()[0]
    if cnt >= limit:
        return False
    cur.execute(
        f"INSERT INTO {S}rate_limits (bucket_key, action) VALUES (%s, %s)",
        (bucket, action)
    )
    return True


def audit(cur, event_type: str, success: bool, user_id=None, email=None, ip=None, ua=None, details=None):
    cur.execute(
        f"INSERT INTO {S}auth_audit_log "
        f"(event_type, user_id, email, ip_address, user_agent, success, details) "
        f"VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (event_type, user_id, email, ip, ua, success, details)
    )


def cleanup_old_data(cur):
    """Чистим протухшие сессии и старые rate-limit записи."""
    cur.execute(f"UPDATE {S}user_sessions SET revoked_at = NOW() WHERE expires_at < NOW() AND revoked_at IS NULL")
    cur.execute(f"DELETE FROM {S}rate_limits WHERE created_at < NOW() - INTERVAL '1 hour'")


def auth_required(cur, event: dict) -> tuple[int | None, dict | None]:
    headers = event.get('headers') or {}
    token = (headers.get('X-Auth-Token') or headers.get('x-auth-token') or '').strip()
    if not token:
        auth_h = headers.get('X-Authorization') or headers.get('x-authorization') or ''
        if auth_h.lower().startswith('bearer '):
            token = auth_h[7:].strip()
    if not token:
        return None, json_response(401, {'error': 'Не авторизован'})
    user_id = parse_token(token)
    if not user_id:
        return None, json_response(401, {'error': 'Недействительный токен'})
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    cur.execute(
        f"SELECT s.user_id, s.csrf_token, u.is_active "
        f"FROM {S}user_sessions s JOIN {S}users u ON u.id = s.user_id "
        f"WHERE s.token_hash = %s AND s.revoked_at IS NULL AND s.expires_at > NOW()",
        (token_hash,)
    )
    row = cur.fetchone()
    if not row:
        return None, json_response(401, {'error': 'Сессия истекла'})
    if not row[2]:
        return None, json_response(403, {'error': 'Аккаунт деактивирован'})
    return row[0], None


# ============= HANDLERS =============

def action_register(event: dict, cur, conn) -> dict:
    body = json.loads(event.get('body') or '{}')
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    name = (body.get('name') or '').strip()
    ip = get_client_ip(event)
    ua = get_user_agent(event.get('headers') or {})

    if not rate_limit_check(cur, ip or 'unknown', 'register_ip'):
        audit(cur, 'register', False, email=email, ip=ip, ua=ua, details='rate_limited')
        conn.commit()
        return json_response(429, {'error': 'Слишком много попыток. Попробуйте позже.'})

    if not EMAIL_RE.match(email) or len(email) > 255:
        return json_response(400, {'error': 'Некорректный email'})
    if not (PASSWORD_MIN <= len(password) <= PASSWORD_MAX):
        return json_response(400, {'error': f'Пароль должен быть от {PASSWORD_MIN} до {PASSWORD_MAX} символов'})
    if not re.search(r'[A-Za-z]', password) or not re.search(r'\d', password):
        return json_response(400, {'error': 'Пароль должен содержать буквы и цифры'})
    if name and not NAME_RE.match(name):
        return json_response(400, {'error': 'Некорректное имя'})

    cur.execute(f"SELECT 1 FROM {S}users WHERE email_lower = %s", (email,))
    if cur.fetchone():
        audit(cur, 'register', False, email=email, ip=ip, ua=ua, details='email_taken')
        conn.commit()
        return json_response(409, {'error': 'Пользователь с таким email уже существует'})

    pwd_hash = hash_password(password)
    cur.execute(
        f"INSERT INTO {S}users (email, email_lower, password_hash, name, last_login_ip, last_login_at) "
        f"VALUES (%s, %s, %s, %s, %s, NOW()) RETURNING id, email, name, role, created_at",
        (email, email, pwd_hash, name, ip)
    )
    user = cur.fetchone()
    user_id = user[0]

    token, token_hash = make_session_token(user_id)
    csrf = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(days=SESSION_TTL_DAYS)
    cur.execute(
        f"INSERT INTO {S}user_sessions (user_id, token_hash, csrf_token, user_agent, ip_address, expires_at) "
        f"VALUES (%s, %s, %s, %s, %s, %s)",
        (user_id, token_hash, csrf, ua, ip, expires.isoformat())
    )
    audit(cur, 'register', True, user_id=user_id, email=email, ip=ip, ua=ua)
    conn.commit()

    return json_response(200, {
        'token': token,
        'csrf_token': csrf,
        'user': {
            'id': user[0], 'email': user[1], 'name': user[2],
            'role': user[3], 'created_at': str(user[4])
        }
    })


def action_login(event: dict, cur, conn) -> dict:
    body = json.loads(event.get('body') or '{}')
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    ip = get_client_ip(event)
    ua = get_user_agent(event.get('headers') or {})

    if not rate_limit_check(cur, ip or 'unknown', 'login_ip'):
        audit(cur, 'login', False, email=email, ip=ip, ua=ua, details='rate_limited_ip')
        conn.commit()
        return json_response(429, {'error': 'Слишком много попыток. Подождите минуту.'})

    if not EMAIL_RE.match(email):
        return json_response(400, {'error': 'Некорректные данные'})
    if not (1 <= len(password) <= PASSWORD_MAX):
        return json_response(400, {'error': 'Некорректные данные'})

    if not rate_limit_check(cur, email, 'login_email'):
        audit(cur, 'login', False, email=email, ip=ip, ua=ua, details='rate_limited_email')
        conn.commit()
        return json_response(429, {'error': 'Слишком много попыток входа для этого email.'})

    cur.execute(
        f"SELECT id, password_hash, name, role, is_active, failed_attempts, locked_until "
        f"FROM {S}users WHERE email_lower = %s",
        (email,)
    )
    row = cur.fetchone()

    if not row:
        # Делаем фиктивную проверку пароля чтобы не выдавать таймингом существование email
        verify_password(password, 'pbkdf2_sha256$200000$AAAA$AAAA')
        audit(cur, 'login', False, email=email, ip=ip, ua=ua, details='no_user')
        conn.commit()
        return json_response(401, {'error': 'Неверный email или пароль'})

    user_id, pwd_hash, name, role, is_active, failed, locked_until = row

    if not is_active:
        audit(cur, 'login', False, user_id=user_id, email=email, ip=ip, ua=ua, details='inactive')
        conn.commit()
        return json_response(403, {'error': 'Аккаунт деактивирован'})

    if locked_until and datetime.utcnow() < locked_until:
        audit(cur, 'login', False, user_id=user_id, email=email, ip=ip, ua=ua, details='locked')
        conn.commit()
        return json_response(423, {'error': 'Аккаунт временно заблокирован. Попробуйте через 15 минут.'})

    if not verify_password(password, pwd_hash):
        new_failed = failed + 1
        if new_failed >= LOCK_AFTER_ATTEMPTS:
            lock = datetime.utcnow() + timedelta(minutes=LOCK_MINUTES)
            cur.execute(
                f"UPDATE {S}users SET failed_attempts = %s, locked_until = %s WHERE id = %s",
                (new_failed, lock.isoformat(), user_id)
            )
        else:
            cur.execute(
                f"UPDATE {S}users SET failed_attempts = %s WHERE id = %s",
                (new_failed, user_id)
            )
        audit(cur, 'login', False, user_id=user_id, email=email, ip=ip, ua=ua, details='bad_password')
        conn.commit()
        return json_response(401, {'error': 'Неверный email или пароль'})

    # Успех
    cur.execute(
        f"UPDATE {S}users SET failed_attempts = 0, locked_until = NULL, "
        f"last_login_at = NOW(), last_login_ip = %s WHERE id = %s",
        (ip, user_id)
    )

    token, token_hash = make_session_token(user_id)
    csrf = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(days=SESSION_TTL_DAYS)
    cur.execute(
        f"INSERT INTO {S}user_sessions (user_id, token_hash, csrf_token, user_agent, ip_address, expires_at) "
        f"VALUES (%s, %s, %s, %s, %s, %s)",
        (user_id, token_hash, csrf, ua, ip, expires.isoformat())
    )
    audit(cur, 'login', True, user_id=user_id, email=email, ip=ip, ua=ua)
    conn.commit()

    return json_response(200, {
        'token': token,
        'csrf_token': csrf,
        'user': {'id': user_id, 'email': email, 'name': name, 'role': role}
    })


def action_logout(event: dict, cur, conn) -> dict:
    user_id, err = auth_required(cur, event)
    if err:
        return err
    headers = event.get('headers') or {}
    token = (headers.get('X-Auth-Token') or headers.get('x-auth-token') or '').strip()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    cur.execute(
        f"UPDATE {S}user_sessions SET revoked_at = NOW() WHERE token_hash = %s",
        (token_hash,)
    )
    audit(cur, 'logout', True, user_id=user_id, ip=get_client_ip(event))
    conn.commit()
    return json_response(200, {'ok': True})


def action_me(event: dict, cur, conn) -> dict:
    user_id, err = auth_required(cur, event)
    if err:
        return err
    cur.execute(
        f"SELECT id, email, name, role, is_email_verified, last_login_at, created_at "
        f"FROM {S}users WHERE id = %s",
        (user_id,)
    )
    r = cur.fetchone()
    if not r:
        return json_response(404, {'error': 'Не найдено'})
    return json_response(200, {
        'user': {
            'id': r[0], 'email': r[1], 'name': r[2], 'role': r[3],
            'is_email_verified': r[4],
            'last_login_at': str(r[5]) if r[5] else None,
            'created_at': str(r[6]),
        }
    })


def action_change_password(event: dict, cur, conn) -> dict:
    user_id, err = auth_required(cur, event)
    if err:
        return err
    body = json.loads(event.get('body') or '{}')
    old = body.get('old_password') or ''
    new = body.get('new_password') or ''
    if not (PASSWORD_MIN <= len(new) <= PASSWORD_MAX):
        return json_response(400, {'error': f'Пароль должен быть от {PASSWORD_MIN} до {PASSWORD_MAX} символов'})
    cur.execute(f"SELECT password_hash FROM {S}users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row or not verify_password(old, row[0]):
        return json_response(401, {'error': 'Старый пароль неверен'})
    cur.execute(
        f"UPDATE {S}users SET password_hash = %s, updated_at = NOW() WHERE id = %s",
        (hash_password(new), user_id)
    )
    # Отзываем все сессии кроме текущей
    headers = event.get('headers') or {}
    token = (headers.get('X-Auth-Token') or headers.get('x-auth-token') or '').strip()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    cur.execute(
        f"UPDATE {S}user_sessions SET revoked_at = NOW() "
        f"WHERE user_id = %s AND token_hash <> %s AND revoked_at IS NULL",
        (user_id, token_hash)
    )
    audit(cur, 'change_password', True, user_id=user_id, ip=get_client_ip(event))
    conn.commit()
    return json_response(200, {'ok': True})


# ============= ENTRYPOINT =============

def handler(event, context):
    """Авторизация: register/login/logout/me/change-password."""
    method = event.get('httpMethod') or 'GET'
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    qs = event.get('queryStringParameters') or {}
    action = (qs.get('action') or '').lower().strip()

    if not action:
        return json_response(400, {'error': 'Не указано action'})

    conn = get_conn()
    cur = conn.cursor()
    try:
        cleanup_old_data(cur)
        conn.commit()

        if action == 'register' and method == 'POST':
            return action_register(event, cur, conn)
        if action == 'login' and method == 'POST':
            return action_login(event, cur, conn)
        if action == 'logout' and method == 'POST':
            return action_logout(event, cur, conn)
        if action == 'me' and method == 'GET':
            return action_me(event, cur, conn)
        if action == 'change-password' and method == 'POST':
            return action_change_password(event, cur, conn)

        return json_response(404, {'error': 'Неизвестное действие'})
    except json.JSONDecodeError:
        return json_response(400, {'error': 'Некорректный JSON'})
    except Exception as e:
        conn.rollback()
        return json_response(500, {'error': 'Внутренняя ошибка'})
    finally:
        cur.close()
        conn.close()
