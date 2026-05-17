import { useState, useEffect, useRef, useCallback } from "react";
import {
  User, Shirt, Bell, Brain, Globe, Lock, Shield, Info,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Check, X,
  Edit2, Phone, Mail, Camera, Trash2, Download, Eye, EyeOff,
  Play, Pause, Square, RotateCcw, Wifi, WifiOff, BatteryMedium,
  Clock, AlertTriangle, CheckCircle, Settings, Sparkles, Heart,
  Activity, Sun, Moon, Monitor, Smartphone, LogOut, Send, ExternalLink,
  HelpCircle, MessageSquare, Bug, FileText, RefreshCw, Zap, TestTube,
  BellOff, Calendar, ArrowUp, ArrowDown, Ambulance, PhoneCall,
  Navigation, ShieldCheck, ShieldAlert, Share2, History
} from "lucide-react";
import { useTheme } from "./ThemeContext";

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };
  return [storedValue, setValue];
}

/* ════════════════════════════════════════════
   THEME
   ════════════════════════════════════════════ */
function useColors() {
  const { theme } = useTheme();
  const d = theme === "dark";
  return {
    pageBg: d ? "#0D0F1A" : "#F4F5F9",
    cardBg: d ? "#141629" : "#FFFFFF",
    cardElevated: d ? "#1A1D35" : "#F7F8FC",
    cardBorder: d ? "rgba(100,120,200,0.15)" : "rgba(0,0,0,0.08)",
    text: d ? "#F0F2FF" : "#0D0F1A",
    secondary: d ? "#8890B8" : "#6B7499",
    muted: d ? "#4A5070" : "#9AA0B8",
    inputBg: d ? "#1A1D35" : "#F7F8FC",
    inputBorder: d ? "rgba(100,120,200,0.2)" : "rgba(0,0,0,0.12)",
    shadow: d ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
    red: "#E8304A",
    green: "#27C28A",
    amber: "#F5A623",
    blue: "#5B8AF0",
    divider: d ? "rgba(100,120,200,0.1)" : "rgba(0,0,0,0.06)",
    hoverBg: d ? "rgba(232,48,74,0.05)" : "rgba(232,48,74,0.04)",
    activeNavBg: d ? "rgba(232,48,74,0.08)" : "rgba(232,48,74,0.05)",
    navBorder: d ? "#E8304A" : "#E8304A",
    strip: d ? "#1A1D35" : "#F0F2F8",
    d,
  };
}

/* ════════════════════════════════════════════
   SHARED TINY COMPONENTS
   ════════════════════════════════════════════ */
function Toggle({ on, onToggle, disabled, size = "md" }: { on: boolean; onToggle: () => void; disabled?: boolean; size?: "sm" | "md" }) {
  const c = useColors();
  const w = size === "sm" ? 36 : 42;
  const h = size === "sm" ? 20 : 24;
  const dot = size === "sm" ? 14 : 18;
  const pad = size === "sm" ? 3 : 3;
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      style={{
        width: w, height: h, borderRadius: h / 2, position: "relative",
        background: on ? c.red : c.d ? "#2A2E50" : "#D1D5DB",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: pad, left: on ? w - dot - pad : pad,
        width: dot, height: dot, borderRadius: dot / 2, background: "#fff",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

function SegmentedControl({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const c = useColors();
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding: "8px 16px", fontFamily: "Syne, sans-serif", fontSize: 13,
          background: value === o ? c.red : c.cardBg,
          color: value === o ? "#fff" : c.secondary,
          transition: "all 0.15s", cursor: "pointer",
          borderRight: o !== options[options.length - 1] ? `1px solid ${c.cardBorder}` : undefined,
        }}>{o}</button>
      ))}
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <div className="flex items-start justify-between gap-4 py-3.5" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: c.divider }}>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text }}>{label}</div>
        {desc && <div className="mt-0.5" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary, lineHeight: 1.5 }}>{desc}</div>}
      </div>
      <div className="flex-shrink-0 flex items-center">{children}</div>
    </div>
  );
}

function SectionCard({ title, children, icon, iconColor }: { title: string; children: React.ReactNode; icon?: React.ReactNode; iconColor?: string }) {
  const c = useColors();
  return (
    <div className="rounded-xl mb-5" style={{ background: c.cardBg, borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder, boxShadow: c.shadow, overflow: "hidden" }}>
      <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: c.divider }}>
        {icon && <span style={{ color: iconColor || c.secondary }}>{icon}</span>}
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.text }}>{title}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function NumericInput({ value, onChange, min, max, suffix }: { value: number; onChange: (v: number) => void; min: number; max: number; suffix?: string }) {
  const c = useColors();
  return (
    <div className="flex items-center gap-1 rounded-lg" style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.inputBorder, background: c.inputBg }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} className="px-2 py-1" style={{ color: c.secondary }}>−</button>
      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text, minWidth: 32, textAlign: "center" }}>{value}</span>
      {suffix && <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>{suffix}</span>}
      <button onClick={() => onChange(Math.min(max, value + 1))} className="px-2 py-1" style={{ color: c.secondary }}>+</button>
    </div>
  );
}

function TextLink({ label, color, onClick }: { label: string; color?: string; onClick?: () => void }) {
  const c = useColors();
  return (
    <button onClick={onClick} style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: color || c.blue, cursor: "pointer", background: "none" }}>{label}</button>
  );
}

/* ════════════════════════════════════════════
   CATEGORY NAV
   ════════════════════════════════════════════ */
type Category = "profile" | "device" | "alerts" | "ai" | "display" | "privacy" | "emergency" | "about";

interface NavItem {
  id: Category;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  badge?: React.ReactNode;
}

function useCategoryItems(): NavItem[] {
  const c = useColors();
  return [
    { id: "profile", label: "Profile & Account", icon: User, iconColor: "#5B8AF0" },
    { id: "device", label: "CardiShirt Device", icon: Shirt, iconColor: c.red, badge: <div style={{ width: 8, height: 8, borderRadius: 4, background: c.green }} /> },
    { id: "alerts", label: "Alerts & Notifications", icon: Bell, iconColor: c.amber },
    { id: "ai", label: "AI & Analysis", icon: Brain, iconColor: c.green },
    { id: "display", label: "Display & Language", icon: Globe, iconColor: "#5B8AF0", badge: <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, padding: "1px 6px", borderRadius: 8, background: c.strip, color: c.muted }}>EN</span> },
    { id: "privacy", label: "Privacy & Data", icon: Lock, iconColor: "#6B7499" },
    { id: "emergency", label: "Emergency Config", icon: Shield, iconColor: c.red, badge: <CheckCircle size={14} style={{ color: c.green }} /> },
    { id: "about", label: "About & Support", icon: Info, iconColor: "#9AA0B8" },
  ];
}

