import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

const AUTH_URL = "https://functions.poehali.dev/fc6e1c96-a844-462f-bc06-93773427968f";
const TOKEN_KEY = "mk_auth_token";
const CSRF_KEY = "mk_csrf_token";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_email_verified?: boolean;
  last_login_at?: string | null;
  created_at?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
    consents?: { offer: boolean; privacy: boolean; marketing?: boolean },
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  verifyEmail: (token: string) => Promise<{ ok: boolean; error?: string }>;
  resendVerification: () => Promise<{ ok: boolean; error?: string }>;
  refreshMe: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const getToken = () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  };
  const getCsrf = () => {
    try { return localStorage.getItem(CSRF_KEY); } catch { return null; }
  };
  const setTokens = (t: string | null, c: string | null) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
      if (c) localStorage.setItem(CSRF_KEY, c); else localStorage.removeItem(CSRF_KEY);
    } catch {
      /* storage unavailable */
    }
  };

  const authFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    const t = getToken();
    const c = getCsrf();
    if (t) headers.set("X-Auth-Token", t);
    if (c) headers.set("X-CSRF-Token", c);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetch(url, { ...init, headers });
  }, []);

  const fetchMe = useCallback(async () => {
    const t = getToken();
    if (!t) return null;
    try {
      const res = await fetch(`${AUTH_URL}?action=me`, {
        headers: { "X-Auth-Token": t },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user as AuthUser;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const u = await fetchMe();
      if (u) setUser(u);
      else setTokens(null, null);
      setInitialized(true);
    })();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Ошибка входа" };
      setTokens(data.token, data.csrf_token);
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Сетевая ошибка" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    consents: { offer: boolean; privacy: boolean; marketing?: boolean } = { offer: true, privacy: true },
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          accept_offer: consents.offer,
          accept_privacy: consents.privacy,
          accept_marketing: consents.marketing ?? false,
          docs_version: "1.0",
        }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Ошибка регистрации" };
      setTokens(data.token, data.csrf_token);
      setUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, error: "Сетевая ошибка" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const t = getToken();
    if (t) {
      try {
        await fetch(`${AUTH_URL}?action=logout`, {
          method: "POST",
          headers: { "X-Auth-Token": t },
        });
      } catch {
        /* network */
      }
    }
    setTokens(null, null);
    setUser(null);
  };

  const refreshMe = useCallback(async () => {
    const u = await fetchMe();
    if (u) setUser(u);
  }, [fetchMe]);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${AUTH_URL}?action=verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Не удалось подтвердить" };
      // Если пользователь авторизован — обновим его данные
      await refreshMe();
      return { ok: true };
    } catch {
      return { ok: false, error: "Сетевая ошибка" };
    }
  }, [refreshMe]);

  const resendVerification = useCallback(async () => {
    const t = getToken();
    if (!t) return { ok: false, error: "Нужно войти в аккаунт" };
    try {
      const res = await fetch(`${AUTH_URL}?action=resend-verification`, {
        method: "POST",
        headers: { "X-Auth-Token": t, "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Не удалось отправить" };
      return { ok: true };
    } catch {
      return { ok: false, error: "Сетевая ошибка" };
    }
  }, []);

  return (
    <Ctx.Provider value={{
      user, loading, initialized, login, register, logout, authFetch,
      verifyEmail, resendVerification, refreshMe,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export default AuthProvider;