import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { StatusBadge } from "@/components/shared";
import { Page, mockTemplates } from "@/data/mockData";
import { fetchEmailLogs, fetchUnisenderStatus } from "@/api/index";
import type { EmailLog, UnisenderStatus } from "@/api/index";

// ─── Integrations ─────────────────────────────────────────────────────────────

export function Integrations() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [status, setStatus] = useState<UnisenderStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const loadLogs = async () => {
    setLoadingLogs(true);
    const d = await fetchEmailLogs();
    setLogs(d.logs || []);
    setLoadingLogs(false);
  };

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const s = await fetchUnisenderStatus();
      setStatus(s);
    } catch {
      setStatus({ provider: "Unisender", connected: false, error: "Сервис недоступен" });
    }
    setLoadingStatus(false);
  };

  useEffect(() => { loadLogs(); loadStatus(); }, []);

  const isConnected = status?.connected === true;

  const integrationList = [
    {
      name: "Unisender",
      icon: "📮",
      status: isConnected ? "connected" : "disconnected",
      desc: "Российский email-сервис · 152-ФЗ",
      detail: isConnected ? "Письма доставляются через Unisender (РФ). Серверы в России, оплата с карт РФ." : "Не подключён — добавь UNISENDER_API_KEY в секреты",
    },
    { name: "СберПочта Cloud", icon: "💚", status: "disconnected", desc: "Транзакционные письма от Сбера" },
    { name: "Bitrix24", icon: "🔗", status: "disconnected", desc: "CRM синхронизация" },
    { name: "amoCRM", icon: "💼", status: "disconnected", desc: "Контакты и сделки" },
    { name: "Telegram Bot", icon: "✈️", status: "disconnected", desc: "Уведомления в чат" },
    { name: "Webhook", icon: "⚡", status: "disconnected", desc: "Кастомные события" },
  ];

  const fmtDate = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const statusBg = isConnected ? "rgba(74,222,128,0.07)" : "rgba(251,146,60,0.07)";
  const statusBorder = isConnected ? "rgba(74,222,128,0.25)" : "rgba(251,146,60,0.25)";
  const statusColor = isConnected ? "#4ade80" : "#fb923c";

  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up">
        <h1 className="text-2xl font-bold">Интеграции</h1>
        <p className="text-muted-foreground text-sm mt-0.5">CRM, российские почтовые сервисы, вебхуки</p>
      </div>

      {/* Unisender status banner */}
      <div className="rounded-2xl p-4" style={{ background: statusBg, border: `1px solid ${statusBorder}` }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-3xl">📮</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm flex items-center gap-2">
              {loadingStatus ? "Проверяем подключение..." : isConnected ? "Unisender подключён" : "Unisender не подключён"}
              <span className="text-xs">🇷🇺</span>
              {!loadingStatus && (
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: statusColor, animation: isConnected ? "pulse 2s infinite" : "none" }} />
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isConnected ? (
                <>
                  {status?.email && <span>{status.email} · </span>}
                  Баланс: <span className="text-foreground font-semibold">{status?.balance} {status?.currency}</span>
                  {status?.tariff && <span> · {status.tariff}</span>}
                  <span> · {logs.length} писем отправлено</span>
                </>
              ) : (
                <span>{status?.error || "Добавь UNISENDER_API_KEY в секреты, чтобы отправлять письма"}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 flex-shrink-0"
            style={{ background: `${statusColor}25`, color: statusColor }}>
            <Icon name="Activity" size={12} />
            {showLogs ? "Скрыть лог" : "Лог отправок"}
          </button>
        </div>
      </div>

      {/* Email logs */}
      {showLogs && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="text-sm font-semibold">История отправок</div>
            <button onClick={loadLogs} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Icon name="RefreshCw" size={12} />Обновить
            </button>
          </div>
          {loadingLogs ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
              <Icon name="Loader2" size={15} className="animate-spin" />Загружаем...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Писем пока не отправлено</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                  <th className="text-left px-5 py-3">Кому</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Тема</th>
                  <th className="text-left px-5 py-3">Статус</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Кампания</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Время</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3 font-mono-custom text-xs">{l.to}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden md:table-cell truncate max-w-xs">{l.subject}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === "sent" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                        {l.status === "sent" ? "Доставлено" : "Ошибка"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs hidden lg:table-cell">{l.campaign || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs hidden md:table-cell">{fmtDate(l.sent_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrationList.map((intg, i) => (
          <div key={i} className="glass rounded-2xl p-5 metric-card">
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{intg.icon}</div>
              <StatusBadge status={intg.status} />
            </div>
            <div className="font-semibold">{intg.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{intg.desc}</div>
            {intg.detail && <div className="text-xs mt-2 leading-relaxed" style={{ color: "#4ade80" }}>{intg.detail}</div>}
            <button
              className={`mt-4 w-full py-2 rounded-xl text-xs font-semibold transition-colors ${intg.status === "connected" ? "bg-white/5 hover:bg-white/8 text-muted-foreground" : "text-white"}`}
              style={intg.status !== "connected" ? { background: "linear-gradient(135deg, #a855f7, #22d3ee)" } : {}}>
              {intg.status === "connected" ? "Настроить" : "Подключить"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function Templates({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Шаблоны</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Библиотека готовых писем</p>
        </div>
        <button
          onClick={() => setPage("editor")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
          <Icon name="Plus" size={15} />
          Создать шаблон
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["Все", "Онбординг", "Продажи", "Контент", "Триггер", "Retention"].map((cat) => (
          <button key={cat} className="px-3 py-1.5 rounded-xl text-xs font-medium glass hover:bg-white/8 transition-colors">
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTemplates.map((t) => (
          <div key={t.id} className="glass rounded-2xl overflow-hidden metric-card group cursor-pointer">
            <div className="h-32 flex items-center justify-center text-5xl relative"
              style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(34,211,238,0.05))" }}>
              {t.preview}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => setPage("editor")} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-500 hover:bg-purple-400 transition-colors">
                  Редактировать
                </button>
                <button onClick={() => setPage("campaigns")} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/20 hover:bg-white/30 transition-colors">
                  Использовать
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="font-semibold text-sm">{t.name}</div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>
                  {t.category}
                </span>
                <span className="text-xs text-muted-foreground">{t.uses} использований</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [twofa, setTwofa] = useState(false);
  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="fade-in-up">
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Профиль, безопасность, API</p>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Icon name="User" size={15} style={{ color: "#a855f7" }} />
          Профиль
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
            А
          </div>
          <div>
            <div className="font-semibold">Алексей Смирнов</div>
            <div className="text-sm text-muted-foreground">admin@company.ru</div>
          </div>
          <button className="ml-auto px-3 py-1.5 rounded-xl text-xs font-medium glass hover:bg-white/8 transition-colors">
            Изменить
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[["Имя", "Алексей"], ["Фамилия", "Смирнов"], ["Email", "admin@company.ru"], ["Телефон", "+7 999 123-45-67"]].map(([l, v]) => (
            <div key={l}>
              <label className="text-xs text-muted-foreground block mb-1">{l}</label>
              <input defaultValue={v} className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Icon name="ShieldCheck" size={15} style={{ color: "#4ade80" }} />
          Безопасность
        </h2>
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="text-sm font-medium">Двухфакторная аутентификация (2FA)</div>
            <div className="text-xs text-muted-foreground">Защита через приложение-аутентификатор</div>
          </div>
          <button
            onClick={() => setTwofa(!twofa)}
            className={`relative w-11 h-6 rounded-full transition-colors ${twofa ? "bg-purple-500" : "bg-white/10"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${twofa ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
          <Icon name="Key" size={14} />
          Изменить пароль
        </button>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Icon name="Code2" size={15} style={{ color: "#22d3ee" }} />
          API-ключи
        </h2>
        <div className="space-y-2">
          {["Продакшн ключ", "Тестовый ключ"].map((k, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-0.5">{k}</div>
                <div className="font-mono-custom text-xs text-muted-foreground">mf_{"•".repeat(32)}</div>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="Copy" size={14} />
              </button>
              <button className="text-muted-foreground hover:text-red-400 transition-colors">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          ))}
        </div>
        <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
          <Icon name="Plus" size={14} />
          Создать новый ключ
        </button>
      </div>
    </div>
  );
}