"""OAuth 2.0 для CRM-интеграций (Битрикс24, amoCRM).
Маршруты:
  GET  ?action=list                           - список подключенных CRM
  GET  ?action=authorize&provider=...&domain= - вернуть URL OAuth для редиректа
  GET  ?action=callback&...                   - обработать redirect от CRM, сохранить токен
  DELETE ?action=disconnect&provider=...      - отключить CRM
Все приватные операции требуют X-Auth-Token (кроме callback — там используется state)."""
import json
import os
import hashlib
import secrets
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

PROVIDERS = {
    "bitrix24": {
        "client_id_env": "BITRIX24_CLIENT_ID",
        "client_secret_env": "BITRIX24_CLIENT_SECRET",
        "scope": "crm,user",
    },
    "amocrm": {
        "client_id_env": "AMOCRM_CLIENT_ID",
        "client_secret_env": "AMOCRM_CLIENT_SECRET",
        "scope": "crm,notifications",
    },
}


def cors_headers(event: dict) -> dict:
    headers = event.get("headers") or {}
    origin = headers.get("Origin") or headers.get("origin") or ""
    allow_origin = origin if origin in ALLOWED_ORIGINS else "https://mail-ka.ru"
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
        "X-Content-Type-Options": "nosniff",
    }


def resp(status: int, body: dict, event: dict) -> dict:
    return {"statusCode": status, "headers": cors_headers(event), "body": json.dumps(body)}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def require_user(event: dict, conn):
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


def http_post_form(url: str, data: dict) -> dict:
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


# ─── OAuth-провайдеры ─────────────────────────────────────────────────────────

def build_authorize_url(provider: str, state: str, domain: str) -> str:
    cfg = PROVIDERS[provider]
    client_id = os.environ.get(cfg["client_id_env"], "")
    if not client_id:
        return ""
    if provider == "bitrix24":
        # Битрикс — у каждого портала свой домен
        d = (domain or "").strip().rstrip("/")
        if not d:
            return ""
        if not d.startswith("http"):
            d = f"https://{d}"
        return (f"{d}/oauth/authorize/?client_id={urllib.parse.quote(client_id)}"
                f"&state={urllib.parse.quote(state)}&response_type=code"
                f"&redirect_uri={urllib.parse.quote(REDIRECT_URI)}")
    if provider == "amocrm":
        return (f"https://www.amocrm.ru/oauth?client_id={urllib.parse.quote(client_id)}"
                f"&state={urllib.parse.quote(state)}&mode=post_message")
    return ""


def exchange_code(provider: str, code: str, domain: str) -> dict:
    cfg = PROVIDERS[provider]
    client_id = os.environ.get(cfg["client_id_env"], "")
    client_secret = os.environ.get(cfg["client_secret_env"], "")
    if not client_id or not client_secret:
        return {"error": True, "message": "Не настроены ключи приложения"}
    if provider == "bitrix24":
        d = (domain or "").rstrip("/")
        if not d.startswith("http"):
            d = f"https://{d}"
        return http_post_form(f"{d}/oauth/token/", {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": REDIRECT_URI,
        })
    if provider == "amocrm":
        d = (domain or "").rstrip("/")
        if not d.startswith("http"):
            d = f"https://{d}"
        return http_post_form(f"{d}/oauth2/access_token", {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
        })
    return {"error": True, "message": "Неизвестный провайдер"}


