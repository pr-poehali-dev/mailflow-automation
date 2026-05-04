import Icon from "@/components/ui/icon";
import { Plan } from "./data";

interface Props {
  plans: Plan[];
  yearly: boolean;
  setYearly: (v: boolean) => void;
  calcPrice: (monthly: number) => number;
  calcSaving: (monthly: number) => number;
  onSelectPlan: (plan: Plan) => void;
}

export function PlanCards({ plans, yearly, setYearly, calcPrice, calcSaving, onSelectPlan }: Props) {
  return (
    <>
      {/* Switcher month/year */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium transition-colors ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
          Помесячно
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className="relative w-14 h-7 rounded-full transition-colors"
          style={{ background: yearly ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "rgba(0,0,0,0.1)" }}>
          <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${yearly ? "translate-x-7" : "translate-x-0.5"}`} />
        </button>
        <span className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
          Год
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}>
            −30%
          </span>
        </span>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
        {plans.map((plan, idx) => (
          <div key={plan.id}
            className={`relative rounded-2xl p-6 fade-in-up transition-all metric-card ${
              plan.highlight ? "shadow-2xl" : "glass"
            }`}
            style={{
              animationDelay: `${idx * 0.1}s`,
              background: plan.highlight ? plan.gradient : undefined,
              border: plan.highlight ? `2px solid ${plan.color}` : "1px solid var(--border)",
              transform: plan.highlight ? "scale(1.02)" : undefined,
              boxShadow: plan.highlight ? `0 20px 50px ${plan.color}25` : undefined,
            }}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                style={{ background: `linear-gradient(135deg, ${plan.color}, #06b6d4)` }}>
                {plan.badge}
              </div>
            )}

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}30` }}>
                  <Icon name={plan.id === "start" ? "Zap" : plan.id === "pro" ? "Sparkles" : "Crown"}
                    size={18} style={{ color: plan.color }} />
                </div>
                <div>
                  <div className="font-bold text-xl">{plan.name}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{plan.tagline}</p>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-bold" style={{ color: plan.color }}>
                  {calcPrice(plan.monthly).toLocaleString("ru-RU")}
                </span>
                <span className="text-sm text-muted-foreground">₽/мес</span>
              </div>
              {yearly ? (
                <div className="mt-1 space-y-0.5">
                  <div className="text-xs text-muted-foreground line-through">
                    {plan.monthly.toLocaleString("ru-RU")} ₽/мес
                  </div>
                  <div className="text-xs font-semibold" style={{ color: "#10b981" }}>
                    Экономия {calcSaving(plan.monthly).toLocaleString("ru-RU")} ₽ в год
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-1">При оплате за год — −30%</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5 py-3 border-t border-b border-border">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Контакты</div>
                <div className="text-sm font-bold">{plan.contacts}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Письма</div>
                <div className="text-sm font-bold">{plan.emails}</div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan(plan)}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.02] ${
                plan.highlight ? "text-white" : "glass hover:bg-white/8"
              }`}
              style={plan.highlight ? { background: `linear-gradient(135deg, ${plan.color}, #06b6d4)` } : {}}>
              {plan.cta}
            </button>

            <div className="mt-5 space-y-2.5">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: f.included ? (f.highlight ? `${plan.color}25` : "rgba(16,185,129,0.15)") : "rgba(0,0,0,0.05)",
                    }}>
                    <Icon name={f.included ? "Check" : "X"} size={10}
                      style={{ color: f.included ? (f.highlight ? plan.color : "#10b981") : "#94a3b8" }} />
                  </div>
                  <span className={f.included ? (f.highlight ? "font-semibold" : "") : "text-muted-foreground line-through"}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default PlanCards;