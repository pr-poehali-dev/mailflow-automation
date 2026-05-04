import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { AI_URL } from "@/api";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "mk_ai_consultant_history";

const QUICK_QUESTIONS = [
  "С чего начать?",
  "Какой тариф выбрать?",
  "Как импортировать контакты?",
  "Чем вы лучше других?",
];

const GREETING: Msg = {
  role: "assistant",
  content:
    "Привет! Я Юра — ваш ИИ-консультант MAIL-KA. Помогу с тарифами, настройкой рассылок, импортом контактов или подключением домена. О чём расскажу?",
};

export default function AiConsultant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [GREETING];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  // Подсказка: показываем «непрочитанное» через 8 секунд после загрузки
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => setUnread(true), 8000);
    return () => clearTimeout(t);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch(`${AI_URL}?action=consultant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: next.slice(0, -1).slice(-8),
        }),
      });
      const data = await r.json();
      if (data.ok && data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Что-то пошло не так. Попробуйте ещё раз или напишите в поддержку support@mail-ka.ru.",
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([GREETING]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function toggle() {
    setOpen((v) => !v);
    setUnread(false);
  }

  return (
    <>
      {/* Плавающая кнопка */}
      <button
        onClick={toggle}
        aria-label={open ? "Закрыть консультанта" : "Открыть ИИ-консультанта"}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
        style={{
          background: open
            ? "rgba(30, 27, 75, 0.95)"
            : "linear-gradient(135deg, #8b5cf6, #06b6d4)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <Icon name={open ? "X" : "Sparkles"} size={22} className="text-white" />
        {!open && unread && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500 border-2 border-background animate-pulse" />
        )}
      </button>

      {/* Окно чата */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden glass"
          style={{
            background: "rgba(15, 12, 41, 0.96)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Шапка */}
          <div
            className="px-4 py-3 flex items-center justify-between border-b border-white/10"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
              >
                <Icon name="Bot" size={18} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm">Юра</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  ИИ-консультант на связи
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              title="Очистить чат"
              className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-white/5"
            >
              <Icon name="RotateCcw" size={14} />
            </button>
          </div>

          {/* Сообщения */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-md text-white"
                      : "rounded-bl-md text-foreground"
                  }`}
                  style={{
                    background:
                      m.role === "user"
                        ? "linear-gradient(135deg, #8b5cf6, #06b6d4)"
                        : "rgba(255,255,255,0.06)",
                    border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-white/5 text-sm flex items-center gap-1.5 border border-white/8">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="pt-1">
                <div className="text-[11px] text-muted-foreground mb-1.5 px-1">Популярные вопросы:</div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-xs px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Поле ввода */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t border-white/10 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спросите Юру…"
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500/50 transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-105"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
            >
              <Icon name="Send" size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
