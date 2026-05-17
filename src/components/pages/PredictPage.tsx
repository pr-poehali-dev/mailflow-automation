import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { PredictMetrics } from "./predict/PredictMetrics";
import { RevenueAndRetention } from "./predict/RevenueAndRetention";
import { BestSendTime } from "./predict/BestSendTime";
import { TopContactsTable } from "./predict/TopContactsTable";
import { fetchGlobalStats, fetchContactScores, GlobalStats, ContactScore } from "@/api/pro";

export function PredictPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [contacts, setContacts] = useState<ContactScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchGlobalStats(), fetchContactScores()]).then(([s, c]) => {
      setStats(s);
      setContacts(c.contacts || []);
      setLoading(false);
    });
  }, []);

  const exportCsv = () => {
    if (contacts.length === 0) return;
    const head = ["Имя", "Email", "Сегмент", "ИИ-балл", "Последнее открытие", "Последний клик"];
    const rows = contacts.map((c) => [
      c.name || "",
      c.email,
      c.segment || "",
      String(c.score ?? 0),
      c.last_opened_at || "",
      c.last_clicked_at || "",
    ]);
    const csv = [head, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mailka-predict-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasData = (stats?.total_sent ?? 0) > 0 || contacts.length > 0;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="fade-in-up flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ИИ-прогноз поведения
            <span className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>ИИ</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Прогноз пожизненной ценности клиента, риск ухода, лучшее время отправки, источники дохода
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={contacts.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8 disabled:opacity-50 disabled:cursor-not-allowed">
          <Icon name="Download" size={14} />
          Экспорт в CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Icon name="Loader2" size={18} className="animate-spin" />Считаем прогноз...
        </div>
      ) : !hasData ? (
        <div className="glass rounded-2xl p-12 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.10))" }}>
            <Icon name="Sparkles" size={28} style={{ color: "#8b5cf6" }} />
          </div>
          <div className="font-bold text-lg">Прогноз появится после первой рассылки</div>
          <div className="text-sm text-muted-foreground max-w-md mx-auto">
            ИИ строит прогноз пожизненной ценности и риска ухода на основе открытий и кликов.
            Запусти первую кампанию — и здесь появятся персональные метрики.
          </div>
        </div>
      ) : (
        <>
          <PredictMetrics stats={stats!} contacts={contacts} />
          <RevenueAndRetention stats={stats!} />
          <BestSendTime />
          <TopContactsTable contacts={contacts} />
        </>
      )}
    </div>
  );
}

export default PredictPage;
