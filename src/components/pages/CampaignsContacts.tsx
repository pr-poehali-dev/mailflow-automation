import { useState } from "react";
import Icon from "@/components/ui/icon";
import { StatusBadge } from "@/components/shared";
import { mockCampaigns, mockContacts } from "@/data/mockData";

// ─── Campaigns ────────────────────────────────────────────────────────────────

export function Campaigns() {
  const [search, setSearch] = useState("");
  const filtered = mockCampaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Кампании</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Email-рассылки, триггеры, A/B-тесты</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
          <Icon name="Plus" size={15} />
          Создать кампанию
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl flex-1 max-w-xs">
          <Icon name="Search" size={15} className="text-muted-foreground" />
          <input
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            placeholder="Поиск кампаний..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {["Все", "Активные", "Черновики", "A/B тест"].map((f) => (
          <button key={f} className="px-3 py-1.5 rounded-xl text-xs font-medium glass hover:bg-white/8 transition-colors">
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(34,211,238,0.08))", border: "1px solid rgba(168,85,247,0.2)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(168,85,247,0.2)" }}>
            <Icon name="FlaskConical" size={18} style={{ color: "#a855f7" }} />
          </div>
          <div>
            <div className="font-semibold text-sm">A/B тест · Welcome-серия</div>
            <div className="text-xs text-muted-foreground">Вариант A: 41% opens · Вариант B: 38.2% opens · Победитель определится через 2 дня</div>
          </div>
          <div className="ml-auto">
            <button className="text-xs px-3 py-1.5 rounded-xl font-medium" style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}>
              Подробнее
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
              <th className="text-left px-5 py-3">Кампания</th>
              <th className="text-left px-5 py-3">Статус</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Отправлено</th>
              <th className="text-left px-5 py-3">Open Rate</th>
              <th className="text-left px-5 py-3 hidden lg:table-cell">CTR</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Дата</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-white/3 transition-colors group">
                <td className="px-5 py-3.5 font-medium">{c.name}</td>
                <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3.5 font-mono-custom text-muted-foreground hidden md:table-cell">{c.sent.toLocaleString()}</td>
                <td className="px-5 py-3.5 font-mono-custom">{c.opens}</td>
                <td className="px-5 py-3.5 font-mono-custom text-muted-foreground hidden lg:table-cell">{c.clicks}</td>
                <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{c.date}</td>
                <td className="px-5 py-3.5">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                    <Icon name="MoreHorizontal" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export function Contacts() {
  const segments = [
    { label: "Все", count: 48291, color: "#a855f7" },
    { label: "VIP", count: 1240, color: "#fb923c" },
    { label: "Активные", count: 28400, color: "#4ade80" },
    { label: "Спящие", count: 9830, color: "#94a3b8" },
    { label: "Новые", count: 8821, color: "#22d3ee" },
  ];
  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Контакты</h1>
          <p className="text-muted-foreground text-sm mt-0.5">48 291 контакт · 5 сегментов</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8 transition-colors">
            <Icon name="Upload" size={15} />
            Импорт CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
            <Icon name="UserPlus" size={15} />
            Добавить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {segments.map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4" style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)" }}>
        <div className="flex items-center gap-3">
          <Icon name="Brain" size={18} style={{ color: "#22d3ee" }} />
          <div>
            <span className="font-medium text-sm">Поведенческая сегментация</span>
            <span className="text-xs text-muted-foreground ml-2">Автоматически делит аудиторию по активности, кликам и покупкам</span>
          </div>
          <button className="ml-auto text-xs px-3 py-1.5 rounded-xl font-medium" style={{ background: "rgba(34,211,238,0.15)", color: "#22d3ee" }}>
            Настроить
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
              <th className="text-left px-5 py-3">Контакт</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Email</th>
              <th className="text-left px-5 py-3">Сегмент</th>
              <th className="text-left px-5 py-3">Статус</th>
              <th className="text-left px-5 py-3 hidden lg:table-cell">Добавлен</th>
            </tr>
          </thead>
          <tbody>
            {mockContacts.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-white/3 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(34,211,238,0.3))" }}>
                      {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground font-mono-custom text-xs hidden md:table-cell">{c.email}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
                    {c.segment}
                  </span>
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">{c.added}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
