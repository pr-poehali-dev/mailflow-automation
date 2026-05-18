import Icon from "@/components/ui/icon";
import { Trigger, fmtDate } from "./endpoints";

interface Props {
  triggers: Trigger[];
}

export default function ApiTriggersTab({ triggers }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)" }}>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Триггеры позволяют автоматически запускать кампании по событиям из внешних систем.
          Создай правило здесь, а затем отправляй события через <code className="font-mono-custom text-purple-400">POST ?resource=trigger {"{"}"event":"purchase"{"}"}</code>.
        </p>
      </div>

      {triggers.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Icon name="Zap" size={28} className="opacity-30" />
          <div className="text-sm">Триггеров пока нет</div>
          <div className="text-xs">Создай триггер через API: <code className="font-mono-custom" style={{ color: "#8b5cf6" }}>POST ?resource=triggers</code></div>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="text-left px-5 py-3">Событие</th>
                <th className="text-left px-5 py-3">Кампания</th>
                <th className="text-left px-5 py-3">Статус</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Создан</th>
              </tr>
            </thead>
            <tbody>
              {triggers.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <code className="font-mono-custom text-xs" style={{ color: "#8b5cf6" }}>{t.event_name}</code>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{t.campaign_name || `#${t.campaign_id}`}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_active ? "bg-green-500/15 text-green-400" : "bg-white/10 text-muted-foreground"}`}>
                      {t.is_active ? "Активен" : "Отключён"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs hidden md:table-cell">{fmtDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
