import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Plan {
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

const PLANS: Plan[] = [
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

const ADDONS = [
  { name: "Дополнительно 10 000 контактов", price: "+ 590 ₽/мес", icon: "UserPlus" },
  { name: "1 000 SMS-сообщений", price: "+ 3 500 ₽", icon: "Smartphone" },
  { name: "WhatsApp Business канал", price: "+ 1 990 ₽/мес", icon: "MessageCircle" },
  { name: "Выделенный IP для отправки", price: "+ 2 490 ₽/мес", icon: "Server" },
];

const FAQ = [
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

export function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const calcPrice = (monthly: number) => {
    if (!yearly) return monthly;
    return Math.round(monthly * 0.7);
  };

  const calcSaving = (monthly: number) => {
    return Math.round(monthly * 0.3 * 12);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero */}
      <div className="text-center fade-in-up max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}>
          <Icon name="Sparkles" size={12} />
          7 дней бесплатно · без карты · без обязательств
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-3">Простые и честные тарифы</h1>
        <p className="text-muted-foreground">
          Никаких скрытых платежей. Все AI-функции и автоматизации с первого дня. Отмена в 1 клик.
        </p>
      </div>

      {/* Switcher month/year */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium transition-colors ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
          Помесячно
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className="relative w-14 h-7 rounded-full transition-colors"
          style={{ background: yearly ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "rgba(0,0,0,0.1)" }}>
          <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${yearly ? "translate-x-7" : "translate-x-0.5"}`} />
        </button>
        <span className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
          Год
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}>
            −30%
          </span>
        </span>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
        {PLANS.map((plan, idx) => (
          <div key={plan.id}
            className={`relative rounded-2xl p-6 fade-in-up transition-all metric-card ${
              plan.highlight ? "shadow-2xl" : "glass"
            }`}
            style={{
              animationDelay: `${idx * 0.1}s`,
              background: plan.highlight ? plan.gradient : undefined,
              border: plan.highlight ? `2px solid ${plan.color}` : "1px solid var(--border)",
              transform: plan.highlight ? "scale(1.02)" : undefined,
              boxShadow: plan.highlight ? `0 20px 50px ${plan.color}25` : undefined,
            }}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                style={{ background: `linear-gradient(135deg, ${plan.color}, #06b6d4)` }}>
                {plan.badge}
              </div>
            )}

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}30` }}>
                  <Icon name={plan.id === "start" ? "Zap" : plan.id === "pro" ? "Sparkles" : "Crown"}
                    size={18} style={{ color: plan.color }} />
                </div>
                <div>
                  <div className="font-bold text-xl">{plan.name}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{plan.tagline}</p>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: plan.color }}>
                  {calcPrice(plan.monthly).toLocaleString("ru-RU")}
                </span>
                <span className="text-sm text-muted-foreground">₽/мес</span>
              </div>
              {yearly ? (
                <div className="mt-1 space-y-0.5">
                  <div className="text-xs text-muted-foreground line-through">
                    {plan.monthly.toLocaleString("ru-RU")} ₽/мес
                  </div>
                  <div className="text-xs font-semibold" style={{ color: "#10b981" }}>
                    Экономия {calcSaving(plan.monthly).toLocaleString("ru-RU")} ₽ в год
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-1">При оплате за год — −30%</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5 py-3 border-t border-b border-border">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Контакты</div>
                <div className="text-sm font-bold">{plan.contacts}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Письма</div>
                <div className="text-sm font-bold">{plan.emails}</div>
              </div>
            </div>

            <button
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.02] ${
                plan.highlight ? "text-white" : "glass hover:bg-white/8"
              }`}
              style={plan.highlight ? { background: `linear-gradient(135deg, ${plan.color}, #06b6d4)` } : {}}>
              {plan.cta}
            </button>

            <div className="mt-5 space-y-2.5">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: f.included ? (f.highlight ? `${plan.color}25` : "rgba(16,185,129,0.15)") : "rgba(0,0,0,0.05)",
                    }}>
                    <Icon name={f.included ? "Check" : "X"} size={10}
                      style={{ color: f.included ? (f.highlight ? plan.color : "#10b981") : "#94a3b8" }} />
                  </div>
                  <span className={f.included ? (f.highlight ? "font-semibold" : "") : "text-muted-foreground line-through"}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Trust bar */}
      <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-muted-foreground py-4">
        {[
          { icon: "ShieldCheck", text: "152-ФЗ + GDPR" },
          { icon: "CreditCard", text: "Оплата картой РФ и СБП" },
          { icon: "FileText", text: "Закрывающие документы" },
          { icon: "RefreshCw", text: "Возврат 14 дней" },
          { icon: "Clock", text: "Поддержка 24/7" },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Icon name={t.icon} size={14} style={{ color: "#10b981" }} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Дополнительные опции</h2>
          <p className="text-xs text-muted-foreground mt-1">Расширьте любой тариф под свои задачи</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ADDONS.map((a, i) => (
            <div key={i} className="glass rounded-xl p-3 metric-card">
              <Icon name={a.icon} size={16} style={{ color: "#8b5cf6" }} />
              <div className="text-sm font-semibold mt-2">{a.name}</div>
              <div className="text-xs font-bold mt-1" style={{ color: "#10b981" }}>{a.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto pt-4">
        <h2 className="text-xl font-bold text-center mb-1">Частые вопросы</h2>
        <p className="text-xs text-muted-foreground text-center mb-5">Не нашли ответ? Напишите в чат — отвечаем за 2 минуты</p>
        <div className="space-y-2">
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
                  <span className="text-sm font-semibold">{item.q}</span>
                  <Icon name="ChevronDown" size={14}
                    className={`text-muted-foreground transition-transform flex-shrink-0 ml-3 ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed fade-in-up">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-3xl mx-auto rounded-2xl p-8 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))",
                 border: "1px solid rgba(139,92,246,0.25)" }}>
        <div className="absolute top-0 right-0 w-40 h-40 opacity-20 blur-3xl rounded-full"
          style={{ background: "#8b5cf6" }} />
        <div className="relative">
          <h2 className="text-2xl font-bold mb-2">Не уверены, какой тариф выбрать?</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Начните с 7-дневного бесплатного периода тарифа «Бизнес» — все функции платформы без ограничений
          </p>
          <button className="px-6 py-3 rounded-xl text-sm font-bold text-white inline-flex items-center gap-2 hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <Icon name="Rocket" size={15} />
            Попробовать бесплатно
          </button>
          <div className="text-[11px] text-muted-foreground mt-3">
            Без привязки карты · отмена в любой момент · 24/7 поддержка
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;