import Icon from "@/components/ui/icon";

export function BestSendTime() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold flex items-center gap-2">
            <Icon name="Clock" size={16} style={{ color: "#06b6d4" }} />
            Лучшее время отправки (ИИ)
          </h2>
          <p className="text-xs text-muted-foreground">Для каждого контакта свой идеальный час — открываемость растёт в 2-3 раза</p>
        </div>
        <button className="text-xs px-3 py-1.5 rounded-lg font-medium glass hover:bg-white/8 flex items-center gap-1">
          <Icon name="Zap" size={11} />Включить для всех
        </button>
      </div>
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: 24 }).map((_, hour) => {
          const intensity = hour >= 9 && hour <= 11 ? 0.95 :
                            hour >= 14 && hour <= 16 ? 0.85 :
                            hour >= 19 && hour <= 21 ? 0.78 :
                            hour >= 7 && hour <= 8 ? 0.5 : 0.2;
          return (
            <div key={hour} className="flex flex-col items-center gap-1">
              <div className="w-full h-12 rounded-md transition-all hover:scale-110 cursor-pointer"
                style={{ background: `linear-gradient(180deg, rgba(139,92,246,${intensity}), rgba(6,182,212,${intensity * 0.5}))` }}
                title={`${hour}:00 — ${Math.round(intensity * 100)}% активность`} />
              <span className="text-[9px] text-muted-foreground">{hour}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BestSendTime;
