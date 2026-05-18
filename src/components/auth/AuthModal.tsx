import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "login" | "register";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
  reason?: string;
}

export function AuthModal({ open, onClose, initialMode = "register", reason }: Props) {
  const { login, register, loading, user } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);

  useEffect(() => { if (open) setMode(initialMode); }, [open, initialMode]);
  useEffect(() => { if (user && open) onClose(); }, [user, open, onClose]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pwdScore = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const pwdLabel = ["Слабый", "Слабый", "Средний", "Хороший", "Сильный", "Отличный"][pwdScore];
  const pwdColor = ["#ef4444", "#ef4444", "#f59e0b", "#06b6d4", "#10b981", "#10b981"][pwdScore];

  const sanitize = (v: string, max = 255) => v.replace(/[<>]/g, "").slice(0, max);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emailClean = sanitize(email.trim().toLowerCase(), 255);
    const nameClean = sanitize(name.trim(), 80);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      setError("Введите корректный email"); return;
    }
    if (mode === "register") {
      if (!nameClean || nameClean.length < 2) { setError("Укажите имя"); return; }
      if (password.length < 8) { setError("Пароль минимум 8 символов"); return; }
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        setError("Пароль должен содержать буквы и цифры"); return;
      }
      if (!agree) { setError("Подтвердите согласие с условиями"); return; }
    } else if (password.length < 1) {
      setError("Введите пароль"); return;
    }

    const res = mode === "login"
      ? await login(emailClean, password)
      : await register(emailClean, password, nameClean, {
          offer: agree,
          privacy: agree,
          marketing: true,
        });

    if (!res.ok) setError(res.error || "Ошибка");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 fade-in-up overflow-y-auto"
      style={{ background: "rgba(10, 10, 22, 0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="glass rounded-3xl w-full max-w-md relative overflow-hidden my-auto max-h-[calc(100vh-1.5rem)] overflow-y-auto"
        style={{ border: "1px solid rgba(139,92,246,0.25)", boxShadow: "0 25px 80px rgba(139,92,246,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glows */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-white/10 transition-colors z-10"
          aria-label="Закрыть"
        >
          <Icon name="X" size={14} />
        </button>

        <div className="relative p-5 sm:p-7">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              <Icon name={mode === "login" ? "LogIn" : "Sparkles"} size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold gradient-text">
              {mode === "login" ? "С возвращением!" : "Создайте аккаунт"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {reason || (mode === "login"
                ? "Войдите, чтобы продолжить работу"
                : "Бесплатный доступ ко всем разделам — без карты")}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "rgba(139,92,246,0.06)" }}>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "register" ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
              style={mode === "register" ? { background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" } : {}}
            >
              Регистрация
            </button>
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "login" ? "text-white" : "text-muted-foreground hover:text-foreground"
              }`}
              style={mode === "login" ? { background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" } : {}}
            >
              Вход
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Как вас зовут?</label>
                <div className="relative">
                  <Icon name="User" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван"
                    autoComplete="name"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm bg-background/50 border border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Icon name="Mail" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ivan@company.ru"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm bg-background/50 border border-border focus:border-primary outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Пароль</label>
              <div className="relative">
                <Icon name="Lock" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Минимум 8 символов" : "Ваш пароль"}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="w-full pl-9 pr-9 py-2.5 rounded-lg text-sm bg-background/50 border border-border focus:border-primary outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name={showPwd ? "EyeOff" : "Eye"} size={13} />
                </button>
              </div>
              {mode === "register" && password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden bg-background/50">
                    <div className="h-full transition-all"
                      style={{ width: `${(pwdScore / 5) * 100}%`, background: pwdColor }} />
                  </div>
                  <span className="text-[10px]" style={{ color: pwdColor }}>{pwdLabel}</span>
                </div>
              )}
            </div>

            {mode === "register" && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 flex-shrink-0"
                />
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  Принимаю{" "}
                  <a href="/legal/offer" target="_blank" rel="noopener" className="underline hover:text-foreground">
                    договор-оферту
                  </a>{" "}
                  и согласен на{" "}
                  <a href="/legal/privacy" target="_blank" rel="noopener" className="underline hover:text-foreground">
                    обработку персональных данных
                  </a>{" "}
                  по 152-ФЗ
                </span>
              </label>
            )}

            {error && (
              <div className="p-2.5 rounded-lg text-xs flex items-center gap-2"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                <Icon name="AlertCircle" size={13} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  {mode === "login" ? "Входим..." : "Создаём аккаунт..."}
                </>
              ) : (
                <>
                  <Icon name={mode === "login" ? "LogIn" : "ArrowRight"} size={14} />
                  {mode === "login" ? "Войти" : "Создать аккаунт"}
                </>
              )}
            </button>
          </form>

          {/* Trust */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1"><Icon name="ShieldCheck" size={10} style={{ color: "#10b981" }} />152-ФЗ</div>
            <div className="flex items-center gap-1"><Icon name="Lock" size={10} style={{ color: "#06b6d4" }} />Шифрование</div>
            <div className="flex items-center gap-1"><Icon name="Zap" size={10} style={{ color: "#8b5cf6" }} />Free 14 дней</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;