import Icon from "@/components/ui/icon";
import { ContactScore } from "@/api/pro";
import { getScoreColor, getRiskColor } from "./data";

interface Props {
  contacts: ContactScore[];
}

// Прогноз LTV для контакта: чем выше score, тем выше предполагаемый доход
function predictLtv(score: number): number {
  const base = 5000;
  return Math.round(base * (score / 100) * 12);
}

// Риск ухода: инверсия скоринга
function predictChurn(score: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - score)));
}

// Лучшее время отправки: на основе типового окна по сегменту
function bestTime(segment: string | null): string {
  const map: Record<string, string> = {
    VIP: "10:00",
    Активный: "11:30",
    Новый: "14:00",
    Спящий: "19:30",
  };
  return map[segment || ""] || "12:00";
}

export function TopContactsTable({ contacts }: Props) {
  const top = [...contacts].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 10);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="font-bold">Лучшие контакты по ИИ-баллу</h2>
          <p className="text-xs text-muted-foreground">Балл вовлечённости, прогноз пожизненной ценности и риск ухода</p>
        </div>
        <span className="text-xs text-muted-foreground">{contacts.length > 0 ? `${contacts.length} контактов` : ""}</span>
      </div>

      {top.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
          <Icon name="Users" size={28} className="opacity-30" />
          <div>Пока нет контактов с достаточной активностью</div>
          <div className="text-xs">Запусти рассылку — алгоритм начнёт собирать данные</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
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
              {top.map((c) => {
                const score = c.score ?? 50;
                const ltv = predictLtv(score);
                const churn = predictChurn(score);
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-sm">{c.name || "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono-custom">{c.email}</div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
                        {c.segment || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${score}%`, background: getScoreColor(score) }} />
                        </div>
                        <span className="font-bold text-sm" style={{ color: getScoreColor(score) }}>{score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="font-mono-custom text-sm font-semibold">₽ {ltv.toLocaleString("ru-RU")}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold" style={{ color: getRiskColor(churn) }}>{churn}%</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="font-mono-custom text-xs">{bestTime(c.segment)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TopContactsTable;
