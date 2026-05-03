import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const TRACKING_URL = "https://functions.poehali.dev"; // backend/tracking функция

export default function UnsubscribePage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t") || params.get("token");
    setToken(t);
    document.title = "Отписка от рассылки — MAIL-KA";
  }, []);

  const submit = async () => {
    if (!token) return;
    setStatus("loading");
    try {
      const r = await fetch(`${TRACKING_URL}/?action=unsubscribe&t=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        setStatus("success");
        setMessage(data.message || "Вы успешно отписаны. Больше писем не получите.");
      } else {
        setStatus("error");
        setMessage(data.error || "Не удалось обработать отписку. Свяжитесь с abuse@mail-ka.ru");
      }
    } catch {
      setStatus("error");
      setMessage("Сетевая ошибка. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-7 shadow-lg">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <Icon name="MailMinus" size={17} className="text-white" />
          </div>
          <div>
            <div className="text-base font-bold">Отписка от рассылки</div>
            <div className="text-[11px] text-muted-foreground">MAIL-KA — сервис email-рассылок</div>
          </div>
        </div>

        {!token && (
          <div className="text-sm text-muted-foreground py-4">
            <Icon name="AlertCircle" size={16} className="inline mr-1.5 text-amber-500" />
            Ссылка отписки недействительна. Перейдите по ссылке из полученного письма.
          </div>
        )}

        {status === "idle" && token && (
          <>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Нажмите кнопку ниже, чтобы отписаться от всех маркетинговых рассылок.
              Это действие необратимо: после отписки вы больше не получите писем от отправителя.
            </p>
            <button
              onClick={submit}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.01] flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #ef4444, #f59e0b)" }}
            >
              <Icon name="MailX" size={14} />
              Подтвердить отписку
            </button>
          </>
        )}

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
            <Icon name="Loader2" size={16} className="animate-spin" />
            Обработка...
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-3">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)" }}>
              <Icon name="Check" size={26} className="text-emerald-500" />
            </div>
            <div className="text-sm font-semibold mb-1">Отписка подтверждена</div>
            <div className="text-xs text-muted-foreground">{message}</div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-3">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)" }}>
              <Icon name="X" size={26} className="text-red-500" />
            </div>
            <div className="text-sm font-semibold mb-1">Ошибка отписки</div>
            <div className="text-xs text-muted-foreground">{message}</div>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-border text-[11px] text-muted-foreground text-center">
          Жалобы на спам: <a href="mailto:abuse@mail-ka.ru" className="underline">abuse@mail-ka.ru</a>
        </div>
      </div>
    </div>
  );
}
