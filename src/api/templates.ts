// API каталога шаблонов писем.
const TEMPLATES_URL = "https://functions.poehali.dev/75c9f7cd-e5c5-48c5-bda5-703f6aab587e";

const TOKEN_KEY = "mk_auth_token";

function authHeaders(): Record<string, string> {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { "X-Auth-Token": t } : {};
  } catch {
    return {};
  }
}

export interface EmailTemplate {
  id: number;
  name: string;
  category: string;
  preview: string;
  uses: number;
  is_system: boolean;
  subject?: string | null;
  preheader?: string | null;
  created_at?: string | null;
}

export interface EmailTemplateFull extends EmailTemplate {
  body_text?: string | null;
  body_html?: string | null;
  user_id?: number | null;
}

export async function fetchTemplates(): Promise<{ templates: EmailTemplate[]; total: number }> {
  try {
    const r = await fetch(TEMPLATES_URL, { headers: authHeaders() });
    if (!r.ok) return { templates: [], total: 0 };
    return r.json();
  } catch {
    return { templates: [], total: 0 };
  }
}

export async function fetchTemplate(id: number): Promise<EmailTemplateFull | null> {
  try {
    const r = await fetch(`${TEMPLATES_URL}?id=${id}`, { headers: authHeaders() });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export async function createTemplate(data: {
  name: string;
  category?: string;
  subject?: string;
  preheader?: string;
  body_text?: string;
  body_html?: string;
  preview_emoji?: string;
}): Promise<{ ok: boolean; id?: number; error?: string }> {
  const r = await fetch(TEMPLATES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  return r.json();
}
