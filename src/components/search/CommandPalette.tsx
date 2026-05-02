import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Page, navItems } from "@/data/mockData";
import { fetchCampaigns, fetchContacts, Campaign, Contact } from "@/api";

interface Props {
  open: boolean;
  onClose: () => void;
  setPage: (p: Page) => void;
}

interface Item {
  id: string;
  type: "page" | "campaign" | "contact" | "action";
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  badge?: string;
  onSelect: () => void;
}

const QUICK_ACTIONS: { label: string; icon: string; color: string; page: Page }[] = [
  { label: "Создать новую кампанию", icon: "Plus", color: "#8b5cf6", page: "campaigns" },
  { label: "Добавить контакт", icon: "UserPlus", color: "#06b6d4", page: "contacts" },
  { label: "ИИ: написать письмо", icon: "Sparkles", color: "#f59e0b", page: "editor" },
  { label: "Запустить автоматизацию", icon: "Workflow", color: "#ec4899", page: "automation" },
  { label: "Посмотреть аналитику", icon: "BarChart2", color: "#10b981", page: "analytics" },
];

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  // подстрока по символам
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function CommandPalette({ open, onClose, setPage }: Props) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Загрузка данных при первом открытии
  useEffect(() => {
    if (!open) return;
    fetchCampaigns().then((d) => setCampaigns(d.campaigns || [])).catch(() => {});
    fetchContacts().then((d) => setContacts(d.contacts || [])).catch(() => {});
  }, [open]);

  // Фокус на поле и сброс при открытии
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Сборка списка результатов
  const items: Item[] = useMemo(() => {
    const result: Item[] = [];

    // Страницы
    navItems.forEach((n) => {
      if (fuzzyMatch(query, n.label)) {
        result.push({
          id: `page-${n.id}`,
          type: "page",
          title: n.label,
          subtitle: "Раздел",
          icon: n.icon,
          color: "#8b5cf6",
          badge: n.badge,
          onSelect: () => { setPage(n.id); onClose(); },
        });
      }
    });

    // Быстрые действия (только если есть запрос или для всех при пустом — оставим всегда первыми после страниц)
    QUICK_ACTIONS.forEach((a, i) => {
      if (fuzzyMatch(query, a.label)) {
        result.push({
          id: `action-${i}`,
          type: "action",
          title: a.label,
          subtitle: "Быстрое действие",
          icon: a.icon,
          color: a.color,
          onSelect: () => { setPage(a.page); onClose(); },
        });
      }
    });

    // Кампании
    campaigns.forEach((c) => {
      if (fuzzyMatch(query, c.name) || fuzzyMatch(query, c.subject || "")) {
        result.push({
          id: `camp-${c.id}`,
          type: "campaign",
          title: c.name,
          subtitle: `Кампания · ${c.status}`,
          icon: "Mail",
          color: "#06b6d4",
          onSelect: () => { setPage("campaigns"); onClose(); },
        });
      }
    });

    // Контакты
    contacts.forEach((c) => {
      if (fuzzyMatch(query, c.name) || fuzzyMatch(query, c.email)) {
        result.push({
          id: `cont-${c.id}`,
          type: "contact",
          title: c.name,
          subtitle: c.email,
          icon: "User",
          color: "#10b981",
          onSelect: () => { setPage("contacts"); onClose(); },
        });
      }
    });

    return result.slice(0, 50);
  }, [query, campaigns, contacts, setPage, onClose]);

  // Группировка по типу
  const grouped = useMemo(() => {
    const g: Record<string, Item[]> = { page: [], action: [], campaign: [], contact: [] };
    items.forEach((it) => g[it.type].push(it));
    return g;
  }, [items]);

  const flatList = items;

  // Хоткеи
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flatList.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        flatList[activeIdx]?.onSelect();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, activeIdx, flatList, onClose]);

  // Скролл к активному
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // Сброс активного при изменении query
  useEffect(() => { setActiveIdx(0); }, [query]);

  if (!open) return null;

  const groupTitle: Record<string, string> = {
    page: "Разделы",
    action: "Быстрые действия",
    campaign: "Кампании",
    contact: "Контакты",
  };

  let renderIdx = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 fade-in-up"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(20, 20, 28, 0.95)",
          border: "1px solid rgba(139,92,246,0.3)",
          boxShadow: "0 25px 70px rgba(139,92,246,0.25)",
        }}>
        {/* Поле поиска */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Icon name="Search" size={17} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по разделам, кампаниям, контактам..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground text-white"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            ESC
          </kbd>
        </div>

        {/* Список результатов */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {flatList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Icon name="SearchX" size={28} className="opacity-40" />
              <div className="text-sm">Ничего не найдено</div>
              <div className="text-xs">Попробуйте другой запрос</div>
            </div>
          ) : (
            (["page", "action", "campaign", "contact"] as const).map((groupKey) => {
              const groupItems = grouped[groupKey];
              if (groupItems.length === 0) return null;
              return (
                <div key={groupKey} className="mb-1">
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {groupTitle[groupKey]}
                  </div>
                  {groupItems.map((it) => {
                    renderIdx++;
                    const isActive = renderIdx === activeIdx;
                    const idx = renderIdx;
                    return (
                      <button
                        key={it.id}
                        data-idx={idx}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => it.onSelect()}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={{
                          background: isActive ? "rgba(139,92,246,0.15)" : "transparent",
                          borderLeft: isActive ? "2px solid #8b5cf6" : "2px solid transparent",
                        }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${it.color}22`, border: `1px solid ${it.color}40` }}>
                          <Icon name={it.icon} size={14} style={{ color: it.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate flex items-center gap-2">
                            {it.title}
                            {it.badge && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded text-white"
                                style={{ background: "linear-gradient(135deg,#8b5cf6,#06b6d4)" }}>
                                {it.badge}
                              </span>
                            )}
                          </div>
                          {it.subtitle && (
                            <div className="text-[11px] text-muted-foreground truncate">{it.subtitle}</div>
                          )}
                        </div>
                        {isActive && (
                          <Icon name="CornerDownLeft" size={12} className="text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Подвал с подсказками */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-white/10 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.06)" }}>↑↓</kbd>
              навигация
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.06)" }}>↵</kbd>
              открыть
            </span>
          </div>
          <span className="hidden sm:flex items-center gap-1">
            <Icon name="Sparkles" size={10} />
            быстрый поиск MAIL-KA
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
