export interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthly: number;
  contacts: string;
  emails: string;
  highlight?: boolean;
  badge?: string;
  color: string;
  gradient: string;
  features: { text: string; included: boolean; highlight?: boolean }[];
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: "start",
    name: "Старт",
    tagline: "Для малого бизнеса и старта рассылок",
    monthly: 990,
    contacts: "до 5 000",
    emails: "50 000 писем/мес",
    color: "#06b6d4",
    gradient: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(8,145,178,0.04))",
    cta: "Начать бесплатно",
    features: [
      { text: "До 5 000 контактов", included: true },
      { text: "50 000 писем в месяц", included: true },
      { text: "Drag-and-drop редактор", included: true },
      { text: "50+ готовых шаблонов", included: true },
      { text: "Базовая аналитика", included: true },
      { text: "Свой SMTP + DKIM", included: true },
      { text: "1 пользователь", included: true },
      { text: "AI-копирайтер (100 запросов/мес)", included: true, highlight: true },
      { text: "Visual Automation Builder", included: false },
      { text: "Omnichannel (SMS, Telegram, Push)", included: false },
      { text: "Predictive AI Analytics", included: false },
      { text: "Приоритетная поддержка 24/7", included: false },
    ],
  },
  {
    id: "pro",
    name: "Бизнес",
    tagline: "Для растущих компаний — самый популярный",
    monthly: 2990,
    contacts: "до 25 000",
    emails: "Безлимит писем",
    highlight: true,
    badge: "Хит продаж",
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.06))",
    cta: "7 дней бесплатно",
    features: [
      { text: "До 25 000 контактов", included: true },
      { text: "Безлимит email-рассылок", included: true },
      { text: "Всё из тарифа «Старт»", included: true },
      { text: "Visual Automation Builder", included: true, highlight: true },
      { text: "AI-копирайтер БЕЗЛИМИТ", included: true, highlight: true },
      { text: "A/B-тесты и сегментация", included: true },
      { text: "Predictive AI Analytics", included: true, highlight: true },
      { text: "До 5 пользователей", included: true },
      { text: "Best Send Time AI", included: true },
      { text: "Интеграции CRM (Bitrix24, amoCRM)", included: true },
      { text: "Omnichannel (SMS, Telegram, Push)", included: false },
      { text: "Менеджер сопровождения", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Для крупных компаний с omnichannel",
    monthly: 7990,
    contacts: "до 100 000",
    emails: "Безлимит всего",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.05))",
    cta: "Связаться с продажами",
    features: [
      { text: "До 100 000 контактов", included: true },
      { text: "Безлимит email + SMS + Push", included: true },
      { text: "Всё из тарифа «Бизнес»", included: true },
      { text: "Omnichannel: 8 каналов", included: true, highlight: true },
      { text: "SMS-рассылки (МТС/МегаФон/Билайн)", included: true, highlight: true },
      { text: "Telegram + WhatsApp Business", included: true, highlight: true },
      { text: "Web + Mobile Push", included: true },
      { text: "Каскадная отправка", included: true },
      { text: "Безлимит пользователей и команд", included: true },
      { text: "API без лимитов + SLA 99.95%", included: true },
      { text: "Персональный менеджер 24/7", included: true },
      { text: "Кастомные интеграции и SSO", included: true },
    ],
  },
];

export const ADDONS = [
  { name: "Дополнительно 10 000 контактов", price: "+ 590 ₽/мес", icon: "UserPlus" },
  { name: "1 000 SMS-сообщений", price: "+ 3 500 ₽", icon: "Smartphone" },
  { name: "WhatsApp Business канал", price: "+ 1 990 ₽/мес", icon: "MessageCircle" },
  { name: "Выделенный IP для отправки", price: "+ 2 490 ₽/мес", icon: "Server" },
];

export const FAQ = [
  {
    q: "Что входит в 7-дневный пробный период?",
    a: "Полный доступ к тарифу «Бизнес» на 7 дней без оплаты и без привязки карты. Все AI-функции, автоматизации и аналитика — бесплатно. После пробного периода можно остаться на бесплатном плане «Старт» или выбрать любой платный.",
  },
  {
    q: "Как работает скидка 30% при оплате за год?",
    a: "При выборе годовой подписки вы платите за 8.4 месяца, а пользуетесь все 12. Например: тариф «Бизнес» — 2 990 ₽/мес, со скидкой 2 093 ₽/мес. Экономия 10 764 ₽ в год.",
  },
  {
    q: "Можно ли сменить или отменить тариф?",
    a: "Да, в любой момент через раздел «Настройки → Биллинг». При переходе на более дорогой тариф — доплачиваете разницу, на дешёвый — остаток зачисляется на следующий период. Отмена без штрафов.",
  },
  {
    q: "Что будет, если превысить лимит контактов?",
    a: "Мы не блокируем рассылки. Подключим автоматический add-on или предложим перейти на следующий тариф. Никаких неожиданных списаний — только с вашего согласия.",
  },
  {
    q: "Какие способы оплаты поддерживаются?",
    a: "Карты МИР, Visa, Mastercard, СБП, безналичный расчёт для юрлиц с НДС. Все платежи в рублях через российский эквайринг. Закрывающие документы предоставляем автоматически.",
  },
  {
    q: "Есть ли скидки для НКО и стартапов?",
    a: "Да! Некоммерческим организациям — скидка 50% навсегда. Стартапам в инкубаторах ФРИИ и Сколково — 6 месяцев бесплатно на тарифе «Бизнес». Пишите на support@mail-ka.ru.",
  },
];