function CategoryNav({ active, onSelect }: { active: Category; onSelect: (c: Category) => void }) {
  const c = useColors();
  const items = useCategoryItems();

  return (
    <div className="flex flex-col">
      {items.map((item, i) => {
        const isActive = active === item.id;
        const isLast = i === items.length - 1;
        const isBeforeLast = i === items.length - 2;
        return (
          <div key={item.id}>
            {isLast && <div className="my-2" style={{ height: 1, background: c.divider }} />}
            <button
              onClick={() => onSelect(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
              style={{
                background: isActive ? c.activeNavBg : "transparent",
                borderLeftWidth: 3, borderLeftStyle: "solid",
                borderLeftColor: isActive ? c.navBorder : "transparent",
              }}
            >
              <item.icon size={20} style={{ color: item.iconColor, flexShrink: 0 }} />
              <span className="flex-1" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: isActive ? c.text : c.secondary }}>{item.label}</span>
              {item.badge && <span className="flex-shrink-0">{item.badge}</span>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════
   1. PROFILE & ACCOUNT
   ════════════════════════════════════════════ */
function ProfileSection() {
  const c = useColors();
  const [editing, setEditing] = useState(false);
  const [caregiverOn, setCaregiverOn] = useLocalStorage("cs_caregiver", true);

  const conditions = ["Hypertension", "Diabetes", "Previous cardiac event", "Pacemaker", "Other"];
  const [checkedConditions, setCheckedConditions] = useLocalStorage("cs_conditions", [true, false, true, false, false]);

  return (
    <>
      {/* Patient Profile */}
      <SectionCard title="Patient Profile" icon={<User size={18} />} iconColor="#5B8AF0">
        <div className="flex items-start gap-5 mb-4">
          <div className="relative flex-shrink-0">
            <div className="flex items-center justify-center" style={{
              width: 80, height: 80, borderRadius: 40, background: "#5B8AF0",
              color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 500,
            }}>RU</div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: c.cardBg, borderWidth: 1.5, borderStyle: "solid", borderColor: c.cardBorder }}>
              <Camera size={13} style={{ color: c.secondary }} />
            </button>
          </div>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 500, color: c.text }}>Adnan</div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.secondary }}>Age 62 · Male · Blood Type B+</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span style={{ padding: "2px 10px", borderRadius: 10, background: `${c.amber}15`, color: c.amber, fontFamily: "Syne, sans-serif", fontSize: 12 }}>Watch tier</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>Risk score 73</span>
            </div>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)} style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.red }}>
          <Edit2 size={12} className="inline mr-1" />{editing ? "Close editor" : "Edit profile"}
        </button>
        {editing && (
          <div className="mt-4 pt-4 flex flex-col gap-3" style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: c.divider }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[{ l: "First Name", v: "Adnan" }, { l: "Last Name", v: "Uddin" }, { l: "Date of Birth", v: "15/03/1964" }, { l: "Blood Type", v: "B+" }].map(f => (
                <div key={f.l}>
                  <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 3 }}>{f.l}</label>
                  <input defaultValue={f.v} style={{
                    width: "100%", padding: "8px 12px", borderRadius: 8,
                    background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.inputBorder,
                    fontFamily: f.l === "Date of Birth" ? "DM Mono, monospace" : "Syne, sans-serif", fontSize: 14, color: c.text, outline: "none",
                  }} />
                </div>
              ))}
            </div>
            <div>
              <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 6 }}>Known Conditions</label>
              <div className="flex flex-col gap-2">
                {conditions.map((cond, i) => (
                  <label key={cond} className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setCheckedConditions(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
                      style={{
                        width: 20, height: 20, borderRadius: 4,
                        borderWidth: 1.5, borderStyle: "solid",
                        borderColor: checkedConditions[i] ? c.red : c.inputBorder,
                        background: checkedConditions[i] ? c.red : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}>
                      {checkedConditions[i] && <Check size={13} color="#fff" />}
                    </div>
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{cond}</span>
                  </label>
                ))}
              </div>
            </div>
            <p style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary, lineHeight: 1.6 }}>
              This information helps CardiShirt AI personalize your risk analysis. It is never shared without your permission.
            </p>
            <button className="self-start px-5 py-2 rounded-lg" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>Save changes</button>
          </div>
        )}
      </SectionCard>

      {/* Account Details */}
      <SectionCard title="Account Details" icon={<Mail size={18} />} iconColor="#5B8AF0">
        <SettingRow label="Phone Number" desc="Primary identifier for your account">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>+880 1712-345678</span>
            <TextLink label="Edit" color={c.red} />
          </div>
        </SettingRow>
        <SettingRow label="Email Address">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>rahim@email.com</span>
            <TextLink label="Edit" color={c.red} />
          </div>
        </SettingRow>
        <div className="pt-3">
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.muted }}>Account created · </span>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>12 Feb 2026</span>
        </div>
      </SectionCard>

      {/* Caregiver Access */}
      <SectionCard title="Caregiver Access" icon={<User size={18} />} iconColor={c.green}>
        <SettingRow label="Allow caregiver configuration" desc="A designated family member can edit your settings on your behalf">
          <Toggle on={caregiverOn} onToggle={() => setCaregiverOn(!caregiverOn)} />
        </SettingRow>
        {caregiverOn && (
          <div className="mt-3 p-3 rounded-lg flex items-center gap-3" style={{ background: c.cardElevated }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 14 }}>FK</div>
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text }}>Rehnuma</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>Daughter · Active caregiver</div>
            </div>
            <TextLink label="Change" color={c.red} />
          </div>
        )}
      </SectionCard>

      {/* Danger Zone */}
      <div className="mt-2 pt-5" style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: c.divider }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: c.muted, marginBottom: 12, display: "block" }}>Danger Zone</span>
        <div className="flex items-center gap-6">
          <TextLink label="Delete account" color={c.red} onClick={() => {if(window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) alert("Account deletion request submitted.");}} />
          <TextLink label="Export all my data" color={c.blue} onClick={() => alert("Data export started. You will receive an email when it is ready.")} />
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   2. CARDISHIRT DEVICE
   ════════════════════════════════════════════ */
const LEAD_NAMES = ["I", "II", "III"];

type LeadStatus = "idle" | "checking" | "good" | "weak" | "fail";

