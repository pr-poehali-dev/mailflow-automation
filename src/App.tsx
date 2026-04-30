import { useState } from "react";
import { Page } from "@/data/mockData";
import Sidebar from "@/components/layout/Sidebar";
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

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const pageMap: Record<Page, JSX.Element> = {
    dashboard: <Dashboard setPage={setPage} />,
    campaigns: <Campaigns />,
    contacts: <Contacts />,
    editor: <EmailEditor />,
    analytics: <Analytics />,
    integrations: <Integrations />,
    templates: <Templates setPage={setPage} />,
    settings: <SettingsPage />,
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
        <div className="pointer-events-none fixed top-0 left-1/3 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
        <div className="pointer-events-none fixed bottom-0 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }} />
        <div className="relative z-10">
          {pageMap[page]}
        </div>
      </main>
    </div>
  );
}
