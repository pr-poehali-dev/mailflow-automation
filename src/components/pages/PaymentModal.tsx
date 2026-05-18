import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useYookassa, openPaymentPage } from "@/components/extensions/yookassa/useYookassa";
import { useAuth } from "@/contexts/AuthContext";

const YOOKASSA_API_URL = "https://functions.poehali.dev/d8b8511e-670b-47b4-8653-0fa0f7757684";
const PROMO_API_URL = "https://functions.poehali.dev/e05afb5f-cc72-48ab-a37d-bd327248aeda";

interface PromoState {
  code: string;
  discount: number;
  final: number;
  description?: string;
}

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
  const { user, resendVerification } = useAuth();
  const needVerify = !!user && user.is_email_verified === false;
  const [resending, setResending] = useState(false);
  const [resentMsg, setResentMsg] = useState<string | null>(null);

  const handleResendVerify = async () => {
    setResending(true);
    const r = await resendVerification();
    setResentMsg(r.ok ? "Письмо отправлено! Проверьте почту." : (r.error || "Не удалось отправить"));
    setResending(false);
    setTimeout(() => setResentMsg(null), 6000);
  };

  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(user?.name || "");
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promo, setPromo] = useState<PromoState | null>(null);

  const subtotal = yearly ? amount * 12 : amount;
  const total = promo ? promo.final : subtotal;
  const period = yearly ? "12 месяцев" : "1 месяц";
  const description = `Тариф «${planName}» MAIL-KA · ${period}`;

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoChecking(true);
    setPromoError("");
    try {
      const r = await fetch(PROMO_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          amount: subtotal,
          user_email: email.trim().toLowerCase(),
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setPromo({
          code: data.code,
          discount: data.discount_amount,
          final: data.final_amount,
          description: data.description,
        });
        setPromoOpen(false);
      } else {
        setPromoError(data.message || "Промокод не подошёл");
      }
    } catch {
      setPromoError("Не удалось проверить промокод");
    } finally {
      setPromoChecking(false);
    }
  };

  const handleRemovePromo = () => {
    setPromo(null);
    setPromoInput("");
    setPromoError("");
  };

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
      planId,
      billingPeriod: yearly ? "yearly" : "monthly",
      promoCode: promo?.code,
      originalAmount: promo ? subtotal : undefined,
      discountAmount: promo?.discount,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 fade-in-up overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl glass overflow-hidden shadow-2xl my-auto max-h-[calc(100vh-1.5rem)] overflow-y-auto"
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
            {promo ? (
              <div className="space-y-0.5 mt-1">
                <div className="text-sm line-through text-muted-foreground">
                  {subtotal.toLocaleString("ru-RU")} ₽
                </div>
                <div className="text-3xl font-bold" style={{ color: planColor }}>
                  {total.toLocaleString("ru-RU")} ₽
                </div>
                <div className="text-[11px]" style={{ color: "#10b981" }}>
                  Скидка по {promo.code}: −{promo.discount.toLocaleString("ru-RU")} ₽
                </div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold mt-1" style={{ color: planColor }}>
                  {total.toLocaleString("ru-RU")} ₽
                </div>
                {yearly && (
                  <div className="text-[11px] mt-1" style={{ color: "#10b981" }}>
                    Скидка 30% · экономия {Math.round(amount * 12 / 0.7 - amount * 12).toLocaleString("ru-RU")} ₽
                  </div>
                )}
              </>
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

          {/* Промокод */}
          {promo ? (
            <div className="flex items-center justify-between p-3 rounded-lg gap-2"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <Icon name="BadgePercent" size={15} style={{ color: "#10b981" }} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{promo.code}</div>
                  {promo.description && (
                    <div className="text-[10px] text-muted-foreground truncate">{promo.description}</div>
                  )}
                </div>
              </div>
              <button onClick={handleRemovePromo} className="text-[11px] text-muted-foreground hover:text-red-400 flex-shrink-0">
                Убрать
              </button>
            </div>
          ) : !promoOpen ? (
            <button
              type="button"
              onClick={() => setPromoOpen(true)}
              className="w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg hover:border-purple-500/50">
              <Icon name="Tag" size={12} />
              Есть промокод?
            </button>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground block">Промокод</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  placeholder="FIRST30"
                  autoFocus
                  className="flex-1 bg-background/60 border border-border rounded-lg px-3 py-2 text-sm font-mono-custom outline-none focus:border-purple-500 transition-colors uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoChecking || !promoInput.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                  {promoChecking ? <Icon name="Loader2" size={12} className="animate-spin" /> : "Применить"}
                </button>
              </div>
              {promoError && (
                <div className="text-[11px] flex items-center gap-1.5" style={{ color: "#dc2626" }}>
                  <Icon name="AlertCircle" size={11} />{promoError}
                </div>
              )}
            </div>
          )}

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

          {needVerify && (
            <div className="rounded-lg p-2.5 flex items-start gap-2"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <Icon name="ShieldAlert" size={13} style={{ color: "#f59e0b", marginTop: 1 }} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold">Подтвердите email перед оплатой</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {resentMsg || "Защита от мошенничества. Письмо со ссылкой отправили на " + (user?.email || "")}
                </div>
                <button onClick={handleResendVerify} disabled={resending}
                  className="mt-1.5 text-[10px] font-semibold underline hover:text-foreground disabled:opacity-60">
                  {resending ? "Отправляем..." : "Отправить письмо ещё раз"}
                </button>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handlePay}
            disabled={isLoading || needVerify}
            title={needVerify ? "Сначала подтвердите email" : undefined}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${planColor}, #06b6d4)` }}>
            {isLoading ? (
              <><Icon name="Loader2" size={14} className="animate-spin" />Создаём платёж...</>
            ) : needVerify ? (
              <><Icon name="Lock" size={14} />Подтвердите email для оплаты</>
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