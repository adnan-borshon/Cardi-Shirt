import { useState, useEffect, useCallback, useRef } from "react";
import {
  UserPlus, Phone, Shield, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp,
  MoreVertical, X, Check, AlertTriangle, CheckCircle, Clock, Heart, Activity,
  Shirt, Bell, Eye, BookOpen, TrendingUp, Ambulance,
  Play, Pause, PhoneCall, PhoneForwarded, ArrowUp, ArrowDown,
  Plus, Trash2, Edit2, Send, ExternalLink, Info, Sparkles, Circle,
  TestTube, Navigation, User
} from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { useTheme, useTokens } from "./ThemeContext";
import { useLiveVitals, API_URL } from "./useBackend";

/* ═══════════════ THEME COLORS ═══════════════ */
function useColors() {
  const { theme } = useTheme();
  const tk = useTokens();
  const d = theme === "dark" || theme === "ocean";
  return {
    pageBg: tk.pageBg,
    cardBg: tk.cardBg,
    cardElevated: tk.cardElevated,
    cardBorder: tk.cardBorder,
    text: tk.textPrimary,
    secondary: tk.textSecondary,
    muted: tk.textMuted,
    strip: theme === "ocean" ? "#0A1929" : theme === "nature" ? "#E8F0EA" : d ? "#1A1D35" : "#F0F2F8",
    shadow: tk.shadow,
    inputBg: tk.inputBg,
    inputBorder: tk.cardBorder,
    chipBg: tk.chipBg,
    emergBg: tk.cardiacRedGlow,
    emergBorder: "rgba(232,48,74,0.15)",
    emergActiveBg: "rgba(232,48,74,0.1)",
    emergActiveBorder: "rgba(232,48,74,0.5)",
    rightBg: tk.pageBg,
    rightCard: tk.cardBg,
    rightText: tk.textPrimary,
    rightSecondary: tk.textSecondary,
    ringTrack: tk.ecgGrid,
    red: tk.cardiacRed,
    green: tk.green,
    amber: tk.amber,
    blue: "#5B8AF0",
    gray: "#C2C8D6",
    d,
  };
}

/* ═══════════════ TYPES & INTERFACES ═══════════════ */
interface Member {
  id: string;
  name: string;
  initials: string;
  relationship: string;
  phone: string;
  email: string;
  avatarColor: string;
  status: "active" | "recent" | "inactive" | "pending";
  lastActivity: string;
  notifLevel: "all" | "critical" | "daily" | "off";
  isEmergencyContact: boolean;
  emergencyPriority: number;
  permissions: { ecg: boolean; diary: boolean; alerts: boolean; dashboard: boolean };
}

const MEMBERS_INIT: Member[] = [
  {
    id: "m1", name: "Fatema Khatun", initials: "FK", relationship: "Daughter",
    phone: "+880 1712-345678", email: "fatema@email.com", avatarColor: "#E8304A",
    status: "active", lastActivity: "Viewing your dashboard now",
    notifLevel: "all", isEmergencyContact: true, emergencyPriority: 1,
    permissions: { ecg: true, diary: true, alerts: true, dashboard: true },
  },
  {
    id: "m2", name: "Rifat Ahmed", initials: "RA", relationship: "Son",
    phone: "+880 1898-765432", email: "rifat@email.com", avatarColor: "#5B8AF0",
    status: "recent", lastActivity: "Viewed your data 42 min ago",
    notifLevel: "critical", isEmergencyContact: true, emergencyPriority: 2,
    permissions: { ecg: true, diary: false, alerts: true, dashboard: true },
  },
  {
    id: "m3", name: "Karim Uddin", initials: "KU", relationship: "Spouse",
    phone: "+880 1552-112233", email: "", avatarColor: "#27C28A",
    status: "inactive", lastActivity: "Has not opened the app in 3 days",
    notifLevel: "daily", isEmergencyContact: true, emergencyPriority: 3,
    permissions: { ecg: false, diary: false, alerts: true, dashboard: true },
  },
  {
    id: "m4", name: "Dr. Nusrat Jahan", initials: "NJ", relationship: "Caregiver",
    phone: "+880 1911-556677", email: "drnusrat@hospital.bd", avatarColor: "#F5A623",
    status: "pending", lastActivity: "Invitation sent — awaiting acceptance",
    notifLevel: "all", isEmergencyContact: false, emergencyPriority: 0,
    permissions: { ecg: true, diary: true, alerts: true, dashboard: true },
  },
];

interface AmbulanceService {
  id: string;
  name: string;
  number: string;
  integrated: boolean;
  coverage: string;
  responseTime: string;
  autoDispatch?: boolean;
}

const SERVICES_INIT: AmbulanceService[] = [
  { id: "s1", name: "National Emergency", number: "999", integrated: true, coverage: "Nationwide", responseTime: "12–20 min" },
  { id: "s2", name: "Dhaka Ambulance Service", number: "+880 1700-000999", integrated: true, coverage: "Dhaka Metropolitan", responseTime: "8–14 min" },
  { id: "s3", name: "LifeLine Express", number: "+880 1800-911911", integrated: false, coverage: "Dhaka & Chittagong", responseTime: "10–18 min" },
];

/* ═══════════════ UTILITY UI COMPONENTS ═══════════════ */
function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  const c = useColors();
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      style={{
        width: 42, height: 24, borderRadius: 12, position: "relative",
        background: on ? c.red : c.d ? "#2A2E50" : "#D1D5DB",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 18, height: 18, borderRadius: 9, background: "#fff",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

function Pill({ label, active, onClick, color }: { label: string; active?: boolean; onClick?: () => void; color?: string }) {
  const c = useColors();
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 20,
      background: active ? (color || c.red) : "transparent",
      color: active ? "#fff" : c.secondary,
      border: active ? "none" : `1px solid ${c.cardBorder}`,
      fontFamily: "Syne, sans-serif", fontSize: 12,
      cursor: "pointer", transition: "all 0.15s",
    }}>{label}</button>
  );
}

