import { chartData } from "@/data/mockData";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Активна", cls: "status-active" },
    sent: { label: "Отправлена", cls: "status-sent" },
    paused: { label: "Пауза", cls: "status-paused" },
    draft: { label: "Черновик", cls: "status-draft" },
    connected: { label: "Подключено", cls: "status-active" },
    disconnected: { label: "Не подключено", cls: "status-draft" },
    unsubscribed: { label: "Отписан", cls: "status-paused" },
  };
  const s = map[status] ?? { label: status, cls: "status-draft" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function MiniChart() {
  const maxVal = Math.max(...chartData.map((d) => d.opens));
  return (
    <div className="flex items-end gap-1.5 h-16">
      {chartData.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="relative w-full flex flex-col gap-0.5 items-center" style={{ height: 52 }}>
            <div
              className="w-full rounded-sm chart-bar"
              style={{
                height: `${(d.opens / maxVal) * 100}%`,
                background: "linear-gradient(180deg, rgba(168,85,247,0.8) 0%, rgba(168,85,247,0.3) 100%)",
                animationDelay: `${i * 0.08}s`,
              }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground">{d.day}</span>
        </div>
      ))}
    </div>
  );
}
