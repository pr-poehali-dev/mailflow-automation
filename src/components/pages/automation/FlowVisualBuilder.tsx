import Icon from "@/components/ui/icon";
import { Flow, STEP_META } from "./types";

interface Props {
  selectedFlow: Flow | null;
  onToggleActive: (id: number) => void;
}

export function FlowVisualBuilder({ selectedFlow, onToggleActive }: Props) {
  return (
    <div className="lg:col-span-8">
      {selectedFlow ? (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <div className="font-bold">{selectedFlow.name}</div>
              <div className="text-xs text-muted-foreground">{selectedFlow.description}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onToggleActive(selectedFlow.id)}
                className={`relative w-11 h-6 rounded-full transition-colors`}
                style={{ background: selectedFlow.is_active ? "#10b981" : "rgba(0,0,0,0.1)" }}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${selectedFlow.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <button className="text-xs px-3 py-1.5 rounded-lg font-medium glass hover:bg-white/8 flex items-center gap-1">
                <Icon name="Settings" size={11} />Настроить
              </button>
            </div>
          </div>

          <div className="p-5 max-h-[500px] overflow-y-auto"
            style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.02), transparent)" }}>
            <div className="space-y-1">
              {selectedFlow.steps.map((step, idx) => {
                const meta = STEP_META[step.type];
                return (
                  <div key={step.id}>
                    <div className="flex items-stretch gap-3 fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: meta.bg, border: `1px solid ${meta.color}30` }}>
                          <Icon name={meta.icon} size={15} style={{ color: meta.color }} />
                        </div>
                      </div>
                      <div className="flex-1 glass rounded-xl p-3 metric-card">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase"
                              style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                            <span className="font-medium text-sm">{step.title}</span>
                          </div>
                          <button className="text-muted-foreground hover:text-foreground">
                            <Icon name="MoreHorizontal" size={14} />
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono-custom">
                          {Object.entries(step.config).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </div>
                      </div>
                    </div>
                    {idx < selectedFlow.steps.length - 1 && (
                      <div className="ml-4 my-1 h-4 w-px" style={{ background: "linear-gradient(180deg, #8b5cf6, #06b6d4)" }} />
                    )}
                  </div>
                );
              })}
              <div className="flex items-stretch gap-3 mt-2">
                <div className="ml-1 w-7" />
                <button className="flex-1 py-2.5 rounded-xl border-2 border-dashed text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                  style={{ borderColor: "rgba(139,92,246,0.3)" }}>
                  <Icon name="Plus" size={13} />
                  Добавить шаг
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span><Icon name="Users" size={11} className="inline" /> В процессе: <span className="font-semibold text-foreground">{selectedFlow.total_started - selectedFlow.total_completed}</span></span>
              <span><Icon name="CheckCircle" size={11} className="inline" /> Завершили: <span className="font-semibold text-foreground">{selectedFlow.total_completed}</span></span>
            </div>
            <span className="font-bold text-lg gradient-text">{selectedFlow.conversion}% конверсия</span>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl flex items-center justify-center py-20 text-muted-foreground">
          <div className="text-center">
            <Icon name="Workflow" size={32} className="mx-auto mb-2 opacity-30" />
            <div className="text-sm">Выбери сценарий слева</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlowVisualBuilder;
