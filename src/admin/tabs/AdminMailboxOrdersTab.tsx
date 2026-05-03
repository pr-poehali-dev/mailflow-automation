import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  fetchMailboxOrders, setMailboxOrderStatus, setMailboxOrderNotes, deleteMailboxOrder,
  MailboxOrderRow,
} from "../adminApi";

const STATUSES: { code: string; label: string; color: string }[] = [
  { code: "click", label: "Клик", color: "#94a3b8" },
  { code: "request", label: "Заявка", color: "#f59e0b" },
  { code: "contacted", label: "В работе", color: "#06b6d4" },
  { code: "paid", label: "Оплачено", color: "#10b981" },
  { code: "cancelled", label: "Отменено", color: "#ef4444" },
];

const PROVIDER_EMOJI: Record<string, string> = {
  beget: "📮",
  yandex360: "🟡",
  vk_workspace: "🔵",
};

const PROVIDER_NAME: Record<string, string> = {
  beget: "Beget Mail",
  yandex360: "Яндекс 360",
  vk_workspace: "VK WorkSpace",
};

function statusMeta(code: string) {
  return STATUSES.find((s) => s.code === code) || STATUSES[0];
}

export default function AdminMailboxOrdersTab() {
  const [orders, setOrders] = useState<MailboxOrderRow[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MailboxOrderRow | null>(null);

  const load = () => {
    setLoading(true);
    fetchMailboxOrders({ status: statusFilter, provider: providerFilter, search })
      .then((r) => {
        setOrders(r.orders || []);
        setStats(r.stats || {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, providerFilter, search]);

  const totalActive = useMemo(
    () => (stats.request || 0) + (stats.contacted || 0),
    [stats],
  );

  const onChangeStatus = async (id: number, newStatus: string) => {
    const r = await setMailboxOrderStatus(id, newStatus);
    if (r.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
      );
    } else {
      alert(r.error || "Ошибка смены статуса");
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm(`Удалить заявку #${id}? Это необратимо.`)) return;
    const r = await deleteMailboxOrder(id);
    if (r.ok) setOrders((prev) => prev.filter((o) => o.id !== id));
    else alert(r.error || "Ошибка удаления");
  };

  const callPhone = (phone: string) => window.open(`tel:${phone.replace(/[^0-9+]/g, "")}`);
  const sendEmail = (email: string, order: MailboxOrderRow) => {
    const subject = encodeURIComponent(
      `MAIL-KA: заявка #${order.id} на корпоративную почту (${PROVIDER_NAME[order.provider] || order.provider})`,
    );
    const body = encodeURIComponent(
      `Здравствуйте${order.contact_name ? ", " + order.contact_name : ""}!\n\n` +
      `Спасибо за заявку на подключение корпоративной почты.\n` +
      `Тариф: ${PROVIDER_NAME[order.provider] || order.provider} / ${order.plan_code || "—"}\n` +
      `Домен: ${order.domain || "не указан"}\n` +
      `Кол-во ящиков: ${order.mailboxes_count || 1}\n\n` +
      `Готов помочь с настройкой DNS-записей и подключением к рассылкам.\n\n` +
      `С уважением, команда MAIL-KA`,
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };
  const openWhatsApp = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    if (clean.length >= 10) window.open(`https://wa.me/${clean}`, "_blank");
  };
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="space-y-4">
      {/* Сводка по статусам */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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
            placeholder="Поиск по email, имени, домену..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 outline-none focus:border-purple-400/50"
          />
        </div>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 outline-none focus:border-purple-400/50"
        >
          <option value="">Все провайдеры</option>
          <option value="beget">Beget Mail</option>
          <option value="yandex360">Яндекс 360</option>
          <option value="vk_workspace">VK WorkSpace</option>
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
          Всего: <span className="text-white/70 font-semibold">{orders.length}</span>
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
                <th className="text-left px-3 py-3 font-medium">Провайдер</th>
                <th className="text-left px-3 py-3 font-medium">Контакт</th>
                <th className="text-left px-3 py-3 font-medium">Домен / Тариф</th>
                <th className="text-left px-3 py-3 font-medium">Аккаунт</th>
                <th className="text-left px-3 py-3 font-medium">Статус</th>
                <th className="text-left px-3 py-3 font-medium">Дата</th>
                <th className="text-center px-3 py-3 font-medium">Связаться</th>
                <th className="text-center px-3 py-3 font-medium">⋯</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-white/40">
                    <Icon name="Loader2" size={18} className="animate-spin inline mr-2" />
                    Загрузка...
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-white/40">
                    <Icon name="Inbox" size={28} className="inline mb-2 opacity-40" />
                    <div>Заявок нет</div>
                  </td>
                </tr>
              )}
              {orders.map((o) => {
                const meta = statusMeta(o.status);
                return (
                  <tr
                    key={o.id}
                    className="border-b hover:bg-white/[0.02]"
                    style={{ borderColor: "rgba(139, 92, 246, 0.08)" }}
                  >
                    <td className="px-3 py-2.5 text-[11px] text-white/40 font-mono">#{o.id}</td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{PROVIDER_EMOJI[o.provider] || "📧"}</span>
                        <div>
                          <div className="text-xs text-white/85 font-medium">
                            {PROVIDER_NAME[o.provider] || o.provider}
                          </div>
                          {o.plan_code && (
                            <div className="text-[10px] text-purple-300/70">{o.plan_code}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="text-xs text-white/85 font-medium">
                        {o.contact_name || "—"}
                      </div>
                      {o.contact_email && (
                        <button
                          onClick={() => copy(o.contact_email!)}
                          className="text-[11px] text-cyan-300/80 hover:text-cyan-300 font-mono"
                          title="Скопировать"
                        >
                          {o.contact_email}
                        </button>
                      )}
                      {o.contact_phone && (
                        <div className="text-[10px] text-white/50 font-mono">{o.contact_phone}</div>
                      )}
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="text-xs text-white/80 font-mono">
                        {o.domain || <span className="text-white/30">—</span>}
                      </div>
                      {o.mailboxes_count != null && (
                        <div className="text-[10px] text-white/50">
                          {o.mailboxes_count} ящ.
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2.5">
                      {o.user_email ? (
                        <>
                          <div className="text-[11px] text-white/70 font-mono">{o.user_email}</div>
                          {o.user_name && (
                            <div className="text-[10px] text-white/40">{o.user_name}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-white/30">гость</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5">
                      <select
                        value={o.status}
                        onChange={(e) => onChangeStatus(o.id, e.target.value)}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md outline-none cursor-pointer"
                        style={{
                          background: `${meta.color}22`,
                          color: meta.color,
                          border: `1px solid ${meta.color}55`,
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.code} value={s.code} style={{ color: "#000" }}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-2.5 text-[11px] text-white/50 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("ru")}
                      <div className="text-[10px] text-white/30">
                        {new Date(o.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        {o.contact_email && (
                          <button
                            onClick={() => sendEmail(o.contact_email!, o)}
                            title="Написать письмо"
                            className="p-1.5 rounded-md hover:bg-white/10 text-cyan-400"
                          >
                            <Icon name="Mail" size={13} />
                          </button>
                        )}
                        {o.contact_phone && (
                          <>
                            <button
                              onClick={() => callPhone(o.contact_phone!)}
                              title="Позвонить"
                              className="p-1.5 rounded-md hover:bg-white/10 text-emerald-400"
                            >
                              <Icon name="Phone" size={13} />
                            </button>
                            <button
                              onClick={() => openWhatsApp(o.contact_phone!)}
                              title="WhatsApp"
                              className="p-1.5 rounded-md hover:bg-white/10 text-green-400"
                            >
                              <Icon name="MessageCircle" size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditing(o)}
                          title="Заметки и детали"
                          className="p-1.5 rounded-md hover:bg-white/10 text-purple-300"
                        >
                          <Icon name="StickyNote" size={13} />
                        </button>
                        <button
                          onClick={() => onDelete(o.id)}
                          title="Удалить"
                          className="p-1.5 rounded-md hover:bg-white/10 text-red-400"
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

      {editing && (
        <NotesModal
          order={editing}
          onClose={() => setEditing(null)}
          onSaved={(notes) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === editing.id ? { ...o, notes } : o)),
            );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function NotesModal({
  order, onClose, onSaved,
}: {
  order: MailboxOrderRow;
  onClose: () => void;
  onSaved: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(order.notes || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const r = await setMailboxOrderNotes(order.id, notes);
    setSaving(false);
    if (r.ok) onSaved(notes);
    else alert(r.error || "Ошибка сохранения");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,3,8,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border p-5"
        style={{ background: "#15102a", borderColor: "rgba(139,92,246,0.3)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-base font-bold text-white">
              Заявка #{order.id} · {PROVIDER_NAME[order.provider] || order.provider}
            </div>
            <div className="text-[11px] text-white/50 mt-0.5">
              {order.contact_name || "—"} · {order.contact_email || "без email"}
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
          <Detail label="Тариф" value={order.plan_code || "—"} />
          <Detail label="Домен" value={order.domain || "—"} mono />
          <Detail label="Ящиков" value={String(order.mailboxes_count || "—")} />
          <Detail label="Телефон" value={order.contact_phone || "—"} mono />
          <Detail label="IP" value={order.ip_address || "—"} mono />
          <Detail label="Источник" value={order.utm_source || "—"} />
        </div>

        <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1.5">
          Заметка для команды
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Что обсудили, договорённости, следующие шаги..."
          className="w-full px-3 py-2 rounded-lg text-xs text-white/90 outline-none resize-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        />

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            Отмена
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
          >
            {saving ? (
              <Icon name="Loader2" size={12} className="animate-spin" />
            ) : (
              <Icon name="Save" size={12} />
            )}
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      className="rounded-lg px-2.5 py-1.5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.12)" }}
    >
      <div className="text-[9px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={`text-[11px] text-white/85 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