function SectionDivider({ label }: { label: string }) {
  const c = useColors();
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: c.cardBorder }} />
      <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: c.secondary, whiteSpace: "nowrap" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: c.cardBorder }} />
    </div>
  );
}

/* ── Countdown Ring ── */
function CountdownRing({ seconds, total, size = 160 }: { seconds: number; total: number; size?: number }) {
  const c = useColors();
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const progress = seconds / total;
  const offset = circ * (1 - progress);
  const isUrgent = seconds <= 10;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isUrgent ? c.red : c.amber} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: size * 0.3, color: isUrgent ? c.red : c.text }}>{seconds}</span>
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>seconds</span>
      </div>
    </div>
  );
}

/* ── Swipe To Confirm ── */
function SwipeToConfirm({ onConfirm }: { onConfirm: () => void }) {
  const c = useColors();
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const trackWidth = useRef(0);
  const threshold = 0.8;

  const handleStart = (clientX: number) => {
    setDragging(true);
    startX.current = clientX;
    trackWidth.current = trackRef.current?.clientWidth || 300;
  };
  const handleMove = (clientX: number) => {
    if (!dragging) return;
    const dx = Math.max(0, Math.min(clientX - startX.current, trackWidth.current - 56));
    setDragX(dx);
  };
  const handleEnd = () => {
    setDragging(false);
    if (dragX > (trackWidth.current - 56) * threshold) {
      onConfirm();
    }
    setDragX(0);
  };

  return (
    <div
      ref={trackRef}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={() => { if (dragging) handleEnd(); }}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      style={{
        position: "relative", width: "100%", height: 56, borderRadius: 28,
        background: `linear-gradient(90deg, rgba(39,194,138,0.15), rgba(39,194,138,0.05))`,
        border: `1px solid rgba(39,194,138,0.3)`, overflow: "hidden",
        cursor: "grab", userSelect: "none",
      }}
    >
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.green, opacity: 0.7 }}>
          Swipe to confirm you are okay →
        </span>
      </div>
      <div style={{
        position: "absolute", top: 4, left: 4 + dragX, width: 48, height: 48,
        borderRadius: 24, background: c.green, display: "flex",
        alignItems: "center", justifyContent: "center",
        transition: dragging ? "none" : "left 0.3s ease",
        boxShadow: "0 2px 12px rgba(39,194,138,0.4)",
      }}>
        <Check size={22} color="#fff" />
      </div>
    </div>
  );
}

/* ═══════════════ EDIT FIELD MODAL ═══════════════ */
function EditFieldModal({ title, value, onSave, onClose }: { title: string, value: string, onSave: (v: string) => void, onClose: () => void }) {
  const c = useColors();
  const [val, setVal] = useState(value);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 16, width: "100%", maxWidth: 400,
        boxShadow: "0 8px 40px rgba(0,0,0,0.3)", padding: 24
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 16 }}>{title}</div>
        <input value={val} onChange={e => setVal(e.target.value)} style={{
          width: "100%", background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 8,
          padding: "10px 14px", fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text, marginBottom: 16, outline: "none"
        }} />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>Cancel</button>
          <button onClick={() => { onSave(val); onClose(); }} className="px-4 py-2 rounded-lg" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ MEMBER COMPONENT CARD ═══════════════ */
