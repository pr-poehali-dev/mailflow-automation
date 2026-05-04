import Icon from "@/components/ui/icon";
import { Channel } from "./channels";

interface Props {
  channels: Channel[];
}

export function ChannelsGrid({ channels }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {channels.map((c) => (
        <div key={c.id} className="glass rounded-2xl p-4 metric-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 blur-2xl rounded-full"
            style={{ background: c.color }} />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${c.color}15`, border: `1px solid ${c.color}30` }}>
                <Icon name={c.icon} size={18} style={{ color: c.color }} />
              </div>
              {c.connected ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Активен
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">скоро</span>
              )}
            </div>
            <div className="font-bold text-base">{c.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.desc}</div>

            <div className="grid grid-cols-2 gap-2 mt-3 py-2 border-t border-b border-border">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Доставка</div>
                <div className="text-sm font-semibold font-mono-custom">{c.delivery_rate}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Цена</div>
                <div className="text-sm font-semibold font-mono-custom">{c.cost_per_msg}</div>
              </div>
            </div>

            <div className="mt-2 space-y-0.5">
              {c.features.slice(0, 3).map((f, i) => (
                <div key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Icon name="Check" size={10} style={{ color: c.color }} />
                  {f}
                </div>
              ))}
            </div>

            <button className={`w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              c.connected ? "glass hover:bg-white/8 text-foreground" : "text-white"
            }`}
              style={!c.connected ? { background: `linear-gradient(135deg, ${c.color}, ${c.color}aa)` } : {}}>
              {c.connected ? "Настроить" : "Подключить"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChannelsGrid;