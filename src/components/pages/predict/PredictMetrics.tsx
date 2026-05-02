import Icon from "@/components/ui/icon";

export function PredictMetrics() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: "Прогноз пожизненной ценности", value: "₽ 8,4 млн", delta: "+18%", icon: "TrendingUp", color: "#10b981" },
        { label: "Риск ухода клиента", value: "12,4%", delta: "−3,2%", icon: "AlertTriangle", color: "#f59e0b", down: true },
        { label: "Доход от рассылок", value: "₽ 842 тыс.", delta: "+21%", icon: "Coins", color: "#8b5cf6" },
        { label: "Средний ИИ-балл клиента", value: "78", delta: "+6", icon: "Sparkles", color: "#06b6d4" },
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
  );
}

export default PredictMetrics;
