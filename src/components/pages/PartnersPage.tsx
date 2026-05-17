import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { submitPartnerApplication, fetchPartnerStats, PartnerProgram } from "@/api/partners";

const PROGRAMS = [
  {
    id: "referral",
    icon: "Users",
    color: "#8b5cf6",
    title: "Реферальная программа",
    subtitle: "Для всех — приведи друга и получай % с его платежей",
    revshare: "20%",
    period: "12 месяцев",
    payout: "от 1 000 ₽",
    perks: [
      "Личный кабинет с UTM-ссылкой и промокодом",
      "Скидка 10% для приведённого клиента — двойная мотивация",
      "Выплаты на карту, СБП или расчётный счёт",
      "Cookie-атрибуция 90 дней",
    ],
  },
  {
    id: "agency",
    icon: "Briefcase",
    color: "#06b6d4",
    title: "Партнёрство для агентств",
    subtitle: "Для маркетинговых и digital-агентств",
    revshare: "30%",
    period: "пожизненно",
    payout: "ежемесячно",
    perks: [
      "Мульти-аккаунт под одним логином (до 50 клиентов)",
      "Скидка 30% на тарифы клиентов",
      "Приоритетная техподдержка 24/7",
      "Совместные кейсы и публикации в блоге MAIL-KA",
    ],
    recommended: true,
  },
  {
    id: "whitelabel",
    icon: "Sparkles",
    color: "#f59e0b",
    title: "White Label",
    subtitle: "Запусти свой email-сервис под своим брендом",
    revshare: "договорно",
    period: "пожизненно",
    payout: "по договору",
    perks: [
      "Свой домен, свой логотип, свой дизайн",
      "Своя цена — мы берём фикс за инфраструктуру",
      "SLA 99,95% и выделенный менеджер",
      "API и webhooks без ограничений",
    ],
  },
  {
    id: "tech",
    icon: "Code2",
    color: "#10b981",
    title: "Технологический партнёр",
    subtitle: "Для CRM, CMS, маркетплейсов, конструкторов сайтов",
    revshare: "до 40%",
    period: "пожизненно",
    payout: "ежемесячно",
    perks: [
      "Готовое SDK и официальная интеграция в нашем каталоге",
      "Совместный go-to-market: вебинары, статьи, рассылки",
      "Размещение в магазинах Bitrix24, amoCRM, Tilda, InSales",
      "Технический менеджер на стороне MAIL-KA",
    ],
  },
];

const HOW_IT_WORKS = [
  { num: "01", icon: "UserPlus", title: "Регистрируешься", desc: "Заполни короткую форму. Подтверждаем заявку за 1 рабочий день." },
  { num: "02", icon: "Link2", title: "Получаешь ссылку и промокод", desc: "Уникальная UTM-ссылка с трекингом + промокод -10% для клиента." },
  { num: "03", icon: "Megaphone", title: "Делишься с аудиторией", desc: "Размещай в статьях, рассылках, соцсетях, Telegram-канале, в кабинете клиента." },
  { num: "04", icon: "Wallet", title: "Получаешь деньги", desc: "Раз в месяц вывод на карту, СБП или расчётный счёт. Минимум — 1 000 ₽." },
];

const FAQ = [
  {
    q: "Сколько я заработаю с одного клиента?",
    a: "Зависит от тарифа клиента. Например, клиент на тарифе «Бизнес» (2 990 ₽/мес) → твой доход 598 ₽/мес × 12 = 7 176 ₽ с одной продажи. Привёл 20 таких клиентов — 143 520 ₽ в год пассивного дохода.",
  },
  {
    q: "Когда и как происходят выплаты?",
    a: "Ежемесячно, 5 числа за прошлый месяц. Можно выводить на карту любого банка РФ, по СБП по номеру телефона или на расчётный счёт ИП/ООО. Минимальная сумма к выводу — 1 000 ₽.",
  },
  {
    q: "Как долго я получаю % с одного клиента?",
    a: "В реферальной программе — 12 месяцев с момента первого платежа. У агентств и технологических партнёров — пожизненно, пока клиент платит за MAIL-KA.",
  },
  {
    q: "Что считается «приведённым клиентом»?",
    a: "Любой человек или компания, которые зарегистрировались по твоей ссылке (cookie живёт 90 дней) или ввели твой промокод при оплате. Главное условие — у клиента не было аккаунта в MAIL-KA до этого.",
  },
  {
    q: "Нужно ли быть ИП или самозанятым?",
    a: "Нет. Платим физлицам как обычный гонорар (удерживаем НДФЛ). Самозанятым и ИП платим всю сумму — налог платите сами. Документы для бухгалтерии присылаем по запросу.",
  },
  {
    q: "Можно ли совмещать с работой в агентстве?",
    a: "Да, и это даже выгоднее. Большинство наших партнёров — внутренние маркетологи или агентства, которые рекомендуют MAIL-KA своим клиентам.",
  },
];

