import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Flow, PREMADE_FLOWS } from "./automation/types";
import { AutomationStats } from "./automation/AutomationStats";
import { FlowsList } from "./automation/FlowsList";
import { FlowVisualBuilder } from "./automation/FlowVisualBuilder";

export function AutomationPage() {
  const [flows, setFlows] = useState<Flow[]>(PREMADE_FLOWS);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(PREMADE_FLOWS[0]);
  const [showLibrary, setShowLibrary] = useState(false);

  const toggleActive = (id: number) => {
    setFlows(flows.map((f) => f.id === id ? { ...f, is_active: !f.is_active } : f));
    if (selectedFlow?.id === id) {
      setSelectedFlow({ ...selectedFlow, is_active: !selectedFlow.is_active });
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Автоматизации
            <span className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>ПРО</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Визуальные сценарии · триггеры → действия → условия</p>
        </div>
        <button onClick={() => setShowLibrary(!showLibrary)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          <Icon name="Plus" size={15} />
          Создать сценарий
        </button>
      </div>

      <AutomationStats
        flows={flows}
        showLibrary={showLibrary}
        onCloseLibrary={() => setShowLibrary(false)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <FlowsList
          flows={flows}
          selectedFlow={selectedFlow}
          onSelect={setSelectedFlow}
        />
        <FlowVisualBuilder
          selectedFlow={selectedFlow}
          onToggleActive={toggleActive}
        />
      </div>
    </div>
  );
}

export default AutomationPage;
