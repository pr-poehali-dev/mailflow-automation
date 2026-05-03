import Icon from "@/components/ui/icon";
import { MailboxOrder } from "@/api/mailbox";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    click: { color: "#94a3b8", label: "Клик" },
    request: { color: "#f59e0b", label: "Заявка" },
    contacted: { color: "#06b6d4", label: "В работе" },
    paid: { color: "#10b981", label: "Оплачено" },
    cancelled: { color: "#ef4444", label: "Отменено" },
  };
  const s = map[status] || map.click;
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
      style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}
    >
      {s.label}
    </span>
  );
}

interface Props {
  orders: MailboxOrder[];
}

export default function MyOrdersList({ orders }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Icon name="Inbox" size={15} className="text-purple-400" />
        Мои заявки на почту ({orders.length})
      </h2>
      <div className="space-y-1.5">
        {orders.slice(0, 5).map((o) => (
          <div key={o.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-border last:border-0">
            <span className="text-xs font-mono text-muted-foreground w-6">#{o.id}</span>
            <span className="font-medium flex-1">{o.provider}</span>
            <span className="text-xs text-muted-foreground">{o.plan_code || "—"}</span>
            <StatusBadge status={o.status} />
            <span className="text-[11px] text-muted-foreground">
              {new Date(o.created_at).toLocaleDateString("ru")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
