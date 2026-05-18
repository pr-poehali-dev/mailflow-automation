export type Page =
  | "dashboard"
  | "contacts"
  | "campaigns"
  | "editor"
  | "automation"
  | "omnichannel"
  | "predict"
  | "analytics"
  | "integrations"
  | "templates"
  | "pricing"
  | "settings"
  | "api"
  | "security"
  | "mailbox"
  | "partners"
  | "referrals";

export const chartData = [
  { day: "Пн", opens: 68, clicks: 22 },
  { day: "Вт", opens: 82, clicks: 31 },
  { day: "Ср", opens: 74, clicks: 28 },
  { day: "Чт", opens: 91, clicks: 38 },
  { day: "Пт", opens: 88, clicks: 35 },
  { day: "Сб", opens: 54, clicks: 18 },
  { day: "Вс", opens: 47, clicks: 14 },
];

export const navItems: { id: Page; label: string; icon: string; badge?: string }[] = [
  { id: "dashboard", label: "Главная", icon: "LayoutDashboard" },
  { id: "campaigns", label: "Кампании", icon: "Mail" },
  { id: "contacts", label: "Контакты", icon: "Users" },
  { id: "editor", label: "Редактор писем", icon: "PenSquare", badge: "ИИ" },
  { id: "automation", label: "Автоматизации", icon: "Workflow", badge: "ПРО" },
  { id: "omnichannel", label: "Мультиканал", icon: "Network", badge: "НОВОЕ" },
  { id: "predict", label: "ИИ-прогноз", icon: "Sparkles", badge: "ИИ" },
  { id: "analytics", label: "Аналитика", icon: "BarChart2" },
  { id: "integrations", label: "Интеграции", icon: "Puzzle" },
  { id: "templates", label: "Шаблоны", icon: "LayoutTemplate" },
  { id: "mailbox", label: "Корпоративная почта", icon: "AtSign", badge: "от 99₽" },
  { id: "partners", label: "Партнёрам", icon: "Handshake", badge: "20%" },
  { id: "referrals", label: "Приведи друга", icon: "Gift", badge: "+500₽" },
  { id: "pricing", label: "Тарифы", icon: "Crown", badge: "−30%" },
  { id: "api", label: "Программный интерфейс", icon: "Code2" },
  { id: "security", label: "Безопасность", icon: "ShieldCheck", badge: "АДМ" },
  { id: "settings", label: "Настройки", icon: "Settings" },
];