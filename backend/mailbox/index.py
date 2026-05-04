"""
Витрина «Корпоративная почта» — партнёрские ссылки и заявки.

Эндпоинты (?action=...):
  providers   GET  — список тарифов с готовыми реферальными ссылками
  click       POST — фиксация клика по тарифу (для аналитики/комиссии)
  request     POST — заявка с контактами (имя, телефон, email, домен) → менеджер свяжется
  my_orders   GET  — список своих заявок (для авторизованного)
"""
import json
import os
import hashlib
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

ALLOWED_ORIGINS = {
    "https://mail-ka.ru", "https://www.mail-ka.ru",
    "https://preview--mailflow-automation.poehali.dev",
    "https://mailflow-automation.poehali.dev",
    "http://localhost:5173", "http://localhost:3000",
}


def cors(event):
    h = event.get("headers") or {}
    o = h.get("Origin") or h.get("origin") or ""
    return {
        "Access-Control-Allow-Origin": o if o in ALLOWED_ORIGINS else "https://mail-ka.ru",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    }


def resp(s, body, event):
    return {"statusCode": s, "headers": cors(event), "body": json.dumps(body, ensure_ascii=False, default=str)}


def conn_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_id(event, conn):
    h = event.get("headers") or {}
    token = (h.get("X-Auth-Token") or h.get("x-auth-token") or "").strip()
    if not token or len(token) < 16:
        return None
    th = hashlib.sha256(token.encode()).hexdigest()
    cur = conn.cursor()
    cur.execute(
        f"SELECT us.user_id FROM {SCHEMA}.user_sessions us "
        f"JOIN {SCHEMA}.users u ON u.id = us.user_id "
        f"WHERE us.token_hash = %s AND us.revoked_at IS NULL "
        f"AND us.expires_at > NOW() AND u.is_active = TRUE",
        (th,),
    )
    r = cur.fetchone()
    cur.close()
    return r[0] if r else None


def get_ip(event):
    h = event.get("headers") or {}
    fwd = h.get("X-Forwarded-For") or h.get("x-forwarded-for") or ""
    return (fwd.split(",")[0].strip() or None)


def build_providers():
    """Каталог тарифов с подстановкой партнёрских кодов из секретов."""
    beget_aff = os.environ.get("BEGET_AFFILIATE_ID", "").strip()
    yandex_ref = os.environ.get("YANDEX360_REFERRAL_CODE", "").strip()

    def beget_url(plan: str) -> str:
        # У Beget нет отдельной страницы "почта" — почта идёт бесплатно в комплекте
        # с любым тарифом хостинга. Поэтому ведём на раздел хостинга.
        # Партнёрский PIN идёт В ПУТЬ URL: https://beget.com/pPIN
        utm = f"utm_source=mailka&utm_medium=cabinet&utm_campaign=mailbox_{plan}"
        if beget_aff:
            pin = beget_aff if beget_aff.startswith("p") else f"p{beget_aff}"
            return f"https://beget.com/{pin}?{utm}"
        return f"https://beget.com/ru/hosting?{utm}"

    def yandex_url(plan: str) -> str:
        # Если в секрете лежит полный URL (https://...) — используем его как есть.
        # Иначе — формируем стандартную ссылку на Яндекс 360.
        utm = f"utm_source=mailka&utm_medium=cabinet&utm_campaign=mailbox_{plan}"
        if yandex_ref.startswith("http://") or yandex_ref.startswith("https://"):
            sep = "&" if "?" in yandex_ref else "?"
            return f"{yandex_ref}{sep}{utm}"
        base = f"https://360.yandex.ru/business/?{utm}"
        if yandex_ref:
            base += f"&ref={yandex_ref}"
        return base

    return [
        {
            "provider": "beget",
            "name": "Beget — хостинг + почта",
            "logo_emoji": "📮",
            "country": "Россия",
            "license": "Лицензия Роскомнадзора, серверы в РФ",
            "highlight": "Почта в подарок",
            "color": "#3b82f6",
            "features": [
                "Безлимит ящиков на домене",
                "IMAP/POP3/SMTP, веб-интерфейс",
                "Антиспам и антивирус Касперского",
                "Бесплатно при заказе хостинга",
                "Поддержка 24/7 за 11 секунд",
            ],
            "plans": [
                {"code": "blog", "title": "Blog", "price_rub": 219, "period": "мес", "mailboxes": 999, "url": beget_url("blog")},
                {"code": "start", "title": "Start", "price_rub": 405, "period": "мес", "mailboxes": 999, "url": beget_url("start")},
                {"code": "noviy", "title": "Новый", "price_rub": 729, "period": "мес", "mailboxes": 999, "url": beget_url("noviy")},
            ],
            "compliant_152fz": True,
            "data_in_russia": True,
        },
        {
            "provider": "yandex360",
            "name": "Яндекс 360 для бизнеса",
            "logo_emoji": "🟡",
            "country": "Россия",
            "license": "Реестр операторов ПДн, серверы в РФ",
            "highlight": "Топ-1 в РФ",
            "color": "#facc15",
            "features": [
                "Почта + Диск 100 ГБ",
                "Календарь, Документы, Телемост",
                "DKIM/SPF/DMARC из коробки",
                "Мобильные приложения",
                "Интеграция с CRM",
            ],
            "plans": [
                {"code": "optimal", "title": "Оптимальный", "price_rub": 249, "period": "мес/польз.", "mailboxes": 1, "url": yandex_url("optimal")},
                {"code": "rastim", "title": "Растим бизнес", "price_rub": 499, "period": "мес/польз.", "mailboxes": 1, "url": yandex_url("rastim")},
                {"code": "premium", "title": "Премиум", "price_rub": 1190, "period": "мес/польз.", "mailboxes": 1, "url": yandex_url("premium")},
            ],
            "compliant_152fz": True,
            "data_in_russia": True,
        },
        {
            "provider": "vk_workspace",
            "name": "VK WorkSpace",
            "logo_emoji": "🔵",
            "country": "Россия",
            "license": "Реестр Минцифры, серверы в РФ",
            "highlight": "Корпорациям",
            "color": "#06b6d4",
            "features": [
                "Почта + Облако + Звонки",
                "Резервное копирование",
                "Двухфакторка",
                "Доступ через Active Directory",
                "Соответствие 152-ФЗ",
            ],
            "plans": [
                {"code": "start", "title": "Старт", "price_rub": 290, "period": "мес/польз.", "mailboxes": 1, "url": "https://biz.mail.ru/?utm_source=mailka&utm_medium=cabinet&utm_campaign=mailbox_start"},
                {"code": "biz", "title": "Бизнес", "price_rub": 590, "period": "мес/польз.", "mailboxes": 1, "url": "https://biz.mail.ru/?utm_source=mailka&utm_medium=cabinet&utm_campaign=mailbox_biz"},
            ],
            "compliant_152fz": True,
            "data_in_russia": True,
        },
    ]


