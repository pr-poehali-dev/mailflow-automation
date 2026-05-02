import Icon from "@/components/ui/icon";
import { ADDONS, FAQ } from "./data";

interface Props {
  openFaq: number | null;
  setOpenFaq: (idx: number | null) => void;
}

export function PricingExtras({ openFaq, setOpenFaq }: Props) {
  return (
    <>
      {/* Trust bar */}
      <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-muted-foreground py-4">
        {[
          { icon: "ShieldCheck", text: "152-ФЗ + GDPR" },
          { icon: "CreditCard", text: "Оплата картой РФ и СБП" },
          { icon: "FileText", text: "Закрывающие документы" },
          { icon: "RefreshCw", text: "Возврат 14 дней" },
          { icon: "Clock", text: "Поддержка 24/7" },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Icon name={t.icon} size={14} style={{ color: "#10b981" }} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Дополнительные опции</h2>
          <p className="text-xs text-muted-foreground mt-1">Расширьте любой тариф под свои задачи</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ADDONS.map((a, i) => (
            <div key={i} className="glass rounded-xl p-3 metric-card">
              <Icon name={a.icon} size={16} style={{ color: "#8b5cf6" }} />
              <div className="text-sm font-semibold mt-2">{a.name}</div>
              <div className="text-xs font-bold mt-1" style={{ color: "#10b981" }}>{a.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto pt-4">
        <h2 className="text-xl font-bold text-center mb-1">Частые вопросы</h2>
        <p className="text-xs text-muted-foreground text-center mb-5">Не нашли ответ? Напишите в чат — отвечаем за 2 минуты</p>
        <div className="space-y-2">
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors">
                  <span className="text-sm font-semibold">{item.q}</span>
                  <Icon name="ChevronDown" size={14}
                    className={`text-muted-foreground transition-transform flex-shrink-0 ml-3 ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed fade-in-up">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default PricingExtras;
