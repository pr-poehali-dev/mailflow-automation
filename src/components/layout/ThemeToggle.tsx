import Icon from "@/components/ui/icon";
import { useTheme } from "@/contexts/ThemeContext";

interface Props {
  collapsed?: boolean;
}

export default function ThemeToggle({ collapsed }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (collapsed) {
    return (
      <button
        onClick={toggleTheme}
        title={isDark ? "Светлая тема" : "Тёмная тема"}
        className="w-full py-2 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
        <Icon name={isDark ? "Sun" : "Moon"} size={14} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-secondary transition-colors text-muted-foreground"
      title="Переключить тему">
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          <Icon name={isDark ? "Moon" : "Sun"} size={10} />
        </div>
      </div>
      <span className="flex-1 text-left">{isDark ? "Тёмная тема" : "Светлая тема"}</span>
    </button>
  );
}
