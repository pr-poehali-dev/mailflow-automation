import Icon from "@/components/ui/icon";
import { navItems, Page } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  page: Page;
  setPage: (p: Page) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

const PUBLIC_PAGES: Page[] = ["dashboard", "pricing"];

export default function Sidebar({
  page, setPage, collapsed, setCollapsed, onLoginClick, onRegisterClick,
}: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className="flex flex-col border-r border-border transition-all duration-300 flex-shrink-0 relative"
      style={{
        width: collapsed ? 60 : 220,
        background: "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(248,247,255,0.7))",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          <Icon name="Zap" size={15} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-base gradient-text tracking-tight">MAIL-KA</span>
        )}
        <button
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Icon name={collapsed ? "ChevronRight" : "ChevronLeft"} size={15} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = page === item.id;
          const locked = !user && !PUBLIC_PAGES.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? "active font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              style={active ? {
                background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.06))",
                color: "#7c3aed",
              } : {}}
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} size={17} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {locked ? (
                    <Icon name="Lock" size={11} className="text-muted-foreground flex-shrink-0" />
                  ) : item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white tracking-wider"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* User / Auth */}
      {user ? (
        <div className={`border-t border-border p-3 flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{user.name || "Пользователь"}</div>
                <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
              </div>
              <button
                onClick={() => logout()}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary"
                title="Выйти"
              >
                <Icon name="LogOut" size={13} />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="border-t border-border p-2.5 space-y-1.5">
          {!collapsed ? (
            <>
              <button
                onClick={onRegisterClick}
                className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
              >
                <Icon name="Sparkles" size={12} />
                Создать аккаунт
              </button>
              <button
                onClick={onLoginClick}
                className="w-full py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center gap-1.5"
              >
                <Icon name="LogIn" size={12} />
                Уже есть аккаунт
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onRegisterClick}
                title="Создать аккаунт"
                className="w-full py-2 rounded-lg text-white flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
              >
                <Icon name="Sparkles" size={14} />
              </button>
              <button
                onClick={onLoginClick}
                title="Войти"
                className="w-full py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center"
              >
                <Icon name="LogIn" size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
