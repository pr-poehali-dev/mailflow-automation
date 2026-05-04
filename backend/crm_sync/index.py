"""CRM Sync: контакты из Битрикс24/amoCRM в базу MAIL-KA.
Маршруты:
  POST ?action=sync&provider=...   - запустить синхронизацию
  GET  ?action=status&provider=... - последний статус синхронизации"""
import json
import os
import re
import hashlib
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
import psycopg2
import psycopg2.extras

SCHEMA = "t_p46602131_mailflow_automation"

ALLOWED_ORIGINS = {
    "https://mail-ka.ru",
    "https://www.mail-ka.ru",
    "https://preview--mailflow-automation.poehali.dev",
    "https://mailflow-automation.poehali.dev",
    "http://localhost:5173",
    "http://localhost:3000",
}

REDIRECT_URI = "https://mail-ka.ru/oauth/callback"
MAX_PAGES = 20
PAGE_SIZE = 50
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def cors_headers(event: dict) -> dict:
    headers = event.get("headers") or {}
    origin = headers.get("Origin") or headers.get("origin") or ""
    allow_origin = origin if origin in ALLOWED_ORIGINS else "https://mail-ka.ru"
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    }


def resp(status, body, event):
    return {"statusCode": status, "headers": cors_headers(event), "body": json.dumps(body)}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def require_user(event, conn):
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


def http_post_form(url, data):
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=body, method="POST",
                                 headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return {"error": True, "details": json.loads(e.read().decode())}
        except Exception:
            return {"error": True, "status": e.code}
    except Exception as ex:
        return {"error": True, "message": str(ex)}


