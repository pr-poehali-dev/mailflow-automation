"""
Сервис отправки email через Unisender (российский) для MAIL-KA.
Поддерживает: одиночная отправка, массовая рассылка по кампании, тест-письмо.
Документация Unisender API: https://www.unisender.com/ru/support/api/
"""
import json
import os
import urllib.request
import urllib.parse
import urllib.error
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def send_via_unisender(to: str, subject: str, html: str, text: str, from_name: str, from_email: str, reply_to: str = "") -> dict:
    """Отправляет письмо через Unisender API (sendEmail)."""
    api_key = os.environ.get("UNISENDER_API_KEY", "")

    if not api_key:
        return {"ok": False, "error": "UNISENDER_API_KEY не настроен. Получи ключ на cp.unisender.com → Настройки → Интеграция и API"}

    sender_email = from_email or "noreply@mail-ka.ru"
    sender_name = from_name or "MAIL-KA"

    params = {
        "format": "json",
        "api_key": api_key,
        "email": to,
        "sender_name": sender_name,
        "sender_email": sender_email,
        "subject": subject,
        "body": html,
        "list_id": "1",
        "lang": "ru",
    }
    if reply_to:
        params["reply_to"] = reply_to

    data = urllib.parse.urlencode(params).encode("utf-8")
    url = "https://api.unisender.com/ru/api/sendEmail"

    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            result = json.loads(response.read().decode())
            if "error" in result:
                err = result.get("error", "")
                code = result.get("code", "")
                # Если list_id не существует — создаём список и пробуем снова
                if "list_id" in err.lower() or code == "invalid_arg":
                    list_id = ensure_default_list(api_key)
                    if list_id:
                        params["list_id"] = str(list_id)
                        data = urllib.parse.urlencode(params).encode("utf-8")
                        req2 = urllib.request.Request(url, data=data, method="POST")
                        req2.add_header("Content-Type", "application/x-www-form-urlencoded")
                        with urllib.request.urlopen(req2, timeout=20) as r2:
                            result = json.loads(r2.read().decode())
                            if "error" not in result:
                                msg_result = result.get("result", [{}])
                                msg_id = msg_result[0].get("id", "") if isinstance(msg_result, list) and msg_result else ""
                                return {"ok": True, "provider": "unisender", "message_id": str(msg_id)}
                return {"ok": False, "error": f"Unisender: {err} (код: {code})"}

            msg_result = result.get("result", [{}])
            if isinstance(msg_result, list) and msg_result:
                msg_id = msg_result[0].get("id", "")
                err_in = msg_result[0].get("errors")
                if err_in:
                    return {"ok": False, "error": f"Unisender: {err_in}"}
                return {"ok": True, "provider": "unisender", "message_id": str(msg_id)}
            return {"ok": True, "provider": "unisender", "message_id": ""}
    except urllib.error.HTTPError as e:
        body_err = e.read().decode()
        return {"ok": False, "error": f"Unisender HTTP {e.code}: {body_err}"}
    except Exception as ex:
        return {"ok": False, "error": f"Ошибка соединения с Unisender: {str(ex)}"}


def ensure_default_list(api_key: str) -> int:
    """Создаёт или находит дефолтный список рассылки в Unisender. Возвращает list_id."""
    try:
        # 1. Получаем существующие списки
        url = "https://api.unisender.com/ru/api/getLists"
        data = urllib.parse.urlencode({"format": "json", "api_key": api_key}).encode()
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read().decode())
            lists = result.get("result", [])
            for lst in lists:
                if lst.get("title") == "MAIL-KA":
                    return lst.get("id")

        # 2. Создаём новый
        url2 = "https://api.unisender.com/ru/api/createList"
        data2 = urllib.parse.urlencode({"format": "json", "api_key": api_key, "title": "MAIL-KA"}).encode()
        req2 = urllib.request.Request(url2, data=data2, method="POST")
        req2.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req2, timeout=10) as r:
            result = json.loads(r.read().decode())
            return result.get("result", {}).get("id", 0)
    except Exception:
        return 0


