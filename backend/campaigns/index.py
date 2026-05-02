"""API для управления кампаниями MAIL-KA: список, создание, обновление статуса, удаление."""
import json
import os
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    parts = path.rstrip("/").split("/")
    campaign_id = parts[-1] if len(parts) >= 2 and parts[-1].isdigit() else None

    # DELETE /campaigns/{id}
    if method == "DELETE" and campaign_id:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.campaigns WHERE id = %s", (campaign_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # PUT /campaigns/{id} — обновить статус / поля
    if method == "PUT" and campaign_id:
        body = json.loads(event.get("body") or "{}")
        conn = get_conn()
        cur = conn.cursor()
        fields = []
        values = []
        allowed = ["name", "status", "subject", "preheader", "body_text", "sent_count", "open_rate", "click_rate",
                   "is_advertising", "erid", "advertiser_name", "advertiser_inn"]
        for key in allowed:
            if key in body:
                fields.append(f"{key} = %s")
                values.append(body[key])
        if "status" in body and body["status"] == "sent":
            fields.append("sent_at = NOW()")
        if not fields:
            cur.close()
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "no fields to update"})}
        values.append(campaign_id)
        cur.execute(f"UPDATE {SCHEMA}.campaigns SET {', '.join(fields)} WHERE id = %s", values)
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # POST /campaigns — создать
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        name = body.get("name", "Новая кампания")
        subject = body.get("subject", "")
        preheader = body.get("preheader", "")
        body_text = body.get("body_text", "")
        status = body.get("status", "draft")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.campaigns (name, subject, preheader, body_text, status) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (name, subject, preheader, body_text, status)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 201, "headers": CORS, "body": json.dumps({"ok": True, "id": new_id})}

    # GET /campaigns
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, name, status, subject, preheader, body_text, sent_count, open_rate, click_rate, "
        f"created_at, sent_at, is_advertising, erid, advertiser_name, advertiser_inn "
        f"FROM {SCHEMA}.campaigns ORDER BY created_at DESC"
    )
    rows = cur.fetchall()

    # Stats for dashboard
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.contacts")
    contacts_count = cur.fetchone()[0]

    cur.execute(f"SELECT SUM(sent_count) FROM {SCHEMA}.campaigns")
    total_sent = cur.fetchone()[0] or 0

    cur.execute(f"SELECT AVG(open_rate) FROM {SCHEMA}.campaigns WHERE sent_count > 0")
    avg_open = cur.fetchone()[0] or 0

    cur.close()
    conn.close()

    campaigns = []
    for r in rows:
        campaigns.append({
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
        })

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "campaigns": campaigns,
            "stats": {
                "contacts_count": contacts_count,
                "total_sent": total_sent,
                "avg_open_rate": round(float(avg_open), 1),
            }
        })
    }