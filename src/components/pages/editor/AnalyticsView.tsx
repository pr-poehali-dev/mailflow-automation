import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchCampaigns, Campaign } from "@/api";
import { fetchGlobalStats, GlobalStats } from "@/api/pro";

const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function Analytics() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCampaigns(), fetchGlobalStats()]).then(([cd, s]) => {
      setCampaigns(cd.campaigns);
      setStats(s);
      setLoading(false);
    });
  }, []);

  const totalSent = stats?.total_sent ?? 0;
  const fmt = (n: number) => totalSent > 0 ? `${n}%` : "—";

  const deliveryRate = totalSent > 0
    ? Math.round(((totalSent - (stats?.suppressed ?? 0)) * 1000 / totalSent) / 10)
    : 0;
  const openRate = stats?.open_rate ?? 0;
  const clickRate = stats?.click_rate ?? 0;
  const unsubRate = totalSent > 0
    ? Math.round(((stats?.suppressed ?? 0) * 1000 / totalSent) / 10)
    : 0;

  const delivStats = [
    { label: "Доставлено", value: totalSent > 0 ? fmt(deliveryRate) : "—", color: "#4ade80", icon: "CheckCircle" },
    { label: "Открыто", value: totalSent > 0 ? fmt(openRate) : "—", color: "#06b6d4", icon: "MailOpen" },
    { label: "Кликнуто", value: totalSent > 0 ? fmt(clickRate) : "—", color: "#8b5cf6", icon: "MousePointer" },
    { label: "Отписок", value: totalSent > 0 ? fmt(unsubRate) : "—", color: "#fb923c", icon: "UserMinus" },
  ];

  // Сборка недельного графика: добавляем недостающие дни нулями
  const weekly = stats?.weekly ?? [];
  const today = new Date();
  const chart: { day: string; opens: number; clicks: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const found = weekly.find((w) => String(w.date).slice(0, 10) === iso);
    chart.push({
      day: DAY_LABELS[d.getDay()],
      opens: found?.opened ?? 0,
      clicks: 0,
    });
  }
  const maxBar = Math.max(1, ...chart.map((d) => d.opens));

  const topCampaigns = [...campaigns]
    .filter((c) => c.open_rate > 0)
    .sort((a, b) => b.open_rate - a.open_rate)
    .slice(0, 4);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="fade-in-up">
        <h1 className="text-2xl font-bold">Аналитика</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Доставка · Открытия · Клики · Отписки</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {delivStats.map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 metric-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={s.icon} size={16} style={{ color: s.color }} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="mt-2 h-1 rounded-full bg-white/5">
              <div className="h-full rounded-full"
                style={{ width: s.value !== "—" ? s.value : "0%", background: s.color, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Динамика за 7 дней</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full inline-block" style={{ background: "#8b5cf6" }} />Открытия</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full inline-block" style={{ background: "#06b6d4" }} />Отправки</span>
            </div>
          </div>
          {totalSent === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
              <Icon name="BarChart2" size={32} className="opacity-30" />
              <div>Запусти первую кампанию — здесь появится график</div>
            </div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {chart.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end" style={{ height: 120 }}>
                    <div className="flex-1 rounded-t-md chart-bar"
                      style={{ height: `${(d.opens / maxBar) * 100}%`, background: "linear-gradient(180deg, #8b5cf6, rgba(139,92,246,0.3))", animationDelay: `${i * 0.08}s` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Итого отправлено</h2>
          <div className="text-4xl font-bold gradient-text">{loading ? "..." : totalSent.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">писем за всё время</div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Кампаний</span>
              <span>{campaigns.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Активных</span>
              <span className="text-green-400">{campaigns.filter((c) => c.status === "active").length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Черновиков</span>
              <span className="text-muted-foreground">{campaigns.filter((c) => c.status === "draft").length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-semibold">Топ кампании по открытиям</div>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
            <Icon name="Loader2" size={15} className="animate-spin" />Загружаем...
          </div>
        ) : topCampaigns.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Нет данных — запусти кампанию</div>
        ) : (
          <div className="divide-y divide-border">
            {topCampaigns.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors">
                <span className="text-2xl font-bold text-muted-foreground/30 w-6 text-center">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.sent_count.toLocaleString()} отправлено</div>
                </div>
                <div className="text-right">
                  <div className="font-mono-custom font-bold" style={{ color: "#4ade80" }}>{c.open_rate}%</div>
                  <div className="text-xs text-muted-foreground">Open Rate</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
