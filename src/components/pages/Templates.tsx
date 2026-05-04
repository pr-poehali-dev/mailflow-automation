import Icon from "@/components/ui/icon";
import { Page, mockTemplates } from "@/data/mockData";

export function Templates({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="fade-in-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Шаблоны</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Библиотека готовых писем</p>
        </div>
        <button
          onClick={() => setPage("editor")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
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
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))" }}>
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
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
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

export default Templates;