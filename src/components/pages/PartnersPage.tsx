import PartnersHero from "./partners/PartnersHero";
import PartnersCalculator from "./partners/PartnersCalculator";
import PartnersInfo from "./partners/PartnersInfo";
import PartnersApplyForm from "./partners/PartnersApplyForm";

export default function PartnersPage() {
  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-12">
      <PartnersHero />
      <PartnersCalculator />
      <PartnersInfo />
      <PartnersApplyForm />
    </div>
  );
}
