import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchEmailLogs, fetchSmtpStatus } from "@/api/index";
import type { EmailLog, SmtpStatus } from "@/api/index";
import { SmtpWizard } from "./SmtpWizard";

export function Integrations() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [status, setStatus] = useState<SmtpStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const loadLogs = async () => {
    setLoadingLogs(true);
    const d = await fetchEmailLogs();
    setLogs(d.logs || []);
    setLoadingLogs(false);
  };

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const s = await fetchSmtpStatus();
      setStatus(s);
    } catch {
      setStatus({ provider: "Свой SMTP", connected: false, error: "Сервис недоступен" });
    }
    setLoadingStatus(false);
  };

  useEffect(() => { loadLogs(); loadStatus(); }, []);

  const isConnected = status?.connected === true;
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const presetLabels: Record<string, string> = {
    yandex: "Яндекс Почта", mailru: "Mail.ru", gmail: "Gmail", rambler: "Rambler",
    yandex360: "Яндекс 360", vk: "VK Mail", custom: "Свой SMTP",
  };

  const usagePercent = status?.daily_limit ? Math.min(100, ((status?.today_sent || 0) / status.daily_limit) * 100) : 0;

  return (
    <div className="p-6 space-y-5">
      {showWizard && <SmtpWizard onClose={() => { setShowWizard(false); loadStatus(); }} onSaved={loadStatus} currentStatus={status} />}

      <div className="fade-in-up flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Интеграции</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Собственный SMTP-движок · CRM · Webhooks</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))", border: "1px solid rgba(139,92,246,0.3)" }}>
          <Icon name="Server" size={13} style={{ color: "#8b5cf6" }} />
          <span>Свой движок · без сторонних сервисов</span>
        </div>
      </div>

      {/* SMTP Hero card */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
            style={{ background: isConnected ? "linear-gradient(135deg, rgba(74,222,128,0.2), rgba(6,182,212,0.1))" : "rgba(255,255,255,0.05)" }}>
            {isConnected ? "✅" : "⚙️"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg">SMTP-движок MAIL-KA</h3>
              {!loadingStatus && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: isConnected ? "rgba(74,222,128,0.15)" : "rgba(251,146,60,0.15)",
                           color: isConnected ? "#4ade80" : "#fb923c" }}>
                  {isConnected ? "Активен" : "Не настроен"}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {loadingStatus ? "Проверяем..." : isConnected ? (
                <>
                  Подключено: <span className="text-foreground font-medium">{presetLabels[status?.preset || ""] || status?.smtp_host}</span>
                  {" · "}<code className="font-mono-custom text-xs">{status?.username}</code>
                </>
              ) : (
                "Подключи любую почту: Yandex, Mail.ru, Gmail, корпоративный сервер"
              )}
            </p>

            {isConnected && status?.daily_limit && (
              <div className="mt-3 max-w-md">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Сегодня отправлено</span>
                  <span className="font-mono-custom">{status?.today_sent || 0} / {status.daily_limit}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${usagePercent}%`,
                             background: usagePercent > 80 ? "#fb923c" : "linear-gradient(90deg, #8b5cf6, #06b6d4)" }} />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowLogs(!showLogs)}
              className="text-xs px-3 py-2 rounded-xl font-medium glass hover:bg-white/8 transition-colors flex items-center gap-1.5">
              <Icon name="Activity" size={13} />
              Лог ({logs.length})
            </button>
            <button onClick={() => setShowWizard(true)}
              className="text-xs px-4 py-2 rounded-xl font-semibold text-white flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              <Icon name={isConnected ? "Settings" : "Plus"} size={13} />
              {isConnected ? "Настроить" : "Подключить SMTP"}
            </button>
          </div>
        </div>

        {/* Feature pills */}
        <div className="border-t border-border px-5 py-3 flex items-center gap-3 flex-wrap text-xs">
          {[
            { icon: "Lock", label: "Свой ключ — свои данные" },
            { icon: "Server", label: "Любой SMTP-сервер" },
            { icon: "Variable", label: "Переменные {{first_name}}" },
            { icon: "Zap", label: "Триггеры по событиям" },
            { icon: "Activity", label: "Полный лог отправок" },
          ].map((f, i) => (
            <span key={i} className="flex items-center gap-1.5 text-muted-foreground">
              <Icon name={f.icon} size={11} style={{ color: "#8b5cf6" }} />
              {f.label}
            </span>
          ))}
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

      {/* Дополнительные интеграции */}
      <div>
        <div className="text-sm font-semibold mb-3 text-muted-foreground">Дополнительные интеграции</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Bitrix24", icon: "🔗", desc: "Импорт контактов и сделок из CRM" },
            { name: "amoCRM", icon: "💼", desc: "Двусторонняя синхронизация" },
            { name: "Telegram Bot", icon: "✈️", desc: "Уведомления о доставке писем" },
            { name: "Webhooks", icon: "⚡", desc: "Кастомные события через HTTP" },
            { name: "Google Sheets", icon: "📊", desc: "Импорт контактов из таблиц" },
            { name: "1С-Битрикс", icon: "🅱️", desc: "Интеграция с интернет-магазином" },
          ].map((intg, i) => (
            <div key={i} className="glass rounded-2xl p-5 metric-card">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{intg.icon}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">скоро</span>
              </div>
              <div className="font-semibold">{intg.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{intg.desc}</div>
              <button className="mt-4 w-full py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/8 text-muted-foreground transition-colors">
                Уведомить о запуске
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Integrations;
