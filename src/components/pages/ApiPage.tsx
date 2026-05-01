import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const BASE_URL = "https://functions.poehali.dev/22f5c2ed-9a6b-40cb-93ac-4ce5aa5f1e3f";

interface ApiKey {
  id: number;
  name: string;
  preview: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface ApiEvent {
  id: number;
  key_name: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  status: string;
  error: string | null;
  created_at: string;
}

interface Trigger {
  id: number;
  event_name: string;
  campaign_id: number;
  campaign_name: string;
  is_active: boolean;
  created_at: string;
}

const ENDPOINTS = [
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

const METHOD_COLOR: Record<string, string> = {
  GET: "#4ade80",
  POST: "#8b5cf6",
  PUT: "#06b6d4",
  DELETE: "#f87171",
};

export function ApiPage() {
  const [tab, setTab] = useState<"keys" | "docs" | "log" | "triggers">("keys");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [openEndpoint, setOpenEndpoint] = useState<number | null>(null);

  const loadKeys = async () => {
    const r = await fetch(`${BASE_URL}?resource=keys`);
    const d = await r.json();
    setKeys(d.keys || []);
  };

  const loadEvents = async () => {
    const r = await fetch(`${BASE_URL}?resource=events`);
    const d = await r.json();
    setEvents(d.events || []);
  };

  const loadTriggers = async () => {
    const r = await fetch(`${BASE_URL}?resource=triggers`);
    const d = await r.json();
    setTriggers(d.triggers || []);
  };

  useEffect(() => {
    loadKeys();
    loadEvents();
    loadTriggers();
  }, []);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setLoading(true);
    const r = await fetch(`${BASE_URL}?resource=keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName }),
    });
    const d = await r.json();
    setCreatedKey(d.key || null);
    setNewKeyName("");
    setLoading(false);
    loadKeys();
  };

  const handleToggleKey = async (id: number, is_active: boolean) => {
    await fetch(`${BASE_URL}?resource=keys&id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !is_active }),
    });
    loadKeys();
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const tabs = [
    { id: "keys", label: "API-ключи", icon: "Key" },
    { id: "docs", label: "Документация", icon: "BookOpen" },
    { id: "log", label: "Лог событий", icon: "Activity" },
    { id: "triggers", label: "Триггеры", icon: "Zap" },
  ] as const;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="fade-in-up flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">MAIL-KA API</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Интеграция с вашими системами через REST API</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono-custom"
          style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          API активен
        </div>
      </div>

      {/* Base URL */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <div className="text-xs text-muted-foreground flex-shrink-0">Base URL</div>
        <code className="font-mono-custom text-xs flex-1 truncate" style={{ color: "#06b6d4" }}>{BASE_URL}</code>
        <button onClick={() => handleCopy(BASE_URL, -1)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <Icon name={copiedId === -1 ? "Check" : "Copy"} size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id === "log") loadEvents(); if (t.id === "triggers") loadTriggers(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            style={tab === t.id ? { background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.15))" } : {}}>
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Keys ── */}
      {tab === "keys" && (
        <div className="space-y-4">
          {/* Create */}
          <div className="glass rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold">Создать новый ключ</div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                placeholder="Название ключа (например: amoCRM prod)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
              />
              <button
                onClick={handleCreateKey}
                disabled={loading || !newKeyName.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                <Icon name="Plus" size={14} />
                {loading ? "..." : "Создать"}
              </button>
            </div>

            {createdKey && (
              <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)" }}>
                <div className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5">
                  <Icon name="AlertTriangle" size={13} />
                  Сохрани ключ — он показывается только один раз!
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono-custom text-xs flex-1 break-all" style={{ color: "#8b5cf6" }}>{createdKey}</code>
                  <button onClick={() => handleCopy(createdKey, 0)} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name={copiedId === 0 ? "Check" : "Copy"} size={14} />
                  </button>
                </div>
                <button onClick={() => setCreatedKey(null)} className="text-xs text-muted-foreground hover:text-foreground">Скрыть</button>
              </div>
            )}
          </div>

          {/* Keys list */}
          <div className="glass rounded-2xl overflow-hidden">
            {keys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Icon name="Key" size={28} className="opacity-30" />
                <div className="text-sm">Ключей ещё нет</div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                    <th className="text-left px-5 py-3">Название</th>
                    <th className="text-left px-5 py-3">Ключ</th>
                    <th className="text-left px-5 py-3 hidden md:table-cell">Создан</th>
                    <th className="text-left px-5 py-3 hidden lg:table-cell">Последнее использование</th>
                    <th className="text-left px-5 py-3">Статус</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className="border-t border-border hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5 font-medium">{k.name}</td>
                      <td className="px-5 py-3.5">
                        <code className="font-mono-custom text-xs text-muted-foreground">{k.preview}</code>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell text-xs">{fmtDate(k.created_at)}</td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell text-xs">{fmtDate(k.last_used_at)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? "bg-green-500/15 text-green-400" : "bg-white/10 text-muted-foreground"}`}>
                          {k.is_active ? "Активен" : "Отключён"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleToggleKey(k.id, k.is_active)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {k.is_active ? "Отключить" : "Включить"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Docs ── */}
      {tab === "docs" && (
        <div className="space-y-3">
          <div className="glass rounded-2xl p-4 text-sm space-y-2">
            <div className="font-semibold flex items-center gap-2">
              <Icon name="Info" size={14} style={{ color: "#06b6d4" }} />
              Аутентификация
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Все защищённые эндпоинты требуют заголовок <code className="font-mono-custom text-purple-400">X-API-Key: YOUR_KEY</code>.
              Создай ключ на вкладке «API-ключи» и используй его в каждом запросе.
            </p>
          </div>

          {ENDPOINTS.map((ep, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors"
                onClick={() => setOpenEndpoint(openEndpoint === i ? null : i)}>
                <span className="font-mono-custom text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: `${METHOD_COLOR[ep.method]}22`, color: METHOD_COLOR[ep.method] }}>
                  {ep.method}
                </span>
                <code className="font-mono-custom text-xs text-muted-foreground">{ep.path}</code>
                <span className="font-medium text-sm">{ep.title}</span>
                {ep.auth && (
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    <Icon name="Lock" size={11} />
                    API Key
                  </span>
                )}
                <Icon name={openEndpoint === i ? "ChevronUp" : "ChevronDown"} size={14} className="text-muted-foreground flex-shrink-0" />
              </button>
              {openEndpoint === i && (
                <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">{ep.desc}</p>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5">Пример запроса</div>
                    <div className="relative rounded-xl overflow-hidden" style={{ background: "#1e1b3a" }}>
                      <pre className="text-xs font-mono-custom p-4 overflow-x-auto" style={{ color: "#e2e8f0" }}>{ep.example}</pre>
                      <button
                        onClick={() => handleCopy(ep.example, i + 100)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Icon name={copiedId === i + 100 ? "Check" : "Copy"} size={13} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5">Пример ответа</div>
                    <div className="rounded-xl overflow-hidden" style={{ background: "#1e1b3a" }}>
                      <pre className="text-xs font-mono-custom p-4 overflow-x-auto" style={{ color: "#4ade80" }}>{ep.response}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Log ── */}
      {tab === "log" && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-semibold text-sm">Последние 100 вызовов</div>
            <button onClick={loadEvents} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Icon name="RefreshCw" size={12} />
              Обновить
            </button>
          </div>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Icon name="Activity" size={28} className="opacity-30" />
              <div className="text-sm">Вызовов пока не было</div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {events.map((e) => (
                <div key={e.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${e.status === "ok" ? "bg-green-400" : "bg-red-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono-custom text-xs font-semibold" style={{ color: "#8b5cf6" }}>{e.event_type}</span>
                      {e.key_name && <span className="text-xs text-muted-foreground">· {e.key_name}</span>}
                      {e.error && <span className="text-xs text-red-400">{e.error}</span>}
                    </div>
                    {e.payload && (
                      <div className="text-xs text-muted-foreground font-mono-custom mt-0.5 truncate">
                        {JSON.stringify(e.payload).slice(0, 120)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">{fmtDate(e.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Triggers ── */}
      {tab === "triggers" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Триггеры позволяют автоматически запускать кампании по событиям из внешних систем.
              Создай правило здесь, а затем отправляй события через <code className="font-mono-custom text-purple-400">POST ?resource=trigger {"{"}"event":"purchase"{"}"}</code>.
            </p>
          </div>

          {triggers.length === 0 ? (
            <div className="glass rounded-2xl flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Icon name="Zap" size={28} className="opacity-30" />
              <div className="text-sm">Триггеров пока нет</div>
              <div className="text-xs">Создай триггер через API: <code className="font-mono-custom" style={{ color: "#8b5cf6" }}>POST ?resource=triggers</code></div>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                    <th className="text-left px-5 py-3">Событие</th>
                    <th className="text-left px-5 py-3">Кампания</th>
                    <th className="text-left px-5 py-3">Статус</th>
                    <th className="text-left px-5 py-3 hidden md:table-cell">Создан</th>
                  </tr>
                </thead>
                <tbody>
                  {triggers.map((t) => (
                    <tr key={t.id} className="border-t border-border hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5">
                        <code className="font-mono-custom text-xs" style={{ color: "#8b5cf6" }}>{t.event_name}</code>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{t.campaign_name || `#${t.campaign_id}`}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_active ? "bg-green-500/15 text-green-400" : "bg-white/10 text-muted-foreground"}`}>
                          {t.is_active ? "Активен" : "Отключён"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs hidden md:table-cell">{fmtDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}