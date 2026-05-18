// API реферальной программы.
const REFERRALS_URL = "https://functions.poehali.dev/03ee32a5-47bc-47f1-bd72-567e34eca91d";

const TOKEN_KEY = "mk_auth_token";

function authHeaders(): Record<string, string> {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { "X-Auth-Token": t } : {};
  } catch {
    return {};
  }
}

export interface ReferralMe {
  ok: boolean;
  referral_code: string;
  referral_link: string;
  bonus_per_referral: number;
  stats: {
    pending: number;
    converted: number;
    total_earned: number;
    balance: number;
  };
}

export interface ReferralItem {
  id: number;
  email: string;
  status: "pending" | "converted";
  bonus: number;
  invited_at: string | null;
  converted_at: string | null;
}

export interface BonusTx {
  id: number;
  amount: number;
  type: string;
  description: string;
  created_at: string | null;
}

export async function fetchReferralMe(): Promise<ReferralMe | { ok: false }> {
  try {
    const r = await fetch(`${REFERRALS_URL}?action=me`, { headers: authHeaders() });
    return r.json();
  } catch {
    return { ok: false };
  }
}

export async function fetchReferralHistory(): Promise<{ ok: boolean; items: ReferralItem[] }> {
  try {
    const r = await fetch(`${REFERRALS_URL}?action=history`, { headers: authHeaders() });
    return r.json();
  } catch {
    return { ok: false, items: [] };
  }
}

export async function fetchBonusHistory(): Promise<{ ok: boolean; balance: number; items: BonusTx[] }> {
  try {
    const r = await fetch(`${REFERRALS_URL}?action=bonuses`, { headers: authHeaders() });
    return r.json();
  } catch {
    return { ok: false, balance: 0, items: [] };
  }
}

export async function captureReferral(code: string, email: string): Promise<{ ok: boolean }> {
  try {
    const r = await fetch(`${REFERRALS_URL}?action=capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, email }),
    });
    return r.json();
  } catch {
    return { ok: false };
  }
}
