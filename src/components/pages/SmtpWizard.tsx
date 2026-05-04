import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchSmtpPresets, saveSmtpConfig, testSmtpConnection } from "@/api/index";
import type { SmtpStatus, SmtpPreset } from "@/api/index";

export function SmtpWizard({ onClose, onSaved, currentStatus }: { onClose: () => void; onSaved: () => void; currentStatus: SmtpStatus | null }) {
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
          <div className="p-4 sm:p-6 space-y-4">
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
          <div className="p-4 sm:p-6 space-y-4">
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
          <div className="p-4 sm:p-6 space-y-4">
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

export default SmtpWizard;