function MiniWaveform({ status, width = 40, height = 24 }: { status: LeadStatus; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const mid = height / 2;
    ctx.lineWidth = 1;

    if (status === "idle" || status === "checking") {
      ctx.strokeStyle = "#4A5070";
      ctx.setLineDash(status === "checking" ? [3, 3] : []);
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(width, mid);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (status === "good") {
      ctx.strokeStyle = "#E8304A";
      ctx.beginPath();
      const pts = [0, 0, 0.1, -0.1, 0.2, 0, 0.35, -0.15, 0.4, 0.8, 0.45, -0.6, 0.5, 0.1, 0.55, 0, 0.65, 0.15, 0.7, 0, 1, 0];
      for (let i = 0; i < pts.length; i += 2) {
        const x = pts[i] * width;
        const y = mid - pts[i + 1] * mid * 0.9;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (status === "weak") {
      ctx.strokeStyle = "#F5A623";
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const y = mid + Math.sin(x * 0.5) * 4 + (Math.random() - 0.5) * 6;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#E8304A44";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(width, mid);
      ctx.stroke();
    }
  }, [status, width, height]);
  return <canvas ref={canvasRef} width={width} height={height} />;
}

function DeviceSection() {
  const c = useColors();
  const [testPhase, setTestPhase] = useState<"idle" | "step1" | "step2" | "results">("idle");
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>(LEAD_NAMES.map(() => "idle"));
  const [progress, setProgress] = useState(0);
  const [testHistOpen, setTestHistOpen] = useState(false);
  const [leadsEnabled, setLeadsEnabled] = useState(LEAD_NAMES.map(() => true));
  const testInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTest = () => {
    setTestPhase("step1");
    setLeadStatuses(LEAD_NAMES.map(() => "idle"));
    setProgress(0);

    // After 3 seconds, move to step2 and animate leads
    setTimeout(() => {
      setTestPhase("step2");
      let idx = 0;
      testInterval.current = setInterval(() => {
        if (idx < 3) {
          setLeadStatuses(prev => {
            const n = [...prev];
            n[idx] = "checking";
            if (idx > 0) n[idx - 1] = "good";
            return n;
          });
          setProgress(((idx + 1) / 3) * 100);
          idx++;
        } else {
          if (testInterval.current) clearInterval(testInterval.current);
          setLeadStatuses(prev => {
            const n = [...prev];
            n[2] = "good";
            return n;
          });
          setProgress(100);
          setTimeout(() => setTestPhase("results"), 800);
        }
      }, 1500);
    }, 3000);
  };

  const cancelTest = () => {
    if (testInterval.current) clearInterval(testInterval.current);
    setTestPhase("idle");
    setLeadStatuses(LEAD_NAMES.map(() => "idle"));
    setProgress(0);
  };

  const goodCount = leadStatuses.filter(s => s === "good").length;
  const weakCount = leadStatuses.filter(s => s === "weak").length;

  const testSteps = ["Put on the shirt", "Sit still", "Review results"];
  const testStepIdx = testPhase === "step1" ? 0 : testPhase === "step2" ? 1 : testPhase === "results" ? 2 : -1;
  const stepDescs = [
    "Make sure all the electrode patches are flat against your skin and the shirt is snug but comfortable.",
    "Stay seated and breathe normally. We're reading all 3 leads now.",
    "Here's what we found.",
  ];

  const isDarkTest = testPhase !== "idle";

  return (
    <>
      {/* Device Status */}
      <SectionCard title="Device Status" icon={<Shirt size={18} />} iconColor={c.red}>
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1">
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.text }}>CardiShirt Pro · 3-Lead</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: c.secondary }}>SN: CS-2026-DK-00142</div>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi size={14} style={{ color: c.green }} />
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.green }}>Connected</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {[
            { l: "Battery", v: "84%", icon: <BatteryMedium size={14} />, col: c.green },
            { l: "Last sync", v: "12 sec ago", icon: <RefreshCw size={14} />, col: c.secondary },
            { l: "Signal", v: "Strong", icon: <Wifi size={14} />, col: c.green },
          ].map(s => (
            <div key={s.l} className="p-3 rounded-lg" style={{ background: c.cardElevated }}>
              <div className="flex items-center gap-1.5 mb-1" style={{ color: s.col }}>{s.icon}<span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.muted }}>{s.l}</span></div>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>{s.v}</span>
            </div>
          ))}
        </div>
        <button className="px-4 py-2 rounded-lg" style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary, background: "transparent" }}>
          Pair a new shirt
        </button>
      </SectionCard>

      {/* Shirt Test */}
      <div className="rounded-xl mb-5 overflow-hidden transition-all duration-200" style={{
        background: isDarkTest ? "#0D0F1A" : c.cardBg,
        borderWidth: 1, borderStyle: "solid",
        borderColor: isDarkTest ? "rgba(100,120,200,0.15)" : c.cardBorder,
        boxShadow: isDarkTest ? "0 8px 40px rgba(0,0,0,0.5)" : c.shadow,
      }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: isDarkTest ? "rgba(100,120,200,0.1)" : c.divider }}>
          <TestTube size={18} style={{ color: isDarkTest ? "#E8304A" : c.red }} />
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: isDarkTest ? "#F0F2FF" : c.text }}>Test your CardiShirt</span>
        </div>

        <div className="px-5 py-5">
          {testPhase === "idle" && (
            <>
              <p style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.secondary, lineHeight: 1.6, marginBottom: 16 }}>
                Run a quick test to confirm your shirt is reading correctly. Put the shirt on, sit still for 30 seconds, and CardiShirt will check all leads and confirm your heart signal is coming through clearly. This takes about 2 minutes.
              </p>
              <button onClick={startTest} className="w-full py-3 rounded-lg" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500 }}>
                Start shirt test
              </button>
            </>
          )}

          {isDarkTest && (
            <>
              {/* Step Indicator */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {testSteps.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className="flex items-center justify-center" style={{
                      width: 26, height: 26, borderRadius: 13,
                      background: i <= testStepIdx ? "#E8304A" : "rgba(100,120,200,0.15)",
                      color: i <= testStepIdx ? "#fff" : "#4A5070",
                      fontFamily: "DM Mono, monospace", fontSize: 12,
                    }}>{i < testStepIdx ? <Check size={13} /> : i + 1}</div>
                    <span style={{
                      fontFamily: "Syne, sans-serif", fontSize: 14,
                      color: i === testStepIdx ? "#F0F2FF" : "#4A5070",
                      fontWeight: i === testStepIdx ? 500 : 400,
                    }}>{s}</span>
                    {i < testSteps.length - 1 && <div style={{ width: 20, height: 1, background: "rgba(100,120,200,0.15)" }} />}
                  </div>
                ))}
              </div>

              {/* Step Instruction */}
              <p className="mb-5" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: "#8890B8", lineHeight: 1.6 }}>
                {stepDescs[testStepIdx] || ""}
              </p>

              {/* 3-Lead Grid */}
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {LEAD_NAMES.map((name, i) => {
                  const st = leadStatuses[i];
                  const borderCol = st === "good" ? "rgba(39,194,138,0.5)" : st === "weak" ? "rgba(245,166,35,0.5)" : st === "fail" ? "rgba(232,48,74,0.5)" : "rgba(100,120,200,0.1)";
                  const dotCol = st === "good" ? "#27C28A" : st === "weak" ? "#F5A623" : st === "fail" ? "#E8304A" : "#4A5070";
                  return (
                    <div key={name} className="rounded-lg p-2 flex flex-col items-center justify-between" style={{
                      background: "#141629", borderWidth: 0.5, borderStyle: "solid", borderColor: borderCol,
                      height: 64, transition: "border-color 0.3s",
                    }}>
                      <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "#8890B8", alignSelf: "flex-start" }}>{name}</span>
                      <MiniWaveform status={st} />
                      <div className="flex items-center gap-1 self-end">
                        {st === "checking" && <RefreshCw size={9} style={{ color: "#8890B8" }} className="animate-spin" />}
                        <div style={{ width: 6, height: 6, borderRadius: 3, background: dotCol, transition: "background 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live ECG strip placeholder */}
              {testPhase === "step2" && (
                <div className="mb-4">
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "#8890B8", display: "block", marginBottom: 4 }}>Live signal — Lead II</span>
                  <div className="rounded-lg overflow-hidden" style={{ height: 80, background: "#0A0C16", position: "relative" }}>
                    <ECGLiveStrip />
                  </div>
                </div>
              )}

              {/* Progress */}
              {testPhase !== "results" && (
                <div className="mb-4">
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "rgba(100,120,200,0.1)" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: "#E8304A", transition: "width 0.5s ease", borderRadius: 2 }} />
                  </div>
                  <div className="text-right mt-1"><span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#8890B8" }}>{Math.round(progress)}%</span></div>
                </div>
              )}

              {/* Results */}
              {testPhase === "results" && (
                <div className="rounded-xl p-5 mb-4" style={{ background: "#1A1D35" }}>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18, color: weakCount > 0 ? c.amber : c.green, marginBottom: 8, lineHeight: 1.5 }}>
                    {weakCount === 0
                      ? `Your CardiShirt is reading well — all 3 leads have a good signal.`
                      : `${goodCount} of 3 leads have a good signal — ${weakCount} lead${weakCount > 1 ? "s" : ""} need${weakCount === 1 ? "s" : ""} attention.`}
                  </div>
                  <p style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: "#8890B8", lineHeight: 1.6, marginBottom: 12 }}>
                    {weakCount === 0
                      ? "Everything looks good. You're ready to wear CardiShirt for monitoring."
                      : "Lead III has a weak signal. Make sure the electrode patch on your left leg is flat against your skin, then run the test again."}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button className="px-5 py-2.5 rounded-lg" style={{ background: weakCount === 0 ? c.green : c.amber, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 14 }}>
                      {weakCount === 0 ? "Start monitoring" : "Test again"}
                    </button>
                    <button onClick={cancelTest} style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: "#8890B8" }}>Close</button>
                  </div>
                </div>
              )}

              {/* Cancel */}
              {testPhase !== "results" && (
                <button onClick={cancelTest} style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: "#8890B8" }}>Cancel test</button>
              )}

              {/* Test History */}
              {testPhase === "results" && (
                <div className="mt-3">
                  <button onClick={() => setTestHistOpen(!testHistOpen)} className="flex items-center gap-1" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "#8890B8" }}>
                    View previous test results {testHistOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {testHistOpen && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {[
                        { date: "2 Apr 2026", result: "12/12", col: "#27C28A" },
                        { date: "28 Mar 2026", result: "11/12", col: "#F5A623" },
                        { date: "20 Mar 2026", result: "12/12", col: "#27C28A" },
                        { date: "14 Mar 2026", result: "12/12", col: "#27C28A" },
                        { date: "1 Mar 2026", result: "10/12", col: "#F5A623" },
                      ].map(h => (
                        <div key={h.date} className="flex items-center gap-3 px-3 py-1.5 rounded" style={{ background: "#141629" }}>
                          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#8890B8" }}>{h.date}</span>
                          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: h.col }}>{h.result} leads</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lead Configuration */}
      <SectionCard title="Lead Configuration" icon={<Activity size={18} />} iconColor={c.blue}>
        <p className="mb-3" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.amber, lineHeight: 1.5 }}>
          Disabling leads reduces monitoring coverage. Only change these settings if advised by your doctor.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LEAD_NAMES.map((name, i) => (
            <div key={name} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: c.cardElevated }}>
              <div>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text }}>Lead {name}</span>
                <span className="ml-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.muted }}>
                  {i < 3 ? "Limb lead" : i < 6 ? "Augmented" : "Precordial"}
                </span>
              </div>
              <Toggle on={leadsEnabled[i]} onToggle={() => setLeadsEnabled(p => { const n = [...p]; n[i] = !n[i]; return n; })} size="sm" />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Firmware */}
      <SectionCard title="Firmware & Maintenance" icon={<Zap size={18} />} iconColor={c.amber}>
        <div className="flex items-center gap-4 mb-3">
          <div>
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>Firmware version</span>
            <span className="ml-2" style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>v2.4.1</span>
          </div>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>Updated 18 Mar 2026</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button className="px-4 py-2 rounded-lg" style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text, background: "transparent" }}>Check for updates</button>
          <TextLink label="Reset shirt connection" color={c.red} />
          <TextLink label="Clear cached sensor data" color={c.secondary} />
        </div>
      </SectionCard>
    </>
  );
}

