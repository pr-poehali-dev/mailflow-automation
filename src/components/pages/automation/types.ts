export type StepType = "trigger" | "email" | "delay" | "condition" | "sms" | "tag" | "webhook";

export interface FlowStep {
  id: string;
  type: StepType;
  title: string;
  config: Record<string, string | number>;
}

export interface Flow {
  id: number;
  name: string;
  description: string;
  steps: FlowStep[];
  is_active: boolean;
  total_started: number;
  total_completed: number;
  conversion: number;
}

export const PREMADE_FLOWS: Flow[] = [
  {
    id: 1, name: "Welcome-серия для новых подписчиков",
    description: "5 писем за 14 дней — знакомим с продуктом и доводим до первой покупки",
    is_active: true, total_started: 1247, total_completed: 892, conversion: 71.5,
    steps: [
      { id: "1", type: "trigger", title: "Подписка на рассылку", config: { event: "subscribe" } },
      { id: "2", type: "email", title: "Письмо 1: Добро пожаловать!", config: { template: "Welcome", delay: "сразу" } },
      { id: "3", type: "delay", title: "Подождать 1 день", config: { duration: "1 день" } },
      { id: "4", type: "email", title: "Письмо 2: Главные возможности", config: { template: "Features" } },
      { id: "5", type: "delay", title: "Подождать 3 дня", config: { duration: "3 дня" } },
      { id: "6", type: "condition", title: "Открывал письма?", config: { condition: "opened > 0" } },
      { id: "7", type: "email", title: "Письмо 3: Кейс клиента", config: { template: "Case study" } },
    ],
  },
  {
    id: 2, name: "Брошенная корзина",
    description: "Возвращаем 38% покупателей через 3 касания",
    is_active: true, total_started: 3402, total_completed: 1289, conversion: 37.9,
    steps: [
      { id: "1", type: "trigger", title: "Корзина брошена > 2 часов", config: { event: "cart_abandoned" } },
      { id: "2", type: "delay", title: "Подождать 2 часа", config: { duration: "2 часа" } },
      { id: "3", type: "email", title: "Напомнить о товарах", config: { template: "Cart reminder" } },
      { id: "4", type: "delay", title: "Подождать 1 день", config: { duration: "1 день" } },
      { id: "5", type: "condition", title: "Купил?", config: { condition: "ordered" } },
      { id: "6", type: "email", title: "Скидка 10% на эти товары", config: { template: "Discount" } },
      { id: "7", type: "delay", title: "Подождать 2 дня", config: { duration: "2 дня" } },
      { id: "8", type: "sms", title: "SMS: последний шанс", config: { template: "Last chance" } },
    ],
  },
  {
    id: 3, name: "Реактивация спящих клиентов",
    description: "Те кто не заходил 90 дней — возвращаем 23%",
    is_active: false, total_started: 0, total_completed: 0, conversion: 0,
    steps: [
      { id: "1", type: "trigger", title: "Не активен 90 дней", config: { event: "inactive_90d" } },
      { id: "2", type: "email", title: "Соскучились!", config: { template: "We miss you" } },
      { id: "3", type: "delay", title: "Подождать 5 дней", config: { duration: "5 дней" } },
      { id: "4", type: "condition", title: "Открыл?", config: { condition: "opened" } },
      { id: "5", type: "email", title: "Скидка 30% на возвращение", config: { template: "Win-back" } },
      { id: "6", type: "tag", title: "Тег: реактивирован", config: { tag: "reactivated" } },
    ],
  },
  {
    id: 4, name: "День рождения клиента",
    description: "Поздравление + промокод за 7 дней до даты",
    is_active: true, total_started: 156, total_completed: 134, conversion: 85.9,
    steps: [
      { id: "1", type: "trigger", title: "За 7 дней до ДР", config: { event: "birthday_minus_7" } },
      { id: "2", type: "email", title: "Подарок ко дню рождения 🎂", config: { template: "Birthday" } },
      { id: "3", type: "delay", title: "В день ДР", config: { duration: "до даты ДР" } },
      { id: "4", type: "email", title: "С праздником! Промокод действует", config: { template: "BD reminder" } },
    ],
  },
];

export const STEP_META: Record<StepType, { icon: string; color: string; bg: string; label: string }> = {
  trigger:   { icon: "Zap",       color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Триггер" },
  email:     { icon: "Mail",      color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", label: "Письмо" },
  delay:     { icon: "Clock",     color: "#06b6d4", bg: "rgba(6,182,212,0.1)",  label: "Задержка" },
  condition: { icon: "GitBranch", color: "#ec4899", bg: "rgba(236,72,153,0.1)", label: "Условие" },
  sms:       { icon: "MessageSquare", color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "СМС" },
  tag:       { icon: "Tag",       color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Метка" },
  webhook:   { icon: "Webhook",   color: "#0891b2", bg: "rgba(8,145,178,0.1)",  label: "Веб-хук" },
};

export const TEMPLATES = [
  { name: "Приветственная серия", icon: "Hand", desc: "5 писем для новичков" },
  { name: "Брошенная корзина", icon: "ShoppingCart", desc: "Возврат 38%" },
  { name: "Реактивация", icon: "RefreshCw", desc: "Спящих клиентов" },
  { name: "День рождения", icon: "Cake", desc: "Поздравление + бонус" },
  { name: "Лид-магнит", icon: "Magnet", desc: "После скачивания PDF" },
  { name: "Опрос об удовлетворённости", icon: "Star", desc: "После покупки" },
  { name: "Допродажа", icon: "TrendingUp", desc: "Предложение более дорогого тарифа" },
  { name: "Пробный период заканчивается", icon: "AlertTriangle", desc: "Перевод в платный тариф" },
];
