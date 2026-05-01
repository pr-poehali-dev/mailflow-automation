"""
Публичный API MAIL-KA.

Управление ключами (без авторизации):
  GET  /?resource=keys          — список ключей
  POST /?resource=keys          — создать ключ  {name}
  PUT  /?resource=keys&id={id}  — вкл/выкл ключ {is_active}
  GET  /?resource=events        — лог вызовов
  GET  /?resource=triggers      — триггерные правила
  POST /?resource=triggers      — создать правило {event_name, campaign_id}

Публичные (требуют X-API-Key заголовок):
  GET  /?resource=contacts      — список контактов
  GET  /?resource=campaigns     — список кампаний
  POST /?resource=sync          — синхронизация контактов  {contacts:[...]}
  POST /?resource=send          — отправить письмо  {to, subject, message?, campaign_id?}
  POST /?resource=trigger       — запустить триггер  {event, email?, meta?}
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
}

# Ресурсы, доступные без API-ключа (внутреннее управление)
PUBLIC_RESOURCES = {"keys", "events", "triggers"}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def auth(conn, event: dict):
    headers = event.get("headers") or {}
    raw_key = headers.get("X-API-Key") or headers.get("x-api-key") or ""
    if not raw_key:
        return None
    h = hash_key(raw_key)
    cur = conn.cursor()
    cur.execute(f"SELECT id, name, is_active FROM {SCHEMA}.api_keys WHERE key_hash = %s", (h,))
    row = cur.fetchone()
    cur.close()
    if row and row[2]:
        cur2 = conn.cursor()
        cur2.execute(f"UPDATE {SCHEMA}.api_keys SET last_used_at = NOW() WHERE id = %s", (row[0],))
        conn.commit()
        cur2.close()
        return {"id": row[0], "name": row[1]}
    return None


def log_event(conn, api_key_id, event_type: str, payload: dict, status: str = "ok", error_msg: str = None):
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.api_events (api_key_id, event_type, payload, status, error_msg) VALUES (%s, %s, %s, %s, %s)",
        (api_key_id, event_type, json.dumps(payload, ensure_ascii=False), status, error_msg)
    )
    conn.commit()
    cur.close()


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    resource = qs.get("resource", "keys")
    key_id_qs = qs.get("id")

    body_raw = event.get("body") or "{}"
    try:
        body = json.loads(body_raw)
    except Exception:
        body = {}

    conn = get_conn()

    # ── Без авторизации: управление ключами ───────────────────────────────────

    if resource == "keys":
        if method == "POST":
            name = body.get("name", "Новый ключ")
            raw = "mka_" + secrets.token_hex(24)
            h = hash_key(raw)
            preview = raw[:12] + "..." + raw[-4:]
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.api_keys (name, key_hash, key_preview) VALUES (%s, %s, %s) RETURNING id",
                (name, h, preview)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return resp(201, {"ok": True, "id": new_id, "key": raw, "preview": preview,
                              "warning": "Сохрани ключ — он показывается только один раз"})

        if method == "PUT" and key_id_qs:
            is_active = body.get("is_active", True)
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.api_keys SET is_active = %s WHERE id = %s", (is_active, key_id_qs))
            conn.commit()
            cur.close()
            conn.close()
            return resp(200, {"ok": True})

        # GET — список
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, key_preview, is_active, created_at, last_used_at FROM {SCHEMA}.api_keys ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return resp(200, {"keys": [
            {"id": r[0], "name": r[1], "preview": r[2], "is_active": r[3],
             "created_at": r[4], "last_used_at": r[5]} for r in rows
        ]})

    if resource == "events":
        cur = conn.cursor()
        cur.execute(
            f"""SELECT e.id, k.name, e.event_type, e.payload, e.status, e.error_msg, e.created_at
                FROM {SCHEMA}.api_events e
                LEFT JOIN {SCHEMA}.api_keys k ON k.id = e.api_key_id
                ORDER BY e.created_at DESC LIMIT 100"""
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return resp(200, {"events": [
            {"id": r[0], "key_name": r[1], "event_type": r[2],
             "payload": r[3], "status": r[4], "error": r[5], "created_at": r[6]}
            for r in rows
        ]})

    if resource == "triggers":
        if method == "POST":
            event_name = body.get("event_name", "")
            campaign_id = body.get("campaign_id")
            if not event_name or not campaign_id:
                conn.close()
                return resp(400, {"error": "event_name и campaign_id обязательны"})
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.trigger_rules (event_name, campaign_id) VALUES (%s, %s) RETURNING id",
                (event_name, campaign_id)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return resp(201, {"ok": True, "id": new_id})

        if method == "PUT" and key_id_qs:
            is_active = body.get("is_active", True)
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.trigger_rules SET is_active = %s WHERE id = %s", (is_active, key_id_qs))
            conn.commit()
            cur.close()
            conn.close()
            return resp(200, {"ok": True})

        cur = conn.cursor()
        cur.execute(
            f"""SELECT t.id, t.event_name, t.campaign_id, c.name, t.is_active, t.created_at
                FROM {SCHEMA}.trigger_rules t
                LEFT JOIN {SCHEMA}.campaigns c ON c.id = t.campaign_id
                ORDER BY t.created_at DESC"""
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return resp(200, {"triggers": [
            {"id": r[0], "event_name": r[1], "campaign_id": r[2],
             "campaign_name": r[3], "is_active": r[4], "created_at": r[5]}
            for r in rows
        ]})

    # ── Публичные эндпоинты (требуют X-API-Key) ───────────────────────────────
    api_key_row = auth(conn, event)
    if not api_key_row:
        conn.close()
        return resp(401, {"error": "Требуется X-API-Key заголовок с действующим ключом"})

    key_id = api_key_row["id"]

    if resource == "contacts":
        cur = conn.cursor()
        cur.execute(f"SELECT id, name, email, segment, status, created_at FROM {SCHEMA}.contacts ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        log_event(conn, key_id, "contacts.list", {})
        conn.close()
        return resp(200, {"contacts": [
            {"id": r[0], "name": r[1], "email": r[2], "segment": r[3], "status": r[4], "created_at": r[5]}
            for r in rows
        ], "total": len(rows)})

    if resource == "campaigns":
        cur = conn.cursor()
        cur.execute(f"SELECT id, name, status, subject, sent_count, open_rate, click_rate, created_at, sent_at FROM {SCHEMA}.campaigns ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        log_event(conn, key_id, "campaigns.list", {})
        conn.close()
        return resp(200, {"campaigns": [
            {"id": r[0], "name": r[1], "status": r[2], "subject": r[3],
             "sent_count": r[4], "open_rate": float(r[5] or 0), "click_rate": float(r[6] or 0),
             "created_at": r[7], "sent_at": r[8]} for r in rows
        ]})

    if resource == "sync" and method == "POST":
        items = body.get("contacts", [])
        if not items:
            log_event(conn, key_id, "contacts.sync", body, "error", "Пустой массив contacts")
            conn.close()
            return resp(400, {"error": "Передай массив contacts: [{name, email, segment?}]"})
        cur = conn.cursor()
        inserted = 0
        updated = 0
        for c in items:
            email = c.get("email", "").strip().lower()
            if not email:
                continue
            cur.execute(
                f"""INSERT INTO {SCHEMA}.contacts (name, email, segment, status)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, segment = EXCLUDED.segment, status = EXCLUDED.status
                    RETURNING (xmax = 0)""",
                (c.get("name", ""), email, c.get("segment", "Новый"), c.get("status", "active"))
            )
            was_insert = cur.fetchone()[0]
            if was_insert:
                inserted += 1
            else:
                updated += 1
        conn.commit()
        cur.close()
        log_event(conn, key_id, "contacts.sync", {"count": len(items)})
        conn.close()
        return resp(200, {"ok": True, "inserted": inserted, "updated": updated, "total": inserted + updated})

    if resource == "send" and method == "POST":
        to_email = body.get("to") or body.get("email", "")
        subject = body.get("subject", "")
        campaign_id = body.get("campaign_id")
        if not to_email or not subject:
            log_event(conn, key_id, "send", body, "error", "Не указаны to/subject")
            conn.close()
            return resp(400, {"error": "Обязательные поля: to (email), subject"})
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.contacts WHERE email = %s", (to_email,))
        contact = cur.fetchone()
        if campaign_id:
            cur.execute(f"UPDATE {SCHEMA}.campaigns SET sent_count = sent_count + 1 WHERE id = %s", (campaign_id,))
            conn.commit()
        cur.close()
        log_event(conn, key_id, "send", {"to": to_email, "subject": subject, "campaign_id": campaign_id})
        conn.close()
        return resp(200, {
            "ok": True,
            "queued": True,
            "to": to_email,
            "subject": subject,
            "contact_found": contact is not None,
            "note": "Письмо поставлено в очередь. Подключи SMTP в Настройках для реальной отправки."
        })

    if resource == "trigger" and method == "POST":
        event_name = body.get("event") or body.get("event_name", "")
        contact_email = body.get("email", "")
        meta = body.get("meta") or body.get("data") or {}
        if not event_name:
            log_event(conn, key_id, "trigger", body, "error", "Не указан event")
            conn.close()
            return resp(400, {"error": "Обязательное поле: event (название события)"})
        cur = conn.cursor()
        cur.execute(
            f"""SELECT t.id, t.campaign_id, c.name FROM {SCHEMA}.trigger_rules t
                JOIN {SCHEMA}.campaigns c ON c.id = t.campaign_id
                WHERE t.event_name = %s AND t.is_active = TRUE""",
            (event_name,)
        )
        rules = cur.fetchall()
        fired = []
        for rule in rules:
            cur.execute(f"UPDATE {SCHEMA}.campaigns SET sent_count = sent_count + 1 WHERE id = %s", (rule[1],))
            fired.append({"campaign_id": rule[1], "campaign_name": rule[2]})
        conn.commit()
        cur.close()
        log_event(conn, key_id, "trigger", {"event": event_name, "email": contact_email, "fired": len(fired)})
        conn.close()
        return resp(200, {"ok": True, "event": event_name, "fired_campaigns": fired, "count": len(fired)})

    conn.close()
    return resp(404, {"error": f"Неизвестный resource: {resource}"})