/* ECG live strip mini animation */
function ECGLiveStrip() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const ecgPattern = (x: number): number => {
      const p = ((x % 100) + 100) % 100;
      if (p < 10) return 0;
      if (p < 20) return Math.sin((p - 10) / 10 * Math.PI) * 0.15;
      if (p < 30) return 0;
      if (p < 35) return -0.1;
      if (p < 40) return 0.75;
      if (p < 45) return -0.35;
      if (p < 55) return 0;
      if (p < 65) return Math.sin((p - 55) / 10 * Math.PI) * 0.2;
      return 0;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "#E8304A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const val = ecgPattern(x + offsetRef.current);
        const y = h / 2 - val * (h * 0.4);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      offsetRef.current += 1.5;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} width={600} height={80} style={{ width: "100%", height: 80 }} />;
}

/* ════════════════════════════════════════════
   3. ALERTS & NOTIFICATIONS
   ════════════════════════════════════════════ */
function AlertsSection() {
  const c = useColors();
  const [highHR, setHighHR] = useLocalStorage("cs_highHR", 120);
  const [lowHR, setLowHR] = useLocalStorage("cs_lowHR", 45);
  const [highDur, setHighDur] = useLocalStorage("cs_highDur", "30s");
  const [rhythmSens, setRhythmSens] = useLocalStorage("cs_rhythmSens", "Standard");
  const [hrvOn, setHrvOn] = useLocalStorage("cs_hrvOn", false);
  const [hrvDrop, setHrvDrop] = useLocalStorage("cs_hrvDrop", 25);
  const [pushOn, setPushOn] = useLocalStorage("cs_pushOn", true);
  const [smsOn, setSmsOn] = useLocalStorage("cs_smsOn", true);
  const [familyOn, setFamilyOn] = useLocalStorage("cs_familyOn", true);
  const [quietOn, setQuietOn] = useLocalStorage("cs_quietOn", false);
  const [emergOverride, setEmergOverride] = useLocalStorage("cs_emergOverride", true);

  const ALERT_HIST = [
    { date: "3 Apr 2026", time: "2:14 PM", type: "High HR Alert", color: "#E8304A" },
    { date: "3 Apr 2026", time: "11:30 AM", type: "Rhythm Anomaly", color: "#F5A623" },
    { date: "1 Apr 2026", time: "3:47 PM", type: "HRV Drop", color: "#5B8AF0" },
    { date: "30 Mar 2026", time: "8:12 AM", type: "High HR Alert", color: "#E8304A" },
    { date: "28 Mar 2026", time: "6:01 PM", type: "Rhythm Anomaly", color: "#F5A623" },
  ];

  return (
    <>
      <SectionCard title="Alert Thresholds" icon={<AlertTriangle size={18} />} iconColor={c.amber}>
        <SettingRow label="High heart rate alert" desc="Alert me when my heart rate stays above this for the selected duration.">
          <div className="flex items-center gap-3">
            <NumericInput value={highHR} onChange={setHighHR} min={80} max={200} suffix="BPM" />
            <select value={highDur} onChange={(e) => setHighDur(e.target.value)} style={{
              background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.inputBorder,
              borderRadius: 8, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 13, color: c.text, outline: "none",
            }}>
              <option value="15s">15s</option>
              <option value="30s">30s</option>
              <option value="1m">1 min</option>
              <option value="2m">2 min</option>
            </select>
          </div>
        </SettingRow>
        <SettingRow label="Low heart rate alert" desc="Alert me when my heart rate drops below this.">
          <NumericInput value={lowHR} onChange={setLowHR} min={30} max={60} suffix="BPM" />
        </SettingRow>
        <SettingRow label="Irregular rhythm sensitivity" desc="Higher sensitivity catches more events but may produce more false alerts.">
          <SegmentedControl options={["Low", "Standard", "High"]} value={rhythmSens} onChange={setRhythmSens} />
        </SettingRow>
        <SettingRow label="HRV drop alert" desc="Alert me if my HRV drops more than the threshold below my baseline in a single day.">
          <div className="flex items-center gap-3">
            <Toggle on={hrvOn} onToggle={() => setHrvOn(!hrvOn)} />
            {hrvOn && <NumericInput value={hrvDrop} onChange={setHrvDrop} min={10} max={50} suffix="%" />}
          </div>
        </SettingRow>
        <p className="mt-3" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary, lineHeight: 1.6 }}>
          These thresholds are personalized for you. Changing them affects when CardiShirt alerts you and your family. If unsure, leave them at the recommended defaults or ask your doctor.
        </p>
      </SectionCard>

      <SectionCard title="Notification Delivery" icon={<Bell size={18} />} iconColor={c.blue}>
        <SettingRow label="Push notifications"><Toggle on={pushOn} onToggle={() => setPushOn(!pushOn)} /></SettingRow>
        <SettingRow label="SMS alerts" desc="Sent to your registered phone number"><Toggle on={smsOn} onToggle={() => setSmsOn(!smsOn)} /></SettingRow>
        <SettingRow label="Family circle alerts" desc="Master on/off for all family members">
          <div className="flex items-center gap-3">
            <Toggle on={familyOn} onToggle={() => setFamilyOn(!familyOn)} />
            <TextLink label="Per-member →" color={c.red} />
          </div>
        </SettingRow>
        <SettingRow label="Quiet hours" desc="Suppress non-critical notifications during this window">
          <div className="flex items-center gap-3">
            <Toggle on={quietOn} onToggle={() => setQuietOn(!quietOn)} />
            {quietOn && (
              <div className="flex items-center gap-1">
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: c.text }}>22:00</span>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.muted }}>to</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: c.text }}>07:00</span>
              </div>
            )}
          </div>
        </SettingRow>
        <SettingRow label="Emergency override" desc="Critical alerts bypass quiet hours. Keep this on.">
          <Toggle on={emergOverride} onToggle={() => setEmergOverride(!emergOverride)} />
        </SettingRow>
        {!emergOverride && (
          <div className="p-3 rounded-lg mt-2" style={{ background: `${c.red}08`, borderWidth: 1, borderStyle: "solid", borderColor: `${c.red}20` }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} style={{ color: c.red, flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.red, lineHeight: 1.5 }}>
                Disabling emergency override means critical cardiac alerts will not reach you during quiet hours. This could delay emergency response.
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Alert History" icon={<History size={18} />} iconColor={c.secondary}>
        <div className="flex flex-col gap-1.5">
          {ALERT_HIST.map((a, i) => (
            <div key={`alert-${i}`} className="flex items-center gap-3 py-2" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: c.divider }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: a.color, flexShrink: 0 }} />
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>{a.date}</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>{a.time}</span>
              <span className="flex-1" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{a.type}</span>
              <TextLink label="View ECG" color={c.blue} />
            </div>
          ))}
        </div>
        <div className="mt-3"><TextLink label="Clear alert history" color={c.muted} /></div>
      </SectionCard>
    </>
  );
}

