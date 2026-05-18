import { useState } from "react";
import { Card } from "@/components/ui/card";

export default function PartnersCalculator() {
  const [contacts, setContacts] = useState(50);
  const [tariff, setTariff] = useState<"start" | "business" | "enterprise">("business");
  const [program, setProgram] = useState<"referral" | "agency">("referral");

  const tariffPrice = tariff === "start" ? 990 : tariff === "business" ? 2990 : 7990;
  const rate = program === "referral" ? 0.2 : 0.3;
  const monthly = Math.round(contacts * tariffPrice * rate);
  const yearly = monthly * 12;

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("ru-RU").format(n) + " ₽";

  return (
    <section id="calculator" className="space-y-5">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Сколько ты заработаешь</h2>
        <p className="text-sm text-muted-foreground">Подвигай ползунки и посмотри реальный потенциал. Цифры основаны на тарифах MAIL-KA.</p>
      </div>

      <Card className="p-6 sm:p-8 grid lg:grid-cols-2 gap-8 items-center"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(6,182,212,0.03))" }}>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-sm font-medium">Приведённых клиентов в месяц</label>
              <span className="text-2xl font-bold gradient-text">{contacts}</span>
            </div>
            <input type="range" min={1} max={200} value={contacts}
              onChange={(e) => setContacts(Number(e.target.value))}
              className="w-full accent-violet-500" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>1</span><span>50</span><span>100</span><span>200</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Средний тариф клиента</label>
            <div className="grid grid-cols-3 gap-2">
              {(["start", "business", "enterprise"] as const).map((t) => (
                <button key={t} onClick={() => setTariff(t)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tariff === t ? "border-violet-500 bg-violet-50/50" : "border-border hover:bg-secondary"
                  }`}>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                    {t === "start" ? "Старт" : t === "business" ? "Бизнес" : "Enterprise"}
                  </div>
                  <div className="text-sm font-bold">
                    {t === "start" ? "990 ₽" : t === "business" ? "2 990 ₽" : "7 990 ₽"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Тип партнёрства</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setProgram("referral")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  program === "referral" ? "border-violet-500 bg-violet-50/50" : "border-border hover:bg-secondary"
                }`}>
                <div className="text-xs font-bold">Реферальная</div>
                <div className="text-[11px] text-muted-foreground">20% · 12 мес</div>
              </button>
              <button onClick={() => setProgram("agency")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  program === "agency" ? "border-violet-500 bg-violet-50/50" : "border-border hover:bg-secondary"
                }`}>
                <div className="text-xs font-bold">Агентство</div>
                <div className="text-[11px] text-muted-foreground">30% · пожизненно</div>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-6 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative space-y-4">
              <div>
                <div className="text-xs opacity-80 uppercase tracking-wide">Твой доход в месяц</div>
                <div className="text-4xl sm:text-5xl font-extrabold mt-1">{formatMoney(monthly)}</div>
              </div>
              <div className="h-px bg-white/20" />
              <div>
                <div className="text-xs opacity-80 uppercase tracking-wide">За год</div>
                <div className="text-2xl sm:text-3xl font-bold mt-1">{formatMoney(yearly)}</div>
              </div>
              <div className="text-[10px] opacity-70 pt-2">
                Расчёт: {contacts} клиентов × {formatMoney(tariffPrice)} × {Math.round(rate * 100)}%
              </div>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground text-center">
            Это пассивный доход — клиенты платят ежемесячно, ты получаешь свою долю автоматически.
          </div>
        </div>
      </Card>
    </section>
  );
}
