import { useState } from "react";
import Icon from "@/components/ui/icon";
import PaymentModal from "./PaymentModal";
import { Plan, PLANS } from "./pricing/data";
import { PlanCards } from "./pricing/PlanCards";
import { PricingExtras } from "./pricing/PricingExtras";
import { FinalCta } from "./pricing/FinalCta";

export function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [paymentPlan, setPaymentPlan] = useState<Plan | null>(null);

  const calcPrice = (monthly: number) => {
    if (!yearly) return monthly;
    return Math.round(monthly * 0.7);
  };

  const calcSaving = (monthly: number) => {
    return Math.round(monthly * 0.3 * 12);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Hero */}
      <div className="text-center fade-in-up max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}>
          <Icon name="Sparkles" size={12} />
          7 дней бесплатно · без карты · без обязательств
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-3">Простые и честные тарифы</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Никаких скрытых платежей. Все AI-функции и автоматизации с первого дня. Отмена в 1 клик.
        </p>
      </div>

      <PlanCards
        plans={PLANS}
        yearly={yearly}
        setYearly={setYearly}
        calcPrice={calcPrice}
        calcSaving={calcSaving}
        onSelectPlan={setPaymentPlan}
      />

      <PricingExtras openFaq={openFaq} setOpenFaq={setOpenFaq} />

      <FinalCta onTry={() => setPaymentPlan(PLANS[1])} />

      {paymentPlan && (
        <PaymentModal
          open={!!paymentPlan}
          onClose={() => setPaymentPlan(null)}
          planId={paymentPlan.id}
          planName={paymentPlan.name}
          planColor={paymentPlan.color}
          amount={calcPrice(paymentPlan.monthly)}
          yearly={yearly}
        />
      )}
    </div>
  );
}

export default PricingPage;