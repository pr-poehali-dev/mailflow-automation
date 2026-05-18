"""
Кабинет администратора MAIL-KA — ЦУП.
Доступ только для пользователей с role='admin'.
Авторизация: X-Auth-Token (та же сессия, что и в основном кабинете).

Эндпоинты (?action=...):
  overview      GET  — сводный дашборд (метрики)
  users         GET  — список всех пользователей (с пагинацией и поиском)
  user_detail   GET  — детали пользователя и его данные  ?id=N
  toggle_user   POST — активировать/деактивировать  {user_id, is_active}
  set_role      POST — изменить роль  {user_id, role}
  unlock_user   POST — снять блокировку  {user_id}
  audit_log     GET  — лог авторизаций (поиск/фильтр)
  email_logs    GET  — последние отправки писем
  campaigns     GET  — все кампании в системе
  contacts_top  GET  — топ-аккаунты по объёму контактов
  rate_limits   GET  — текущие лимиты
  health        GET  — состояние системы (БД, индексы)
  mailbox_orders      GET  — заявки на корпоративную почту (фильтры status/provider/search)
  mailbox_set_status  POST — смена статуса заявки {order_id, status}
  mailbox_set_notes   POST — заметка к заявке {order_id, notes}
  mailbox_delete      POST — удалить заявку {order_id}
  partner_apps        GET  — заявки партнёров (фильтры status/program/search)
  partner_set_status  POST — смена статуса {app_id, status}
  partner_set_notes   POST — заметка {app_id, notes}
  partner_delete      POST — удалить заявку {app_id}
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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Admin-Token",
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


def require_admin(event: dict, conn):
    """Проверяет X-Auth-Token и role='admin'. Возвращает (user_id, None) или (None, error_resp)."""
    headers = event.get("headers") or {}
    token = (headers.get("X-Auth-Token") or headers.get("x-auth-token") or "").strip()
    if not token or len(token) < 16:
        return None, resp(401, {"error": "Требуется авторизация"}, event)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    cur = conn.cursor()
    cur.execute(
        f"SELECT us.user_id, u.role FROM {SCHEMA}.user_sessions us "
        f"JOIN {SCHEMA}.users u ON u.id = us.user_id "
        f"WHERE us.token_hash = %s AND us.revoked_at IS NULL "
        f"AND us.expires_at > NOW() AND u.is_active = TRUE",
        (token_hash,),
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None, resp(401, {"error": "Сессия истекла"}, event)
    if row[1] != "admin":
        return None, resp(403, {"error": "Доступ только для администраторов"}, event)
    return row[0], None


def audit(cur, admin_id: int, action: str, target_user_id=None, details: str = ""):
    """Логирование действий админа в auth_audit_log."""
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.auth_audit_log (user_id, event_type, success, details, ip_address) "
            f"VALUES (%s, %s, TRUE, %s, %s)",
            (admin_id, f"admin.{action}",
             json.dumps({"target_user_id": target_user_id, "info": details}, ensure_ascii=False),
             None),
        )
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """ЦУП администратора: дашборд, управление пользователями, логи, бан/разбан."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(event), "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "overview")

    body_raw = event.get("body") or "{}"
    try:
        body = json.loads(body_raw)
    except Exception:
        body = {}

    conn = get_conn()
    admin_id, err = require_admin(event, conn)
    if err:
        conn.close()
        return err

    try:
        # ── OVERVIEW: общий дашборд ─────────────────────────────────────────
        if action == "overview":
            cur = conn.cursor()
            cur.execute(f"""
                SELECT
                  (SELECT COUNT(*) FROM {SCHEMA}.users) as users_total,
                  (SELECT COUNT(*) FROM {SCHEMA}.users WHERE is_active = TRUE) as users_active,
                  (SELECT COUNT(*) FROM {SCHEMA}.users WHERE is_email_verified = TRUE) as users_verified,
                  (SELECT COUNT(*) FROM {SCHEMA}.users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_week,
                  (SELECT COUNT(*) FROM {SCHEMA}.users WHERE created_at::date = CURRENT_DATE) as new_today,
                  (SELECT COUNT(*) FROM {SCHEMA}.users WHERE locked_until IS NOT NULL AND locked_until > NOW()) as locked_now,
                  (SELECT COUNT(*) FROM {SCHEMA}.user_sessions WHERE expires_at > NOW() AND revoked_at IS NULL) as sessions_active,
                  (SELECT COUNT(*) FROM {SCHEMA}.contacts) as contacts_total,
                  (SELECT COUNT(*) FROM {SCHEMA}.campaigns) as campaigns_total,
                  (SELECT COUNT(*) FROM {SCHEMA}.email_logs) as emails_total,
                  (SELECT COUNT(*) FROM {SCHEMA}.email_logs WHERE sent_at >= CURRENT_DATE) as emails_today,
                  (SELECT COUNT(*) FROM {SCHEMA}.api_keys WHERE is_active = TRUE) as api_keys_active,
                  (SELECT COUNT(*) FROM {SCHEMA}.suppression_list) as suppressions
            """)
            s = cur.fetchone()

            # Регистрации по дням за 14 дней
            cur.execute(f"""
                SELECT created_at::date as d, COUNT(*) as c
                FROM {SCHEMA}.users
                WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
                GROUP BY d ORDER BY d
            """)
            registrations = [{"date": r[0], "count": r[1]} for r in cur.fetchall()]

            # Активность за 24ч
            cur.execute(f"""
                SELECT event_type, COUNT(*) FROM {SCHEMA}.auth_audit_log
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY event_type ORDER BY 2 DESC LIMIT 20
            """)
            activity = [{"action": r[0], "count": r[1]} for r in cur.fetchall()]

            # Failed logins за 24ч (подозрительно)
            cur.execute(f"""
                SELECT COUNT(*) FROM {SCHEMA}.auth_audit_log
                WHERE event_type = 'login' AND success = FALSE
                  AND created_at >= NOW() - INTERVAL '24 hours'
            """)
            failed_logins_24h = cur.fetchone()[0]

            cur.close()
            return resp(200, {
                "users": {
                    "total": s[0], "active": s[1], "verified": s[2],
                    "new_week": s[3], "new_today": s[4], "locked": s[5],
                    "sessions_active": s[6],
                },
                "data": {
                    "contacts": s[7], "campaigns": s[8],
                    "emails_total": s[9], "emails_today": s[10],
                    "api_keys_active": s[11], "suppressions": s[12],
                },
                "security": {
                    "failed_logins_24h": failed_logins_24h,
                },
                "registrations": registrations,
                "activity": activity,
            }, event)

        # ── USERS: список с поиском и пагинацией ────────────────────────────
        if action == "users":
            search = (qs.get("search") or "").strip().lower()[:100]
            offset = int(qs.get("offset", "0"))
            limit = min(int(qs.get("limit", "50")), 200)
            cur = conn.cursor()
            where = ""
            params = []
            if search:
                where = "WHERE u.email_lower LIKE %s OR LOWER(u.name) LIKE %s"
                params = [f"%{search}%", f"%{search}%"]
            cur.execute(
                f"""SELECT u.id, u.email, u.name, u.role, u.is_active, u.is_email_verified,
                       u.failed_attempts, u.locked_until, u.last_login_at, u.last_login_ip,
                       u.created_at,
                       (SELECT COUNT(*) FROM {SCHEMA}.contacts WHERE user_id = u.id) as contacts_n,
                       (SELECT COUNT(*) FROM {SCHEMA}.campaigns WHERE user_id = u.id) as campaigns_n,
                       (SELECT COUNT(*) FROM {SCHEMA}.user_sessions
                          WHERE user_id = u.id AND expires_at > NOW() AND revoked_at IS NULL) as sessions_n
                    FROM {SCHEMA}.users u
                    {where}
                    ORDER BY u.created_at DESC
                    LIMIT %s OFFSET %s""",
                params + [limit, offset],
            )
            rows = cur.fetchall()
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users u {where}", params)
            total = cur.fetchone()[0]
            cur.close()
            return resp(200, {
                "users": [
                    {
                        "id": r[0], "email": r[1], "name": r[2], "role": r[3],
                        "is_active": r[4], "is_email_verified": r[5],
                        "failed_attempts": r[6], "locked_until": r[7],
                        "last_login_at": r[8], "last_login_ip": r[9],
                        "created_at": r[10],
                        "contacts": r[11], "campaigns": r[12], "sessions": r[13],
                    } for r in rows
                ],
                "total": total, "offset": offset, "limit": limit,
            }, event)

        # ── USER_DETAIL: подробности пользователя ───────────────────────────
        if action == "user_detail":
            uid = int(qs.get("id", "0"))
            cur = conn.cursor()
            cur.execute(
                f"""SELECT id, email, name, role, is_active, is_email_verified,
                       failed_attempts, locked_until, last_login_at, last_login_ip, created_at
                    FROM {SCHEMA}.users WHERE id = %s""",
                (uid,),
            )
            u = cur.fetchone()
            if not u:
                cur.close()
                return resp(404, {"error": "Пользователь не найден"}, event)
            # Последние 30 записей audit-log
            cur.execute(
                f"""SELECT event_type, success, ip_address, user_agent, details, created_at
                    FROM {SCHEMA}.auth_audit_log WHERE user_id = %s
                    ORDER BY created_at DESC LIMIT 30""",
                (uid,),
            )
            audit_rows = cur.fetchall()
            # Активные сессии
            cur.execute(
                f"""SELECT id, user_agent, ip_address, created_at, expires_at
                    FROM {SCHEMA}.user_sessions
                    WHERE user_id = %s AND revoked_at IS NULL AND expires_at > NOW()
                    ORDER BY created_at DESC""",
                (uid,),
            )
            sess_rows = cur.fetchall()
            cur.close()
            return resp(200, {
                "user": {
                    "id": u[0], "email": u[1], "name": u[2], "role": u[3],
                    "is_active": u[4], "is_email_verified": u[5],
                    "failed_attempts": u[6], "locked_until": u[7],
                    "last_login_at": u[8], "last_login_ip": u[9], "created_at": u[10],
                },
                "audit_log": [
                    {"action": r[0], "success": r[1], "ip": r[2],
                     "user_agent": r[3], "details": r[4], "created_at": r[5]}
                    for r in audit_rows
                ],
                "sessions": [
                    {"id": r[0], "user_agent": r[1], "ip": r[2],
                     "created_at": r[3], "expires_at": r[4]}
                    for r in sess_rows
                ],
            }, event)

        # ── TOGGLE_USER: бан/разбан ─────────────────────────────────────────
        if action == "toggle_user" and method == "POST":
            uid = int(body.get("user_id", 0))
            is_active = bool(body.get("is_active", True))
            if uid == admin_id and not is_active:
                return resp(400, {"error": "Нельзя деактивировать самого себя"}, event)
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.users SET is_active = %s, updated_at = NOW() WHERE id = %s",
                (is_active, uid),
            )
            if not is_active:
                # Отзываем все активные сессии
                cur.execute(
                    f"UPDATE {SCHEMA}.user_sessions SET revoked_at = NOW() "
                    f"WHERE user_id = %s AND revoked_at IS NULL",
                    (uid,),
                )
            audit(cur, admin_id, "toggle_user", uid, f"is_active={is_active}")
            conn.commit()
            cur.close()
            return resp(200, {"ok": True, "is_active": is_active}, event)

        # ── SET_ROLE: смена роли ────────────────────────────────────────────
        if action == "set_role" and method == "POST":
            uid = int(body.get("user_id", 0))
            role = (body.get("role") or "user").strip()[:20]
            if role not in ("user", "admin", "manager"):
                return resp(400, {"error": "Допустимые роли: user, admin, manager"}, event)
            if uid == admin_id and role != "admin":
                return resp(400, {"error": "Нельзя снять с себя роль admin"}, event)
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.users SET role = %s, updated_at = NOW() WHERE id = %s",
                (role, uid),
            )
            audit(cur, admin_id, "set_role", uid, f"role={role}")
            conn.commit()
            cur.close()
            return resp(200, {"ok": True, "role": role}, event)

        # ── UNLOCK_USER ─────────────────────────────────────────────────────
        if action == "unlock_user" and method == "POST":
            uid = int(body.get("user_id", 0))
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.users SET locked_until = NULL, failed_attempts = 0, updated_at = NOW() "
                f"WHERE id = %s",
                (uid,),
            )
            audit(cur, admin_id, "unlock_user", uid)
            conn.commit()
            cur.close()
            return resp(200, {"ok": True}, event)

        # ── REVOKE_SESSIONS: вышибает все сессии юзера ─────────────────────
        if action == "revoke_sessions" and method == "POST":
            uid = int(body.get("user_id", 0))
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.user_sessions SET revoked_at = NOW() "
                f"WHERE user_id = %s AND revoked_at IS NULL",
                (uid,),
            )
            n = cur.rowcount
            audit(cur, admin_id, "revoke_sessions", uid, f"revoked={n}")
            conn.commit()
            cur.close()
            return resp(200, {"ok": True, "revoked": n}, event)

        # ── AUDIT_LOG: логи входов/действий ─────────────────────────────────
        if action == "audit_log":
            limit = min(int(qs.get("limit", "100")), 500)
            only_failed = qs.get("only_failed") == "1"
            cur = conn.cursor()
            where = "WHERE success = FALSE" if only_failed else ""
            cur.execute(
                f"""SELECT a.id, a.user_id, u.email, a.event_type, a.success,
                       a.ip_address, a.user_agent, a.details, a.created_at
                    FROM {SCHEMA}.auth_audit_log a
                    LEFT JOIN {SCHEMA}.users u ON u.id = a.user_id
                    {where}
                    ORDER BY a.created_at DESC LIMIT %s""",
                (limit,),
            )
            rows = cur.fetchall()
            cur.close()
            return resp(200, {"events": [
                {"id": r[0], "user_id": r[1], "email": r[2],
                 "action": r[3], "success": r[4],
                 "ip": r[5], "user_agent": r[6], "details": r[7],
                 "created_at": r[8]}
                for r in rows
            ]}, event)

        # ── EMAIL_LOGS: последние отправки писем ────────────────────────────
        if action == "email_logs":
            limit = min(int(qs.get("limit", "100")), 500)
            cur = conn.cursor()
            cur.execute(
                f"""SELECT el.id, el.to_email, el.subject, el.status, el.error_msg,
                       el.sent_at, el.opened_at, el.clicked_at,
                       c.name as campaign_name, c.user_id
                    FROM {SCHEMA}.email_logs el
                    LEFT JOIN {SCHEMA}.campaigns c ON c.id = el.campaign_id
                    ORDER BY el.created_at DESC NULLS LAST, el.id DESC
                    LIMIT %s""",
                (limit,),
            )
            rows = cur.fetchall()
            cur.close()
            return resp(200, {"logs": [
                {"id": r[0], "to": r[1], "subject": r[2], "status": r[3],
                 "error": r[4], "sent_at": r[5], "opened_at": r[6],
                 "clicked_at": r[7], "campaign_name": r[8], "user_id": r[9]}
                for r in rows
            ]}, event)

        # ── ALL CAMPAIGNS: все кампании в системе ───────────────────────────
        if action == "campaigns":
            limit = min(int(qs.get("limit", "100")), 500)
            cur = conn.cursor()
            cur.execute(
                f"""SELECT c.id, c.name, c.status, c.subject, c.sent_count,
                       c.open_rate, c.click_rate, c.created_at, c.user_id, u.email
                    FROM {SCHEMA}.campaigns c
                    LEFT JOIN {SCHEMA}.users u ON u.id = c.user_id
                    ORDER BY c.created_at DESC LIMIT %s""",
                (limit,),
            )
            rows = cur.fetchall()
            cur.close()
            return resp(200, {"campaigns": [
                {"id": r[0], "name": r[1], "status": r[2], "subject": r[3],
                 "sent_count": r[4], "open_rate": float(r[5] or 0),
                 "click_rate": float(r[6] or 0), "created_at": r[7],
                 "user_id": r[8], "owner_email": r[9]}
                for r in rows
            ]}, event)

        # ── TOP-CONTACTS: рейтинг аккаунтов по объёму ───────────────────────
        if action == "contacts_top":
            cur = conn.cursor()
            cur.execute(
                f"""SELECT u.id, u.email, u.name,
                       COUNT(c.id) as contacts_n,
                       COUNT(c.id) FILTER (WHERE c.status = 'active') as active_n
                    FROM {SCHEMA}.users u
                    LEFT JOIN {SCHEMA}.contacts c ON c.user_id = u.id
                    GROUP BY u.id, u.email, u.name
                    HAVING COUNT(c.id) > 0
                    ORDER BY contacts_n DESC LIMIT 50"""
            )
            rows = cur.fetchall()
            cur.close()
            return resp(200, {"top": [
                {"user_id": r[0], "email": r[1], "name": r[2],
                 "contacts": r[3], "active": r[4]}
                for r in rows
            ]}, event)

        # ── RATE_LIMITS ─────────────────────────────────────────────────────
        if action == "rate_limits":
            cur = conn.cursor()
            cur.execute(
                f"""SELECT identifier, action, attempts, window_start, last_attempt_at
                    FROM {SCHEMA}.rate_limits
                    WHERE window_start >= NOW() - INTERVAL '1 hour'
                    ORDER BY attempts DESC, last_attempt_at DESC LIMIT 100"""
            )
            rows = cur.fetchall()
            cur.close()
            return resp(200, {"limits": [
                {"identifier": r[0], "action": r[1], "attempts": r[2],
                 "window_start": r[3], "last_attempt_at": r[4]}
                for r in rows
            ]}, event)

        # ── MAILBOX ORDERS: заявки на корпоративную почту ──────────────────
        if action == "mailbox_orders":
            status_filter = (qs.get("status") or "").strip()
            provider_filter = (qs.get("provider") or "").strip()
            search = (qs.get("search") or "").strip()
            limit = max(1, min(int(qs.get("limit") or 100), 500))

            where = ["1=1"]
            params = []
            if status_filter:
                where.append("mo.status = %s")
                params.append(status_filter[:30])
            if provider_filter:
                where.append("mo.provider = %s")
                params.append(provider_filter[:40])
            if search:
                where.append("(mo.contact_email ILIKE %s OR mo.contact_name ILIKE %s "
                             "OR mo.domain ILIKE %s OR u.email ILIKE %s)")
                like = f"%{search[:60]}%"
                params.extend([like, like, like, like])

            cur = conn.cursor()
            cur.execute(
                f"SELECT mo.id, mo.user_id, u.email, u.name, "
                f"mo.provider, mo.plan_code, mo.domain, mo.mailboxes_count, "
                f"mo.contact_email, mo.contact_name, mo.contact_phone, "
                f"mo.status, mo.notes, mo.utm_source, mo.ip_address, "
                f"mo.created_at, mo.updated_at "
                f"FROM {SCHEMA}.mailbox_orders mo "
                f"LEFT JOIN {SCHEMA}.users u ON u.id = mo.user_id "
                f"WHERE {' AND '.join(where)} "
                f"ORDER BY mo.created_at DESC LIMIT {limit}",
                tuple(params),
            )
            rows = cur.fetchall()

            # Сводка по статусам
            cur.execute(
                f"SELECT status, COUNT(*) FROM {SCHEMA}.mailbox_orders GROUP BY status"
            )
            stats_rows = cur.fetchall()
            cur.close()

            return resp(200, {
                "orders": [{
                    "id": r[0], "user_id": r[1], "user_email": r[2], "user_name": r[3],
                    "provider": r[4], "plan_code": r[5], "domain": r[6],
                    "mailboxes_count": r[7],
                    "contact_email": r[8], "contact_name": r[9], "contact_phone": r[10],
                    "status": r[11], "notes": r[12], "utm_source": r[13],
                    "ip_address": r[14],
                    "created_at": r[15], "updated_at": r[16],
                } for r in rows],
                "stats": {r[0]: r[1] for r in stats_rows},
            }, event)

        if action == "mailbox_set_status" and method == "POST":
            order_id = int(body.get("order_id") or 0)
            new_status = (body.get("status") or "").strip()[:30]
            allowed = {"click", "request", "contacted", "paid", "cancelled"}
            if not order_id or new_status not in allowed:
                return resp(400, {
                    "error": "Нужны order_id и валидный status (click/request/contacted/paid/cancelled)"
                }, event)
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.mailbox_orders SET status = %s, updated_at = NOW() "
                f"WHERE id = %s RETURNING id",
                (new_status, order_id),
            )
            row = cur.fetchone()
            if not row:
                conn.rollback()
                cur.close()
                return resp(404, {"error": "Заявка не найдена"}, event)
            audit(cur, admin_id, "mailbox_set_status", None,
                  f"order={order_id} status={new_status}")
            conn.commit()
            cur.close()
            return resp(200, {"ok": True, "order_id": order_id, "status": new_status}, event)

        if action == "mailbox_set_notes" and method == "POST":
            order_id = int(body.get("order_id") or 0)
            notes = (body.get("notes") or "")[:2000]
            if not order_id:
                return resp(400, {"error": "order_id required"}, event)
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.mailbox_orders SET notes = %s, updated_at = NOW() "
                f"WHERE id = %s RETURNING id",
                (notes, order_id),
            )
            row = cur.fetchone()
            if not row:
                conn.rollback()
                cur.close()
                return resp(404, {"error": "Заявка не найдена"}, event)
            audit(cur, admin_id, "mailbox_set_notes", None, f"order={order_id}")
            conn.commit()
            cur.close()
            return resp(200, {"ok": True}, event)

        if action == "mailbox_delete" and method == "POST":
            order_id = int(body.get("order_id") or 0)
            if not order_id:
                return resp(400, {"error": "order_id required"}, event)
            cur = conn.cursor()
            cur.execute(
                f"DELETE FROM {SCHEMA}.mailbox_orders WHERE id = %s RETURNING id",
                (order_id,),
            )
            row = cur.fetchone()
            if not row:
                conn.rollback()
                cur.close()
                return resp(404, {"error": "Заявка не найдена"}, event)
            audit(cur, admin_id, "mailbox_delete", None, f"order={order_id}")
            conn.commit()
            cur.close()
            return resp(200, {"ok": True}, event)

        # ── PARTNER APPLICATIONS ───────────────────────────────────────────
        if action == "partner_apps" and method == "GET":
            status_f = (qs.get("status") or "").strip()[:30]
            program_f = (qs.get("program") or "").strip()[:40]
            search = (qs.get("search") or "").strip()[:100]
            limit = min(int(qs.get("limit") or 200), 500)
            where = ["1=1"]
            params = []
            if status_f:
                where.append("pa.status = %s")
                params.append(status_f)
            if program_f:
                where.append("pa.program = %s")
                params.append(program_f)
            if search:
                where.append("(LOWER(pa.email) LIKE %s OR LOWER(pa.name) LIKE %s)")
                params.extend([f"%{search.lower()}%", f"%{search.lower()}%"])
            cur = conn.cursor()
            cur.execute(
                f"SELECT pa.id, pa.program, pa.name, pa.email, pa.channel, pa.audience, "
                f"pa.status, pa.notes, pa.user_id, u.email, "
                f"pa.utm_source, pa.ip_address, pa.created_at, pa.updated_at "
                f"FROM {SCHEMA}.partner_applications pa "
                f"LEFT JOIN {SCHEMA}.users u ON u.id = pa.user_id "
                f"WHERE {' AND '.join(where)} "
                f"ORDER BY pa.created_at DESC LIMIT {limit}",
                tuple(params),
            )
            rows = cur.fetchall()
            cur.execute(
                f"SELECT status, COUNT(*) FROM {SCHEMA}.partner_applications GROUP BY status"
            )
            stats_rows = cur.fetchall()
            cur.close()
            return resp(200, {
                "applications": [{
                    "id": r[0], "program": r[1], "name": r[2], "email": r[3],
                    "channel": r[4], "audience": r[5],
                    "status": r[6], "notes": r[7],
                    "user_id": r[8], "user_email": r[9],
                    "utm_source": r[10], "ip_address": r[11],
                    "created_at": r[12], "updated_at": r[13],
                } for r in rows],
                "stats": {r[0]: r[1] for r in stats_rows},
            }, event)

        if action == "partner_set_status" and method == "POST":
            app_id = int(body.get("app_id") or 0)
            new_status = (body.get("status") or "").strip()[:30]
            allowed = {"new", "in_review", "approved", "rejected", "active", "paused"}
            if not app_id or new_status not in allowed:
                return resp(400, {
                    "error": "Нужны app_id и валидный status (new/in_review/approved/rejected/active/paused)"
                }, event)
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.partner_applications SET status = %s, updated_at = NOW() "
                f"WHERE id = %s RETURNING id",
                (new_status, app_id),
            )
            row = cur.fetchone()
            if not row:
                conn.rollback()
                cur.close()
                return resp(404, {"error": "Заявка не найдена"}, event)
            audit(cur, admin_id, "partner_set_status", None,
                  f"app={app_id} status={new_status}")
            conn.commit()
            cur.close()
            return resp(200, {"ok": True, "app_id": app_id, "status": new_status}, event)

        if action == "partner_set_notes" and method == "POST":
            app_id = int(body.get("app_id") or 0)
            notes = (body.get("notes") or "")[:2000]
            if not app_id:
                return resp(400, {"error": "app_id required"}, event)
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.partner_applications SET notes = %s, updated_at = NOW() "
                f"WHERE id = %s RETURNING id",
                (notes, app_id),
            )
            row = cur.fetchone()
            if not row:
                conn.rollback()
                cur.close()
                return resp(404, {"error": "Заявка не найдена"}, event)
            audit(cur, admin_id, "partner_set_notes", None, f"app={app_id}")
            conn.commit()
            cur.close()
            return resp(200, {"ok": True}, event)

        if action == "partner_delete" and method == "POST":
            app_id = int(body.get("app_id") or 0)
            if not app_id:
                return resp(400, {"error": "app_id required"}, event)
            cur = conn.cursor()
            cur.execute(
                f"DELETE FROM {SCHEMA}.partner_applications WHERE id = %s RETURNING id",
                (app_id,),
            )
            row = cur.fetchone()
            if not row:
                conn.rollback()
                cur.close()
                return resp(404, {"error": "Заявка не найдена"}, event)
            audit(cur, admin_id, "partner_delete", None, f"app={app_id}")
            conn.commit()
            cur.close()
            return resp(200, {"ok": True}, event)

        # ── HEALTH ─────────────────────────────────────────────────────────
        if action == "health":
            cur = conn.cursor()
            cur.execute(f"SELECT pg_database_size(current_database())")
            db_size = cur.fetchone()[0]
            cur.execute(f"""
                SELECT relname, n_live_tup
                FROM pg_stat_user_tables
                WHERE schemaname = '{SCHEMA}'
                ORDER BY n_live_tup DESC LIMIT 20
            """)
            tables = [{"name": r[0], "rows": r[1]} for r in cur.fetchall()]
            cur.close()
            return resp(200, {
                "db_size_bytes": db_size,
                "db_size_mb": round(db_size / 1024 / 1024, 2),
                "tables": tables,
            }, event)

        return resp(404, {"error": f"Неизвестный action: {action}"}, event)

    finally:
        conn.close()