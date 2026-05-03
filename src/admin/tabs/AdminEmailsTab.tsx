import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { fetchEmailLogs } from "../adminApi";

interface Row {
  id: number; to: string; subject: string; status: string;
  error: string | null; sent_at: string | null;
  opened_at: string | null; clicked_at: string | null;
  campaign_name: string | null; user_id: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  sent: "#10b981", failed: "#ef4444", pending: "#f59e0b", queued: "#94a3b8",
};

export default function AdminEmailsTab() {
  const [logs, setLogs] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchEmailLogs(200).then((r) => {
      setLogs(r.logs || []);
      setLoading(false);
    });
  }, []);

  return (
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
              <th className="text-left px-4 py-3 font-medium">Получатель</th>
              <th className="text-left px-3 py-3 font-medium">Тема / Кампания</th>
              <th className="text-center px-3 py-3 font-medium">Статус</th>
              <th className="text-center px-3 py-3 font-medium">Открыто</th>
              <th className="text-center px-3 py-3 font-medium">Клик</th>
              <th className="text-left px-3 py-3 font-medium">Время</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-white/40">
                  <Icon name="Loader2" size={18} className="animate-spin inline mr-2" /> Загрузка...
                </td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-white/40">Логов нет</td>
              </tr>
            )}
            {logs.map((r) => (
              <tr key={r.id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: "rgba(139, 92, 246, 0.08)" }}>
                <td className="px-4 py-2.5 text-xs text-white/80 font-mono">{r.to}</td>
                <td className="px-3 py-2.5">
                  <div className="text-xs text-white/80 truncate max-w-xs">{r.subject || "—"}</div>
                  {r.campaign_name && <div className="text-[10px] text-purple-300 truncate max-w-xs">{r.campaign_name}</div>}
                  {r.error && <div className="text-[10px] text-red-400 truncate max-w-xs">⚠ {r.error}</div>}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      background: `${STATUS_COLORS[r.status] || "#94a3b8"}22`,
                      color: STATUS_COLORS[r.status] || "#94a3b8",
                      border: `1px solid ${STATUS_COLORS[r.status] || "#94a3b8"}44`,
                    }}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  {r.opened_at ? <Icon name="Eye" size={13} className="text-emerald-400 inline" /> : <span className="text-white/20">—</span>}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {r.clicked_at ? <Icon name="MousePointerClick" size={13} className="text-cyan-400 inline" /> : <span className="text-white/20">—</span>}
                </td>
                <td className="px-3 py-2.5 text-[11px] text-white/50 whitespace-nowrap">
                  {r.sent_at ? new Date(r.sent_at).toLocaleString("ru") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
