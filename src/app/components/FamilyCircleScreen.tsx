import { useState, useEffect, useCallback, useRef } from "react";
import {
  UserPlus, Phone, Shield, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp,
  MoreVertical, X, Check, AlertTriangle, CheckCircle, Clock, Heart, Activity,
  Shirt, Bell, BellOff, Eye, EyeOff, BookOpen, TrendingUp, MapPin, Ambulance,
  Play, Pause, PhoneCall, PhoneForwarded, GripVertical, ArrowUp, ArrowDown,
  Plus, Trash2, Edit2, Send, ExternalLink, Info, Sparkles, Circle, RefreshCw,
  Settings, TestTube, Radio, Navigation, User
} from "lucide-react";
import { useTheme } from "./ThemeContext";

/* ═══════════════ THEME COLORS ═══════════════ */
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
    strip: d ? "#1A1D35" : "#F0F2F8",
    shadow: d ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
    inputBg: d ? "#1A1D35" : "#F7F8FC",
    inputBorder: d ? "rgba(100,120,200,0.2)" : "rgba(0,0,0,0.12)",
    chipBg: d ? "#1A1D35" : "#F3F4F6",
    emergBg: d ? "rgba(232,48,74,0.04)" : "#FDF7F7",
    emergBorder: d ? "rgba(232,48,74,0.15)" : "rgba(232,48,74,0.08)",
    emergActiveBg: d ? "rgba(232,48,74,0.1)" : "#FBF0F0",
    emergActiveBorder: "rgba(232,48,74,0.5)",
    rightBg: d ? "#0D0F1A" : "#FFFFFF",
    rightCard: d ? "#141629" : "#F7F8FC",
    red: "#E8304A",
    green: "#27C28A",
    amber: "#F5A623",
    blue: "#5B8AF0",
    gray: "#C2C8D6",
    d,
  };
}

/* ═══════════════ MOCK DATA ═══════════════ */
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
    id: "m1", name: "Rehnuma", initials: "FK", relationship: "Daughter",
    phone: "+880 1712-345678", email: "fatema@email.com", avatarColor: "#E8304A",
    status: "active", lastActivity: "Viewing your dashboard now",
    notifLevel: "all", isEmergencyContact: true, emergencyPriority: 1,
    permissions: { ecg: true, diary: true, alerts: true, dashboard: true },
  },
  {
    id: "m2", name: "Rumi", initials: "RA", relationship: "Son",
    phone: "+880 1898-765432", email: "rifat@email.com", avatarColor: "#5B8AF0",
    status: "recent", lastActivity: "Viewed your data 42 min ago",
    notifLevel: "critical", isEmergencyContact: true, emergencyPriority: 2,
    permissions: { ecg: true, diary: false, alerts: true, dashboard: true },
  },
  {
    id: "m3", name: "Jabed", initials: "KU", relationship: "Spouse",
    phone: "+880 1552-112233", email: "", avatarColor: "#27C28A",
    status: "inactive", lastActivity: "Has not opened the app in 3 days",
    notifLevel: "daily", isEmergencyContact: true, emergencyPriority: 3,
    permissions: { ecg: false, diary: false, alerts: true, dashboard: true },
  },
  {
    id: "m4", name: "DR. Rohan", initials: "NJ", relationship: "Caregiver",
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
}

const SERVICES_INIT: AmbulanceService[] = [
  { id: "s1", name: "National Emergency", number: "999", integrated: true, coverage: "Nationwide", responseTime: "12–20 min" },
  { id: "s2", name: "Dhaka Ambulance Service", number: "+880 1700-000999", integrated: true, coverage: "Dhaka Metropolitan", responseTime: "8–14 min" },
  { id: "s3", name: "LifeLine Express", number: "+880 1800-911911", integrated: false, coverage: "Dhaka & Chittagong", responseTime: "10–18 min" },
];

/* ═══════════════ TINY COMPONENTS ═══════════════ */
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

