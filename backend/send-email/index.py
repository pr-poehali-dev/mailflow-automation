"""
Собственный email-движок MAIL-KA на чистом SMTP (smtplib).
Никаких сторонних сервисов — отправка через любой SMTP-сервер.
Поддерживает: Yandex, Mail.ru, Gmail, Rambler, корпоративные SMTP.

Эндпоинты:
  GET  ?action=status     — статус подключения SMTP
  GET  ?action=presets    — пресеты SMTP-серверов
  GET  ?action=config     — текущие настройки (без пароля)
  GET  ?action=logs       — история отправок
  POST ?action=config     — сохранить настройки SMTP
  POST ?action=test_smtp  — проверить подключение
  POST ?action=test       — тестовое письмо
  POST ?action=send       — отправить письмо
  POST ?action=blast      — массовая рассылка по кампании
"""
import json
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr, make_msgid
from email.header import Header
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SMTP_PRESETS = {
    "yandex":    {"host": "smtp.yandex.ru",   "port": 465, "use_ssl": True,  "use_tls": False, "label": "Яндекс Почта",     "hint": "Создай пароль приложения: id.yandex.ru → Безопасность → Пароли приложений"},
    "mailru":    {"host": "smtp.mail.ru",     "port": 465, "use_ssl": True,  "use_tls": False, "label": "Mail.ru",           "hint": "Создай пароль внешнего приложения: account.mail.ru → Безопасность → Пароли"},
    "gmail":     {"host": "smtp.gmail.com",   "port": 587, "use_ssl": False, "use_tls": True,  "label": "Gmail",             "hint": "Создай App Password: myaccount.google.com → Security → 2-Step → App passwords"},
    "rambler":   {"host": "smtp.rambler.ru",  "port": 465, "use_ssl": True,  "use_tls": False, "label": "Rambler",           "hint": "Используй обычный пароль от почты"},
    "yandex360": {"host": "smtp.yandex.ru",   "port": 465, "use_ssl": True,  "use_tls": False, "label": "Яндекс 360 (бизнес)", "hint": "Пароль приложения в админке Яндекс 360"},
    "vk":        {"host": "smtp.mail.ru",     "port": 465, "use_ssl": True,  "use_tls": False, "label": "VK Mail (My.com)",  "hint": "Пароль внешнего приложения"},
    "custom":    {"host": "",                 "port": 587, "use_ssl": False, "use_tls": True,  "label": "Свой SMTP",         "hint": "Введи параметры твоего SMTP-сервера"},
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def get_active_smtp(conn):
    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, smtp_host, smtp_port, use_tls, use_ssl, username, password,
               from_email, from_name, provider_preset, daily_limit, test_status
        FROM {SCHEMA}.smtp_settings
        WHERE is_active = TRUE
        ORDER BY id DESC LIMIT 1
    """)
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {
        "id": row[0], "smtp_host": row[1], "smtp_port": row[2],
        "use_tls": row[3], "use_ssl": row[4],
        "username": row[5], "password": row[6],
        "from_email": row[7], "from_name": row[8],
        "provider_preset": row[9], "daily_limit": row[10],
        "test_status": row[11],
    }


def smtp_connect(cfg: dict, timeout: int = 15):
    if cfg["use_ssl"]:
        ctx = ssl.create_default_context()
        server = smtplib.SMTP_SSL(cfg["smtp_host"], cfg["smtp_port"], timeout=timeout, context=ctx)
    else:
        server = smtplib.SMTP(cfg["smtp_host"], cfg["smtp_port"], timeout=timeout)
        server.ehlo()
        if cfg["use_tls"]:
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
    server.login(cfg["username"], cfg["password"])
    return server


def build_message(cfg: dict, to: str, subject: str, html: str, text: str,
                  from_name: str = "", from_email: str = "", reply_to: str = "") -> tuple:
    sender_name = from_name or cfg.get("from_name") or "MAIL-KA"
    sender_email = from_email or cfg.get("from_email") or cfg["username"]

    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = formataddr((str(Header(sender_name, "utf-8")), sender_email))
    msg["To"] = to
    domain = cfg["smtp_host"].split(".", 1)[-1] if "." in cfg["smtp_host"] else "mailka.local"
    msg["Message-ID"] = make_msgid(domain=domain)
    if reply_to:
        msg["Reply-To"] = reply_to

    msg.attach(MIMEText(text or "", "plain", "utf-8"))
    msg.attach(MIMEText(html or "", "html", "utf-8"))
    return msg, sender_email


def send_via_smtp(cfg, to, subject, html, text, from_name="", from_email="", reply_to="") -> dict:
    if not cfg:
        return {"ok": False, "error": "SMTP не настроен. Открой Интеграции → Настроить SMTP."}
    try:
        msg, sender_email = build_message(cfg, to, subject, html, text, from_name, from_email, reply_to)
        server = smtp_connect(cfg)
        try:
            server.sendmail(sender_email, [to], msg.as_string())
        finally:
            try: server.quit()
            except Exception: pass
        return {"ok": True, "message_id": msg["Message-ID"], "provider": "Свой SMTP"}
    except smtplib.SMTPAuthenticationError as e:
        err = e.smtp_error.decode("utf-8", errors="ignore") if hasattr(e, "smtp_error") and e.smtp_error else str(e)
        return {"ok": False, "error": f"Ошибка авторизации: {err[:200]}. Для Yandex/Mail.ru/Gmail нужен пароль приложения."}
    except smtplib.SMTPRecipientsRefused as e:
        return {"ok": False, "error": f"Получатель отклонён сервером: {list(e.recipients.keys())}"}
    except smtplib.SMTPException as e:
        return {"ok": False, "error": f"SMTP: {str(e)[:300]}"}
    except (OSError, ssl.SSLError) as e:
        return {"ok": False, "error": f"Сеть/SSL: {str(e)[:200]}"}
    except Exception as ex:
        return {"ok": False, "error": f"Ошибка: {str(ex)[:300]}"}


def test_connection(cfg) -> dict:
    try:
        server = smtp_connect(cfg, timeout=10)
        server.quit()
        return {"ok": True, "message": "Подключение успешно. Можно отправлять письма."}
    except smtplib.SMTPAuthenticationError:
        return {"ok": False, "error": "Неверный логин или пароль. Для Yandex/Mail.ru/Gmail используй пароль приложения."}
    except smtplib.SMTPException as e:
        return {"ok": False, "error": f"SMTP: {str(e)[:300]}"}
    except (OSError, ssl.SSLError) as e:
        return {"ok": False, "error": f"Не удаётся подключиться: {str(e)[:200]}"}
    except Exception as ex:
        return {"ok": False, "error": str(ex)[:300]}


def substitute_vars(text: str, contact: dict) -> str:
    name_parts = (contact.get("name") or "").split()
    repl = {
        "{{first_name}}": name_parts[0] if name_parts else "",
        "{{last_name}}":  name_parts[1] if len(name_parts) > 1 else "",
        "{{email}}":      contact.get("email", ""),
        "{{segment}}":    contact.get("segment", ""),
        "{{company_name}}": "MAIL-KA",
        "{{expire_date}}":  "31 мая 2026",
    }
    for k, v in repl.items():
        text = text.replace(k, v)
    return text


def text_to_html(text: str, from_name: str) -> str:
    paragraphs = "".join(
        f"<p style='margin:0 0 16px;'>{line}</p>" if line.strip() else "<br>"
        for line in text.split("\n")
    )
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#a855f7,#22d3ee);padding:24px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">{from_name}</span>
        </td></tr>
        <tr><td style="background:#1a1a2e;border:1px solid rgba(255,255,255,0.08);border-top:none;padding:32px;border-radius:0 0 16px 16px;color:#e2e8f0;font-size:15px;line-height:1.7;">
          {paragraphs}
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
          <p style="margin:0;font-size:12px;color:#64748b;text-align:center;">
            Письмо отправлено через <strong>MAIL-KA</strong>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "POST")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "logs" if method == "GET" else "send")

    body_raw = event.get("body") or "{}"
    try:
        body = json.loads(body_raw)
    except Exception:
        body = {}

    conn = get_conn()

    # ── GET status ────────────────────────────────────────────────────────────
    if method == "GET" and action == "status":
        cfg = get_active_smtp(conn)
        if not cfg:
            conn.close()
            return resp(200, {"connected": False, "provider": "Свой SMTP",
                              "error": "SMTP не настроен. Открой Интеграции → Настроить."})
        cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE sent_at::date = CURRENT_DATE AND status = 'sent'")
        today_sent = cur.fetchone()[0]
        cur.close()
        conn.close()
        return resp(200, {
            "connected": True, "provider": "Свой SMTP",
            "smtp_host": cfg["smtp_host"], "smtp_port": cfg["smtp_port"],
            "username": cfg["username"], "from_email": cfg["from_email"],
            "from_name": cfg["from_name"], "preset": cfg["provider_preset"],
            "daily_limit": cfg["daily_limit"], "today_sent": today_sent,
            "test_status": cfg["test_status"],
        })

    # ── GET presets ───────────────────────────────────────────────────────────
    if method == "GET" and action == "presets":
        conn.close()
        return resp(200, {"presets": [
            {"key": k, "label": v["label"], "host": v["host"], "port": v["port"],
             "use_ssl": v["use_ssl"], "use_tls": v["use_tls"], "hint": v["hint"]}
            for k, v in SMTP_PRESETS.items()
        ]})

    # ── GET config ────────────────────────────────────────────────────────────
    if method == "GET" and action == "config":
        cfg = get_active_smtp(conn)
        conn.close()
        if not cfg:
            return resp(200, {"config": None})
        safe = {k: v for k, v in cfg.items() if k != "password"}
        safe["has_password"] = bool(cfg.get("password"))
        return resp(200, {"config": safe})

    # ── GET logs ──────────────────────────────────────────────────────────────
    if method == "GET" and action == "logs":
        cur = conn.cursor()
        cur.execute(f"""
            SELECT l.id, l.to_email, l.subject, l.status, l.mailgun_id, l.error_msg, l.sent_at,
                   c.name as campaign_name
            FROM {SCHEMA}.email_logs l
            LEFT JOIN {SCHEMA}.campaigns c ON c.id = l.campaign_id
            ORDER BY l.sent_at DESC LIMIT 200
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return resp(200, {"logs": [
            {"id": r[0], "to": r[1], "subject": r[2], "status": r[3],
             "provider_id": r[4], "error": r[5], "sent_at": r[6], "campaign": r[7]}
            for r in rows
        ]})

    # ── POST config ───────────────────────────────────────────────────────────
    if action == "config" and method == "POST":
        preset_key = body.get("preset")
        smtp_host = body.get("smtp_host", "").strip()
        smtp_port = int(body.get("smtp_port", 587))
        use_tls = bool(body.get("use_tls", True))
        use_ssl = bool(body.get("use_ssl", False))
        username = body.get("username", "").strip()
        password = body.get("password", "")
        from_email = body.get("from_email", "").strip() or username
        from_name = body.get("from_name", "MAIL-KA").strip() or "MAIL-KA"
        daily_limit = int(body.get("daily_limit", 500))

        if preset_key and preset_key in SMTP_PRESETS and preset_key != "custom":
            p = SMTP_PRESETS[preset_key]
            smtp_host = p["host"]
            smtp_port = p["port"]
            use_ssl = p["use_ssl"]
            use_tls = p["use_tls"]

        if not smtp_host or not username or not password:
            conn.close()
            return resp(400, {"error": "Заполни сервер, логин и пароль"})

        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.smtp_settings SET is_active = FALSE")
        cur.execute(
            f"""INSERT INTO {SCHEMA}.smtp_settings
                (is_active, provider_preset, smtp_host, smtp_port, use_tls, use_ssl,
                 username, password, from_email, from_name, daily_limit, updated_at)
                VALUES (TRUE, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                RETURNING id""",
            (preset_key, smtp_host, smtp_port, use_tls, use_ssl,
             username, password, from_email, from_name, daily_limit)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return resp(200, {"ok": True, "id": new_id})

    # ── POST test_smtp ────────────────────────────────────────────────────────
    if action == "test_smtp" and method == "POST":
        cfg = get_active_smtp(conn)
        if not cfg:
            conn.close()
            return resp(400, {"ok": False, "error": "Сначала сохрани настройки SMTP"})
        result = test_connection(cfg)
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.smtp_settings SET test_status = %s, test_error = %s, tested_at = NOW() WHERE id = %s",
            ("ok" if result["ok"] else "failed", result.get("error"), cfg["id"])
        )
        conn.commit()
        cur.close()
        conn.close()
        return resp(200, result)

    # ── POST test (тест-письмо) ───────────────────────────────────────────────
    if action == "test" and method == "POST":
        to = body.get("to", "").strip()
        subject = body.get("subject", "Тестовое письмо от MAIL-KA")
        text = body.get("text", "Это тестовое письмо. Если ты его видишь — собственный SMTP-движок MAIL-KA работает!")
        from_name = body.get("from_name", "")

        if not to:
            conn.close()
            return resp(400, {"error": "Укажи email получателя"})

        cfg = get_active_smtp(conn)
        if not cfg:
            conn.close()
            return resp(400, {"error": "SMTP не настроен"})

        html = text_to_html(text, from_name or cfg["from_name"])
        result = send_via_smtp(cfg, to, subject, html, text, from_name)

        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.email_logs (to_email, subject, status, mailgun_id, error_msg) VALUES (%s, %s, %s, %s, %s)",
            (to, subject, "sent" if result["ok"] else "failed", result.get("message_id"), result.get("error"))
        )
        conn.commit()
        cur.close()
        conn.close()
        return resp(200 if result["ok"] else 502, result)

    # ── POST send ─────────────────────────────────────────────────────────────
    if action in ("send", ""):
        to = body.get("to", "").strip()
        subject = body.get("subject", "")
        text = body.get("text") or body.get("body", "")
        from_name = body.get("from_name", "")
        from_email = body.get("from_email", "")
        reply_to = body.get("reply_to", "")
        campaign_id = body.get("campaign_id")

        if not to or not subject:
            conn.close()
            return resp(400, {"error": "Обязательные поля: to, subject"})

        cfg = get_active_smtp(conn)
        if not cfg:
            conn.close()
            return resp(400, {"ok": False, "error": "SMTP не настроен"})

        cur = conn.cursor()
        cur.execute(f"SELECT id, name, email, segment FROM {SCHEMA}.contacts WHERE email = %s", (to,))
        cr = cur.fetchone()
        contact = {"name": "", "email": to, "segment": ""}
        contact_id = None
        if cr:
            contact_id = cr[0]
            contact = {"name": cr[1], "email": cr[2], "segment": cr[3]}

        ptext = substitute_vars(text, contact)
        psubj = substitute_vars(subject, contact)
        html = text_to_html(ptext, from_name or cfg["from_name"])

        result = send_via_smtp(cfg, to, psubj, html, ptext, from_name, from_email, reply_to)

        cur.execute(
            f"INSERT INTO {SCHEMA}.email_logs (campaign_id, contact_id, to_email, subject, status, mailgun_id, error_msg) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (campaign_id, contact_id, to, psubj,
             "sent" if result["ok"] else "failed", result.get("message_id"), result.get("error"))
        )
        if campaign_id and result["ok"]:
            cur.execute(f"UPDATE {SCHEMA}.campaigns SET sent_count = sent_count + 1 WHERE id = %s", (campaign_id,))
        conn.commit()
        cur.close()
        conn.close()
        return resp(200 if result["ok"] else 502, result)

    # ── POST blast ────────────────────────────────────────────────────────────
    if action == "blast" and method == "POST":
        campaign_id = body.get("campaign_id")
        segment_filter = body.get("segment")

        if not campaign_id:
            conn.close()
            return resp(400, {"error": "Укажи campaign_id"})

        cfg = get_active_smtp(conn)
        if not cfg:
            conn.close()
            return resp(400, {"error": "SMTP не настроен"})

        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, subject, body_text, from_name, from_email, reply_to FROM {SCHEMA}.campaigns WHERE id = %s",
            (campaign_id,)
        )
        camp = cur.fetchone()
        if not camp:
            cur.close()
            conn.close()
            return resp(404, {"error": "Кампания не найдена"})

        camp_data = {
            "id": camp[0], "name": camp[1], "subject": camp[2] or "",
            "body": camp[3] or "", "from_name": camp[4] or cfg["from_name"],
            "from_email": camp[5] or "", "reply_to": camp[6] or ""
        }
        if not camp_data["subject"] or not camp_data["body"]:
            cur.close()
            conn.close()
            return resp(400, {"error": "У кампании нет темы или текста. Заполни в редакторе."})

        if segment_filter:
            cur.execute(f"SELECT id, name, email, segment FROM {SCHEMA}.contacts WHERE status = 'active' AND segment = %s", (segment_filter,))
        else:
            cur.execute(f"SELECT id, name, email, segment FROM {SCHEMA}.contacts WHERE status = 'active'")
        contacts = cur.fetchall()

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE sent_at::date = CURRENT_DATE AND status = 'sent'")
        today_already = cur.fetchone()[0]
        remaining = max(0, cfg["daily_limit"] - today_already)
        if remaining <= 0:
            cur.close()
            conn.close()
            return resp(429, {"error": f"Дневной лимит ({cfg['daily_limit']}) исчерпан"})

        sent = 0
        failed = 0
        errors_list = []
        try:
            server = smtp_connect(cfg, timeout=20)
        except Exception as ex:
            cur.close()
            conn.close()
            return resp(500, {"error": f"Не удалось подключиться к SMTP: {str(ex)[:300]}"})

        sender_name = camp_data["from_name"] or cfg["from_name"]
        sender_email = camp_data["from_email"] or cfg["from_email"] or cfg["username"]

        for c in contacts[:remaining]:
            contact = {"name": c[1], "email": c[2], "segment": c[3]}
            ptext = substitute_vars(camp_data["body"], contact)
            psubj = substitute_vars(camp_data["subject"], contact)
            html = text_to_html(ptext, sender_name)

            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = Header(psubj, "utf-8")
                msg["From"] = formataddr((str(Header(sender_name, "utf-8")), sender_email))
                msg["To"] = c[2]
                msg["Message-ID"] = make_msgid(domain="mailka.local")
                if camp_data["reply_to"]:
                    msg["Reply-To"] = camp_data["reply_to"]
                msg.attach(MIMEText(ptext, "plain", "utf-8"))
                msg.attach(MIMEText(html, "html", "utf-8"))

                server.sendmail(sender_email, [c[2]], msg.as_string())
                cur.execute(
                    f"INSERT INTO {SCHEMA}.email_logs (campaign_id, contact_id, to_email, subject, status, mailgun_id) VALUES (%s, %s, %s, %s, 'sent', %s)",
                    (campaign_id, c[0], c[2], psubj, msg["Message-ID"])
                )
                sent += 1
            except Exception as ex:
                err_msg = str(ex)[:300]
                cur.execute(
                    f"INSERT INTO {SCHEMA}.email_logs (campaign_id, contact_id, to_email, subject, status, error_msg) VALUES (%s, %s, %s, %s, 'failed', %s)",
                    (campaign_id, c[0], c[2], psubj, err_msg)
                )
                failed += 1
                errors_list.append({"email": c[2], "error": err_msg})

        try: server.quit()
        except Exception: pass

        cur.execute(
            f"UPDATE {SCHEMA}.campaigns SET sent_count = sent_count + %s, status = 'sent', sent_at = NOW() WHERE id = %s",
            (sent, campaign_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        return resp(200, {
            "ok": True, "campaign": camp_data["name"],
            "total": len(contacts), "sent": sent, "failed": failed,
            "errors": errors_list[:10],
            "skipped_due_to_limit": max(0, len(contacts) - remaining),
        })

    conn.close()
    return resp(404, {"error": f"Неизвестный action: {action}"})
