import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ENDPOINTS, METHOD_COLOR } from "./endpoints";

interface Props {
  copiedId: number | null;
  onCopy: (text: string, id: number) => void;
}

export default function ApiDocsTab({ copiedId, onCopy }: Props) {
  const [openEndpoint, setOpenEndpoint] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="glass rounded-2xl p-4 text-sm space-y-2">
        <div className="font-semibold flex items-center gap-2">
          <Icon name="Info" size={14} style={{ color: "#06b6d4" }} />
          Аутентификация
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Все защищённые эндпоинты требуют заголовок <code className="font-mono-custom text-purple-400">X-API-Key: YOUR_KEY</code>.
          Создай ключ на вкладке «API-ключи» и используй его в каждом запросе.
        </p>
      </div>

      {ENDPOINTS.map((ep, i) => (
        <div key={i} className="glass rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors"
            onClick={() => setOpenEndpoint(openEndpoint === i ? null : i)}>
            <span className="font-mono-custom text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: `${METHOD_COLOR[ep.method]}22`, color: METHOD_COLOR[ep.method] }}>
              {ep.method}
            </span>
            <code className="font-mono-custom text-xs text-muted-foreground">{ep.path}</code>
            <span className="font-medium text-sm">{ep.title}</span>
            {ep.auth && (
              <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="Lock" size={11} />
                API Key
              </span>
            )}
            <Icon name={openEndpoint === i ? "ChevronUp" : "ChevronDown"} size={14} className="text-muted-foreground flex-shrink-0" />
          </button>
          {openEndpoint === i && (
            <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">{ep.desc}</p>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Пример запроса</div>
                <div className="relative rounded-xl overflow-hidden" style={{ background: "#1e1b3a" }}>
                  <pre className="text-xs font-mono-custom p-4 overflow-x-auto" style={{ color: "#e2e8f0" }}>{ep.example}</pre>
                  <button
                    onClick={() => onCopy(ep.example, i + 100)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name={copiedId === i + 100 ? "Check" : "Copy"} size={13} />
                  </button>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Пример ответа</div>
                <div className="rounded-xl overflow-hidden" style={{ background: "#1e1b3a" }}>
                  <pre className="text-xs font-mono-custom p-4 overflow-x-auto" style={{ color: "#4ade80" }}>{ep.response}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
