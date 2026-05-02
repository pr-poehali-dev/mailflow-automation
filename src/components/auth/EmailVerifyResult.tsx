import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  token: string;
  onClose: () => void;
}

type State = "loading" | "success" | "error";

export function EmailVerifyResult({ token, onClose }: Props) {
  const { verifyEmail } = useAuth();
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await verifyEmail(token);
      if (cancelled) return;
      if (res.ok) {
        setState("success");
      } else {
        setState("error");
        setErrorMsg(res.error || "Не удалось подтвердить email");
      }
    })();
    return () => { cancelled = true; };
  }, [token, verifyEmail]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass rounded-3xl p-8 text-center fade-in-up relative overflow-hidden"
        style={{
          border: state === "success"
            ? "1px solid rgba(16,185,129,0.25)"
            : state === "error"
            ? "1px solid rgba(239,68,68,0.25)"
            : "1px solid rgba(139,92,246,0.25)",
          boxShadow: state === "success"
            ? "0 25px 80px rgba(16,185,129,0.18)"
            : "0 25px 80px rgba(139,92,246,0.18)",
        }}>
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{
            background: state === "error"
              ? "radial-gradient(circle, #ef4444, transparent)"
              : "radial-gradient(circle, #10b981, transparent)",
          }} />

        <div className="relative">
          {state === "loading" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                <Icon name="Loader2" size={28} className="text-white animate-spin" />
              </div>
              <h2 className="text-xl font-bold gradient-text mb-2">Подтверждаем email...</h2>
              <p className="text-sm text-muted-foreground">Это займёт пару секунд</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}>
                <Icon name="CheckCheck" size={32} className="text-white" strokeWidth={3} />
              </div>
              <h2 className="text-xl font-bold gradient-text mb-2">Email подтверждён!</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Спасибо! Теперь вам доступны все возможности MAIL-KA — рассылки, автоматизации и аналитика.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
              >
                <Icon name="ArrowRight" size={14} />
                Продолжить работу
              </button>
            </>
          )}

          {state === "error" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #ef4444, #f59e0b)" }}>
                <Icon name="X" size={32} className="text-white" strokeWidth={3} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "#ef4444" }}>Ссылка не сработала</h2>
              <p className="text-sm text-muted-foreground mb-5">{errorMsg}</p>
              <p className="text-xs text-muted-foreground mb-4">
                Возможно, ссылка устарела (срок 24 часа) или уже была использована.
                Войдите в аккаунт и нажмите «Отправить ещё раз» в баннере сверху.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-medium glass hover:bg-white/8 flex items-center justify-center gap-2"
              >
                <Icon name="Home" size={14} />
                На главную
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailVerifyResult;
