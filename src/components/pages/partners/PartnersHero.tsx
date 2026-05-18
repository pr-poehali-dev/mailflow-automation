import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROGRAMS } from "./PartnersData";

export default function PartnersHero() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl p-8 sm:p-12"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.10), rgba(6,182,212,0.08))",
          border: "1px solid rgba(139,92,246,0.18)",
        }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        <div className="relative max-w-3xl space-y-5">
          <Badge variant="secondary" className="text-xs"
            style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" }}>
            <Icon name="Handshake" size={12} className="mr-1.5" />
            Партнёрская программа MAIL-KA
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            Зарабатывай <span className="gradient-text">до 40%</span><br />
            с каждого приведённого клиента
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Рекомендуй MAIL-KA своей аудитории, клиентам или коллегам — и получай долю от их платежей
            каждый месяц, пока они пользуются сервисом. Без вложений, без минимального порога, без бюрократии.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" className="text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
              onClick={() => document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth" })}>
              <Icon name="Rocket" size={16} className="mr-2" />
              Стать партнёром
            </Button>
            <Button size="lg" variant="outline"
              onClick={() => document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" })}>
              <Icon name="Calculator" size={16} className="mr-2" />
              Рассчитать доход
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 max-w-2xl">
            {[
              { v: "20–40%", l: "доля с платежей" },
              { v: "12 мес+", l: "выплат с клиента" },
              { v: "90 дней", l: "cookie-атрибуция" },
              { v: "1 000 ₽", l: "минимальный вывод" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-xl sm:text-2xl font-extrabold gradient-text">{s.v}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">4 формата партнёрства</h2>
          <p className="text-sm text-muted-foreground">Выбери, что подходит именно тебе — от рекомендации в Telegram до White Label.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROGRAMS.map((p) => (
            <Card key={p.id} className="p-5 relative space-y-4 hover:shadow-lg transition-shadow"
              style={p.recommended ? { borderColor: p.color, borderWidth: 2 } : {}}>
              {p.recommended && (
                <div className="absolute -top-2.5 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: p.color }}>
                  ПОПУЛЯРНО
                </div>
              )}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: `${p.color}1a`, color: p.color }}>
                <Icon name={p.icon} size={20} />
              </div>
              <div>
                <div className="font-bold text-base">{p.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{p.subtitle}</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold" style={{ color: p.color }}>{p.revshare}</span>
                <span className="text-xs text-muted-foreground">/ {p.period}</span>
              </div>
              <ul className="space-y-1.5 text-xs">
                {p.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Icon name="Check" size={12} style={{ color: p.color, marginTop: 2 }} className="flex-shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-border text-[10px] text-muted-foreground flex items-center gap-1.5">
                <Icon name="Wallet" size={11} />
                Выплаты {p.payout}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