def http_get_json(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return {"error": True, "status": e.code, "details": json.loads(e.read().decode())}
        except Exception:
            return {"error": True, "status": e.code}
    except Exception as ex:
        return {"error": True, "message": str(ex)}


def refresh_access_token(provider, refresh_token, domain):
    if provider == "bitrix24":
        client_id = os.environ.get("BITRIX24_CLIENT_ID", "")
        client_secret = os.environ.get("BITRIX24_CLIENT_SECRET", "")
        d = (domain or "").rstrip("/")
        if not d.startswith("http"):
            d = "https://" + d
        return http_post_form(d + "/oauth/token/", {
            "grant_type": "refresh_token",
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
        })
    if provider == "amocrm":
        client_id = os.environ.get("AMOCRM_CLIENT_ID", "")
        client_secret = os.environ.get("AMOCRM_CLIENT_SECRET", "")
        d = (domain or "").rstrip("/")
        if not d.startswith("http"):
            d = "https://" + d
        return http_post_form(d + "/oauth2/access_token", {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "redirect_uri": REDIRECT_URI,
        })
    return {"error": True, "message": "Unknown provider"}


def get_valid_token(conn, user_id, provider):
    cur = conn.cursor()
    cur.execute(
        f"SELECT access_token, refresh_token, domain, expires_at "
        f"FROM {SCHEMA}.crm_connections WHERE user_id = %s AND provider = %s AND status = 'active'",
        (user_id, provider),
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        return None, None, "Нет активного подключения"
    access_token, refresh_token, domain, expires_at = row
    needs_refresh = False
    if expires_at:
        now = datetime.now(timezone.utc)
        if expires_at <= now + timedelta(seconds=60):
            needs_refresh = True
    if needs_refresh and refresh_token:
        tokens = refresh_access_token(provider, refresh_token, domain)
        if tokens.get("error"):
            cur.close()
            return None, None, "Не удалось обновить токен"
        access_token = tokens.get("access_token") or access_token
        new_refresh = tokens.get("refresh_token") or refresh_token
        new_expires_in = int(tokens.get("expires_in") or 3600)
        new_expires_at = datetime.now(timezone.utc) + timedelta(seconds=new_expires_in)
        cur.execute(
            f"UPDATE {SCHEMA}.crm_connections SET access_token = %s, refresh_token = %s, "
            f"expires_at = %s, updated_at = NOW() WHERE user_id = %s AND provider = %s",
            (access_token, new_refresh, new_expires_at, user_id, provider),
        )
        conn.commit()
    cur.close()
    return access_token, domain, None


def fetch_bitrix_contacts(domain, access_token):
    d = (domain or "").rstrip("/")
    if not d.startswith("http"):
        d = "https://" + d
    start = 0
    for _ in range(MAX_PAGES):
        url = (d + "/rest/crm.contact.list?auth=" + urllib.parse.quote(access_token)
               + "&select[]=ID&select[]=NAME&select[]=LAST_NAME&select[]=EMAIL"
               + "&start=" + str(start))
        data = http_get_json(url)
        if data.get("error"):
            yield {"_error": data}
            return
        result = data.get("result") or []
        for c in result:
            emails = c.get("EMAIL") or []
            email = ""
            if isinstance(emails, list) and emails:
                email = emails[0].get("VALUE") or ""
            if not email:
                continue
            name_parts = [c.get("NAME") or "", c.get("LAST_NAME") or ""]
            yield {
                "external_id": str(c.get("ID")),
                "email": email.strip().lower(),
                "name": " ".join(p for p in name_parts if p).strip() or email.split("@")[0],
            }
        next_start = data.get("next")
        if next_start is None:
            return
        start = next_start


def fetch_amocrm_contacts(domain, access_token):
    d = (domain or "").rstrip("/")
    if not d.startswith("http"):
        d = "https://" + d
    page = 1
    for _ in range(MAX_PAGES):
        url = d + "/api/v4/contacts?limit=" + str(PAGE_SIZE) + "&page=" + str(page)
        data = http_get_json(url, {"Authorization": "Bearer " + access_token})
        if data.get("error"):
            yield {"_error": data}
            return
        embedded = (data.get("_embedded") or {}).get("contacts") or []
        if not embedded:
            return
        for c in embedded:
            email = ""
            for f in (c.get("custom_fields_values") or []):
                if f.get("field_code") == "EMAIL":
                    vals = f.get("values") or []
                    if vals:
                        email = (vals[0].get("value") or "").strip().lower()
                        break
            if not email:
                continue
            name = c.get("name") or email.split("@")[0]
            yield {
                "external_id": str(c.get("id")),
                "email": email,
                "name": name.strip(),
            }
        if not (data.get("_links") or {}).get("next"):
            return
        page += 1


def upsert_contacts(conn, user_id, provider, items):
    inserted = 0
    updated = 0
    skipped = 0
    fetched = 0
    error_msg = None
    cur = conn.cursor()
    for it in items:
        if isinstance(it, dict) and it.get("_error"):
            error_msg = json.dumps(it["_error"])[:500]
            break
        fetched += 1
        email = it.get("email", "")
        if not EMAIL_RE.match(email):
            skipped += 1
            continue
        external_id = it.get("external_id") or ""
        name = (it.get("name") or "")[:200]
        cur.execute(
            f"INSERT INTO {SCHEMA}.contacts "
            f"(user_id, name, email, segment, status, crm_source, crm_external_id, "
            f"crm_synced_at, consent_status, consent_source) "
            f"VALUES (%s, %s, %s, 'CRM', 'active', %s, %s, NOW(), 'imported', %s) "
            f"ON CONFLICT (user_id, crm_source, crm_external_id) "
            f"WHERE crm_external_id IS NOT NULL "
            f"DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, "
            f"crm_synced_at = NOW() "
            f"RETURNING (xmax = 0) AS inserted",
            (user_id, name, email, provider, external_id, "crm:" + provider),
        )
        row = cur.fetchone()
        if row and row[0]:
            inserted += 1
        else:
            updated += 1
        if (inserted + updated) % 50 == 0:
            conn.commit()
    conn.commit()
    cur.close()
    return {"fetched": fetched, "inserted": inserted, "updated": updated,
            "skipped": skipped, "error": error_msg}


def handler(event, context):
    """Синхронизация контактов из CRM в базу MAIL-KA."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(event), "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "status")
    method = event.get("httpMethod", "GET")
    provider = qs.get("provider", "")

    conn = get_conn()
    try:
        user_id, err = require_user(event, conn)
        if err:
            return err

        if provider not in ("bitrix24", "amocrm"):
            return resp(400, {"error": "Поддерживаются только bitrix24 и amocrm"}, event)

        if action == "status" and method == "GET":
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(
                f"SELECT last_sync_at, last_sync_status, last_sync_count "
                f"FROM {SCHEMA}.crm_connections WHERE user_id = %s AND provider = %s",
                (user_id, provider),
            )
            row = cur.fetchone()
            cur.close()
            if not row:
                return resp(200, {"connected": False}, event)
            return resp(200, {
                "connected": True,
                "last_sync_at": row["last_sync_at"].isoformat() if row["last_sync_at"] else None,
                "last_sync_status": row["last_sync_status"],
                "last_sync_count": row["last_sync_count"] or 0,
            }, event)

        if action == "sync" and method == "POST":
            access_token, domain, terr = get_valid_token(conn, user_id, provider)
            if terr:
                return resp(400, {"error": terr}, event)

            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.crm_sync_log (user_id, provider, status) "
                f"VALUES (%s, %s, 'running') RETURNING id",
                (user_id, provider),
            )
            log_id = cur.fetchone()[0]
            conn.commit()
            cur.close()

            try:
                if provider == "bitrix24":
                    items = fetch_bitrix_contacts(domain, access_token)
                else:
                    items = fetch_amocrm_contacts(domain, access_token)
                stats = upsert_contacts(conn, user_id, provider, items)
            except Exception as ex:
                stats = {"fetched": 0, "inserted": 0, "updated": 0, "skipped": 0,
                         "error": "Сбой синхронизации: " + str(ex)}

            status_str = "error" if stats.get("error") else "success"
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.crm_sync_log SET finished_at = NOW(), status = %s, "
                f"fetched_count = %s, inserted_count = %s, updated_count = %s, "
                f"skipped_count = %s, error_message = %s WHERE id = %s",
                (status_str, stats["fetched"], stats["inserted"], stats["updated"],
                 stats["skipped"], stats.get("error"), log_id),
            )
            cur.execute(
                f"UPDATE {SCHEMA}.crm_connections SET last_sync_at = NOW(), "
                f"last_sync_status = %s, last_sync_count = %s, updated_at = NOW() "
                f"WHERE user_id = %s AND provider = %s",
                (status_str, stats["inserted"] + stats["updated"], user_id, provider),
            )
            conn.commit()
            cur.close()

            return resp(200, {
                "ok": status_str == "success",
                "fetched": stats["fetched"],
                "inserted": stats["inserted"],
                "updated": stats["updated"],
                "skipped": stats["skipped"],
                "error": stats.get("error"),
            }, event)

        return resp(400, {"error": "Неизвестное действие"}, event)
    finally:
        conn.close()
