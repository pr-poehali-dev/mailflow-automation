import Icon from "@/components/ui/icon";
import { useState } from "react";

function Tag({ icon, color, children }: { icon: string; color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      <Icon name={icon} size={11} />
      {children}
    </span>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left text-sm font-medium text-foreground hover:text-purple-400 transition-colors"
      >
        <span>{q}</span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} />
      </button>
      {open && <div className="mt-2 text-xs leading-relaxed">{children}</div>}
    </div>
  );
}

export function MailboxHero() {
  return (
    <div
      className="rounded-3xl p-7 md:p-9 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.08))",
        border: "1px solid rgba(139,92,246,0.2)",
      }}
    >
      <div
        className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
      />
      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
          style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Партнёрская витрина · Лицензированные операторы РФ
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2 gradient-text">
          Корпоративная почта от 99 ₽/мес
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Получите красивые адреса вида <code className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-xs">имя@вашдомен.ру</code>{" "}
          и подключите их к рассылкам в один клик. Все провайдеры — российские,
          с серверами в РФ и соответствием 152-ФЗ.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <Tag icon="ShieldCheck" color="#10b981">152-ФЗ</Tag>
          <Tag icon="MapPin" color="#06b6d4">Серверы в РФ</Tag>
          <Tag icon="Award" color="#8b5cf6">Лицензия Роскомнадзора</Tag>
          <Tag icon="Zap" color="#f59e0b">Подключение за 5 минут</Tag>
        </div>
      </div>
    </div>
  );
}

export function MailboxFaq() {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Icon name="HelpCircle" size={16} className="text-cyan-400" />
        Часто спрашивают
      </h2>
      <div className="space-y-4 text-sm text-muted-foreground">
        <FaqItem q="Кто на самом деле даёт почту?">
          Сами адреса предоставляют российские лицензированные операторы (Beget, Яндекс 360,
          VK WorkSpace). MAIL-KA — это витрина-агрегатор и инструмент рассылок: подбираем
          тариф, помогаем с настройкой DKIM/SPF/DMARC и подключаем ящик к кампаниям.
        </FaqItem>
        <FaqItem q="Нужна ли своя доменная зона?">
          Да, нужен домен (например, <code>company.ru</code>). Если домена нет — мы поможем
          подобрать и зарегистрировать через того же провайдера.
        </FaqItem>
        <FaqItem q="Какая комиссия и как платить?">
          Оплата идёт напрямую провайдеру по их прайсу — никаких скрытых наценок. Заявка
          «Хочу почту» нужна, чтобы менеджер помог с настройкой DNS-записей и интеграцией с MAIL-KA.
        </FaqItem>
        <FaqItem q="Безопасно ли это для 152-ФЗ?">
          Да. Все три провайдера — в реестре операторов персональных данных Роскомнадзора,
          хранят данные на серверах в РФ. Это покрывает требования 152-ФЗ и 242-ФЗ для вашего бизнеса.
        </FaqItem>
      </div>
    </section>
  );
}

export default MailboxHero;
