import Icon from "@/components/ui/icon";
import { GlobalStats, ContactScore } from "@/api/pro";

interface Props {
  stats: GlobalStats;
  contacts: ContactScore[];
}

// Простая модель LTV: средний чек × предполагаемая частота × вероятность.
// Используем общую открываемость как proxy для лояльности.
function estimateLTV(stats: GlobalStats, contacts: ContactScore[]): number {
  if (stats.active_contacts === 0) return 0;
  const avgPrice = 1500; // средний условный чек заказа
  const conversion = Math.max(0.005, stats.click_rate / 100 * 0.15); // ~15% кликнувших платят
  const loyaltyMonths = Math.max(3, Math.min(36, (stats.avg_score || 50) / 3));
  return Math.round(stats.active_contacts * avgPrice * conversion * loyaltyMonths);
}

function formatRub(n: number): string {
  if (n >= 1_000_000) return `₽ ${(n / 1_000_000).toFixed(1).replace(".", ",")} млн`;
  if (n >= 1_000) return `₽ ${Math.round(n / 1000)} тыс.`;
  return `₽ ${n.toLocaleString("ru-RU")}`;
}

export function PredictMetrics({ stats, contacts }: Props) {
  const ltv = estimateLTV(stats, contacts);

  // Риск ухода = доля контактов с score < 30
  const lowScore = contacts.filter((c) => (c.score ?? 50) < 30).length;
  const churnRisk = contacts.length > 0
    ? Math.round((lowScore * 1000) / contacts.length) / 10
    : 0;

  // Доход от рассылок ≈ кликнувшие × средний чек × конверсия
  const revenue = Math.round(stats.total_clicked * 1500 * 0.10);

  const avgScore = stats.avg_score || 0;

  const metrics = [
    {
      label: "Прогноз пожизненной ценности",
      value: ltv > 0 ? formatRub(ltv) : "—",
      hint: stats.active_contacts > 0 ? `${stats.active_contacts} активных` : "Нет данных",
      icon: "TrendingUp",
      color: "#10b981",
    },
    {
      label: "Риск ухода клиента",
      value: contacts.length > 0 ? `${churnRisk}%` : "—",
      hint: contacts.length > 0 ? `${lowScore} из ${contacts.length} в зоне риска` : "Нужно ≥10 контактов",
      icon: "AlertTriangle",
      color: churnRisk < 15 ? "#10b981" : churnRisk < 30 ? "#f59e0b" : "#ef4444",
    },
    {
      label: "Доход от рассылок",
      value: revenue > 0 ? formatRub(revenue) : "—",
      hint: stats.total_clicked > 0 ? `${stats.total_clicked.toLocaleString()} кликов` : "Нет кликов",
      icon: "Coins",
      color: "#8b5cf6",
    },
    {
      label: "Средний ИИ-балл клиента",
      value: avgScore > 0 ? String(avgScore) : "—",
      hint: avgScore > 70 ? "Отличная вовлечённость" : avgScore > 40 ? "Норма" : "Низкая вовлечённость",
      icon: "Sparkles",
      color: "#06b6d4",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m, i) => (
        <div key={i} className="glass rounded-2xl p-4 metric-card">
          <div className="flex items-center justify-between mb-2">
            <Icon name={m.icon} size={15} style={{ color: m.color }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
          <div className="text-[10px] text-muted-foreground/60 mt-1">{m.hint}</div>
        </div>
      ))}
    </div>
  );
}

export default PredictMetrics;
