import Icon from "@/components/ui/icon";
import { Channel } from "./channels";

interface Props {
  channels: Channel[];
  selectedCascade: string[];
  toggleCascade: (id: string) => void;
}

export function CascadeBuilder({ channels, selectedCascade, toggleCascade }: Props) {
  return (
    <div className="glass rounded-2xl p-5"
      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(6,182,212,0.02))" }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-bold flex items-center gap-2">
            <Icon name="GitBranch" size={16} style={{ color: "#8b5cf6" }} />
            Каскадная отправка
          </h2>
          <p className="text-xs text-muted-foreground">Не открыл письмо за 2 часа? Отправим в Телеграм. Не прочитал? Push на телефон. Экономия и рост откликов.</p>
        </div>
        <button className="text-xs px-4 py-2 rounded-xl font-semibold text-white flex items-center gap-1.5"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          <Icon name="Play" size={12} />Запустить каскад
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {selectedCascade.map((id, i) => {
          const c = channels.find((x) => x.id === id);
          if (!c) return null;
          return (
            <div key={id} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: `${c.color}15`, border: `1px solid ${c.color}40` }}>
                <Icon name={c.icon} size={13} style={{ color: c.color }} />
                <span className="text-xs font-semibold">{c.name}</span>
                <button onClick={() => toggleCascade(id)} className="text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={11} />
                </button>
              </div>
              {i < selectedCascade.length - 1 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="ArrowRight" size={11} />
                  <span>+2ч</span>
                  <Icon name="ArrowRight" size={11} />
                </div>
              )}
            </div>
          );
        })}
        <button className="px-3 py-2 rounded-xl border-2 border-dashed text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          style={{ borderColor: "rgba(139,92,246,0.3)" }}>
          <Icon name="Plus" size={11} />Добавить канал
        </button>
      </div>
    </div>
  );
}

export default CascadeBuilder;