import Icon from "@/components/ui/icon";

interface Cohort {
  contact: string;
  email: string;
  ltv: number;
  churn_risk: number;
  best_time: string;
  segment: string;
  score: number;
}

const COHORTS: Cohort[] = [
  { contact: "Анна Морозова", email: "anna@company.ru", ltv: 84200, churn_risk: 12, best_time: "10:30", segment: "VIP", score: 94 },
  { contact: "Игорь Петров",  email: "igor@biz.ru",     ltv: 67800, churn_risk: 8,  best_time: "09:15", segment: "VIP", score: 91 },
  { contact: "Дмитрий Козлов", email: "d.kozlov@mail.ru", ltv: 42100, churn_risk: 23, best_time: "19:00", segment: "Активный", score: 78 },
  { contact: "Елена Новикова", email: "enov@firm.ru",   ltv: 38500, churn_risk: 15, best_time: "14:30", segment: "Активный", score: 82 },
  { contact: "Сергей Волков", email: "s.volkov@corp.ru", ltv: 29400, churn_risk: 41, best_time: "11:00", segment: "Активный", score: 65 },
  { contact: "Мария Соколова", email: "msok@yandex.ru",  ltv: 12300, churn_risk: 78, best_time: "20:45", segment: "Спящий", score: 32 },
];

const RETENTION = [100, 87, 74, 65, 58, 52, 48, 45, 43, 41, 40, 39];
const REVENUE = [
  { month: "Янв", value: 412 },
  { month: "Фев", value: 489 },
  { month: "Мар", value: 567 },
  { month: "Апр", value: 642 },
  { month: "Май", value: 718 },
  { month: "Июн", value: 842 },
];

export function PredictPage() {
  const maxRev = Math.max(...REVENUE.map((r) => r.value));

  const getScoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#06b6d4" : s >= 40 ? "#f59e0b" : "#ef4444";
  const getRiskColor = (r: number) => r < 25 ? "#10b981" : r < 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Predictive Analytics
            <span className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>AI</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">LTV-прогноз, churn risk, best send time, attribution</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8">
          <Icon name="Download" size={14} />
          Экспорт в Excel
        </button>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Прогнозируемый LTV", value: "₽ 8.4M", delta: "+18%", icon: "TrendingUp", color: "#10b981" },
          { label: "Churn risk", value: "12.4%", delta: "-3.2%", icon: "AlertTriangle", color: "#f59e0b", down: true },
          { label: "Revenue attribution", value: "₽ 842K", delta: "+21%", icon: "Coins", color: "#8b5cf6" },
          { label: "AI Score (avg)", value: "78", delta: "+6", icon: "Sparkles", color: "#06b6d4" },
        ].map((m, i) => (
          <div key={i} className="glass rounded-2xl p-4 metric-card">
            <div className="flex items-center justify-between mb-2">
              <Icon name={m.icon} size={15} style={{ color: m.color }} />
              <span className="text-xs font-semibold" style={{ color: m.down ? "#10b981" : m.color }}>{m.delta}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue forecast */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold">Revenue от рассылок</h2>
              <p className="text-xs text-muted-foreground">Прогноз на следующий квартал</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full" style={{ background: "#8b5cf6" }} />Факт</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full opacity-50" style={{ background: "#06b6d4" }} />Прогноз</span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-44">
            {REVENUE.map((r, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-semibold" style={{ color: i >= 4 ? "#06b6d4" : "#8b5cf6" }}>₽{r.value}K</div>
                <div className="w-full rounded-t-md chart-bar"
                  style={{
                    height: `${(r.value / maxRev) * 140}px`,
                    background: i >= 4
                      ? "linear-gradient(180deg, #06b6d4, rgba(6,182,212,0.4))"
                      : "linear-gradient(180deg, #8b5cf6, rgba(139,92,246,0.4))",
                    animationDelay: `${i * 0.08}s`,
                    opacity: i >= 4 ? 0.7 : 1,
                  }} />
                <span className="text-xs text-muted-foreground">{r.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cohort retention */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="font-bold">Retention curve</h2>
            <p className="text-xs text-muted-foreground">Когорта апрель 2026</p>
          </div>
          <div className="space-y-2">
            {RETENTION.slice(0, 8).map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-12 font-mono-custom">М{i}</span>
                <div className="flex-1 h-5 rounded-md bg-secondary overflow-hidden">
                  <div className="h-full rounded-md flex items-center justify-end px-2 text-[10px] font-bold text-white"
                    style={{
                      width: `${v}%`,
                      background: `linear-gradient(90deg, #8b5cf6 0%, #06b6d4 ${v}%)`,
                    }}>
                    {v >= 30 && `${v}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best send time AI */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold flex items-center gap-2">
              <Icon name="Clock" size={16} style={{ color: "#06b6d4" }} />
              Best Send Time AI
            </h2>
            <p className="text-xs text-muted-foreground">Для каждого контакта свой идеальный час — open rate растёт в 2-3 раза</p>
          </div>
          <button className="text-xs px-3 py-1.5 rounded-lg font-medium glass hover:bg-white/8 flex items-center gap-1">
            <Icon name="Zap" size={11} />Включить для всех
          </button>
        </div>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 24 }).map((_, hour) => {
            const intensity = hour >= 9 && hour <= 11 ? 0.95 :
                              hour >= 14 && hour <= 16 ? 0.85 :
                              hour >= 19 && hour <= 21 ? 0.78 :
                              hour >= 7 && hour <= 8 ? 0.5 : 0.2;
            return (
              <div key={hour} className="flex flex-col items-center gap-1">
                <div className="w-full h-12 rounded-md transition-all hover:scale-110 cursor-pointer"
                  style={{ background: `linear-gradient(180deg, rgba(139,92,246,${intensity}), rgba(6,182,212,${intensity * 0.5}))` }}
                  title={`${hour}:00 — ${Math.round(intensity * 100)}% активность`} />
                <span className="text-[9px] text-muted-foreground">{hour}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top contacts by AI score */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-bold">Топ контакты по AI-скорингу</h2>
            <p className="text-xs text-muted-foreground">Engagement score, прогноз LTV и риск ухода</p>
          </div>
          <span className="text-xs text-muted-foreground">обновлено сегодня</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
              <th className="text-left px-5 py-3">Контакт</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Сегмент</th>
              <th className="text-left px-5 py-3">AI Score</th>
              <th className="text-left px-5 py-3 hidden lg:table-cell">LTV прогноз</th>
              <th className="text-left px-5 py-3">Churn risk</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Best time</th>
            </tr>
          </thead>
          <tbody>
            {COHORTS.map((c, i) => (
              <tr key={i} className="border-t border-border hover:bg-white/3 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium text-sm">{c.contact}</div>
                  <div className="text-xs text-muted-foreground font-mono-custom">{c.email}</div>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>{c.segment}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: getScoreColor(c.score) }} />
                    </div>
                    <span className="font-bold text-sm" style={{ color: getScoreColor(c.score) }}>{c.score}</span>
                  </div>
                </td>
                <td className="px-5 py-3 hidden lg:table-cell">
                  <span className="font-mono-custom text-sm font-semibold">₽ {c.ltv.toLocaleString()}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="font-bold" style={{ color: getRiskColor(c.churn_risk) }}>{c.churn_risk}%</span>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <span className="font-mono-custom text-xs">{c.best_time}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PredictPage;