/* ════════════════════════════════════════════
   4. AI & ANALYSIS
   ════════════════════════════════════════════ */
function AISection() {
  const c = useColors();
  const [freq, setFreq] = useState("Continuous");
  const [summaryTime, setSummaryTime] = useState("20:00");
  const [weekDay, setWeekDay] = useState("Sunday");
  const [checkinOn, setCheckinOn] = useState(true);
  const [aiDisclosure, setAiDisclosure] = useState(false);

  return (
    <>
      <SectionCard title="Analysis Preferences" icon={<Brain size={18} />} iconColor={c.green}>
        <SettingRow label="Analysis frequency" desc="Continuous analysis gives you the most accurate real-time risk assessment. Reducing frequency saves battery.">
          <SegmentedControl options={["Continuous", "5 min", "15 min"]} value={freq} onChange={setFreq} />
        </SettingRow>
        <SettingRow label="Daily AI summary time" desc="When the AI generates your daily narrative">
          <input type="time" value={summaryTime} onChange={(e) => setSummaryTime(e.target.value)} style={{
            background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.inputBorder,
            borderRadius: 8, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text, outline: "none",
          }} />
        </SettingRow>
        <SettingRow label="Weekly report day">
          <select value={weekDay} onChange={(e) => setWeekDay(e.target.value)} style={{
            background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.inputBorder,
            borderRadius: 8, padding: "6px 10px", fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text, outline: "none",
          }}>
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="Check-in reminder" desc="Daily morning check-in prompt">
          <div className="flex items-center gap-3">
            <Toggle on={checkinOn} onToggle={() => setCheckinOn(!checkinOn)} />
            {checkinOn && <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: c.text }}>08:00</span>}
          </div>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Baseline Management" icon={<Heart size={18} />} iconColor={c.red}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { l: "Baseline established", v: "12 Feb 2026" },
            { l: "Days of data", v: "50 days" },
            { l: "Resting HR range", v: "58–74 BPM" },
          ].map(s => (
            <div key={s.l} className="p-3 rounded-lg" style={{ background: c.cardElevated }}>
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.muted, display: "block", marginBottom: 2 }}>{s.l}</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>{s.v}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button className="px-4 py-2 rounded-lg" style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.amber, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.amber, background: "transparent" }}>Recalibrate baseline</button>
          <TextLink label="Reset to factory baseline" color={c.muted} />
        </div>
      </SectionCard>

      <SectionCard title="Model Information" icon={<Sparkles size={18} />} iconColor={c.blue}>
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div>
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.muted }}>AI Model</span>
            <span className="ml-2" style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>CardiShirt Neural v3.2</span>
          </div>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>Updated 25 Mar 2026</span>
        </div>
        <button onClick={() => setAiDisclosure(!aiDisclosure)} className="flex items-center gap-1" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.blue }}>
          How does CardiShirt AI work? {aiDisclosure ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {aiDisclosure && (
          <div className="mt-3 p-4 rounded-lg" style={{ background: c.cardElevated }}>
            <p style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.secondary, lineHeight: 1.7 }}>
              CardiShirt AI continuously analyzes your ECG waveform patterns, heart rate variability, and rhythm regularity. It compares your real-time data against your personal baseline and clinical population data to detect anomalies. The AI does not diagnose medical conditions — it identifies patterns that may require attention and suggests you consult your doctor. All analysis runs locally on your device with periodic cloud validation.
            </p>
            <TextLink label="View full AI disclosure →" color={c.blue} />
          </div>
        )}
      </SectionCard>
    </>
  );
}

