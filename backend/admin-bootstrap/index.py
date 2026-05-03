"""
Одноразовая утилита: сразу при первом GET-запросе сбрасывает пароль
admin atyurin2@yandex.ru на Cfvfhf163Plus, после этого блокируется.
После использования эта функция удаляется!
"""
import json
import hashlib
import secrets
import base64
import os
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"
TARGET_EMAIL = "atyurin2@yandex.ru"
NEW_PASSWORD = "Cfvfhf163Plus"


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return f"pbkdf2_sha256$200000${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def handler(event, context):
    """Одноразовый сброс пароля админа."""
    pwd_hash = hash_password(NEW_PASSWORD)
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.users "
        f"SET password_hash = %s, role = 'admin', is_active = TRUE, "
        f"is_email_verified = TRUE, failed_attempts = 0, locked_until = NULL, "
        f"updated_at = NOW() "
        f"WHERE email_lower = %s RETURNING id, email, role",
        (pwd_hash, TARGET_EMAIL),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "ok": True,
            "user_id": row[0] if row else None,
            "email": row[1] if row else None,
            "role": row[2] if row else None,
            "new_password": NEW_PASSWORD,
        }, ensure_ascii=False),
    }