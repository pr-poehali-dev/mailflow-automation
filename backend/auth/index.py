"""
Auth: register / login / logout / me / change-password. v2
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
from urllib.request import Request, urlopen

import psycopg2


SEND_EMAIL_URL = "https://functions.poehali.dev/9861b492-d3a2-48ef-9407-3b07e1d55181"
APP_BASE_URL = os.environ.get('APP_BASE_URL', 'https://preview--mail-ka.poehali.dev')
VERIFICATION_TTL_HOURS = 24
RESEND_COOLDOWN_SECONDS = 60


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
    'verify_resend':  (5,  3600),  # 5 повторных писем / час / user
    'verify_check':   (20, 300),   # 20 попыток ввода токена / 5 мин / IP
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


# ============= EMAIL VERIFICATION =============

def send_verification_email(to_email: str, name: str, token: str) -> bool:
    """Отправляем письмо со ссылкой подтверждения. Молча игнорируем ошибки сети/SMTP."""
    link = f"{APP_BASE_URL.rstrip('/')}/?verify_email={token}"
    display_name = (name or '').strip() or 'друг'
    subject = 'Подтвердите email — MAIL-KA'
    text = (
        f'Привет, {display_name}!\n\n'
        f'Вы зарегистрировались в MAIL-KA. Чтобы активировать аккаунт и получить доступ '
        f'ко всем разделам, подтвердите email — просто перейдите по ссылке ниже:\n\n'
        f'{link}\n\n'
        f'Ссылка действует 24 часа. Если вы не регистрировались — просто проигнорируйте письмо.\n\n'
        f'— Команда MAIL-KA'
    )
    payload = json.dumps({
        'to': to_email,
        'subject': subject,
        'text': text,
        'from_name': 'MAIL-KA'
    }).encode('utf-8')

    sys_token = os.environ.get('SYSTEM_EMAIL_TOKEN', '')
    headers = {'Content-Type': 'application/json'}
    if sys_token:
        headers['X-System-Token'] = sys_token

    request = Request(SEND_EMAIL_URL, data=payload, headers=headers, method='POST')
    try:
        with urlopen(request, timeout=10) as response:
            response.read()
        return True
    except Exception:
        return False


def create_and_send_verification(cur, user_id: int, email: str, name: str) -> bool:
    """Генерируем токен, сохраняем хэш в БД, шлём письмо."""
    token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires = datetime.utcnow() + timedelta(hours=VERIFICATION_TTL_HOURS)

    # Инвалидируем старые неиспользованные токены этого пользователя
    cur.execute(
        f"UPDATE {S}email_verifications SET used_at = NOW() "
        f"WHERE user_id = %s AND used_at IS NULL",
        (user_id,)
    )
    cur.execute(
        f"INSERT INTO {S}email_verifications (user_id, token_hash, email, expires_at) "
        f"VALUES (%s, %s, %s, %s)",
        (user_id, token_hash, email, expires.isoformat())
    )
    cur.execute(
        f"UPDATE {S}users SET verification_sent_at = NOW() WHERE id = %s",
        (user_id,)
    )
    return send_verification_email(email, name, token)


# ============= HANDLERS =============

def action_register(event: dict, cur, conn) -> dict:
    body = json.loads(event.get('body') or '{}')
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    name = (body.get('name') or '').strip()
    accept_offer = bool(body.get('accept_offer'))
    accept_privacy = bool(body.get('accept_privacy'))
    accept_marketing = bool(body.get('accept_marketing', False))
    docs_version = (body.get('docs_version') or '1.0').strip()[:20]
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

    # Обязательные согласия (152-ФЗ + договор-оферта)
    if not accept_offer:
        return json_response(400, {'error': 'Необходимо принять договор-оферту'})
    if not accept_privacy:
        return json_response(400, {'error': 'Необходимо согласие на обработку персональных данных (152-ФЗ)'})

    cur.execute(f"SELECT 1 FROM {S}users WHERE email_lower = %s", (email,))
    if cur.fetchone():
        audit(cur, 'register', False, email=email, ip=ip, ua=ua, details='email_taken')
        conn.commit()
        return json_response(409, {'error': 'Пользователь с таким email уже существует'})

    pwd_hash = hash_password(password)
    cur.execute(
        f"INSERT INTO {S}users (email, email_lower, password_hash, name, last_login_ip, last_login_at, "
        f"accepted_offer_at, accepted_privacy_at, accepted_marketing_at, "
        f"consent_ip, consent_user_agent, consent_documents_version) "
        f"VALUES (%s, %s, %s, %s, %s, NOW(), NOW(), NOW(), %s, %s, %s, %s) "
        f"RETURNING id, email, name, role, created_at",
        (email, email, pwd_hash, name, ip,
         datetime.utcnow().isoformat() if accept_marketing else None,
         ip, (ua or '')[:500], docs_version)
    )
    user = cur.fetchone()
    user_id = user[0]

    # Лог согласий (для аудита 152-ФЗ)
    for doc in ('offer', 'privacy'):
        cur.execute(
            f"INSERT INTO {S}consent_log (user_id, action, document, document_version, source, ip_address, user_agent) "
            f"VALUES (%s, 'accept', %s, %s, 'register', %s, %s)",
            (user_id, doc, docs_version, ip, (ua or '')[:500])
        )
    if accept_marketing:
        cur.execute(
            f"INSERT INTO {S}consent_log (user_id, action, document, document_version, source, ip_address, user_agent) "
            f"VALUES (%s, 'accept', 'marketing', %s, 'register', %s, %s)",
            (user_id, docs_version, ip, (ua or '')[:500])
        )

    token, token_hash = make_session_token(user_id)
    csrf = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(days=SESSION_TTL_DAYS)
    cur.execute(
        f"INSERT INTO {S}user_sessions (user_id, token_hash, csrf_token, user_agent, ip_address, expires_at) "
        f"VALUES (%s, %s, %s, %s, %s, %s)",
        (user_id, token_hash, csrf, ua, ip, expires.isoformat())
    )
    audit(cur, 'register', True, user_id=user_id, email=email, ip=ip, ua=ua)

    # Отправляем письмо с подтверждением email (не критично, ошибки игнорируем)
    try:
        create_and_send_verification(cur, user_id, email, name)
    except Exception:
        pass

    conn.commit()

    return json_response(200, {
        'token': token,
        'csrf_token': csrf,
        'user': {
            'id': user[0], 'email': user[1], 'name': user[2],
            'role': user[3], 'is_email_verified': False, 'created_at': str(user[4])
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


def action_verify_email(event: dict, cur, conn) -> dict:
    """Подтверждение email по токену из письма. Не требует авторизации."""
    body = json.loads(event.get('body') or '{}')
    token = (body.get('token') or '').strip()
    ip = get_client_ip(event)

    if not rate_limit_check(cur, ip or 'unknown', 'verify_check'):
        conn.commit()
        return json_response(429, {'error': 'Слишком много попыток. Попробуйте позже.'})

    if not token or len(token) < 32 or len(token) > 128:
        return json_response(400, {'error': 'Некорректный токен'})

    token_hash = hashlib.sha256(token.encode()).hexdigest()
    cur.execute(
        f"SELECT id, user_id, expires_at, used_at FROM {S}email_verifications "
        f"WHERE token_hash = %s",
        (token_hash,)
    )
    row = cur.fetchone()
    if not row:
        audit(cur, 'verify_email', False, ip=ip, details='token_not_found')
        conn.commit()
        return json_response(400, {'error': 'Ссылка недействительна'})

    ver_id, user_id, expires_at, used_at = row
    if used_at is not None:
        audit(cur, 'verify_email', False, user_id=user_id, ip=ip, details='already_used')
        conn.commit()
        return json_response(400, {'error': 'Ссылка уже использована'})
    if expires_at < datetime.utcnow():
        audit(cur, 'verify_email', False, user_id=user_id, ip=ip, details='expired')
        conn.commit()
        return json_response(400, {'error': 'Ссылка истекла. Запросите письмо повторно.'})

    cur.execute(
        f"UPDATE {S}email_verifications SET used_at = NOW() WHERE id = %s",
        (ver_id,)
    )
    cur.execute(
        f"UPDATE {S}users SET is_email_verified = TRUE, updated_at = NOW() WHERE id = %s",
        (user_id,)
    )
    audit(cur, 'verify_email', True, user_id=user_id, ip=ip)
    conn.commit()
    return json_response(200, {'ok': True})


def action_resend_verification(event: dict, cur, conn) -> dict:
    """Повторная отправка письма с подтверждением (только авторизованным)."""
    user_id, err = auth_required(cur, event)
    if err:
        return err
    ip = get_client_ip(event)

    if not rate_limit_check(cur, str(user_id), 'verify_resend'):
        conn.commit()
        return json_response(429, {'error': 'Слишком часто. Подождите минуту.'})

    cur.execute(
        f"SELECT email, name, is_email_verified, verification_sent_at "
        f"FROM {S}users WHERE id = %s",
        (user_id,)
    )
    row = cur.fetchone()
    if not row:
        return json_response(404, {'error': 'Пользователь не найден'})

    email, name, is_verified, sent_at = row
    if is_verified:
        return json_response(400, {'error': 'Email уже подтверждён'})

    # Cooldown между отправками
    if sent_at and (datetime.utcnow() - sent_at).total_seconds() < RESEND_COOLDOWN_SECONDS:
        wait = RESEND_COOLDOWN_SECONDS - int((datetime.utcnow() - sent_at).total_seconds())
        return json_response(429, {'error': f'Подождите {wait} сек перед повторной отправкой'})

    sent = create_and_send_verification(cur, user_id, email, name)
    audit(cur, 'verify_resend', sent, user_id=user_id, email=email, ip=ip)
    conn.commit()

    if not sent:
        return json_response(500, {'error': 'Не удалось отправить письмо. Проверьте настройки SMTP.'})
    return json_response(200, {'ok': True})


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


def action_security_stats(event: dict, cur, conn) -> dict:
    """Сводная статистика безопасности — только для админов."""
    user_id, err = auth_required(cur, event)
    if err:
        return err

    # Проверяем роль
    cur.execute(f"SELECT role FROM {S}users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row or row[0] != 'admin':
        return json_response(403, {'error': 'Доступ только для администраторов'})

    qs = event.get('queryStringParameters') or {}
    period = (qs.get('period') or '24h').lower()
    intervals = {'24h': '24 hours', '7d': '7 days', '30d': '30 days'}
    interval = intervals.get(period, '24 hours')

    # Сводные счётчики
    cur.execute(
        f"SELECT event_type, success, COUNT(*) FROM {S}auth_audit_log "
        f"WHERE created_at > NOW() - INTERVAL '{interval}' "
        f"GROUP BY event_type, success"
    )
    rows = cur.fetchall()
    counters = {
        'login_success': 0, 'login_failed': 0,
        'register_success': 0, 'register_failed': 0,
        'logout': 0, 'verify_success': 0, 'verify_failed': 0,
        'password_changes': 0,
    }
    for ev_type, success, cnt in rows:
        if ev_type == 'login':
            counters['login_success' if success else 'login_failed'] += cnt
        elif ev_type == 'register':
            counters['register_success' if success else 'register_failed'] += cnt
        elif ev_type == 'logout':
            counters['logout'] += cnt
        elif ev_type == 'verify_email':
            counters['verify_success' if success else 'verify_failed'] += cnt
        elif ev_type == 'change_password':
            counters['password_changes'] += cnt

    # Заблокированные пользователи (locked_until в будущем)
    cur.execute(
        f"SELECT id, email, failed_attempts, locked_until "
        f"FROM {S}users WHERE locked_until IS NOT NULL AND locked_until > NOW() "
        f"ORDER BY locked_until DESC LIMIT 20"
    )
    locked = [
        {'id': r[0], 'email': r[1], 'failed_attempts': r[2],
         'locked_until': str(r[3])}
        for r in cur.fetchall()
    ]

    # Топ IP по неудачным попыткам входа
    cur.execute(
        f"SELECT ip_address, COUNT(*) as attempts, MAX(created_at) as last_seen "
        f"FROM {S}auth_audit_log "
        f"WHERE event_type IN ('login','register') AND success = FALSE "
        f"AND created_at > NOW() - INTERVAL '{interval}' AND ip_address IS NOT NULL "
        f"GROUP BY ip_address HAVING COUNT(*) >= 3 "
        f"ORDER BY attempts DESC LIMIT 15"
    )
    suspicious_ips = [
        {'ip': r[0], 'attempts': r[1], 'last_seen': str(r[2])}
        for r in cur.fetchall()
    ]

    # Топ email-ов по неудачным попыткам
    cur.execute(
        f"SELECT email, COUNT(*) as attempts, MAX(created_at) as last_seen "
        f"FROM {S}auth_audit_log "
        f"WHERE event_type = 'login' AND success = FALSE "
        f"AND created_at > NOW() - INTERVAL '{interval}' AND email IS NOT NULL "
        f"GROUP BY email HAVING COUNT(*) >= 3 "
        f"ORDER BY attempts DESC LIMIT 15"
    )
    targeted_emails = [
        {'email': r[0], 'attempts': r[1], 'last_seen': str(r[2])}
        for r in cur.fetchall()
    ]

    # Активные rate-limit бакеты (приближается к лимиту)
    cur.execute(
        f"SELECT bucket_key, action, COUNT(*) as hits "
        f"FROM {S}rate_limits "
        f"WHERE created_at > NOW() - INTERVAL '1 hour' "
        f"GROUP BY bucket_key, action "
        f"ORDER BY hits DESC LIMIT 20"
    )
    active_limits = [
        {'bucket': r[0], 'action': r[1], 'hits': r[2]}
        for r in cur.fetchall()
    ]

    # Последние 50 событий
    cur.execute(
        f"SELECT event_type, email, ip_address, success, details, created_at "
        f"FROM {S}auth_audit_log "
        f"ORDER BY created_at DESC LIMIT 50"
    )
    recent_events = [
        {'event': r[0], 'email': r[1], 'ip': r[2],
         'success': r[3], 'details': r[4], 'created_at': str(r[5])}
        for r in cur.fetchall()
    ]

    # Общая инфа по юзерам
    cur.execute(f"SELECT COUNT(*) FROM {S}users")
    total_users = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM {S}users WHERE is_email_verified = TRUE")
    verified_users = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM {S}users WHERE last_login_at > NOW() - INTERVAL '{interval}'")
    active_users = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM {S}user_sessions WHERE revoked_at IS NULL AND expires_at > NOW()")
    active_sessions = cur.fetchone()[0]

    return json_response(200, {
        'period': period,
        'counters': counters,
        'users': {
            'total': total_users,
            'verified': verified_users,
            'active': active_users,
            'active_sessions': active_sessions,
        },
        'locked_accounts': locked,
        'suspicious_ips': suspicious_ips,
        'targeted_emails': targeted_emails,
        'active_rate_limits': active_limits,
        'recent_events': recent_events,
    })


def action_unlock_user(event: dict, cur, conn) -> dict:
    """Сброс блокировки пользователя — только для админов."""
    user_id, err = auth_required(cur, event)
    if err:
        return err
    cur.execute(f"SELECT role FROM {S}users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row or row[0] != 'admin':
        return json_response(403, {'error': 'Доступ только для администраторов'})

    body = json.loads(event.get('body') or '{}')
    target_id = body.get('user_id')
    if not isinstance(target_id, int):
        return json_response(400, {'error': 'user_id обязателен'})

    cur.execute(
        f"UPDATE {S}users SET locked_until = NULL, failed_attempts = 0, updated_at = NOW() "
        f"WHERE id = %s",
        (target_id,)
    )
    audit(cur, 'admin_unlock', True, user_id=user_id, ip=get_client_ip(event),
          details=f'unlocked user_id={target_id}')
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
        if action == 'verify-email' and method == 'POST':
            return action_verify_email(event, cur, conn)
        if action == 'resend-verification' and method == 'POST':
            return action_resend_verification(event, cur, conn)
        if action == 'security-stats' and method == 'GET':
            return action_security_stats(event, cur, conn)
        if action == 'unlock-user' and method == 'POST':
            return action_unlock_user(event, cur, conn)

        return json_response(404, {'error': 'Неизвестное действие'})
    except json.JSONDecodeError:
        return json_response(400, {'error': 'Некорректный JSON'})
    except Exception as e:
        conn.rollback()
        import traceback
        tb = traceback.format_exc()
        # Запишем ошибку в audit_log для дебага
        try:
            cur2 = conn.cursor()
            cur2.execute(
                f"INSERT INTO {S}auth_audit_log (event_type, success, details) VALUES (%s, %s, %s)",
                ('debug_500', False, f"action={action} err={e!r} tb={tb[-1500:]}")
            )
            conn.commit()
            cur2.close()
        except Exception:
            pass
        return json_response(500, {'error': 'Внутренняя ошибка'})
    finally:
        cur.close()
        conn.close()