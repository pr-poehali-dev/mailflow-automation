import { useState } from "react";
import Icon from "@/components/ui/icon";
import { submitRequest, MailboxProvider, MailboxPlan } from "@/api/mailbox";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] font-medium text-muted-foreground mb-1">{label}</div>
      {children}
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}

interface Props {
  provider: MailboxProvider;
  plan: MailboxPlan;
  defaultEmail: string;
  defaultName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestModal({
  provider, plan, defaultEmail, defaultName, onClose, onSuccess,
}: Props) {
  const [domain, setDomain] = useState("");
  const [count, setCount] = useState(1);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const r = await submitRequest({
      provider: provider.provider,
      plan_code: plan.code,
      domain: domain.trim(),
      mailboxes_count: count,
      contact_name: name.trim(),
      contact_email: email.trim(),
      contact_phone: phone.trim(),
      notes: notes.trim(),
    });
    setLoading(false);
    if (r.ok) setDone(true);
    else setError(r.error || "Не удалось отправить заявку");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in-up"
      style={{ background: "rgba(10,10,22,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{provider.logo_emoji}</div>
            <div>
              <div className="text-base font-bold">Заявка: {provider.name}</div>
              <div className="text-xs text-muted-foreground">
                {plan.title} · {plan.price_rub} ₽/{plan.period}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={16} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <div
              className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)" }}
            >
              <Icon name="Check" size={26} className="text-emerald-500" />
            </div>
            <div className="text-base font-semibold mb-1">Заявка принята!</div>
            <p className="text-xs text-muted-foreground mb-4">
              Менеджер свяжется в течение рабочего дня. Поможем настроить DNS-записи
              и подключить почту к рассылкам.
            </p>
            <button
              type="button"
              onClick={onSuccess}
              className="w-full py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${provider.color}, ${provider.color}cc)` }}
            >
              Готово
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Ваш домен" hint="Например: company.ru">
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="company.ru"
                className="input-base"
              />
            </Field>

            <Field label="Сколько ящиков нужно">
              <input
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="input-base"
              />
            </Field>

            <Field label="Имя контактного лица *">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-base"
              />
            </Field>

            <Field label="Email для связи *">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-base"
              />
            </Field>

            <Field label="Телефон (опционально)">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 999 123-45-67"
                className="input-base"
              />
            </Field>

            <Field label="Комментарий" hint="Что важно учесть, какие почты создать">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="input-base resize-none"
              />
            </Field>

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg flex items-center gap-2"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                <Icon name="AlertCircle" size={12} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${provider.color}, ${provider.color}cc)` }}
            >
              {loading ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Send" size={13} />}
              Отправить заявку
            </button>

            <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed">
              Нажимая «Отправить», вы соглашаетесь с{" "}
              <a href="/legal/privacy" target="_blank" className="underline">обработкой персональных данных</a>{" "}
              для связи с менеджером.
            </p>
          </div>
        )}
      </form>

      <style>{`
        .input-base {
          width: 100%;
          padding: 8px 12px;
          border-radius: 10px;
          background: var(--secondary);
          border: 1px solid var(--border);
          font-size: 13px;
          color: var(--foreground);
          outline: none;
          transition: border-color .15s;
        }
        .input-base:focus { border-color: ${provider.color}; }
      `}</style>
    </div>
  );
}
