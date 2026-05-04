import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  yearly: boolean;
}

const formatRub = (n: number) => n.toLocaleString("ru-RU");

export default function PriceCalculator({ yearly }: Props) {
  const [contacts, setContacts] = useState(10000);
  const [emailsPerMonth, setEmailsPerMonth] = useState(40000);
  const [sms, setSms] = useState(0);

  // Базовая логика: чем больше контактов — тем выше плата.
  const calc = useMemo(() => {
    const base =
      contacts <= 5000
        ? 990
        : contacts <= 25000
        ? 2990
        : contacts <= 100000
        ? 7990
        : 7990 + Math.ceil((contacts - 100000) / 10000) * 590;

    const emailOver = emailsPerMonth > 50000 && contacts <= 5000
      ? Math.ceil((emailsPerMonth - 50000) / 10000) * 290
      : 0;

    const smsCost = Math.ceil(sms / 1000) * 3500;

    const subtotal = base + emailOver + smsCost;
    const total = yearly ? Math.round(subtotal * 0.7) : subtotal;
    const savings = yearly ? subtotal * 12 - total * 12 : 0;

    return { base, emailOver, smsCost, subtotal, total, savings };
  }, [contacts, emailsPerMonth, sms, yearly]);

  const tierName =
    contacts <= 5000 ? "Старт" : contacts <= 25000 ? "Бизнес" : "Enterprise";
  const tierColor =
    contacts <= 5000 ? "#06b6d4" : contacts <= 25000 ? "#8b5cf6" : "#ec4899";

  return (
    <div className="glass rounded-2xl p-5 sm:p-7 max-w-4xl mx-auto fade-in-up"
      style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          <Icon name="Calculator" size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Калькулятор стоимости</h3>
          <p className="text-xs text-muted-foreground">Двигайте ползунки — посчитаем реальную цену под вашу задачу</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium">Контактов в базе</label>
            <span className="text-sm font-bold" style={{ color: tierColor }}>
              {formatRub(contacts)}
            </span>
          </div>
          <input
            type="range"
            min={500}
            max={250000}
            step={500}
            value={contacts}
            onChange={(e) => setContacts(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>500</span>
            <span>50 000</span>
            <span>250 000</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium">Email-писем в месяц</label>
            <span className="text-sm font-bold">{formatRub(emailsPerMonth)}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={500000}
            step={1000}
            value={emailsPerMonth}
            onChange={(e) => setEmailsPerMonth(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1 000</span>
            <span>100 000</span>
            <span>500 000</span>
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium">SMS-сообщений в месяц</label>
            <span className="text-sm font-bold">{formatRub(sms)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={20000}
            step={500}
            value={sms}
            onChange={(e) => setSms(Number(e.target.value))}
            className="w-full accent-pink-500"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
            <span>10 000</span>
            <span>20 000</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 space-y-2"
        style={{ background: `${tierColor}10`, border: `1px solid ${tierColor}30` }}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Подходящий тариф:</span>
          <span className="font-bold" style={{ color: tierColor }}>{tierName}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Базовая стоимость:</span>
          <span className="font-mono-custom">{formatRub(calc.base)} ₽/мес</span>
        </div>
        {calc.emailOver > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Доп. письма:</span>
            <span className="font-mono-custom">+ {formatRub(calc.emailOver)} ₽/мес</span>
          </div>
        )}
        {calc.smsCost > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">SMS-канал:</span>
            <span className="font-mono-custom">+ {formatRub(calc.smsCost)} ₽/мес</span>
          </div>
        )}
        {yearly && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Скидка за год:</span>
            <span className="font-mono-custom" style={{ color: "#10b981" }}>
              −{formatRub(calc.subtotal - calc.total)} ₽/мес
            </span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex items-baseline justify-between">
          <span className="font-semibold">Итого:</span>
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: tierColor }}>
              {formatRub(calc.total)} ₽
            </div>
            <div className="text-[10px] text-muted-foreground">в месяц{yearly ? " при оплате за год" : ""}</div>
          </div>
        </div>
        {yearly && calc.savings > 0 && (
          <div className="text-xs text-center pt-1" style={{ color: "#10b981" }}>
            Экономия {formatRub(calc.savings)} ₽ в год
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Icon name="Check" size={12} style={{ color: "#10b981" }} />
          Без скрытых платежей
        </span>
        <span className="flex items-center gap-1">
          <Icon name="Check" size={12} style={{ color: "#10b981" }} />
          Счёт для юрлица с НДС
        </span>
        <span className="flex items-center gap-1">
          <Icon name="Check" size={12} style={{ color: "#10b981" }} />
          Отмена в 1 клик
        </span>
      </div>
    </div>
  );
}
