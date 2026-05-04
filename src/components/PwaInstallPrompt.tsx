import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const HIDE_KEY = "mk_pwa_hide_until";

export default function PwaInstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hideUntil = Number(localStorage.getItem(HIDE_KEY) || 0);
    if (hideUntil > Date.now()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setTimeout(() => setVisible(true), 8000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !evt) return null;

  const install = async () => {
    await evt.prompt();
    await evt.userChoice;
    setVisible(false);
  };

  const hide = () => {
    localStorage.setItem(HIDE_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-40 fade-in-up">
      <div className="glass rounded-2xl p-4 shadow-2xl"
        style={{ border: "1px solid rgba(139,92,246,0.3)" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <Icon name="Smartphone" size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm mb-1">Установить MAIL-KA</div>
            <div className="text-xs text-muted-foreground mb-3">
              Быстрый доступ к рассылкам с экрана телефона. Без браузера.
            </div>
            <div className="flex gap-2">
              <button onClick={install}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                Установить
              </button>
              <button onClick={hide}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary">
                Позже
              </button>
            </div>
          </div>
          <button onClick={hide} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
