import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Page, mockTemplates } from "@/data/mockData";
import { fetchEmailLogs, fetchSmtpStatus, fetchSmtpPresets, saveSmtpConfig, testSmtpConnection } from "@/api/index";
import type { EmailLog, SmtpStatus, SmtpPreset } from "@/api/index";

// ─── SMTP Wizard ──────────────────────────────────────────────────────────────

function SmtpWizard({ onClose, onSaved, currentStatus }: { onClose: () => void; onSaved: () => void; currentStatus: SmtpStatus | null }) {
  const [presets, setPresets] = useState<SmtpPreset[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPreset, setSelectedPreset] = useState<string>(currentStatus?.preset || "yandex");
  const [smtpHost, setSmtpHost] = useState(currentStatus?.smtp_host || "");
  const [smtpPort, setSmtpPort] = useState(currentStatus?.smtp_port || 465);
  const [useSsl, setUseSsl] = useState(true);
  const [useTls, setUseTls] = useState(false);
  const [username, setUsername] = useState(currentStatus?.username || "");
  const [password, setPassword] = useState("");
  const [fromEmail, setFromEmail] = useState(currentStatus?.from_email || "");
  const [fromName, setFromName] = useState(currentStatus?.from_name || "MAIL-KA");
  const [dailyLimit, setDailyLimit] = useState(currentStatus?.daily_limit || 500);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSmtpPresets().then((d) => setPresets(d.presets || []));
  }, []);

  useEffect(() => {
    const p = presets.find((x) => x.key === selectedPreset);
    if (p && selectedPreset !== "custom") {
      setSmtpHost(p.host);
      setSmtpPort(p.port);
      setUseSsl(p.use_ssl);
      setUseTls(p.use_tls);
    }
  }, [selectedPreset, presets]);

  const currentPreset = presets.find((x) => x.key === selectedPreset);

  const handleSave = async () => {
    setSaving(true);
    const res = await saveSmtpConfig({
      preset: selectedPreset,
      smtp_host: smtpHost, smtp_port: smtpPort,
      use_tls: useTls, use_ssl: useSsl,
      username, password,
      from_email: fromEmail || username,
      from_name: fromName,
      daily_limit: dailyLimit,
    });
    setSaving(false);
    if (res.ok) {
      setStep(3);
      handleTest();
    } else {
      setTestResult({ ok: false, error: res.error || "Не удалось сохранить" });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const r = await testSmtpConnection();
    setTestResult(r);
    setTesting(false);
    if (r.ok) onSaved();
  };

  const presetIcons: Record<string, string> = {
    yandex: "🟡", mailru: "🔵", gmail: "🔴", rambler: "🟢",
    yandex360: "💼", vk: "🔷", custom: "⚙️",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(8px)" }}>
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="font-bold flex items-center gap-2">
              <Icon name="Mail" size={18} style={{ color: "#8b5cf6" }} />
              Настройка SMTP-сервера
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Шаг {step} из 3</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="h-1 flex-1 rounded-full transition-all"
              style={{ background: s <= step ? "linear-gradient(90deg, #8b5cf6, #06b6d4)" : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>

        {/* Step 1 — Provider */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">Выбери почтовый сервис</h3>
              <p className="text-xs text-muted-foreground">MAIL-KA умеет отправлять через любую почту. Выбери своего провайдера.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button key={p.key}
                  onClick={() => setSelectedPreset(p.key)}
                  className={`text-left p-3 rounded-xl transition-all border ${selectedPreset === p.key ? "border-purple-500" : "border-border hover:border-white/20"}`}
                  style={selectedPreset === p.key ? { background: "rgba(139,92,246,0.08)" } : { background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{presetIcons[p.key] || "📧"}</span>
                    <span className="font-semibold text-sm">{p.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono-custom">{p.host || "—"}</div>
                </button>
              ))}
            </div>
            {currentPreset?.hint && (
              <div className="rounded-xl p-3 text-xs flex gap-2" style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <Icon name="Lightbulb" size={14} style={{ color: "#06b6d4", flexShrink: 0, marginTop: 1 }} />
                <span className="text-muted-foreground leading-relaxed">{currentPreset.hint}</span>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => setStep(2)}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                Далее →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Credentials */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">Доступы и параметры</h3>
              <p className="text-xs text-muted-foreground">Эти данные сохраняются в твоей БД зашифровано</p>
            </div>

            {selectedPreset === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">SMTP-сервер</label>
                  <input className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                    placeholder="smtp.example.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Порт</label>
                  <input type="number" className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                    value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={useSsl} onChange={(e) => { setUseSsl(e.target.checked); if (e.target.checked) setUseTls(false); }} />
                  SSL (порт 465)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={useTls} onChange={(e) => { setUseTls(e.target.checked); if (e.target.checked) setUseSsl(false); }} />
                  STARTTLS (порт 587)
                </label>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Логин (твой email) *</label>
              <input className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                placeholder="you@example.com" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Пароль приложения *</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"}
                  className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 pr-10 text-sm outline-none focus:border-purple-500"
                  placeholder="••••••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={14} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">⚠️ Не пароль от почты — а специальный пароль приложения</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Имя отправителя</label>
                <input className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                  value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email From (опц.)</label>
                <input className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                  placeholder="(тот же что логин)" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Дневной лимит писем</label>
              <input type="number" className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">Защита от блокировки. Yandex: 500/сутки, Gmail: 500/сутки, Mail.ru: 100/час</p>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Назад
              </button>
              <button onClick={handleSave} disabled={saving || !username || !password}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                {saving ? <><Icon name="Loader2" size={14} className="animate-spin" />Сохраняем...</> : <>Сохранить и проверить →</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Test */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <div className="text-center py-6">
              {testing ? (
                <>
                  <Icon name="Loader2" size={42} className="animate-spin mx-auto mb-3" style={{ color: "#8b5cf6" }} />
                  <div className="font-semibold">Проверяем подключение к {smtpHost}...</div>
                  <div className="text-xs text-muted-foreground mt-1">Подключаемся к SMTP-серверу и логинимся</div>
                </>
              ) : testResult?.ok ? (
                <>
                  <div className="text-5xl mb-3">🎉</div>
                  <div className="font-bold text-lg" style={{ color: "#4ade80" }}>Готово! SMTP подключён</div>
                  <div className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{testResult.message}</div>
                </>
              ) : testResult?.ok === false ? (
                <>
                  <div className="text-5xl mb-3">⚠️</div>
                  <div className="font-bold text-lg" style={{ color: "#f87171" }}>Не удалось подключиться</div>
                  <div className="text-sm mt-2 max-w-md mx-auto p-3 rounded-xl text-left" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                    {testResult.error}
                  </div>
                </>
              ) : null}
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Изменить настройки
              </button>
              {testResult?.ok ? (
                <button onClick={onClose}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                  Готово
                </button>
              ) : (
                <button onClick={handleTest} disabled={testing}
                  className="px-5 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8 transition-colors">
                  Проверить ещё раз
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────

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
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
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
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))" }}>
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
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
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
          <Icon name="User" size={15} style={{ color: "#8b5cf6" }} />
          Профиль
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
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
          <Icon name="Code2" size={15} style={{ color: "#06b6d4" }} />
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
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          <Icon name="Plus" size={14} />
          Создать новый ключ
        </button>
      </div>
    </div>
  );
}