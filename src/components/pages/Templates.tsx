import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Page } from "@/data/mockData";
import { fetchTemplates, EmailTemplate } from "@/api/templates";

const CATEGORIES = ["Все", "Онбординг", "Продажи", "Контент", "Триггер", "Retention"];

export function Templates({ setPage }: { setPage: (p: Page) => void }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Все");

  useEffect(() => {
    fetchTemplates()
      .then((d) => setTemplates(d.templates || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = category === "Все"
    ? templates
    : templates.filter((t) => t.category === category);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="fade-in-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Шаблоны</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? "Загружаем библиотеку..." : `${templates.length} готовых писем для рассылок`}
          </p>
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
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              category === cat ? "text-white" : "glass hover:bg-white/8"
            }`}
            style={category === cat ? { background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" } : {}}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Icon name="Loader2" size={18} className="animate-spin" />
          Загружаем шаблоны...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
          <Icon name="LayoutTemplate" size={32} className="mx-auto mb-3 opacity-40" />
          <div className="font-medium">В этой категории пока пусто</div>
          <div className="text-xs mt-1">Создай свой шаблон в редакторе</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="glass rounded-2xl overflow-hidden metric-card group cursor-pointer">
              <div className="h-32 flex items-center justify-center text-5xl relative"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))" }}>
                {t.preview}
                {!t.is_system && (
                  <span className="absolute top-2 right-2 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4" }}>Свой</span>
                )}
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
                <div className="font-semibold text-sm truncate">{t.name}</div>
                {t.subject && (
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{t.subject}</div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
                    {t.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.uses > 0 ? `${t.uses} использований` : "Новый"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Templates;
