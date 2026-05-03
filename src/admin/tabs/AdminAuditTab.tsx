import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { fetchAuditLog } from "../adminApi";

interface Row {
  id: number; user_id: number | null; email: string | null;
  action: string; success: boolean;
  ip: string | null; user_agent: string | null;
  details: string | null; created_at: string;
}

export default function AdminAuditTab() {
  const [events, setEvents] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlyFailed, setOnlyFailed] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetchAuditLog(onlyFailed, 200);
      setEvents(r.events || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyFailed]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOnlyFailed(!onlyFailed)}
          className="px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2"
          style={{
            background: onlyFailed ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.05)",
            color: onlyFailed ? "#fca5a5" : "rgba(255,255,255,0.7)",
            border: `1px solid ${onlyFailed ? "rgba(239, 68, 68, 0.3)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <Icon name="AlertTriangle" size={12} />
          Только ошибки
        </button>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
        >
          <Icon name="RefreshCw" size={14} className={loading ? "animate-spin" : ""} />
        </button>
        <span className="text-xs text-white/40 ml-auto">{events.length} записей</span>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "rgba(20, 18, 35, 0.6)",
          borderColor: "rgba(139, 92, 246, 0.18)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-white/40 border-b" style={{ borderColor: "rgba(139, 92, 246, 0.15)" }}>
                <th className="text-left px-4 py-3 font-medium">Время</th>
                <th className="text-left px-3 py-3 font-medium">Действие</th>
                <th className="text-center px-3 py-3 font-medium">Результат</th>
                <th className="text-left px-3 py-3 font-medium">Email</th>
                <th className="text-left px-3 py-3 font-medium">IP</th>
                <th className="text-left px-3 py-3 font-medium">Детали</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: "rgba(139, 92, 246, 0.08)" }}>
                  <td className="px-4 py-2.5 text-[11px] text-white/60 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString("ru")}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-white/80">{e.action}</td>
                  <td className="px-3 py-2.5 text-center">
                    {e.success ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <Icon name="Check" size={11} /> ok
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                        <Icon name="X" size={11} /> fail
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-white/70">{e.email || "—"}</td>
                  <td className="px-3 py-2.5 text-[11px] font-mono text-white/60">{e.ip || "—"}</td>
                  <td className="px-3 py-2.5 text-[11px] text-white/50 max-w-md truncate" title={e.details || ""}>
                    {e.details || ""}
                  </td>
                </tr>
              ))}
              {!loading && events.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40">Нет записей</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
