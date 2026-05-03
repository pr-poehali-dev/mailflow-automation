import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { fetchAdminCampaigns } from "../adminApi";

interface Row {
  id: number; name: string; status: string; subject: string;
  sent_count: number; open_rate: number; click_rate: number;
  created_at: string; user_id: number | null; owner_email: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981", sent: "#06b6d4", draft: "#94a3b8", paused: "#f59e0b",
};

export default function AdminCampaignsTab() {
  const [campaigns, setCampaigns] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAdminCampaigns(200).then((r) => {
      setCampaigns(r.campaigns || []);
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
              <th className="text-left px-4 py-3 font-medium">Кампания</th>
              <th className="text-left px-3 py-3 font-medium">Владелец</th>
              <th className="text-center px-3 py-3 font-medium">Статус</th>
              <th className="text-right px-3 py-3 font-medium">Отправлено</th>
              <th className="text-right px-3 py-3 font-medium">Open</th>
              <th className="text-right px-3 py-3 font-medium">Click</th>
              <th className="text-left px-3 py-3 font-medium">Создано</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-white/40">
                  <Icon name="Loader2" size={18} className="animate-spin inline mr-2" /> Загрузка...
                </td>
              </tr>
            )}
            {!loading && campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-white/40">Кампаний нет</td>
              </tr>
            )}
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: "rgba(139, 92, 246, 0.08)" }}>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-[11px] text-white/50 truncate max-w-xs">{c.subject}</div>
                </td>
                <td className="px-3 py-2.5 text-xs text-white/70">
                  {c.owner_email || <span className="text-white/30">— ничейная —</span>}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1"
                    style={{
                      background: `${STATUS_COLORS[c.status] || "#94a3b8"}22`,
                      color: STATUS_COLORS[c.status] || "#94a3b8",
                      border: `1px solid ${STATUS_COLORS[c.status] || "#94a3b8"}44`,
                    }}>
                    {c.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-white/80">
                  {c.sent_count.toLocaleString("ru")}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-white/80">
                  {c.open_rate ? `${c.open_rate.toFixed(1)}%` : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-white/80">
                  {c.click_rate ? `${c.click_rate.toFixed(1)}%` : "—"}
                </td>
                <td className="px-3 py-2.5 text-[11px] text-white/50">
                  {new Date(c.created_at).toLocaleDateString("ru")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
