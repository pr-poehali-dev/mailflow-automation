"""
Партнёрская программа MAIL-KA.

Эндпоинты (?action=...):
  apply     POST — приём заявок от партнёров (реферал/агентство/whitelabel/tech)
  my        GET  — мои заявки (для авторизованного)
"""
import json
import os
import re
import hashlib
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

ALLOWED_ORIGINS = {
    "https://mail-ka.ru", "https://www.mail-ka.ru",
    "https://preview--mailflow-automation.poehali.dev",
    "https://mailflow-automation.poehali.dev",
    "http://localhost:5173", "http://localhost:3000",
}

ALLOWED_PROGRAMS = {"referral", "agency", "whitelabel", "tech"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


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


def get_ip(event):
    h = event.get("headers") or {}
    fwd = h.get("X-Forwarded-For") or h.get("x-forwarded-for") or ""
    return (fwd.split(",")[0].strip() or None) or h.get("x-real-ip")


def safe_str(v, limit=500):
    if v is None:
        return None
    s = str(v).strip()
    return s[:limit] if s else None


def handler(event, context):
    """Приём заявок от партнёров и просмотр своих заявок"""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": cors(event), "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")

    conn = conn_db()
    try:
        if action == "apply" and method == "POST":
            try:
                data = json.loads(event.get("body") or "{}")
            except json.JSONDecodeError:
                return resp(400, {"ok": False, "error": "invalid_json"}, event)

            program = (data.get("program") or "referral").strip().lower()
            if program not in ALLOWED_PROGRAMS:
                program = "referral"

            name = safe_str(data.get("name"), 255)
            email = safe_str(data.get("email"), 255)
            channel = safe_str(data.get("channel"), 500)
            audience = safe_str(data.get("audience"), 2000)
            utm_source = safe_str(data.get("utm_source"), 100)

            if not name or len(name) < 2:
                return resp(400, {"ok": False, "error": "name_required"}, event)
            if not email or not EMAIL_RE.match(email):
                return resp(400, {"ok": False, "error": "invalid_email"}, event)

            user_id = get_user_id(event, conn)
            ip = get_ip(event)
            ua = safe_str(
                (event.get("headers") or {}).get("User-Agent")
                or (event.get("headers") or {}).get("user-agent"),
                500,
            )

            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.partner_applications "
                f"(program, name, email, channel, audience, user_id, ip_address, user_agent, utm_source) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (program, name, email, channel, audience, user_id, ip, ua, utm_source),
            )
            app_id = cur.fetchone()[0]
            conn.commit()
            cur.close()

            return resp(
                200,
                {
                    "ok": True,
                    "application_id": app_id,
                    "message": "Заявка отправлена. Мы свяжемся с тобой в течение 1 рабочего дня.",
                },
                event,
            )

        if action == "my" and method == "GET":
            user_id = get_user_id(event, conn)
            if not user_id:
                return resp(401, {"ok": False, "error": "auth_required"}, event)
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, program, name, email, channel, status, created_at "
                f"FROM {SCHEMA}.partner_applications "
                f"WHERE user_id = %s "
                f"ORDER BY created_at DESC LIMIT 50",
                (user_id,),
            )
            rows = cur.fetchall()
            cur.close()
            apps = [
                {
                    "id": r[0],
                    "program": r[1],
                    "name": r[2],
                    "email": r[3],
                    "channel": r[4],
                    "status": r[5],
                    "created_at": r[6],
                }
                for r in rows
            ]
            return resp(200, {"ok": True, "applications": apps}, event)

        if action == "stats" and method == "GET":
            cur = conn.cursor()
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.partner_applications "
                f"WHERE status IN ('approved', 'active')"
            )
            active = cur.fetchone()[0] or 0
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.partner_applications"
            )
            total = cur.fetchone()[0] or 0
            cur.close()
            return resp(
                200,
                {
                    "ok": True,
                    "active_partners": int(active),
                    "total_applications": int(total),
                },
                event,
            )

        return resp(404, {"ok": False, "error": "unknown_action"}, event)
    except Exception as e:
        conn.rollback()
        return resp(500, {"ok": False, "error": str(e)[:300]}, event)
    finally:
        conn.close()
