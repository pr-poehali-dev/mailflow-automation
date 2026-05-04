// API для CRM-интеграций (OAuth: Битрикс24, amoCRM)
const CRM_URL = "https://functions.poehali.dev/de5e6f01-9cf1-4347-af58-eb3e96d35506";

export type CrmProvider = "bitrix24" | "amocrm";

export interface CrmConnection {
  provider: CrmProvider;
  domain: string | null;
  status: string;
  connected_at: string | null;
  account_info: Record<string, string | undefined>;
}

function authHeaders(): Record<string, string> {
  try {
    const t = localStorage.getItem("mk_auth_token");
    return t ? { "X-Auth-Token": t } : {};
  } catch {
    return {};
  }
}

export async function fetchCrmConnections(): Promise<CrmConnection[]> {
  const r = await fetch(`${CRM_URL}?action=list`, { headers: { ...authHeaders() } });
  if (!r.ok) return [];
  const data = await r.json();
  return data.connections || [];
}

export async function getCrmAuthorizeUrl(
  provider: CrmProvider,
  domain?: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const params = new URLSearchParams({ action: "authorize", provider });
  if (domain) params.set("domain", domain);
  const r = await fetch(`${CRM_URL}?${params.toString()}`, { headers: { ...authHeaders() } });
  const data = await r.json();
  if (!r.ok) {
    return { ok: false, error: data.error || data.message || "Не удалось получить URL авторизации" };
  }
  return { ok: true, url: data.authorize_url };
}

export async function disconnectCrm(provider: CrmProvider): Promise<{ ok: boolean }> {
  const r = await fetch(`${CRM_URL}?action=disconnect&provider=${provider}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return r.json();
}

// Колбэк OAuth — вызывается со страницы /oauth/callback
export async function processOauthCallback(query: string): Promise<{ ok: boolean; provider?: string; error?: string }> {
  const r = await fetch(`${CRM_URL}?action=callback&${query}`);
  const data = await r.json();
  if (!r.ok) return { ok: false, error: data.error || "Ошибка авторизации" };
  return { ok: true, provider: data.provider };
}
