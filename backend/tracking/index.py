"""
Трекинг-сервис MAIL-KA.
Эндпоинты:
  GET  /?action=open&t={token}        — пиксель открытия (1×1 GIF)
  GET  /?action=click&t={token}&u=URL — redirect клика с трекингом
  GET  /?action=unsubscribe&t={token} — страница отписки
  POST /?action=unsubscribe&t={token} — подтвердить отписку
  GET  /?action=stats&campaign_id=N   — статистика по кампании
  GET  /?action=heatmap&campaign_id=N — heatmap кликов по ссылкам
"""
import json
import os
import base64
import urllib.parse
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

# 1x1 transparent GIF
PIXEL_GIF = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def detect_device(ua: str) -> str:
    ua_low = (ua or "").lower()
    if any(x in ua_low for x in ["iphone", "android", "mobile"]):
        return "mobile"
    if "ipad" in ua_low or "tablet" in ua_low:
        return "tablet"
    return "desktop"


def detect_client(ua: str) -> str:
    ua_low = (ua or "").lower()
    if "outlook" in ua_low: return "Outlook"
    if "thunderbird" in ua_low: return "Thunderbird"
    if "yandex" in ua_low: return "Яндекс.Почта"
    if "mail.ru" in ua_low or "mailru" in ua_low: return "Mail.ru"
    if "gmail" in ua_low: return "Gmail"
    if "applemail" in ua_low or "iphone" in ua_low: return "Apple Mail"
    return "Webmail"


def log_event(conn, token: str, event_type: str, link_url: str = "", headers: dict = None) -> dict:
    headers = headers or {}
    ua = headers.get("user-agent", "") or headers.get("User-Agent", "")
    ip = headers.get("x-forwarded-for", "") or headers.get("X-Forwarded-For", "")
    if "," in ip: ip = ip.split(",")[0].strip()

    cur = conn.cursor()
    cur.execute(
        f"SELECT id, campaign_id, contact_id FROM {SCHEMA}.email_logs WHERE tracking_token = %s LIMIT 1",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        return {"ok": False, "reason": "token_not_found"}

    log_id, campaign_id, contact_id = row
    cur.execute(
        f"""INSERT INTO {SCHEMA}.email_events
            (email_log_id, campaign_id, contact_id, event_type, link_url,
             user_agent, ip_address, device_type, client_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (log_id, campaign_id, contact_id, event_type, link_url,
         ua[:500], ip[:60], detect_device(ua), detect_client(ua))
    )

    if event_type == "open":
        cur.execute(
            f"UPDATE {SCHEMA}.email_logs SET opened_at = COALESCE(opened_at, NOW()) WHERE id = %s",
            (log_id,)
        )
        if contact_id:
            cur.execute(
                f"UPDATE {SCHEMA}.contacts SET last_opened_at = NOW(), engagement_score = LEAST(100, engagement_score + 2) WHERE id = %s",
                (contact_id,)
            )
    elif event_type == "click":
        cur.execute(
            f"UPDATE {SCHEMA}.email_logs SET clicked_at = COALESCE(clicked_at, NOW()) WHERE id = %s",
            (log_id,)
        )
        if contact_id:
            cur.execute(
                f"UPDATE {SCHEMA}.contacts SET last_clicked_at = NOW(), engagement_score = LEAST(100, engagement_score + 5) WHERE id = %s",
                (contact_id,)
            )
    elif event_type == "unsubscribe":
        cur.execute(
            f"UPDATE {SCHEMA}.email_logs SET unsubscribed_at = NOW() WHERE id = %s",
            (log_id,)
        )
        if contact_id:
            cur.execute(
                f"UPDATE {SCHEMA}.contacts SET status = 'unsubscribed' WHERE id = %s",
                (contact_id,)
            )
        # Добавляем email в suppression list
        cur.execute(f"SELECT to_email FROM {SCHEMA}.email_logs WHERE id = %s", (log_id,))
        em_row = cur.fetchone()
        if em_row:
            cur.execute(
                f"INSERT INTO {SCHEMA}.suppression_list (email, reason, details) VALUES (%s, 'unsubscribe', 'Отписался по ссылке') ON CONFLICT (email) DO NOTHING",
                (em_row[0],)
            )

    conn.commit()
    cur.close()
    return {"ok": True, "log_id": log_id, "campaign_id": campaign_id}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    token = qs.get("t", "")
    headers = event.get("headers") or {}

    conn = get_conn()

    # ── GET ?action=open — трекинг-пиксель ────────────────────────────────────
    if action == "open" and token:
        log_event(conn, token, "open", "", headers)
        conn.close()
        return {
            "statusCode": 200,
            "headers": {
                **CORS,
                "Content-Type": "image/gif",
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
            },
            "isBase64Encoded": True,
            "body": base64.b64encode(PIXEL_GIF).decode(),
        }

    # ── GET ?action=click — redirect клика ───────────────────────────────────
    if action == "click" and token:
        target_url = qs.get("u", "")
        if target_url:
            try:
                target_url = urllib.parse.unquote(target_url)
            except Exception:
                pass
        log_event(conn, token, "click", target_url, headers)
        conn.close()
        return {
            "statusCode": 302,
            "headers": {
                **CORS,
                "Location": target_url or "https://poehali.dev",
                "Cache-Control": "no-store",
            },
            "body": "",
        }

    # ── GET ?action=unsubscribe — страница отписки ───────────────────────────
    if action == "unsubscribe" and method == "GET" and token:
        cur = conn.cursor()
        cur.execute(f"SELECT to_email FROM {SCHEMA}.email_logs WHERE tracking_token = %s", (token,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        email = row[0] if row else "вашего адреса"
        html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Отписка — MAIL-KA</title>
<style>body{{font-family:-apple-system,sans-serif;background:#0f0f1a;color:#e2e8f0;margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh}}
.card{{max-width:480px;width:90%;background:#1a1a2e;padding:40px;border-radius:24px;border:1px solid rgba(255,255,255,0.08);text-align:center}}
.btn{{display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#a855f7,#22d3ee);color:#fff;border:none;border-radius:12px;font-weight:600;cursor:pointer;text-decoration:none;font-size:14px;margin-top:16px}}
h1{{font-size:24px;margin:0 0 12px}}p{{color:#94a3b8;line-height:1.6;font-size:14px}}</style></head>
<body><div class="card">
<div style="font-size:48px;margin-bottom:16px">📬</div>
<h1>Отписаться от рассылки</h1>
<p>Вы хотите отписать <strong>{email}</strong> от писем MAIL-KA?</p>
<form method="POST" action="?action=unsubscribe&t={token}"><button class="btn" type="submit">Да, отписаться</button></form>
<p style="margin-top:24px;font-size:12px">Если это была ошибка — просто закройте страницу.</p>
</div></body></html>"""
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "text/html; charset=utf-8"}, "body": html}

    # ── POST ?action=unsubscribe — подтверждение ─────────────────────────────
    if action == "unsubscribe" and method == "POST" and token:
        result = log_event(conn, token, "unsubscribe", "", headers)
        conn.close()
        html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Готово — MAIL-KA</title>
