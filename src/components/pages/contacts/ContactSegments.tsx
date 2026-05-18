import Icon from "@/components/ui/icon";
import { Contact } from "@/api";

interface Props {
  contacts: Contact[];
  activeSegment: string;
  onChange: (label: string) => void;
}

const SEGMENTS = [
  { label: "Все", color: "#8b5cf6" },
  { label: "VIP", color: "#fb923c" },
  { label: "Активный", color: "#4ade80" },
  { label: "Спящий", color: "#94a3b8" },
  { label: "Новый", color: "#06b6d4" },
];

export default function ContactSegments({ contacts, activeSegment, onChange }: Props) {
  const segmentCounts = (seg: string) =>
    contacts.filter((c) => (seg === "Все" ? true : c.segment === seg)).length;

  return (
    <>
      {/* Segments */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {SEGMENTS.map((s) => (
          <div key={s.label}
            onClick={() => onChange(s.label)}
            className={`glass rounded-2xl p-4 cursor-pointer transition-all ${activeSegment === s.label ? "ring-1" : "hover:bg-white/5"}`}
            style={activeSegment === s.label ? { ringColor: s.color } as React.CSSProperties : {}}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{segmentCounts(s.label).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI banner */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)" }}>
        <div className="flex items-center gap-3">
          <Icon name="Brain" size={18} style={{ color: "#06b6d4" }} />
          <div>
            <span className="font-medium text-sm">Поведенческая сегментация</span>
            <span className="text-xs text-muted-foreground ml-2">Автоматически делит аудиторию по активности, кликам и покупкам</span>
          </div>
          <button className="ml-auto text-xs px-3 py-1.5 rounded-xl font-medium" style={{ background: "rgba(34,211,238,0.15)", color: "#06b6d4" }}>
            Настроить
          </button>
        </div>
      </div>
    </>
  );
}
