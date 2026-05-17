import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard, Activity, BookOpen, TrendingUp, Settings, Users, Pill,
  Signal, BatteryMedium, ChevronLeft, ChevronRight, Sun, Moon, Menu
} from "lucide-react";
import { useTheme, useTokens } from "./ThemeContext";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/ecg-records", icon: Activity, label: "ECG Records" },
  { path: "/cardiac-diary", icon: BookOpen, label: "Cardiac Diary" },
  { path: "/risk", icon: TrendingUp, label: "Risk & Trends" },
  { path: "/family", icon: Users, label: "Family Circle" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  onHamburgerOpen?: () => void;
}

export function Sidebar({ onHamburgerOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggle } = useTheme();
  const tk = useTokens();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`hidden lg:flex flex-col h-full transition-all duration-300 ${collapsed ? "w-[64px]" : "w-[260px]"}`}
      style={{ background: tk.sidebarBg, borderRight: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <button onClick={() => { if (onHamburgerOpen) onHamburgerOpen(); else setCollapsed(!collapsed); }} className="p-1 rounded transition-colors" style={{ color: tk.textSecondary }}>
          <Menu size={18} />
        </button>
        {!collapsed && (
          <>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M4 16 Q8 8, 12 16 Q14 20, 16 12 Q18 4, 20 16 Q24 24, 28 16" stroke="#E8304A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "Syne, sans-serif", color: tk.textPrimary, fontSize: 18, fontWeight: 700 }}>CardiShirt</span>
          </>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1 rounded transition-colors" style={{ color: tk.textSecondary }}>
            <ChevronLeft size={14} />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="p-1 rounded transition-colors" style={{ color: tk.textSecondary }}>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all"
              style={{
                background: active ? tk.cardElevated : "transparent",
                color: active ? tk.textPrimary : tk.textSecondary,
                fontFamily: "Syne, sans-serif",
                fontSize: 13,
              }}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} style={{ color: active ? "#E8304A" : tk.textSecondary }} />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-2 mb-2">
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all"
          style={{ background: tk.cardElevated, color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}
        >
          {theme === "dark" ? <Sun size={16} style={{ color: tk.amber }} /> : <Moon size={16} style={{ color: tk.textSecondary }} />}
          {!collapsed && (theme === "dark" ? "Light Mode" : "Dark Mode")}
        </button>
      </div>

      {/* Shirt Status */}
      <div className="px-3 py-3 mx-2 mb-2 rounded-lg" style={{ background: tk.cardElevated }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="relative">
            <svg width="20" height="24" viewBox="0 0 24 28" fill="none">
              <path d="M6 4L2 8V24H22V8L18 4H15C15 6.2 13.2 8 11 8H13C10.8 8 9 6.2 9 4H6Z" stroke="#27C28A" strokeWidth="1.5" fill="none" />
            </svg>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#27C28A] animate-pulse" />
          </div>
          {!collapsed && <span style={{ color: "#27C28A", fontFamily: "DM Mono, monospace", fontSize: 11 }}>Connected</span>}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-3 mt-1" style={{ color: tk.textSecondary, fontSize: 10 }}>
            <div className="flex items-center gap-1"><BatteryMedium size={12} /><span style={{ fontFamily: "DM Mono, monospace" }}>72%</span></div>
            <div className="flex items-center gap-1"><Signal size={12} /><span style={{ fontFamily: "DM Mono, monospace" }}>Strong</span></div>
          </div>
        )}
      </div>

      {/* Patient */}
      <div className="px-3 py-3 flex items-center gap-3" style={{ borderTop: `0.5px solid ${tk.cardBorder}` }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 600 }}>RK</div>
        {!collapsed && (
          <div>
            <div style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>Rahim Karim</div>
            <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(39,194,138,0.15)", color: "#27C28A", fontSize: 9, fontFamily: "DM Mono, monospace" }}>Low Risk</span>
          </div>
        )}
      </div>
    </aside>
  );
}