/* ════════════════════════════════════════════
   5. DISPLAY & LANGUAGE
   ════════════════════════════════════════════ */
function DisplaySection() {
  const c = useColors();
  const { theme, toggle } = useTheme();
  const [lang, setLang] = useState("English");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [bengaliNums, setBengaliNums] = useState(false);
  const [themeMode, setThemeMode] = useState(theme === "dark" ? "Dark" : "Light");
  const [textSize, setTextSize] = useState("Standard");
  const [showFamily, setShowFamily] = useState(true);
  const [showMeds, setShowMeds] = useState(true);
  const [showCheckin, setShowCheckin] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [aiProactive, setAiProactive] = useState("Normal");

  return (
    <>
      <SectionCard title="Language" icon={<Globe size={18} />} iconColor="#5B8AF0">
        <div className="flex items-center gap-0 rounded-xl overflow-hidden mb-4 self-start" style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder, display: "inline-flex" }}>
          {["English", "বাংলা"].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: "10px 28px", fontFamily: "Syne, sans-serif", fontSize: 15,
              background: lang === l ? c.red : "transparent",
              color: lang === l ? "#fff" : c.secondary, fontWeight: lang === l ? 500 : 400,
              transition: "all 0.2s",
            }}>{l}</button>
          ))}
        </div>
        <p className="mb-4" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.muted }}>
          All AI-generated text will update to your selected language within a few minutes.
        </p>
        <SettingRow label="Time format">
          <SegmentedControl options={["12h", "24h"]} value={timeFormat} onChange={setTimeFormat} />
        </SettingRow>
        <SettingRow label="Date format">
          <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} style={{
            background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.inputBorder,
            borderRadius: 8, padding: "6px 10px", fontFamily: "DM Mono, monospace", fontSize: 13, color: c.text, outline: "none",
          }}>
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </SettingRow>
        <SettingRow label="Bengali numerals" desc="Display numerals in Bengali script (০১২৩) for non-medical values. Medical data always uses Western numerals for clinical legibility.">
          <Toggle on={bengaliNums} onToggle={() => setBengaliNums(!bengaliNums)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Appearance" icon={<Sun size={18} />} iconColor={c.amber}>
        <SettingRow label="Theme">
          <SegmentedControl options={["System", "Light", "Dark"]} value={themeMode} onChange={(v) => {
            setThemeMode(v);
            if ((v === "Dark" && theme === "light") || (v === "Light" && theme === "dark")) toggle();
          }} />
        </SettingRow>
        <SettingRow label="Text size" desc="Larger text for improved readability">
          <SegmentedControl options={["Standard", "Large", "Extra Large"]} value={textSize} onChange={setTextSize} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Dashboard Preferences" icon={<Monitor size={18} />} iconColor={c.secondary}>
        <SettingRow label="Show family circle widget"><Toggle on={showFamily} onToggle={() => setShowFamily(!showFamily)} /></SettingRow>
        <SettingRow label="Show medication log"><Toggle on={showMeds} onToggle={() => setShowMeds(!showMeds)} /></SettingRow>
        <SettingRow label="Show daily check-in card" desc="Disabling removes the morning check-in ritual entirely"><Toggle on={showCheckin} onToggle={() => setShowCheckin(!showCheckin)} /></SettingRow>
        <SettingRow label="ECG baseline band" desc="Show personalized baseline band on the ECG canvas"><Toggle on={showBaseline} onToggle={() => setShowBaseline(!showBaseline)} /></SettingRow>
        <SettingRow label="AI proactive messages" desc="How often the AI initiates messages in the chat">
          <SegmentedControl options={["Normal", "Once/day", "Off"]} value={aiProactive} onChange={setAiProactive} />
        </SettingRow>
      </SectionCard>
    </>
  );
}

/* ════════════════════════════════════════════
   6. PRIVACY & DATA
   ════════════════════════════════════════════ */
function PrivacySection() {
  const c = useColors();
  const [analytics, setAnalytics] = useState(true);
  const [doctorShare, setDoctorShare] = useState(true);
  const [qaShare, setQaShare] = useState(true);
  const [appLock, setAppLock] = useState(false);

  const sessions = [
    { device: "Adnan's Galaxy S24", last: "Active now", current: true },
    { device: "Fatema's iPhone 15", last: "2 hours ago", current: false },
    { device: "Chrome — Desktop", last: "Yesterday", current: false },
  ];

  return (
    <>
      <SectionCard title="Data Sharing" icon={<Eye size={18} />} iconColor={c.blue}>
        <SettingRow label="Anonymous analytics" desc="Help improve the AI model with anonymous usage data"><Toggle on={analytics} onToggle={() => setAnalytics(!analytics)} /></SettingRow>
        <SettingRow label="Share with your doctor" desc="Your registered doctor can view your monitoring data"><Toggle on={doctorShare} onToggle={() => setDoctorShare(!doctorShare)} /></SettingRow>
        <SettingRow label="Medical review team" desc="CardiShirt quality assurance — no personal data shared"><Toggle on={qaShare} onToggle={() => setQaShare(!qaShare)} /></SettingRow>
        <div className="mt-3"><TextLink label="View full privacy policy →" color={c.blue} /></div>
      </SectionCard>

      <SectionCard title="Storage & Export" icon={<Download size={18} />} iconColor={c.green}>
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div>
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>Local storage</span>
            <span className="ml-2" style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>2.4 GB</span>
            <span className="ml-1" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.muted }}>of ECG data</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="px-4 py-2 rounded-lg" style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text, background: "transparent" }}>Manage storage</button>
          <button className="px-4 py-2 rounded-lg flex items-center gap-1.5" style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.blue, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.blue, background: "transparent" }}>
            <Download size={14} /> Export all data
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Security" icon={<Lock size={18} />} iconColor="#6B7499">
        <SettingRow label="App lock" desc="Require biometric or PIN to open the app"><Toggle on={appLock} onToggle={() => setAppLock(!appLock)} /></SettingRow>
        {appLock && (
          <div className="mb-3"><TextLink label="Change PIN" color={c.red} /></div>
        )}
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: c.secondary, marginTop: 12, marginBottom: 8 }}>Active sessions</div>
        <div className="flex flex-col gap-2">
          {sessions.map(s => (
            <div key={s.device} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: c.cardElevated }}>
              <div className="flex items-center gap-2">
                <Smartphone size={14} style={{ color: c.secondary }} />
                <div>
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{s.device}</span>
                  {s.current && <span className="ml-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.green }}>This device</span>}
                  <span className="block" style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.muted }}>{s.last}</span>
                </div>
              </div>
              {!s.current && <TextLink label="Log out" color={c.red} />}
            </div>
          ))}
        </div>
        <div className="mt-3"><TextLink label="Log out all devices" color={c.red} /></div>
      </SectionCard>
    </>
  );
}