function StatusDot({ status }: { status: string }) {
  const bg = status === "active" ? "#27C28A" : status === "recent" ? "#5B8AF0" : "#C2C8D6";
  return <div style={{ width: 14, height: 14, borderRadius: 7, background: bg, border: "2px solid rgba(255,255,255,0.2)" }} />;
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

/* ═══════════════ FAMILY MEMBER CARD ═══════════════ */
function MemberCard({
  member, onEditPerms, editOpen, onRemove,
}: {
  member: Member;
  onEditPerms: (id: string | null) => void;
  editOpen: boolean;
  onRemove: (id: string) => void;
}) {
  const c = useColors();
  const [perms, setPerms] = useState(member.permissions);
  const [notif, setNotif] = useState(member.notifLevel);
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
      {/* Main row */}
      <div className="p-4 flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="flex items-center justify-center" style={{
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

        {/* Center */}
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.text }}>{member.name}</div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>{member.relationship}</div>
          {isPending ? (
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.amber }}>{member.lastActivity}</span>
              <button style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red }}>Resend</button>
              <button style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>Cancel invitation</button>
            </div>
          ) : (
            <div className="mt-1" style={{
              fontFamily: member.status === "active" ? "Syne, sans-serif" : "DM Mono, monospace",
              fontSize: 12, color: member.status === "active" ? c.blue : c.muted,
            }}>{member.lastActivity}</div>
          )}
        </div>

        {/* Right */}
        {!isPending && (
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span style={{
              padding: "3px 10px", borderRadius: 12,
              background: `${notifColor}18`, color: notifColor,
              fontFamily: "Syne, sans-serif", fontSize: 11,
            }}>{notifLabel}</span>
            {member.isEmergencyContact && (
              <span style={{
                padding: "2px 8px", borderRadius: 10,
                background: `${c.red}14`, color: c.red,
                fontFamily: "Syne, sans-serif", fontSize: 10,
              }}>Emergency #{member.emergencyPriority}</span>
            )}
            <button onClick={() => onEditPerms(editOpen ? null : member.id)} style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.red, cursor: "pointer" }}>
              Permissions
            </button>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)}><MoreVertical size={16} style={{ color: c.muted }} /></button>
              {showMenu && (
                <div style={{
                  position: "absolute", right: 0, top: 20, zIndex: 10,
                  background: c.cardBg, border: `1px solid ${c.cardBorder}`,
                  borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  minWidth: 160, overflow: "hidden",
                }}>
                  <button className="w-full px-4 py-2.5 text-left flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}
                    onClick={() => setShowMenu(false)}>
                    <Phone size={14} /> Call
                  </button>
                  <button className="w-full px-4 py-2.5 text-left flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.red }}
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
        <div className="px-5 pb-5 pt-4" style={{ borderTop: `1px solid ${c.cardBorder}` }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.text, marginBottom: 14 }}>
            What {member.name.split(" ")[0]} can see and receive
          </div>

          {/* Data access */}
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
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text }}>{t.label}</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>{t.desc}</div>
                  </div>
                </div>
                <Toggle on={perms[t.key]} onToggle={() => setPerms(p => ({ ...p, [t.key]: !p[t.key] }))} />
              </div>
            ))}
          </div>

          {/* Notification tier */}
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: c.secondary, marginBottom: 8 }}>
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

          {/* Emergency contact toggle */}
          <div className="flex items-center justify-between mb-5 p-3 rounded-lg" style={{ background: c.d ? "rgba(232,48,74,0.04)" : "#FDF7F7" }}>
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: c.red }} />
              <div>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text }}>Emergency contact</span>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>Will be called during automatic dispatch</div>
              </div>
            </div>
            <Toggle on={member.isEmergencyContact} onToggle={() => {}} />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => onEditPerms(null)} className="px-5 py-2 rounded-lg" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>
              Save changes
            </button>
            <button onClick={() => onEditPerms(null)} style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>Cancel</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/* ═══════════════ ADD MEMBER MODAL ═══════════════ */
