// Pro API клиент: статистика, контакт-скоринг, прогноз
const PRO_API_URL = "https://functions.poehali.dev/6a7c50cd-ae04-4986-a224-febafaafe7bb";

const TOKEN_KEY = "mk_auth_token";

function authHeaders(): Record<string, string> {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { "X-Auth-Token": t } : {};
  } catch {
    return {};
  }
}

export interface GlobalStats {
  active_contacts: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  suppressed: number;
  active_automations: number;
  today_sent: number;
  avg_score: number;
  open_rate: number;
  click_rate: number;
  weekly: { date: string; sent: number; opened: number }[];
}

export interface ContactScore {
  id: number;
  name: string;
  email: string;
  segment: string | null;
  score: number;
  last_opened_at: string | null;
  last_clicked_at: string | null;
}

const EMPTY_STATS: GlobalStats = {
  active_contacts: 0,
  total_sent: 0,
  total_opened: 0,
  total_clicked: 0,
  suppressed: 0,
  active_automations: 0,
  today_sent: 0,
  avg_score: 0,
  open_rate: 0,
  click_rate: 0,
  weekly: [],
};

export async function fetchGlobalStats(): Promise<GlobalStats> {
  try {
    const r = await fetch(`${PRO_API_URL}?resource=global_stats`, { headers: authHeaders() });
    if (!r.ok) return EMPTY_STATS;
    return r.json();
  } catch {
    return EMPTY_STATS;
  }
}

export async function fetchContactScores(): Promise<{ contacts: ContactScore[] }> {
  try {
    const r = await fetch(`${PRO_API_URL}?resource=contact_score`, { headers: authHeaders() });
    if (!r.ok) return { contacts: [] };
    return r.json();
  } catch {
    return { contacts: [] };
  }
}
