import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  fetchProviders, trackClick, submitRequest, fetchMyOrders,
  MailboxProvider, MailboxOrder, MailboxPlan,
} from "@/api/mailbox";
import { useAuth } from "@/contexts/AuthContext";

export default function MailboxStorePage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<MailboxProvider[]>([]);
  const [orders, setOrders] = useState<MailboxOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestModal, setRequestModal] = useState<{
    provider: MailboxProvider; plan: MailboxPlan;
  } | null>(null);

  useEffect(() => {
    Promise.all([fetchProviders(), user ? fetchMyOrders() : Promise.resolve({ orders: [] })])
      .then(([p, o]) => {
        setProviders(p.providers || []);
        setOrders(o.orders || []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const onClickPlan = async (p: MailboxProvider, plan: MailboxPlan) => {
    await trackClick(p.provider, plan.code, plan.url);
    window.open(plan.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="rounded-3xl p-7 md:p-9 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.08))",
          border: "1px solid rgba(139,92,246,0.2)",
        }}
      >
        <div
          className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
        />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Партнёрская витрина · Лицензированные операторы РФ
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 gradient-text">
            Корпоративная почта от 99 ₽/мес
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Получите красивые адреса вида <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-xs">имя@вашдомен.ру</code>{" "}
            и подключите их к рассылкам в один клик. Все провайдеры — российские,
            с серверами в РФ и соответствием 152-ФЗ.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <Tag icon="ShieldCheck" color="#10b981">152-ФЗ</Tag>
            <Tag icon="MapPin" color="#06b6d4">Серверы в РФ</Tag>
            <Tag icon="Award" color="#8b5cf6">Лицензия Роскомнадзора</Tag>
            <Tag icon="Zap" color="#f59e0b">Подключение за 5 минут</Tag>
          </div>
        </div>
      </div>

      {/* Мои заявки */}
      {user && orders.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon name="Inbox" size={15} className="text-purple-400" />
            Мои заявки на почту ({orders.length})
          </h2>
          <div className="space-y-1.5">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-border last:border-0">
                <span className="text-xs font-mono text-muted-foreground w-6">#{o.id}</span>
                <span className="font-medium flex-1">{o.provider}</span>
                <span className="text-xs text-muted-foreground">{o.plan_code || "—"}</span>
                <StatusBadge status={o.status} />
                <span className="text-[11px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("ru")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Provider cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Icon name="Loader2" size={18} className="animate-spin" />
          Загружаем тарифы...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {providers.map((p) => (
            <ProviderCard
              key={p.provider}
              provider={p}
              onClickPlan={onClickPlan}
              onRequest={(plan) => setRequestModal({ provider: p, plan })}
            />
          ))}
        </div>
      )}

      {/* FAQ / Доверие */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Icon name="HelpCircle" size={16} className="text-cyan-400" />
          Часто спрашивают
        </h2>
        <div className="space-y-4 text-sm text-muted-foreground">
          <FaqItem q="Кто на самом деле даёт почту?">
            Сами адреса предоставляют российские лицензированные операторы (Beget, Яндекс 360,
            VK WorkSpace). MAIL-KA — это витрина-агрегатор и инструмент рассылок: подбираем
            тариф, помогаем с настройкой DKIM/SPF/DMARC и подключаем ящик к кампаниям.
          </FaqItem>
          <FaqItem q="Нужна ли своя доменная зона?">
            Да, нужен домен (например, <code>company.ru</code>). Если домена нет — мы поможем
            подобрать и зарегистрировать через того же провайдера.
          </FaqItem>
          <FaqItem q="Какая комиссия и как платить?">
            Оплата идёт напрямую провайдеру по их прайсу — никаких скрытых наценок. Заявка
            «Хочу почту» нужна, чтобы менеджер помог с настройкой DNS-записей и интеграцией с MAIL-KA.
          </FaqItem>
          <FaqItem q="Безопасно ли это для 152-ФЗ?">
            Да. Все три провайдера — в реестре операторов персональных данных Роскомнадзора,
            хранят данные на серверах в РФ. Это покрывает требования 152-ФЗ и 242-ФЗ для вашего бизнеса.
          </FaqItem>
        </div>
      </section>

      {requestModal && (
        <RequestModal
          provider={requestModal.provider}
          plan={requestModal.plan}
          defaultEmail={user?.email || ""}
          defaultName={user?.name || ""}
          onClose={() => setRequestModal(null)}
          onSuccess={() => {
            setRequestModal(null);
            if (user) fetchMyOrders().then((o) => setOrders(o.orders || []));
          }}
        />
      )}
    </div>
  );
}

// ─── мелкие компоненты ────────────────────────────────────────────────────────

function Tag({ icon, color, children }: { icon: string; color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      <Icon name={icon} size={11} />
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    click: { color: "#94a3b8", label: "Клик" },
    request: { color: "#f59e0b", label: "Заявка" },
    contacted: { color: "#06b6d4", label: "В работе" },
    paid: { color: "#10b981", label: "Оплачено" },
    cancelled: { color: "#ef4444", label: "Отменено" },
  };
  const s = map[status] || map.click;
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
      style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}
    >
      {s.label}
    </span>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left text-sm font-medium text-foreground hover:text-purple-400 transition-colors"
      >
        <span>{q}</span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} />
      </button>
      {open && <div className="mt-2 text-xs leading-relaxed">{children}</div>}
    </div>
  );
}

