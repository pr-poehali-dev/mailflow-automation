import Icon from "@/components/ui/icon";

interface Props {
  email: string;
  resending: boolean;
  resentMsg: string | null;
  onResend: () => void;
}

export function EditorVerifyBanner({ email, resending, resentMsg, onResend }: Props) {
  return (
    <div className="rounded-xl p-3 flex items-center gap-3 fade-in-up"
      style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.12), rgba(236,72,153,0.06))",
               border: "1px solid rgba(245,158,11,0.35)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(245,158,11,0.2)" }}>
        <Icon name="ShieldAlert" size={15} style={{ color: "#f59e0b" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold">Отправка писем заблокирована до подтверждения email</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {resentMsg || "Это защита от спам-ботов. Проверьте почту по адресу " + email + " и перейдите по ссылке из письма."}
        </div>
      </div>
      <button onClick={onResend} disabled={resending}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-60 flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #f59e0b, #ec4899)" }}>
        {resending ? <><Icon name="Loader2" size={11} className="animate-spin" />Отправляем</>
                   : <><Icon name="Send" size={11} />Отправить письмо</>}
      </button>
    </div>
  );
}

export default EditorVerifyBanner;
