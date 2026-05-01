import Icon from "@/components/ui/icon";
import { navItems, Page } from "@/data/mockData";

interface SidebarProps {
  page: Page;
  setPage: (p: Page) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export default function Sidebar({ page, setPage, collapsed, setCollapsed }: SidebarProps) {
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
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className={`border-t border-border p-3 flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          А
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Алексей С.</div>
            <div className="text-[10px] text-muted-foreground truncate">admin@company.ru</div>
          </div>
        )}
      </div>
    </aside>
  );
}