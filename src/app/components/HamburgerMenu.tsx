import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  X, LayoutDashboard, Activity, BookOpen, TrendingUp, Users, Settings,
  Radio, Heart, Wifi, Battery, AlertTriangle, Share2, Phone, Zap, Shirt,
  Globe, User, ChevronRight, Flame
} from "lucide-react";
import { useTokens, useSharedLocalStorage } from "./ThemeContext";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard", badge: { text: "", type: "dot-green" as const } },
  { path: "/ecg-records", icon: Activity, label: "ECG Records", badge: { text: "3 new", type: "pill" as const } },
  { path: "/cardiac-diary", icon: BookOpen, label: "Cardiac Diary", badge: { text: "Day 14", type: "pill-teal" as const } },
  { path: "/risk", icon: TrendingUp, label: "Risk & Trends", badge: { text: "↓", type: "arrow-green" as const } },
  { path: "/family", icon: Users, label: "Family & Emergency", badge: { text: "2 active", type: "pill" as const } },
  { path: "/settings", icon: Settings, label: "Settings & Device", badge: { text: "", type: "dot-red" as const } },
];

const quickActions = [
  { icon: Radio, label: "Record ECG now", color: "#E8304A", highlight: false },
  { icon: AlertTriangle, label: "Log a symptom", color: "#F5A623", highlight: false },
  { icon: Share2, label: "Share with doctor", color: "#27C28A", highlight: false },
  { icon: Phone, label: "Call ambulance", color: "#E8304A", highlight: true },
  { icon: Users, label: "Check family", color: "#8890B8", highlight: false },
  { icon: Shirt, label: "Test shirt", color: "#F5A623", highlight: false },
];

const recentEvents = [
  { time: "Today 1:15 PM", text: "AI summary generated", color: "#27C28A" },
  { time: "Yesterday", text: "14-day streak achieved", color: "#27C28A" },
  { time: "Mon 9:15 AM", text: "New 3-lead recording", color: "#4A90D9" },
  { time: "Sun 11:00 PM", text: "Shirt disconnected during sleep", color: "#8890B8" },
];

