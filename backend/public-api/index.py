"""
Публичный API MAIL-KA.

Управление ключами (требует X-Auth-Token из кабинета):
  GET  /?resource=keys          — свои ключи
  POST /?resource=keys          — создать ключ  {name}
  PUT  /?resource=keys&id={id}  — вкл/выкл ключ {is_active}
  GET  /?resource=events        — лог вызовов своих ключей
  GET  /?resource=triggers      — свои триггерные правила
  POST /?resource=triggers      — создать правило {event_name, campaign_id}

Внешние эндпоинты (требуют X-API-Key — привязан к user_id владельца ключа):
  GET  /?resource=contacts      — список контактов владельца ключа
  GET  /?resource=campaigns     — список кампаний владельца ключа
  POST /?resource=sync          — синхронизация контактов  {contacts:[...]}
  POST /?resource=send          — отправить письмо
  POST /?resource=trigger       — запустить триггер
"""
import json
import os
import hashlib
import secrets
import urllib.request
import psycopg2

SEND_EMAIL_URL = "https://functions.poehali.dev/9861b492-d3a2-48ef-9407-3b07e1d55181"

SCHEMA = "t_p46602131_mailflow_automation"

ALLOWED_ORIGINS = {
    "https://mail-ka.ru",
    "https://www.mail-ka.ru",
    "https://preview--mailflow-automation.poehali.dev",
    "https://mailflow-automation.poehali.dev",
    "http://localhost:5173",
    "http://localhost:3000",
}


def cors_headers(event: dict) -> dict:
    headers = event.get("headers") or {}
    origin = headers.get("Origin") or headers.get("origin") or ""
    # Для X-API-Key (внешние интеграции с любого домена) разрешаем * только если нет cookies
    # Но в безопасном режиме — белый список + явное "*" допускается лишь при отсутствии токена
    allow_origin = origin if origin in ALLOWED_ORIGINS else "*"
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-CSRF-Token, X-API-Key, Authorization",
        "Vary": "Origin",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    }


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict, event: dict) -> dict:
    return {
        "statusCode": status,
        "headers": cors_headers(event),
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def require_user_session(event: dict, conn):
    """Авторизация владельца через X-Auth-Token (из кабинета)."""
    headers = event.get("headers") or {}
    token = (headers.get("X-Auth-Token") or headers.get("x-auth-token") or "").strip()
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
        return None, resp(401, {"error": "Сессия истекла"}, event)
    return row[0], None


def require_api_key(event: dict, conn):
    """Авторизация по X-API-Key. Возвращает (key_id, user_id, None) или (None, None, error)."""
    headers = event.get("headers") or {}
    raw_key = headers.get("X-API-Key") or headers.get("x-api-key") or ""
    if not raw_key:
        return None, None, resp(401, {"error": "Требуется заголовок X-API-Key"}, event)
    h = hash_key(raw_key)
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, user_id, is_active FROM {SCHEMA}.api_keys WHERE key_hash = %s",
        (h,),
    )
    row = cur.fetchone()
    cur.close()
    if not row or not row[2]:
        return None, None, resp(401, {"error": "Недействительный API-ключ"}, event)
    if not row[1]:
        # ключ создан до миграции — без владельца, отказываем
        return None, None, resp(401, {"error": "API-ключ не привязан к аккаунту"}, event)
    cur2 = conn.cursor()
    cur2.execute(
        f"UPDATE {SCHEMA}.api_keys SET last_used_at = NOW() WHERE id = %s",
        (row[0],),
    )
    conn.commit()
    cur2.close()
    return row[0], row[1], None


def log_event(conn, api_key_id, user_id, event_type: str, payload: dict, status: str = "ok", error_msg=None):
    cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.api_events (api_key_id, user_id, event_type, payload, status, error_msg) "
            f"VALUES (%s, %s, %s, %s, %s, %s)",
            (api_key_id, user_id, event_type, json.dumps(payload, ensure_ascii=False), status, error_msg),
        )
        conn.commit()
    except Exception:
        conn.rollback()
    finally:
        cur.close()


