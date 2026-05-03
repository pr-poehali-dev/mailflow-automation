"""API для управления контактами MAIL-KA: список, создание, удаление, импорт CSV.
Все запросы требуют авторизации (X-Auth-Token). Данные изолированы по user_id."""
import json
import os
import hashlib
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

# Разрешённые домены — белый список вместо *
ALLOWED_ORIGINS = {
    "https://mail-ka.ru",
    "https://www.mail-ka.ru",
    "https://preview--mailflow-automation.poehali.dev",
    "https://mailflow-automation.poehali.dev",
    "http://localhost:5173",
    "http://localhost:3000",
}


def cors_headers(event: dict) -> dict:
    """Возвращает CORS-заголовки с проверкой Origin по белому списку."""
    headers = event.get("headers") or {}
    origin = headers.get("Origin") or headers.get("origin") or ""
    allow_origin = origin if origin in ALLOWED_ORIGINS else "https://mail-ka.ru"
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-CSRF-Token",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    }


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict, event: dict) -> dict:
    return {"statusCode": status, "headers": cors_headers(event), "body": json.dumps(body)}


def require_user(event: dict, conn) -> tuple:
    """Проверка X-Auth-Token. Возвращает (user_id, None) или (None, error_response)."""
    headers = event.get("headers") or {}
    token = (
        headers.get("X-Auth-Token")
        or headers.get("x-auth-token")
        or ""
    ).strip()
    if not token or len(token) < 16:
        return None, resp(401, {"error": "Требуется авторизация"}, event)

    token_hash = hashlib.sha256(token.encode()).hexdigest()
    cur = conn.cursor()
    cur.execute(
        f"SELECT us.user_id FROM {SCHEMA}.user_sessions us "
        f"JOIN {SCHEMA}.users u ON u.id = us.user_id "
        f"WHERE us.token_hash = %s AND us.revoked_at IS NULL "
        f"AND us.expires_at > NOW() AND u.is_active = TRUE",
        (token_hash,),
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None, resp(401, {"error": "Сессия истекла или недействительна"}, event)
    return row[0], None


def handler(event: dict, context) -> dict:
    """Контакты пользователя: список, создание, удаление, импорт. Все операции требуют авторизации."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(event), "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    conn = get_conn()
    user_id, err = require_user(event, conn)
    if err:
        conn.close()
        return err

    try:
        # DELETE /contacts/{id}
        if method == "DELETE" and path.count("/") >= 2:
            parts = path.rstrip("/").split("/")
            contact_id = parts[-1]
            if not contact_id.isdigit():
                return resp(400, {"error": "invalid id"}, event)
            cur = conn.cursor()
            # Удаляем только если контакт принадлежит этому пользователю (защита от IDOR)
            cur.execute(
                f"DELETE FROM {SCHEMA}.contacts WHERE id = %s AND user_id = %s",
                (int(contact_id), user_id),
            )
            deleted = cur.rowcount
            conn.commit()
            cur.close()
            if deleted == 0:
                return resp(404, {"error": "Контакт не найден"}, event)
            return resp(200, {"ok": True}, event)

        # POST /contacts — создать или импортировать batch
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            cur = conn.cursor()

            # Источник и текст согласия — обязательная фиксация для 152-ФЗ
            source = (body.get("consent_source") or "manual")[:50]
            consent_text = (body.get("consent_text") or "")[:1000] or None
            req_headers = event.get("headers") or {}
            ip = (req_headers.get("X-Forwarded-For") or req_headers.get("x-forwarded-for") or "").split(",")[0].strip()[:64] or None

            # Batch import — массовая загрузка собственной базы (consent_status = 'imported')
            if "contacts" in body:
                inserted = 0
                items = body["contacts"]
                if not isinstance(items, list):
                    return resp(400, {"error": "contacts must be a list"}, event)
                if len(items) > 5000:
                    return resp(400, {"error": "Слишком много контактов за раз (макс 5000)"}, event)
                for c in items:
                    try:
                        email = (c.get("email") or "").strip().lower()
                        if not email or "@" not in email:
                            continue
                        cur.execute(
                            f"INSERT INTO {SCHEMA}.contacts "
                            f"(user_id, name, email, segment, status, "
                            f"consent_status, consent_source, consent_at, consent_ip, consent_text) "
                            f"VALUES (%s, %s, %s, %s, %s, 'imported', %s, NOW(), %s, %s) "
                            f"ON CONFLICT (user_id, email) DO NOTHING",
                            (
                                user_id,
                                (c.get("name") or "")[:255],
                                email[:255],
                                (c.get("segment") or "Новый")[:100],
                                (c.get("status") or "active")[:50],
                                source, ip, consent_text,
                            ),
                        )
                        inserted += cur.rowcount
                    except Exception:
                        conn.rollback()
                conn.commit()
                cur.close()
                return resp(200, {"ok": True, "inserted": inserted,
                                  "warning": "Импортированные контакты должны иметь подтверждённое согласие на рассылку (152-ФЗ ст. 9, 38-ФЗ ст. 18). Ответственность лежит на вас."}, event)

            # Single contact
            name = (body.get("name") or "")[:255]
            email = (body.get("email") or "").strip().lower()[:255]
            segment = (body.get("segment") or "Новый")[:100]
            status = (body.get("status") or "active")[:50]
            consent_status = (body.get("consent_status") or "manual")[:20]
            if not email or "@" not in email:
                return resp(400, {"error": "email required"}, event)
            try:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.contacts "
                    f"(user_id, name, email, segment, status, "
                    f"consent_status, consent_source, consent_at, consent_ip, consent_text) "
                    f"VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s) RETURNING id",
                    (user_id, name, email, segment, status,
                     consent_status, source, ip, consent_text),
                )
                new_id = cur.fetchone()[0]
                # Лог согласия контакта (для 152-ФЗ)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.consent_log "
                    f"(user_id, contact_id, action, document, source, ip_address, details) "
                    f"VALUES (%s, %s, 'accept', 'subscribe', %s, %s, %s)",
                    (user_id, new_id, source, ip, consent_text),
                )
                conn.commit()
            except psycopg2.errors.UniqueViolation:
                conn.rollback()
                cur.close()
                return resp(409, {"error": "email уже существует"}, event)
            cur.close()
            return resp(201, {"ok": True, "id": new_id}, event)

        # GET /contacts — только свои контакты
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, email, segment, status, created_at, "
            f"consent_status, consent_source, consent_at, unsubscribed_at "
            f"FROM {SCHEMA}.contacts WHERE user_id = %s "
            f"ORDER BY created_at DESC LIMIT 5000",
            (user_id,),
        )
        rows = cur.fetchall()
        cur.close()

        contacts = [
            {
                "id": r[0],
                "name": r[1],
                "email": r[2],
                "segment": r[3],
                "status": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
                "consent_status": r[6],
                "consent_source": r[7],
                "consent_at": r[8].isoformat() if r[8] else None,
                "unsubscribed_at": r[9].isoformat() if r[9] else None,
            }
            for r in rows
        ]
        return resp(200, {"contacts": contacts, "total": len(contacts)}, event)

    finally:
        conn.close()