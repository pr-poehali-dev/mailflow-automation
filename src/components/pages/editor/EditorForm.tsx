import Icon from "@/components/ui/icon";

interface Props {
  subject: string;
  setSubject: (v: string) => void;
  preheader: string;
  setPreheader: (v: string) => void;
  bodyText: string;
  setBodyText: (updater: string | ((t: string) => string)) => void;
  fromName: string;
  setFromName: (v: string) => void;
  fromEmail: string;
  setFromEmail: (v: string) => void;
  isAdvertising: boolean;
  setIsAdvertising: (v: boolean) => void;
  advertiserName: string;
  setAdvertiserName: (v: string) => void;
  advertiserInn: string;
  setAdvertiserInn: (v: string) => void;
  erid: string;
  setErid: (v: string) => void;
  variables: string[];
}

export function EditorForm({
  subject, setSubject, preheader, setPreheader,
  bodyText, setBodyText,
  fromName, setFromName, fromEmail, setFromEmail,
  isAdvertising, setIsAdvertising,
  advertiserName, setAdvertiserName,
  advertiserInn, setAdvertiserInn,
  erid, setErid,
  variables,
}: Props) {
  return (
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

        {/* Маркировка рекламы — 38-ФЗ */}
        <div className="rounded-2xl p-4 space-y-3 fade-in-up"
          style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={isAdvertising}
              onChange={(e) => setIsAdvertising(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-amber-500" />
            <div className="flex-1">
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <Icon name="Scale" size={13} style={{ color: "#f59e0b" }} />
                Это рекламное письмо (38-ФЗ)
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Включите, если содержимое письма продвигает товары/услуги. В тему добавится <span className="font-mono">[Реклама]</span>,
                в начало и подвал каждого письма — блок «Реклама · Название · ИНН · erid».
              </div>
            </div>
          </label>

          {isAdvertising && (
            <div className="space-y-3 pl-7 fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium mb-1 block">
                    Наименование рекламодателя
                  </label>
                  <input value={advertiserName} onChange={(e) => setAdvertiserName(e.target.value)}
                    placeholder='ООО "Ваша компания"'
                    className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-500 transition-colors" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-medium mb-1 block">
                    ИНН рекламодателя *
                  </label>
                  <input value={advertiserInn} onChange={(e) => setAdvertiserInn(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="7712345678"
                    inputMode="numeric"
                    className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-amber-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium mb-1 block flex items-center gap-1.5">
                  Токен ОРД (erid)
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>обязательно для интернет-рекламы</span>
                </label>
                <input value={erid} onChange={(e) => setErid(e.target.value.trim())}
                  placeholder="Pb3XmBtzt..."
                  className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-amber-500 transition-colors" />
                <div className="text-[10px] text-muted-foreground mt-1">
                  Токен получается у Оператора Рекламных Данных (Яндекс ОРД, ОРД-А, Первый ОРД и др.) перед запуском кампании.
                  Сервис автоматически добавит его в письма, но отчётность в ЕРИР подаёт рекламодатель.
                </div>
              </div>

              {/* Превью маркировки */}
              <div className="rounded-lg p-2.5 text-[11px]"
                style={{ background: "rgba(0,0,0,0.15)", border: "1px dashed rgba(245,158,11,0.4)" }}>
                <div className="text-[10px] text-muted-foreground mb-1">Так будет выглядеть пометка в письме:</div>
                <div className="font-mono text-amber-400">
                  {["Реклама",
                    advertiserName || null,
                    advertiserInn ? `ИНН ${advertiserInn}` : null,
                    erid ? `erid: ${erid}` : null,
                  ].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
          )}
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
  );
}

export default EditorForm;