function AddMemberModal({ onClose }: { onClose: () => void }) {
  const c = useColors();
  const [rel, setRel] = useState("Child");
  const rels = ["Spouse", "Parent", "Child", "Sibling", "Caregiver", "Other"];

  const iStyle: React.CSSProperties = {
    background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 8,
    padding: "10px 14px", fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text,
    width: "100%", outline: "none",
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
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 500, color: c.text }}>Add Family Member</span>
          <button onClick={onClose}><X size={20} style={{ color: c.muted }} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 4 }}>Full Name</label>
            <input placeholder="e.g. Rehnuma" style={iStyle} />
          </div>
          <div>
            <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 4 }}>Relationship</label>
            <div className="flex flex-wrap gap-2">
              {rels.map(r => <Pill key={r} label={r} active={rel === r} onClick={() => setRel(r)} />)}
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 4 }}>Phone Number</label>
            <input placeholder="+880 1XXX-XXXXXX" style={iStyle} />
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.muted, marginTop: 2, display: "block" }}>
              They'll receive an SMS invitation with a secure link to join your circle
            </span>
          </div>
          <div>
            <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 4 }}>Email (optional)</label>
            <input placeholder="email@example.com" style={iStyle} />
          </div>

          <SectionDivider label="Initial Permissions" />

          <div className="flex flex-col gap-2.5">
            {["Can see ECG data", "Can see Cardiac Diary", "Receives alert notifications", "Is an emergency contact"].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{p}</span>
                <Toggle on={i < 3} onToggle={() => {}} />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderTop: `1px solid ${c.cardBorder}` }}>
          <button className="px-5 py-2.5 rounded-lg flex items-center gap-2" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 14 }}>
            <Send size={14} /> Send Invitation
          </button>
          <button onClick={onClose} style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ ALERT SIMULATION MODAL ═══════════════ */
