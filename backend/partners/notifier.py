"""Отправка email-уведомлений админу через SMTP."""
import os
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr


def send_admin_email(subject: str, html_body: str, text_body: str = "") -> bool:
    """
    Отправка письма админу. Возвращает True/False, ошибки логирует, не падает.
    Использует секреты: NOTIFY_SMTP_HOST/PORT/USER/PASSWORD/NOTIFY_ADMIN_EMAIL.
    """
    host = os.environ.get("NOTIFY_SMTP_HOST", "").strip()
    port_str = os.environ.get("NOTIFY_SMTP_PORT", "465").strip()
    user = os.environ.get("NOTIFY_SMTP_USER", "").strip()
    password = os.environ.get("NOTIFY_SMTP_PASSWORD", "").strip()
    admin = os.environ.get("NOTIFY_ADMIN_EMAIL", "").strip()

    if not all([host, port_str, user, password, admin]):
        print(f"[notifier] SMTP не настроен (host={bool(host)}, user={bool(user)}, admin={bool(admin)})")
        return False

    try:
        port = int(port_str)
    except ValueError:
        port = 465

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr(("MAIL-KA уведомления", user))
    msg["To"] = admin
    msg.set_content(text_body or "Открой письмо в HTML-совместимом клиенте")
    msg.add_alternative(html_body, subtype="html")

    try:
        if port == 465:
            ctx = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, timeout=15, context=ctx) as s:
                s.login(user, password)
                s.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=15) as s:
                s.ehlo()
                s.starttls(context=ssl.create_default_context())
                s.ehlo()
                s.login(user, password)
                s.send_message(msg)
        print(f"[notifier] OK → {admin}")
        return True
    except Exception as e:
        print(f"[notifier] FAIL: {type(e).__name__}: {str(e)[:200]}")
        return False
