import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Page } from "@/data/mockData";

interface Props {
  setPage: (p: Page) => void;
}

export function PaymentSuccessPage({ setPage }: Props) {
  const [confettiKey] = useState(() => Date.now());

  // Очищаем query-параметр после показа, чтобы при F5 не остаться на этой странице
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("payment")) {
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.toString());
    }
    // Подсчёт конверсии в Яндекс.Метрику
    const ym = (window as unknown as { ym?: (id: number, action: string, target: string) => void }).ym;
    if (ym) ym(101026698, "reachGoal", "payment_success");
  }, []);

  const features = [
    { icon: "Sparkles", title: "AI-копирайтер", desc: "GPT-4o, Claude, DeepSeek — без лимитов" },
    { icon: "Workflow", title: "Автоматизации", desc: "Welcome-серии, брошенная корзина" },
    { icon: "Network", title: "Omnichannel", desc: "Email + SMS + Telegram + Push" },
    { icon: "TrendingUp", title: "Predictive AI", desc: "LTV-прогноз и churn risk" },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      {/* Confetti фон */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" key={confettiKey}>
        {Array.from({ length: 30 }).map((_, i) => {
          const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#ec4899", "#f59e0b"];
          const color = colors[i % colors.length];
          const left = (i * 137) % 100;
          const delay = (i * 0.15) % 3;
          const duration = 3 + ((i * 0.3) % 2);
          return (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                left: `${left}%`,
                top: "-20px",
                background: color,
                animation: `confettiFall ${duration}s ${delay}s linear infinite`,
                transform: `rotate(${i * 30}deg)`,
              }}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 24px rgba(16,185,129,0); }
        }
      `}</style>

      <div className="max-w-2xl w-full relative z-10">
        {/* Card */}
        <div className="glass rounded-3xl p-8 text-center fade-in-up relative overflow-hidden"
          style={{ border: "1px solid rgba(16,185,129,0.25)",
                   boxShadow: "0 25px 80px rgba(16,185,129,0.18)" }}>

          {/* Glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />

          <div className="relative">
            {/* Иконка успеха */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
              style={{
                background: "linear-gradient(135deg, #10b981, #06b6d4)",
                animation: "successPulse 2s infinite",
              }}>
              <Icon name="Check" size={40} className="text-white" strokeWidth={3} />
            </div>

            <h1 className="text-3xl font-bold mb-2 gradient-text">Оплата прошла успешно!</h1>
            <p className="text-muted-foreground text-sm mb-1">
              Спасибо за доверие 🚀 Подписка активирована, всё готово к работе.
            </p>
            <p className="text-xs text-muted-foreground">
              Чек по 54-ФЗ и реквизиты доступа отправлены на ваш email
            </p>

            {/* Что включено */}
            <div className="grid grid-cols-2 gap-2 mt-6 text-left">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)",
                           animation: `fadeInUp 0.4s ${0.1 + i * 0.08}s both` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(139,92,246,0.12)" }}>
                    <Icon name={f.icon} size={13} style={{ color: "#8b5cf6" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold">{f.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats доверия */}
            <div className="flex items-center justify-center gap-5 mt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Icon name="ShieldCheck" size={12} style={{ color: "#10b981" }} />
                <span>Оплата прошла безопасно</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="Mail" size={12} style={{ color: "#06b6d4" }} />
                <span>Чек на email</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="FileText" size={12} style={{ color: "#8b5cf6" }} />
                <span>Документы для бухгалтерии</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-7">
              <button
                onClick={() => setPage("editor")}
                className="py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                <Icon name="Sparkles" size={14} />
                Создать первое письмо
              </button>
              <button
                onClick={() => setPage("dashboard")}
                className="py-3 rounded-xl text-sm font-medium glass hover:bg-white/8 flex items-center justify-center gap-2 transition-colors">
                <Icon name="LayoutDashboard" size={14} />
                Перейти в дашборд
              </button>
            </div>

            {/* Дополнительные ссылки */}
            <div className="mt-5 pt-5 border-t border-border flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <button onClick={() => setPage("settings")} className="hover:text-foreground flex items-center gap-1">
                <Icon name="Settings" size={11} />Настройки SMTP
              </button>
              <button onClick={() => setPage("contacts")} className="hover:text-foreground flex items-center gap-1">
                <Icon name="Upload" size={11} />Импорт контактов
              </button>
              <button onClick={() => setPage("automation")} className="hover:text-foreground flex items-center gap-1">
                <Icon name="Workflow" size={11} />Запустить автоматизацию
              </button>
            </div>
          </div>
        </div>

        {/* Помощь */}
        <div className="text-center mt-5 text-xs text-muted-foreground">
          Не видите письмо с реквизитами? Проверьте папку «Спам» или{" "}
          <a className="underline hover:text-foreground cursor-pointer">напишите в поддержку</a> — отвечаем за 2 минуты.
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
