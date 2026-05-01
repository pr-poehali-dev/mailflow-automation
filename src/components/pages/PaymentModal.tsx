import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useYookassa, openPaymentPage } from "@/components/extensions/yookassa/useYookassa";

const YOOKASSA_API_URL = "https://functions.poehali.dev/d8b8511e-670b-47b4-8653-0fa0f7757684";

interface Props {
  open: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  planColor: string;
  amount: number;
  yearly: boolean;
}

export function PaymentModal({ open, onClose, planId, planName, planColor, amount, yearly }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState("");

  const total = yearly ? amount * 12 : amount;
  const period = yearly ? "12 месяцев" : "1 месяц";
  const description = `Тариф «${planName}» MAIL-KA · ${period}`;

  const { createPayment, isLoading } = useYookassa({
    apiUrl: YOOKASSA_API_URL,
    onError: (e) => setError(e.message || "Ошибка оплаты"),
  });

  if (!open) return null;

  const validate = (): boolean => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Введите корректный email"); return false;
    }
    if (!name.trim() || name.trim().length < 2) {
      setError("Введите имя"); return false;
    }
    if (!agree) {
      setError("Нужно согласиться с условиями"); return false;
    }
    setError("");
    return true;
  };

  const handlePay = async () => {
    if (!validate()) return;

    const returnUrl = `${window.location.origin}${window.location.pathname}?payment=success`;

    const response = await createPayment({
      amount: total,
      userEmail: email.trim(),
      userName: name.trim(),
      description,
      returnUrl,
      cartItems: [{
        id: planId,
        name: description,
        price: total,
        quantity: 1,
      }],
    });

    if (response?.payment_url) {
      openPaymentPage(response.payment_url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in-up"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl glass overflow-hidden shadow-2xl"
        style={{ border: `2px solid ${planColor}40` }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border"
          style={{ background: `linear-gradient(135deg, ${planColor}15, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${planColor}20`, border: `1px solid ${planColor}40` }}>
              <Icon name="CreditCard" size={18} style={{ color: planColor }} />
            </div>
            <div>
              <div className="font-bold">Оплата подписки</div>
              <div className="text-xs text-muted-foreground">Тариф «{planName}» · {period}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Сумма */}
          <div className="rounded-xl p-4 text-center"
            style={{ background: `linear-gradient(135deg, ${planColor}10, rgba(6,182,212,0.05))`,
                     border: `1px solid ${planColor}30` }}>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">К оплате</div>
            <div className="text-3xl font-bold mt-1" style={{ color: planColor }}>
              {total.toLocaleString("ru-RU")} ₽
            </div>
            {yearly && (
              <div className="text-[11px] mt-1" style={{ color: "#10b981" }}>
                Скидка 30% · экономия {Math.round(amount * 12 / 0.7 - amount * 12).toLocaleString("ru-RU")} ₽
              </div>
            )}
          </div>

          {/* Имя */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Имя *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Иванов"
              className="w-full bg-background/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Email * (для чека и доступа)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.ru"
              className="w-full bg-background/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Чек по 54-ФЗ */}
          <div className="text-[11px] text-muted-foreground flex items-start gap-1.5 p-2.5 rounded-lg"
            style={{ background: "rgba(16,185,129,0.06)" }}>
            <Icon name="ShieldCheck" size={12} style={{ color: "#10b981", marginTop: 1 }} />
            <span>Чек по 54-ФЗ придёт на email сразу после оплаты. Закрывающие документы для юрлиц — автоматически.</span>
          </div>

          {/* Согласие */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 accent-purple-500"
            />
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              Принимаю <a className="underline hover:text-foreground">оферту</a> и согласен на обработку{" "}
              <a className="underline hover:text-foreground">персональных данных</a>. Подписка продлевается автоматически, отмена в 1 клик.
            </span>
          </label>

          {error && (
            <div className="text-xs p-2.5 rounded-lg flex items-center gap-2"
              style={{ background: "rgba(248,113,113,0.1)", color: "#dc2626" }}>
              <Icon name="AlertCircle" size={13} />{error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handlePay}
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-transform hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${planColor}, #06b6d4)` }}>
            {isLoading ? (
              <><Icon name="Loader2" size={14} className="animate-spin" />Создаём платёж...</>
            ) : (
              <><Icon name="Lock" size={14} />Перейти к оплате · {total.toLocaleString("ru-RU")} ₽</>
            )}
          </button>

          {/* Способы оплаты */}
          <div className="flex items-center justify-center gap-3 pt-1 text-xs text-muted-foreground">
            <Icon name="Lock" size={11} />
            <span>Безопасная оплата через ЮKassa:</span>
            <span className="font-semibold">МИР · Visa · MC · СБП</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
