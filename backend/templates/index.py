"""
Каталог шаблонов писем.

Эндпоинты:
  GET /              — список системных + пользовательских шаблонов
  GET /?id=<id>      — детали шаблона (с HTML/текстом)
  POST /             — создать пользовательский шаблон (нужна авторизация)
"""
import json
import os
import hashlib
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

ALLOWED_ORIGINS = {
    "https://mail-ka.ru", "https://www.mail-ka.ru",
    "https://preview--mailflow-automation.poehali.dev",
    "https://mailflow-automation.poehali.dev",
    "http://localhost:5173", "http://localhost:3000",
}


def cors(event):
    h = event.get("headers") or {}
    o = h.get("Origin") or h.get("origin") or ""
    return {
        "Access-Control-Allow-Origin": o if o in ALLOWED_ORIGINS else "https://mail-ka.ru",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    }


def resp(status, body, event):
    return {
        "statusCode": status,
        "headers": cors(event),
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def conn_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_id(event, conn):
    h = event.get("headers") or {}
    token = (h.get("X-Auth-Token") or h.get("x-auth-token") or "").strip()
    if not token or len(token) < 16:
        return None
    th = hashlib.sha256(token.encode()).hexdigest()
    cur = conn.cursor()
    cur.execute(
        f"SELECT us.user_id FROM {SCHEMA}.user_sessions us "
        f"JOIN {SCHEMA}.users u ON u.id = us.user_id "
        f"WHERE us.token_hash = %s AND us.revoked_at IS NULL "
        f"AND us.expires_at > NOW() AND u.is_active = TRUE",
        (th,),
    )
    r = cur.fetchone()
    cur.close()
    return r[0] if r else None


def handler(event, context):
    """Список и создание шаблонов писем"""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": cors(event), "body": ""}

    qs = event.get("queryStringParameters") or {}
    conn = conn_db()
    try:
        user_id = get_user_id(event, conn)

        if method == "GET":
            tpl_id = qs.get("id")
            cur = conn.cursor()
            if tpl_id:
                try:
                    tpl_id_int = int(tpl_id)
                except ValueError:
                    return resp(400, {"error": "invalid_id"}, event)
                cur.execute(
                    f"SELECT id, name, category, subject, preheader, body_text, body_html, "
                    f"preview_emoji, uses_count, is_system, user_id, created_at "
                    f"FROM {SCHEMA}.email_templates "
                    f"WHERE id = %s AND (is_system = TRUE OR user_id = %s)",
                    (tpl_id_int, user_id),
                )
                r = cur.fetchone()
                cur.close()
                if not r:
                    return resp(404, {"error": "not_found"}, event)
                return resp(200, {
                    "id": r[0], "name": r[1], "category": r[2],
                    "subject": r[3], "preheader": r[4],
                    "body_text": r[5], "body_html": r[6],
                    "preview": r[7] or "📧",
                    "uses": r[8] or 0,
                    "is_system": bool(r[9]),
                    "user_id": r[10], "created_at": r[11],
                }, event)

            # Список: системные + свои (если авторизован)
            if user_id:
                cur.execute(
                    f"SELECT id, name, category, preview_emoji, uses_count, is_system, "
                    f"subject, preheader, created_at "
                    f"FROM {SCHEMA}.email_templates "
                    f"WHERE is_system = TRUE OR user_id = %s "
                    f"ORDER BY is_system DESC, uses_count DESC, id ASC",
                    (user_id,),
                )
            else:
                cur.execute(
                    f"SELECT id, name, category, preview_emoji, uses_count, is_system, "
                    f"subject, preheader, created_at "
                    f"FROM {SCHEMA}.email_templates "
                    f"WHERE is_system = TRUE "
                    f"ORDER BY uses_count DESC, id ASC"
                )
            rows = cur.fetchall()
            cur.close()
            templates = [
                {
                    "id": r[0],
                    "name": r[1],
                    "category": r[2] or "Прочее",
                    "preview": r[3] or "📧",
                    "uses": r[4] or 0,
                    "is_system": bool(r[5]),
                    "subject": r[6],
                    "preheader": r[7],
                    "created_at": r[8],
                }
                for r in rows
            ]
            return resp(200, {"templates": templates, "total": len(templates)}, event)

        if method == "POST":
            if not user_id:
                return resp(401, {"error": "auth_required"}, event)
            try:
                data = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return resp(400, {"error": "invalid_json"}, event)
            name = (data.get("name") or "").strip()[:255]
            if not name:
                return resp(400, {"error": "name_required"}, event)
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.email_templates "
                f"(name, category, subject, preheader, body_text, body_html, preview_emoji, user_id, is_system) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, FALSE) RETURNING id",
                (
                    name,
                    (data.get("category") or "Прочее")[:50],
                    (data.get("subject") or "")[:500],
                    (data.get("preheader") or "")[:255],
                    data.get("body_text") or "",
                    data.get("body_html") or "",
                    (data.get("preview_emoji") or "📧")[:10],
                    user_id,
                ),
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return resp(200, {"ok": True, "id": new_id}, event)

        return resp(405, {"error": "method_not_allowed"}, event)
    except Exception as e:
        conn.rollback()
        return resp(500, {"error": str(e)[:300]}, event)
    finally:
        conn.close()
