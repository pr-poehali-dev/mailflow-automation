// API-клиент админ-панели MAIL-KA. Отдельный от пользовательского.
const ADMIN_URL = "https://functions.poehali.dev/1e03fe01-5cd5-4f97-842a-6ab768806f2c";
const AUTH_URL = "https://functions.poehali.dev/fc6e1c96-a844-462f-bc06-93773427968f";

const ADMIN_TOKEN_KEY = "mk_admin_token";
const MAIN_TOKEN_KEY = "mk_auth_token";

export function getAdminToken(): string | null {
  try {
    return (
      localStorage.getItem(ADMIN_TOKEN_KEY) ||
      localStorage.getItem(MAIN_TOKEN_KEY)
    );
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function authHeaders(): Record<string, string> {
  const t = getAdminToken();
  return t ? { "X-Auth-Token": t } : {};
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_email_verified: boolean;
}

export async function adminLogin(email: string, password: string): Promise<{ ok: boolean; user?: AdminUser; error?: string }> {
  const r = await fetch(`${AUTH_URL}?action=login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) return { ok: false, error: data.error || "Ошибка входа" };
  if (data.user?.role !== "admin") {
    return { ok: false, error: "Доступ только для администраторов" };
  }
  setAdminToken(data.token);
  return { ok: true, user: data.user };
}

export async function adminLogout() {
  const t = getAdminToken();
  if (t) {
    try {
      await fetch(`${AUTH_URL}?action=logout`, {
        method: "POST",
        headers: { "X-Auth-Token": t },
      });
    } catch {
      /* ignore */
    }
  }
  setAdminToken(null);
}

export async function adminMe(): Promise<{ ok: boolean; user?: AdminUser }> {
  const t = getAdminToken();
  if (!t) return { ok: false };
  const r = await fetch(`${AUTH_URL}?action=me`, {
    headers: { "X-Auth-Token": t },
  });
  if (!r.ok) {
    setAdminToken(null);
    return { ok: false };
  }
  const data = await r.json();
  if (data.user?.role !== "admin") {
    setAdminToken(null);
    return { ok: false };
  }
  return { ok: true, user: data.user };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export interface OverviewData {
  users: {
    total: number; active: number; verified: number;
    new_week: number; new_today: number; locked: number; sessions_active: number;
  };
  data: {
    contacts: number; campaigns: number;
    emails_total: number; emails_today: number;
    api_keys_active: number; suppressions: number;
  };
  security: { failed_logins_24h: number };
  registrations: { date: string; count: number }[];
  activity: { action: string; count: number }[];
}

export async function fetchOverview(): Promise<OverviewData> {
  const r = await fetch(`${ADMIN_URL}?action=overview`, { headers: authHeaders() });
  return r.json();
}

export interface AdminUserRow {
  id: number; email: string; name: string; role: string;
  is_active: boolean; is_email_verified: boolean;
  failed_attempts: number; locked_until: string | null;
  last_login_at: string | null; last_login_ip: string | null;
  created_at: string;
  contacts: number; campaigns: number; sessions: number;
}

export async function fetchUsers(search = "", offset = 0, limit = 50): Promise<{ users: AdminUserRow[]; total: number }> {
  const url = new URL(ADMIN_URL);
  url.searchParams.set("action", "users");
  if (search) url.searchParams.set("search", search);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));
  const r = await fetch(url.toString(), { headers: authHeaders() });
  return r.json();
}

export async function fetchUserDetail(id: number) {
  const r = await fetch(`${ADMIN_URL}?action=user_detail&id=${id}`, { headers: authHeaders() });
  return r.json();
}

export async function toggleUser(user_id: number, is_active: boolean) {
  const r = await fetch(`${ADMIN_URL}?action=toggle_user`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ user_id, is_active }),
  });
  return r.json();
}

export async function setUserRole(user_id: number, role: string) {
  const r = await fetch(`${ADMIN_URL}?action=set_role`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ user_id, role }),
  });
  return r.json();
}

export async function unlockUser(user_id: number) {
  const r = await fetch(`${ADMIN_URL}?action=unlock_user`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ user_id }),
  });
  return r.json();
}

export async function revokeSessions(user_id: number) {
  const r = await fetch(`${ADMIN_URL}?action=revoke_sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ user_id }),
  });
  return r.json();
}

export async function fetchAuditLog(only_failed = false, limit = 100) {
  const url = new URL(ADMIN_URL);
  url.searchParams.set("action", "audit_log");
  if (only_failed) url.searchParams.set("only_failed", "1");
  url.searchParams.set("limit", String(limit));
  const r = await fetch(url.toString(), { headers: authHeaders() });
  return r.json();
}

export async function fetchAdminCampaigns(limit = 100) {
  const r = await fetch(`${ADMIN_URL}?action=campaigns&limit=${limit}`, { headers: authHeaders() });
  return r.json();
}

export async function fetchEmailLogs(limit = 100) {
  const r = await fetch(`${ADMIN_URL}?action=email_logs&limit=${limit}`, { headers: authHeaders() });
  return r.json();
}

export async function fetchContactsTop() {
  const r = await fetch(`${ADMIN_URL}?action=contacts_top`, { headers: authHeaders() });
  return r.json();
}

export async function fetchRateLimits() {
  const r = await fetch(`${ADMIN_URL}?action=rate_limits`, { headers: authHeaders() });
  return r.json();
}

export async function fetchHealth() {
  const r = await fetch(`${ADMIN_URL}?action=health`, { headers: authHeaders() });
  return r.json();
}

// ─── Заявки на корпоративную почту ──────────────────────────────────────────

export interface MailboxOrderRow {
  id: number;
  user_id: number | null;
  user_email: string | null;
  user_name: string | null;
  provider: string;
  plan_code: string | null;
  domain: string | null;
  mailboxes_count: number | null;
  contact_email: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  status: string;
  notes: string | null;
  utm_source: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchMailboxOrders(filter: {
  status?: string; provider?: string; search?: string; limit?: number;
} = {}): Promise<{ orders: MailboxOrderRow[]; stats: Record<string, number> }> {
  const url = new URL(ADMIN_URL);
  url.searchParams.set("action", "mailbox_orders");
  if (filter.status) url.searchParams.set("status", filter.status);
  if (filter.provider) url.searchParams.set("provider", filter.provider);
  if (filter.search) url.searchParams.set("search", filter.search);
  url.searchParams.set("limit", String(filter.limit ?? 200));
  const r = await fetch(url.toString(), { headers: authHeaders() });
  return r.json();
}

export async function setMailboxOrderStatus(order_id: number, status: string) {
  const r = await fetch(`${ADMIN_URL}?action=mailbox_set_status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ order_id, status }),
  });
  return r.json();
}

export async function setMailboxOrderNotes(order_id: number, notes: string) {
  const r = await fetch(`${ADMIN_URL}?action=mailbox_set_notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ order_id, notes }),
  });
  return r.json();
}

export async function deleteMailboxOrder(order_id: number) {
  const r = await fetch(`${ADMIN_URL}?action=mailbox_delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ order_id }),
  });
  return r.json();
}