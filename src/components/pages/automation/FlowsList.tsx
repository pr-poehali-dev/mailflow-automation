import Icon from "@/components/ui/icon";
import { Flow } from "./types";

interface Props {
  flows: Flow[];
  selectedFlow: Flow | null;
  onSelect: (flow: Flow) => void;
}

export function FlowsList({ flows, selectedFlow, onSelect }: Props) {
  return (
    <div className="lg:col-span-4 space-y-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground px-2 mb-1">Мои сценарии</div>
      {flows.map((f) => {
        const active = selectedFlow?.id === f.id;
        return (
          <button key={f.id} onClick={() => onSelect(f)}
            className={`w-full text-left p-3 rounded-xl transition-all border ${
              active ? "border-purple-500" : "border-border hover:border-white/20"
            }`}
            style={active ? { background: "rgba(139,92,246,0.06)" } : { background: "rgba(255,255,255,0.4)" }}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{f.description}</div>
              </div>
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0`}
                style={{ background: f.is_active ? "#10b981" : "#94a3b8" }} />
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Icon name="Users" size={11} />{f.total_started}</span>
              <span className="flex items-center gap-1"><Icon name="TrendingUp" size={11} />{f.conversion}%</span>
              <span className="flex items-center gap-1"><Icon name="GitBranch" size={11} />{f.steps.length}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default FlowsList;
