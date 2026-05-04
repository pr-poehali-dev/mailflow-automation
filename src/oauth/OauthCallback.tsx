import { useEffect, useState } from "react";
import { processOauthCallback } from "@/api/crm";
import Icon from "@/components/ui/icon";

export default function OauthCallback() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const query = window.location.search.replace(/^\?/, "");
      const res = await processOauthCallback(query);
      if (res.ok) {
        setState("ok");
        setMessage(`Подключено: ${res.provider || "CRM"}. Окно закроется автоматически.`);
        try {
          if (window.opener) {
            window.opener.postMessage({ type: "mk-oauth-success", provider: res.provider }, "*");
          }
        } catch {/* ignore */}
        setTimeout(() => {
          try { window.close(); } catch {/* ignore */}
        }, 1500);
      } else {
        setState("error");
        setMessage(res.error || "Не удалось завершить авторизацию");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0a0a16 0%, #1a0a2e 100%)" }}>
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center"
        style={{ border: "1px solid rgba(139,92,246,0.3)" }}>
        {state === "loading" && (
          <>
            <Icon name="Loader2" size={40} className="animate-spin mx-auto mb-4" style={{ color: "#8b5cf6" }} />
            <div className="font-bold text-lg mb-1">Завершаем подключение…</div>
            <div className="text-sm text-muted-foreground">Сохраняем токен доступа</div>
          </>
        )}
        {state === "ok" && (
          <>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.15)" }}>
              <Icon name="Check" size={32} style={{ color: "#10b981" }} />
            </div>
            <div className="font-bold text-lg mb-2">Готово!</div>
            <div className="text-sm text-muted-foreground">{message}</div>
          </>
        )}
        {state === "error" && (
          <>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.15)" }}>
              <Icon name="X" size={32} style={{ color: "#ef4444" }} />
            </div>
            <div className="font-bold text-lg mb-2">Не получилось</div>
            <div className="text-sm text-muted-foreground mb-4">{message}</div>
            <button
              onClick={() => window.close()}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              Закрыть окно
            </button>
          </>
        )}
      </div>
    </div>
  );
}
