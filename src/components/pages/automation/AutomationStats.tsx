import Icon from "@/components/ui/icon";
import { Flow, TEMPLATES } from "./types";

interface Props {
  flows: Flow[];
  showLibrary: boolean;
  onCloseLibrary: () => void;
}

export function AutomationStats({ flows, showLibrary, onCloseLibrary }: Props) {
  const totalActive = flows.filter((f) => f.is_active).length;
  const totalContacts = flows.reduce((s, f) => s + f.total_started, 0);
  const avgConversion = flows.length ? flows.reduce((s, f) => s + f.conversion, 0) / flows.length : 0;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Активных сценариев", value: totalActive, icon: "Zap", color: "#f59e0b" },
          { label: "Контактов в потоке", value: totalContacts.toLocaleString(), icon: "Users", color: "#8b5cf6" },
          { label: "Завершили", value: flows.reduce((s, f) => s + f.total_completed, 0).toLocaleString(), icon: "CheckCircle", color: "#10b981" },
          { label: "Средняя конверсия", value: `${avgConversion.toFixed(1)}%`, icon: "TrendingUp", color: "#06b6d4" },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 metric-card">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name={s.icon} size={14} style={{ color: s.color }} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {showLibrary && (
        <div className="glass rounded-2xl p-5 fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold">Библиотека готовых сценариев</div>
              <div className="text-xs text-muted-foreground">Выбери шаблон или создай свой с нуля</div>
            </div>
            <button onClick={onCloseLibrary} className="text-muted-foreground hover:text-foreground">
              <Icon name="X" size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TEMPLATES.map((t, i) => (
              <button key={i} className="text-left p-4 rounded-xl glass metric-card hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.08))" }}>
                  <Icon name={t.icon} size={16} style={{ color: "#8b5cf6" }} />
                </div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default AutomationStats;
