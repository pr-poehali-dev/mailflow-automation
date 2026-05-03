import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { adminMe, AdminUser } from "./adminApi";

export default function AdminApp() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState<string>("");

  useEffect(() => {
    console.log("[ЦУП] AdminApp mounted, path=", window.location.pathname);
    document.title = "ЦУП MAIL-KA — кабинет администратора";
    adminMe()
      .then((r) => {
        console.log("[ЦУП] adminMe result", r);
        if (r.ok && r.user) {
          setUser(r.user);
          setDebug(`OK: вошли как ${r.user.email} (${r.user.role})`);
        } else {
          setDebug("Нет токена / не админ — показываем форму входа");
        }
      })
      .catch((e) => {
        console.error("[ЦУП] adminMe error", e);
        setDebug(`Ошибка: ${e?.message || e}`);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a0612" }}
      >
        <div className="flex items-center gap-3 text-white/60">
          <Icon name="Loader2" size={20} className="animate-spin" />
          <span className="text-sm">Подключение к ЦУП...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AdminLogin onSuccess={setUser} />
        {debug && (
          <div
            style={{
              position: "fixed",
              bottom: 8,
              left: 8,
              right: 8,
              zIndex: 9999,
              padding: "8px 12px",
              background: "rgba(0,0,0,0.85)",
              color: "#fbbf24",
              fontSize: 11,
              fontFamily: "monospace",
              borderRadius: 6,
              border: "1px solid rgba(251,191,36,0.4)",
              textAlign: "center",
            }}
          >
            DEBUG: {debug}
          </div>
        )}
      </>
    );
  }

  return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
}