const TRUST_BULLETS = [
  { icon: "ShieldCheck", text: "Договор оферты — публичный, не нужно подписывать бумажные документы" },
  { icon: "Eye", text: "Прозрачная статистика: видишь каждого приведённого клиента и его платежи" },
  { icon: "Clock", text: "Поддержка партнёров в Telegram, отвечаем в течение часа" },
  { icon: "FileText", text: "Готовые промо-материалы: баннеры, тексты, скриншоты, видео-обзор" },
];

export default function PartnersPage() {
  const [contacts, setContacts] = useState(50);
  const [tariff, setTariff] = useState<"start" | "business" | "enterprise">("business");
  const [program, setProgram] = useState<"referral" | "agency">("referral");

  const tariffPrice = tariff === "start" ? 990 : tariff === "business" ? 2990 : 7990;
  const rate = program === "referral" ? 0.2 : 0.3;
  const monthly = Math.round(contacts * tariffPrice * rate);
  const yearly = monthly * 12;

  const [form, setForm] = useState<{
    name: string; email: string; channel: string; audience: string; program: PartnerProgram;
  }>({ name: "", email: "", channel: "", audience: "", program: "referral" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stats, setStats] = useState({ active_partners: 0, total_applications: 0 });

  useEffect(() => {
    fetchPartnerStats().then((s) => {
      if (s.ok) setStats({ active_partners: s.active_partners, total_applications: s.total_applications });
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const utm = new URLSearchParams(window.location.search).get("utm_source") || undefined;
      const r = await submitPartnerApplication({
        program: form.program,
        name: form.name,
        email: form.email,
        channel: form.channel || undefined,
        audience: form.audience || undefined,
        utm_source: utm,
      });
      if (r.ok) {
        setSubmitted(true);
        setForm({ name: "", email: "", channel: "", audience: "", program: "referral" });
      } else {
        const map: Record<string, string> = {
          invalid_email: "Проверь email — кажется, опечатка",
          name_required: "Укажи имя",
          invalid_json: "Что-то пошло не так, попробуй ещё раз",
        };
        setSubmitError(map[r.error || ""] || "Не удалось отправить заявку. Попробуй ещё раз.");
      }
    } catch {
      setSubmitError("Сетевая ошибка. Проверь интернет и попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("ru-RU").format(n) + " ₽";

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-12">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.10), rgba(6,182,212,0.08))",
          border: "1px solid rgba(139,92,246,0.18)",
        }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        <div className="relative max-w-3xl space-y-5">
          <Badge variant="secondary" className="text-xs"
            style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" }}>
            <Icon name="Handshake" size={12} className="mr-1.5" />
            Партнёрская программа MAIL-KA
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            Зарабатывай <span className="gradient-text">до 40%</span><br />
            с каждого приведённого клиента
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Рекомендуй MAIL-KA своей аудитории, клиентам или коллегам — и получай долю от их платежей
            каждый месяц, пока они пользуются сервисом. Без вложений, без минимального порога, без бюрократии.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" className="text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
              onClick={() => document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth" })}>
              <Icon name="Rocket" size={16} className="mr-2" />
              Стать партнёром
            </Button>
            <Button size="lg" variant="outline"
              onClick={() => document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" })}>
              <Icon name="Calculator" size={16} className="mr-2" />
              Рассчитать доход
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 max-w-2xl">
            {[
              { v: "20–40%", l: "доля с платежей" },
              { v: "12 мес+", l: "выплат с клиента" },
              { v: "90 дней", l: "cookie-атрибуция" },
              { v: "1 000 ₽", l: "минимальный вывод" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-xl sm:text-2xl font-extrabold gradient-text">{s.v}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">4 формата партнёрства</h2>
          <p className="text-sm text-muted-foreground">Выбери, что подходит именно тебе — от рекомендации в Telegram до White Label.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROGRAMS.map((p) => (
            <Card key={p.id} className="p-5 relative space-y-4 hover:shadow-lg transition-shadow"
              style={p.recommended ? { borderColor: p.color, borderWidth: 2 } : {}}>
              {p.recommended && (
                <div className="absolute -top-2.5 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: p.color }}>
                  ПОПУЛЯРНО
                </div>
              )}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: `${p.color}1a`, color: p.color }}>
                <Icon name={p.icon} size={20} />
              </div>
              <div>
                <div className="font-bold text-base">{p.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{p.subtitle}</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold" style={{ color: p.color }}>{p.revshare}</span>
                <span className="text-xs text-muted-foreground">/ {p.period}</span>
              </div>
              <ul className="space-y-1.5 text-xs">
                {p.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Icon name="Check" size={12} style={{ color: p.color, marginTop: 2 }} className="flex-shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-border text-[10px] text-muted-foreground flex items-center gap-1.5">
                <Icon name="Wallet" size={11} />
                Выплаты {p.payout}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Сколько ты заработаешь</h2>
          <p className="text-sm text-muted-foreground">Подвигай ползунки и посмотри реальный потенциал. Цифры основаны на тарифах MAIL-KA.</p>
        </div>

        <Card className="p-6 sm:p-8 grid lg:grid-cols-2 gap-8 items-center"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(6,182,212,0.03))" }}>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-sm font-medium">Приведённых клиентов в месяц</label>
                <span className="text-2xl font-bold gradient-text">{contacts}</span>
              </div>
              <input type="range" min={1} max={200} value={contacts}
                onChange={(e) => setContacts(Number(e.target.value))}
                className="w-full accent-violet-500" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1</span><span>50</span><span>100</span><span>200</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Средний тариф клиента</label>
              <div className="grid grid-cols-3 gap-2">
                {(["start", "business", "enterprise"] as const).map((t) => (
                  <button key={t} onClick={() => setTariff(t)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      tariff === t ? "border-violet-500 bg-violet-50/50" : "border-border hover:bg-secondary"
                    }`}>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                      {t === "start" ? "Старт" : t === "business" ? "Бизнес" : "Enterprise"}
                    </div>
                    <div className="text-sm font-bold">
                      {t === "start" ? "990 ₽" : t === "business" ? "2 990 ₽" : "7 990 ₽"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Тип партнёрства</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setProgram("referral")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    program === "referral" ? "border-violet-500 bg-violet-50/50" : "border-border hover:bg-secondary"
                  }`}>
                  <div className="text-xs font-bold">Реферальная</div>
                  <div className="text-[11px] text-muted-foreground">20% · 12 мес</div>
                </button>
                <button onClick={() => setProgram("agency")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    program === "agency" ? "border-violet-500 bg-violet-50/50" : "border-border hover:bg-secondary"
                  }`}>
                  <div className="text-xs font-bold">Агентство</div>
                  <div className="text-[11px] text-muted-foreground">30% · пожизненно</div>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl p-6 text-white relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative space-y-4">
                <div>
                  <div className="text-xs opacity-80 uppercase tracking-wide">Твой доход в месяц</div>
                  <div className="text-4xl sm:text-5xl font-extrabold mt-1">{formatMoney(monthly)}</div>
                </div>
                <div className="h-px bg-white/20" />
                <div>
                  <div className="text-xs opacity-80 uppercase tracking-wide">За год</div>
                  <div className="text-2xl sm:text-3xl font-bold mt-1">{formatMoney(yearly)}</div>
                </div>
                <div className="text-[10px] opacity-70 pt-2">
                  Расчёт: {contacts} клиентов × {formatMoney(tariffPrice)} × {Math.round(rate * 100)}%
                </div>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground text-center">
              Это пассивный доход — клиенты платят ежемесячно, ты получаешь свою долю автоматически.
            </div>
          </div>
        </Card>
      </section>

      {/* HOW IT WORKS */}
      <section className="space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Как это работает</h2>
          <p className="text-sm text-muted-foreground">От регистрации до первой выплаты — 30 минут на старт.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((s) => (
            <Card key={s.num} className="p-5 space-y-3 relative">
              <div className="absolute top-4 right-4 text-3xl font-extrabold opacity-10">{s.num}</div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
                <Icon name={s.icon} size={18} />
              </div>
              <div>
                <div className="font-bold text-sm">{s.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{s.desc}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section>
        <Card className="p-6 sm:p-8 grid md:grid-cols-2 lg:grid-cols-4 gap-5"
          style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.18)" }}>
          {TRUST_BULLETS.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4" }}>
                <Icon name={b.icon} size={16} />
              </div>
              <div className="text-xs leading-relaxed">{b.text}</div>
            </div>
          ))}
        </Card>
      </section>

      {/* WHO IS A GOOD PARTNER */}
      <section className="space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Кому это подойдёт</h2>
          <p className="text-sm text-muted-foreground">Если ты работаешь с малым бизнесом или маркетингом — это для тебя.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: "Megaphone", title: "Маркетологи и SMM-щики", desc: "Рекомендуй клиентам, у которых уже есть база подписчиков." },
            { icon: "Briefcase", title: "Digital-агентства", desc: "Включай MAIL-KA в продакшен-пакет, оставляй маржу себе." },
            { icon: "PenTool", title: "Авторы блогов и каналов", desc: "Аудитория предпринимателей — идеальный канал для нас." },
            { icon: "GraduationCap", title: "Преподаватели и инфобиз", desc: "Включи в свой курс или вебинар, как пример инструмента." },
            { icon: "Code2", title: "Веб-студии и фрилансеры", desc: "Настраивай рассылки клиентам и получай % с подписки." },
            { icon: "Building", title: "CRM, CMS, маркетплейсы", desc: "Технологическое партнёрство — мы вместе делаем интеграцию." },
          ].map((c, i) => (
            <Card key={i} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(139,92,246,0.10)", color: "#8b5cf6" }}>
                  <Icon name={c.icon} size={18} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{c.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{c.desc}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Частые вопросы</h2>
        </div>

        <Tabs defaultValue="0" className="max-w-3xl mx-auto">
          <TabsList className="flex flex-wrap h-auto bg-secondary/50 p-1.5 rounded-2xl">
            {FAQ.map((_, i) => (
              <TabsTrigger key={i} value={String(i)} className="text-xs rounded-xl">
                Вопрос {i + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          {FAQ.map((f, i) => (
            <TabsContent key={i} value={String(i)} className="mt-4">
              <Card className="p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
                    <Icon name="HelpCircle" size={16} />
                  </div>
                  <div className="font-semibold text-base">{f.q}</div>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed pl-11">{f.a}</div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* APPLY FORM */}
      <section id="partner-form" className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Badge variant="secondary" className="text-xs"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
            <Icon name="Send" size={11} className="mr-1.5" />
            Заявка обрабатывается за 1 рабочий день
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">Подай заявку</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Расскажи о себе и аудитории — мы свяжемся, выдадим ссылку, промокод и промо-материалы.
            Если у тебя есть особые условия (например, ты ведёшь крупное агентство или Telegram-канал на 50К+) —
            обсудим индивидуальные ставки.
          </p>
          <div className="space-y-2 pt-2">
            {[
              { icon: "Mail", label: "partners@mail-ka.ru", href: "mailto:partners@mail-ka.ru" },
              { icon: "MessageCircle", label: "Telegram: @mailka_partners", href: "https://t.me/mailka_partners" },
            ].map((c, i) => (
              <a key={i} href={c.href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Icon name={c.icon} size={14} />
                {c.label}
              </a>
            ))}
          </div>
        </div>

        <Card className="lg:col-span-3 p-6">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                <Icon name="Check" size={32} />
              </div>
              <div>
                <div className="text-xl font-bold">Заявка отправлена!</div>
                <div className="text-sm text-muted-foreground mt-1">Мы напишем тебе на email в течение 1 рабочего дня.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Имя</label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Иван Петров" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Email</label>
                  <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.ru" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Программа</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PROGRAMS.map((p) => (
                    <button key={p.id} type="button" onClick={() => setForm({ ...form, program: p.id as PartnerProgram })}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        form.program === p.id ? "border-violet-500 bg-violet-50/50" : "border-border hover:bg-secondary"
                      }`}>
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                        {p.id === "referral" ? "Реферальная" : p.id === "agency" ? "Агентство" : p.id === "whitelabel" ? "White Label" : "Технологическая"}
                      </div>
                      <div className="text-[11px] font-bold mt-0.5">{p.revshare}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Канал продвижения</label>
                <Input value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  placeholder="Telegram-канал, блог, YouTube, агентство, клиенты CRM..." />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Аудитория и опыт</label>
                <Textarea rows={3} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  placeholder="Опиши свою аудиторию: размер, ниша. Сколько клиентов планируешь приводить в месяц." />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Icon name="ShieldCheck" size={12} />
                Нажимая «Отправить», ты соглашаешься с обработкой персональных данных по 152-ФЗ.
              </div>

              {submitError && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-xs"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626" }}>
                  <Icon name="AlertCircle" size={13} className="flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <Button type="submit" size="lg" disabled={submitting} className="w-full text-white"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                <Icon name={submitting ? "Loader2" : "Send"} size={16} className={`mr-2 ${submitting ? "animate-spin" : ""}`} />
                {submitting ? "Отправляем..." : "Отправить заявку"}
              </Button>
            </form>
          )}
        </Card>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-8 space-y-3">
        {stats.total_applications > 0 ? (
          <>
            <div className="text-2xl sm:text-3xl font-bold">
              Уже <span className="gradient-text">{stats.total_applications}</span> заявок от партнёров принято
            </div>
            {stats.active_partners > 0 && (
              <div className="text-sm text-muted-foreground">
                Активных партнёров: <span className="font-semibold text-foreground">{stats.active_partners}</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-2xl sm:text-3xl font-bold">
            Стань <span className="gradient-text">первым партнёром</span> MAIL-KA
          </div>
        )}
      </section>
    </div>
  );
}