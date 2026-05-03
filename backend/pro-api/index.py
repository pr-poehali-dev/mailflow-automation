"""
Pro API MAIL-KA: шаблоны, автоматизации, A/B-тесты, suppression list, прогрев домена.
Все операции требуют авторизации (X-Auth-Token), данные изолированы по user_id.

Эндпоинты (все через ?resource=...):
  templates       GET/POST/PUT/DELETE — библиотека шаблонов
  automations     GET/POST/PUT/DELETE — automation flows (визуальные сценарии)
  ab_tests        GET/POST/PUT       — A/B-тесты
  suppressions    GET/POST/DELETE    — список запрещённых адресов
  warmup          GET/POST           — расписание прогрева домена
  contact_score   GET                — engagement score контактов
  global_stats    GET                — сводная статистика по аккаунту
"""
import json
import os
import hashlib
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

ALLOWED_ORIGINS = {
    "https://mail-ka.ru",
    "https://www.mail-ka.ru",
    "https://preview--mailflow-automation.poehali.dev",
    "https://mailflow-automation.poehali.dev",
    "http://localhost:5173",
    "http://localhost:3000",
}


def cors_headers(event: dict) -> dict:
    headers = event.get("headers") or {}
    origin = headers.get("Origin") or headers.get("origin") or ""
    allow_origin = origin if origin in ALLOWED_ORIGINS else "https://mail-ka.ru"
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-CSRF-Token",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    }


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict, event: dict) -> dict:
    return {
        "statusCode": status,
        "headers": cors_headers(event),
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


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
        return None, resp(401, {"error": "Сессия истекла или недействительна"}, event)
    return row[0], None


def handler(event: dict, context) -> dict:
    """Pro API: шаблоны, автоматизации, A/B-тесты, прогрев. Все операции изолированы по user_id."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(event), "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    resource = qs.get("resource", "")
    item_id = qs.get("id")

    body_raw = event.get("body") or "{}"
    try:
        body = json.loads(body_raw)
    except Exception:
        body = {}

    conn = get_conn()
    user_id, err = require_user(event, conn)
    if err:
        conn.close()
        return err

    try:
        # ── TEMPLATES ─────────────────────────────────────────────────────────
        if resource == "templates":
            if method == "GET":
                cur = conn.cursor()
                # Системные шаблоны (user_id IS NULL и is_system = TRUE) + свои
                cur.execute(
                    f"""SELECT id, name, category, subject, preheader, body_text, body_html,
                        preview_emoji, uses_count, is_system, created_at
                        FROM {SCHEMA}.email_templates
                        WHERE user_id = %s OR (is_system = TRUE AND user_id IS NULL)
                        ORDER BY is_system DESC, uses_count DESC, id DESC""",
                    (user_id,),
                )
                rows = cur.fetchall()
                cur.close()
                return resp(200, {"templates": [
                    {"id": r[0], "name": r[1], "category": r[2], "subject": r[3],
                     "preheader": r[4], "body_text": r[5], "body_html": r[6],
                     "preview_emoji": r[7], "uses_count": r[8], "is_system": r[9],
                     "created_at": r[10]} for r in rows
                ]}, event)
            if method == "POST":
                cur = conn.cursor()
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.email_templates
                        (user_id, name, category, subject, preheader, body_text, preview_emoji)
                        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (user_id,
                     (body.get("name") or "Новый шаблон")[:255],
                     (body.get("category") or "Свой")[:100],
                     (body.get("subject") or "")[:500],
                     (body.get("preheader") or "")[:500],
                     body.get("body_text") or "",
                     (body.get("preview_emoji") or "✉️")[:8]),
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                cur.close()
                return resp(201, {"ok": True, "id": new_id}, event)
            if method == "PUT" and item_id:
                cur = conn.cursor()
                # Только свои шаблоны можно редактировать
                cur.execute(
                    f"""UPDATE {SCHEMA}.email_templates SET
                        name = COALESCE(%s, name),
                        subject = COALESCE(%s, subject),
                        body_text = COALESCE(%s, body_text),
                        preheader = COALESCE(%s, preheader),
                        category = COALESCE(%s, category)
                        WHERE id = %s AND user_id = %s""",
                    (body.get("name"), body.get("subject"), body.get("body_text"),
                     body.get("preheader"), body.get("category"),
                     int(item_id), user_id),
                )
                affected = cur.rowcount
                conn.commit()
                cur.close()
                if affected == 0:
                    return resp(404, {"error": "Шаблон не найден"}, event)
                return resp(200, {"ok": True}, event)
            if method == "DELETE" and item_id:
                cur = conn.cursor()
                cur.execute(
                    f"DELETE FROM {SCHEMA}.email_templates "
                    f"WHERE id = %s AND user_id = %s AND is_system = FALSE",
                    (int(item_id), user_id),
                )
                affected = cur.rowcount
                conn.commit()
                cur.close()
                if affected == 0:
                    return resp(404, {"error": "Шаблон не найден или системный"}, event)
                return resp(200, {"ok": True}, event)

        # ── AUTOMATIONS ───────────────────────────────────────────────────────
        if resource == "automations":
            if method == "GET":
                cur = conn.cursor()
                cur.execute(
                    f"""SELECT id, name, trigger_type, trigger_config, steps, is_active,
                        total_started, total_completed, created_at
                        FROM {SCHEMA}.automation_flows
                        WHERE user_id = %s ORDER BY id DESC""",
                    (user_id,),
                )
                rows = cur.fetchall()
                cur.close()
                return resp(200, {"automations": [
                    {"id": r[0], "name": r[1], "trigger_type": r[2],
                     "trigger_config": r[3], "steps": r[4], "is_active": r[5],
                     "total_started": r[6], "total_completed": r[7], "created_at": r[8]}
                    for r in rows
                ]}, event)
            if method == "POST":
                cur = conn.cursor()
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.automation_flows
                        (user_id, name, trigger_type, trigger_config, steps, is_active)
                        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                    (user_id,
                     (body.get("name") or "Новый сценарий")[:255],
                     (body.get("trigger_type") or "subscribe")[:50],
                     json.dumps(body.get("trigger_config", {})),
                     json.dumps(body.get("steps", [])),
                     bool(body.get("is_active", False))),
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                cur.close()
                return resp(201, {"ok": True, "id": new_id}, event)
            if method == "PUT" and item_id:
                cur = conn.cursor()
                cur.execute(
                    f"""UPDATE {SCHEMA}.automation_flows SET
                        name = COALESCE(%s, name),
                        trigger_type = COALESCE(%s, trigger_type),
                        trigger_config = COALESCE(%s::jsonb, trigger_config),
                        steps = COALESCE(%s::jsonb, steps),
                        is_active = COALESCE(%s, is_active),
                        updated_at = NOW()
                        WHERE id = %s AND user_id = %s""",
                    (body.get("name"), body.get("trigger_type"),
                     json.dumps(body.get("trigger_config")) if body.get("trigger_config") is not None else None,
                     json.dumps(body.get("steps")) if body.get("steps") is not None else None,
                     body.get("is_active"), int(item_id), user_id),
                )
                affected = cur.rowcount
                conn.commit()
                cur.close()
                if affected == 0:
                    return resp(404, {"error": "Сценарий не найден"}, event)
                return resp(200, {"ok": True}, event)
            if method == "DELETE" and item_id:
                cur = conn.cursor()
                cur.execute(
                    f"UPDATE {SCHEMA}.automation_flows SET is_active = FALSE "
                    f"WHERE id = %s AND user_id = %s",
                    (int(item_id), user_id),
                )
                affected = cur.rowcount
                conn.commit()
                cur.close()
                if affected == 0:
                    return resp(404, {"error": "Сценарий не найден"}, event)
                return resp(200, {"ok": True}, event)

        # ── A/B TESTS ─────────────────────────────────────────────────────────
        if resource == "ab_tests":
            if method == "GET":
                cur = conn.cursor()
                cur.execute(
                    f"""SELECT t.id, t.name, t.campaign_id, c.name as campaign_name,
                        t.variant_a_subject, t.variant_b_subject,
                        t.split_percent, t.winner, t.status,
                        t.started_at, t.completed_at, t.created_at,
                        (SELECT COUNT(*) FROM {SCHEMA}.email_logs
                         WHERE campaign_id = t.campaign_id AND ab_variant = 'A' AND opened_at IS NOT NULL) as a_opens,
                        (SELECT COUNT(*) FROM {SCHEMA}.email_logs
                         WHERE campaign_id = t.campaign_id AND ab_variant = 'B' AND opened_at IS NOT NULL) as b_opens,
                        (SELECT COUNT(*) FROM {SCHEMA}.email_logs
                         WHERE campaign_id = t.campaign_id AND ab_variant = 'A') as a_total,
                        (SELECT COUNT(*) FROM {SCHEMA}.email_logs
                         WHERE campaign_id = t.campaign_id AND ab_variant = 'B') as b_total
                        FROM {SCHEMA}.ab_tests t
                        LEFT JOIN {SCHEMA}.campaigns c ON c.id = t.campaign_id
                        WHERE t.user_id = %s
                        ORDER BY t.id DESC""",
                    (user_id,),
                )
                rows = cur.fetchall()
                cur.close()
                return resp(200, {"ab_tests": [
                    {"id": r[0], "name": r[1], "campaign_id": r[2], "campaign_name": r[3],
                     "variant_a_subject": r[4], "variant_b_subject": r[5],
                     "split_percent": r[6], "winner": r[7], "status": r[8],
                     "started_at": r[9], "completed_at": r[10], "created_at": r[11],
                     "a_opens": r[12], "b_opens": r[13], "a_total": r[14], "b_total": r[15]}
                    for r in rows
                ]}, event)
            if method == "POST":
                campaign_id = body.get("campaign_id")
                # Проверяем, что кампания принадлежит пользователю
                if campaign_id:
                    cur = conn.cursor()
                    cur.execute(
                        f"SELECT 1 FROM {SCHEMA}.campaigns WHERE id = %s AND user_id = %s",
                        (campaign_id, user_id),
                    )
                    if not cur.fetchone():
                        cur.close()
                        return resp(404, {"error": "Кампания не найдена"}, event)
                    cur.close()
                cur = conn.cursor()
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.ab_tests
                        (user_id, name, campaign_id, variant_a_subject, variant_a_body,
                         variant_b_subject, variant_b_body, split_percent)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (user_id,
                     (body.get("name") or "A/B тест")[:255], campaign_id,
                     (body.get("variant_a_subject") or "")[:500],
                     body.get("variant_a_body") or "",
                     (body.get("variant_b_subject") or "")[:500],
                     body.get("variant_b_body") or "",
                     int(body.get("split_percent", 50))),
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                cur.close()
                return resp(201, {"ok": True, "id": new_id}, event)
            if method == "PUT" and item_id:
                cur = conn.cursor()
                cur.execute(
                    f"""UPDATE {SCHEMA}.ab_tests SET
                        winner = COALESCE(%s, winner),
                        status = COALESCE(%s, status),
                        completed_at = CASE WHEN %s = 'completed' THEN NOW() ELSE completed_at END
                        WHERE id = %s AND user_id = %s""",
                    (body.get("winner"), body.get("status"), body.get("status"),
                     int(item_id), user_id),
                )
                affected = cur.rowcount
                conn.commit()
                cur.close()
                if affected == 0:
                    return resp(404, {"error": "A/B тест не найден"}, event)
                return resp(200, {"ok": True}, event)

        # ── SUPPRESSION LIST ──────────────────────────────────────────────────
        if resource == "suppressions":
            if method == "GET":
                cur = conn.cursor()
                cur.execute(
                    f"""SELECT id, email, reason, details, added_at FROM {SCHEMA}.suppression_list
                        WHERE user_id = %s ORDER BY added_at DESC LIMIT 500""",
                    (user_id,),
                )
                rows = cur.fetchall()
                cur.close()
                return resp(200, {"suppressions": [
                    {"id": r[0], "email": r[1], "reason": r[2], "details": r[3], "added_at": r[4]}
                    for r in rows
                ]}, event)
            if method == "POST":
                cur = conn.cursor()
                email = (body.get("email") or "").strip().lower()[:255]
                if not email:
                    return resp(400, {"error": "email required"}, event)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.suppression_list (user_id, email, reason, details) "
                    f"VALUES (%s, %s, %s, %s) "
                    f"ON CONFLICT (email) DO NOTHING RETURNING id",
                    (user_id, email, (body.get("reason") or "manual")[:50],
                     (body.get("details") or "")[:500]),
                )
                row = cur.fetchone()
                conn.commit()
                cur.close()
                return resp(200, {"ok": True, "id": row[0] if row else None}, event)
            if method == "DELETE" and item_id:
                cur = conn.cursor()
                cur.execute(
                    f"DELETE FROM {SCHEMA}.suppression_list WHERE id = %s AND user_id = %s",
                    (int(item_id), user_id),
                )
                affected = cur.rowcount
                conn.commit()
                cur.close()
                if affected == 0:
                    return resp(404, {"error": "Запись не найдена"}, event)
                return resp(200, {"ok": True}, event)

        # ── WARMUP ────────────────────────────────────────────────────────────
        if resource == "warmup":
            if method == "GET":
                cur = conn.cursor()
                cur.execute(
                    f"SELECT id, is_active, started_at, current_day, daily_volume, target_volume, growth_percent "
                    f"FROM {SCHEMA}.warmup_schedule WHERE user_id = %s ORDER BY id DESC LIMIT 1",
                    (user_id,),
                )
                row = cur.fetchone()
                cur.close()
                if not row:
                    return resp(200, {"warmup": None}, event)
                schedule = []
                volume = row[4]
                growth = row[6] / 100.0
                for day in range(1, 31):
                    schedule.append({"day": day, "volume": int(volume)})
                    volume = min(row[5], volume * (1 + growth))
                return resp(200, {"warmup": {
                    "id": row[0], "is_active": row[1], "started_at": row[2],
                    "current_day": row[3], "daily_volume": row[4],
                    "target_volume": row[5], "growth_percent": row[6],
                    "schedule": schedule,
                }}, event)
            if method == "POST":
                cur = conn.cursor()
                cur.execute(
                    f"UPDATE {SCHEMA}.warmup_schedule SET is_active = FALSE WHERE user_id = %s",
                    (user_id,),
                )
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.warmup_schedule
                        (user_id, is_active, started_at, current_day, daily_volume, target_volume, growth_percent)
                        VALUES (%s, TRUE, NOW(), 1, %s, %s, %s) RETURNING id""",
                    (user_id,
                     int(body.get("daily_volume", 50)),
                     int(body.get("target_volume", 5000)),
                     int(body.get("growth_percent", 30))),
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                cur.close()
                return resp(201, {"ok": True, "id": new_id}, event)

        # ── CONTACT SCORE ────────────────────────────────────────────────────
        if resource == "contact_score" and method == "GET":
            cur = conn.cursor()
            cur.execute(
                f"""SELECT id, name, email, segment, engagement_score, last_opened_at, last_clicked_at
                    FROM {SCHEMA}.contacts
                    WHERE user_id = %s
                    ORDER BY engagement_score DESC LIMIT 100""",
                (user_id,),
            )
            rows = cur.fetchall()
            cur.close()
            return resp(200, {"contacts": [
                {"id": r[0], "name": r[1], "email": r[2], "segment": r[3],
                 "score": r[4], "last_opened_at": r[5], "last_clicked_at": r[6]}
                for r in rows
            ]}, event)

        # ── GLOBAL STATS ─────────────────────────────────────────────────────
        if resource == "global_stats" and method == "GET":
            cur = conn.cursor()
            cur.execute(
                f"""
                SELECT
                  (SELECT COUNT(*) FROM {SCHEMA}.contacts WHERE user_id = %s AND status = 'active') as active_contacts,
                  (SELECT COUNT(*) FROM {SCHEMA}.email_logs el
                     JOIN {SCHEMA}.campaigns c ON c.id = el.campaign_id
                     WHERE c.user_id = %s AND el.status = 'sent') as total_sent,
                  (SELECT COUNT(*) FROM {SCHEMA}.email_logs el
                     JOIN {SCHEMA}.campaigns c ON c.id = el.campaign_id
                     WHERE c.user_id = %s AND el.opened_at IS NOT NULL) as total_opened,
                  (SELECT COUNT(*) FROM {SCHEMA}.email_logs el
                     JOIN {SCHEMA}.campaigns c ON c.id = el.campaign_id
                     WHERE c.user_id = %s AND el.clicked_at IS NOT NULL) as total_clicked,
                  (SELECT COUNT(*) FROM {SCHEMA}.suppression_list WHERE user_id = %s) as suppressed,
                  (SELECT COUNT(*) FROM {SCHEMA}.automation_flows WHERE user_id = %s AND is_active = TRUE) as active_automations,
                  (SELECT COUNT(*) FROM {SCHEMA}.email_logs el
                     JOIN {SCHEMA}.campaigns c ON c.id = el.campaign_id
                     WHERE c.user_id = %s AND el.sent_at::date = CURRENT_DATE AND el.status = 'sent') as today_sent,
                  (SELECT AVG(engagement_score)::int FROM {SCHEMA}.contacts WHERE user_id = %s) as avg_score
                """,
                (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id),
            )
            s = cur.fetchone()
            cur.execute(
                f"""SELECT el.sent_at::date as d,
                       COUNT(*) FILTER (WHERE el.status='sent') as sent,
                       COUNT(*) FILTER (WHERE el.opened_at IS NOT NULL) as opened
                    FROM {SCHEMA}.email_logs el
                    JOIN {SCHEMA}.campaigns c ON c.id = el.campaign_id
                    WHERE c.user_id = %s AND el.sent_at >= CURRENT_DATE - INTERVAL '7 days'
                    GROUP BY d ORDER BY d""",
                (user_id,),
            )
            weekly = [{"date": r[0], "sent": r[1], "opened": r[2]} for r in cur.fetchall()]
            cur.close()
            return resp(200, {
                "active_contacts": s[0] or 0, "total_sent": s[1] or 0,
                "total_opened": s[2] or 0, "total_clicked": s[3] or 0,
                "suppressed": s[4] or 0, "active_automations": s[5] or 0,
                "today_sent": s[6] or 0, "avg_score": s[7] or 50,
                "open_rate": round((s[2] or 0) * 100.0 / max(s[1] or 1, 1), 1),
                "click_rate": round((s[3] or 0) * 100.0 / max(s[1] or 1, 1), 1),
                "weekly": weekly,
            }, event)

        return resp(404, {"error": f"Неизвестный resource: {resource} или метод {method}"}, event)

    finally:
        conn.close()
