import Icon from "@/components/ui/icon";

interface TestPanelProps {
  testTo: string;
  setTestTo: (v: string) => void;
  fromName: string;
  setFromName: (v: string) => void;
  testSending: boolean;
  testResult: { ok: boolean; error?: string; message?: string } | null;
  needVerify: boolean;
  onTest: () => void;
}

export function TestSendPanel({
  testTo, setTestTo, fromName, setFromName,
  testSending, testResult, needVerify, onTest,
}: TestPanelProps) {
  return (
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
        <button onClick={onTest} disabled={testSending || !testTo.trim() || needVerify}
          title={needVerify ? "Подтвердите email" : undefined}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          {testSending ? <><Icon name="Loader2" size={14} className="animate-spin" />Отправляем...</>
                      : needVerify ? <><Icon name="Lock" size={14} />Подтвердите email</>
                      : <><Icon name="Send" size={14} />Отправить тест</>}
        </button>
        {testResult && (
          <div className={`text-sm flex items-center gap-2 ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
            <Icon name={testResult.ok ? "CheckCircle" : "XCircle"} size={15} />
            {testResult.ok ? "Письмо отправлено! Проверь почту." : `Ошибка: ${testResult.message || testResult.error}`}
          </div>
        )}
      </div>
    </div>
  );
}

interface BlastPanelProps {
  blasting: boolean;
  blastResult: { ok: boolean; sent?: number; failed?: number; total?: number; error?: string; message?: string } | null;
  selectedId: number | null;
  needVerify: boolean;
  onBlast: () => void;
}

export function BlastPanel({ blasting, blastResult, selectedId, needVerify, onBlast }: BlastPanelProps) {
  return (
    <div className="rounded-2xl p-4 space-y-3 fade-in-up" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
      <div className="text-sm font-semibold flex items-center gap-2">
        <Icon name="Rocket" size={14} style={{ color: "#8b5cf6" }} />
        Массовая рассылка по всем активным контактам
      </div>
      <p className="text-xs text-muted-foreground">{"Письмо будет отправлено каждому активному контакту. Переменные {{first_name}} и другие заменятся автоматически."}</p>

      {/* Чеклист 38-ФЗ */}
      <div className="rounded-xl p-3 space-y-1.5"
        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
        <div className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: "#f59e0b" }}>
          <Icon name="Scale" size={12} />
          Перед запуском проверьте соответствие 38-ФЗ «О рекламе»
        </div>
        <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-1">
          <li>· У вас есть подтверждённое согласие адресатов на получение рекламы (ст. 18 38-ФЗ)</li>
          <li>· В письме указан рекламодатель и его контакты, есть ссылка на отписку в 1 клик</li>
          <li>· Для рекламы — пометка «Реклама», ИНН и токен <span className="font-mono">erid</span> (ОРД)</li>
          <li>· Вы как пользователь сервиса выступаете рекламодателем и несёте ответственность за рассылку</li>
        </ul>
      </div>
      {blastResult ? (
        <div className={`rounded-xl p-3 text-sm ${blastResult.ok ? "text-green-400" : "text-red-400"}`}
          style={{ background: blastResult.ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)" }}>
          {blastResult.ok
            ? `✓ Готово! Отправлено ${blastResult.sent} из ${blastResult.total} писем${blastResult.failed ? `, ${blastResult.failed} ошибок` : ""}.`
            : `Ошибка: ${blastResult.message || blastResult.error || "не удалось отправить"}`}
        </div>
      ) : (
        <button onClick={onBlast} disabled={blasting || !selectedId || needVerify}
          title={needVerify ? "Подтвердите email" : undefined}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          {blasting ? <><Icon name="Loader2" size={14} className="animate-spin" />Отправляем...</>
                   : needVerify ? <><Icon name="Lock" size={14} />Подтвердите email</>
                   : <><Icon name="Rocket" size={14} />Запустить</>}
        </button>
      )}
    </div>
  );
}