def handler(event, context):
    """Партнёрский каталог корпоративной почты — клики и заявки на подключение."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(event), "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "providers")

    body_raw = event.get("body") or "{}"
    try:
        body = json.loads(body_raw)
    except Exception:
        body = {}

    conn = conn_db()
    try:
        if action == "providers" and method == "GET":
            return resp(200, {"providers": build_providers()}, event)

        if action == "click" and method == "POST":
            provider = (body.get("provider") or "")[:40]
            plan = (body.get("plan_code") or "")[:60]
            ref_url = (body.get("ref_url") or "")[:1000]
            if not provider:
                return resp(400, {"error": "provider required"}, event)
            uid = get_user_id(event, conn)
            ip = get_ip(event)
            ua = ((event.get("headers") or {}).get("User-Agent") or "")[:500]
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.mailbox_orders "
                f"(user_id, provider, plan_code, status, ref_url, ip_address, user_agent, utm_source) "
                f"VALUES (%s, %s, %s, 'click', %s, %s, %s, 'cabinet') RETURNING id",
                (uid, provider, plan, ref_url, ip, ua),
            )
            order_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return resp(200, {"ok": True, "order_id": order_id}, event)

        if action == "request" and method == "POST":
            uid = get_user_id(event, conn)
            provider = (body.get("provider") or "")[:40]
            plan = (body.get("plan_code") or "")[:60]
            domain = (body.get("domain") or "")[:255]
            mailboxes = int(body.get("mailboxes_count") or 1)
            mailboxes = max(1, min(mailboxes, 999))
            cname = (body.get("contact_name") or "")[:255]
            cemail = (body.get("contact_email") or "").strip().lower()[:255]
            cphone = (body.get("contact_phone") or "")[:50]
            notes = (body.get("notes") or "")[:1000]

            if "@" not in cemail or len(cemail) < 5:
                return resp(400, {"error": "Укажите корректный email для связи"}, event)
            if not provider:
                return resp(400, {"error": "provider required"}, event)

            ip = get_ip(event)
            ua = ((event.get("headers") or {}).get("User-Agent") or "")[:500]
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.mailbox_orders "
                f"(user_id, provider, plan_code, domain, mailboxes_count, "
                f"contact_email, contact_name, contact_phone, status, "
                f"ip_address, user_agent, utm_source, notes) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'request', %s, %s, 'cabinet', %s) "
                f"RETURNING id",
                (uid, provider, plan, domain, mailboxes,
                 cemail, cname, cphone, ip, ua, notes),
            )
            order_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return resp(200, {
                "ok": True,
                "order_id": order_id,
                "message": "Заявка принята. Менеджер свяжется в течение рабочего дня."
            }, event)

        if action == "my_orders" and method == "GET":
            uid = get_user_id(event, conn)
            if not uid:
                return resp(401, {"error": "Требуется авторизация"}, event)
            cur = conn.cursor()
            cur.execute(
                f"SELECT id, provider, plan_code, domain, mailboxes_count, "
                f"status, contact_email, created_at "
                f"FROM {SCHEMA}.mailbox_orders WHERE user_id = %s "
                f"ORDER BY created_at DESC LIMIT 50",
                (uid,),
            )
            rows = cur.fetchall()
            cur.close()
            return resp(200, {"orders": [
                {"id": r[0], "provider": r[1], "plan_code": r[2], "domain": r[3],
                 "mailboxes_count": r[4], "status": r[5],
                 "contact_email": r[6], "created_at": r[7]}
                for r in rows
            ]}, event)

        return resp(404, {"error": f"Неизвестный action: {action}"}, event)
    finally:
        conn.close()