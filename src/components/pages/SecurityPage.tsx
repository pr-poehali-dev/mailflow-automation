import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";

const AUTH_URL = "https://functions.poehali.dev/fc6e1c96-a844-462f-bc06-93773427968f";

type Period = "24h" | "7d" | "30d";

interface Counters {
  login_success: number; login_failed: number;
  register_success: number; register_failed: number;
  logout: number; verify_success: number; verify_failed: number;
  password_changes: number;
}

interface UsersStats { total: number; verified: number; active: number; active_sessions: number; }
interface LockedAcc { id: number; email: string; failed_attempts: number; locked_until: string; }
interface SuspIp { ip: string; attempts: number; last_seen: string; }
interface TargetedEmail { email: string; attempts: number; last_seen: string; }
interface RateLimitRow { bucket: string; action: string; hits: number; }
interface AuditEvent { event: string; email: string | null; ip: string | null; success: boolean; details: string | null; created_at: string; }

interface Stats {
  period: Period;
  counters: Counters;
  users: UsersStats;
  locked_accounts: LockedAcc[];
  suspicious_ips: SuspIp[];
  targeted_emails: TargetedEmail[];
  active_rate_limits: RateLimitRow[];
  recent_events: AuditEvent[];
}

const PERIODS: { id: Period; label: string }[] = [
  { id: "24h", label: "24 часа" },
  { id: "7d",  label: "7 дней" },
  { id: "30d", label: "30 дней" },
];

const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  login:           { label: "Вход",          icon: "LogIn",      color: "#06b6d4" },
  register:        { label: "Регистрация",   icon: "UserPlus",   color: "#10b981" },
  logout:          { label: "Выход",         icon: "LogOut",     color: "#94a3b8" },
  verify_email:    { label: "Подтверждение", icon: "MailCheck",  color: "#8b5cf6" },
  verify_resend:   { label: "Повторное письмо", icon: "Send",    color: "#8b5cf6" },
  change_password: { label: "Смена пароля",  icon: "KeyRound",   color: "#f59e0b" },
  admin_unlock:    { label: "Разблокировка", icon: "Unlock",     color: "#10b981" },
};

function formatTime(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s.endsWith("Z") ? s : s + "Z");
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return s; }
}

