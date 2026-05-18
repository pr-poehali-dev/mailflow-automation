import Icon from "@/components/ui/icon";
import { Page } from "@/data/mockData";

interface Props {
  onRegisterClick: () => void;
  setPage: (p: Page) => void;
}

const STATS = [
  { value: "7 дней", label: "бесплатно, без карты", color: "#8b5cf6" },
  { value: "5 минут", label: "до первой рассылки", color: "#06b6d4" },
  { value: "99.9%", label: "доставляемость в Inbox", color: "#10b981" },
  { value: "24/7", label: "поддержка и AI-консультант", color: "#ec4899" },
];

const BULLETS = [
  { icon: "Sparkles", title: "AI пишет письма за вас", text: "Опишите задачу — нейросеть сгенерирует тему, текст и кнопку. Spam-чек и прогноз открываемости встроены." },
  { icon: "Network", title: "Все каналы в одной кампании", text: "Email + SMS + Telegram + Push. Не нужно платить за 4 разных сервиса — всё в одном тарифе." },
  { icon: "Workflow", title: "Автоматизации за 5 минут", text: "Welcome-серии, брошенная корзина, реактивация, день рождения. Шаблоны уже готовы — просто включите." },
  { icon: "BarChart3", title: "Понятная аналитика", text: "Открытия, клики, тепловые карты писем, прогноз LTV и risk of churn. Без графиков в Excel." },
];

const TRUST_LOGOS = ["Wildberries", "Ozon", "Сбер", "ВкусВилл", "Альфа", "Тинькофф"];

export default function LandingHero({ onRegisterClick, setPage }: Props) {
  return (
    <div className="space-y-8 fade-in-up">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-14"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.08))",
          border: "1px solid rgba(139,92,246,0.25)",
        }}>
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }} />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)", color: "#16a34a" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            7 дней бесплатно · без карты · отмена в 1 клик
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            Email-маркетинг с <span className="gradient-text">AI</span>,
            <br />
            который пишет письма за вас
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed">
            MAIL-KA — единая платформа: рассылки, SMS, Telegram, автоматизации и аналитика.
            Запустите первую кампанию за 5 минут — без знания HTML и кода.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <button
              onClick={onRegisterClick}
              className="px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold text-white transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", boxShadow: "0 8px 24px rgba(139,92,246,0.35)" }}>
              <Icon name="Sparkles" size={17} />
              Начать бесплатно
            </button>
            <button
              onClick={() => setPage("pricing")}
              className="px-6 py-3.5 rounded-xl text-sm sm:text-base font-semibold glass hover:bg-white/8 transition-colors flex items-center justify-center gap-2">
              Посмотреть тарифы
              <Icon name="ArrowRight" size={15} />
            </button>
          </div>

          <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><Icon name="Check" size={13} style={{ color: "#16a34a" }} />Без привязки карты</span>
            <span className="flex items-center gap-1.5"><Icon name="Check" size={13} style={{ color: "#16a34a" }} />Перенос с других сервисов</span>
            <span className="flex items-center gap-1.5"><Icon name="Check" size={13} style={{ color: "#16a34a" }} />Российский сервис, 152-ФЗ</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STATS.map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ background: `radial-gradient(circle at 80% 20%, ${s.color}, transparent 70%)` }} />
            <div className="relative">
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-snug">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* BULLETS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {BULLETS.map((b, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.15))" }}>
                <Icon name={b.icon} size={18} style={{ color: "#8b5cf6" }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.text}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* TRUST */}
      <section className="glass rounded-2xl p-5 sm:p-6 text-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Нам доверяют команды из
        </div>
        <div className="flex items-center justify-center gap-x-6 gap-y-2 flex-wrap">
          {TRUST_LOGOS.map((logo) => (
            <span key={logo} className="text-sm sm:text-base font-bold text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              {logo}
            </span>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          Более <span className="font-bold text-foreground">500 000</span> писем в день · <span className="font-bold text-foreground">12 000+</span> компаний
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))",
          border: "1px solid rgba(139,92,246,0.3)",
        }}>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">
          Готовы запустить первую рассылку?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
          Регистрация занимает 30 секунд. Никаких карт, договоров и менеджеров — сразу в работу.
        </p>
        <button
          onClick={onRegisterClick}
          className="px-7 py-3.5 rounded-xl text-base font-bold text-white transition-transform hover:scale-[1.03] inline-flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", boxShadow: "0 8px 24px rgba(139,92,246,0.4)" }}>
          <Icon name="Rocket" size={17} />
          Попробовать 7 дней бесплатно
        </button>
        <div className="text-xs text-muted-foreground mt-4">
          Или <button onClick={() => setPage("pricing")} className="underline hover:text-foreground">сравните тарифы</button>
        </div>
      </section>
    </div>
  );
}
