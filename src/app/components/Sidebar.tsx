import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard, Activity, BookOpen, TrendingUp, Settings, Users, Pill,
  Signal, BatteryMedium, ChevronLeft, ChevronRight, Palette
} from "lucide-react";
import { useTheme, useTokens, useSharedLocalStorage } from "./ThemeContext";
import { useLiveVitals } from "./useBackend";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/ecg-records", icon: Activity, label: "ECG Records" },
  { path: "/cardiac-diary", icon: BookOpen, label: "Cardiac Diary" },
  { path: "/risk", icon: TrendingUp, label: "Risk & Trends" },
  { path: "/family", icon: Users, label: "Family Circle" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {}

export function Sidebar({}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const tk = useTokens();
  const navigate = useNavigate();
  const location = useLocation();
  const { connected, vitals } = useLiveVitals();
  
  const [firstName] = useSharedLocalStorage("cs_first_name", "Adnan");
  const [lastName] = useSharedLocalStorage("cs_last_name", "Uddin");
  const [avatarInitials] = useSharedLocalStorage("cs_avatar_initials", "AU");
  const [avatarBgColor] = useSharedLocalStorage("cs_avatar_bgcolor", "#5B8AF0");

  return (
    <aside
      className={`hidden lg:flex flex-col h-full transition-all duration-300 ${collapsed ? "w-[64px]" : "w-[260px]"}`}
      style={{ background: tk.sidebarBg, borderRight: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
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

      {/* Theme Selector */}
      <div className="px-2 mb-3 flex flex-col gap-2">
        {!collapsed && (
          <div className="px-3 text-[10px] uppercase tracking-wider font-bold" style={{ color: tk.textMuted }}>
            Theme
          </div>
        )}
        <div className={`flex ${collapsed ? 'flex-col items-center' : 'justify-around px-2'} gap-2`}>
          {[
            { id: "dark", color: "#141629", border: "#4A5070" },
            { id: "light", color: "#FFFFFF", border: "#D1D5DB" },
            { id: "ocean", color: "#0A1929", border: "#668EBA" },
            { id: "nature", color: "#F2F7F4", border: "#7B9E86" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              className="w-5 h-5 rounded-full transition-all duration-200 flex items-center justify-center"
              style={{
                background: t.color,
                border: `1.5px solid ${theme === t.id ? tk.cardiacRed : t.border}`,
                transform: theme === t.id ? "scale(1.2)" : "scale(1)",
                boxShadow: theme === t.id ? `0 0 8px ${tk.cardiacRedGlow}` : "none"
              }}
              title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
            />
          ))}
        </div>
      </div>

      {/* Shirt Status */}
      <div className="px-3 py-3 mx-2 mb-2 rounded-lg" style={{ background: tk.cardElevated }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="relative">
            <svg width="20" height="24" viewBox="0 0 24 28" fill="none">
              <path d="M6 4L2 8V24H22V8L18 4H15C15 6.2 13.2 8 11 8H13C10.8 8 9 6.2 9 4H6Z" stroke={connected ? "#27C28A" : tk.textMuted} strokeWidth="1.5" fill="none" />
            </svg>
            <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${connected ? 'bg-[#27C28A] animate-pulse' : 'bg-gray-500'}`} />
          </div>
          {!collapsed && <span style={{ color: connected ? "#27C28A" : tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 11 }}>{connected ? "Connected" : "Disconnected"}</span>}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-3 mt-1" style={{ color: tk.textSecondary, fontSize: 10 }}>
            <div className="flex items-center gap-1"><BatteryMedium size={12} /><span style={{ fontFamily: "DM Mono, monospace" }}>{vitals?.temp ? "98%" : "--"}</span></div>
            <div className="flex items-center gap-1"><Signal size={12} /><span style={{ fontFamily: "DM Mono, monospace" }}>{connected ? "Strong" : "None"}</span></div>
          </div>
        )}
      </div>

      {/* Patient */}
      <div className="px-3 py-3 flex items-center gap-3 relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderTop: `0.5px solid ${tk.cardBorder}` }} onClick={() => setProfileModalOpen(!profileModalOpen)}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: avatarBgColor, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 600 }}>{avatarInitials}</div>
        {!collapsed && (
          <div>
            <div style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>{firstName}</div>
            <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(39,194,138,0.15)", color: "#27C28A", fontSize: 9, fontFamily: "DM Mono, monospace" }}>Low Risk</span>
          </div>
        )}
        
        {/* Profile Modal */}
        {profileModalOpen && (
          <div 
            className="absolute bottom-full left-2 mb-2 w-[calc(100%-16px)] min-w-[200px] rounded-lg shadow-xl overflow-hidden z-50 border" 
            style={{ background: tk.cardBg, borderColor: tk.cardBorder }}
            onClick={(e) => e.stopPropagation()}
          >
             <div className="p-3 border-b" style={{ borderColor: tk.cardBorder }}>
               <div style={{ color: tk.textPrimary, fontSize: 14, fontWeight: 'bold', fontFamily: "Syne, sans-serif" }}>{firstName} {lastName}</div>
               <div style={{ color: tk.textSecondary, fontSize: 12, fontFamily: "DM Mono, monospace" }}>Patient ID: 9821</div>
             </div>
             <button onClick={() => { setProfileModalOpen(false); navigate('/settings'); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2" style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif" }}>
               <Settings size={14} style={{ color: tk.textSecondary }} /> Go to Settings
             </button>
          </div>
        )}
      </div>
    </aside>
  );
}
