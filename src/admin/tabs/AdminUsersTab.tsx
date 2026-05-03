import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  fetchUsers, AdminUserRow, toggleUser, setUserRole,
  unlockUser, revokeSessions,
} from "../adminApi";

export default function AdminUsersTab() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetchUsers(search);
      setUsers(r.users || []);
      setTotal(r.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const action = async (uid: number, fn: () => Promise<unknown>) => {
    setBusy(uid);
    try {
      await fn();
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по email или имени..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400"
          />
        </div>
        <div className="text-xs text-white/50">
          Найдено: <span className="font-bold text-white">{total}</span>
        </div>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "rgba(20, 18, 35, 0.6)",
          borderColor: "rgba(139, 92, 246, 0.18)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-white/40 border-b" style={{ borderColor: "rgba(139, 92, 246, 0.15)" }}>
                <th className="text-left px-4 py-3 font-medium">Пользователь</th>
                <th className="text-left px-3 py-3 font-medium">Роль</th>
                <th className="text-left px-3 py-3 font-medium">Статус</th>
                <th className="text-right px-3 py-3 font-medium">Контакты</th>
                <th className="text-right px-3 py-3 font-medium">Кампании</th>
                <th className="text-right px-3 py-3 font-medium">Сессии</th>
                <th className="text-left px-3 py-3 font-medium">Последний вход</th>
                <th className="text-right px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40">
                    <Icon name="Loader2" size={18} className="animate-spin inline mr-2" />
                    Загрузка...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40">
                    Пользователи не найдены
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: "rgba(139, 92, 246, 0.08)" }}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{u.name || "—"}</div>
                    <div className="text-[11px] text-white/50">{u.email}</div>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => action(u.id, () => setUserRole(u.id, e.target.value))}
                      disabled={busy === u.id}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer hover:bg-white/10"
                    >
                      <option value="user" className="bg-zinc-900">user</option>
                      <option value="manager" className="bg-zinc-900">manager</option>
                      <option value="admin" className="bg-zinc-900">admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-1 w-fit
                        ${u.is_active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"}`}>
                        <span className={`w-1 h-1 rounded-full ${u.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                        {u.is_active ? "active" : "banned"}
                      </span>
                      {u.is_email_verified ? (
                        <span className="text-[10px] text-cyan-400">✓ email</span>
                      ) : (
                        <span className="text-[10px] text-amber-400">! не подтв.</span>
                      )}
                      {u.locked_until && new Date(u.locked_until) > new Date() && (
                        <span className="text-[10px] text-red-400">🔒 locked</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-white/80">{u.contacts}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-white/80">{u.campaigns}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-white/80">{u.sessions}</td>
                  <td className="px-3 py-3 text-[11px] text-white/50">
                    {u.last_login_at ? (
                      <>
                        <div>{new Date(u.last_login_at).toLocaleDateString("ru")}</div>
                        <div className="text-white/30">{u.last_login_ip || ""}</div>
                      </>
                    ) : "никогда"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {u.locked_until && new Date(u.locked_until) > new Date() && (
                        <button
                          onClick={() => action(u.id, () => unlockUser(u.id))}
                          disabled={busy === u.id}
                          title="Снять блокировку"
                          className="p-1.5 rounded-lg hover:bg-amber-500/15 text-amber-400 transition-colors"
                        >
                          <Icon name="Unlock" size={13} />
                        </button>
                      )}
                      {u.sessions > 0 && (
                        <button
                          onClick={() => action(u.id, () => revokeSessions(u.id))}
                          disabled={busy === u.id}
                          title="Завершить все сессии"
                          className="p-1.5 rounded-lg hover:bg-orange-500/15 text-orange-400 transition-colors"
                        >
                          <Icon name="LogOut" size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => action(u.id, () => toggleUser(u.id, !u.is_active))}
                        disabled={busy === u.id}
                        title={u.is_active ? "Заблокировать" : "Активировать"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.is_active
                            ? "hover:bg-red-500/15 text-red-400"
                            : "hover:bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        <Icon name={u.is_active ? "Ban" : "CheckCircle"} size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