export default function SecurityPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("24h");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = localStorage.getItem("mk_auth_token");
      if (!t) { setError("Требуется вход"); setLoading(false); return; }
      const r = await fetch(`${AUTH_URL}?action=security-stats&period=${period}`, {
        headers: { "X-Auth-Token": t },
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Не удалось загрузить");
        setStats(null);
      } else {
        setStats(data);
      }
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const handleUnlock = async (id: number) => {
    setUnlockingId(id);
    try {
      const t = localStorage.getItem("mk_auth_token");
      if (!t) return;
      await fetch(`${AUTH_URL}?action=unlock-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": t },
        body: JSON.stringify({ user_id: id }),
      });
      await load();
    } finally {
      setUnlockingId(null);
    }
  };

  // Доступ — только админу
  if (user && user.role !== "admin") {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>
            <Icon name="ShieldX" size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Раздел только для администраторов</h2>
          <p className="text-sm text-muted-foreground">
            Эта страница доступна владельцам с ролью «admin». Если вы владелец аккаунта —
            попросите назначить вашему пользователю административные права.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="fade-in-up flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="ShieldCheck" size={22} style={{ color: "#10b981" }} />
            Безопасность
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Аудит входов · подозрительные IP · блокировки · rate-limits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-xl glass">
            {PERIODS.map((p) => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p.id ? "text-white" : "text-muted-foreground hover:text-foreground"
                }`}
                style={period === p.id ? { background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" } : {}}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            className="p-2 rounded-xl glass hover:bg-white/8 transition-colors disabled:opacity-50">
            <Icon name="RotateCw" size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-3 flex items-center gap-2 text-sm"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : stats ? (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon="LogIn" color="#06b6d4" label="Успешных входов"
              value={stats.counters.login_success} />
            <StatCard icon="ShieldX" color="#ef4444" label="Неудачных попыток"
              value={stats.counters.login_failed}
              alert={stats.counters.login_failed > 20} />
            <StatCard icon="UserPlus" color="#10b981" label="Регистраций"
              value={stats.counters.register_success} />
            <StatCard icon="MailCheck" color="#8b5cf6" label="Email подтверждено"
              value={stats.counters.verify_success} />
          </div>

          {/* User stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon="Users" color="#94a3b8" label="Всего пользователей"
              value={stats.users.total} compact />
            <StatCard icon="ShieldCheck" color="#10b981" label="С подтверждённым email"
              value={`${stats.users.verified} / ${stats.users.total}`} compact />
            <StatCard icon="Activity" color="#06b6d4" label={`Активных за ${period}`}
              value={stats.users.active} compact />
            <StatCard icon="Wifi" color="#8b5cf6" label="Активных сессий"
              value={stats.users.active_sessions} compact />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Заблокированные */}
            <Card title="Заблокированные аккаунты" icon="Lock" color="#ef4444"
              subtitle="Слишком много неудачных попыток входа">
              {stats.locked_accounts.length === 0 ? (
                <EmptyMsg icon="ShieldCheck" text="Нет заблокированных аккаунтов" />
              ) : (
                <div className="divide-y divide-border/50">
                  {stats.locked_accounts.map((acc) => (
                    <div key={acc.id} className="flex items-center gap-3 py-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(239,68,68,0.15)" }}>
                        <Icon name="UserX" size={13} style={{ color: "#ef4444" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{acc.email}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {acc.failed_attempts} попыток · до {formatTime(acc.locked_until)}
                        </div>
                      </div>
                      <button onClick={() => handleUnlock(acc.id)} disabled={unlockingId === acc.id}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 disabled:opacity-50 hover:scale-[1.02] transition-transform"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                        {unlockingId === acc.id ? <Icon name="Loader2" size={10} className="animate-spin" /> : <Icon name="Unlock" size={10} />}
                        Разблокировать
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Подозрительные IP */}
            <Card title="Подозрительные IP" icon="Globe" color="#f59e0b"
              subtitle="3+ неудачных попыток входа/регистрации">
              {stats.suspicious_ips.length === 0 ? (
                <EmptyMsg icon="ShieldCheck" text="Подозрительной активности не обнаружено" />
              ) : (
                <div className="divide-y divide-border/50">
                  {stats.suspicious_ips.map((row, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(245,158,11,0.15)" }}>
                        <Icon name="MapPin" size={13} style={{ color: "#f59e0b" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono truncate">{row.ip}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {row.attempts} попыток · {formatTime(row.last_seen)}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold"
                        style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                        {row.attempts}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Email под атакой */}
            <Card title="Атакуемые email" icon="Target" color="#ec4899"
              subtitle="Аккаунты, к которым подбирают пароль">
              {stats.targeted_emails.length === 0 ? (
                <EmptyMsg icon="ShieldCheck" text="Атак на аккаунты не обнаружено" />
              ) : (
                <div className="divide-y divide-border/50">
                  {stats.targeted_emails.map((row, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(236,72,153,0.15)" }}>
                        <Icon name="AtSign" size={13} style={{ color: "#ec4899" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{row.email}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Последняя попытка: {formatTime(row.last_seen)}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold"
                        style={{ background: "rgba(236,72,153,0.15)", color: "#ec4899" }}>
                        {row.attempts}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Активные rate-limits */}
            <Card title="Активные лимиты" icon="Gauge" color="#8b5cf6"
              subtitle="Запросы за последний час по бакетам">
              {stats.active_rate_limits.length === 0 ? (
                <EmptyMsg icon="Gauge" text="Нет активных лимитов" />
              ) : (
                <div className="divide-y divide-border/50">
                  {stats.active_rate_limits.slice(0, 12).map((row, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className="text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0 font-mono"
                        style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
                        {row.action}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground truncate flex-1">{row.bucket}</div>
                      <span className="text-[10px] font-bold tabular-nums">{row.hits}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Журнал событий */}
          <Card title="Журнал событий" icon="ScrollText" color="#06b6d4"
            subtitle={`Последние ${stats.recent_events.length} записей аудита`}>
            {stats.recent_events.length === 0 ? (
              <EmptyMsg icon="Inbox" text="Событий пока нет" />
            ) : (
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                      <th className="text-left py-2 pr-3 font-medium">Событие</th>
                      <th className="text-left py-2 pr-3 font-medium">Email</th>
                      <th className="text-left py-2 pr-3 font-medium">IP</th>
                      <th className="text-left py-2 pr-3 font-medium">Статус</th>
                      <th className="text-left py-2 pr-3 font-medium">Детали</th>
                      <th className="text-right py-2 font-medium">Время</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {stats.recent_events.map((ev, i) => {
                      const meta = EVENT_LABELS[ev.event] || { label: ev.event, icon: "Circle", color: "#94a3b8" };
                      return (
                        <tr key={i} className="hover:bg-white/3">
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-1.5">
                              <Icon name={meta.icon} size={11} style={{ color: meta.color }} />
                              <span>{meta.label}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground truncate max-w-[180px]">{ev.email || "—"}</td>
                          <td className="py-2 pr-3 font-mono text-muted-foreground">{ev.ip || "—"}</td>
                          <td className="py-2 pr-3">
                            {ev.success ? (
                              <span className="inline-flex items-center gap-1" style={{ color: "#10b981" }}>
                                <Icon name="Check" size={11} />OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1" style={{ color: "#ef4444" }}>
                                <Icon name="X" size={11} />Fail
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground text-[10px] truncate max-w-[160px]">{ev.details || "—"}</td>
                          <td className="py-2 text-right text-muted-foreground tabular-nums whitespace-nowrap">{formatTime(ev.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ icon, color, label, value, alert, compact }:
  { icon: string; color: string; label: string; value: number | string; alert?: boolean; compact?: boolean; }) {
  return (
    <div className="glass rounded-2xl p-4 fade-in-up relative overflow-hidden"
      style={alert ? { border: "1px solid rgba(239,68,68,0.4)" } : {}}>
      {alert && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
          style={{ background: "#ef4444" }} />
      )}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
        style={{ background: `${color}20` }}>
        <Icon name={icon} size={15} style={{ color }} />
      </div>
      <div className={`font-bold tabular-nums ${compact ? "text-lg" : "text-2xl"}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Card({ title, icon, color, subtitle, children }:
  { title: string; icon: string; color: string; subtitle?: string; children: React.ReactNode; }) {
  return (
    <div className="glass rounded-2xl p-4 fade-in-up">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}>
          <Icon name={icon} size={13} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{title}</div>
          {subtitle && <div className="text-[10px] text-muted-foreground truncate">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyMsg({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-6 text-muted-foreground text-xs">
      <Icon name={icon} size={20} className="mx-auto mb-2 opacity-50" />
      {text}
    </div>
  );
}
