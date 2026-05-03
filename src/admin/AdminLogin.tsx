import { useState } from "react";
import Icon from "@/components/ui/icon";
import { adminLogin, AdminUser } from "./adminApi";

interface Props {
  onSuccess: (user: AdminUser) => void;
}

export default function AdminLogin({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const r = await adminLogin(email.trim(), password);
    setLoading(false);
    if (r.ok && r.user) onSuccess(r.user);
    else setError(r.error || "Ошибка входа");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top, #1a0d2e 0%, #0a0612 50%, #000 100%)",
      }}
    >
      {/* Звёздное небо */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
              animation: `pulse-dot ${2 + Math.random() * 3}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Светящиеся сферы */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          top: "10%",
          left: "10%",
          background: "radial-gradient(circle, #8b5cf6, transparent)",
        }}
      />
      <div
        className="absolute w-96 h-96 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          bottom: "10%",
          right: "10%",
          background: "radial-gradient(circle, #06b6d4, transparent)",
        }}
      />

      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
        style={{
          background: "rgba(20, 18, 35, 0.85)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          boxShadow: "0 25px 80px rgba(139, 92, 246, 0.2)",
        }}
      >
        <div className="flex flex-col items-center text-center mb-7">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
              boxShadow: "0 8px 32px rgba(139, 92, 246, 0.4)",
            }}
          >
            <Icon name="ShieldCheck" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ЦУП MAIL-KA</h1>
          <p className="text-sm text-white/60 mt-1.5">
            Центр управления полётами
          </p>
          <div className="mt-3 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}>
            Только для администраторов
          </div>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Email администратора
            </label>
            <div className="relative">
              <Icon
                name="AtSign"
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@mail-ka.ru"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <Icon
                name="Lock"
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 focus:bg-white/10 transition-all"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-3 py-2.5 rounded-lg text-xs flex items-start gap-2"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
            }}>
            <Icon name="AlertTriangle" size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.35)",
          }}
        >
          {loading ? (
            <>
              <Icon name="Loader2" size={15} className="animate-spin" />
              Авторизация...
            </>
          ) : (
            <>
              <Icon name="LogIn" size={15} />
              Войти в ЦУП
            </>
          )}
        </button>

        <a
          href="/"
          className="mt-4 w-full block text-center text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          ← Вернуться на сайт
        </a>
      </form>
    </div>
  );
}
