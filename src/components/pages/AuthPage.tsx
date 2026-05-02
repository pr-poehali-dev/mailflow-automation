import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "login" | "register";

export function AuthPage() {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);

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
      setError("Введите корректный email");
      return;
    }
    if (mode === "register") {
      if (password.length < 8) { setError("Пароль минимум 8 символов"); return; }
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        setError("Пароль должен содержать буквы и цифры"); return;
      }
      if (!agree) { setError("Нужно согласиться с условиями"); return; }
    }

    const res = mode === "login"
      ? await login(emailClean, password)
      : await register(emailClean, password, nameClean);

    if (!res.ok) setError(res.error || "Ошибка");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent)" }} />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.2), transparent)" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              <Icon name="Mail" size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">MAIL-KA</span>
          </div>
          <p className="text-xs text-muted-foreground">Email-маркетинг с AI и автоматизациями</p>
        </div>

        <div className="glass rounded-2xl p-6 fade-in-up">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-5"
            style={{ background: "rgba(139,92,246,0.06)" }}>
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: mode === "login" ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "transparent",
                color: mode === "login" ? "white" : "var(--color-muted-foreground)",
              }}>
              Вход
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: mode === "register" ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "transparent",
                color: mode === "register" ? "white" : "var(--color-muted-foreground)",
              }}>
              Регистрация
            </button>
          </div>

          <h1 className="text-xl font-bold mb-1">
            {mode === "login" ? "С возвращением!" : "Создайте аккаунт"}
          </h1>
          <p className="text-xs text-muted-foreground mb-5">
            {mode === "login"
              ? "Войдите, чтобы продолжить работу"
              : "Бесплатный пробный период 14 дней, без карты"}
          </p>

          <form onSubmit={onSubmit} className="space-y-3" autoComplete="on">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(sanitize(e.target.value, 80))}
                  maxLength={80}
                  autoComplete="name"
                  className="w-full px-3 py-2.5 rounded-lg text-sm bg-background border border-border focus:border-primary outline-none transition-colors"
                  placeholder="Как вас зовут"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(sanitize(e.target.value, 255))}
                maxLength={255}
                autoComplete={mode === "login" ? "username" : "email"}
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-background border border-border focus:border-primary outline-none transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">Пароль</label>
                {mode === "login" && (
                  <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                    Забыли?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 128))}
                  maxLength={128}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={mode === "register" ? 8 : 1}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm bg-background border border-border focus:border-primary outline-none transition-colors"
                  placeholder={mode === "register" ? "Минимум 8 символов" : "Ваш пароль"}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Показать пароль">
                  <Icon name={showPwd ? "EyeOff" : "Eye"} size={14} />
                </button>
              </div>
              {mode === "register" && password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 h-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex-1 rounded-full"
                        style={{
                          background: i < pwdScore ? pwdColor : "rgba(255,255,255,0.08)",
                          transition: "background 0.2s",
                        }} />
                    ))}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: pwdColor }}>
                    Надёжность: {pwdLabel}
                  </div>
                </div>
              )}
            </div>

            {mode === "register" && (
              <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 accent-purple-500"
                />
                <span>
                  Я принимаю <span className="underline hover:text-foreground">условия использования</span> и{" "}
                  <span className="underline hover:text-foreground">политику конфиденциальности</span> (152-ФЗ)
                </span>
              </label>
            )}

            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                <Icon name="AlertCircle" size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              {loading ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <>
                  <Icon name={mode === "login" ? "LogIn" : "UserPlus"} size={14} />
                  {mode === "login" ? "Войти" : "Создать аккаунт"}
                </>
              )}
            </button>
          </form>

          {/* Trust */}
          <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-2 text-[10px] text-muted-foreground text-center">
            <div className="flex flex-col items-center gap-1">
              <Icon name="ShieldCheck" size={14} style={{ color: "#10b981" }} />
              <span>Шифрование AES-256</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon name="Lock" size={14} style={{ color: "#06b6d4" }} />
              <span>152-ФЗ соблюдён</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon name="Server" size={14} style={{ color: "#8b5cf6" }} />
              <span>Серверы в РФ</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
            className="text-primary hover:underline font-medium">
            {mode === "login" ? "Зарегистрируйтесь" : "Войдите"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