function AlertSimulationModal({ countdownTotal, onClose }: { countdownTotal: number; onClose: () => void }) {
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

  // Auto-transition to tracking after dispatch
  useEffect(() => {
    if (phase === "dispatched") {
      const t = setTimeout(() => setPhase("tracking"), 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: c.d ? "rgba(13,15,26,0.97)" : "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", padding: 24,
    }}>
      {/* TEST MODE banner */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, padding: "8px 0",
        background: c.amber, textAlign: "center",
        fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 600, color: "#0D0F1A",
      }}>
        ⚠ TEST MODE — No real calls will be placed
      </div>

      {phase === "countdown" && (
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div style={{
            padding: "6px 16px", borderRadius: 20,
            background: "rgba(232,48,74,0.15)", color: c.red,
            fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500,
          }}>
            🚨 Critical Cardiac Event Detected
          </div>

          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#F0F2FF", lineHeight: 1.5 }}>
            Abnormal heart rhythm detected. Automated dispatch will begin when the countdown reaches zero.
          </div>

          <CountdownRing seconds={seconds} total={countdownTotal} size={180} />

          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: "#8890B8" }}>
            Family emergency contacts have been notified
          </div>

          {/* Swipe to cancel */}
          <div style={{ width: "100%", maxWidth: 360 }}>
            <SwipeToConfirm onConfirm={() => setPhase("cancelled")} />
          </div>

          {/* Immediate dispatch */}
          <button onClick={() => { setSeconds(0); setPhase("dispatched"); }}
            className="px-6 py-3 rounded-lg" style={{
              background: "rgba(232,48,74,0.15)", border: `1px solid ${c.red}`,
              color: c.red, fontFamily: "Syne, sans-serif", fontSize: 14,
            }}>
            <PhoneCall size={16} className="inline mr-2" /> Call for help now
          </button>

          {/* Test controls */}
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => setPaused(!paused)} style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "#8890B8" }}>
              {paused ? <Play size={14} className="inline mr-1" /> : <Pause size={14} className="inline mr-1" />}
              {paused ? "Resume" : "Pause"} test
            </button>
            <button onClick={onClose} style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "#8890B8" }}>
              Exit test
            </button>
          </div>
        </div>
      )}

      {phase === "cancelled" && (
        <div className="flex flex-col items-center gap-5 max-w-md text-center">
          <div style={{
            width: 80, height: 80, borderRadius: 40,
            background: "rgba(39,194,138,0.15)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle size={40} style={{ color: c.green }} />
          </div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 500, color: "#F0F2FF" }}>
            Dispatch Cancelled
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#8890B8", lineHeight: 1.5 }}>
            You confirmed you are okay. Your family members will be notified that the alert was resolved. No emergency calls were placed.
          </div>
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg" style={{ background: c.green, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 14 }}>
            Close test
          </button>
        </div>
      )}

      {phase === "dispatched" && (
        <div className="flex flex-col items-center gap-5 max-w-md text-center">
          <div className="animate-pulse" style={{
            width: 80, height: 80, borderRadius: 40,
            background: "rgba(232,48,74,0.2)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Ambulance size={40} style={{ color: c.red }} />
          </div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 500, color: "#F0F2FF" }}>
            Dispatch Initiated
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#8890B8", lineHeight: 1.5 }}>
            In a real emergency, an automated call would now be placed to your registered ambulance service with your name, address, and the nature of the cardiac event.
          </div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: c.amber }}>
            Transitioning to tracking view...
          </div>
        </div>
      )}

      {phase === "tracking" && (
        <div className="flex flex-col items-center gap-5 max-w-md text-center w-full">
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 500, color: "#F0F2FF" }}>
            Emergency Tracking
          </div>
          <div style={{
            width: "100%", maxWidth: 400, borderRadius: 16, overflow: "hidden",
            background: c.d ? "#141629" : "#1a1d2e", padding: 20,
          }}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 10, height: 10, borderRadius: 5, background: c.red }} className="animate-pulse" />
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: "#F0F2FF" }}>Dispatch Confirmed</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: "#8890B8" }}>Dhaka Ambulance Service</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: c.amber }}>ETA: 10 min</span>
            </div>
            {/* Simulated map area */}
            <div style={{
              width: "100%", height: 140, borderRadius: 12,
              background: c.d ? "#0D0F1A" : "#E8EAF0",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <div className="flex flex-col items-center gap-1">
                <Navigation size={24} style={{ color: c.red }} />
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "#8890B8" }}>Live location shared</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {[
                { label: "Rehnuma", status: "Alerted — on the way", color: c.green },
                { label: "Rumi", status: "Notification sent", color: c.amber },
                { label: "Jabed", status: "Not yet seen", color: c.gray },
              ].map((f, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: "#F0F2FF" }}>{f.label}</span>
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: f.color }}>{f.status}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-3 rounded-lg flex items-center justify-center gap-2" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 14 }}>
              <PhoneForwarded size={16} /> Call Ambulance Dispatcher
            </button>
          </div>
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg" style={{
            background: "rgba(255,255,255,0.1)", color: "#F0F2FF",
            fontFamily: "Syne, sans-serif", fontSize: 14,
          }}>End test simulation</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ RIGHT PANEL — LIVE STATUS ═══════════════ */
