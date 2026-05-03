// API партнёрской витрины «Корпоративная почта».
const MAILBOX_URL = "https://functions.poehali.dev/26b9a029-901f-4151-86a1-b0eec499ac59";

const TOKEN_KEY = "mk_auth_token";

function authHeaders(): Record<string, string> {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { "X-Auth-Token": t } : {};
  } catch {
    return {};
  }
}

export interface MailboxPlan {
  code: string;
  title: string;
  price_rub: number;
  period: string;
  mailboxes: number;
  url: string;
}

export interface MailboxProvider {
  provider: string;
  name: string;
  logo_emoji: string;
  country: string;
  license: string;
  highlight: string;
  color: string;
  features: string[];
  plans: MailboxPlan[];
  compliant_152fz: boolean;
  data_in_russia: boolean;
}

export interface MailboxOrder {
  id: number;
  provider: string;
  plan_code: string;
  domain: string | null;
  mailboxes_count: number | null;
  status: string;
  contact_email: string | null;
  created_at: string;
}

export async function fetchProviders(): Promise<{ providers: MailboxProvider[] }> {
  const r = await fetch(`${MAILBOX_URL}?action=providers`);
  return r.json();
}

export async function trackClick(provider: string, plan_code: string, ref_url: string) {
  try {
    await fetch(`${MAILBOX_URL}?action=click`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ provider, plan_code, ref_url }),
    });
  } catch {
    /* fire-and-forget */
  }
}

export async function submitRequest(payload: {
  provider: string;
  plan_code: string;
  domain: string;
  mailboxes_count: number;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  notes?: string;
}): Promise<{ ok: boolean; order_id?: number; message?: string; error?: string }> {
  const r = await fetch(`${MAILBOX_URL}?action=request`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function fetchMyOrders(): Promise<{ orders: MailboxOrder[] }> {
  const r = await fetch(`${MAILBOX_URL}?action=my_orders`, { headers: authHeaders() });
  if (!r.ok) return { orders: [] };
  return r.json();
}
