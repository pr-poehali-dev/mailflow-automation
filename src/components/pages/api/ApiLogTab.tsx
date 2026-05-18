import Icon from "@/components/ui/icon";
import { ApiEvent, fmtDate } from "./endpoints";

interface Props {
  events: ApiEvent[];
  reload: () => void;
}

export default function ApiLogTab({ events, reload }: Props) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="font-semibold text-sm">Последние 100 вызовов</div>
        <button onClick={reload} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <Icon name="RefreshCw" size={12} />
          Обновить
        </button>
      </div>
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Icon name="Activity" size={28} className="opacity-30" />
          <div className="text-sm">Вызовов пока не было</div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {events.map((e) => (
            <div key={e.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${e.status === "ok" ? "bg-green-400" : "bg-red-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono-custom text-xs font-semibold" style={{ color: "#8b5cf6" }}>{e.event_type}</span>
                  {e.key_name && <span className="text-xs text-muted-foreground">· {e.key_name}</span>}
                  {e.error && <span className="text-xs text-red-400">{e.error}</span>}
                </div>
                {e.payload && (
                  <div className="text-xs text-muted-foreground font-mono-custom mt-0.5 truncate">
                    {JSON.stringify(e.payload).slice(0, 120)}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0">{fmtDate(e.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
