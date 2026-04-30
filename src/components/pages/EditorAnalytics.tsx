import { useState } from "react";
import Icon from "@/components/ui/icon";
import { mockCampaigns, chartData } from "@/data/mockData";

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
