import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { fetchOverview, OverviewData, adminLogout, AdminUser } from "./adminApi";
import AdminUsersTab from "./tabs/AdminUsersTab";
import AdminAuditTab from "./tabs/AdminAuditTab";
import AdminCampaignsTab from "./tabs/AdminCampaignsTab";
import AdminEmailsTab from "./tabs/AdminEmailsTab";
import AdminHealthTab from "./tabs/AdminHealthTab";
import AdminOverviewTab from "./tabs/AdminOverviewTab";

interface Props {
  user: AdminUser;
  onLogout: () => void;
}

type Tab = "overview" | "users" | "audit" | "campaigns" | "emails" | "health";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
  { id: "users", label: "Пользователи", icon: "Users" },
  { id: "audit", label: "Аудит входов", icon: "ScrollText" },
  { id: "campaigns", label: "Все кампании", icon: "Mail" },
  { id: "emails", label: "Логи писем", icon: "Send" },
  { id: "health", label: "Здоровье БД", icon: "Activity" },
];

export default function AdminDashboard({ user, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const o = await fetchOverview();
      setOverview(o);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    const id = setInterval(reload, 30000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    onLogout();
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: "radial-gradient(ellipse at top left, #15102a 0%, #0a0612 60%, #050308 100%)",
        color: "#e7e3f5",
      }}
    >
      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col border-r"
        style={{
          background: "rgba(15, 12, 28, 0.85)",
          borderColor: "rgba(139, 92, 246, 0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(139, 92, 246, 0.15)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                boxShadow: "0 4px 16px rgba(139, 92, 246, 0.4)",
              }}
            >
              <Icon name="ShieldCheck" size={17} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">ЦУП</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">MAIL-KA admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: tab === t.id ? "linear-gradient(135deg, rgba(139,92,246,0.22), rgba(6,182,212,0.12))" : "transparent",
                color: tab === t.id ? "#e9d5ff" : "rgba(231, 227, 245, 0.65)",
                fontWeight: tab === t.id ? 600 : 400,
                borderLeft: tab === t.id ? "2px solid #8b5cf6" : "2px solid transparent",
              }}
            >
              <Icon name={t.icon} size={16} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: "rgba(139, 92, 246, 0.15)" }}>
          <div className="flex items-center gap-2.5 mb-2.5 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #ef4444, #f59e0b)" }}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate text-white">{user.name || "Admin"}</div>
              <div className="text-[10px] text-white/50 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <Icon name="LogOut" size={12} />
            Выйти из ЦУП
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header
          className="sticky top-0 z-10 px-6 py-3 border-b flex items-center justify-between backdrop-blur"
          style={{
            background: "rgba(15, 12, 28, 0.7)",
            borderColor: "rgba(139, 92, 246, 0.15)",
          }}
        >
          <div className="flex items-center gap-3">
            <Icon name={TABS.find((t) => t.id === tab)?.icon || "LayoutDashboard"} size={18} className="text-purple-300" />
            <h1 className="text-base font-semibold text-white">
              {TABS.find((t) => t.id === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live
            </div>
            <button
              onClick={reload}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors"
              title="Обновить"
            >
              <Icon name="RefreshCw" size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <div className="p-6">
          {tab === "overview" && <AdminOverviewTab data={overview} loading={loading} />}
          {tab === "users" && <AdminUsersTab />}
          {tab === "audit" && <AdminAuditTab />}
          {tab === "campaigns" && <AdminCampaignsTab />}
          {tab === "emails" && <AdminEmailsTab />}
          {tab === "health" && <AdminHealthTab />}
        </div>
      </main>
    </div>
  );
}