function MemberCard({
  member, onEditPerms, editOpen, onRemove, onUpdate, onResend, onCall,
}: {
  member: Member;
  onEditPerms: (id: string | null) => void;
  editOpen: boolean;
  onRemove: (id: string) => void;
  onUpdate: (id: string, data: Partial<Member>) => void;
  onResend: (id: string) => void;
  onCall: (id: string) => void;
}) {
  const c = useColors();
  const [perms, setPerms] = useState(member.permissions);
  const [notif, setNotif] = useState(member.notifLevel);
  const [isEC, setIsEC] = useState(member.isEmergencyContact);
  const [showMenu, setShowMenu] = useState(false);
  const isPending = member.status === "pending";
  const isInactive = member.status === "inactive";

  const notifLabel = notif === "all" ? "All alerts" : notif === "critical" ? "Critical only" : notif === "daily" ? "Daily summary" : "Off";
  const notifColor = notif === "all" ? c.green : notif === "critical" ? c.amber : c.gray;

  return (
    <div style={{
      borderRadius: 12, overflow: "hidden", transition: "all 0.2s",
      opacity: isInactive ? 0.65 : 1, boxShadow: c.shadow, display: "flex",
    }}>
      {isPending && <div style={{ width: 3, flexShrink: 0, background: c.amber }} />}
      <div style={{
        flex: 1, minWidth: 0, background: c.cardBg,
        borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder,
        borderTopLeftRadius: isPending ? 0 : 12, borderBottomLeftRadius: isPending ? 0 : 12,
        borderTopRightRadius: 12, borderBottomRightRadius: 12, overflow: "hidden",
      }}>
        <div className="p-4 flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="flex items-center justify-center animate-fade-in" style={{
              width: 48, height: 48, borderRadius: 24,
              background: member.avatarColor, color: "#fff",
              fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 500,
            }}>{member.initials}</div>
            <div style={{
              position: "absolute", bottom: -2, right: -2, width: 14, height: 14,
              borderRadius: 7, border: `2.5px solid ${c.cardBg}`,
              background: member.status === "active" ? c.green : member.status === "recent" ? c.blue : c.gray,
            }} />
          </div>

          <div className="flex-1 min-w-0">
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.text }}>{member.name}</div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>{member.relationship}</div>
            {isPending ? (
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.amber }}>{member.lastActivity}</span>
                <button className="hover:underline text-[12px]" style={{ color: c.red }} onClick={() => onResend(member.id)}>Resend</button>
                <button className="hover:underline text-[12px]" style={{ color: c.secondary }} onClick={() => onRemove(member.id)}>Cancel</button>
              </div>
            ) : (
              <div className="mt-1" style={{
                fontFamily: member.status === "active" ? "Syne, sans-serif" : "DM Mono, monospace",
                fontSize: 12, color: member.status === "active" ? c.blue : c.muted,
              }}>{member.lastActivity}</div>
            )}
          </div>

          {!isPending && (
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span style={{
                padding: "3px 10px", borderRadius: 12,
                background: `${notifColor}12`, color: notifColor,
                fontFamily: "Syne, sans-serif", fontSize: 11,
              }}>{notifLabel}</span>
              {member.isEmergencyContact && (
                <span style={{
                  padding: "2px 8px", borderRadius: 10,
                  background: `${c.red}14`, color: c.red,
                  fontFamily: "Syne, sans-serif", fontSize: 10,
                }}>Emergency #{member.emergencyPriority}</span>
              )}
              <button onClick={() => onEditPerms(editOpen ? null : member.id)} className="hover:underline text-[12px] font-semibold" style={{ color: c.red, cursor: "pointer" }}>
                Permissions
              </button>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-full"><MoreVertical size={16} style={{ color: c.muted }} /></button>
                {showMenu && (
                  <div style={{
                    position: "absolute", right: 0, top: 20, zIndex: 10,
                    background: c.cardBg, border: `1px solid ${c.cardBorder}`,
                    borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    minWidth: 160, overflow: "hidden",
                  }}>
                    <button className="w-full px-4 py-2.5 text-left flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}
                      onClick={() => { setShowMenu(false); onCall(member.id); }}>
                      <Phone size={14} /> Call
                    </button>
                    <button className="w-full px-4 py-2.5 text-left flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.red }}
                      onClick={() => { setShowMenu(false); onRemove(member.id); }}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom status strip */}
        {!isPending && (
          <div className="flex items-center gap-4 px-4 py-1.5" style={{ background: c.strip, borderTop: `1px solid ${c.cardBorder}` }}>
            <div className="flex items-center gap-1">
              <Heart size={10} style={{ color: c.green }} />
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.muted }}>72 BPM</span>
            </div>
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.green }}>Normal</span>
            <div className="flex items-center gap-1 ml-auto">
              <div style={{ width: 6, height: 6, borderRadius: 3, background: c.green }} />
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: c.muted }}>Shirt connected</span>
            </div>
          </div>
        )}

        {/* Inline Permission Editor */}
        {editOpen && !isPending && (
          <div className="px-5 pb-5 pt-4 border-t border-dashed" style={{ borderColor: c.cardBorder }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text, marginBottom: 14 }}>
              What {member.name.split(" ")[0]} can see and receive
            </div>

            <div className="flex flex-col gap-3 mb-5">
              {([
                { key: "dashboard" as const, icon: Eye, label: "Live Dashboard", desc: "Can see your heart rate and ECG in real time" },
                { key: "ecg" as const, icon: Activity, label: "ECG Records", desc: "Can browse your full recording history" },
                { key: "diary" as const, icon: BookOpen, label: "Cardiac Diary", desc: "Can view your daily diary and wearing history" },
                { key: "alerts" as const, icon: Bell, label: "Alert Notifications", desc: "Receives notifications when alerts are triggered" },
              ]).map(t => (
                <div key={t.key} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <t.icon size={16} style={{ color: c.secondary, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{t.label}</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary }}>{t.desc}</div>
                    </div>
                  </div>
                  <Toggle on={perms[t.key]} onToggle={() => setPerms(p => ({ ...p, [t.key]: !p[t.key] }))} />
                </div>
              ))}
            </div>

            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 500, color: c.secondary, marginBottom: 8 }}>
              Notification frequency
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {([
                { key: "all" as const, label: "Every alert" },
                { key: "critical" as const, label: "Critical only" },
                { key: "daily" as const, label: "Daily summary" },
                { key: "off" as const, label: "Off" },
              ]).map(o => (
                <Pill key={o.key} label={o.label} active={notif === o.key} onClick={() => setNotif(o.key)} />
              ))}
            </div>

            <div className="flex items-center justify-between mb-5 p-3 rounded-lg" style={{ background: c.emergBg, border: `1px solid ${c.emergBorder}` }}>
              <div className="flex items-center gap-2">
                <Shield size={16} style={{ color: c.red }} />
                <div>
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text, fontWeight: 500 }}>Emergency Contact</span>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary }}>Will be notified/called during emergency dispatch</div>
                </div>
              </div>
              <Toggle on={isEC} onToggle={() => setIsEC(!isEC)} />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => { onUpdate(member.id, { permissions: perms, notifLevel: notif, isEmergencyContact: isEC }); onEditPerms(null); }} className="px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>
                Save changes
              </button>
              <button onClick={() => onEditPerms(null)} className="hover:underline text-xs" style={{ fontFamily: "Syne, sans-serif", color: c.secondary }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ ADD MEMBER MODAL ═══════════════ */
function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, rel: string, phone: string) => void }) {
  const c = useColors();
  const [rel, setRel] = useState("Child");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  const rels = ["Spouse", "Parent", "Child", "Sibling", "Caregiver", "Other"];

  const iStyle: React.CSSProperties = {
    background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 8,
    padding: "10px 14px", fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text,
    width: "100%", outline: "none",
  };

  const handleInvite = () => {
    if (!name.trim() || !phone.trim()) return;
    onAdd(name.trim(), rel, phone.trim());
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: c.cardBg, border: `1px solid ${c.cardBorder}`,
        borderRadius: 16, width: "100%", maxWidth: 480,
        boxShadow: "0 8px 40px rgba(0,0,0,0.3)", overflow: "hidden",
      }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${c.cardBorder}` }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 600, color: c.text }}>Invite Caregiver</span>
          <button onClick={onClose}><X size={20} style={{ color: c.muted }} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 4 }}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fatema Khatun" style={iStyle} />
          </div>
          <div>
            <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 4 }}>Relationship</label>
            <div className="flex flex-wrap gap-2">
              {rels.map(r => <Pill key={r} label={r} active={rel === r} onClick={() => setRel(r)} />)}
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 4 }}>Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880 1XXX-XXXXXX" style={iStyle} />
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.muted, marginTop: 2, display: "block" }}>
              They will receive a secure SMS invite containing instructions to access your circle.
            </span>
          </div>
        </div>
        <div className="px-6 py-4 flex items-center gap-3 border-t" style={{ borderColor: c.cardBorder }}>
          <button onClick={handleInvite} disabled={!name.trim() || !phone.trim()} className="px-5 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500 }}>
            <Send size={14} /> Send Invitation
          </button>
          <button onClick={onClose} className="hover:underline text-xs" style={{ fontFamily: "Syne, sans-serif", color: c.secondary }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ ALERT SIMULATION MODAL ═══════════════ */
function AlertSimulationModal({ countdownTotal, onClose, onCall }: { countdownTotal: number; onClose: () => void; onCall: () => void }) {
  const c = useColors();
  const [seconds, setSeconds] = useState(countdownTotal);
  const [phase, setPhase] = useState<"countdown" | "cancelled" | "dispatched" | "tracking">("countdown");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (phase !== "countdown" || paused) return;
    if (seconds <= 0) { setPhase("dispatched"); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, phase, paused]);

  useEffect(() => {
    if (phase === "dispatched") {
      const t = setTimeout(() => setPhase("tracking"), 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: c.d ? "rgba(13,15,26,0.98)" : "rgba(0,0,0,0.93)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", padding: 24,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, padding: "8px 0",
        background: c.amber, textAlign: "center",
        fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 600, color: "#0D0F1A",
      }}>
        ⚠ TEST MODE — Automatic Twilio/SMS Alert Dispatch Exercise
      </div>

      {phase === "countdown" && (
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="animate-pulse" style={{
            padding: "6px 16px", borderRadius: 20,
            background: "rgba(232,48,74,0.15)", color: c.red,
            fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 600,
          }}>
            🚨 Critical Cardiac Alert Triggered
          </div>

          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 17, color: "#F0F2FF", lineHeight: 1.5 }}>
            Fall or arrhythmia threshold breached. Automated Twilio dispatch countdown initiated.
          </div>

          <CountdownRing seconds={seconds} total={countdownTotal} size={160} />

          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "#8890B8" }}>
            Twilio broadcast queued for registered caregivers.
          </div>

          <div style={{ width: "100%", maxWidth: 360 }}>
            <SwipeToConfirm onConfirm={() => setPhase("cancelled")} />
          </div>

          <button onClick={() => { setSeconds(0); setPhase("dispatched"); }}
            className="px-6 py-2.5 rounded-lg flex items-center gap-1.5 hover:opacity-90" style={{
              background: "rgba(232,48,74,0.15)", border: `1px solid ${c.red}`,
              color: c.red, fontFamily: "Syne, sans-serif", fontSize: 13,
            }}>
            <PhoneCall size={14} /> Dispatch immediately
          </button>

          <div className="flex items-center gap-3 mt-2 text-xs">
            <button onClick={() => setPaused(!paused)} style={{ fontFamily: "Syne, sans-serif", color: "#8890B8" }}>
              {paused ? <Play size={12} className="inline mr-1" /> : <Pause size={12} className="inline mr-1" />}
              {paused ? "Resume" : "Pause"} test
            </button>
            <button onClick={onClose} style={{ fontFamily: "Syne, sans-serif", color: "#8890B8" }}>
              Abort simulation
            </button>
          </div>
        </div>
      )}

      {phase === "cancelled" && (
        <div className="flex flex-col items-center gap-5 max-w-md text-center">
          <div style={{
            width: 72, height: 72, borderRadius: 36,
            background: "rgba(39,194,138,0.15)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle size={36} style={{ color: c.green }} />
          </div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 500, color: "#F0F2FF" }}>
            Alert Resolved
          </div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: "#8890B8", lineHeight: 1.5 }}>
            Swipe confirmation completed. Caregivers notified of safe status. Twilio API trigger cleared.
          </div>
          <button onClick={onClose} className="px-6 py-2 rounded-lg" style={{ background: c.green, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>
            Close test
          </button>
        </div>
      )}

      {phase === "dispatched" && (
        <div className="flex flex-col items-center gap-5 max-w-md text-center">
          <div className="animate-pulse" style={{
            width: 72, height: 72, borderRadius: 36,
            background: "rgba(232,48,74,0.2)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Ambulance size={36} style={{ color: c.red }} />
          </div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 500, color: "#F0F2FF" }}>
            Ambulance Dispatched
          </div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: "#8890B8", lineHeight: 1.5 }}>
            SMS alerts pushed to primary contact lists. Emergency vehicle requested to registered locations.
          </div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.amber }} className="animate-pulse">
            Establishing live dispatch tracking tunnel...
          </div>
        </div>
      )}

      {phase === "tracking" && (
        <div className="flex flex-col items-center gap-5 max-w-md text-center w-full">
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 500, color: "#F0F2FF" }}>
            Active Dispatch Tracking
          </div>
          <div style={{
            width: "100%", maxWidth: 400, borderRadius: 16, overflow: "hidden",
            background: c.d ? "#141629" : "#1a1d2e", padding: 20,
            border: `1px solid ${c.cardBorder}`
          }}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 8, height: 8, borderRadius: 4, background: c.red }} className="animate-ping" />
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: "#F0F2FF" }}>Dispatch Active</span>
            </div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span style={{ fontFamily: "Syne, sans-serif", color: "#8890B8" }}>Dhaka Ambulance Dispatch</span>
              <span style={{ fontFamily: "DM Mono, monospace", color: c.amber }}>ETA: 8-12 min</span>
            </div>
            
            {/* Simulated map placeholder */}
            <div style={{
              width: "100%", height: 140, borderRadius: 12,
              background: c.d ? "#0D0F1A" : "#E8EAF0",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16, border: `1px solid ${c.cardBorder}`
            }}>
              <div className="flex flex-col items-center gap-1.5">
                <Navigation size={22} style={{ color: c.red }} className="animate-bounce" />
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: "#8890B8" }}>Live coordinates shared</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4 text-left border-t border-dashed pt-3" style={{ borderColor: c.cardBorder }}>
              {[
                { label: "Fatema Khatun", status: "ACK - En Route", color: c.green },
                { label: "Rifat Ahmed", status: "SMS Sent", color: c.amber },
                { label: "Karim Uddin", status: "No connection", color: c.gray },
              ].map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ fontFamily: "Syne, sans-serif", color: "#F0F2FF" }}>{f.label}</span>
                  <span style={{ fontFamily: "Syne, sans-serif", color: f.color, fontWeight: 500 }}>{f.status}</span>
                </div>
              ))}
            </div>

            <button onClick={onCall} className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500 }}>
              <PhoneForwarded size={14} /> Call Dispatch Center
            </button>
          </div>
          <button onClick={onClose} className="px-6 py-2 rounded-lg hover:bg-white/10 transition-colors" style={{
            background: "rgba(255,255,255,0.08)", color: "#F0F2FF",
            fontFamily: "Syne, sans-serif", fontSize: 13,
          }}>Exit Simulation</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ RIGHT PANEL — LIVE RECIPIENT STATUS ═══════════════ */
function LiveStatusPanel({ members }: { members: Member[] }) {
  const c = useColors();
  const { vitals, connected } = useLiveVitals();

  const bpm = connected && vitals ? Math.round(vitals.bpm) : 0;
  const temp = connected && vitals ? vitals.temp : 0;
  
  const NOTIFS = [
    { type: "Alert" as const, recipient: "Fatema", time: "Today, 2:14 PM", acked: true, critical: true },
    { type: "Anomaly" as const, recipient: "Rifat", time: "Today, 11:30 AM", acked: true, critical: false },
    { type: "Alert" as const, recipient: "Karim", time: "Yesterday, 3:47 PM", acked: false, critical: true },
    { type: "Summary" as const, recipient: "All", time: "Mon, 8:00 AM", acked: true, critical: false },
    { type: "System" as const, recipient: "Fatema", time: "Sun, 6:12 PM", acked: true, critical: false },
  ];

  const typePill = (t: string) =>
    t === "Alert" ? { bg: `${c.red}1A`, color: c.red } :
    t === "Anomaly" ? { bg: `${c.amber}1A`, color: c.amber } :
    t === "Summary" ? { bg: `${c.blue}1A`, color: c.blue } :
    { bg: `${c.gray}20`, color: c.gray };

  const activeMembers = members.filter(m => m.status === "active" || m.status === "recent");
  const inactiveMembers = members.filter(m => m.status === "inactive");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 600, color: c.text }}>Live Patient Status</div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className={`${connected ? "animate-pulse" : ""}`} style={{ width: 8, height: 8, borderRadius: 4, background: connected ? c.green : c.red }} />
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.secondary }}>
            {connected ? "Real-time sync active" : "Server disconnected"}
          </span>
        </div>
      </div>

      {/* Patient Vital Status Widget */}
      <div style={{ background: c.rightCard, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: 16, boxShadow: c.shadow }}>
        <div className="flex items-start justify-between">
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text }}>Patient (Self)</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 36, color: bpm > 0 ? c.green : c.muted, fontWeight: 500 }}>
                {bpm > 0 ? bpm : "—"}
              </span>
              {bpm > 0 && <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>BPM</span>}
            </div>
            
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: bpm > 100 || bpm < 50 && bpm > 0 ? c.red : bpm > 0 ? c.green : c.muted, marginTop: 2 }}>
              {bpm > 100 ? "Tachycardia alert" : bpm < 50 && bpm > 0 ? "Bradycardia alert" : bpm > 0 ? "Normal rhythm" : "Sensor offline"}
            </div>
            
            <div className="flex items-center gap-1.5 mt-3">
              <Shirt size={12} style={{ color: bpm > 0 ? c.green : c.muted }} />
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary }}>
                {bpm > 0 ? `Wearable active (${temp.toFixed(1)}°C)` : "Wearable power off"}
              </span>
            </div>
          </div>
          
          <div className="relative flex-shrink-0" style={{ width: 60, height: 60 }}>
            <svg width={60} height={60} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={30} cy={30} r={24} fill="none" stroke={c.d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth={5} />
              <circle cx={30} cy={30} r={24} fill="none" stroke={bpm > 0 ? c.green : c.gray} strokeWidth={5}
                strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 * (1 - (bpm > 0 ? 0.73 : 0))} strokeLinecap="round" />
            </svg>
            <span style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "DM Mono, monospace", fontSize: 16, color: bpm > 0 ? c.green : c.muted, fontWeight: 500
            }}>
              {bpm > 0 ? "93" : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Circle Members Active */}
      <div>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 500, color: c.secondary, marginBottom: 8 }}>Currently monitoring</div>
        <div className="flex items-center gap-2.5">
          {activeMembers.map(m => (
            <div key={m.id} className="relative">
              <div className="flex items-center justify-center" style={{
                width: 36, height: 36, borderRadius: 18, background: m.avatarColor,
                color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500
              }}>{m.initials}</div>
              <div style={{
                position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5,
                background: m.status === "active" ? c.green : c.blue, border: `2px solid ${c.rightBg}`,
              }} />
            </div>
          ))}
          {inactiveMembers.map(m => (
            <div key={m.id} className="relative opacity-40">
              <div className="flex items-center justify-center" style={{
                width: 36, height: 36, borderRadius: 18, background: m.avatarColor,
                color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13
              }}>{m.initials}</div>
              <div style={{
                position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: 5,
                background: c.gray, border: `2px solid ${c.rightBg}`,
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Notifications timeline log */}
      <div>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 500, color: c.secondary, marginBottom: 8 }}>Recent transmissions</div>
        <div className="flex flex-col gap-1.5">
          {NOTIFS.map((n, i) => {
            const pill = typePill(n.type);
            const unacked = n.critical && !n.acked;
            return (
              <div key={`notif-${i}`} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-black/5 dark:border-white/5" style={{
                background: c.rightCard,
                borderLeft: unacked ? `3px solid ${c.red}` : "3px solid transparent",
              }}>
                <span className="flex-shrink-0 px-2 py-0.5 rounded-full" style={{ background: pill.bg, color: pill.color, fontFamily: "DM Mono, monospace", fontSize: 9 }}>{n.type}</span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 9, color: c.muted }}>{n.time}</div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.text }}>Sent to {n.recipient}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ MAIN SCREEN COMPONENT ═══════════════ */
export function FamilyCircleScreen() {
  const c = useColors();
  const [members, setMembers] = useState(MEMBERS_INIT);
  const [editingPerms, setEditingPerms] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [tabletTab, setTabletTab] = useState<"family" | "status">("family");
  const [showAlertSim, setShowAlertSim] = useState(false);

  const [dispatchEnabled, setDispatchEnabled] = useState(true);
  const [responseWindow, setResponseWindow] = useState(60);
  const [countdownPreview, setCountdownPreview] = useState(false);
  const [previewSec, setPreviewSec] = useState(60);

  const [toast, setToast] = useState<string | null>(null);
  const [services, setServices] = useState(SERVICES_INIT.map(s => ({ ...s, autoDispatch: s.id === "s1" })));
  const [address, setAddress] = useState("42/3 Dhanmondi, Road 7A\nDhaka 1205, Bangladesh");
  const [dispatchPhone, setDispatchPhone] = useState("+880 1712-345678");
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!countdownPreview) return;
    if (previewSec <= 0) { setCountdownPreview(false); setPreviewSec(responseWindow); return; }
    const t = setTimeout(() => setPreviewSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [countdownPreview, previewSec, responseWindow]);

  const removeMember = (id: string) => {
    setMembers(ms => ms.filter(m => m.id !== id));
  };

  const addMember = (name: string, relationship: string, phone: string) => {
    const initials = name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
    const colors = ["#E8304A", "#5B8AF0", "#27C28A", "#F5A623", "#A855F7"];
    const avatarColor = colors[members.length % colors.length];
    
    const newMember: Member = {
      id: `m${Date.now()}`,
      name,
      initials,
      relationship,
      phone,
      email: "",
      avatarColor,
      status: "pending",
      lastActivity: "Invitation sent — awaiting acceptance",
      notifLevel: "all",
      isEmergencyContact: false,
      emergencyPriority: 0,
      permissions: { ecg: true, diary: true, alerts: true, dashboard: true }
    };
    setMembers(prev => [...prev, newMember]);
  };

  const emergencyMembers = members.filter(m => m.isEmergencyContact && m.status !== "pending").sort((a, b) => a.emergencyPriority - b.emergencyPriority);

  const cardStyle: React.CSSProperties = {
    background: c.cardBg, border: `1px solid ${c.cardBorder}`,
    borderRadius: 12, boxShadow: c.shadow, overflow: "hidden",
  };
  const emergCardStyle: React.CSSProperties = {
    ...cardStyle, background: c.emergBg,
    border: `1px solid ${c.emergBorder}`,
  };

  return (
    <div className="h-full overflow-y-auto hide-scrollbar" style={{ background: c.pageBg }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">

        {/* Title block */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-2">
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 500, color: c.text }}>Family & Caregiver Circle</div>
          <button onClick={() => setShowAddMember(true)} className="px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500 }}>
            <UserPlus size={15} /> Add caregiver
          </button>
        </div>
        <p className="mb-6" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.secondary, lineHeight: 1.6 }}>
          Manage people who have access to your health telemetry and set up automatic ambulance requests for critical falls or cardiac events.
        </p>

        {/* Tablet tab toggles */}
        <div className="flex xl:hidden mb-4 gap-2">
          {(["family", "status"] as const).map(t => (
            <button key={t} onClick={() => setTabletTab(t)} className="px-4 py-1.5 rounded-full" style={{
              background: tabletTab === t ? `${c.red}12` : "transparent",
              color: tabletTab === t ? c.red : c.secondary,
              border: tabletTab === t ? `1px solid ${c.red}30` : `1px solid ${c.cardBorder}`,
              fontFamily: "Syne, sans-serif", fontSize: 13,
            }}>{t === "family" ? "Caregiver List" : "Live Patient Status"}</button>
          ))}
        </div>

        <div className="flex gap-6">

          {/* Main workspace center columns */}
          <div className={`flex-1 min-w-0 ${tabletTab === "status" ? "hidden xl:block" : ""}`}>
            
            {/* Caregivers list cards */}
            <div className="flex flex-col gap-3 mb-2">
              {members.map(m => (
                <MemberCard
                  key={m.id}
                  member={m}
                  editOpen={editingPerms === m.id}
                  onEditPerms={setEditingPerms}
                  onRemove={removeMember}
                  onUpdate={(id, data) => setMembers(prev => prev.map(member => member.id === id ? { ...member, ...data } : member))}
                  onResend={(id) => showToast(`Invitation resent to ${members.find(member => member.id === id)?.name}`)}
                  onCall={(id) => showToast(`Calling ${members.find(member => member.id === id)?.name}...`)}
                />
              ))}
            </div>

            {/* Emergency Settings */}
            <SectionDivider label="Emergency Configuration" />

            {/* Automatic dispatch widget */}
            <div style={emergCardStyle} className="p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} style={{ color: c.red }} />
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.text }}>Automatic Emergency Dispatch</span>
                </div>
                <Toggle on={dispatchEnabled} onToggle={() => setDispatchEnabled(!dispatchEnabled)} />
              </div>

              {!dispatchEnabled && (
                <div className="p-3 rounded-lg mb-4" style={{ background: `${c.amber}10`, border: `1px solid ${c.amber}30` }}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} style={{ color: c.amber, flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.amber, lineHeight: 1.5 }}>
                      Automatic dispatch is disabled. If a fall or arrhythmia is detected, the system will not request emergency vehicles automatically. You must call manually.
                    </p>
                  </div>
                </div>
              )}

              {dispatchEnabled && (
                <>
                  <p className="mb-4 text-sm leading-relaxed" style={{ fontFamily: "Syne, sans-serif", color: c.secondary }}>
                    If a critical event (severe arrhythmia or high-impact fall) is recorded, a response timer begins. If you do not swipe to confirm you are safe before it ends, the server triggers Twilio API broadcasts and emergency contacts.
                  </p>

                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>Response Timer Window</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: c.text, fontWeight: 500 }}>{responseWindow} seconds</span>
                    </div>
                    <input
                      type="range" min={30} max={120} step={10} value={responseWindow}
                      onChange={(e) => { setResponseWindow(+e.target.value); setPreviewSec(+e.target.value); }}
                      style={{ width: "100%", accentColor: c.red }}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.muted }}>30s</span>
                      <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary }}>Default: 60s</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.muted }}>120s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 mb-5 p-4 rounded-xl" style={{ background: c.d ? "rgba(232,48,74,0.06)" : "rgba(232,48,74,0.04)", border: `1px solid ${c.d ? "rgba(232,48,74,0.12)" : "rgba(232,48,74,0.08)"}` }}>
                    <CountdownRing seconds={countdownPreview ? previewSec : responseWindow} total={responseWindow} size={100} />
                    <div className="flex-1">
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text, marginBottom: 4 }}>Countdown Ring Preview</div>
                      <p style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, lineHeight: 1.5, marginBottom: 8 }}>
                        Demonstrating countdown notification. The user must complete the swipe confirm to abort dispatch.
                      </p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => { if (countdownPreview) { setCountdownPreview(false); setPreviewSec(responseWindow); } else { setPreviewSec(responseWindow); setCountdownPreview(true); } }}
                          className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-red-500/20 transition-colors"
                          style={{ background: `${c.red}15`, color: c.red, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                          {countdownPreview ? <><Pause size={12} /> Stop Preview</> : <><Play size={12} /> Run Preview</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-lg" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary, marginBottom: 2 }}>Registered Address</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text, fontWeight: 500, whiteSpace: "pre-line" }}>{address.split('\n')[0]}</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, whiteSpace: "pre-line" }}>{address.split('\n').slice(1).join('\n')}</div>
                      <button onClick={() => setEditingAddress(true)} className="mt-2 text-xs font-semibold hover:underline" style={{ color: c.red }}>Edit</button>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary, marginBottom: 2 }}>Dispatch Phone</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text, fontWeight: 500 }}>{dispatchPhone}</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.muted, marginTop: 2 }}>Shared during emergency dispatch</div>
                      <button onClick={() => setEditingPhone(true)} className="mt-2 text-xs font-semibold hover:underline" style={{ color: c.red }}>Edit</button>
                    </div>
                  </div>

                  <button onClick={() => setShowAlertSim(true)} className="w-full py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
                    style={{ background: c.d ? "rgba(232,48,74,0.08)" : "rgba(232,48,74,0.06)", border: `1.5px solid ${c.red}40`, color: c.red, fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500 }}>
                    <TestTube size={16} /> Execute Emergency Dispatch Simulation
                  </button>
                  <p className="mt-2 text-center text-[11px]" style={{ fontFamily: "Syne, sans-serif", color: c.muted }}>
                    Tests the complete emergency broadcast timeline. Twilio triggers are simulated and no real calls occur.
                  </p>
                </>
              )}
            </div>

            {/* Emergency Contacts List */}
            <div style={emergCardStyle} className="p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone size={18} style={{ color: c.red }} />
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.text }}>Twilio/SMS Alert Contacts</span>
              </div>
              <p className="mb-4 text-sm" style={{ fontFamily: "Syne, sans-serif", color: c.secondary }}>
                These secondary lines will be alerted via SMS. Family members set as emergency contacts appear below in sequence order.
              </p>

              <div className="flex flex-col gap-2 mb-4">
                {emergencyMembers.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                    <span className="flex items-center justify-center flex-shrink-0" style={{
                      width: 24, height: 24, borderRadius: 12,
                      background: i === 0 ? `${c.red}20` : c.chipBg,
                      fontFamily: "DM Mono, monospace", fontSize: 12,
                      color: i === 0 ? c.red : c.secondary,
                    }}>{i + 1}</span>
                    <div className="flex items-center justify-center flex-shrink-0" style={{
                      width: 36, height: 36, borderRadius: 18, background: m.avatarColor,
                      color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13,
                    }}>{m.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text }}>{m.name}</span>
                        {i === 0 && <span style={{ padding: "1px 8px", borderRadius: 10, background: `${c.red}15`, color: c.red, fontFamily: "Syne, sans-serif", fontSize: 10 }}>Primary</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span style={{ fontFamily: "Syne, sans-serif", color: c.secondary }}>{m.relationship}</span>
                        <span style={{ fontFamily: "DM Mono, monospace", color: c.text }}>{m.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} style={{ color: c.secondary }} />
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>Primary Doctor</span>
                  </div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text }}>Dr. Hasan Ali</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.secondary }}>+880 1911-223344</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={14} style={{ color: c.secondary }} />
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>Backup Contact</span>
                  </div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text }}>Rashid (Neighbor)</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.secondary }}>+880 1744-556677</div>
                </div>
              </div>
            </div>

            {/* Ambulance Services */}
            <div style={emergCardStyle} className="p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Ambulance size={18} style={{ color: c.red }} />
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.text }}>Ambulance Services</span>
              </div>
              <p className="mb-4 text-sm" style={{ fontFamily: "Syne, sans-serif", color: c.secondary }}>
                Local emergency vehicle lines. Integrated partners support API-level dispatches. Backup numbers receive automated audio notifications.
              </p>

              <div className="flex flex-col gap-3 mb-4">
                {services.map(s => (
                  <div key={s.id} className="p-4 rounded-xl" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.text }}>{s.name}</span>
                        </div>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>{s.coverage}</div>
                      </div>
                      <span style={{
                        padding: "3px 10px", borderRadius: 12, flexShrink: 0,
                        background: s.integrated ? `${c.green}15` : `${c.gray}20`,
                        color: s.integrated ? c.green : c.muted,
                        fontFamily: "Syne, sans-serif", fontSize: 11,
                      }}>{s.integrated ? "API Integrated" : "Manual Call"}</span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-t border-dashed pt-2 mt-2" style={{ borderColor: c.cardBorder }}>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} style={{ color: c.secondary }} />
                          <span style={{ fontFamily: "DM Mono, monospace", color: c.text }}>{s.number}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} style={{ color: c.secondary }} />
                          <span style={{ fontFamily: "DM Mono, monospace", color: c.secondary }}>{s.responseTime}</span>
                        </div>
                      </div>
                      {s.integrated ? (
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: "Syne, sans-serif", color: c.secondary }}>Auto dispatch</span>
                          <Toggle on={s.autoDispatch || false} onToggle={() => setServices(prev => prev.map(srv => srv.id === s.id ? { ...srv, autoDispatch: !srv.autoDispatch } : srv))} />
                        </div>
                      ) : (
                        <button onClick={() => showToast("Pre-registration started for " + s.name)} className="hover:underline" style={{ fontFamily: "Syne, sans-serif", color: c.red }}>
                          <ExternalLink size={11} className="inline mr-1" /> Pre-register
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column / Live Status Panel */}
          <aside className="w-[320px] flex-shrink-0 hidden xl:block">
            <div className="sticky top-0">
              <LiveStatusPanel members={members} />
            </div>
          </aside>

          {/* Mobile status tab */}
          {tabletTab === "status" && (
            <div className="flex-1 min-w-0 xl:hidden">
              <LiveStatusPanel members={members} />
            </div>
          )}
        </div>
      </div>

      {/* Invites & Testing Modals */}
      {showAddMember && <AddMemberModal onClose={() => setShowAddMember(false)} onAdd={addMember} />}
      {showAlertSim && <AlertSimulationModal countdownTotal={responseWindow} onClose={() => setShowAlertSim(false)} onCall={() => showToast("Calling Dispatch Center...")} />}
      {editingAddress && <EditFieldModal title="Edit Address" value={address} onSave={setAddress} onClose={() => setEditingAddress(false)} />}
      {editingPhone && <EditFieldModal title="Edit Dispatch Phone" value={dispatchPhone} onSave={setDispatchPhone} onClose={() => setEditingPhone(false)} />}
      
      {toast && (
        <div className="animate-fade-in" style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1000,
          background: c.d ? "#2A2D40" : "#333333", color: "#FFFFFF", padding: "12px 24px", borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: `1px solid ${c.cardBorder}`,
          fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap"
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