def check_unisender_balance() -> dict:
    """Проверяет баланс аккаунта Unisender."""
    api_key = os.environ.get("UNISENDER_API_KEY", "")
    if not api_key:
        return {"connected": False, "error": "UNISENDER_API_KEY не настроен"}
    try:
        url = "https://api.unisender.com/ru/api/getUserInfo"
        data = urllib.parse.urlencode({"format": "json", "api_key": api_key}).encode()
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read().decode())
            if "error" in result:
                return {"connected": False, "error": result.get("error")}
            info = result.get("result", {})
            return {
                "connected": True,
                "email": info.get("email", ""),
                "balance": info.get("balance", "0"),
                "currency": info.get("currency", "RUB"),
                "tariff": info.get("tariff", ""),
            }
    except Exception as ex:
        return {"connected": False, "error": str(ex)}


def substitute_vars(text: str, contact: dict) -> str:
    """Заменяет переменные {{first_name}} и т.д. на данные контакта."""
    name_parts = (contact.get("name") or "").split()
    replacements = {
        "{{first_name}}": name_parts[0] if name_parts else "",
        "{{last_name}}": name_parts[1] if len(name_parts) > 1 else "",
        "{{email}}": contact.get("email", ""),
        "{{segment}}": contact.get("segment", ""),
        "{{company_name}}": "MAIL-KA",
        "{{expire_date}}": "31 мая 2026",
    }
    for key, val in replacements.items():
        text = text.replace(key, val)
    return text


