const CONTACTS_URL = "https://functions.poehali.dev/e938db61-de81-42d6-bc17-6817a4a5b16a";
const CAMPAIGNS_URL = "https://functions.poehali.dev/13fdf164-c160-4754-9ca2-83d129d19672";
export const SEND_EMAIL_URL = "https://functions.poehali.dev/9861b492-d3a2-48ef-9407-3b07e1d55181";
export const AI_URL = "https://functions.poehali.dev/c68bcc0b-3f9c-41f3-a8a7-ece9ae02be61";

export interface Contact {
  id: number;
  name: string;
  email: string;
  segment: string;
  status: string;
  created_at: string | null;
}

export interface Campaign {
  id: number;
  name: string;
  status: string;
  subject: string;
  preheader: string;
  body_text: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  created_at: string | null;
  sent_at: string | null;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  stats: { contacts_count: number; total_sent: number; avg_open_rate: number };
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function fetchContacts(): Promise<{ contacts: Contact[]; total: number }> {
  const r = await fetch(CONTACTS_URL);
  return r.json();
}

export async function createContact(data: { name: string; email: string; segment?: string }): Promise<{ ok: boolean; id?: number; error?: string }> {
  const r = await fetch(CONTACTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function deleteContact(id: number): Promise<void> {
  await fetch(`${CONTACTS_URL}/${id}`, { method: "DELETE" });
}

export async function importContacts(contacts: { name: string; email: string; segment?: string }[]): Promise<{ ok: boolean; inserted: number }> {
  const r = await fetch(CONTACTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contacts }),
  });
  return r.json();
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export async function fetchCampaigns(): Promise<CampaignsResponse> {
  const r = await fetch(CAMPAIGNS_URL);
  return r.json();
}

export async function createCampaign(data: { name: string; subject?: string; preheader?: string; body_text?: string; status?: string }): Promise<{ ok: boolean; id?: number }> {
  const r = await fetch(CAMPAIGNS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function updateCampaign(id: number, data: Partial<Campaign>): Promise<void> {
  await fetch(`${CAMPAIGNS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCampaign(id: number): Promise<void> {
  await fetch(`${CAMPAIGNS_URL}/${id}`, { method: "DELETE" });
}

// ─── Email sending (Unisender) ─────────────────────────────────────────────────

export interface EmailLog {
  id: number;
  to: string;
  subject: string;
  status: string;
  provider_id: string | null;
  error: string | null;
  sent_at: string;
  campaign: string | null;
}

export interface SmtpStatus {
  provider: string;
  connected: boolean;
  smtp_host?: string;
  smtp_port?: number;
  username?: string;
  from_email?: string;
  from_name?: string;
  preset?: string;
  daily_limit?: number;
  today_sent?: number;
  test_status?: string;
  error?: string;
}

export interface SmtpPreset {
  key: string;
  label: string;
  host: string;
  port: number;
  use_ssl: boolean;
  use_tls: boolean;
  hint: string;
}

// Backward-compat (старое название):
export type UnisenderStatus = SmtpStatus;

export const fetchSmtpStatus = async (): Promise<SmtpStatus> => {
  const r = await fetch(`${SEND_EMAIL_URL}?action=status`);
  return r.json();
};

export const fetchUnisenderStatus = fetchSmtpStatus;

export const fetchSmtpPresets = async (): Promise<{ presets: SmtpPreset[] }> => {
  const r = await fetch(`${SEND_EMAIL_URL}?action=presets`);
  return r.json();
};

export const saveSmtpConfig = async (data: {
  preset?: string; smtp_host: string; smtp_port: number;
  use_tls: boolean; use_ssl: boolean;
  username: string; password: string;
  from_email?: string; from_name?: string; daily_limit?: number;
}): Promise<{ ok: boolean; id?: number; error?: string }> => {
  const r = await fetch(`${SEND_EMAIL_URL}?action=config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
};

export const testSmtpConnection = async (): Promise<{ ok: boolean; message?: string; error?: string }> => {
  const r = await fetch(`${SEND_EMAIL_URL}?action=test_smtp`, { method: "POST" });
  return r.json();
};

export async function sendTestEmail(data: {
  to: string; subject: string; text: string; from_name?: string; from_email?: string;
}): Promise<{ ok: boolean; error?: string; message_id?: string; provider?: string }> {
  const r = await fetch(`${SEND_EMAIL_URL}?action=test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function sendCampaignBlast(data: {
  campaign_id: number; segment?: string;
}): Promise<{ ok: boolean; sent: number; failed: number; total: number; errors?: { email: string; error: string }[] }> {
  const r = await fetch(`${SEND_EMAIL_URL}?action=blast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function fetchEmailLogs(): Promise<{ logs: EmailLog[] }> {
  const r = await fetch(`${SEND_EMAIL_URL}?action=logs`);
  return r.json();
}

// ─── AI Copywriter (polza.ai) ─────────────────────────────────────────────────

export interface AiGenerateResult {
  ok: boolean;
  subject?: string;
  preheader?: string;
  body?: string;
  cta_text?: string;
  error?: string;
  tokens?: number;
}

export interface AiSubjectVariant {
  type: string;
  text: string;
  why: string;
}

export interface AiSpamCheck {
  ok: boolean;
  spam_score: number;
  issues: string[];
  suggestions: string[];
  readability: string;
}

export interface AiPredict {
  ok: boolean;
  predicted_open_rate: number;
  rating: string;
  reason: string;
  improvements: string[];
}

export async function aiGenerate(data: {
  brief: string; tone?: string; audience?: string; goal?: string; model?: string;
}): Promise<AiGenerateResult> {
  const r = await fetch(`${AI_URL}?action=generate`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function aiImprove(text: string, instruction: string, model?: string): Promise<{ ok: boolean; text?: string; error?: string }> {
  const r = await fetch(`${AI_URL}?action=improve`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, instruction, model }),
  });
  return r.json();
}

export async function aiSubjects(body: string, context?: string, model?: string): Promise<{ ok: boolean; variants?: AiSubjectVariant[]; error?: string }> {
  const r = await fetch(`${AI_URL}?action=subject`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, context, model }),
  });
  return r.json();
}

export async function aiSpamCheck(subject: string, text: string, model?: string): Promise<AiSpamCheck> {
  const r = await fetch(`${AI_URL}?action=spam_check`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, text, model }),
  });
  return r.json();
}

export async function aiPredict(subject: string, model?: string): Promise<AiPredict> {
  const r = await fetch(`${AI_URL}?action=predict`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, model }),
  });
  return r.json();
}