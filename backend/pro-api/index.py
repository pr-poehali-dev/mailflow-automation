"""
Pro API MAIL-KA: шаблоны, автоматизации, A/B-тесты, suppression list, прогрев домена.

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
import psycopg2

SCHEMA = "t_p46602131_mailflow_automation"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS,
            "body": json.dumps(body, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

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

    # ── TEMPLATES ─────────────────────────────────────────────────────────────
    if resource == "templates":
        if method == "GET":
            cur = conn.cursor()
            cur.execute(f"""SELECT id, name, category, subject, preheader, body_text, body_html,
                            preview_emoji, uses_count, is_system, created_at
                            FROM {SCHEMA}.email_templates ORDER BY is_system DESC, uses_count DESC, id DESC""")
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return resp(200, {"templates": [
                {"id": r[0], "name": r[1], "category": r[2], "subject": r[3],
                 "preheader": r[4], "body_text": r[5], "body_html": r[6],
                 "preview_emoji": r[7], "uses_count": r[8], "is_system": r[9],
                 "created_at": r[10]} for r in rows
            ]})
        if method == "POST":
            cur = conn.cursor()
            cur.execute(
                f"""INSERT INTO {SCHEMA}.email_templates
                    (name, category, subject, preheader, body_text, preview_emoji)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                (body.get("name", "Новый шаблон"), body.get("category", "Свой"),
                 body.get("subject", ""), body.get("preheader", ""),
                 body.get("body_text", ""), body.get("preview_emoji", "✉️"))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return resp(201, {"ok": True, "id": new_id})
        if method == "PUT" and item_id:
            cur = conn.cursor()
            cur.execute(
                f"""UPDATE {SCHEMA}.email_templates SET
                    name = COALESCE(%s, name),
                    subject = COALESCE(%s, subject),
                    body_text = COALESCE(%s, body_text),
                    preheader = COALESCE(%s, preheader),
                    category = COALESCE(%s, category)
                    WHERE id = %s""",
                (body.get("name"), body.get("subject"), body.get("body_text"),
                 body.get("preheader"), body.get("category"), item_id)
            )
            conn.commit()
            cur.close()
            conn.close()
            return resp(200, {"ok": True})
        if method == "DELETE" and item_id:
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.email_templates SET name = name WHERE id = %s AND is_system = TRUE", (item_id,))
            cur.execute(f"DELETE FROM {SCHEMA}.email_templates WHERE id = %s AND is_system = FALSE", (item_id,))
            conn.commit()
            cur.close()
            conn.close()
            return resp(200, {"ok": True})

    # ── AUTOMATIONS ───────────────────────────────────────────────────────────
    if resource == "automations":
        if method == "GET":
            cur = conn.cursor()
            cur.execute(f"""SELECT id, name, trigger_type, trigger_config, steps, is_active,
                            total_started, total_completed, created_at
                            FROM {SCHEMA}.automation_flows ORDER BY id DESC""")
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return resp(200, {"automations": [
                {"id": r[0], "name": r[1], "trigger_type": r[2],
                 "trigger_config": r[3], "steps": r[4], "is_active": r[5],
                 "total_started": r[6], "total_completed": r[7], "created_at": r[8]}
                for r in rows
            ]})
        if method == "POST":
            cur = conn.cursor()
            cur.execute(
                f"""INSERT INTO {SCHEMA}.automation_flows
                    (name, trigger_type, trigger_config, steps, is_active)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (body.get("name", "Новый сценарий"),
                 body.get("trigger_type", "subscribe"),
                 json.dumps(body.get("trigger_config", {})),
                 json.dumps(body.get("steps", [])),
                 body.get("is_active", False))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return resp(201, {"ok": True, "id": new_id})
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
                    WHERE id = %s""",
                (body.get("name"), body.get("trigger_type"),
                 json.dumps(body.get("trigger_config")) if body.get("trigger_config") is not None else None,
                 json.dumps(body.get("steps")) if body.get("steps") is not None else None,
                 body.get("is_active"), item_id)
            )
            conn.commit()
            cur.close()
            conn.close()
            return resp(200, {"ok": True})
        if method == "DELETE" and item_id:
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.automation_flows SET is_active = FALSE WHERE id = %s", (item_id,))
            conn.commit()
            cur.close()
            conn.close()
            return resp(200, {"ok": True})

    # ── A/B TESTS ─────────────────────────────────────────────────────────────
    if resource == "ab_tests":
        if method == "GET":
            cur = conn.cursor()
            cur.execute(f"""SELECT t.id, t.name, t.campaign_id, c.name as campaign_name,
                            t.variant_a_subject, t.variant_b_subject,
                            t.split_percent, t.winner, t.status,
                            t.started_at, t.completed_at, t.created_at,
                            (SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE campaign_id = t.campaign_id AND ab_variant = 'A' AND opened_at IS NOT NULL) as a_opens,
                            (SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE campaign_id = t.campaign_id AND ab_variant = 'B' AND opened_at IS NOT NULL) as b_opens,
                            (SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE campaign_id = t.campaign_id AND ab_variant = 'A') as a_total,
                            (SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE campaign_id = t.campaign_id AND ab_variant = 'B') as b_total
                            FROM {SCHEMA}.ab_tests t
                            LEFT JOIN {SCHEMA}.campaigns c ON c.id = t.campaign_id
                            ORDER BY t.id DESC""")
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return resp(200, {"ab_tests": [
                {"id": r[0], "name": r[1], "campaign_id": r[2], "campaign_name": r[3],
                 "variant_a_subject": r[4], "variant_b_subject": r[5],
                 "split_percent": r[6], "winner": r[7], "status": r[8],
                 "started_at": r[9], "completed_at": r[10], "created_at": r[11],
                 "a_opens": r[12], "b_opens": r[13],
                 "a_total": r[14], "b_total": r[15]}
                for r in rows
            ]})
        if method == "POST":
            cur = conn.cursor()
            cur.execute(
                f"""INSERT INTO {SCHEMA}.ab_tests
                    (name, campaign_id, variant_a_subject, variant_a_body,
                     variant_b_subject, variant_b_body, split_percent)
                    VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (body.get("name", "A/B тест"), body.get("campaign_id"),
                 body.get("variant_a_subject", ""), body.get("variant_a_body", ""),
                 body.get("variant_b_subject", ""), body.get("variant_b_body", ""),
                 body.get("split_percent", 50))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return resp(201, {"ok": True, "id": new_id})
        if method == "PUT" and item_id:
            cur = conn.cursor()
            cur.execute(
                f"""UPDATE {SCHEMA}.ab_tests SET
                    winner = COALESCE(%s, winner),
                    status = COALESCE(%s, status),
                    completed_at = CASE WHEN %s = 'completed' THEN NOW() ELSE completed_at END
                    WHERE id = %s""",
                (body.get("winner"), body.get("status"), body.get("status"), item_id)
            )
            conn.commit()
            cur.close()
            conn.close()
            return resp(200, {"ok": True})

    # ── SUPPRESSION LIST ──────────────────────────────────────────────────────
    if resource == "suppressions":
        if method == "GET":
            cur = conn.cursor()
            cur.execute(f"""SELECT id, email, reason, details, added_at FROM {SCHEMA}.suppression_list ORDER BY added_at DESC LIMIT 500""")
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return resp(200, {"suppressions": [
                {"id": r[0], "email": r[1], "reason": r[2], "details": r[3], "added_at": r[4]}
                for r in rows
            ]})
        if method == "POST":
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.suppression_list (email, reason, details) VALUES (%s, %s, %s) ON CONFLICT (email) DO NOTHING RETURNING id",
                (body.get("email", "").strip().lower(), body.get("reason", "manual"), body.get("details", ""))
            )
            row = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            return resp(200, {"ok": True, "id": row[0] if row else None})
        if method == "DELETE" and item_id:
            cur = conn.cursor()
            cur.execute(f"DELETE FROM {SCHEMA}.suppression_list WHERE id = %s", (item_id,))
            conn.commit()
            cur.close()
            conn.close()
            return resp(200, {"ok": True})

    # ── WARMUP ────────────────────────────────────────────────────────────────
    if resource == "warmup":
        if method == "GET":
            cur = conn.cursor()
            cur.execute(f"SELECT id, is_active, started_at, current_day, daily_volume, target_volume, growth_percent FROM {SCHEMA}.warmup_schedule ORDER BY id DESC LIMIT 1")
            row = cur.fetchone()
            cur.close()
            conn.close()
            if not row:
                return resp(200, {"warmup": None})
            # Расчёт расписания на 30 дней
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
            }})
        if method == "POST":
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.warmup_schedule SET is_active = FALSE")
            cur.execute(
                f"""INSERT INTO {SCHEMA}.warmup_schedule
                    (is_active, started_at, current_day, daily_volume, target_volume, growth_percent)
                    VALUES (TRUE, NOW(), 1, %s, %s, %s) RETURNING id""",
                (body.get("daily_volume", 50),
                 body.get("target_volume", 5000),
                 body.get("growth_percent", 30))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return resp(201, {"ok": True, "id": new_id})

    # ── CONTACT SCORE ────────────────────────────────────────────────────────
    if resource == "contact_score" and method == "GET":
        cur = conn.cursor()
        cur.execute(f"""SELECT id, name, email, segment, engagement_score, last_opened_at, last_clicked_at
                        FROM {SCHEMA}.contacts ORDER BY engagement_score DESC LIMIT 100""")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return resp(200, {"contacts": [
            {"id": r[0], "name": r[1], "email": r[2], "segment": r[3],
             "score": r[4], "last_opened_at": r[5], "last_clicked_at": r[6]}
            for r in rows
        ]})

    # ── GLOBAL STATS ─────────────────────────────────────────────────────────
    if resource == "global_stats" and method == "GET":
        cur = conn.cursor()
        cur.execute(f"""
            SELECT
              (SELECT COUNT(*) FROM {SCHEMA}.contacts WHERE status = 'active') as active_contacts,
              (SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE status = 'sent') as total_sent,
              (SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE opened_at IS NOT NULL) as total_opened,
              (SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE clicked_at IS NOT NULL) as total_clicked,
              (SELECT COUNT(*) FROM {SCHEMA}.suppression_list) as suppressed,
              (SELECT COUNT(*) FROM {SCHEMA}.automation_flows WHERE is_active = TRUE) as active_automations,
              (SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE sent_at::date = CURRENT_DATE AND status = 'sent') as today_sent,
              (SELECT AVG(engagement_score)::int FROM {SCHEMA}.contacts) as avg_score
        """)
        s = cur.fetchone()
        # Динамика за 7 дней
        cur.execute(f"""
            SELECT sent_at::date as d, COUNT(*) FILTER (WHERE status='sent') as sent,
                   COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened
            FROM {SCHEMA}.email_logs
            WHERE sent_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY d ORDER BY d
        """)
        weekly = [{"date": r[0], "sent": r[1], "opened": r[2]} for r in cur.fetchall()]
        cur.close()
        conn.close()
        return resp(200, {
            "active_contacts": s[0] or 0, "total_sent": s[1] or 0,
            "total_opened": s[2] or 0, "total_clicked": s[3] or 0,
            "suppressed": s[4] or 0, "active_automations": s[5] or 0,
            "today_sent": s[6] or 0, "avg_score": s[7] or 50,
            "open_rate": round((s[2] or 0) * 100.0 / max(s[1] or 1, 1), 1),
            "click_rate": round((s[3] or 0) * 100.0 / max(s[1] or 1, 1), 1),
            "weekly": weekly,
        })

    conn.close()
    return resp(404, {"error": f"Неизвестный resource: {resource} или метод {method}"})
