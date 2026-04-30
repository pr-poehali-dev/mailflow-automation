import Icon from "@/components/ui/icon";
import { StatusBadge, MiniChart } from "@/components/shared";
import { Page, mockStats, mockCampaigns } from "@/data/mockData";

export function Dashboard({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="space-y-6 p-6">
      <div className="fade-in-up flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Добро пожаловать 👋</h1>
          <p className="text-muted-foreground mt-1">Среда, 30 апреля 2026 · Всё работает штатно</p>
        </div>
        <button
          onClick={() => setPage("campaigns")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
          <Icon name="Plus" size={15} />
          Новая кампания
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {mockStats.map((s, i) => (
          <div
            key={i}
            className={`metric-card glass rounded-2xl p-4 fade-in-up-delay-${i + 1} relative overflow-hidden`}
          >
            <div className="absolute inset-0 opacity-10 rounded-2xl" style={{ background: `radial-gradient(circle at 80% 20%, ${s.color}, transparent 70%)` }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}22`, border: `1px solid ${s.color}44` }}>
                  <Icon name={s.icon} size={17} style={{ color: s.color }} />
                </div>
                <span className="text-xs font-semibold text-green-400">{s.delta}</span>
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
            <span className="text-xs text-muted-foreground font-mono-custom">7 дней · Opens</span>
          </div>
          <MiniChart />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Быстрые действия</h2>
          <div className="space-y-2">
            {[
              { icon: "Mail", label: "Новая кампания", color: "#a855f7", page: "campaigns" as Page },
              { icon: "UserPlus", label: "Импорт контактов", color: "#22d3ee", page: "contacts" as Page },
              { icon: "LayoutTemplate", label: "Выбрать шаблон", color: "#ec4899", page: "templates" as Page },
              { icon: "BarChart2", label: "Посмотреть отчёт", color: "#4ade80", page: "analytics" as Page },
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
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wide">
              <th className="text-left px-5 py-3">Название</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Статус</th>
              <th className="text-left px-5 py-3 hidden lg:table-cell">Отправлено</th>
              <th className="text-left px-5 py-3">Open Rate</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Дата</th>
            </tr>
          </thead>
          <tbody>
            {mockCampaigns.slice(0, 4).map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-white/3 transition-colors">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 hidden md:table-cell"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3 font-mono-custom text-muted-foreground hidden lg:table-cell">{c.sent.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono-custom">{c.opens}</td>
                <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{c.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