/* ════════════════════════════════════════════
   7. EMERGENCY CONFIGURATION
   ════════════════════════════════════════════ */
function EmergencySection() {
  const c = useColors();
  const [dispatchOn, setDispatchOn] = useState(true);
  const [window, setWindow] = useState(60);
  const [showTestResult, setShowTestResult] = useState(false);

  return (
    <>
      <SectionCard title="Automatic Dispatch" icon={<ShieldAlert size={18} />} iconColor={c.red}>
        <SettingRow label="Enable automatic dispatch" desc="Dispatch ambulance automatically when critical event is detected and patient does not respond">
          <Toggle on={dispatchOn} onToggle={() => setDispatchOn(!dispatchOn)} />
        </SettingRow>
        {dispatchOn && (
          <>
            <SettingRow label="Response window" desc="Seconds before automatic dispatch begins">
              <div className="flex items-center gap-3">
                <input type="range" min={30} max={120} step={10} value={window} onChange={(e) => setWindow(+e.target.value)} style={{ width: 120, accentColor: c.red }} />
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: c.text }}>{window}s</span>
              </div>
            </SettingRow>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 mb-3">
              <div className="p-3 rounded-lg" style={{ background: c.cardElevated }}>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary, display: "block", marginBottom: 2 }}>Dispatch address</span>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>42/3 Dhanmondi, Road 7A, Dhaka 1205</span>
                <div className="mt-1"><TextLink label="Edit" color={c.red} /></div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: c.cardElevated }}>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary, display: "block", marginBottom: 2 }}>Dispatch phone</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>+880 1712-345678</span>
                <div className="mt-1"><TextLink label="Edit" color={c.red} /></div>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      {/* Dispatch Test */}
      <SectionCard title="Dispatch Test" icon={<TestTube size={18} />} iconColor={c.amber}>
        <p className="mb-3" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.secondary, lineHeight: 1.6 }}>
          Simulate the full automatic dispatch countdown without sending any real notifications or calls. See exactly which contacts and services would be activated.
        </p>
        {!showTestResult ? (
          <button onClick={() => setShowTestResult(true)} className="px-5 py-2.5 rounded-lg flex items-center gap-2" style={{
            borderWidth: 1.5, borderStyle: "solid", borderColor: c.amber,
            fontFamily: "Syne, sans-serif", fontSize: 14, color: c.amber, background: "transparent",
          }}>
            <Play size={16} /> Run dispatch test
          </button>
        ) : (
          <div className="p-4 rounded-xl" style={{ background: c.cardElevated, borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} style={{ color: c.green }} />
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.text }}>Test Complete</span>
            </div>
            <p style={{ fontFamily: "Syne, sans-serif", fontSize: 15, color: c.secondary, lineHeight: 1.6, marginBottom: 12 }}>
              In a real emergency, CardiShirt would have called <strong style={{ color: c.text }}>Dhaka Ambulance Service (999)</strong> and notified <strong style={{ color: c.text }}>3 family members</strong> within <strong style={{ color: c.text }}>45 seconds</strong>.
            </p>
            <div className="flex flex-col gap-1.5 mb-3">
              {[
                { who: "Rehnuma", method: "Push + SMS + Call", time: "0s" },
                { who: "Rumi", method: "Push + SMS", time: "5s" },
                { who: "Jabed", method: "Push + SMS", time: "10s" },
                { who: "Dhaka Ambulance (999)", method: "API dispatch", time: "60s" },
              ].map(r => (
                <div key={r.who} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: c.d ? "#0D0F1A" : "#F0F2F8" }}>
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{r.who}</span>
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>{r.method}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>T+{r.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTestResult(false)} style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.red }}>Close</button>
          </div>
        )}
      </SectionCard>

      {/* Emergency Contacts Summary */}
      <SectionCard title="Emergency Contacts" icon={<Phone size={18} />} iconColor={c.red}>
        {[
          { name: "Rehnuma", role: "Daughter · Primary", pri: 1 },
          { name: "Rumi", role: "Son", pri: 2 },
          { name: "Jabed", role: "Spouse", pri: 3 },
        ].map(m => (
          <div key={m.name} className="flex items-center gap-3 py-2.5" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: c.divider }}>
            <span className="flex items-center justify-center flex-shrink-0" style={{
              width: 22, height: 22, borderRadius: 11,
              background: m.pri === 1 ? `${c.red}20` : c.strip,
              fontFamily: "DM Mono, monospace", fontSize: 11,
              color: m.pri === 1 ? c.red : c.muted,
            }}>{m.pri}</span>
            <div className="flex-1 min-w-0">
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text }}>{m.name}</span>
              <span className="ml-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>{m.role}</span>
            </div>
          </div>
        ))}
        <div className="mt-3"><TextLink label="Manage in Family Circle →" color={c.red} /></div>
      </SectionCard>

      {/* Ambulance Services */}
      <SectionCard title="Registered Services" icon={<Ambulance size={18} />} iconColor={c.red}>
        {[
          { name: "National Emergency (999)", integrated: true },
          { name: "Dhaka Ambulance Service", integrated: true },
          { name: "LifeLine Express", integrated: false },
        ].map(s => (
          <div key={s.name} className="flex items-center justify-between py-2.5" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: c.divider }}>
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text }}>{s.name}</span>
            <span style={{
              padding: "2px 8px", borderRadius: 10,
              background: s.integrated ? `${c.green}15` : `${c.muted}15`,
              color: s.integrated ? c.green : c.muted,
              fontFamily: "Syne, sans-serif", fontSize: 11,
            }}>{s.integrated ? "Integrated" : "Manual"}</span>
          </div>
        ))}
      </SectionCard>
    </>
  );
}

