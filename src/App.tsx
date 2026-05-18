import { useState, useEffect, useCallback } from "react";
import { Page } from "@/data/mockData";
import Sidebar from "@/components/layout/Sidebar";
import Icon from "@/components/ui/icon";
import Footer from "@/components/layout/Footer";
import Seo from "@/components/Seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import PaymentSuccessPage from "@/components/pages/PaymentSuccessPage";
import AuthModal from "@/components/auth/AuthModal";
import EmailVerifyBanner from "@/components/auth/EmailVerifyBanner";
import EmailVerifyResult from "@/components/auth/EmailVerifyResult";
import CommandPalette from "@/components/search/CommandPalette";
import AiConsultant from "@/components/AiConsultant";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import AdminApp from "@/admin/AdminApp";
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
import MailboxStorePage from "@/components/pages/MailboxStorePage";
import PartnersPage from "@/components/pages/PartnersPage";

// Главная, страница тарифов, витрина корпоративной почты и партнёрка открыты всем
const PUBLIC_PAGES: Page[] = ["dashboard", "pricing", "mailbox", "partners"];

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
  mailbox: "корпоративной почты",
  partners: "партнёрской программы",
  settings: "настроек",
  api: "ключей программного интерфейса",
  security: "панели безопасности",
};

function isAdminUrl(): boolean {
  if (typeof window === "undefined") return false;
  const sp = new URLSearchParams(window.location.search);
  if (sp.get("admin") === "1") return true;
  const p = window.location.pathname.toLowerCase();
  if (p === "/admin" || p === "/admin/" || p.startsWith("/admin/")) return true;
  try {
    return sessionStorage.getItem("mk_admin_mode") === "1";
  } catch {
    return false;
  }
}

export default function App() {
  // Если URL содержит /admin или ?admin=1 — показываем кабинет администратора.
  // Это защита на случай, если main.tsx маршрутизация не сработала.
  if (isAdminUrl()) {
    try { sessionStorage.setItem("mk_admin_mode", "1"); } catch { /* ignore */ }
    return <AdminApp />;
  }

  return <MainApp />;
}

function MainApp() {
  const { user, initialized } = useAuth();
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    dashboard: <Dashboard setPage={guardedSetPage} onRegisterClick={() => { setAuthMode("register"); setAuthReason(undefined); setAuthOpen(true); }} />,
    campaigns: <Campaigns />,
    contacts: <Contacts />,
    editor: <EmailEditor />,
    automation: <AutomationPage />,
    omnichannel: <OmnichannelPage />,
    predict: <PredictPage />,
    analytics: <Analytics />,
    integrations: <Integrations />,
    templates: <Templates setPage={guardedSetPage} />,
    mailbox: <MailboxStorePage />,
    partners: <PartnersPage />,
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
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="flex-1 overflow-y-auto relative w-full" key={page}>
        {/* Мобильная шапка с бургером */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-secondary"
            aria-label="Открыть меню"
          >
            <Icon name="Menu" size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              <Icon name="Zap" size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm gradient-text tracking-tight">MAIL-KA</span>
          </div>
          <button
            onClick={() => setPaletteOpen(true)}
            className="p-2 -mr-2 rounded-lg hover:bg-secondary"
            aria-label="Поиск"
          >
            <Icon name="Search" size={20} />
          </button>
        </div>
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
              <div className="px-4 sm:px-6 pt-4">
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

      <AiConsultant />
      <PwaInstallPrompt />
    </div>
  );
}