def text_to_html(text: str, from_name: str) -> str:
    """Конвертирует plain text в красивый HTML-email."""
    paragraphs = "".join(f"<p style='margin:0 0 16px;'>{line}</p>" if line.strip() else "<br>" for line in text.split("\n"))
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#a855f7,#22d3ee);padding:24px 32px;border-radius:16px 16px 0 0;text-align:center;">
            <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">{from_name}</span>
          </td>
        </tr>
        <tr>
          <td style="background:#1a1a2e;border:1px solid rgba(255,255,255,0.08);border-top:none;padding:32px;border-radius:0 0 16px 16px;color:#e2e8f0;font-size:15px;line-height:1.7;">
            {paragraphs}
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
            <p style="margin:0;font-size:12px;color:#64748b;text-align:center;">
              Письмо отправлено через <strong>MAIL-KA</strong>.
              <a href="#" style="color:#a855f7;">Отписаться</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


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

    # ── GET ?action=status — статус подключения к Unisender ──────────────────
    if method == "GET" and action == "status":
        info = check_unisender_balance()
        conn.close()
        return resp(200, {"provider": "Unisender", **info})

    # ── GET ?action=logs — история отправок ──────────────────────────────────
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

    # ── POST ?action=test — тест-письмо на один адрес ────────────────────────
    if action == "test":
        to = body.get("to", "")
        subject = body.get("subject", "Тестовое письмо от MAIL-KA")
        text = body.get("text", "Это тестовое письмо. Если ты его видишь — отправка работает!")
        from_name = body.get("from_name", "MAIL-KA")
        from_email = body.get("from_email", "")

        if not to:
            conn.close()
            return resp(400, {"error": "Укажи email получателя в поле 'to'"})

        html = text_to_html(text, from_name)
        result = send_via_unisender(to, subject, html, text, from_name, from_email)

        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.email_logs (to_email, subject, status, mailgun_id, error_msg) VALUES (%s, %s, %s, %s, %s)",
            (to, subject, "sent" if result["ok"] else "failed", result.get("message_id"), result.get("error"))
        )
        conn.commit()
        cur.close()
        conn.close()
        return resp(200 if result["ok"] else 502, result)

    # ── POST ?action=send — отправить одно письмо ────────────────────────────
    if action == "send" or action == "":
        to = body.get("to", "")
        subject = body.get("subject", "")
        text = body.get("text") or body.get("body", "")
        from_name = body.get("from_name", "MAIL-KA")
        from_email = body.get("from_email", "")
        reply_to = body.get("reply_to", "")
        campaign_id = body.get("campaign_id")

        if not to or not subject:
            conn.close()
            return resp(400, {"error": "Обязательные поля: to, subject"})

        # Ищем контакт для подстановки переменных
        cur = conn.cursor()
        cur.execute(f"SELECT id, name, email, segment FROM {SCHEMA}.contacts WHERE email = %s", (to,))
        contact_row = cur.fetchone()
        contact = {"name": "", "email": to, "segment": ""}
        contact_id = None
        if contact_row:
            contact_id = contact_row[0]
            contact = {"name": contact_row[1], "email": contact_row[2], "segment": contact_row[3]}

        personalized_text = substitute_vars(text, contact)
        personalized_subject = substitute_vars(subject, contact)
        html = text_to_html(personalized_text, from_name)

        result = send_via_unisender(to, personalized_subject, html, personalized_text, from_name, from_email, reply_to)

        cur.execute(
            f"INSERT INTO {SCHEMA}.email_logs (campaign_id, contact_id, to_email, subject, status, mailgun_id, error_msg) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (campaign_id, contact_id, to, personalized_subject,
             "sent" if result["ok"] else "failed", result.get("message_id"), result.get("error"))
        )
        if campaign_id and result["ok"]:
            cur.execute(f"UPDATE {SCHEMA}.campaigns SET sent_count = sent_count + 1 WHERE id = %s", (campaign_id,))
        conn.commit()
        cur.close()
        conn.close()
        return resp(200 if result["ok"] else 502, result)

    # ── POST ?action=blast — массовая рассылка по кампании ───────────────────
    if action == "blast":
        campaign_id = body.get("campaign_id")
        segment_filter = body.get("segment")  # опциональная фильтрация по сегменту

        if not campaign_id:
            conn.close()
            return resp(400, {"error": "Укажи campaign_id"})

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

        camp_data = {"id": camp[0], "name": camp[1], "subject": camp[2],
                     "body": camp[3], "from_name": camp[4] or "MAIL-KA",
                     "from_email": camp[5] or "", "reply_to": camp[6] or ""}

        if not camp_data["subject"] or not camp_data["body"]:
            cur.close()
            conn.close()
            return resp(400, {"error": "У кампании нет темы или текста письма. Заполни в редакторе."})

        # Получаем контакты (активные, не отписавшиеся)
        if segment_filter:
            cur.execute(
                f"SELECT id, name, email, segment FROM {SCHEMA}.contacts WHERE status = 'active' AND segment = %s",
                (segment_filter,)
            )
        else:
            cur.execute(
                f"SELECT id, name, email, segment FROM {SCHEMA}.contacts WHERE status = 'active'"
            )
        contacts = cur.fetchall()

        sent = 0
        failed = 0
        results = []

        for c in contacts:
            contact = {"name": c[1], "email": c[2], "segment": c[3]}
            personalized_text = substitute_vars(camp_data["body"], contact)
            personalized_subject = substitute_vars(camp_data["subject"], contact)
            html = text_to_html(personalized_text, camp_data["from_name"])

            result = send_via_unisender(
                c[2], personalized_subject, html, personalized_text,
                camp_data["from_name"], camp_data["from_email"], camp_data["reply_to"]
            )

            cur.execute(
                f"INSERT INTO {SCHEMA}.email_logs (campaign_id, contact_id, to_email, subject, status, mailgun_id, error_msg) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (campaign_id, c[0], c[2], personalized_subject,
                 "sent" if result["ok"] else "failed", result.get("message_id"), result.get("error"))
            )
            if result["ok"]:
                sent += 1
            else:
                failed += 1
                results.append({"email": c[2], "error": result.get("error")})

        # Обновляем кампанию
        cur.execute(
            f"UPDATE {SCHEMA}.campaigns SET sent_count = sent_count + %s, status = 'sent', sent_at = NOW() WHERE id = %s",
            (sent, campaign_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        return resp(200, {
            "ok": True,
            "campaign": camp_data["name"],
            "total": len(contacts),
            "sent": sent,
            "failed": failed,
            "errors": results[:10],
        })

    conn.close()
    return resp(404, {"error": f"Неизвестный action: {action}"})