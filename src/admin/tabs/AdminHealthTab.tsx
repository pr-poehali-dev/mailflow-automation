import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { fetchHealth, fetchRateLimits, fetchContactsTop } from "../adminApi";

interface HealthData {
  db_size_bytes: number; db_size_mb: number;
  tables: { name: string; rows: number }[];
}
interface RateLimitRow {
  identifier: string; action: string; attempts: number;
  window_start: string; last_attempt_at: string;
}
interface TopRow {
  user_id: number; email: string; name: string;
  contacts: number; active: number;
}

export default function AdminHealthTab() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [limits, setLimits] = useState<RateLimitRow[]>([]);
  const [top, setTop] = useState<TopRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchHealth(), fetchRateLimits(), fetchContactsTop()]).then(
      ([h, l, t]) => {
        setHealth(h);
        setLimits(l.limits || []);
        setTop(t.top || []);
        setLoading(false);
      },
    );
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50 gap-2">
        <Icon name="Loader2" size={18} className="animate-spin" />
        Сбор телеметрии...
      </div>
    );
  }

  const maxRows = Math.max(...(health?.tables || []).map((t) => t.rows), 1);

  return (
    <div className="space-y-6">
      {/* DB info */}
      {health && (
        <section
          className="p-5 rounded-2xl border"
          style={{
            background: "rgba(20, 18, 35, 0.6)",
            borderColor: "rgba(139, 92, 246, 0.18)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Icon name="Database" size={15} /> База данных
            </h3>
            <div className="text-2xl font-bold gradient-text">{health.db_size_mb} MB</div>
          </div>
          <div className="space-y-2">
            {health.tables.map((t) => (
              <div key={t.name} className="flex items-center gap-3 text-sm">
                <div className="w-44 text-xs text-white/70 font-mono truncate">{t.name}</div>
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(t.rows / maxRows) * 100}%`,
                      background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
                    }}
                  />
                </div>
                <div className="w-20 text-right tabular-nums text-xs text-white/80">
                  {t.rows.toLocaleString("ru")}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Топ пользователей */}
      <section
        className="p-5 rounded-2xl border"
        style={{
          background: "rgba(20, 18, 35, 0.6)",
          borderColor: "rgba(139, 92, 246, 0.18)",
        }}
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Icon name="Trophy" size={15} /> Топ-аккаунты по контактам
        </h3>
        {top.length === 0 ? (
          <div className="py-6 text-center text-white/40 text-sm">Пока нет данных</div>
        ) : (
          <div className="space-y-1.5">
            {top.map((u, i) => (
              <div key={u.user_id} className="flex items-center gap-3 text-sm">
                <div className="w-5 text-center text-xs font-bold text-white/40">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/80 truncate">{u.name || u.email}</div>
                  <div className="text-[10px] text-white/40 truncate">{u.email}</div>
                </div>
                <div className="text-xs tabular-nums text-purple-300 font-bold">
                  {u.contacts.toLocaleString("ru")}
                </div>
                <div className="text-[10px] text-emerald-400">{u.active} active</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rate limits */}
      <section
        className="p-5 rounded-2xl border"
        style={{
          background: "rgba(20, 18, 35, 0.6)",
          borderColor: "rgba(139, 92, 246, 0.18)",
        }}
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Icon name="Gauge" size={15} /> Активные rate-limits (1 час)
        </h3>
        {limits.length === 0 ? (
          <div className="py-6 text-center text-white/40 text-sm">Подозрительной активности нет</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-white/40">
                  <th className="text-left pb-2 font-medium">Идентификатор</th>
                  <th className="text-left pb-2 font-medium">Действие</th>
                  <th className="text-right pb-2 font-medium">Попыток</th>
                  <th className="text-left pb-2 font-medium">Последняя</th>
                </tr>
              </thead>
              <tbody>
                {limits.map((l, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "rgba(139, 92, 246, 0.08)" }}>
                    <td className="py-2 text-xs text-white/80 font-mono">{l.identifier}</td>
                    <td className="py-2 text-xs text-white/70">{l.action}</td>
                    <td className="py-2 text-right tabular-nums font-bold text-amber-400">
                      {l.attempts}
                    </td>
                    <td className="py-2 text-[11px] text-white/50">
                      {new Date(l.last_attempt_at).toLocaleTimeString("ru")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
