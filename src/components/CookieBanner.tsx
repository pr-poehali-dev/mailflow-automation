import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const KEY = "mk_cookie_accepted";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const accept = (value: "all" | "essential") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 fade-in-up"
      style={{
        background: "rgba(20, 18, 35, 0.95)",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-start gap-2.5 mb-3">
        <Icon name="Cookie" size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-white mb-1">Мы используем cookie</div>
          <p className="text-[11px] text-white/70 leading-relaxed">
            Файлы cookie помогают сервису работать (вход в кабинет, тема оформления) и
            анализировать посещаемость через Яндекс.Метрику. Подробнее в{" "}
            <a href="/legal/cookie" target="_blank" className="underline text-purple-300">
              Политике использования cookie
            </a>.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => accept("essential")}
          className="flex-1 py-2 rounded-lg text-[11px] font-medium text-white/80 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          Только необходимые
        </button>
        <button
          onClick={() => accept("all")}
          className="flex-1 py-2 rounded-lg text-[11px] font-semibold text-white transition-transform hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
        >
          Принять все
        </button>
      </div>
    </div>
  );
}
