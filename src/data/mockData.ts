export type Page =
  | "dashboard"
  | "contacts"
  | "campaigns"
  | "editor"
  | "analytics"
  | "integrations"
  | "templates"
  | "settings"
  | "api";

export const mockStats = [
  { label: "Контактов", value: "48 291", delta: "+12%", icon: "Users", color: "var(--neon-purple)" },
  { label: "Отправлено писем", value: "1.2M", delta: "+8%", icon: "Send", color: "var(--neon-cyan)" },
  { label: "Средний Open Rate", value: "27.4%", delta: "+3.1%", icon: "MailOpen", color: "var(--neon-green)" },
  { label: "Доход от рассылок", value: "₽ 842K", delta: "+21%", icon: "TrendingUp", color: "var(--neon-pink)" },
];

export const mockCampaigns = [
  { id: 1, name: "Летняя распродажа 2026", status: "active", sent: 12400, opens: "34.2%", clicks: "8.1%", date: "28 апр" },
  { id: 2, name: "Реактивация спящих", status: "sent", sent: 5800, opens: "19.7%", clicks: "4.3%", date: "24 апр" },
  { id: 3, name: "Welcome-серия (A/B)", status: "active", sent: 3210, opens: "41.0%", clicks: "12.5%", date: "20 апр" },
  { id: 4, name: "Апрельский дайджест", status: "sent", sent: 48100, opens: "22.1%", clicks: "5.9%", date: "15 апр" },
  { id: 5, name: "Брошенная корзина", status: "paused", sent: 980, opens: "38.4%", clicks: "17.2%", date: "10 апр" },
  { id: 6, name: "Онбординг новых юзеров", status: "draft", sent: 0, opens: "—", clicks: "—", date: "—" },
];

export const mockContacts = [
  { id: 1, name: "Анна Морозова", email: "anna@company.ru", segment: "VIP", status: "active", added: "12 апр" },
  { id: 2, name: "Дмитрий Козлов", email: "d.kozlov@mail.ru", segment: "Новый", status: "active", added: "18 апр" },
  { id: 3, name: "Мария Соколова", email: "msokolova@yandex.ru", segment: "Спящий", status: "unsubscribed", added: "02 фев" },
  { id: 4, name: "Игорь Петров", email: "igor.petrov@biz.ru", segment: "VIP", status: "active", added: "27 мар" },
  { id: 5, name: "Елена Новикова", email: "enovikova@firm.ru", segment: "Активный", status: "active", added: "05 апр" },
  { id: 6, name: "Сергей Волков", email: "s.volkov@corp.ru", segment: "Активный", status: "active", added: "14 апр" },
];

export const mockTemplates = [
  { id: 1, name: "Приветственное письмо", category: "Онбординг", preview: "👋", uses: 24 },
  { id: 2, name: "Промо-акция", category: "Продажи", preview: "🔥", uses: 87 },
  { id: 3, name: "Еженедельный дайджест", category: "Контент", preview: "📰", uses: 56 },
  { id: 4, name: "Брошенная корзина", category: "Триггер", preview: "🛒", uses: 112 },
  { id: 5, name: "Реактивация", category: "Retention", preview: "💫", uses: 43 },
  { id: 6, name: "День рождения", category: "Триггер", preview: "🎂", uses: 38 },
];

export const chartData = [
  { day: "Пн", opens: 68, clicks: 22 },
  { day: "Вт", opens: 82, clicks: 31 },
  { day: "Ср", opens: 74, clicks: 28 },
  { day: "Чт", opens: 91, clicks: 38 },
  { day: "Пт", opens: 88, clicks: 35 },
  { day: "Сб", opens: 54, clicks: 18 },
  { day: "Вс", opens: 47, clicks: 14 },
];

export const integrations = [
  { name: "Bitrix24", icon: "🔗", status: "connected", desc: "CRM синхронизация" },
  { name: "amoCRM", icon: "💼", status: "connected", desc: "Контакты и сделки" },
  { name: "SendGrid", icon: "📤", status: "disconnected", desc: "SMTP отправка" },
  { name: "Mailgun", icon: "🚀", status: "disconnected", desc: "Email API" },
  { name: "Telegram Bot", icon: "✈️", status: "connected", desc: "Уведомления" },
  { name: "Webhook", icon: "⚡", status: "disconnected", desc: "Кастомные события" },
];

export const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { id: "campaigns", label: "Кампании", icon: "Mail" },
  { id: "contacts", label: "Контакты", icon: "Users" },
  { id: "editor", label: "Редактор писем", icon: "PenSquare" },
  { id: "analytics", label: "Аналитика", icon: "BarChart2" },
  { id: "integrations", label: "Интеграции", icon: "Puzzle" },
  { id: "templates", label: "Шаблоны", icon: "LayoutTemplate" },
  { id: "api", label: "API", icon: "Code2" },
  { id: "settings", label: "Настройки", icon: "Settings" },
];