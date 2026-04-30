const CONTACTS_URL = "https://functions.poehali.dev/e938db61-de81-42d6-bc17-6817a4a5b16a";
const CAMPAIGNS_URL = "https://functions.poehali.dev/13fdf164-c160-4754-9ca2-83d129d19672";

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
