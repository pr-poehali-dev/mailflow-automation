import { useState, useEffect, useCallback } from "react";
import { Page } from "@/data/mockData";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import Seo from "@/components/Seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import PaymentSuccessPage from "@/components/pages/PaymentSuccessPage";
import AuthModal from "@/components/auth/AuthModal";
import EmailVerifyBanner from "@/components/auth/EmailVerifyBanner";
import EmailVerifyResult from "@/components/auth/EmailVerifyResult";
import CommandPalette from "@/components/search/CommandPalette";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dashboard,
  Campaigns,
  Contacts,
  EmailEditor,
  Analytics,
  Integrations,
  Templates,
  SettingsPage,
} from "@/components/pages/Pages";
import { ApiPage } from "@/components/pages/ApiPage";
import AutomationPage from "@/components/pages/AutomationPage";
import OmnichannelPage from "@/components/pages/OmnichannelPage";
import PredictPage from "@/components/pages/PredictPage";
import PricingPage from "@/components/pages/PricingPage";
import SecurityPage from "@/components/pages/SecurityPage";

// Главная и страница тарифов открыты всем — остальные требуют регистрацию
const PUBLIC_PAGES: Page[] = ["dashboard", "pricing"];

const PAGE_LABELS: Partial<Record<Page, string>> = {
  campaigns: "рассылок",
  contacts: "базы контактов",
  editor: "редактора писем",
  automation: "автоматизаций",
  omnichannel: "мультиканальных рассылок",
  predict: "ИИ-прогноза",
  analytics: "аналитики",
  integrations: "интеграций",
  templates: "шаблонов",
  settings: "настроек",
  api: "ключей программного интерфейса",
  security: "панели безопасности",
};

export default function App() {
  const { user, initialized } = useAuth();
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>();
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Глобальный хоткей Cmd+K / Ctrl+K — открыть поиск
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Обработка возврата с ЮKassa и ссылки подтверждения email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentSuccess(true);
    }
    const vt = params.get("verify_email");
    if (vt) {
      setVerifyToken(vt);
      // Чистим URL чтобы при F5 не повторяться
      const url = new URL(window.location.href);
      url.searchParams.delete("verify_email");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // Защита переходов: незалогиненный — может только на public страницы
  const guardedSetPage = useCallback((target: Page) => {
    if (!user && !PUBLIC_PAGES.includes(target)) {
      setAuthReason(`Создайте аккаунт, чтобы открыть раздел ${PAGE_LABELS[target] || ""}`.trim());
      setAuthMode("register");
      setAuthOpen(true);
      return;
    }
    setPage(target);
  }, [user]);

  // Если юзер залогинился — закрываем модалку и пускаем на страницу
  useEffect(() => {
    if (user && authOpen) setAuthOpen(false);
  }, [user, authOpen]);

  // Если разлогинился, находясь на приватной странице — на главную
  useEffect(() => {
    if (initialized && !user && !PUBLIC_PAGES.includes(page)) {
      setPage("dashboard");
    }
  }, [user, initialized, page]);

  const pageMap: Record<Page, JSX.Element> = {
    dashboard: <Dashboard setPage={guardedSetPage} />,
    campaigns: <Campaigns />,
    contacts: <Contacts />,
    editor: <EmailEditor />,
    automation: <AutomationPage />,
    omnichannel: <OmnichannelPage />,
    predict: <PredictPage />,
    analytics: <Analytics />,
    integrations: <Integrations />,
    templates: <Templates setPage={guardedSetPage} />,
    pricing: <PricingPage />,
    settings: <SettingsPage />,
    api: <ApiPage />,
    security: <SecurityPage />,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        page={page}
        setPage={guardedSetPage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLoginClick={() => { setAuthMode("login"); setAuthReason(undefined); setAuthOpen(true); }}
        onRegisterClick={() => { setAuthMode("register"); setAuthReason(undefined); setAuthOpen(true); }}
        onSearchClick={() => setPaletteOpen(true)}
      />

      <main className="flex-1 overflow-y-auto relative" key={page}>
        <Seo page={page} />
        <div className="pointer-events-none fixed top-0 left-1/3 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent)" }} />
        <div className="pointer-events-none fixed bottom-0 right-1/4 w-80 h-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.12), transparent)" }} />
        <div className="relative z-10">
          {verifyToken ? (
            <EmailVerifyResult token={verifyToken} onClose={() => setVerifyToken(null)} />
          ) : paymentSuccess ? (
            <PaymentSuccessPage setPage={(p) => { setPaymentSuccess(false); guardedSetPage(p); }} />
          ) : (
            <>
              <EmailVerifyBanner />
              <div className="px-6 pt-4">
                <Breadcrumbs page={page} setPage={guardedSetPage} />
              </div>
              {pageMap[page]}
              <Footer setPage={guardedSetPage} />
            </>
          )}
        </div>
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        reason={authReason}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        setPage={guardedSetPage}
      />
    </div>
  );
}