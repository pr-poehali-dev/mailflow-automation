import { REVENUE, RETENTION } from "./data";

export function RevenueAndRetention() {
  const maxRev = Math.max(...REVENUE.map((r) => r.value));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Revenue forecast */}
      <div className="lg:col-span-2 glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold">Доход от рассылок</h2>
            <p className="text-xs text-muted-foreground">Прогноз на следующий квартал</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full" style={{ background: "#8b5cf6" }} />Факт</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full opacity-50" style={{ background: "#06b6d4" }} />Прогноз</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-44">
          {REVENUE.map((r, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs font-semibold" style={{ color: i >= 4 ? "#06b6d4" : "#8b5cf6" }}>₽{r.value}K</div>
              <div className="w-full rounded-t-md chart-bar"
                style={{
                  height: `${(r.value / maxRev) * 140}px`,
                  background: i >= 4
                    ? "linear-gradient(180deg, #06b6d4, rgba(6,182,212,0.4))"
                    : "linear-gradient(180deg, #8b5cf6, rgba(139,92,246,0.4))",
                  animationDelay: `${i * 0.08}s`,
                  opacity: i >= 4 ? 0.7 : 1,
                }} />
              <span className="text-xs text-muted-foreground">{r.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cohort retention */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4">
          <h2 className="font-bold">Кривая удержания</h2>
          <p className="text-xs text-muted-foreground">Когорта · апрель 2026</p>
        </div>
        <div className="space-y-2">
          {RETENTION.slice(0, 8).map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-12 font-mono-custom">М{i}</span>
              <div className="flex-1 h-5 rounded-md bg-secondary overflow-hidden">
                <div className="h-full rounded-md flex items-center justify-end px-2 text-[10px] font-bold text-white"
                  style={{
                    width: `${v}%`,
                    background: `linear-gradient(90deg, #8b5cf6 0%, #06b6d4 ${v}%)`,
                  }}>
                  {v >= 30 && `${v}%`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RevenueAndRetention;