<style>body{{font-family:-apple-system,sans-serif;background:#0f0f1a;color:#e2e8f0;margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh}}
.card{{max-width:480px;width:90%;background:#1a1a2e;padding:40px;border-radius:24px;border:1px solid rgba(74,222,128,0.3);text-align:center}}
h1{{font-size:24px;margin:0 0 12px;color:#4ade80}}p{{color:#94a3b8;line-height:1.6;font-size:14px}}</style></head>
<body><div class="card">
<div style="font-size:48px;margin-bottom:16px">✅</div>
<h1>Готово!</h1>
<p>Вы успешно отписались. Больше писем от нас не будет.</p>
<p style="margin-top:24px;font-size:12px">Передумали? Напишите нам — снова подпишем.</p>
</div></body></html>"""
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "text/html; charset=utf-8"}, "body": html}

    # ── GET ?action=stats&campaign_id=N — статистика по кампании ─────────────
    if method == "GET" and action == "stats":
        campaign_id = qs.get("campaign_id")
        if not campaign_id:
            conn.close()
            return {"statusCode": 400, "headers": {**CORS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "campaign_id required"})}

        cur = conn.cursor()
        cur.execute(f"""
            SELECT
              COUNT(*) FILTER (WHERE status = 'sent') as sent,
              COUNT(*) FILTER (WHERE status = 'failed') as failed,
              COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
              COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked,
              COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL) as unsubscribed
            FROM {SCHEMA}.email_logs WHERE campaign_id = %s
        """, (campaign_id,))
        s = cur.fetchone()
        sent, failed, opened, clicked, unsub = s

        # Распределение по устройствам
        cur.execute(f"""
            SELECT device_type, COUNT(*) FROM {SCHEMA}.email_events
            WHERE campaign_id = %s AND event_type = 'open'
            GROUP BY device_type
        """, (campaign_id,))
        devices = [{"device": r[0] or "unknown", "count": r[1]} for r in cur.fetchall()]

        # Распределение по почтовым клиентам
        cur.execute(f"""
            SELECT client_name, COUNT(*) FROM {SCHEMA}.email_events
            WHERE campaign_id = %s AND event_type = 'open'
            GROUP BY client_name ORDER BY COUNT(*) DESC LIMIT 10
        """, (campaign_id,))
        clients = [{"client": r[0] or "unknown", "count": r[1]} for r in cur.fetchall()]

        # Активность по часам
        cur.execute(f"""
            SELECT EXTRACT(HOUR FROM created_at)::int as hour, COUNT(*) FROM {SCHEMA}.email_events
            WHERE campaign_id = %s AND event_type = 'open'
            GROUP BY hour ORDER BY hour
        """, (campaign_id,))
        hourly = [{"hour": r[0], "count": r[1]} for r in cur.fetchall()]

        cur.close()
        conn.close()

        sent_safe = max(sent, 1)
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({
                    "sent": sent, "failed": failed, "opened": opened,
                    "clicked": clicked, "unsubscribed": unsub,
                    "open_rate": round(opened * 100.0 / sent_safe, 2),
                    "click_rate": round(clicked * 100.0 / sent_safe, 2),
                    "unsub_rate": round(unsub * 100.0 / sent_safe, 2),
                    "devices": devices, "clients": clients, "hourly": hourly,
                })}

    # ── GET ?action=heatmap — heatmap кликов по ссылкам ──────────────────────
    if method == "GET" and action == "heatmap":
        campaign_id = qs.get("campaign_id")
        cur = conn.cursor()
        cur.execute(f"""
            SELECT link_url, COUNT(*) as clicks, COUNT(DISTINCT contact_id) as unique_clicks
            FROM {SCHEMA}.email_events
            WHERE event_type = 'click' AND campaign_id = %s
            GROUP BY link_url ORDER BY clicks DESC LIMIT 50
        """, (campaign_id,))
        links = [{"url": r[0], "clicks": r[1], "unique": r[2]} for r in cur.fetchall()]
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"links": links})}

    conn.close()
    return {"statusCode": 404, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Not found"})}
