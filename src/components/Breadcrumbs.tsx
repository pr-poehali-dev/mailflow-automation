import { useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Page } from "@/data/mockData";

interface BreadcrumbItem {
  label: string;
  page?: Page;
  icon?: string;
}

interface Section {
  category: string;
  label: string;
  icon: string;
}

const PAGE_SECTIONS: Record<Page, Section> = {
  dashboard:    { category: "Главная",      label: "Сводка",             icon: "LayoutDashboard" },
  campaigns:    { category: "Маркетинг",    label: "Кампании",           icon: "Mail" },
  contacts:     { category: "Аудитория",    label: "Контакты",           icon: "Users" },
  editor:       { category: "Маркетинг",    label: "Редактор писем",     icon: "PenSquare" },
  automation:   { category: "Маркетинг",    label: "Автоматизации",      icon: "Workflow" },
  omnichannel:  { category: "Каналы",       label: "Мультиканальные рассылки", icon: "Network" },
  predict:      { category: "Аналитика",    label: "ИИ-прогноз поведения", icon: "Sparkles" },
  analytics:    { category: "Аналитика",    label: "Отчёты",             icon: "BarChart2" },
  integrations: { category: "Подключения",  label: "Интеграции",         icon: "Puzzle" },
  templates:    { category: "Маркетинг",    label: "Шаблоны писем",      icon: "LayoutTemplate" },
  mailbox:      { category: "Сервисы",      label: "Корпоративная почта", icon: "AtSign" },
  partners:     { category: "Сервисы",      label: "Партнёрская программа", icon: "Handshake" },
  pricing:      { category: "Аккаунт",      label: "Тарифы и оплата",    icon: "Crown" },
  settings:     { category: "Аккаунт",      label: "Настройки",          icon: "Settings" },
  api:          { category: "Подключения",  label: "Программный интерфейс для разработчиков", icon: "Code2" },
  security:     { category: "Аккаунт",      label: "Безопасность",       icon: "ShieldCheck" },
};

const FALLBACK_SECTION: Section = { category: "Раздел", label: "Страница", icon: "Circle" };

const BASE_URL = "https://mail-ka.ru";

interface Props {
  page: Page;
  setPage: (p: Page) => void;
  extra?: BreadcrumbItem[];
}

export function Breadcrumbs({ page, setPage, extra }: Props) {
  const section = PAGE_SECTIONS[page] || FALLBACK_SECTION;

  const items: BreadcrumbItem[] = [
    { label: "MAIL-KA", page: "dashboard", icon: "Home" },
  ];
  if (page !== "dashboard") {
    items.push({ label: section.category });
    items.push({ label: section.label, icon: section.icon });
  }
  if (extra) items.push(...extra);

  // JSON-LD BreadcrumbList микроразметка для поисковиков
  useEffect(() => {
    const id = "breadcrumb-jsonld";
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = id;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    const itemListElement = items.map((it, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": it.label,
      "item": it.page ? (it.page === "dashboard" ? `${BASE_URL}/` : `${BASE_URL}/?page=${it.page}`) : undefined,
    }));
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": itemListElement,
    });
    return () => {
      // не удаляем — другая страница перезапишет
    };
  }, [page, items]);

  return (
    <nav aria-label="Хлебные крошки" className="flex items-center gap-1.5 text-xs flex-wrap py-1">
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        const clickable = !!it.page && !isLast;
        return (
          <div key={i} className="flex items-center gap-1.5">
            {clickable ? (
              <button
                onClick={() => setPage(it.page!)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-white/8"
                itemProp="item">
                {it.icon && <Icon name={it.icon} size={11} />}
                <span itemProp="name">{it.label}</span>
              </button>
            ) : (
              <span className={`flex items-center gap-1 px-1.5 py-0.5 ${isLast ? "font-semibold" : "text-muted-foreground"}`}
                style={isLast ? { color: "#7c3aed" } : {}}
                itemProp="name"
                aria-current={isLast ? "page" : undefined}>
                {it.icon && <Icon name={it.icon} size={11} />}
                {it.label}
              </span>
            )}
            {!isLast && <Icon name="ChevronRight" size={11} className="text-muted-foreground/50 flex-shrink-0" />}
          </div>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;