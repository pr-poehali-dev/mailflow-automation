import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { submitPartnerApplication, fetchPartnerStats, PartnerProgram } from "@/api/partners";
import { PROGRAMS } from "./PartnersData";

export default function PartnersApplyForm() {
  const [form, setForm] = useState<{
    name: string; email: string; channel: string; audience: string; program: PartnerProgram;
  }>({ name: "", email: "", channel: "", audience: "", program: "referral" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stats, setStats] = useState({ active_partners: 0, total_applications: 0 });

  useEffect(() => {
    fetchPartnerStats().then((s) => {
      if (s.ok) setStats({ active_partners: s.active_partners, total_applications: s.total_applications });
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const utm = new URLSearchParams(window.location.search).get("utm_source") || undefined;
      const r = await submitPartnerApplication({
        program: form.program,
        name: form.name,
        email: form.email,
        channel: form.channel || undefined,
        audience: form.audience || undefined,
        utm_source: utm,
      });
      if (r.ok) {
        setSubmitted(true);
        setForm({ name: "", email: "", channel: "", audience: "", program: "referral" });
      } else {
        const map: Record<string, string> = {
          invalid_email: "Проверь email — кажется, опечатка",
          name_required: "Укажи имя",
          invalid_json: "Что-то пошло не так, попробуй ещё раз",
        };
        setSubmitError(map[r.error || ""] || "Не удалось отправить заявку. Попробуй ещё раз.");
      }
    } catch {
      setSubmitError("Сетевая ошибка. Проверь интернет и попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* APPLY FORM */}
      <section id="partner-form" className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Badge variant="secondary" className="text-xs"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
            <Icon name="Send" size={11} className="mr-1.5" />
            Заявка обрабатывается за 1 рабочий день
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">Подай заявку</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Расскажи о себе и аудитории — мы свяжемся, выдадим ссылку, промокод и промо-материалы.
            Если у тебя есть особые условия (например, ты ведёшь крупное агентство или Telegram-канал на 50К+) —
            обсудим индивидуальные ставки.
          </p>
          <div className="space-y-2 pt-2">
            {[
              { icon: "Mail", label: "partners@mail-ka.ru", href: "mailto:partners@mail-ka.ru" },
              { icon: "MessageCircle", label: "Telegram: @mailka_partners", href: "https://t.me/mailka_partners" },
            ].map((c, i) => (
              <a key={i} href={c.href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Icon name={c.icon} size={14} />
                {c.label}
              </a>
            ))}
          </div>
        </div>

        <Card className="lg:col-span-3 p-6">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                <Icon name="Check" size={32} />
              </div>
              <div>
                <div className="text-xl font-bold">Заявка отправлена!</div>
                <div className="text-sm text-muted-foreground mt-1">Мы напишем тебе на email в течение 1 рабочего дня.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Имя</label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Иван Петров" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Email</label>
                  <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.ru" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Программа</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PROGRAMS.map((p) => (
                    <button key={p.id} type="button" onClick={() => setForm({ ...form, program: p.id as PartnerProgram })}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        form.program === p.id ? "border-violet-500 bg-violet-50/50" : "border-border hover:bg-secondary"
                      }`}>
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                        {p.id === "referral" ? "Реферальная" : p.id === "agency" ? "Агентство" : p.id === "whitelabel" ? "White Label" : "Технологическая"}
                      </div>
                      <div className="text-xs font-bold mt-0.5" style={{ color: p.color }}>
                        {p.revshare}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Канал продвижения</label>
                <Input value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  placeholder="Telegram-канал, блог, YouTube, агентство, клиенты CRM..." />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Аудитория и опыт</label>
                <Textarea rows={3} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  placeholder="Опиши свою аудиторию: размер, ниша. Сколько клиентов планируешь приводить в месяц." />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Icon name="ShieldCheck" size={12} />
                Нажимая «Отправить», ты соглашаешься с обработкой персональных данных по 152-ФЗ.
              </div>

              {submitError && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-xs"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626" }}>
                  <Icon name="AlertCircle" size={13} className="flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <Button type="submit" size="lg" disabled={submitting} className="w-full text-white"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                <Icon name={submitting ? "Loader2" : "Send"} size={16} className={`mr-2 ${submitting ? "animate-spin" : ""}`} />
                {submitting ? "Отправляем..." : "Отправить заявку"}
              </Button>
            </form>
          )}
        </Card>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-8 space-y-3">
        {stats.total_applications > 0 ? (
          <>
            <div className="text-2xl sm:text-3xl font-bold">
              Уже <span className="gradient-text">{stats.total_applications}</span> заявок от партнёров принято
            </div>
            {stats.active_partners > 0 && (
              <div className="text-sm text-muted-foreground">
                Активных партнёров: <span className="font-semibold text-foreground">{stats.active_partners}</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-2xl sm:text-3xl font-bold">
            Стань <span className="gradient-text">первым партнёром</span> MAIL-KA
          </div>
        )}
      </section>
    </>
  );
}
