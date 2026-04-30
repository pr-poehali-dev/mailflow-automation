import { useState } from "react";
import Icon from "@/components/ui/icon";
import { StatusBadge, MiniChart } from "@/components/shared";
import {
  Page,
  mockStats,
  mockCampaigns,
  mockContacts,
  mockTemplates,
  chartData,
  integrations,
} from "@/data/mockData";

// ─── Dashboard ────────────────────────────────────────────────────────────────

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

// ─── EmailEditor ──────────────────────────────────────────────────────────────

export function EmailEditor() {
  const [subject, setSubject] = useState("Специальное предложение только для вас 🔥");
  const [preheader, setPreheader] = useState("Успейте воспользоваться до конца недели");
  const [bodyText, setBodyText] = useState(
    "Привет, {{first_name}}!\n\nРады сообщить вам о нашем эксклюзивном предложении специально для клиентов сегмента «{{segment}}».\n\nСкидка 30% на все товары действует до {{expire_date}}.\n\nС уважением,\nКоманда {{company_name}}"
  );
  const variables = ["{{first_name}}", "{{last_name}}", "{{email}}", "{{segment}}", "{{company_name}}", "{{expire_date}}"];

  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Редактор писем</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Drag-and-drop · Переменные · Шаблоны</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8 transition-colors">
            <Icon name="Eye" size={15} />
            Превью
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8 transition-colors">
            <Icon name="Send" size={15} />
            Тест
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
            <Icon name="Save" size={15} />
            Сохранить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 space-y-4">
          <div className="glass rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Тема письма</label>
              <input
                className="w-full bg-background/60 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Прехедер</label>
              <input
                className="w-full bg-background/60 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
              />
            </div>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border text-xs text-muted-foreground">
              <Icon name="Move" size={13} />
              Drag-and-drop редактор
              <div className="ml-auto flex gap-1">
                {["Блоки", "Стили", "Мобайл"].map((t) => (
                  <button key={t} className="px-2 py-1 rounded-lg hover:bg-white/8 transition-colors">{t}</button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="max-w-lg mx-auto rounded-xl overflow-hidden" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="p-6 text-center" style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
                  <div className="text-white font-bold text-lg">MailFlow</div>
                  <div className="text-white/70 text-sm mt-1">{subject}</div>
                </div>
                <div className="p-6">
                  <textarea
                    className="w-full bg-transparent text-sm text-gray-300 outline-none resize-none leading-relaxed"
                    rows={8}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                  />
                </div>
                <div className="px-6 pb-6 text-center">
                  <div className="inline-block px-6 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
                    Перейти к предложению →
                  </div>
                </div>
                <div className="px-6 py-4 text-center text-xs text-gray-500 border-t border-white/10">
                  Отписаться · Настройки · ООО «Компания»
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Icon name="Variable" size={15} style={{ color: "#a855f7" }} />
              Переменные
            </div>
            <div className="space-y-1.5">
              {variables.map((v) => (
                <button
                  key={v}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono-custom hover:bg-white/8 transition-colors"
                  style={{ color: "#22d3ee" }}
                  onClick={() => setBodyText((t) => t + " " + v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Icon name="Blocks" size={15} style={{ color: "#ec4899" }} />
              Блоки
            </div>
            <div className="space-y-1.5">
              {["Заголовок", "Текст", "Кнопка", "Изображение", "Разделитель", "Соцсети"].map((b) => (
                <button key={b} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/8 transition-colors text-muted-foreground hover:text-foreground">
                  + {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function Analytics() {
  const delivStats = [
    { label: "Доставлено", value: "98.4%", color: "#4ade80", icon: "CheckCircle" },
    { label: "Открыто", value: "27.4%", color: "#22d3ee", icon: "MailOpen" },
    { label: "Кликнуто", value: "8.1%", color: "#a855f7", icon: "MousePointer" },
    { label: "Отписок", value: "0.3%", color: "#fb923c", icon: "UserMinus" },
  ];
  const maxBar = Math.max(...chartData.map((d) => d.opens));
  return (
    <div className="p-6 space-y-5">
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
              <div className="h-full rounded-full" style={{ width: s.value, background: s.color, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">Динамика за 7 дней</h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full inline-block" style={{ background: "#a855f7" }} />Открытия</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full inline-block" style={{ background: "#22d3ee" }} />Клики</span>
          </div>
        </div>
        <div className="flex items-end gap-3 h-40">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex gap-1 items-end" style={{ height: 120 }}>
                <div className="flex-1 rounded-t-md chart-bar"
                  style={{ height: `${(d.opens / maxBar) * 100}%`, background: "linear-gradient(180deg, #a855f7, rgba(168,85,247,0.3))", animationDelay: `${i * 0.08}s` }} />
                <div className="flex-1 rounded-t-md chart-bar"
                  style={{ height: `${(d.clicks / maxBar) * 100}%`, background: "linear-gradient(180deg, #22d3ee, rgba(34,211,238,0.3))", animationDelay: `${i * 0.08 + 0.04}s` }} />
              </div>
              <span className="text-xs text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-semibold">Топ кампании по открытиям</div>
        <div className="divide-y divide-border">
          {mockCampaigns.filter((c) => c.opens !== "—").sort((a, b) => parseFloat(b.opens) - parseFloat(a.opens)).slice(0, 4).map((c, i) => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors">
              <span className="text-2xl font-bold text-muted-foreground/30 w-6 text-center">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.sent.toLocaleString()} отправлено</div>
              </div>
              <div className="text-right">
                <div className="font-mono-custom font-bold" style={{ color: "#4ade80" }}>{c.opens}</div>
                <div className="text-xs text-muted-foreground">Open Rate</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────

export function Integrations() {
  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up">
        <h1 className="text-2xl font-bold">Интеграции</h1>
        <p className="text-muted-foreground text-sm mt-0.5">CRM, почтовые сервисы, вебхуки</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((intg, i) => (
          <div key={i} className="glass rounded-2xl p-5 metric-card">
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{intg.icon}</div>
              <StatusBadge status={intg.status} />
            </div>
            <div className="font-semibold">{intg.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{intg.desc}</div>
            <button
              className={`mt-4 w-full py-2 rounded-xl text-xs font-semibold transition-colors ${intg.status === "connected" ? "bg-white/5 hover:bg-white/8 text-muted-foreground" : "text-white"}`}
              style={intg.status !== "connected" ? { background: "linear-gradient(135deg, #a855f7, #22d3ee)" } : {}}>
              {intg.status === "connected" ? "Настроить" : "Подключить"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function Templates({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Шаблоны</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Библиотека готовых писем</p>
        </div>
        <button
          onClick={() => setPage("editor")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
          <Icon name="Plus" size={15} />
          Создать шаблон
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["Все", "Онбординг", "Продажи", "Контент", "Триггер", "Retention"].map((cat) => (
          <button key={cat} className="px-3 py-1.5 rounded-xl text-xs font-medium glass hover:bg-white/8 transition-colors">
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTemplates.map((t) => (
          <div key={t.id} className="glass rounded-2xl overflow-hidden metric-card group cursor-pointer">
            <div className="h-32 flex items-center justify-center text-5xl relative"
              style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(34,211,238,0.05))" }}>
              {t.preview}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => setPage("editor")} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-500 hover:bg-purple-400 transition-colors">
                  Редактировать
                </button>
                <button onClick={() => setPage("campaigns")} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/20 hover:bg-white/30 transition-colors">
                  Использовать
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="font-semibold text-sm">{t.name}</div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>
                  {t.category}
                </span>
                <span className="text-xs text-muted-foreground">{t.uses} использований</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [twofa, setTwofa] = useState(false);
  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="fade-in-up">
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Профиль, безопасность, API</p>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Icon name="User" size={15} style={{ color: "#a855f7" }} />
          Профиль
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
            А
          </div>
          <div>
            <div className="font-semibold">Алексей Смирнов</div>
            <div className="text-sm text-muted-foreground">admin@company.ru</div>
          </div>
          <button className="ml-auto px-3 py-1.5 rounded-xl text-xs font-medium glass hover:bg-white/8 transition-colors">
            Изменить
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[["Имя", "Алексей"], ["Фамилия", "Смирнов"], ["Email", "admin@company.ru"], ["Телефон", "+7 999 123-45-67"]].map(([l, v]) => (
            <div key={l}>
              <label className="text-xs text-muted-foreground block mb-1">{l}</label>
              <input defaultValue={v} className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Icon name="ShieldCheck" size={15} style={{ color: "#4ade80" }} />
          Безопасность
        </h2>
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <div className="text-sm font-medium">Двухфакторная аутентификация (2FA)</div>
            <div className="text-xs text-muted-foreground">Защита через приложение-аутентификатор</div>
          </div>
          <button
            onClick={() => setTwofa(!twofa)}
            className={`relative w-11 h-6 rounded-full transition-colors ${twofa ? "bg-purple-500" : "bg-white/10"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${twofa ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
          <Icon name="Key" size={14} />
          Изменить пароль
        </button>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Icon name="Code2" size={15} style={{ color: "#22d3ee" }} />
          API-ключи
        </h2>
        <div className="space-y-2">
          {["Продакшн ключ", "Тестовый ключ"].map((k, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-0.5">{k}</div>
                <div className="font-mono-custom text-xs text-muted-foreground">mf_{"•".repeat(32)}</div>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="Copy" size={14} />
              </button>
              <button className="text-muted-foreground hover:text-red-400 transition-colors">
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          ))}
        </div>
        <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, #a855f7, #22d3ee)" }}>
          <Icon name="Plus" size={14} />
          Создать новый ключ
        </button>
      </div>
    </div>
  );
}