# ─── Handler ──────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """OAuth-роутер для CRM-интеграций. Поддерживает list, authorize, callback, disconnect."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(event), "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "list")
    method = event.get("httpMethod", "GET")
    conn = get_conn()
    try:
        # ── Callback (без X-Auth-Token: state в БД) ──
        if action == "callback":
            state = qs.get("state", "")
            code = qs.get("code", "")
            if not state or not code:
                return resp(400, {"error": "Нет state или code"}, event)
            cur = conn.cursor()
            cur.execute(
                f"SELECT user_id, provider, domain FROM {SCHEMA}.crm_oauth_states "
                f"WHERE state = %s AND created_at > NOW() - INTERVAL '15 minutes'",
                (state,),
            )
            row = cur.fetchone()
            if not row:
                cur.close()
                return resp(400, {"error": "State истёк или недействителен"}, event)
            user_id, provider, domain = row
            cur.execute(f"DELETE FROM {SCHEMA}.crm_oauth_states WHERE state = %s", (state,))
            conn.commit()
            cur.close()

            # amoCRM передаёт referer в callback, у Битрикса — фиксированный домain портала
            cb_domain = qs.get("domain") or qs.get("referer") or domain or ""
            tokens = exchange_code(provider, code, cb_domain)
            if tokens.get("error"):
                return resp(502, {"error": "Не удалось получить токен", "details": tokens}, event)

            access_token = tokens.get("access_token")
            refresh_token = tokens.get("refresh_token")
            expires_in = int(tokens.get("expires_in") or 3600)
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            account_info = {
                "domain": cb_domain,
                "scope": tokens.get("scope"),
                "token_type": tokens.get("token_type"),
            }

            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.crm_connections "
                f"(user_id, provider, domain, access_token, refresh_token, expires_at, account_info, status, updated_at) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', NOW()) "
                f"ON CONFLICT (user_id, provider) DO UPDATE SET "
                f"domain = EXCLUDED.domain, access_token = EXCLUDED.access_token, "
                f"refresh_token = EXCLUDED.refresh_token, expires_at = EXCLUDED.expires_at, "
                f"account_info = EXCLUDED.account_info, status = 'active', updated_at = NOW()",
                (user_id, provider, cb_domain, access_token, refresh_token, expires_at,
                 json.dumps(account_info)),
            )
            conn.commit()
            cur.close()
            return resp(200, {"ok": True, "provider": provider, "domain": cb_domain}, event)

        # ── Авторизованные ручки ──
        user_id, err = require_user(event, conn)
        if err:
            return err

        if action == "list" and method == "GET":
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(
                f"SELECT provider, domain, status, created_at, updated_at, account_info "
                f"FROM {SCHEMA}.crm_connections WHERE user_id = %s",
                (user_id,),
            )
            items = []
            for r in cur.fetchall():
                items.append({
                    "provider": r["provider"],
                    "domain": r["domain"],
                    "status": r["status"],
                    "connected_at": r["created_at"].isoformat() if r["created_at"] else None,
                    "account_info": r["account_info"] or {},
                })
            cur.close()
            return resp(200, {"connections": items}, event)

        if action == "authorize" and method == "GET":
            provider = qs.get("provider", "")
            domain = qs.get("domain", "")
            if provider not in PROVIDERS:
                return resp(400, {"error": "Неизвестный провайдер"}, event)
            cfg = PROVIDERS[provider]
            if not os.environ.get(cfg["client_id_env"]):
                return resp(503, {
                    "error": "not_configured",
                    "message": f"Интеграция {provider} временно недоступна — ключи приложения не настроены",
                }, event)
            if provider == "bitrix24" and not domain:
                return resp(400, {"error": "Для Битрикс24 нужен адрес портала (например your-company.bitrix24.ru)"}, event)

            state = secrets.token_urlsafe(32)
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.crm_oauth_states (state, user_id, provider, domain) "
                f"VALUES (%s, %s, %s, %s)",
                (state, user_id, provider, domain),
            )
            # Чистим старые state
            cur.execute(
                f"DELETE FROM {SCHEMA}.crm_oauth_states "
                f"WHERE created_at < NOW() - INTERVAL '1 hour'"
            )
            conn.commit()
            cur.close()
            url = build_authorize_url(provider, state, domain)
            if not url:
                return resp(500, {"error": "Не удалось построить URL авторизации"}, event)
            return resp(200, {"authorize_url": url, "state": state}, event)

        if action == "disconnect" and method == "DELETE":
            provider = qs.get("provider", "")
            cur = conn.cursor()
            cur.execute(
                f"DELETE FROM {SCHEMA}.crm_connections WHERE user_id = %s AND provider = %s",
                (user_id, provider),
            )
            conn.commit()
            cur.close()
            return resp(200, {"ok": True}, event)

        return resp(400, {"error": "Неизвестное действие"}, event)
    finally:
        conn.close()
