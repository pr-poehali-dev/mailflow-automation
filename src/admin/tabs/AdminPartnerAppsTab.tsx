import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  fetchPartnerApps, setPartnerStatus, setPartnerNotes, deletePartnerApp,
  PartnerApplicationRow,
} from "../adminApi";

const STATUSES: { code: string; label: string; color: string }[] = [
  { code: "new", label: "Новая", color: "#f59e0b" },
  { code: "in_review", label: "На рассмотрении", color: "#06b6d4" },
  { code: "approved", label: "Одобрена", color: "#10b981" },
  { code: "active", label: "Активный", color: "#8b5cf6" },
  { code: "paused", label: "На паузе", color: "#94a3b8" },
  { code: "rejected", label: "Отклонена", color: "#ef4444" },
];

const PROGRAM_NAME: Record<string, string> = {
  referral: "Реферальная",
  agency: "Агентство",
  whitelabel: "White Label",
  tech: "Технологическая",
};

const PROGRAM_EMOJI: Record<string, string> = {
  referral: "🤝",
  agency: "🏢",
  whitelabel: "🎨",
  tech: "⚙️",
};

function statusMeta(code: string) {
  return STATUSES.find((s) => s.code === code) || STATUSES[0];
}

export default function AdminPartnerAppsTab() {
  const [apps, setApps] = useState<PartnerApplicationRow[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PartnerApplicationRow | null>(null);

  const load = () => {
    setLoading(true);
    fetchPartnerApps({ status: statusFilter, program: programFilter, search })
      .then((r) => {
        setApps(r.applications || []);
        setStats(r.stats || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, programFilter, search]);

  const totalActive = useMemo(
    () => (stats.new || 0) + (stats.in_review || 0),
    [stats],
  );

  const onChangeStatus = async (id: number, newStatus: string) => {
    const r = await setPartnerStatus(id, newStatus);
    if (r.ok) {
      setApps((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
      );
      load();
    } else {
      alert(r.error || "Ошибка смены статуса");
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm(`Удалить заявку #${id}? Это необратимо.`)) return;
    const r = await deletePartnerApp(id);
    if (r.ok) {
      setApps((prev) => prev.filter((a) => a.id !== id));
      load();
    } else {
      alert(r.error || "Ошибка удаления");
    }
  };

  const sendEmail = (a: PartnerApplicationRow) => {
    const subject = encodeURIComponent(
      `MAIL-KA: заявка №${a.id} — ${PROGRAM_NAME[a.program] || a.program}`,
    );
    const body = encodeURIComponent(
      `Здравствуйте${a.name ? ", " + a.name : ""}!\n\n` +
      `Спасибо за интерес к партнёрской программе MAIL-KA.\n` +
      `Программа: ${PROGRAM_NAME[a.program] || a.program}\n\n` +
      `Готов обсудить условия сотрудничества — напишите удобное время для созвона.\n\n` +
      `С уважением, команда MAIL-KA`,
    );
    window.open(`mailto:${a.email}?subject=${subject}&body=${body}`);
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text);

  const saveNotes = async () => {
    if (!editing) return;
    const r = await setPartnerNotes(editing.id, editing.notes || "");
    if (r.ok) {
      setApps((prev) => prev.map((a) =>
        a.id === editing.id ? { ...a, notes: editing.notes } : a
      ));
      setEditing(null);
    } else {
      alert(r.error || "Ошибка сохранения");
    }
  };

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return s;
    }
  };

  return (
    <div className="space-y-4">
      {/* Сводка по статусам */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {STATUSES.map((s) => {
          const isActive = statusFilter === s.code;
          return (
            <button
              key={s.code}
              onClick={() => setStatusFilter(isActive ? "" : s.code)}
              className="rounded-xl px-3 py-3 text-left transition-all"
              style={{
                background: isActive ? `${s.color}25` : "rgba(20, 18, 35, 0.6)",
                border: `1px solid ${isActive ? s.color : "rgba(139, 92, 246, 0.18)"}`,
              }}
            >
              <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
                {s.label}
              </div>
              <div className="text-2xl font-bold mt-0.5" style={{ color: s.color }}>
                {stats[s.code] ?? 0}
              </div>
            </button>
          );
        })}
      </div>

      {/* Фильтры */}
      <div
        className="rounded-2xl border p-3 flex flex-wrap items-center gap-2"
        style={{ background: "rgba(20, 18, 35, 0.6)", borderColor: "rgba(139, 92, 246, 0.18)" }}
      >
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по email или имени..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 outline-none focus:border-purple-400/50"
          />
        </div>

        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 outline-none focus:border-purple-400/50"
        >
          <option value="">Все программы</option>
          <option value="referral">Реферальная</option>
          <option value="agency">Агентство</option>
          <option value="whitelabel">White Label</option>
          <option value="tech">Технологическая</option>
        </select>

        <button
          onClick={load}
          className="px-3 py-2 rounded-lg text-xs text-white/80 hover:text-white flex items-center gap-1.5"
          style={{ background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)" }}
        >
          <Icon name="RefreshCw" size={12} className={loading ? "animate-spin" : ""} />
          Обновить
        </button>

        <div className="text-[11px] text-white/40 ml-auto">
          В работе: <span className="text-amber-300 font-semibold">{totalActive}</span>
          {" · "}
          Всего: <span className="text-white/70 font-semibold">{apps.length}</span>
        </div>
      </div>

      {/* Таблица */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "rgba(20, 18, 35, 0.6)", borderColor: "rgba(139, 92, 246, 0.18)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-[11px] uppercase tracking-wider text-white/40 border-b"
                style={{ borderColor: "rgba(139, 92, 246, 0.15)" }}
              >
                <th className="text-left px-3 py-3 font-medium">#</th>
                <th className="text-left px-3 py-3 font-medium">Программа</th>
                <th className="text-left px-3 py-3 font-medium">Контакт</th>
                <th className="text-left px-3 py-3 font-medium">Канал · Аудитория</th>
                <th className="text-left px-3 py-3 font-medium">Аккаунт</th>
                <th className="text-left px-3 py-3 font-medium">Статус</th>
                <th className="text-left px-3 py-3 font-medium">Дата</th>
                <th className="text-center px-3 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40">
                    <Icon name="Loader2" size={18} className="animate-spin inline mr-2" />
                    Загрузка...
                  </td>
                </tr>
              )}
              {!loading && apps.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/40">
                    <Icon name="Inbox" size={28} className="inline mb-2 opacity-40" />
                    <div>Заявок партнёров пока нет</div>
                  </td>
                </tr>
              )}
              {!loading && apps.map((a) => {
                const sm = statusMeta(a.status);
                return (
                  <tr
                    key={a.id}
                    className="border-b hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: "rgba(139, 92, 246, 0.08)" }}
                  >
                    <td className="px-3 py-3 text-white/40 font-mono text-xs">#{a.id}</td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{PROGRAM_EMOJI[a.program] || "📋"}</span>
                        <span className="text-white/80 text-xs">
                          {PROGRAM_NAME[a.program] || a.program}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 min-w-[200px]">
                      <div className="text-white/90 font-medium text-xs">{a.name || "—"}</div>
                      <button
                        onClick={() => copy(a.email)}
                        className="text-[11px] text-white/50 hover:text-cyan-300 transition-colors text-left flex items-center gap-1"
                        title="Скопировать"
                      >
                        {a.email}
                        <Icon name="Copy" size={9} />
                      </button>
                    </td>

                    <td className="px-3 py-3 max-w-[260px]">
                      {a.channel && (
                        <div className="text-[11px] text-white/70 truncate" title={a.channel}>
                          {a.channel}
                        </div>
                      )}
                      {a.audience && (
                        <div className="text-[10px] text-white/40 truncate mt-0.5" title={a.audience}>
                          {a.audience}
                        </div>
                      )}
                      {!a.channel && !a.audience && (
                        <span className="text-white/30 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-[11px] text-white/50">
                      {a.user_email ? (
                        <span className="text-emerald-300/80">✓ {a.user_email}</span>
                      ) : (
                        <span className="text-white/30">гость</span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <select
                        value={a.status}
                        onChange={(e) => onChangeStatus(a.id, e.target.value)}
                        className="px-2 py-1 rounded-md text-xs font-medium outline-none cursor-pointer border"
                        style={{
                          color: sm.color,
                          background: `${sm.color}15`,
                          borderColor: `${sm.color}40`,
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.code} value={s.code} style={{ color: "#fff", background: "#1a1730" }}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-3 text-[11px] text-white/50 whitespace-nowrap">
                      {formatDate(a.created_at)}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          onClick={() => sendEmail(a)}
                          title="Написать письмо"
                          className="p-1.5 rounded-md hover:bg-white/10 text-cyan-300 transition-colors"
                        >
                          <Icon name="Mail" size={13} />
                        </button>
                        <button
                          onClick={() => setEditing(a)}
                          title={a.notes ? "Открыть заметку" : "Добавить заметку"}
                          className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${a.notes ? "text-amber-300" : "text-white/50"}`}
                        >
                          <Icon name="StickyNote" size={13} />
                        </button>
                        <button
                          onClick={() => onDelete(a.id)}
                          title="Удалить"
                          className="p-1.5 rounded-md hover:bg-red-500/15 text-red-400/80 hover:text-red-300 transition-colors"
                        >
                          <Icon name="Trash2" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модалка заметки */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="rounded-2xl border p-5 max-w-lg w-full"
            style={{ background: "#14122a", borderColor: "rgba(139, 92, 246, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-white">Заметка к заявке №{editing.id}</h3>
                <p className="text-xs text-white/50 mt-0.5">{editing.name} · {editing.email}</p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="p-1 rounded hover:bg-white/10 text-white/50"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
            <textarea
              value={editing.notes || ""}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              placeholder="Внутренние заметки: о чём договорились, особенности, кому передать…"
              rows={6}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 outline-none focus:border-purple-400/50 resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setEditing(null)}
                className="px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={saveNotes}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
