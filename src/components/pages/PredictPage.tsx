import Icon from "@/components/ui/icon";
import { PredictMetrics } from "./predict/PredictMetrics";
import { RevenueAndRetention } from "./predict/RevenueAndRetention";
import { BestSendTime } from "./predict/BestSendTime";
import { TopContactsTable } from "./predict/TopContactsTable";

export function PredictPage() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="fade-in-up flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ИИ-прогноз поведения
            <span className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>ИИ</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Прогноз пожизненной ценности клиента, риск ухода, лучшее время отправки, источники дохода</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8">
          <Icon name="Download" size={14} />
          Экспорт в Excel
        </button>
      </div>

      <PredictMetrics />

      <RevenueAndRetention />

      <BestSendTime />

      <TopContactsTable />
    </div>
  );
}

export default PredictPage;