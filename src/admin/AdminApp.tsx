import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { adminMe, AdminUser } from "./adminApi";

export default function AdminApp() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminMe().then((r) => {
      if (r.ok && r.user) setUser(r.user);
      setLoading(false);
    });
    // Установим title и lang
    document.title = "ЦУП MAIL-KA — кабинет администратора";
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

  if (!user) return <AdminLogin onSuccess={setUser} />;

  return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
}
