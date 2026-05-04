import { COHORTS, getScoreColor, getRiskColor } from "./data";

export function TopContactsTable() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="font-bold">Лучшие контакты по ИИ-баллу</h2>
          <p className="text-xs text-muted-foreground">Балл вовлечённости, прогноз пожизненной ценности и риск ухода</p>
        </div>
        <span className="text-xs text-muted-foreground">обновлено сегодня</span>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
            <th className="text-left px-5 py-3">Контакт</th>
            <th className="text-left px-5 py-3 hidden md:table-cell">Сегмент</th>
            <th className="text-left px-5 py-3">ИИ-балл</th>
            <th className="text-left px-5 py-3 hidden lg:table-cell">Прогноз дохода</th>
            <th className="text-left px-5 py-3">Риск ухода</th>
            <th className="text-left px-5 py-3 hidden md:table-cell">Лучшее время</th>
          </tr>
        </thead>
        <tbody>
          {COHORTS.map((c, i) => (
            <tr key={i} className="border-t border-border hover:bg-white/3 transition-colors">
              <td className="px-5 py-3">
                <div className="font-medium text-sm">{c.contact}</div>
                <div className="text-xs text-muted-foreground font-mono-custom">{c.email}</div>
              </td>
              <td className="px-5 py-3 hidden md:table-cell">
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>{c.segment}</span>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: getScoreColor(c.score) }} />
                  </div>
                  <span className="font-bold text-sm" style={{ color: getScoreColor(c.score) }}>{c.score}</span>
                </div>
              </td>
              <td className="px-5 py-3 hidden lg:table-cell">
                <span className="font-mono-custom text-sm font-semibold">₽ {c.ltv.toLocaleString()}</span>
              </td>
              <td className="px-5 py-3">
                <span className="font-bold" style={{ color: getRiskColor(c.churn_risk) }}>{c.churn_risk}%</span>
              </td>
              <td className="px-5 py-3 hidden md:table-cell">
                <span className="font-mono-custom text-xs">{c.best_time}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}

export default TopContactsTable;