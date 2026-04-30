"""API для управления контактами MAIL-KA: список, создание, удаление, импорт CSV."""
import json
import os
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    # DELETE /contacts/{id}
    if method == "DELETE" and path.count("/") >= 2:
        parts = path.rstrip("/").split("/")
        contact_id = parts[-1]
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.contacts WHERE id = %s", (contact_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # POST /contacts — создать или импортировать batch
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        conn = get_conn()
        cur = conn.cursor()

        # Batch import
        if "contacts" in body:
            inserted = 0
            for c in body["contacts"]:
                try:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.contacts (name, email, segment, status) VALUES (%s, %s, %s, %s) ON CONFLICT (email) DO NOTHING",
                        (c.get("name", ""), c.get("email", ""), c.get("segment", "Новый"), c.get("status", "active"))
                    )
                    inserted += cur.rowcount
                except Exception:
                    pass
            conn.commit()
            cur.close()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "inserted": inserted})}

        # Single contact
        name = body.get("name", "")
        email = body.get("email", "")
        segment = body.get("segment", "Новый")
        status = body.get("status", "active")
        if not email:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "email required"})}
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.contacts (name, email, segment, status) VALUES (%s, %s, %s, %s) RETURNING id",
                (name, email, segment, status)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            cur.close()
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "email already exists"})}
        cur.close()
        conn.close()
        return {"statusCode": 201, "headers": CORS, "body": json.dumps({"ok": True, "id": new_id})}

    # GET /contacts
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, name, email, segment, status, created_at FROM {SCHEMA}.contacts ORDER BY created_at DESC"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    contacts = []
    for r in rows:
        contacts.append({
            "id": r[0],
            "name": r[1],
            "email": r[2],
            "segment": r[3],
            "status": r[4],
            "created_at": r[5].isoformat() if r[5] else None,
        })

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"contacts": contacts, "total": len(contacts)})}