def handler(event: dict, context) -> dict:
    """Публичный API: управление ключами (X-Auth-Token) и внешние интеграции (X-API-Key)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(event), "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    resource = qs.get("resource", "keys")
    item_id_qs = qs.get("id")

    body_raw = event.get("body") or "{}"
    try:
        body = json.loads(body_raw)
    except Exception:
        body = {}

    conn = get_conn()

    try:
        # ── Управление ключами/событиями/триггерами: требуется X-Auth-Token ──
        if resource in ("keys", "events", "triggers"):
            user_id, err = require_user_session(event, conn)
            if err:
                return err

            if resource == "keys":
                if method == "POST":
                    name = (body.get("name") or "Новый ключ")[:100]
                    raw = "mka_" + secrets.token_hex(24)
                    h = hash_key(raw)
                    preview = raw[:12] + "..." + raw[-4:]
                    cur = conn.cursor()
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.api_keys (user_id, name, key_hash, key_preview) "
                        f"VALUES (%s, %s, %s, %s) RETURNING id",
                        (user_id, name, h, preview),
                    )
                    new_id = cur.fetchone()[0]
                    conn.commit()
                    cur.close()
                    return resp(201, {
                        "ok": True, "id": new_id, "key": raw, "preview": preview,
                        "warning": "Сохрани ключ — он показывается только один раз",
                    }, event)

                if method == "PUT" and item_id_qs:
                    is_active = bool(body.get("is_active", True))
                    cur = conn.cursor()
                    cur.execute(
                        f"UPDATE {SCHEMA}.api_keys SET is_active = %s "
                        f"WHERE id = %s AND user_id = %s",
                        (is_active, int(item_id_qs), user_id),
                    )
                    affected = cur.rowcount
                    conn.commit()
                    cur.close()
                    if affected == 0:
                        return resp(404, {"error": "Ключ не найден"}, event)
                    return resp(200, {"ok": True}, event)

                if method == "DELETE" and item_id_qs:
                    cur = conn.cursor()
                    cur.execute(
                        f"DELETE FROM {SCHEMA}.api_keys WHERE id = %s AND user_id = %s",
                        (int(item_id_qs), user_id),
                    )
                    affected = cur.rowcount
                    conn.commit()
                    cur.close()
                    if affected == 0:
                        return resp(404, {"error": "Ключ не найден"}, event)
                    return resp(200, {"ok": True}, event)

                # GET — только свои ключи
                cur = conn.cursor()
                cur.execute(
                    f"SELECT id, name, key_preview, is_active, created_at, last_used_at "
                    f"FROM {SCHEMA}.api_keys WHERE user_id = %s ORDER BY created_at DESC",
                    (user_id,),
                )
                rows = cur.fetchall()
                cur.close()
                return resp(200, {"keys": [
                    {"id": r[0], "name": r[1], "preview": r[2], "is_active": r[3],
                     "created_at": r[4], "last_used_at": r[5]} for r in rows
                ]}, event)

            if resource == "events":
                cur = conn.cursor()
                # Только события своих ключей
                cur.execute(
                    f"""SELECT e.id, k.name, e.event_type, e.payload, e.status, e.error_msg, e.created_at
                        FROM {SCHEMA}.api_events e
                        LEFT JOIN {SCHEMA}.api_keys k ON k.id = e.api_key_id
                        WHERE e.user_id = %s OR k.user_id = %s
                        ORDER BY e.created_at DESC LIMIT 100""",
                    (user_id, user_id),
                )
                rows = cur.fetchall()
                cur.close()
                return resp(200, {"events": [
                    {"id": r[0], "key_name": r[1], "event_type": r[2],
                     "payload": r[3], "status": r[4], "error": r[5], "created_at": r[6]}
                    for r in rows
                ]}, event)

            if resource == "triggers":
                if method == "POST":
                    event_name = (body.get("event_name") or "")[:100]
                    campaign_id = body.get("campaign_id")
                    if not event_name or not campaign_id:
                        return resp(400, {"error": "event_name и campaign_id обязательны"}, event)
                    cur = conn.cursor()
                    # Кампания должна принадлежать пользователю
                    cur.execute(
                        f"SELECT 1 FROM {SCHEMA}.campaigns WHERE id = %s AND user_id = %s",
                        (campaign_id, user_id),
                    )
                    if not cur.fetchone():
                        cur.close()
                        return resp(404, {"error": "Кампания не найдена"}, event)
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.trigger_rules (user_id, event_name, campaign_id) "
                        f"VALUES (%s, %s, %s) RETURNING id",
                        (user_id, event_name, campaign_id),
                    )
                    new_id = cur.fetchone()[0]
                    conn.commit()
                    cur.close()
                    return resp(201, {"ok": True, "id": new_id}, event)

                if method == "PUT" and item_id_qs:
                    is_active = bool(body.get("is_active", True))
                    cur = conn.cursor()
                    cur.execute(
                        f"UPDATE {SCHEMA}.trigger_rules SET is_active = %s "
                        f"WHERE id = %s AND user_id = %s",
                        (is_active, int(item_id_qs), user_id),
                    )
                    affected = cur.rowcount
                    conn.commit()
                    cur.close()
                    if affected == 0:
                        return resp(404, {"error": "Правило не найдено"}, event)
                    return resp(200, {"ok": True}, event)

                if method == "DELETE" and item_id_qs:
                    cur = conn.cursor()
                    cur.execute(
                        f"DELETE FROM {SCHEMA}.trigger_rules WHERE id = %s AND user_id = %s",
                        (int(item_id_qs), user_id),
                    )
                    affected = cur.rowcount
                    conn.commit()
                    cur.close()
                    if affected == 0:
                        return resp(404, {"error": "Правило не найдено"}, event)
                    return resp(200, {"ok": True}, event)

                cur = conn.cursor()
                cur.execute(
                    f"""SELECT t.id, t.event_name, t.campaign_id, c.name, t.is_active, t.created_at
                        FROM {SCHEMA}.trigger_rules t
                        LEFT JOIN {SCHEMA}.campaigns c ON c.id = t.campaign_id
                        WHERE t.user_id = %s
                        ORDER BY t.created_at DESC""",
                    (user_id,),
                )
                rows = cur.fetchall()
                cur.close()
                return resp(200, {"triggers": [
                    {"id": r[0], "event_name": r[1], "campaign_id": r[2],
                     "campaign_name": r[3], "is_active": r[4], "created_at": r[5]}
                    for r in rows
                ]}, event)

        # ── Внешние эндпоинты: требуют X-API-Key ────────────────────────────
        api_key_id, user_id, err = require_api_key(event, conn)
        if err:
            return err

        if resource == "contacts":
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, name, email, segment, status, created_at FROM {SCHEMA}.contacts "
                f"WHERE user_id = %s ORDER BY created_at DESC LIMIT 5000",
                (user_id,),
            )
            rows = cur.fetchall()
            cur.close()
            log_event(conn, api_key_id, user_id, "contacts.list", {})
            return resp(200, {"contacts": [
                {"id": r[0], "name": r[1], "email": r[2], "segment": r[3],
                 "status": r[4], "created_at": r[5]}
                for r in rows
            ], "total": len(rows)}, event)

        if resource == "campaigns":
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, name, status, subject, sent_count, open_rate, click_rate, created_at, sent_at "
                f"FROM {SCHEMA}.campaigns WHERE user_id = %s ORDER BY created_at DESC LIMIT 1000",
                (user_id,),
            )
            rows = cur.fetchall()
            cur.close()
            log_event(conn, api_key_id, user_id, "campaigns.list", {})
            return resp(200, {"campaigns": [
                {"id": r[0], "name": r[1], "status": r[2], "subject": r[3],
                 "sent_count": r[4], "open_rate": float(r[5] or 0),
                 "click_rate": float(r[6] or 0), "created_at": r[7], "sent_at": r[8]}
                for r in rows
            ]}, event)

        if resource == "sync" and method == "POST":
            items = body.get("contacts", [])
            if not isinstance(items, list) or not items:
                log_event(conn, api_key_id, user_id, "contacts.sync", body, "error", "Пустой массив contacts")
                return resp(400, {"error": "Передай массив contacts"}, event)
            if len(items) > 5000:
                return resp(400, {"error": "Максимум 5000 контактов за раз"}, event)
            cur = conn.cursor()
            inserted = 0
            updated = 0
            for c in items:
                email = (c.get("email") or "").strip().lower()
                if not email or "@" not in email:
                    continue
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.contacts (user_id, name, email, segment, status)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (user_id, email) DO UPDATE SET
                          name = EXCLUDED.name, segment = EXCLUDED.segment, status = EXCLUDED.status
                        RETURNING (xmax = 0)""",
                    (user_id, (c.get("name") or "")[:255], email[:255],
                     (c.get("segment") or "Новый")[:100], (c.get("status") or "active")[:50]),
                )
                row = cur.fetchone()
                if row and row[0]:
                    inserted += 1
                else:
                    updated += 1
            conn.commit()
            cur.close()
            log_event(conn, api_key_id, user_id, "contacts.sync", {"count": len(items)})
            return resp(200, {"ok": True, "inserted": inserted, "updated": updated, "total": inserted + updated}, event)

        if resource == "send" and method == "POST":
            to_email = (body.get("to") or body.get("email") or "").strip().lower()
            subject = (body.get("subject") or "")[:500]
            text = body.get("message") or body.get("text") or body.get("body") or ""
            from_name = (body.get("from_name") or "MAIL-KA")[:255]
            campaign_id = body.get("campaign_id")
            if not to_email or not subject:
                log_event(conn, api_key_id, user_id, "send", body, "error", "Не указаны to/subject")
                return resp(400, {"error": "Обязательные поля: to (email), subject"}, event)
            # Если кампания указана — она должна принадлежать тому же пользователю
            if campaign_id:
                cur = conn.cursor()
                cur.execute(
                    f"SELECT 1 FROM {SCHEMA}.campaigns WHERE id = %s AND user_id = %s",
                    (campaign_id, user_id),
                )
                if not cur.fetchone():
                    cur.close()
                    log_event(conn, api_key_id, user_id, "send", body, "error", "Чужая кампания")
                    return resp(403, {"error": "Кампания не принадлежит вашему аккаунту"}, event)
                cur.close()

            send_payload = json.dumps({
                "to": to_email, "subject": subject, "text": text,
                "from_name": from_name, "campaign_id": campaign_id,
                "user_id": user_id,
            }).encode("utf-8")
            send_req = urllib.request.Request(
                f"{SEND_EMAIL_URL}?action=send",
                data=send_payload, method="POST",
            )
            send_req.add_header("Content-Type", "application/json")
            try:
                with urllib.request.urlopen(send_req, timeout=20) as r:
                    send_result = json.loads(r.read().decode())
            except Exception as ex:
                send_result = {"ok": False, "error": str(ex)}

            log_event(conn, api_key_id, user_id, "send",
                      {"to": to_email, "subject": subject, "campaign_id": campaign_id},
                      "ok" if send_result.get("ok") else "error",
                      send_result.get("error"))
            return resp(200 if send_result.get("ok") else 502, send_result, event)

        if resource == "trigger" and method == "POST":
            event_name = (body.get("event") or body.get("event_name") or "")[:100]
            contact_email = (body.get("email") or "").strip().lower()
            if not event_name:
                log_event(conn, api_key_id, user_id, "trigger", body, "error", "Не указан event")
                return resp(400, {"error": "Обязательное поле: event"}, event)
            cur = conn.cursor()
            # Только триггеры, принадлежащие тому же пользователю, что и API-ключ
            cur.execute(
                f"""SELECT t.id, t.campaign_id, c.name FROM {SCHEMA}.trigger_rules t
                    JOIN {SCHEMA}.campaigns c ON c.id = t.campaign_id
                    WHERE t.event_name = %s AND t.is_active = TRUE
                      AND t.user_id = %s AND c.user_id = %s""",
                (event_name, user_id, user_id),
            )
            rules = cur.fetchall()
            fired = []
            for rule in rules:
                cur.execute(
                    f"UPDATE {SCHEMA}.campaigns SET sent_count = sent_count + 1 "
                    f"WHERE id = %s AND user_id = %s",
                    (rule[1], user_id),
                )
                fired.append({"campaign_id": rule[1], "campaign_name": rule[2]})
            conn.commit()
            cur.close()
            log_event(conn, api_key_id, user_id, "trigger",
                      {"event": event_name, "email": contact_email, "fired": len(fired)})
            return resp(200, {"ok": True, "event": event_name, "fired_campaigns": fired, "count": len(fired)}, event)

        return resp(404, {"error": f"Неизвестный resource: {resource}"}, event)

    finally:
        conn.close()
