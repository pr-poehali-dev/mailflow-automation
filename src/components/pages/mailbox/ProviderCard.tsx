import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { MailboxProvider, MailboxPlan } from "@/api/mailbox";

interface Props {
  provider: MailboxProvider;
  onClickPlan: (p: MailboxProvider, plan: MailboxPlan) => void;
  onRequest: (plan: MailboxPlan) => void;
}

export default function ProviderCard({ provider, onClickPlan, onRequest }: Props) {
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
