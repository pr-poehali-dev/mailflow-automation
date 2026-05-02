import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { StatusBadge, MiniChart } from "@/components/shared";
import { Page } from "@/data/mockData";
import { fetchCampaigns, Campaign } from "@/api";

export function Dashboard({ setPage }: { setPage: (p: Page) => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState({ contacts_count: 0, total_sent: 0, avg_open_rate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns().then((data) => {
      setCampaigns(data.campaigns);
      setStats(data.stats);
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: "Контактов", value: loading ? "..." : stats.contacts_count.toLocaleString(), icon: "Users", color: "var(--neon-purple)" },
    { label: "Отправлено писем", value: loading ? "..." : stats.total_sent.toLocaleString(), icon: "Send", color: "var(--neon-cyan)" },
    { label: "Средняя открываемость", value: loading ? "..." : `${stats.avg_open_rate}%`, icon: "MailOpen", color: "var(--neon-green)" },
    { label: "Кампаний всего", value: loading ? "..." : campaigns.length.toString(), icon: "TrendingUp", color: "var(--neon-pink)" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="fade-in-up flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Добро пожаловать 👋</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Всё работает штатно
          </p>
        </div>
        <button
          onClick={() => setPage("campaigns")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          <Icon name="Plus" size={15} />
          Новая кампания
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className={`metric-card glass rounded-2xl p-4 fade-in-up-delay-${i + 1} relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10 rounded-2xl" style={{ background: `radial-gradient(circle at 80% 20%, ${s.color}, transparent 70%)` }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}22`, border: `1px solid ${s.color}44` }}>
                  <Icon name={s.icon} size={17} style={{ color: s.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Открытия за неделю</h2>
            <span className="text-xs text-muted-foreground font-mono-custom">7 дней · открытия</span>
          </div>
          <MiniChart />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Быстрые действия</h2>
          <div className="space-y-2">
            {[
              { icon: "Sparkles", label: "ИИ: написать письмо", color: "#8b5cf6", page: "editor" as Page },
              { icon: "Workflow", label: "Автоматизации (ПРО)", color: "#f59e0b", page: "automation" as Page },
              { icon: "Network", label: "Мультиканальные рассылки", color: "#06b6d4", page: "omnichannel" as Page },
              { icon: "TrendingUp", label: "ИИ-прогноз поведения", color: "#ec4899", page: "predict" as Page },
            ].map((a, i) => (
              <button key={i} onClick={() => setPage(a.page)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors text-left">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}22` }}>
                  <Icon name={a.icon} size={14} style={{ color: a.color }} />
                </div>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Последние кампании</h2>
          <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => setPage("campaigns")}>Все кампании →</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
            <Icon name="Loader2" size={15} className="animate-spin" />
            Загружаем данные...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <Icon name="Mail" size={28} className="opacity-30" />
            <div className="text-sm">Кампаний пока нет</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wide">
                <th className="text-left px-5 py-3">Название</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Статус</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Отправлено</th>
                <th className="text-left px-5 py-3">Открываемость</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Дата</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.slice(0, 4).map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 hidden md:table-cell"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3 font-mono-custom text-muted-foreground hidden lg:table-cell">{c.sent_count.toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono-custom">{c.open_rate > 0 ? `${c.open_rate}%` : "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                    {c.sent_at ? new Date(c.sent_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}