function LiveStatusPanel({ members }: { members: Member[] }) {
  const c = useColors();

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
      {/* Header */}
      <div>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.text }}>Live Status</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius: 4, background: c.green }} />
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.secondary }}>Updated 12 sec ago</span>
        </div>
      </div>

      {/* Patient Status */}
      <div style={{ background: c.rightCard, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: 16, boxShadow: c.shadow }}>
        <div className="flex items-start justify-between">
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.text }}>Adnan</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 36, color: c.green }}>72</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: c.muted }}>BPM</span>
            </div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.green, marginTop: 2 }}>Normal sinus rhythm</div>
            <div className="flex items-center gap-1.5 mt-2">
              <Shirt size={12} style={{ color: c.green }} />
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>Connected — Lead II active</span>
            </div>
          </div>
          {/* Mini health ring */}
          <div className="relative flex-shrink-0" style={{ width: 60, height: 60 }}>
            <svg width={60} height={60} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={30} cy={30} r={24} fill="none" stroke={c.d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth={5} />
              <circle cx={30} cy={30} r={24} fill="none" stroke={c.amber} strokeWidth={5}
                strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 * (1 - 0.73)} strokeLinecap="round" />
            </svg>
            <span style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "DM Mono, monospace", fontSize: 18, color: c.amber,
            }}>73</span>
          </div>
        </div>
        <p className="mt-3" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, lineHeight: 1.6, color: c.secondary }}>
          Your heart has been stable this afternoon. No anomalies detected in the last 4 hours.
        </p>
      </div>

      {/* Who is Watching */}
      <div>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: c.secondary, marginBottom: 8 }}>Currently monitoring</div>
        <div className="flex items-center gap-3">
          {activeMembers.map(m => (
            <div key={m.id} className="relative">
              <div className="flex items-center justify-center" style={{
                width: 40, height: 40, borderRadius: 20, background: m.avatarColor,
                color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 14,
              }}>{m.initials}</div>
              <div style={{
                position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderRadius: 6,
                background: m.status === "active" ? c.green : c.blue, border: `2px solid ${c.rightBg}`,
              }} />
            </div>
          ))}
          {inactiveMembers.map(m => (
            <div key={m.id} className="relative" style={{ opacity: 0.4 }}>
              <div className="flex items-center justify-center" style={{
                width: 40, height: 40, borderRadius: 20, background: m.avatarColor,
                color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 14,
              }}>{m.initials}</div>
              <div style={{
                position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderRadius: 6,
                background: c.gray, border: `2px solid ${c.rightBg}`,
              }} />
            </div>
          ))}
        </div>
        <div className="mt-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>
          Fatema checked 6 minutes ago.
        </div>
      </div>

      {/* Notification Log */}
      <div>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: c.secondary, marginBottom: 8 }}>Recent notifications</div>
        <div className="flex flex-col gap-1.5">
          {NOTIFS.map((n, i) => {
            const pill = typePill(n.type);
            const unacked = n.critical && !n.acked;
            return (
              <div key={`notif-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{
                background: c.rightCard,
                borderLeft: unacked ? `3px solid ${c.amber}` : "3px solid transparent",
              }}>
                <span className="flex-shrink-0 px-2 py-0.5 rounded-full" style={{ background: pill.bg, color: pill.color, fontFamily: "DM Mono, monospace", fontSize: 10 }}>{n.type}</span>
                <div className="flex-1 min-w-0">
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.muted }}>{n.time}</span>
                  <span className="ml-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.text }}>{n.recipient}</span>
                </div>
                {n.acked ? (
                  <CheckCircle size={14} style={{ color: c.green, flexShrink: 0 }} />
                ) : n.critical ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div style={{ width: 7, height: 7, borderRadius: 4, background: c.red }} />
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: c.amber }}>Not seen</span>
                  </div>
                ) : (
                  <Circle size={14} style={{ color: c.gray, flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
        <button className="mt-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red }}>View full notification history</button>
      </div>

      {/* Emergency Readiness */}
      <div style={{ background: c.rightCard, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: 16, boxShadow: c.shadow }}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} style={{ color: c.green }} />
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text }}>Emergency Readiness</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { label: "Primary emergency contact set", ok: true, detail: "Rehnuma" },
            { label: "Automatic dispatch enabled", ok: true, detail: "60s response window" },
            { label: "Ambulance service registered", ok: true, detail: "Dhaka Ambulance Service" },
          ].map((item, i) => (
            <div key={`ready-${i}`} className="flex items-start gap-2.5">
              {item.ok ? (
                <CheckCircle size={16} style={{ color: c.green, flexShrink: 0, marginTop: 1 }} />
              ) : (
                <AlertTriangle size={16} style={{ color: c.amber, flexShrink: 0, marginTop: 1 }} />
              )}
              <div>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{item.label}</span>
                {item.detail && <span className="block" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>{item.detail}</span>}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: c.secondary, lineHeight: 1.6 }}>
          Your emergency response is fully configured.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════ MAIN SCREEN ═══════════════ */
export function FamilyCircleScreen() {
  const c = useColors();
  const [members, setMembers] = useState(MEMBERS_INIT);
  const [editingPerms, setEditingPerms] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [tabletTab, setTabletTab] = useState<"family" | "status">("family");
  const [showAlertSim, setShowAlertSim] = useState(false);

  // Dispatch config
  const [dispatchEnabled, setDispatchEnabled] = useState(true);
  const [responseWindow, setResponseWindow] = useState(60);
  const [countdownPreview, setCountdownPreview] = useState(false);
  const [previewSec, setPreviewSec] = useState(60);

  // Preview countdown
  useEffect(() => {
    if (!countdownPreview) return;
    if (previewSec <= 0) { setCountdownPreview(false); setPreviewSec(responseWindow); return; }
    const t = setTimeout(() => setPreviewSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [countdownPreview, previewSec, responseWindow]);

  const removeMember = (id: string) => {
    setMembers(ms => ms.filter(m => m.id !== id));
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
    <div className="h-full overflow-y-auto" style={{ background: c.pageBg }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-2">
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 500, color: c.text }}>Family Circle</div>
          <button onClick={() => setShowAddMember(true)} className="px-4 py-2 rounded-lg flex items-center gap-2"
            style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>
            <UserPlus size={15} /> Add family member
          </button>
        </div>
        <p className="mb-6" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: c.secondary, lineHeight: 1.6 }}>
          {members.filter(m => m.status === "active" || m.status === "recent").length} family members are currently monitoring you. Your last alert was acknowledged by Fatema in under 2 minutes.
        </p>

        {/* Tablet tabs */}
        <div className="flex xl:hidden mb-4 gap-2">
          {(["family", "status"] as const).map(t => (
            <button key={t} onClick={() => setTabletTab(t)} className="px-4 py-1.5 rounded-full" style={{
              background: tabletTab === t ? `${c.red}18` : "transparent",
              color: tabletTab === t ? c.red : c.secondary,
              border: tabletTab === t ? `1px solid ${c.red}40` : `1px solid ${c.cardBorder}`,
              fontFamily: "Syne, sans-serif", fontSize: 13,
            }}>{t === "family" ? "Family" : "Live Status"}</button>
          ))}
        </div>

        <div className="flex gap-6">

          {/* ═══ CENTER COLUMN ═══ */}
          <div className={`flex-1 min-w-0 ${tabletTab === "status" ? "hidden xl:block" : ""}`}>

            {/* ── FAMILY MEMBERS ── */}
            <div className="flex flex-col gap-3 mb-2">
              {members.map(m => (
                <MemberCard
                  key={m.id}
                  member={m}
                  editOpen={editingPerms === m.id}
                  onEditPerms={setEditingPerms}
                  onRemove={removeMember}
                />
              ))}
            </div>

            {/* ════════════════════════════════════════════
                 EMERGENCY CONFIGURATION
                ════════════════════════════════════════════ */}
            <SectionDivider label="Emergency Configuration" />

            {/* ── 1. AUTOMATIC DISPATCH SETTINGS ── */}
            <div style={emergCardStyle} className="p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} style={{ color: c.red }} />
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.text }}>Automatic Dispatch</span>
                </div>
                <Toggle on={dispatchEnabled} onToggle={() => setDispatchEnabled(!dispatchEnabled)} />
              </div>

              {!dispatchEnabled && (
                <div className="p-3 rounded-lg mb-4" style={{ background: `${c.amber}10`, border: `1px solid ${c.amber}30` }}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} style={{ color: c.amber, flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: c.amber, lineHeight: 1.5 }}>
                      Automatic dispatch is disabled. If a critical cardiac event is detected and you are unable to respond, no ambulance will be called automatically. You can still call for help manually.
                    </p>
                  </div>
                </div>
              )}

              {dispatchEnabled && (
                <>
                  <p className="mb-4" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: c.secondary, lineHeight: 1.6 }}>
                    When a high-severity cardiac event is detected, a countdown begins. If you do not confirm you are okay before it reaches zero, an ambulance is dispatched automatically to your address.
                  </p>

                  {/* Response Window */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text }}>Response window</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: c.text }}>{responseWindow}s</span>
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

                  {/* Countdown Preview */}
                  <div className="flex items-center gap-5 mb-5 p-4 rounded-xl" style={{ background: c.d ? "rgba(232,48,74,0.06)" : "rgba(232,48,74,0.04)", border: `1px solid ${c.d ? "rgba(232,48,74,0.12)" : "rgba(232,48,74,0.08)"}` }}>
                    <CountdownRing seconds={countdownPreview ? previewSec : responseWindow} total={responseWindow} size={100} />
                    <div className="flex-1">
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text, marginBottom: 4 }}>Countdown Preview</div>
                      <p style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, lineHeight: 1.5, marginBottom: 8 }}>
                        This is what the alert countdown looks like. The patient must swipe to confirm they are okay — a single tap will NOT cancel dispatch.
                      </p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => { if (countdownPreview) { setCountdownPreview(false); setPreviewSec(responseWindow); } else { setPreviewSec(responseWindow); setCountdownPreview(true); } }}
                          className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                          style={{ background: `${c.red}15`, color: c.red, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                          {countdownPreview ? <><Pause size={12} /> Stop</> : <><Play size={12} /> Preview</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Patient Info for Dispatch */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-lg" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary, marginBottom: 2 }}>Registered Address</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>42/3 Dhanmondi, Road 7A</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>Dhaka 1205, Bangladesh</div>
                      <button className="mt-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red }}>
                        <Edit2 size={11} className="inline mr-1" /> Edit
                      </button>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary, marginBottom: 2 }}>Dispatch Phone</div>
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>+880 1712-345678</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.muted, marginTop: 2 }}>Phone shared with ambulance service</div>
                      <button className="mt-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red }}>
                        <Edit2 size={11} className="inline mr-1" /> Edit
                      </button>
                    </div>
                  </div>

                  {/* Test Button */}
                  <button onClick={() => setShowAlertSim(true)} className="w-full py-3 rounded-lg flex items-center justify-center gap-2"
                    style={{ background: c.d ? "rgba(232,48,74,0.08)" : "rgba(232,48,74,0.06)", border: `1.5px solid ${c.red}40`, color: c.red, fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500 }}>
                    <TestTube size={16} /> Run Full Alert Test
                  </button>
                  <p className="mt-2 text-center" style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.muted }}>
                    Exercises the full alert flow including notifications to your family members. No real emergency calls will be placed.
                  </p>
                </>
              )}
            </div>

            {/* ── 2. EMERGENCY CONTACTS ── */}
            <div style={emergCardStyle} className="p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone size={18} style={{ color: c.red }} />
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.text }}>Emergency Contacts</span>
              </div>
              <p className="mb-4" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>
                These contacts are notified in order when a critical alert triggers. Family members marked as emergency contacts appear automatically.
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
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>{m.relationship}</span>
                        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.text }}>{m.phone}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col gap-1 flex-shrink-0">
                      <button disabled={i === 0}><ArrowUp size={14} style={{ color: i === 0 ? c.cardBorder : c.muted }} /></button>
                      <button disabled={i === emergencyMembers.length - 1}><ArrowDown size={14} style={{ color: i === emergencyMembers.length - 1 ? c.cardBorder : c.muted }} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Doctor & Secondary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} style={{ color: c.secondary }} />
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>Primary Doctor</span>
                  </div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text }}>DR. Rohan Ali</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.secondary }}>+880 1911-223344</div>
                  <button className="mt-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red }}>Edit</button>
                </div>
                <div className="p-3 rounded-lg" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={14} style={{ color: c.secondary }} />
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>Secondary Emergency</span>
                  </div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.text }}>Rashid (Neighbor)</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.secondary }}>+880 1744-556677</div>
                  <button className="mt-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red }}>Edit</button>
                </div>
              </div>
            </div>

            {/* ── 3. AMBULANCE SERVICES ── */}
            <div style={emergCardStyle} className="p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Ambulance size={18} style={{ color: c.red }} />
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.text }}>Ambulance Services</span>
              </div>
              <p className="mb-4" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>
                Services registered for your area. Integrated services can receive automated dispatch. Non-integrated services will receive an automated call with a pre-recorded message.
              </p>

              <div className="flex flex-col gap-3 mb-4">
                {SERVICES_INIT.map(s => (
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
                      }}>{s.integrated ? "CardiShirt integrated" : "Manual call"}</span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} style={{ color: c.secondary }} />
                          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: c.text }}>{s.number}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} style={{ color: c.secondary }} />
                          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.secondary }}>{s.responseTime}</span>
                        </div>
                      </div>
                      {s.integrated ? (
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>Auto dispatch</span>
                          <Toggle on={s.id === "s1"} onToggle={() => {}} />
                        </div>
                      ) : (
                        <button style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red }}>
                          <ExternalLink size={11} className="inline mr-1" /> Pre-register
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Limitations disclosure */}
              <div className="p-3 rounded-lg" style={{ background: c.chipBg, border: `1px solid ${c.cardBorder}` }}>
                <div className="flex items-start gap-2">
                  <Info size={16} style={{ color: c.secondary, flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 13, color: c.secondary, lineHeight: 1.6 }}>
                    CardiShirt integrates directly with supported services for instant API-based dispatch. For non-integrated services, the system places an automated phone call with a pre-recorded message containing your name, address, and the nature of the cardiac event. In areas with no service integration, automatic dispatch falls back to auto-dialing your registered emergency number.
                  </p>
                </div>
              </div>
            </div>

            {/* What happens during emergency — three states */}
            <div style={cardStyle} className="p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} style={{ color: c.amber }} />
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.text }}>How Emergency Dispatch Works</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    state: "Conscious patient",
                    icon: "🙋",
                    desc: "You see a full-screen alert with a countdown. Swipe to confirm you are okay to cancel dispatch. Tap \"Call for help now\" to dispatch immediately.",
                    color: c.green,
                  },
                  {
                    state: "Semi-conscious patient",
                    icon: "😵‍💫",
                    desc: "The swipe gesture prevents accidental cancellation. If you cannot complete the swipe, the countdown continues and dispatch proceeds automatically.",
                    color: c.amber,
                  },
                  {
                    state: "Unresponsive patient",
                    icon: "🚑",
                    desc: "Doing nothing results in dispatch — this is the safer failure mode. Family members are alerted simultaneously and may intervene before the ambulance arrives.",
                    color: c.red,
                  },
                ].map((s, i) => (
                  <div key={`state-${i}`} className="p-4 rounded-xl" style={{ background: c.cardElevated, border: `1px solid ${c.cardBorder}` }}>
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: s.color, marginBottom: 4 }}>{s.state}</div>
                    <p style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT PANEL ═══ */}
          <aside className={`w-[320px] flex-shrink-0 hidden xl:block`}>
            <div className="sticky top-0">
              <LiveStatusPanel members={members} />
            </div>
          </aside>

          {/* Tablet status tab */}
          {tabletTab === "status" && (
            <div className="flex-1 min-w-0 xl:hidden">
              <LiveStatusPanel members={members} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddMember && <AddMemberModal onClose={() => setShowAddMember(false)} />}
      {showAlertSim && <AlertSimulationModal countdownTotal={responseWindow} onClose={() => setShowAlertSim(false)} />}
    </div>
  );
}
