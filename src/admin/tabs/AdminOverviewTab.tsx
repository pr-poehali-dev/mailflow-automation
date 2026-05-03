import Icon from "@/components/ui/icon";
import { OverviewData } from "../adminApi";

interface Props {
  data: OverviewData | null;
  loading: boolean;
}

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div
      className="p-4 rounded-2xl border"
      style={{
        background: "rgba(20, 18, 35, 0.6)",
        borderColor: "rgba(139, 92, 246, 0.18)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}22`, border: `1px solid ${color}44` }}
        >
          <Icon name={icon} size={16} style={{ color }} />
        </div>
        {sub && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md text-white/60"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            {sub}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-white/50 mt-0.5">{label}</div>
    </div>
  );
}

export default function AdminOverviewTab({ data, loading }: Props) {
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50 gap-2">
        <Icon name="Loader2" size={18} className="animate-spin" />
        Загрузка телеметрии...
      </div>
    );
  }
  if (!data) return null;

  const maxReg = Math.max(...data.registrations.map((r) => r.count), 1);

  return (
    <div className="space-y-6">
      {/* Пользователи */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Пользователи</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon="Users" label="Всего" value={data.users.total.toLocaleString("ru")} color="#8b5cf6" />
          <StatCard icon="UserCheck" label="Активных" value={data.users.active} color="#10b981" />
          <StatCard icon="MailCheck" label="Email подтверждён" value={data.users.verified} color="#06b6d4" />
          <StatCard icon="UserPlus" label="Новых за неделю" value={data.users.new_week} sub={`+${data.users.new_today} сегодня`} color="#f59e0b" />
          <StatCard icon="Lock" label="Заблокировано" value={data.users.locked} color="#ef4444" />
          <StatCard icon="Wifi" label="Сессий онлайн" value={data.users.sessions_active} color="#06b6d4" />
        </div>
      </section>

      {/* Данные */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Данные системы</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon="Contact" label="Контактов" value={data.data.contacts.toLocaleString("ru")} color="#10b981" />
          <StatCard icon="Mail" label="Кампаний" value={data.data.campaigns.toLocaleString("ru")} color="#8b5cf6" />
          <StatCard icon="Send" label="Писем отправлено" value={data.data.emails_total.toLocaleString("ru")} sub={`${data.data.emails_today} сегодня`} color="#06b6d4" />
          <StatCard icon="Key" label="API-ключей" value={data.data.api_keys_active} color="#f59e0b" />
          <StatCard icon="Ban" label="Suppressions" value={data.data.suppressions} color="#ef4444" />
          <StatCard icon="ShieldAlert" label="Failed login 24ч" value={data.security.failed_logins_24h} color="#ef4444" />
        </div>
      </section>

      {/* График регистраций */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Регистрации за 14 дней</h2>
        <div
          className="p-5 rounded-2xl border"
          style={{
            background: "rgba(20, 18, 35, 0.6)",
            borderColor: "rgba(139, 92, 246, 0.18)",
            backdropFilter: "blur(8px)",
          }}
        >
          {data.registrations.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-sm">Нет регистраций за этот период</div>
          ) : (
            <div className="flex items-end justify-between gap-2 h-40">
              {data.registrations.map((r, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.count}
                  </div>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${(r.count / maxReg) * 100}%`,
                      minHeight: "4px",
                      background: "linear-gradient(180deg, #8b5cf6, #06b6d4)",
                    }}
                  />
                  <div className="text-[9px] text-white/40">
                    {new Date(r.date).toLocaleDateString("ru", { day: "2-digit", month: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Активность */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Активность за 24 часа</h2>
        <div
          className="p-5 rounded-2xl border"
          style={{
            background: "rgba(20, 18, 35, 0.6)",
            borderColor: "rgba(139, 92, 246, 0.18)",
            backdropFilter: "blur(8px)",
          }}
        >
          {data.activity.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-sm">Активности нет</div>
          ) : (
            <div className="space-y-1.5">
              {data.activity.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-white/80 font-mono text-xs">{a.action}</span>
                  <span className="text-white/60 font-bold tabular-nums">{a.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
