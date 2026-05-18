import Icon from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HOW_IT_WORKS, TRUST_BULLETS, WHO_PARTNERS, FAQ } from "./PartnersData";

export default function PartnersInfo() {
  return (
    <>
      {/* HOW IT WORKS */}
      <section className="space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Как это работает</h2>
          <p className="text-sm text-muted-foreground">От регистрации до первой выплаты — 30 минут на старт.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((s) => (
            <Card key={s.num} className="p-5 space-y-3 relative">
              <div className="absolute top-4 right-4 text-3xl font-extrabold opacity-10">{s.num}</div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
                <Icon name={s.icon} size={18} />
              </div>
              <div>
                <div className="font-bold text-sm">{s.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{s.desc}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section>
        <Card className="p-6 sm:p-8 grid md:grid-cols-2 lg:grid-cols-4 gap-5"
          style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.18)" }}>
          {TRUST_BULLETS.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4" }}>
                <Icon name={b.icon} size={16} />
              </div>
              <div className="text-xs leading-relaxed">{b.text}</div>
            </div>
          ))}
        </Card>
      </section>

      {/* WHO IS A GOOD PARTNER */}
      <section className="space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Кому это подойдёт</h2>
          <p className="text-sm text-muted-foreground">Если ты работаешь с малым бизнесом или маркетингом — это для тебя.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WHO_PARTNERS.map((c, i) => (
            <Card key={i} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(139,92,246,0.10)", color: "#8b5cf6" }}>
                  <Icon name={c.icon} size={18} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{c.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{c.desc}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold">Частые вопросы</h2>
        </div>

        <Tabs defaultValue="0" className="max-w-3xl mx-auto">
          <TabsList className="flex flex-wrap h-auto bg-secondary/50 p-1.5 rounded-2xl">
            {FAQ.map((_, i) => (
              <TabsTrigger key={i} value={String(i)} className="text-xs rounded-xl">
                Вопрос {i + 1}
              </TabsTrigger>
            ))}
          </TabsList>
          {FAQ.map((f, i) => (
            <TabsContent key={i} value={String(i)} className="mt-4">
              <Card className="p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
                    <Icon name="HelpCircle" size={16} />
                  </div>
                  <div className="font-semibold text-base">{f.q}</div>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed pl-11">{f.a}</div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </>
  );
}
