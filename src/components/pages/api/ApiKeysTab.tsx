import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ApiKey, BASE_URL, fmtDate } from "./endpoints";

interface Props {
  keys: ApiKey[];
  reload: () => void;
  copiedId: number | null;
  onCopy: (text: string, id: number) => void;
}

export default function ApiKeysTab({ keys, reload, copiedId, onCopy }: Props) {
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setLoading(true);
    const r = await fetch(`${BASE_URL}?resource=keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName }),
    });
    const d = await r.json();
    setCreatedKey(d.key || null);
    setNewKeyName("");
    setLoading(false);
    reload();
  };

  const handleToggleKey = async (id: number, is_active: boolean) => {
    await fetch(`${BASE_URL}?resource=keys&id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !is_active }),
    });
    reload();
  };

  return (
    <div className="space-y-4">
      {/* Create */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="text-sm font-semibold">Создать новый ключ</div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
            placeholder="Название ключа (например: amoCRM prod)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
          />
          <button
            onClick={handleCreateKey}
            disabled={loading || !newKeyName.trim()}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <Icon name="Plus" size={14} />
            {loading ? "..." : "Создать"}
          </button>
        </div>

        {createdKey && (
          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)" }}>
            <div className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5">
              <Icon name="AlertTriangle" size={13} />
              Сохрани ключ — он показывается только один раз!
            </div>
            <div className="flex items-center gap-2">
              <code className="font-mono-custom text-xs flex-1 break-all" style={{ color: "#8b5cf6" }}>{createdKey}</code>
              <button onClick={() => onCopy(createdKey, 0)} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                <Icon name={copiedId === 0 ? "Check" : "Copy"} size={14} />
              </button>
            </div>
            <button onClick={() => setCreatedKey(null)} className="text-xs text-muted-foreground hover:text-foreground">Скрыть</button>
          </div>
        )}
      </div>

      {/* Keys list */}
      <div className="glass rounded-2xl overflow-hidden">
        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Icon name="Key" size={28} className="opacity-30" />
            <div className="text-sm">Ключей ещё нет</div>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="text-left px-5 py-3">Название</th>
                <th className="text-left px-5 py-3">Ключ</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Создан</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Последнее использование</th>
                <th className="text-left px-5 py-3">Статус</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t border-border hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{k.name}</td>
                  <td className="px-5 py-3.5">
                    <code className="font-mono-custom text-xs text-muted-foreground">{k.preview}</code>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell text-xs">{fmtDate(k.created_at)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell text-xs">{fmtDate(k.last_used_at)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? "bg-green-500/15 text-green-400" : "bg-white/10 text-muted-foreground"}`}>
                      {k.is_active ? "Активен" : "Отключён"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleToggleKey(k.id, k.is_active)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {k.is_active ? "Отключить" : "Включить"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
