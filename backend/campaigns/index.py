"""API для управления кампаниями MAIL-KA: список, создание, обновление, удаление.
Все операции требуют авторизации, данные изолированы по user_id."""
import json
import os
import hashlib
import psycopg2

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
    allow_origin = origin if origin in ALLOWED_ORIGINS else "https://mail-ka.ru"
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
        return None, resp(401, {"error": "Сессия истекла или недействительна"}, event)
    return row[0], None


def handler(event: dict, context) -> dict:
    """Кампании пользователя: CRUD-операции с изоляцией по user_id."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(event), "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    parts = path.rstrip("/").split("/")
    campaign_id = parts[-1] if len(parts) >= 2 and parts[-1].isdigit() else None

    conn = get_conn()
    user_id, err = require_user(event, conn)
    if err:
        conn.close()
        return err

    try:
        # DELETE /campaigns/{id}
        if method == "DELETE" and campaign_id:
            cur = conn.cursor()
            cur.execute(
                f"DELETE FROM {SCHEMA}.campaigns WHERE id = %s AND user_id = %s",
                (int(campaign_id), user_id),
            )
            deleted = cur.rowcount
            conn.commit()
            cur.close()
            if deleted == 0:
                return resp(404, {"error": "Кампания не найдена"}, event)
            return resp(200, {"ok": True}, event)

        # PUT /campaigns/{id}
        if method == "PUT" and campaign_id:
            body = json.loads(event.get("body") or "{}")
            cur = conn.cursor()
            # Проверяем, что кампания принадлежит пользователю
            cur.execute(
                f"SELECT 1 FROM {SCHEMA}.campaigns WHERE id = %s AND user_id = %s",
                (int(campaign_id), user_id),
            )
            if not cur.fetchone():
                cur.close()
                return resp(404, {"error": "Кампания не найдена"}, event)

            fields = []
            values = []
            allowed = [
                "name", "status", "subject", "preheader", "body_text",
                "sent_count", "open_rate", "click_rate",
                "is_advertising", "erid", "advertiser_name", "advertiser_inn",
            ]
            for key in allowed:
                if key in body:
                    fields.append(f"{key} = %s")
                    values.append(body[key])
            if "status" in body and body["status"] == "sent":
                fields.append("sent_at = NOW()")
            if not fields:
                cur.close()
                return resp(400, {"error": "no fields to update"}, event)
            values.append(int(campaign_id))
            values.append(user_id)
            cur.execute(
                f"UPDATE {SCHEMA}.campaigns SET {', '.join(fields)} "
                f"WHERE id = %s AND user_id = %s",
                values,
            )
            conn.commit()
            cur.close()
            return resp(200, {"ok": True}, event)

        # POST /campaigns — создать
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            name = (body.get("name") or "Новая кампания")[:255]
            subject = (body.get("subject") or "")[:500]
            preheader = (body.get("preheader") or "")[:500]
            body_text = body.get("body_text") or ""
            status = (body.get("status") or "draft")[:50]
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.campaigns (user_id, name, subject, preheader, body_text, status) "
                f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (user_id, name, subject, preheader, body_text, status),
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return resp(201, {"ok": True, "id": new_id}, event)

        # GET /campaigns — только свои
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, status, subject, preheader, body_text, sent_count, open_rate, click_rate, "
            f"created_at, sent_at, is_advertising, erid, advertiser_name, advertiser_inn "
            f"FROM {SCHEMA}.campaigns WHERE user_id = %s ORDER BY created_at DESC LIMIT 1000",
            (user_id,),
        )
        rows = cur.fetchall()

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.contacts WHERE user_id = %s", (user_id,))
        contacts_count = cur.fetchone()[0]

        cur.execute(f"SELECT COALESCE(SUM(sent_count), 0) FROM {SCHEMA}.campaigns WHERE user_id = %s", (user_id,))
        total_sent = cur.fetchone()[0] or 0

        cur.execute(
            f"SELECT COALESCE(AVG(open_rate), 0) FROM {SCHEMA}.campaigns "
            f"WHERE user_id = %s AND sent_count > 0",
            (user_id,),
        )
        avg_open = cur.fetchone()[0] or 0
        cur.close()

        campaigns = [
            {
                "id": r[0],
                "name": r[1],
                "status": r[2],
                "subject": r[3],
                "preheader": r[4],
                "body_text": r[5],
                "sent_count": r[6],
                "open_rate": float(r[7]) if r[7] else 0,
                "click_rate": float(r[8]) if r[8] else 0,
                "created_at": r[9].isoformat() if r[9] else None,
                "sent_at": r[10].isoformat() if r[10] else None,
                "is_advertising": bool(r[11]) if len(r) > 11 else False,
                "erid": (r[12] or "") if len(r) > 12 else "",
                "advertiser_name": (r[13] or "") if len(r) > 13 else "",
                "advertiser_inn": (r[14] or "") if len(r) > 14 else "",
            }
            for r in rows
        ]

        return resp(
            200,
            {
                "campaigns": campaigns,
                "stats": {
                    "contacts_count": contacts_count,
                    "total_sent": total_sent,
                    "avg_open_rate": round(float(avg_open), 1),
                },
            },
            event,
        )

    finally:
        conn.close()
