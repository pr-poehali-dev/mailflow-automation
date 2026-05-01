import { useState } from "react";
import Icon from "@/components/ui/icon";
import { aiGenerate, aiImprove, aiSubjects, aiSpamCheck, aiPredict } from "@/api/index";
import type { AiSubjectVariant, AiSpamCheck, AiPredict } from "@/api/index";

interface Props {
  subject: string;
  body: string;
  onApplySubject: (s: string) => void;
  onApplyBody: (b: string) => void;
  onApplyAll: (data: { subject: string; preheader: string; body: string }) => void;
}

type Tab = "generate" | "subjects" | "improve" | "check" | "predict";

const MODELS = [
  { id: "openai/gpt-4o-mini",          name: "GPT-4o mini",     desc: "Быстрая, дешёвая",    icon: "Zap",      color: "#10b981", price: "₽0.10/100" },
  { id: "openai/gpt-4o",               name: "GPT-4o",          desc: "Топ от OpenAI",       icon: "Crown",    color: "#8b5cf6", price: "₽1.50/100" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5",      desc: "Лучший копирайтер",   icon: "Sparkles", color: "#ec4899", price: "₽1.20/100" },
  { id: "anthropic/claude-3.5-haiku",  name: "Claude Haiku",    desc: "Шустрый Anthropic",   icon: "Wind",     color: "#f59e0b", price: "₽0.30/100" },
  { id: "deepseek/deepseek-chat",      name: "DeepSeek",        desc: "Недорогой китаец",    icon: "Cpu",      color: "#06b6d4", price: "₽0.05/100" },
  { id: "google/gemini-2.0-flash",     name: "Gemini 2.0",      desc: "Google Flash",        icon: "Star",     color: "#0891b2", price: "₽0.15/100" },
  { id: "meta-llama/llama-3.3-70b",    name: "Llama 3.3 70B",   desc: "Open-source Meta",    icon: "Box",      color: "#7c3aed", price: "₽0.20/100" },
];

export function AiAssistant({ subject, body, onApplySubject, onApplyBody, onApplyAll }: Props) {
  const [tab, setTab] = useState<Tab>("generate");
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const currentModel = MODELS.find((m) => m.id === model) || MODELS[0];

  // Generate
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("дружелюбный");
  const [goal, setGoal] = useState("продажа");
  const [audience, setAudience] = useState("клиенты");
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ subject: string; preheader: string; body: string; cta_text: string } | null>(null);

  // Subjects
  const [subjects, setSubjectsState] = useState<AiSubjectVariant[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Improve
  const [instruction, setInstruction] = useState("");
  const [improving, setImproving] = useState(false);
  const [improvedText, setImprovedText] = useState("");

  // Spam check
  const [spamResult, setSpamResult] = useState<AiSpamCheck | null>(null);
  const [checking, setChecking] = useState(false);

  // Predict
  const [predictResult, setPredictResult] = useState<AiPredict | null>(null);
  const [predicting, setPredicting] = useState(false);

  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setGenerating(true); setError(""); setGenResult(null);
    const r = await aiGenerate({ brief, tone, audience, goal, model });
    setGenerating(false);
    if (!r.ok) { setError(r.error || "Ошибка"); return; }
    setGenResult({
      subject: r.subject || "",
      preheader: r.preheader || "",
      body: r.body || "",
      cta_text: r.cta_text || "",
    });
  };

  const handleSubjects = async () => {
    if (!body.trim()) { setError("Сначала напиши текст письма"); return; }
    setLoadingSubjects(true); setError("");
    const r = await aiSubjects(body, brief, model);
    setLoadingSubjects(false);
    if (!r.ok) { setError(r.error || "Ошибка"); return; }
    setSubjectsState(r.variants || []);
  };

  const handleImprove = async (preset?: string) => {
    const inst = preset || instruction;
    if (!body.trim() || !inst) return;
    setImproving(true); setError(""); setImprovedText("");
    const r = await aiImprove(body, inst, model);
    setImproving(false);
    if (!r.ok) { setError(r.error || "Ошибка"); return; }
    setImprovedText(r.text || "");
  };

  const handleSpamCheck = async () => {
    if (!subject && !body) return;
    setChecking(true); setError(""); setSpamResult(null);
    const r = await aiSpamCheck(subject, body, model);
    setChecking(false);
    if (!r.ok) { setError("Ошибка"); return; }
    setSpamResult(r);
  };

  const handlePredict = async () => {
    if (!subject.trim()) { setError("Введи тему письма"); return; }
    setPredicting(true); setError(""); setPredictResult(null);
    const r = await aiPredict(subject, model);
    setPredicting(false);
    if (!r.ok) { setError("Ошибка"); return; }
    setPredictResult(r);
  };

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "generate", icon: "Sparkles", label: "Сгенерировать" },
    { id: "subjects", icon: "Lightbulb", label: "Темы" },
    { id: "improve", icon: "Wand2", label: "Улучшить" },
    { id: "check", icon: "Shield", label: "Spam-чек" },
    { id: "predict", icon: "TrendingUp", label: "Прогноз" },
  ];

  return (
    <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.25)", boxShadow: "0 8px 32px rgba(139,92,246,0.12)" }}>
      <div className="px-4 py-3 border-b border-border flex items-center gap-2"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.04))" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          <Icon name="Sparkles" size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">AI-ассистент</div>
          <div className="text-[10px] text-muted-foreground truncate">polza.ai · копирайтинг и аналитика</div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowModelPicker((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg glass hover:bg-white/8 transition-colors text-xs">
            <Icon name={currentModel.icon} size={11} style={{ color: currentModel.color }} />
            <span className="font-semibold">{currentModel.name}</span>
            <Icon name="ChevronDown" size={10} className="text-muted-foreground" />
          </button>
          {showModelPicker && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowModelPicker(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-xl glass shadow-2xl overflow-hidden fade-in-up"
                style={{ border: "1px solid rgba(139,92,246,0.25)" }}>
                <div className="px-3 py-2 border-b border-border">
                  <div className="text-xs font-semibold">Выбери модель</div>
                  <div className="text-[10px] text-muted-foreground">Цена за 100 запросов</div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {MODELS.map((m) => (
                    <button key={m.id}
                      onClick={() => { setModel(m.id); setShowModelPicker(false); }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors ${
                        m.id === model ? "bg-white/5" : ""
                      }`}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${m.color}15`, border: `1px solid ${m.color}30` }}>
                        <Icon name={m.icon} size={13} style={{ color: m.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          {m.name}
                          {m.id === model && <Icon name="Check" size={10} style={{ color: "#10b981" }} />}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{m.desc}</div>
                      </div>
                      <span className="text-[9px] font-mono-custom text-muted-foreground flex-shrink-0">{m.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 border-b border-border">
        {tabs.map((t) => (
          <button key={t.id}
            onClick={() => { setTab(t.id); setError(""); }}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
              tab === t.id ? "text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            style={tab === t.id ? { background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" } : {}}>
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <div className="text-xs p-2 rounded-lg flex items-center gap-2"
            style={{ background: "rgba(248,113,113,0.1)", color: "#dc2626" }}>
            <Icon name="AlertCircle" size={12} />{error}
          </div>
        )}

        {/* GENERATE */}
        {tab === "generate" && (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">О чём письмо? *</label>
              <textarea
                rows={2}
                placeholder="Распродажа кроссовок -30% на этой неделе"
                className="w-full bg-background/60 border border-border rounded-lg px-2.5 py-2 text-xs outline-none focus:border-purple-500 resize-none"
                value={brief} onChange={(e) => setBrief(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <select value={tone} onChange={(e) => setTone(e.target.value)}
                className="bg-background/60 border border-border rounded-lg px-1.5 py-1.5 text-[11px] outline-none">
                <option>дружелюбный</option>
                <option>профессиональный</option>
                <option>дерзкий</option>
                <option>тёплый</option>
                <option>срочный</option>
              </select>
              <select value={goal} onChange={(e) => setGoal(e.target.value)}
                className="bg-background/60 border border-border rounded-lg px-1.5 py-1.5 text-[11px] outline-none">
                <option>продажа</option>
                <option>анонс</option>
                <option>welcome</option>
                <option>реактивация</option>
                <option>опрос</option>
              </select>
              <input value={audience} onChange={(e) => setAudience(e.target.value)}
                placeholder="b2b, женщины 25+"
                className="bg-background/60 border border-border rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-purple-500" />
            </div>
            <button onClick={handleGenerate} disabled={generating || !brief.trim()}
              className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              {generating ? <><Icon name="Loader2" size={12} className="animate-spin" />Генерируем...</> : <><Icon name="Sparkles" size={12} />Написать письмо</>}
            </button>

            {genResult && (
              <div className="rounded-xl p-3 space-y-2 fade-in-up" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Тема</div>
                  <div className="text-sm font-semibold">{genResult.subject}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Текст</div>
                  <div className="text-xs whitespace-pre-wrap leading-relaxed">{genResult.body}</div>
                </div>
                {genResult.cta_text && (
                  <div className="inline-block px-3 py-1 rounded-lg text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                    {genResult.cta_text}
                  </div>
                )}
                <button onClick={() => onApplyAll(genResult)}
                  className="w-full py-1.5 rounded-lg text-xs font-medium glass hover:bg-white/8 flex items-center justify-center gap-1.5">
                  <Icon name="Check" size={12} />Применить в редактор
                </button>
              </div>
            )}
          </>
        )}

        {/* SUBJECTS */}
        {tab === "subjects" && (
          <>
            <p className="text-xs text-muted-foreground">AI придумает 5 кардинально разных вариантов темы для твоего письма</p>
            <button onClick={handleSubjects} disabled={loadingSubjects || !body.trim()}
              className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              {loadingSubjects ? <><Icon name="Loader2" size={12} className="animate-spin" />Думаем...</> : <><Icon name="Lightbulb" size={12} />Придумать темы</>}
            </button>
            {subjects.length > 0 && (
              <div className="space-y-1.5 fade-in-up">
                {subjects.map((v, i) => (
                  <button key={i} onClick={() => onApplySubject(v.text)}
                    className="w-full text-left p-2.5 rounded-lg glass hover:bg-white/8 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>{v.type}</span>
                      <span className="text-xs font-semibold flex-1">{v.text}</span>
                      <Icon name="ArrowRight" size={11} className="text-muted-foreground" />
                    </div>
                    {v.why && <div className="text-[10px] text-muted-foreground mt-1">{v.why}</div>}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* IMPROVE */}
        {tab === "improve" && (
          <>
            <p className="text-xs text-muted-foreground">Быстрые улучшения текста:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Короче", instr: "сделай в 2 раза короче, оставь суть" },
                { label: "Дружелюбнее", instr: "сделай теплее и дружелюбнее" },
                { label: "Профессиональнее", instr: "сделай профессиональнее, для b2b" },
                { label: "Эмоциональнее", instr: "добавь эмоций и энергии" },
                { label: "Простыми словами", instr: "перепиши простым языком" },
                { label: "Под Gen Z", instr: "перепиши на языке поколения Z" },
              ].map((p, i) => (
                <button key={i} onClick={() => handleImprove(p.instr)} disabled={improving || !body.trim()}
                  className="py-1.5 px-2 rounded-lg text-[11px] font-medium glass hover:bg-white/8 disabled:opacity-50">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input value={instruction} onChange={(e) => setInstruction(e.target.value)}
                placeholder="Свой запрос: добавь юмор..."
                className="flex-1 bg-background/60 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-purple-500" />
              <button onClick={() => handleImprove()} disabled={improving || !instruction.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                {improving ? <Icon name="Loader2" size={11} className="animate-spin" /> : "→"}
              </button>
            </div>
            {improvedText && (
              <div className="rounded-xl p-3 space-y-2 fade-in-up"
                style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <div className="text-[10px] uppercase tracking-wide" style={{ color: "#06b6d4" }}>Улучшенная версия</div>
                <div className="text-xs whitespace-pre-wrap">{improvedText}</div>
                <button onClick={() => onApplyBody(improvedText)}
                  className="w-full py-1.5 rounded-lg text-xs font-medium glass hover:bg-white/8 flex items-center justify-center gap-1.5">
                  <Icon name="Check" size={12} />Заменить в редакторе
                </button>
              </div>
            )}
          </>
        )}

        {/* SPAM CHECK */}
        {tab === "check" && (
          <>
            <p className="text-xs text-muted-foreground">AI проверит письмо на спам-триггеры и читабельность</p>
            <button onClick={handleSpamCheck} disabled={checking || (!subject && !body)}
              className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              {checking ? <><Icon name="Loader2" size={12} className="animate-spin" />Проверяем...</> : <><Icon name="Shield" size={12} />Проверить</>}
            </button>
            {spamResult && (
              <div className="space-y-2 fade-in-up">
                <div className="rounded-xl p-3" style={{
                  background: spamResult.spam_score < 30 ? "rgba(74,222,128,0.08)" : spamResult.spam_score < 60 ? "rgba(251,146,60,0.08)" : "rgba(248,113,113,0.08)",
                  border: `1px solid ${spamResult.spam_score < 30 ? "rgba(74,222,128,0.3)" : spamResult.spam_score < 60 ? "rgba(251,146,60,0.3)" : "rgba(248,113,113,0.3)"}`,
                }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Спам-индекс</span>
                    <span className="text-2xl font-bold" style={{
                      color: spamResult.spam_score < 30 ? "#16a34a" : spamResult.spam_score < 60 ? "#ea580c" : "#dc2626",
                    }}>{spamResult.spam_score}/100</span>
                  </div>
                  <div className="text-[10px] mt-1 text-muted-foreground">Читабельность: {spamResult.readability}</div>
                </div>
                {spamResult.issues?.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Проблемы</div>
                    {spamResult.issues.map((i, idx) => (
                      <div key={idx} className="text-xs flex items-start gap-1.5 py-0.5">
                        <Icon name="AlertTriangle" size={11} style={{ color: "#ea580c", marginTop: 2 }} />{i}
                      </div>
                    ))}
                  </div>
                )}
                {spamResult.suggestions?.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Что улучшить</div>
                    {spamResult.suggestions.map((s, idx) => (
                      <div key={idx} className="text-xs flex items-start gap-1.5 py-0.5">
                        <Icon name="Lightbulb" size={11} style={{ color: "#06b6d4", marginTop: 2 }} />{s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* PREDICT */}
        {tab === "predict" && (
          <>
            <p className="text-xs text-muted-foreground">AI предскажет open rate этой темы</p>
            <button onClick={handlePredict} disabled={predicting || !subject.trim()}
              className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              {predicting ? <><Icon name="Loader2" size={12} className="animate-spin" />Анализируем...</> : <><Icon name="TrendingUp" size={12} />Предсказать open rate</>}
            </button>
            {predictResult && (
              <div className="rounded-xl p-4 fade-in-up"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(6,182,212,0.04))",
                         border: "1px solid rgba(139,92,246,0.2)" }}>
                <div className="text-center mb-3">
                  <div className="text-4xl font-bold gradient-text">{predictResult.predicted_open_rate}%</div>
                  <div className="text-xs text-muted-foreground mt-0.5">прогноз open rate</div>
                  <div className="text-xs font-semibold mt-1" style={{
                    color: predictResult.rating === "отлично" ? "#16a34a" :
                           predictResult.rating === "хорошо" ? "#06b6d4" :
                           predictResult.rating === "средне" ? "#ea580c" : "#dc2626",
                  }}>Оценка: {predictResult.rating}</div>
                </div>
                <div className="text-xs text-muted-foreground border-t border-border pt-2">{predictResult.reason}</div>
                {predictResult.improvements?.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Как улучшить</div>
                    {predictResult.improvements.map((s, idx) => (
                      <div key={idx} className="text-xs flex items-start gap-1.5 py-0.5">
                        <span style={{ color: "#8b5cf6" }}>{idx + 1}.</span>{s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AiAssistant;