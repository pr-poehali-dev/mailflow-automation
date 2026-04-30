import { useState } from "react";
import Icon from "@/components/ui/icon";
import { StatusBadge } from "@/components/shared";
import { Page, mockTemplates, integrations } from "@/data/mockData";

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

// ─── SettingsPage ─────────────────────────────────────────────────────────────

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