/* ════════════════════════════════════════════
   8. ABOUT & SUPPORT
   ════════════════════════════════════════════ */
function AboutSection() {
  const c = useColors();
  const [diagSent, setDiagSent] = useState(false);

  return (
    <>
      <SectionCard title="CardiShirt" icon={<Heart size={18} />} iconColor={c.red}>
        <div className="flex items-center gap-4 mb-3">
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.secondary }}>App version</span>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>2.8.0</span>
        </div>
        <button className="px-4 py-2 rounded-lg" style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text, background: "transparent" }}>
          Check for app updates
        </button>
      </SectionCard>

      <SectionCard title="Support & Resources" icon={<HelpCircle size={18} />} iconColor={c.blue}>
        <div className="flex flex-col gap-1">
          {[
            { label: "Help center", icon: <HelpCircle size={16} />, col: c.blue },
            { label: "Contact support", icon: <MessageSquare size={16} />, col: c.blue },
            { label: "Report a problem", icon: <Bug size={16} />, col: c.amber },
            { label: "Regulatory information", icon: <FileText size={16} />, col: c.secondary },
            { label: "Terms of service", icon: <FileText size={16} />, col: c.secondary },
            { label: "Privacy policy", icon: <Lock size={16} />, col: c.secondary },
          ].map(l => (
            <button key={l.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text }}>
              <span style={{ color: l.col }}>{l.icon}</span>
              {l.label}
              <ChevronRight size={14} style={{ color: c.muted, marginLeft: "auto" }} />
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Diagnostics" icon={<Send size={18} />} iconColor={c.secondary}>
        <p className="mb-3" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.secondary, lineHeight: 1.6 }}>
          This sends a technical summary of your app and device to the CardiShirt team to help diagnose problems. It does not include your ECG data.
        </p>
        {!diagSent ? (
          <button onClick={() => setDiagSent(true)} className="px-4 py-2 rounded-lg flex items-center gap-2" style={{
            borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder,
            fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text, background: "transparent",
          }}>
            <Send size={14} /> Send diagnostic report
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: c.green }} />
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.green }}>Diagnostic report sent</span>
          </div>
        )}
      </SectionCard>
    </>
  );
}

/* ════════════════════════════════════════════
   MAIN SETTINGS SCREEN
   ════════════════════════════════════════════ */
export function SettingsScreen() {
  const c = useColors();
  const [activeCategory, setActiveCategory] = useState<Category>("profile");
  const [mobileView, setMobileView] = useState<"list" | "content">("list");
  const [tabletNavOpen, setTabletNavOpen] = useState(false);
  const items = useCategoryItems();

  const renderContent = () => {
    switch (activeCategory) {
      case "profile": return <ProfileSection />;
      case "device": return <DeviceSection />;
      case "alerts": return <AlertsSection />;
      case "ai": return <AISection />;
      case "display": return <DisplaySection />;
      case "privacy": return <PrivacySection />;
      case "emergency": return <EmergencySection />;
      case "about": return <AboutSection />;
    }
  };

  const activeLabel = items.find(i => i.id === activeCategory)?.label || "";

  return (
    <div className="h-full overflow-hidden flex flex-col" style={{ background: c.pageBg }}>

      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden px-4 py-3 flex items-center gap-3" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: c.divider }}>
        {mobileView === "content" && (
          <button onClick={() => setMobileView("list")} className="flex items-center gap-1" style={{ color: c.red, fontFamily: "Syne, sans-serif", fontSize: 13 }}>
            <ChevronLeft size={18} /> Back
          </button>
        )}
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 500, color: c.text }}>
          {mobileView === "list" ? "Settings" : activeLabel}
        </span>
      </div>

      {/* ── TABLET: Vertical Category List (hamburger-style) ── */}
      <div className="hidden md:block xl:hidden" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: c.divider }}>
        <button onClick={() => setTabletNavOpen(!tabletNavOpen)} className="w-full flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            {(() => { const ai = items.find(i => i.id === activeCategory); return ai ? <ai.icon size={18} style={{ color: ai.iconColor }} /> : null; })()}
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.text }}>{activeLabel}</span>
          </div>
          <ChevronDown size={18} style={{ color: c.muted, transform: tabletNavOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>
        {tabletNavOpen && (
          <div className="px-3 pb-3">
            {items.map((item, i) => {
              const isActive = activeCategory === item.id;
              const isLast = i === items.length - 1;
              return (
                <div key={item.id}>
                  {isLast && <div className="my-1.5" style={{ height: 1, background: c.divider }} />}
                  <button
                    onClick={() => { setActiveCategory(item.id); setTabletNavOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left"
                    style={{
                      background: isActive ? c.activeNavBg : "transparent",
                      borderLeftWidth: 3, borderLeftStyle: "solid",
                      borderLeftColor: isActive ? c.navBorder : "transparent",
                    }}
                  >
                    <item.icon size={18} style={{ color: isActive ? c.red : item.iconColor, flexShrink: 0 }} />
                    <span className="flex-1" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: isActive ? c.text : c.secondary }}>{item.label}</span>
                    {item.badge && <span className="flex-shrink-0">{item.badge}</span>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── DESKTOP: Left Settings Nav ── */}
        <div className="hidden xl:block w-[220px] flex-shrink-0 overflow-y-auto py-4 px-2" style={{ borderRightWidth: 1, borderRightStyle: "solid", borderRightColor: c.divider }}>
          <CategoryNav active={activeCategory} onSelect={setActiveCategory} />
        </div>

        {/* ── MOBILE: Category List ── */}
        {mobileView === "list" && (
          <div className="md:hidden flex-1 overflow-y-auto p-4">
            {items.map((item, i) => {
              const isLast = i === items.length - 1;
              return (
                <div key={item.id}>
                  {isLast && <div className="my-2" style={{ height: 1, background: c.divider }} />}
                  <button
                    onClick={() => { setActiveCategory(item.id); setMobileView("content"); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left"
                  >
                    <item.icon size={20} style={{ color: item.iconColor, flexShrink: 0 }} />
                    <span className="flex-1" style={{ fontFamily: "Syne, sans-serif", fontSize: 15, color: c.text }}>{item.label}</span>
                    {item.badge && <span className="flex-shrink-0">{item.badge}</span>}
                    <ChevronRight size={16} style={{ color: c.muted }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CONTENT AREA ── */}
        <div className={`flex-1 overflow-y-auto ${mobileView === "list" ? "hidden md:block" : ""}`}>
          <div className="max-w-[720px] mx-auto px-4 md:px-8 py-6">
            {/* Desktop/Tablet title */}
            <div className="hidden md:block mb-6">
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 500, color: c.text }}>{activeLabel}</div>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
