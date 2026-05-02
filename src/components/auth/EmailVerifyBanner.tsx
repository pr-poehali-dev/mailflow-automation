import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";

export function EmailVerifyBanner() {
  const { user, resendVerification } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  if (!user || user.is_email_verified || hidden) return null;

  const onResend = async () => {
    setSending(true);
    setError(null);
    const res = await resendVerification();
    setSending(false);
    if (res.ok) {
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } else {
      setError(res.error || "Не удалось отправить");
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="mx-6 mt-3 rounded-xl flex items-center gap-3 p-3 fade-in-up"
      style={{
        background: "linear-gradient(90deg, rgba(245,158,11,0.1), rgba(236,72,153,0.06))",
        border: "1px solid rgba(245,158,11,0.3)",
      }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(245,158,11,0.18)" }}>
        <Icon name="MailWarning" size={15} style={{ color: "#f59e0b" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground">
          Подтвердите ваш email — <span className="text-muted-foreground font-normal">{user.email}</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {sent
            ? "Письмо отправлено! Проверьте папку «Входящие» и «Спам»."
            : error
            ? error
            : "Мы отправили вам письмо со ссылкой. Подтверждение нужно для доступа к рассылкам."}
        </div>
      </div>
      <button
        onClick={onResend}
        disabled={sending || sent}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #f59e0b, #ec4899)" }}
      >
        {sending ? (
          <><Icon name="Loader2" size={12} className="animate-spin" />Отправляем</>
        ) : sent ? (
          <><Icon name="Check" size={12} />Отправлено</>
        ) : (
          <><Icon name="Send" size={12} />Отправить ещё раз</>
        )}
      </button>
      <button
        onClick={() => setHidden(true)}
        className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-white/10 flex-shrink-0"
        title="Скрыть"
      >
        <Icon name="X" size={13} />
      </button>
    </div>
  );
}

export default EmailVerifyBanner;
