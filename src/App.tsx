import { useState, useEffect } from "react";
import { Page } from "@/data/mockData";
import Sidebar from "@/components/layout/Sidebar";
import Seo from "@/components/Seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import PaymentSuccessPage from "@/components/pages/PaymentSuccessPage";
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

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Если ЮKassa вернула пользователя с ?payment=success — показываем экран благодарности
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentSuccess(true);
    }
  }, []);

  const pageMap: Record<Page, JSX.Element> = {
    dashboard: <Dashboard setPage={setPage} />,
    campaigns: <Campaigns />,
    contacts: <Contacts />,
    editor: <EmailEditor />,
    automation: <AutomationPage />,
    omnichannel: <OmnichannelPage />,
    predict: <PredictPage />,
    analytics: <Analytics />,
    integrations: <Integrations />,
    templates: <Templates setPage={setPage} />,
    pricing: <PricingPage />,
    settings: <SettingsPage />,
    api: <ApiPage />,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        page={page}
        setPage={setPage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="flex-1 overflow-y-auto relative" key={page}>
        <Seo page={page} />
        <div className="pointer-events-none fixed top-0 left-1/3 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent)" }} />
        <div className="pointer-events-none fixed bottom-0 right-1/4 w-80 h-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.12), transparent)" }} />
        <div className="relative z-10">
          {paymentSuccess ? (
            <PaymentSuccessPage setPage={(p) => { setPaymentSuccess(false); setPage(p); }} />
          ) : (
            <>
              <div className="px-6 pt-4">
                <Breadcrumbs page={page} setPage={setPage} />
              </div>
              {pageMap[page]}
            </>
          )}
        </div>
      </main>
    </div>
  );
}