// ─── карточка провайдера ──────────────────────────────────────────────────────

function ProviderCard({
  provider, onClickPlan, onRequest,
}: {
  provider: MailboxProvider;
  onClickPlan: (p: MailboxProvider, plan: MailboxPlan) => void;
  onRequest: (plan: MailboxPlan) => void;
}) {
  const [activePlan, setActivePlan] = useState(0);
  const plan = provider.plans[activePlan];
  const minPrice = useMemo(
    () => Math.min(...provider.plans.map((p) => p.price_rub)),
    [provider.plans],
  );

  return (
    <div
      className="rounded-2xl border bg-card overflow-hidden flex flex-col"
      style={{ borderColor: `${provider.color}40` }}
    >
      <div
        className="px-5 py-4 relative"
        style={{
          background: `linear-gradient(135deg, ${provider.color}15, transparent)`,
          borderBottom: `1px solid ${provider.color}30`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="text-3xl">{provider.logo_emoji}</div>
            <div>
              <div className="text-base font-bold">{provider.name}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Icon name="MapPin" size={10} /> {provider.country}
              </div>
            </div>
          </div>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
            style={{ background: `${provider.color}25`, color: provider.color }}
          >
            {provider.highlight}
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold" style={{ color: provider.color }}>
            от {minPrice}
          </span>
          <span className="text-xs text-muted-foreground">₽/мес</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{provider.license}</div>
      </div>

      <div className="px-5 py-4 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Что входит
        </div>
        <ul className="space-y-1.5 text-xs text-foreground">
          {provider.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Icon name="Check" size={12} className="flex-shrink-0 mt-0.5" style={{ color: provider.color }} />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Тарифы
          </div>
          <div className="grid grid-cols-3 gap-1">
            {provider.plans.map((pl, i) => (
              <button
                key={pl.code}
                onClick={() => setActivePlan(i)}
                className="px-2 py-2 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: i === activePlan ? `${provider.color}15` : "transparent",
                  border: `1px solid ${i === activePlan ? provider.color : "var(--border)"}`,
                  color: i === activePlan ? provider.color : "var(--muted-foreground)",
                }}
              >
                <div className="font-semibold">{pl.title}</div>
                <div className="text-[10px] mt-0.5">{pl.price_rub}₽</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-1 space-y-2">
        <button
          onClick={() => onRequest(plan)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
          style={{ background: `linear-gradient(135deg, ${provider.color}, ${provider.color}cc)` }}
        >
          <Icon name="Send" size={13} />
          Хочу подключить
        </button>
        <button
          onClick={() => onClickPlan(provider, plan)}
          className="w-full py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
          style={{ border: "1px solid var(--border)" }}
        >
          Открыть на сайте провайдера
          <Icon name="ExternalLink" size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── модальное окно заявки ────────────────────────────────────────────────────

function RequestModal({
  provider, plan, defaultEmail, defaultName, onClose, onSuccess,
}: {
  provider: MailboxProvider; plan: MailboxPlan;
  defaultEmail: string; defaultName: string;
  onClose: () => void; onSuccess: () => void;
}) {
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] font-medium text-muted-foreground mb-1">{label}</div>
      {children}
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}
