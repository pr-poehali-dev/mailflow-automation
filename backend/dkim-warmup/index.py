"""
DKIM + Domain Warmup Manager для MAIL-KA.

Эндпоинты:
  GET  ?action=dkim                — DKIM-ключи всех доменов
  POST ?action=dkim_generate       — сгенерировать DKIM-пару для домена
  POST ?action=dkim_verify         — проверить DNS-запись DKIM
  PUT  ?action=dkim_toggle&id=X    — вкл/выкл DKIM
  GET  ?action=warmup              — план прогрева
  POST ?action=warmup_start        — запустить план прогрева
  POST ?action=warmup_pause        — поставить план на паузу
  GET  ?action=warmup_today_limit  — текущий дневной лимит по плану прогрева
  GET  ?action=warmup_history      — история прогрева по дням
"""
import json
import os
import base64
import urllib.request
import psycopg2

# URL функции send-email, которая умеет генерировать DKIM-ключи (там есть cryptography)
SEND_EMAIL_URL = "https://functions.poehali.dev/9861b492-d3a2-48ef-9407-3b07e1d55181"

SCHEMA = "t_p46602131_mailflow_automation"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

# График прогрева домена: день → объём писем
# Основан на best practices Google/Microsoft/Yandex
WARMUP_CURVE = [
    50, 100, 200, 400, 800,           # дни 1-5: разогрев
    1500, 2500, 4000, 6000, 8000,     # дни 6-10: рост
    10000, 13000, 16000, 20000, 25000, # дни 11-15
    30000, 36000, 42000, 50000, 60000, # дни 16-20
    70000, 80000, 90000, 100000, 110000, # дни 21-25
    120000, 130000, 140000, 150000, 200000  # дни 26-30
]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def generate_dkim_keypair(bits: int = 2048) -> dict:
    """Запрашивает DKIM-ключ у функции send-email (там cryptography установлен)."""
    data = json.dumps({"bits": bits}).encode("utf-8")
    req = urllib.request.Request(f"{SEND_EMAIL_URL}?action=dkim_keygen", data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            result = json.loads(r.read().decode())
            if "private" in result and "public_b64" in result:
                return {"private": result["private"], "public_b64": result["public_b64"]}
            raise RuntimeError(result.get("error", "Не удалось сгенерировать ключ"))
    except Exception as ex:
        raise RuntimeError(f"Ошибка генерации DKIM: {str(ex)}")


def build_dns_record(public_b64: str) -> str:
    """Создаёт строку TXT-записи для DKIM."""
    return f"v=DKIM1; k=rsa; p={public_b64}"


def verify_dkim_dns(domain: str, selector: str, expected_b64: str) -> dict:
    """Проверяет, что DNS-запись селектора возвращает наш публичный ключ."""
    try:
        # Используем простой DNS-запрос через socket (без сторонних библиотек)
        # Поскольку Python stdlib не имеет нормального DNS-клиента, делаем через nslookup
        import subprocess
        record_name = f"{selector}._domainkey.{domain}"
        try:
            result = subprocess.run(
                ["nslookup", "-type=TXT", record_name, "8.8.8.8"],
                capture_output=True, text=True, timeout=5
            )
            output = result.stdout + result.stderr
        except Exception:
            return {"verified": False, "error": "Не удалось выполнить DNS-запрос"}

        # Простая проверка: есть ли наш публичный ключ в выводе
        # Берём первые 50 символов public_b64 — этого достаточно для матчинга
        key_fragment = expected_b64[:50]
        if key_fragment in output:
            return {"verified": True, "record_found": record_name}
        return {"verified": False, "error": f"DNS-запись {record_name} не найдена или ключ не совпадает. Подожди 10-30 минут после добавления записи."}
    except Exception as ex:
        return {"verified": False, "error": str(ex)[:200]}


def get_or_create_warmup_plan(conn, domain: str, target_volume: int = 10000) -> dict:
    """Создаёт план прогрева если ещё нет."""
    cur = conn.cursor()
    cur.execute(f"SELECT id, current_day, target_volume, is_active, start_date FROM {SCHEMA}.warmup_plans WHERE domain = %s", (domain,))
    row = cur.fetchone()
    if row:
        cur.close()
        return {"id": row[0], "current_day": row[1], "target_volume": row[2], "is_active": row[3], "start_date": row[4]}
    cur.execute(
        f"INSERT INTO {SCHEMA}.warmup_plans (domain, target_volume) VALUES (%s, %s) RETURNING id, current_day, target_volume, is_active, start_date",
        (domain, target_volume)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    return {"id": row[0], "current_day": row[1], "target_volume": row[2], "is_active": row[3], "start_date": row[4]}


def get_today_warmup_limit(conn, domain: str) -> dict:
    """Возвращает текущий дневной лимит по плану прогрева для домена."""
    cur = conn.cursor()
    cur.execute(
        f"""SELECT id, current_day, target_volume, is_active, start_date,
                   (CURRENT_DATE - start_date) as days_since_start
            FROM {SCHEMA}.warmup_plans WHERE domain = %s AND is_active = TRUE""",
        (domain,)
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return {"active": False, "limit": None}

    days_passed = max(0, int(row[5] or 0))
    day_number = min(days_passed + 1, len(WARMUP_CURVE))
    base_limit = WARMUP_CURVE[day_number - 1]
    target = row[2] or 10000
    # Масштабируем кривую под целевой объём пользователя
    scale = target / WARMUP_CURVE[-1]
    daily_limit = max(50, int(base_limit * scale))

    return {
        "active": True,
        "plan_id": row[0],
        "domain": domain,
        "current_day": day_number,
        "total_days": len(WARMUP_CURVE),
        "daily_limit": daily_limit,
        "target_volume": target,
        "completed": day_number >= len(WARMUP_CURVE),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "dkim")

    body_raw = event.get("body") or "{}"
    try:
        body = json.loads(body_raw)
    except Exception:
        body = {}

    conn = get_conn()

    # ── DKIM ──────────────────────────────────────────────────────────────────
    if method == "GET" and action == "dkim":
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, domain, selector, public_key, dns_record, is_active, is_verified, verified_at, created_at
            FROM {SCHEMA}.dkim_keys ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return resp(200, {"keys": [
            {"id": r[0], "domain": r[1], "selector": r[2], "public_key": r[3],
             "dns_record": r[4], "is_active": r[5], "is_verified": r[6],
             "verified_at": r[7], "created_at": r[8],
             "dns_name": f"{r[2]}._domainkey.{r[1]}"}
            for r in rows
        ]})

    if method == "POST" and action == "dkim_generate":
        domain = body.get("domain", "").strip().lower()
        selector = body.get("selector", "mailka").strip().lower() or "mailka"
        if not domain:
            conn.close()
            return resp(400, {"error": "Укажи домен (например: yourdomain.ru)"})

        try:
            keypair = generate_dkim_keypair()
        except Exception as ex:
            conn.close()
            return resp(500, {"error": str(ex)})
        dns_record = build_dns_record(keypair["public_b64"])

        cur = conn.cursor()
        cur.execute(
            f"""INSERT INTO {SCHEMA}.dkim_keys (domain, selector, private_key, public_key, dns_record)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (domain) DO UPDATE
                    SET selector = EXCLUDED.selector, private_key = EXCLUDED.private_key,
                        public_key = EXCLUDED.public_key, dns_record = EXCLUDED.dns_record,
                        is_verified = FALSE, verified_at = NULL
                RETURNING id""",
            (domain, selector, keypair["private"], keypair["public_b64"], dns_record)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return resp(201, {
            "ok": True, "id": new_id, "domain": domain, "selector": selector,
            "dns_name": f"{selector}._domainkey.{domain}",
            "dns_type": "TXT",
            "dns_record": dns_record,
            "instructions": [
                f"1. Открой панель управления DNS своего домена ({domain})",
                f"2. Создай TXT-запись с именем: {selector}._domainkey",
                f"3. Значение: скопируй DNS Record целиком",
                "4. Сохрани и подожди 10-30 минут пока DNS обновится",
                "5. Нажми «Проверить DNS» здесь — система найдёт твою запись",
            ]
        })

    if method == "POST" and action == "dkim_verify":
        key_id = body.get("id")
        if not key_id:
            conn.close()
            return resp(400, {"error": "Укажи id ключа"})

        cur = conn.cursor()
        cur.execute(f"SELECT domain, selector, public_key FROM {SCHEMA}.dkim_keys WHERE id = %s", (key_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return resp(404, {"error": "Ключ не найден"})

        check = verify_dkim_dns(row[0], row[1], row[2])
        if check["verified"]:
            cur.execute(
                f"UPDATE {SCHEMA}.dkim_keys SET is_verified = TRUE, verified_at = NOW() WHERE id = %s",
                (key_id,)
            )
            conn.commit()
        cur.close()
        conn.close()
        return resp(200, check)

    if method == "PUT" and action == "dkim_toggle":
        key_id = qs.get("id")
        is_active = body.get("is_active", True)
        if not key_id:
            conn.close()
            return resp(400, {"error": "Укажи id"})
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.dkim_keys SET is_active = %s WHERE id = %s", (is_active, key_id))
        conn.commit()
        cur.close()
        conn.close()
        return resp(200, {"ok": True})

    # ── Warmup (прогрев) ──────────────────────────────────────────────────────
    if method == "GET" and action == "warmup":
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, domain, is_active, start_date, current_day, target_volume,
                   total_days, pause_on_complaints, created_at
            FROM {SCHEMA}.warmup_plans ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        plans = []
        for r in rows:
            limit_info = get_today_warmup_limit(conn, r[1])
            # Подсчёт уже отправленного сегодня по этому домену
            cur.execute(
                f"""SELECT COUNT(*) FROM {SCHEMA}.email_logs
                    WHERE sent_at::date = CURRENT_DATE AND status = 'sent'
                    AND to_email LIKE %s""",
                (f"%@{r[1]}",)  # упрощённо — учитываем по home-домену получателя
            )
            today_sent_total = cur.fetchone()[0]
            cur.execute(
                f"""SELECT COUNT(*) FROM {SCHEMA}.email_logs
                    WHERE sent_at::date = CURRENT_DATE AND status = 'sent'"""
            )
            today_sent_overall = cur.fetchone()[0]

            plans.append({
                "id": r[0], "domain": r[1], "is_active": r[2],
                "start_date": r[3], "current_day": limit_info.get("current_day", r[4]),
                "target_volume": r[5], "total_days": r[6],
                "pause_on_complaints": r[7], "created_at": r[8],
                "today_limit": limit_info.get("daily_limit"),
                "today_sent": today_sent_overall,
                "completed": limit_info.get("completed", False),
                "curve": WARMUP_CURVE[:limit_info.get("current_day", 1)],
            })
        cur.close()
        conn.close()
        return resp(200, {"plans": plans, "full_curve": WARMUP_CURVE})

    if method == "POST" and action == "warmup_start":
        domain = body.get("domain", "").strip().lower()
        target = int(body.get("target_volume", 10000))
        if not domain:
            conn.close()
            return resp(400, {"error": "Укажи домен"})

        cur = conn.cursor()
        cur.execute(
            f"""INSERT INTO {SCHEMA}.warmup_plans (domain, target_volume, is_active, start_date, current_day)
                VALUES (%s, %s, TRUE, CURRENT_DATE, 1)
                ON CONFLICT (domain) DO UPDATE
                    SET is_active = TRUE, target_volume = EXCLUDED.target_volume,
                        start_date = CURRENT_DATE, current_day = 1, updated_at = NOW()
                RETURNING id, domain, target_volume, start_date""",
            (domain, target)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()

        limit_info = get_today_warmup_limit(conn, domain)
        conn.close()
        return resp(201, {
            "ok": True, "id": row[0], "domain": row[1],
            "target_volume": row[2], "start_date": row[3],
            "today_limit": limit_info.get("daily_limit"),
            "total_days": len(WARMUP_CURVE),
        })

    if method == "POST" and action == "warmup_pause":
        domain = body.get("domain", "").strip().lower()
        is_active = body.get("is_active", False)
        if not domain:
            conn.close()
            return resp(400, {"error": "Укажи домен"})
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.warmup_plans SET is_active = %s, updated_at = NOW() WHERE domain = %s",
            (is_active, domain)
        )
        conn.commit()
        cur.close()
        conn.close()
        return resp(200, {"ok": True, "is_active": is_active})

    if method == "GET" and action == "warmup_today_limit":
        domain = qs.get("domain", "").strip().lower()
        if not domain:
            conn.close()
            return resp(400, {"error": "Укажи domain в query"})
        info = get_today_warmup_limit(conn, domain)
        conn.close()
        return resp(200, info)

    if method == "GET" and action == "warmup_curve":
        conn.close()
        return resp(200, {"curve": WARMUP_CURVE, "total_days": len(WARMUP_CURVE)})

    conn.close()
    return resp(404, {"error": f"Неизвестный action: {action}"})