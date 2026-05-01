import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { chartData } from "@/data/mockData";
import { fetchCampaigns, updateCampaign, sendTestEmail, sendCampaignBlast, Campaign } from "@/api";

// ─── EmailEditor ──────────────────────────────────────────────────────────────

export function EmailEditor() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subject, setSubject] = useState("Специальное предложение только для вас 🔥");
  const [preheader, setPreheader] = useState("Успейте воспользоваться до конца недели");
  const [bodyText, setBodyText] = useState(
    "Привет, {{first_name}}!\n\nРады сообщить вам о нашем эксклюзивном предложении специально для клиентов сегмента «{{segment}}».\n\nСкидка 30% на все товары действует до {{expire_date}}.\n\nС уважением,\nКоманда {{company_name}}"
  );
  const [fromName, setFromName] = useState("MAIL-KA");
  const [fromEmail, setFromEmail] = useState("");

  // Test send
  const [showTest, setShowTest] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  // Blast
  const [showBlast, setShowBlast] = useState(false);
  const [blasting, setBlasting] = useState(false);
  const [blastResult, setBlastResult] = useState<{ ok: boolean; sent?: number; failed?: number; total?: number } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const variables = ["{{first_name}}", "{{last_name}}", "{{email}}", "{{segment}}", "{{company_name}}", "{{expire_date}}"];

  useEffect(() => {
    fetchCampaigns().then((d) => {
      setCampaigns(d.campaigns);
      if (d.campaigns.length > 0) {
        const c = d.campaigns[0];
        setSelectedId(c.id);
        if (c.subject) setSubject(c.subject);
        if (c.preheader) setPreheader(c.preheader);
        if (c.body_text) setBodyText(c.body_text);
      }
    });
  }, []);

  const handleSelectCampaign = (id: number) => {
    const c = campaigns.find((x) => x.id === id);
    if (!c) return;
    setSelectedId(id);
    setSubject(c.subject || "");
    setPreheader(c.preheader || "");
    setBodyText(c.body_text || "");
    setTestResult(null);
    setBlastResult(null);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    await updateCampaign(selectedId, { subject, preheader, body_text: bodyText });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    fetchCampaigns().then((d) => setCampaigns(d.campaigns));
  };

  const handleTest = async () => {
    if (!testTo.trim()) return;
    setTestSending(true);
    setTestResult(null);
    const res = await sendTestEmail({ to: testTo, subject, text: bodyText, from_name: fromName, from_email: fromEmail });
    setTestResult(res);
    setTestSending(false);
  };

  const handleBlast = async () => {
    if (!selectedId) return;
    // Сначала сохраняем
    await updateCampaign(selectedId, { subject, preheader, body_text: bodyText });
    setBlasting(true);
    setBlastResult(null);
    const res = await sendCampaignBlast({ campaign_id: selectedId });
    setBlastResult(res);
    setBlasting(false);
    fetchCampaigns().then((d) => setCampaigns(d.campaigns));
  };

  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Редактор писем</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Переменные · HTML-шаблон · Реальная отправка</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setShowTest(!showTest); setShowBlast(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8 transition-colors">
            <Icon name="Send" size={15} />
            Тест-письмо
          </button>
          <button onClick={handleSave} disabled={saving || !selectedId}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8 transition-colors disabled:opacity-50">
            <Icon name={saved ? "Check" : "Save"} size={15} style={{ color: saved ? "#4ade80" : undefined }} />
            {saving ? "Сохраняем..." : saved ? "Сохранено!" : "Сохранить"}
          </button>
          <button onClick={() => { setShowBlast(!showBlast); setShowTest(false); }}
            disabled={!selectedId}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <Icon name="Rocket" size={15} />
            Запустить рассылку
          </button>
        </div>
      </div>

      {/* Campaign picker */}
      {campaigns.length > 0 && (
        <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
          <Icon name="Mail" size={15} className="text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground flex-shrink-0">Кампания:</span>
          <select
            value={selectedId ?? ""}
            onChange={(e) => handleSelectCampaign(Number(e.target.value))}
            className="bg-transparent text-sm outline-none flex-1 cursor-pointer">
            {campaigns.map((c) => (
              <option key={c.id} value={c.id} className="bg-background">{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Test send panel */}
      {showTest && (
        <div className="glass rounded-2xl p-4 space-y-3 fade-in-up">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Icon name="Send" size={14} style={{ color: "#06b6d4" }} />
            Тест-отправка — письмо придёт на твой email
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Кому *</label>
              <input className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                placeholder="your@email.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Имя отправителя</label>
              <input className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                value={fromName} onChange={(e) => setFromName(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <button onClick={handleTest} disabled={testSending || !testTo.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              {testSending ? <><Icon name="Loader2" size={14} className="animate-spin" />Отправляем...</> : <><Icon name="Send" size={14} />Отправить тест</>}
            </button>
            {testResult && (
              <div className={`text-sm flex items-center gap-2 ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
                <Icon name={testResult.ok ? "CheckCircle" : "XCircle"} size={15} />
                {testResult.ok ? "Письмо отправлено! Проверь почту." : `Ошибка: ${testResult.error}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blast panel */}
      {showBlast && (
        <div className="rounded-2xl p-4 space-y-3 fade-in-up" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
          <div className="text-sm font-semibold flex items-center gap-2">
            <Icon name="Rocket" size={14} style={{ color: "#8b5cf6" }} />
            Массовая рассылка по всем активным контактам
          </div>
          <p className="text-xs text-muted-foreground">{"Письмо будет отправлено каждому активному контакту. Переменные {{first_name}} и другие заменятся автоматически."}</p>
          {blastResult ? (
            <div className={`rounded-xl p-3 text-sm ${blastResult.ok ? "text-green-400" : "text-red-400"}`}
              style={{ background: blastResult.ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)" }}>
              {blastResult.ok
                ? `✓ Готово! Отправлено ${blastResult.sent} из ${blastResult.total} писем${blastResult.failed ? `, ${blastResult.failed} ошибок` : ""}.`
                : "Ошибка при отправке"}
            </div>
          ) : (
            <button onClick={handleBlast} disabled={blasting || !selectedId}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              {blasting ? <><Icon name="Loader2" size={14} className="animate-spin" />Отправляем...</> : <><Icon name="Rocket" size={14} />Запустить</>}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 space-y-4">
          <div className="glass rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Тема письма *</label>
                <input className="w-full bg-background/60 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
                  value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Прехедер</label>
                <input className="w-full bg-background/60 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
                  value={preheader} onChange={(e) => setPreheader(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Email preview */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border text-xs text-muted-foreground">
              <Icon name="Mail" size={13} />
              Предпросмотр письма
              <span className="ml-auto" style={{ color: "#8b5cf6" }}>{fromName || "MAIL-KA"}</span>
            </div>
            <div className="p-4" style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.04), transparent)" }}>
              <div className="max-w-lg mx-auto rounded-xl overflow-hidden shadow-lg" style={{ background: "#ffffff", border: "1px solid rgba(139,92,246,0.15)" }}>
                <div className="p-6 text-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                  <div className="text-white font-bold text-lg">{fromName || "MAIL-KA"}</div>
                  <div className="text-white/80 text-sm mt-1">{subject || "Тема письма"}</div>
                </div>
                <div className="p-6">
                  <textarea
                    className="w-full bg-transparent text-sm outline-none resize-none leading-relaxed"
                    style={{ color: "#1f2937" }}
                    rows={10}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Введи текст письма..."
                  />
                </div>
                <div className="px-6 pb-6 text-center">
                  <div className="inline-block px-6 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                    Перейти к предложению →
                  </div>
                </div>
                <div className="px-6 py-4 text-center text-xs border-t" style={{ color: "#94a3b8", borderColor: "rgba(0,0,0,0.06)" }}>
                  Отписаться · Настройки · {fromName || "MAIL-KA"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Icon name="Variable" size={15} style={{ color: "#8b5cf6" }} />
              Переменные
            </div>
            <div className="space-y-1.5">
              {variables.map((v) => (
                <button key={v}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono-custom hover:bg-white/8 transition-colors"
                  style={{ color: "#06b6d4" }}
                  onClick={() => setBodyText((t) => t + " " + v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Icon name="User" size={15} style={{ color: "#ec4899" }} />
              Отправитель
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Имя</label>
                <input className="w-full bg-background/60 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500 transition-colors"
                  value={fromName} onChange={(e) => setFromName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email (опционально)</label>
                <input className="w-full bg-background/60 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500 transition-colors"
                  placeholder="noreply@yourdomain.ru" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Icon name="Blocks" size={15} style={{ color: "#fb923c" }} />
              Блоки
            </div>
            <div className="space-y-1.5">
              {["Заголовок", "Текст", "Кнопка", "Изображение", "Разделитель", "Соцсети"].map((b) => (
                <button key={b} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/8 transition-colors text-muted-foreground hover:text-foreground">
                  + {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function Analytics() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns().then((d) => {
      setCampaigns(d.campaigns);
      setLoading(false);
    });
  }, []);

  const delivStats = [
    { label: "Доставлено", value: "98.4%", color: "#4ade80", icon: "CheckCircle" },
    { label: "Открыто", value: "27.4%", color: "#06b6d4", icon: "MailOpen" },
    { label: "Кликнуто", value: "8.1%", color: "#8b5cf6", icon: "MousePointer" },
    { label: "Отписок", value: "0.3%", color: "#fb923c", icon: "UserMinus" },
  ];
  const maxBar = Math.max(...chartData.map((d) => d.opens));

  const totalSent = campaigns.reduce((s, c) => s + c.sent_count, 0);
  const topCampaigns = [...campaigns].filter((c) => c.open_rate > 0).sort((a, b) => b.open_rate - a.open_rate).slice(0, 4);

  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up">
        <h1 className="text-2xl font-bold">Аналитика</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Доставка · Открытия · Клики · Отписки</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {delivStats.map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 metric-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={s.icon} size={16} style={{ color: s.color }} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="mt-2 h-1 rounded-full bg-white/5">
              <div className="h-full rounded-full" style={{ width: s.value, background: s.color, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Динамика за 7 дней</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full inline-block" style={{ background: "#8b5cf6" }} />Открытия</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full inline-block" style={{ background: "#06b6d4" }} />Клики</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex gap-1 items-end" style={{ height: 120 }}>
                  <div className="flex-1 rounded-t-md chart-bar"
                    style={{ height: `${(d.opens / maxBar) * 100}%`, background: "linear-gradient(180deg, #8b5cf6, rgba(139,92,246,0.3))", animationDelay: `${i * 0.08}s` }} />
                  <div className="flex-1 rounded-t-md chart-bar"
                    style={{ height: `${(d.clicks / maxBar) * 100}%`, background: "linear-gradient(180deg, #06b6d4, rgba(6,182,212,0.3))", animationDelay: `${i * 0.08 + 0.04}s` }} />
                </div>
                <span className="text-xs text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Итого отправлено</h2>
          <div className="text-4xl font-bold gradient-text">{loading ? "..." : totalSent.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">писем за всё время</div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Кампаний</span>
              <span>{campaigns.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Активных</span>
              <span className="text-green-400">{campaigns.filter((c) => c.status === "active").length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Черновиков</span>
              <span className="text-muted-foreground">{campaigns.filter((c) => c.status === "draft").length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-semibold">Топ кампании по открытиям</div>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
            <Icon name="Loader2" size={15} className="animate-spin" />Загружаем...
          </div>
        ) : topCampaigns.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Нет данных — запусти кампанию</div>
        ) : (
          <div className="divide-y divide-border">
            {topCampaigns.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors">
                <span className="text-2xl font-bold text-muted-foreground/30 w-6 text-center">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.sent_count.toLocaleString()} отправлено</div>
                </div>
                <div className="text-right">
                  <div className="font-mono-custom font-bold" style={{ color: "#4ade80" }}>{c.open_rate}%</div>
                  <div className="text-xs text-muted-foreground">Open Rate</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}