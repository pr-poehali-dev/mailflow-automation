// API партнёрской программы.
const PARTNERS_URL = "https://functions.poehali.dev/a766b91e-fdc4-4369-9a38-68c3aa8485e2";

const TOKEN_KEY = "mk_auth_token";

function authHeaders(): Record<string, string> {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { "X-Auth-Token": t } : {};
  } catch {
    return {};
  }
}

export type PartnerProgram = "referral" | "agency" | "whitelabel" | "tech";

export interface PartnerApplication {
  id: number;
  program: PartnerProgram;
  name: string;
  email: string;
  channel: string | null;
  status: string;
  created_at: string;
}

export interface PartnerStats {
  ok: boolean;
  active_partners: number;
  total_applications: number;
}

export async function submitPartnerApplication(payload: {
  program: PartnerProgram;
  name: string;
  email: string;
  channel?: string;
  audience?: string;
  utm_source?: string;
}): Promise<{ ok: boolean; application_id?: number; message?: string; error?: string }> {
  const r = await fetch(`${PARTNERS_URL}?action=apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function fetchMyApplications(): Promise<{ ok: boolean; applications: PartnerApplication[] }> {
  const r = await fetch(`${PARTNERS_URL}?action=my`, { headers: authHeaders() });
  if (!r.ok) return { ok: false, applications: [] };
  return r.json();
}

export async function fetchPartnerStats(): Promise<PartnerStats> {
  try {
    const r = await fetch(`${PARTNERS_URL}?action=stats`);
    return r.json();
  } catch {
    return { ok: false, active_partners: 0, total_applications: 0 };
  }
}
