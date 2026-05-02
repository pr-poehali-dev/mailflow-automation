import Icon from "@/components/ui/icon";

interface Props {
  onTry: () => void;
}

export function FinalCta({ onTry }: Props) {
  return (
    <div className="max-w-3xl mx-auto rounded-2xl p-8 text-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))",
               border: "1px solid rgba(139,92,246,0.25)" }}>
      <div className="absolute top-0 right-0 w-40 h-40 opacity-20 blur-3xl rounded-full"
        style={{ background: "#8b5cf6" }} />
      <div className="relative">
        <h2 className="text-2xl font-bold mb-2">Не уверены, какой тариф выбрать?</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Начните с 7-дневного бесплатного периода тарифа «Бизнес» — все функции платформы без ограничений
        </p>
        <button
          onClick={onTry}
          className="px-6 py-3 rounded-xl text-sm font-bold text-white inline-flex items-center gap-2 hover:scale-105 transition-transform"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          <Icon name="Rocket" size={15} />
          Попробовать бесплатно
        </button>
        <div className="text-[11px] text-muted-foreground mt-3">
          Без привязки карты · отмена в любой момент · 24/7 поддержка
        </div>
      </div>
    </div>
  );
}

export default FinalCta;