interface HamburgerMenuProps {
  open: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ open, onClose }: HamburgerMenuProps) {
  const tk = useTokens();
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState<"en" | "bn">("en");
  
  const [firstName] = useSharedLocalStorage("cs_first_name", "Adnan");
  const [avatarInitials] = useSharedLocalStorage("cs_avatar_initials", "AU");
  const [avatarBgColor] = useSharedLocalStorage("cs_avatar_bgcolor", "#5B8AF0");

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-50 flex flex-col overflow-hidden"
            style={{
              width: "min(320px, calc(100vw - 56px))",
              background: tk.cardBg,
              borderRight: `0.5px solid ${tk.cardBorder}`,
            }}
          >
            {/* Zone 1 — Patient Status Strip */}
            <div className="flex-shrink-0 px-4 py-3" style={{ background: tk.cardElevated, borderBottom: `0.5px solid ${tk.cardBorder}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: avatarBgColor, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 600 }}>{avatarInitials}</div>
                  <div>
                    <div style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{firstName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(39,194,138,0.15)", color: "#27C28A", fontFamily: "DM Mono, monospace", fontSize: 10 }}>Stable</span>
                      <span style={{ color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 13 }}>72 BPM</span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: tk.textSecondary }}>
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Wifi size={12} style={{ color: "#27C28A" }} />
                <span style={{ color: "#27C28A", fontFamily: "DM Mono, monospace", fontSize: 10 }}>Connected</span>
                <Battery size={12} style={{ color: tk.textMuted, marginLeft: 8 }} />
                <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>72%</span>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Zone 2 — Navigation */}
              <nav className="px-3 py-2 space-y-0.5">
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors"
                      style={{ background: active ? tk.cardElevated : "transparent" }}
                    >
                      <item.icon size={20} style={{ color: active ? "#E8304A" : tk.textSecondary }} fill={active ? "#E8304A" : "none"} />
                      <span className="flex-1 text-left" style={{ color: active ? tk.textPrimary : tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>{item.label}</span>
                      {item.badge.type === "dot-green" && <div className="w-2 h-2 rounded-full bg-[#27C28A]" />}
                      {item.badge.type === "dot-red" && <div className="w-2 h-2 rounded-full bg-[#E8304A]" />}
                      {item.badge.type === "pill" && item.badge.text && (
                        <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(232,48,74,0.1)", color: "#E8304A", fontFamily: "DM Mono, monospace", fontSize: 10 }}>{item.badge.text}</span>
                      )}
                      {item.badge.type === "pill-teal" && (
                        <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(39,194,138,0.1)", color: "#27C28A", fontFamily: "DM Mono, monospace", fontSize: 10 }}>{item.badge.text}</span>
                      )}
                      {item.badge.type === "arrow-green" && (
                        <span style={{ color: "#27C28A", fontFamily: "DM Mono, monospace", fontSize: 14 }}>{item.badge.text}</span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Zone 3 — Quick Actions */}
              <div className="px-4 py-3" style={{ borderTop: `0.5px solid ${tk.borderSubtle}` }}>
                <span style={{ color: tk.textMuted, fontFamily: "Syne, sans-serif", fontSize: 11, marginBottom: 8, display: "block" }}>Quick Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => {
                        if (a.label === "Call ambulance") {
                          if (window.confirm("Are you sure you want to call an ambulance? This will initiate an emergency dispatch.")) {
                            alert("Calling nearest ambulance...");
                          }
                        } else if (a.label === "Record ECG now") {
                          alert("Recording a 30-second 3-lead ECG. Please remain still.");
                        } else if (a.label === "Log a symptom") {
                          alert("Opening symptom logger...");
                        } else if (a.label === "Share with doctor") {
                          alert("Your recent data link has been copied to your clipboard.");
                        } else if (a.label === "Check family") {
                          handleNav("/family");
                        } else if (a.label === "Test shirt") {
                          handleNav("/settings");
                        }
                      }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors"
                      style={{
                        background: a.highlight ? "rgba(232,48,74,0.12)" : tk.chipBg,
                        borderWidth: a.highlight ? 1 : 0.5,
                        borderStyle: "solid",
                        borderColor: a.highlight ? "rgba(232,48,74,0.4)" : tk.borderSubtle,
                      }}
                    >
                      <a.icon size={18} style={{ color: a.color }} />
                      <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 11, textAlign: "center", lineHeight: 1.3 }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone 4 — Recent Activity */}
              <div className="px-4 py-3" style={{ borderTop: `0.5px solid ${tk.borderSubtle}` }}>
                <span style={{ color: tk.textMuted, fontFamily: "Syne, sans-serif", fontSize: 11, marginBottom: 8, display: "block" }}>Recent Activity</span>
                <div className="space-y-1">
                  {recentEvents.map((e, i) => (
                    <button key={i} className="flex items-start gap-2 w-full py-1.5 rounded transition-colors text-left">
                      <div className="w-0.5 h-full min-h-[20px] rounded-full flex-shrink-0 mt-0.5" style={{ background: e.color }} />
                      <span className="flex-shrink-0" style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10, minWidth: 90 }}>{e.time}</span>
                      <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>{e.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Zone 5 — Footer */}
            <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between" style={{ borderTop: `0.5px solid ${tk.cardBorder}`, background: tk.cardElevated }}>
              <div className="flex items-center gap-1.5">
                <User size={12} style={{ color: tk.textMuted }} />
                <span style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 10 }}>Patient: {firstName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setLang("en")} style={{ color: lang === "en" ? tk.textPrimary : tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 11, textDecoration: lang === "en" ? "underline" : "none" }}>EN</button>
                <span style={{ color: tk.textMuted }}>|</span>
                <button onClick={() => setLang("bn")} style={{ color: lang === "bn" ? tk.textPrimary : tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 11, textDecoration: lang === "bn" ? "underline" : "none" }}>বাং</button>
              </div>
              <button onClick={() => handleNav("/settings")}>
                <Settings size={14} style={{ color: tk.textMuted }} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}