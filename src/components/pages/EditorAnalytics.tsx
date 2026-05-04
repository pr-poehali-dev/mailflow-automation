import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchCampaigns, updateCampaign, sendTestEmail, sendCampaignBlast, Campaign } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { EditorVerifyBanner } from "./editor/EditorVerifyBanner";
import { TestSendPanel, BlastPanel } from "./editor/EditorPanels";
import { EditorForm } from "./editor/EditorForm";
import { Analytics } from "./editor/AnalyticsView";
import VisualBuilder, { EmailBlock, blocksToText } from "./editor/VisualBuilder";

// ─── EmailEditor ──────────────────────────────────────────────────────────────

export function EmailEditor() {
  const { user, resendVerification } = useAuth();
  const needVerify = !!user && user.is_email_verified === false;
  const [resending, setResending] = useState(false);
  const [resentMsg, setResentMsg] = useState<string | null>(null);

  const handleResendVerify = async () => {
    setResending(true);
    const r = await resendVerification();
    setResentMsg(r.ok ? "Письмо отправлено! Проверьте «Входящие» и «Спам»." : (r.error || "Не удалось отправить"));
    setResending(false);
    setTimeout(() => setResentMsg(null), 6000);
  };

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subject, setSubject] = useState("Специальное предложение только для вас 🔥");
  const [preheader, setPreheader] = useState("Успейте воспользоваться до конца недели");
  const [bodyText, setBodyText] = useState(
    "Привет, {{first_name}}!\n\nРады сообщить вам о нашем эксклюзивном предложении специально для клиентов сегмента «{{segment}}».\n\nСкидка 30% на все товары действует до {{expire_date}}.\n\nС уважением,\nКоманда {{company_name}}"
  );
  const [fromName, setFromName] = useState("MAIL-KA");
  const [fromEmail, setFromEmail] = useState("");

  // Маркировка рекламы по 38-ФЗ
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [advertiserName, setAdvertiserName] = useState("");
  const [advertiserInn, setAdvertiserInn] = useState("");
  const [erid, setErid] = useState("");

  // Test send
  const [showTest, setShowTest] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string; message?: string } | null>(null);

  // Blast
  const [showBlast, setShowBlast] = useState(false);
  const [blasting, setBlasting] = useState(false);
  const [blastResult, setBlastResult] = useState<{ ok: boolean; sent?: number; failed?: number; total?: number; error?: string; message?: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Режим редактирования: "text" — старый textarea, "visual" — drag&drop конструктор
  const [editorMode, setEditorMode] = useState<"text" | "visual">("text");
  const [blocks, setBlocks] = useState<EmailBlock[]>([
    { id: "b1", type: "heading", content: { text: "Привет, {{first_name}}!", color: "#0f172a", size: "28" } },
    { id: "b2", type: "text", content: { text: "Рады сообщить о специальном предложении только для вас.", color: "#334155" } },
    { id: "b3", type: "button", content: { text: "Перейти к предложению", url: "https://", bg: "#8b5cf6", color: "#ffffff" } },
  ]);

  // При переключении на текст — синхронизируем содержимое
  const handleSwitchMode = (mode: "text" | "visual") => {
    if (mode === "text" && editorMode === "visual") {
      setBodyText(blocksToText(blocks));
    }
    setEditorMode(mode);
  };

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
        setIsAdvertising(!!c.is_advertising);
        setAdvertiserName(c.advertiser_name || "");
        setAdvertiserInn(c.advertiser_inn || "");
        setErid(c.erid || "");
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
    setIsAdvertising(!!c.is_advertising);
    setAdvertiserName(c.advertiser_name || "");
    setAdvertiserInn(c.advertiser_inn || "");
    setErid(c.erid || "");
    setTestResult(null);
    setBlastResult(null);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    await updateCampaign(selectedId, {
      subject, preheader, body_text: bodyText,
      is_advertising: isAdvertising,
      advertiser_name: advertiserName,
      advertiser_inn: advertiserInn,
      erid,
    });
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
    await updateCampaign(selectedId, {
      subject, preheader, body_text: bodyText,
      is_advertising: isAdvertising,
      advertiser_name: advertiserName,
      advertiser_inn: advertiserInn,
      erid,
    });
    setBlasting(true);
    setBlastResult(null);
    const res = await sendCampaignBlast({ campaign_id: selectedId });
    setBlastResult(res);
    setBlasting(false);
    fetchCampaigns().then((d) => setCampaigns(d.campaigns));
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {needVerify && (
        <EditorVerifyBanner
          email={user?.email || ""}
          resending={resending}
          resentMsg={resentMsg}
          onResend={handleResendVerify}
        />
      )}
      <div className="fade-in-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Редактор писем</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Переменные · HTML-шаблон · Реальная отправка</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setShowTest(!showTest); setShowBlast(false); }}
            disabled={needVerify}
            title={needVerify ? "Подтвердите email, чтобы отправлять письма" : undefined}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon name={needVerify ? "Lock" : "Send"} size={15} />
            Тест-письмо
          </button>
          <button onClick={handleSave} disabled={saving || !selectedId}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8 transition-colors disabled:opacity-50">
            <Icon name={saved ? "Check" : "Save"} size={15} style={{ color: saved ? "#4ade80" : undefined }} />
            {saving ? "Сохраняем..." : saved ? "Сохранено!" : "Сохранить"}
          </button>
          <button onClick={() => { setShowBlast(!showBlast); setShowTest(false); }}
            disabled={!selectedId || needVerify}
            title={needVerify ? "Подтвердите email, чтобы запускать рассылки" : undefined}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <Icon name={needVerify ? "Lock" : "Rocket"} size={15} />
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

      {showTest && (
        <TestSendPanel
          testTo={testTo}
          setTestTo={setTestTo}
          fromName={fromName}
          setFromName={setFromName}
          testSending={testSending}
          testResult={testResult}
          needVerify={needVerify}
          onTest={handleTest}
        />
      )}

      {showBlast && (
        <BlastPanel
          blasting={blasting}
          blastResult={blastResult}
          selectedId={selectedId}
          needVerify={needVerify}
          onBlast={handleBlast}
        />
      )}

      {/* Переключатель режима редактирования */}
      <div className="flex items-center gap-1 p-1 rounded-xl glass w-fit">
        <button
          onClick={() => handleSwitchMode("text")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            editorMode === "text" ? "text-white" : "text-muted-foreground hover:text-foreground"
          }`}
          style={editorMode === "text" ? { background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" } : {}}>
          <Icon name="Type" size={13} />
          Текст
        </button>
        <button
          onClick={() => handleSwitchMode("visual")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            editorMode === "visual" ? "text-white" : "text-muted-foreground hover:text-foreground"
          }`}
          style={editorMode === "visual" ? { background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" } : {}}>
          <Icon name="LayoutGrid" size={13} />
          Визуальный конструктор
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md ml-1"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            НОВОЕ
          </span>
        </button>
      </div>

      {editorMode === "visual" ? (
        <VisualBuilder blocks={blocks} setBlocks={setBlocks} />
      ) : (
        <EditorForm
          subject={subject}
          setSubject={setSubject}
          preheader={preheader}
          setPreheader={setPreheader}
          bodyText={bodyText}
          setBodyText={setBodyText}
          fromName={fromName}
          setFromName={setFromName}
          fromEmail={fromEmail}
          setFromEmail={setFromEmail}
          isAdvertising={isAdvertising}
          setIsAdvertising={setIsAdvertising}
          advertiserName={advertiserName}
          setAdvertiserName={setAdvertiserName}
          advertiserInn={advertiserInn}
          setAdvertiserInn={setAdvertiserInn}
          erid={erid}
          setErid={setErid}
          variables={variables}
        />
      )}
    </div>
  );
}

// ─── Analytics (re-export) ────────────────────────────────────────────────────

export { Analytics };