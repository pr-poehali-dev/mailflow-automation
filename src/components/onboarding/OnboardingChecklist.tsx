import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Page } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { fetchContacts, fetchCampaigns, Campaign } from "@/api";

interface Props {
  setPage: (p: Page) => void;
  campaigns: Campaign[];
}

interface Step {
  id: string;
  icon: string;
  color: string;
  title: string;
  desc: string;
  cta: string;
  done: boolean;
  action: () => void;
}

const DISMISS_KEY = "mk_onboarding_dismissed";

export function OnboardingChecklist({ setPage, campaigns }: Props) {
  const { user, resendVerification } = useAuth();
  const [contactsCount, setContactsCount] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    fetchContacts()
      .then((d) => setContactsCount(d.total ?? (d.contacts ? d.contacts.length : 0)))
      .catch(() => setContactsCount(0));
  }, []);

  const emailVerified = user?.is_email_verified === true;
  const hasContacts = (contactsCount ?? 0) > 0;
  const hasCampaign = campaigns.length > 0;
  const hasContent = campaigns.some((c) => (c.body_text || "").trim().length > 10);
  const hasSent = campaigns.some((c) => c.sent_count > 0);

  const handleResend = async () => {
    setResending(true);
    const r = await resendVerification();
    setResendMsg(r.ok ? "Письмо отправлено! Проверьте «Входящие» и «Спам»." : (r.error || "Не удалось отправить"));
    setResending(false);
    setTimeout(() => setResendMsg(null), 6000);
  };

  const steps: Step[] = [
    {
      id: "verify",
      icon: "ShieldCheck",
      color: "#10b981",
      title: "Подтвердите email",
      desc: emailVerified ? "Готово — почта подтверждена" : `Мы отправили письмо на ${user?.email || "вашу почту"}`,
      cta: "Отправить ещё раз",
      done: emailVerified,
      action: handleResend,
    },
    {
      id: "contacts",
      icon: "Users",
      color: "#06b6d4",
      title: "Загрузите контакты",
      desc: hasContacts ? `Загружено ${contactsCount} контактов` : "Импортируйте список из Excel или добавьте вручную",
      cta: "Перейти к контактам",
      done: hasContacts,
      action: () => setPage("contacts"),
    },
    {
      id: "campaign",
      icon: "Mail",
      color: "#8b5cf6",
      title: "Создайте первую кампанию",
      desc: hasCampaign ? `Создано кампаний: ${campaigns.length}` : "Назовите рассылку и выберите получателей",
      cta: "Создать кампанию",
      done: hasCampaign,
      action: () => setPage("campaigns"),
    },
    {
      id: "content",
      icon: "Sparkles",
      color: "#f59e0b",
      title: "Напишите письмо",
      desc: hasContent ? "Текст письма готов" : "Используйте ИИ-копирайтер или готовый шаблон",
      cta: "Открыть редактор",
      done: hasContent,
      action: () => setPage("editor"),
    },
    {
      id: "send",
      icon: "Rocket",
      color: "#ec4899",
      title: "Отправьте первое письмо",
      desc: hasSent ? "Поздравляем — рассылка запущена!" : "Сначала тест себе, потом всей базе",
      cta: "Запустить",
      done: hasSent,
      action: () => setPage("editor"),
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;

  // Если всё сделано или пользователь скрыл — не показываем
  if (!user || dismissed || allDone) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl p-5 fade-in-up relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.04))",
        border: "1px solid rgba(139,92,246,0.25)",
      }}>
      <div className="absolute top-0 right-0 w-64 h-64 opacity-20 blur-3xl rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />

      <div className="relative">
        {/* Заголовок и прогресс */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                <Icon name="Rocket" size={15} className="text-white" />
              </div>
              <h2 className="font-bold text-lg">Готовность аккаунта</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                {progress}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Выполните {steps.length - doneCount} {steps.length - doneCount === 1 ? "шаг" : "шагов"} — и запустите первую рассылку
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCollapsed(!collapsed)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title={collapsed ? "Развернуть" : "Свернуть"}>
              <Icon name={collapsed ? "ChevronDown" : "ChevronUp"} size={15} />
            </button>
            <button onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title="Скрыть навсегда">
              <Icon name="X" size={15} />
            </button>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
              boxShadow: "0 0 12px rgba(139,92,246,0.5)",
            }} />
        </div>

        {/* Сообщение о повторной отправке письма */}
        {resendMsg && (
          <div className="rounded-xl p-2.5 text-xs mb-3 fade-in-up"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
            <Icon name="CheckCircle" size={11} className="inline mr-1.5" />
            {resendMsg}
          </div>
        )}

        {/* Шаги */}
        {!collapsed && (
          <div className="space-y-2 fade-in-up">
            {steps.map((step, idx) => (
              <div key={step.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  step.done ? "opacity-60" : "hover:bg-white/5"
                }`}
                style={{
                  background: step.done ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${step.done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
                }}>
                {/* Чекбокс */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                  style={{
                    background: step.done ? "#10b981" : "rgba(255,255,255,0.05)",
                    border: step.done ? "none" : `1.5px dashed ${step.color}55`,
                    color: step.done ? "white" : step.color,
                  }}>
                  {step.done ? <Icon name="Check" size={13} /> : idx + 1}
                </div>

                {/* Иконка */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                  <Icon name={step.icon} size={15} style={{ color: step.color }} />
                </div>

                {/* Текст */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${step.done ? "line-through" : ""}`}>{step.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{step.desc}</div>
                </div>

                {/* Кнопка */}
                {!step.done && (
                  <button onClick={step.action} disabled={step.id === "verify" && resending}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-60 flex-shrink-0 hover:scale-105 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }}>
                    {step.id === "verify" && resending ? (
                      <><Icon name="Loader2" size={11} className="animate-spin" />Отправляем</>
                    ) : (
                      <>{step.cta}<Icon name="ArrowRight" size={11} /></>
                    )}
                  </button>
                )}
                {step.done && (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                    Готово
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingChecklist;