import Icon from "@/components/ui/icon";

interface Props {
  connectedCount: number;
  totalChannels: number;
  totalSent: number;
}

export function OmniStats({ connectedCount, totalChannels, totalSent }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: "Каналов подключено", value: `${connectedCount} из ${totalChannels}`, icon: "Network", color: "#8b5cf6" },
        { label: "Отправлено сегодня", value: totalSent.toLocaleString(), icon: "Send", color: "#06b6d4" },
        { label: "Средняя доставка", value: "97.8%", icon: "CheckCircle", color: "#10b981" },
        { label: "Расход за месяц", value: "₽ 12.4K", icon: "Coins", color: "#f59e0b" },
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
  );
}

export default OmniStats;
