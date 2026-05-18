export const BASE_URL = "https://functions.poehali.dev/22f5c2ed-9a6b-40cb-93ac-4ce5aa5f1e3f";

export interface ApiKey {
  id: number;
  name: string;
  preview: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface ApiEvent {
  id: number;
  key_name: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  status: string;
  error: string | null;
  created_at: string;
}

export interface Trigger {
  id: number;
  event_name: string;
  campaign_id: number;
  campaign_name: string;
  is_active: boolean;
  created_at: string;
}

export const ENDPOINTS = [
  {
    method: "GET",
    path: "?resource=contacts",
    title: "Список контактов",
    desc: "Возвращает все контакты из базы.",
    auth: true,
    example: `curl -H "X-API-Key: YOUR_KEY" \\\n  "${BASE_URL}?resource=contacts"`,
    response: `{"contacts":[{"id":1,"name":"Иван","email":"ivan@example.ru","segment":"VIP","status":"active"}],"total":1}`,
  },
  {
    method: "GET",
    path: "?resource=campaigns",
    title: "Список кампаний",
    desc: "Возвращает все кампании с метриками.",
    auth: true,
    example: `curl -H "X-API-Key: YOUR_KEY" \\\n  "${BASE_URL}?resource=campaigns"`,
    response: `{"campaigns":[{"id":1,"name":"Летняя распродажа","status":"active","sent_count":12400,"open_rate":34.2}]}`,
  },
  {
    method: "POST",
    path: "?resource=sync",
    title: "Синхронизация контактов",
    desc: "Добавляет или обновляет контакты пачкой. Дубликаты по email обновляются.",
    auth: true,
    example: `curl -X POST -H "X-API-Key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"contacts":[{"name":"Иван","email":"ivan@example.ru","segment":"VIP"}]}' \\\n  "${BASE_URL}?resource=sync"`,
    response: `{"ok":true,"inserted":1,"updated":0,"total":1}`,
  },
  {
    method: "POST",
    path: "?resource=send",
    title: "Отправить письмо",
    desc: "Ставит письмо в очередь отправки. Для реальной доставки подключи SMTP в Интеграциях.",
    auth: true,
    example: `curl -X POST -H "X-API-Key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"to":"client@example.ru","subject":"Спасибо за покупку!","message":"Текст письма"}' \\\n  "${BASE_URL}?resource=send"`,
    response: `{"ok":true,"queued":true,"to":"client@example.ru","contact_found":true}`,
  },
  {
    method: "POST",
    path: "?resource=trigger",
    title: "Запустить триггер",
    desc: "Активирует все кампании, привязанные к указанному событию. Используй для автоматизации.",
    auth: true,
    example: `curl -X POST -H "X-API-Key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event":"purchase","email":"buyer@example.ru","meta":{"order_id":12345}}' \\\n  "${BASE_URL}?resource=trigger"`,
    response: `{"ok":true,"event":"purchase","fired_campaigns":[{"campaign_id":3,"campaign_name":"Welcome-серия"}],"count":1}`,
  },
];

export const METHOD_COLOR: Record<string, string> = {
  GET: "#4ade80",
  POST: "#8b5cf6",
  PUT: "#06b6d4",
  DELETE: "#f87171",
};

export const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};
