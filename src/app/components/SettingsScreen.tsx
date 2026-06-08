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
import { useTheme, useTokens } from "./ThemeContext";
import jsPDF from "jspdf";

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

  useEffect(() => {
    const handleStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };
    window.addEventListener("local-storage", handleStorageChange as EventListener);
    return () => window.removeEventListener("local-storage", handleStorageChange as EventListener);
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key, value: valueToStore } }));
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
    inputBg: tk.inputBg,
    inputBorder: tk.cardBorder,
    shadow: tk.shadow,
    red: tk.cardiacRed,
    green: tk.green,
    amber: tk.amber,
    blue: "#5B8AF0",
    divider: tk.borderSubtle,
    hoverBg: tk.cardiacRedGlow,
    activeNavBg: tk.cardiacRedGlow,
    navBorder: tk.cardiacRed,
    strip: theme === "ocean" ? "#0A1929" : theme === "nature" ? "#E8F0EA" : d ? "#1A1D35" : "#F0F2F8",
    d,
  };
}

/* ════════════════════════════════════════════
   MODALS AND DIALOGS
   ════════════════════════════════════════════ */
const EditFieldModal = ({ label, initialValue, onSave, onClose }: any) => {
  const [val, setVal] = useState(initialValue);
  const c = useColors();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs block mb-1" style={{ color: c.secondary, fontFamily: "Syne, sans-serif" }}>{label}</label>
        <input
          type="text"
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full p-2.5 rounded-lg outline-none"
          style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, color: c.text, fontFamily: "DM Mono, monospace", fontSize: 14 }}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm cursor-pointer" style={{ color: c.secondary, fontFamily: "Syne, sans-serif" }}>Cancel</button>
        <button onClick={() => { onSave(val); onClose(); }} className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif" }}>
          Save
        </button>
      </div>
    </div>
  );
};

const ChangeAvatarModal = ({
  avatarInitials, setAvatarInitials,
  avatarBgColor, setAvatarBgColor,
  avatarUrl, setAvatarUrl,
  onClose
}: any) => {
  const c = useColors();
  const [init, setInit] = useState(avatarInitials);
  const [bg, setBg] = useState(avatarBgColor);
  
  const colors = ["#5B8AF0", "#E8304A", "#27C28A", "#F5A623", "#9AA0B8", "#6B7499", "#8890B8"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
      <div className="flex items-center justify-center gap-4 py-2">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover animate-fade-in" style={{ border: `2px solid ${c.red}` }} />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ background: bg }}>
            {init}
          </div>
        )}
      </div>
      
      <div>
        <label className="text-xs block mb-1" style={{ color: c.secondary }}>Initials</label>
        <input
          type="text"
          value={init}
          maxLength={2}
          onChange={e => setInit(e.target.value.toUpperCase())}
          className="w-full p-2 rounded-lg outline-none"
          style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, color: c.text }}
        />
      </div>

      <div>
        <label className="text-xs block mb-1.5" style={{ color: c.secondary }}>Background Color</label>
        <div className="flex gap-2 flex-wrap">
          {colors.map(col => (
            <button
              key={col}
              onClick={() => { setBg(col); setAvatarUrl(null); }}
              className="w-8 h-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-110"
              style={{ background: col, borderColor: bg === col ? (c.d ? "#fff" : "#000") : "transparent" }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs block mb-1.5" style={{ color: c.secondary }}>Upload Custom Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ fontSize: 13, color: c.text }}
        />
      </div>

      <div className="flex gap-2 justify-end mt-2">
        {avatarUrl && (
          <button onClick={() => { setAvatarUrl(null); }} className="px-3 py-1.5 rounded-lg text-xs cursor-pointer mr-auto" style={{ border: `1px solid ${c.red}`, color: c.red }}>
            Remove photo
          </button>
        )}
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm cursor-pointer" style={{ color: c.secondary }}>Cancel</button>
        <button onClick={() => { setAvatarInitials(init); setAvatarBgColor(bg); onClose(); }} className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
          Apply
        </button>
      </div>
    </div>
  );
};

const ChangeCaregiverModal = ({
  name, setName,
  relation, setRelation,
  initials, setInitials,
  color, setColor,
  onClose
}: any) => {
  const c = useColors();
  const [tempName, setTempName] = useState(name);
  const [tempRel, setTempRel] = useState(relation);
  const [tempInit, setTempInit] = useState(initials);
  const [tempCol, setTempCol] = useState(color);
  
  const colors = ["#E8304A", "#5B8AF0", "#27C28A", "#F5A623", "#6B7499"];

  return (
    <div className="flex flex-col gap-4 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
      <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: c.cardElevated, borderColor: c.divider }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: tempCol }}>
          {tempInit}
        </div>
        <div>
          <div className="font-semibold" style={{ color: c.text }}>{tempName || "Caregiver Name"}</div>
          <div className="text-xs" style={{ color: c.secondary }}>{tempRel || "Relationship"}</div>
        </div>
      </div>

      <div>
        <label className="text-xs block mb-1" style={{ color: c.secondary }}>Caregiver Name</label>
        <input
          type="text"
          value={tempName}
          onChange={e => {
            setTempName(e.target.value);
            if(e.target.value) {
              const parts = e.target.value.split(" ");
              const initialsVal = parts.map((n: string) => n[0] || "").join("").toUpperCase().slice(0,2);
              setTempInit(initialsVal);
            }
          }}
          className="w-full p-2 rounded-lg outline-none"
          style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, color: c.text }}
        />
      </div>

      <div>
        <label className="text-xs block mb-1" style={{ color: c.secondary }}>Relationship</label>
        <input
          type="text"
          value={tempRel}
          onChange={e => setTempRel(e.target.value)}
          className="w-full p-2 rounded-lg outline-none"
          style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, color: c.text }}
        />
      </div>

      <div>
        <label className="text-xs block mb-1.5" style={{ color: c.secondary }}>Theme Color</label>
        <div className="flex gap-2">
          {colors.map(col => (
            <button
              key={col}
              onClick={() => setTempCol(col)}
              className="w-7 h-7 rounded-full border-2 cursor-pointer transition-transform hover:scale-110"
              style={{ background: col, borderColor: tempCol === col ? (c.d ? "#fff" : "#000") : "transparent" }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm cursor-pointer" style={{ color: c.secondary }}>Cancel</button>
        <button onClick={() => {
          setName(tempName);
          setRelation(tempRel);
          setInitials(tempInit);
          setColor(tempCol);
          onClose();
        }} className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
          Save
        </button>
      </div>
    </div>
  );
};

const ViewECGModal = ({ alertItem, onClose }: { alertItem: any; onClose: () => void }) => {
  const c = useColors();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = c.d ? "rgba(100,120,200,0.08)" : "rgba(0,0,0,0.04)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = alertItem.color || c.red;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const isHighHR = alertItem.type.includes("High HR");
    const isAnomaly = alertItem.type.includes("Rhythm") || alertItem.type.includes("HRV");

    const ecgPattern = (x: number): number => {
      const period = isHighHR ? 50 : 80;
      const p = x % period;
      if (p < 5) return 0;
      if (p < 12) return Math.sin((p - 5) / 7 * Math.PI) * 0.15;
      if (p < 18) return 0;
      if (p < 22) return -0.12;
      
      if (isAnomaly && x > 200 && x < 280) {
        return (Math.random() - 0.5) * 0.08;
      }

      if (p < 25) return 0.85; 
      if (p < 28) return -0.4;  
      if (p < 38) return 0;
      if (p < 46) return Math.sin((p - 38) / 8 * Math.PI) * 0.22; 
      return 0;
    };

    for (let x = 0; x < w; x++) {
      const val = ecgPattern(x);
      const y = h / 2 - val * (h * 0.38);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [alertItem, c.d, c.red]);

  return (
    <div className="flex flex-col gap-4 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
      <div className="p-3 rounded-lg" style={{ background: c.cardElevated }}>
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold" style={{ color: c.text }}>{alertItem.type}</span>
          <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: `${alertItem.color}20`, color: alertItem.color }}>Captured telemetry</span>
        </div>
        <div className="text-xs" style={{ color: c.secondary }}>Timestamp: {alertItem.date} at {alertItem.time}</div>
      </div>
      
      <div className="rounded-lg overflow-hidden" style={{ background: c.d ? "#090C16" : "#fdfdfd", border: `1px solid ${c.divider}` }}>
        <canvas ref={canvasRef} width={450} height={160} className="w-full h-[160px]" />
      </div>

      <div className="text-xs leading-relaxed" style={{ color: c.secondary }}>
        * Waveform captured from Lead II. Real-time diagnostic data is stored locally and securely uploaded to your medical profile for physician review.
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
          Close
        </button>
      </div>
    </div>
  );
};

const PerMemberAlertsModal = ({ onClose }: { onClose: () => void }) => {
  const c = useColors();
  const [storedContacts] = useLocalStorage<any[]>("cs_emergency_contacts", []);
  const defaultMembers = storedContacts.map((c: any) => ({
    name: `${c.name} (${c.role?.split(' ·')[0] || 'Contact'})`,
    push: true, sms: true, call: c.pri === 1,
  }));
  const [members, setMembers] = useLocalStorage("cs_per_member_alerts", defaultMembers);

  const toggleVal = (index: number, key: 'push' | 'sms' | 'call') => {
    setMembers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: !copy[index][key] };
      return copy;
    });
  };

  return (
    <div className="flex flex-col gap-4 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
      <p style={{ color: c.secondary, fontSize: 13 }}>Configure individual alert settings for each family member in your circle.</p>
      
      <div className="flex flex-col gap-3">
        {members.map((m, i) => (
          <div key={m.name} className="p-3 rounded-lg border flex flex-col gap-2.5" style={{ background: c.cardElevated, borderColor: c.divider }}>
            <span className="font-semibold" style={{ color: c.text, fontSize: 14 }}>{m.name}</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: c.text }}>
                <Toggle size="sm" on={m.push} onToggle={() => toggleVal(i, 'push')} /> Push
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: c.text }}>
                <Toggle size="sm" on={m.sms} onToggle={() => toggleVal(i, 'sms')} /> SMS
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: c.text }}>
                <Toggle size="sm" on={m.call} onToggle={() => toggleVal(i, 'call')} /> Call
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
          Done
        </button>
      </div>
    </div>
  );
};

const RecalibrateBaselineModal = ({
  setBaselineDate,
  setBaselineRange,
  onClose
}: any) => {
  const c = useColors();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Initializing electrodes...");

  useEffect(() => {
    const stages = [
      "Initializing electrodes...",
      "Analyzing signal quality...",
      "Measuring resting heart rate...",
      "Correlating HRV patterns...",
      "Finalizing new baseline baseline..."
    ];
    let count = 0;
    const interval = setInterval(() => {
      count += 2;
      setProgress(count);
      
      const idx = Math.floor((count / 100) * stages.length);
      if (stages[idx]) setStage(stages[idx]);

      if (count >= 100) {
        clearInterval(interval);
        const today = new Date();
        const formattedDate = `${today.getDate()} ${today.toLocaleString('en-US', { month: 'short' })} ${today.getFullYear()}`;
        setBaselineDate(formattedDate);
        const minHR = Math.floor(Math.random() * 8) + 55; 
        const maxHR = minHR + Math.floor(Math.random() * 6) + 12; 
        setBaselineRange(`${minHR}–${maxHR} BPM`);
        setTimeout(() => {
          onClose();
          alert("Baseline recalibrated successfully!");
        }, 600);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [onClose, setBaselineDate, setBaselineRange]);

  return (
    <div className="flex flex-col gap-4 text-center py-4" style={{ fontFamily: "Syne, sans-serif" }}>
      <div className="flex justify-center mb-2">
        <Heart size={48} className="animate-pulse" style={{ color: c.red }} />
      </div>
      <div className="font-semibold text-lg" style={{ color: c.text }}>Recalibrating Baseline</div>
      <p style={{ color: c.secondary, fontSize: 13 }}>Please sit still and breathe normally. This takes a few seconds.</p>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4 overflow-hidden">
        <div className="h-2.5 rounded-full" style={{ width: `${progress}%`, background: c.red, transition: "width 0.1s" }} />
      </div>
      <div className="text-xs font-mono" style={{ color: c.muted }}>{progress}% - {stage}</div>
    </div>
  );
};

const AIDisclosureModal = ({ onClose }: { onClose: () => void }) => {
  const c = useColors();
  return (
    <div className="flex flex-col gap-4 text-sm" style={{ color: c.secondary, fontFamily: "Syne, sans-serif" }}>
      <div style={{ color: c.text, fontWeight: 600 }}>1. Intended Use & Clinical Scope</div>
      <p className="leading-relaxed">
        CardiShirt Neural v3.2 is a localized deep learning software application designed to analyze multi-lead ECG signals. It is intended for use by patients under clinical guidance to capture and review cardiac rhythm trends. It is NOT a diagnostic tool. Do NOT alter medications or treatment plans without consulting your cardiologist.
      </p>
      
      <div style={{ color: c.text, fontWeight: 600 }}>2. Algorithm Performance & Certification</div>
      <p className="leading-relaxed">
        The underlying neural network is trained on over 500,000 clinical ECG records, achieving a 98.4% sensitivity for premature ventricular contractions (PVCs) and atrial fibrillation detection. The model operates under Class IIa medical software guidance.
      </p>

      <div style={{ color: c.text, fontWeight: 600 }}>3. Data Privacy & Device Sovereignty</div>
      <p className="leading-relaxed">
        All real-time telemetry processing is performed locally on the paired mobile device. Telemetry data is only uploaded to the cloud if explicit physician syncing is enabled or during automated emergency dispatch triggers.
      </p>

      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
          Close
        </button>
      </div>
    </div>
  );
};

const PrivacyPolicyModal = ({ onClose }: { onClose: () => void }) => {
  const c = useColors();
  return (
    <div className="flex flex-col gap-4 text-sm" style={{ color: c.secondary, fontFamily: "Syne, sans-serif" }}>
      <p className="leading-relaxed">
        At CardiShirt, patient data sovereignty is our core value. We believe you own your medical data.
      </p>
      <div style={{ color: c.text, fontWeight: 600 }}>1. Data We Collect</div>
      <p className="leading-relaxed">
        We collect ECG signal data, heart rate metrics, physical activity logs, and personal profile information to establish baselines.
      </p>
      <div style={{ color: c.text, fontWeight: 600 }}>2. How We Share It</div>
      <p className="leading-relaxed">
        Data is only shared with designated caregivers and registered healthcare providers. Anonymous clinical telemetry may be shared with quality assurance teams only with explicit consent. We never sell data to advertisers or insurers.
      </p>
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
          Close
        </button>
      </div>
    </div>
  );
};

const ManageStorageModal = ({ onClose }: { onClose: () => void }) => {
  const c = useColors();
  const computeStorageSizes = () => {
    let ecgBytes = 0, logBytes = 0, cacheBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || "";
        const bytes = new Blob([val]).size;
        if (key.includes('ecg') || key.includes('waveform')) ecgBytes += bytes;
        else if (key.includes('alert') || key.includes('diary') || key.includes('checkin')) logBytes += bytes;
        else cacheBytes += bytes;
      }
    } catch(e) { /* ignore */ }
    const fmt = (b: number) => b > 1048576 ? `${(b/1048576).toFixed(1)} MB` : b > 1024 ? `${(b/1024).toFixed(0)} KB` : `${b} B`;
    return { ecg: fmt(ecgBytes), logs: fmt(logBytes), cache: fmt(cacheBytes) };
  };
  const [sizes, setSizes] = useState(computeStorageSizes);

  return (
    <div className="flex flex-col gap-4 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
      <p style={{ color: c.secondary }}>Clean up local storage by purging diagnostic logs or cached telemetry data. Critical clinical records are stored securely on the server.</p>
      
      <div className="flex flex-col gap-3">
        {[
          { id: "ecg", l: "Raw ECG Waveform Data", desc: "Stored local telemetry stream", size: sizes.ecg },
          { id: "logs", l: "Daily Activity Logs", desc: "Local history and daily check-ins", size: sizes.logs },
          { id: "cache", l: "Diagnostic Sensor Cache", desc: "Cached firmware statistics", size: sizes.cache }
        ].map(item => (
          <div key={item.id} className="flex justify-between items-center p-3 rounded-lg border" style={{ background: c.cardElevated, borderColor: c.divider }}>
            <div>
              <div className="font-semibold" style={{ color: c.text }}>{item.l}</div>
              <div className="text-xs" style={{ color: c.secondary }}>{item.desc}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold" style={{ color: c.text }}>{item.size}</span>
              {item.size !== "0 KB" && item.size !== "0 MB" && item.size !== "0 GB" && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete local ${item.l}?`)) {
                      setSizes(prev => ({ ...prev, [item.id]: "0 KB" }));
                    }
                  }}
                  style={{ color: c.red }}
                  className="p-1 hover:opacity-85 text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
          Close
        </button>
      </div>
    </div>
  );
};

const ExportDataModal = ({ onClose }: { onClose: () => void }) => {
  const c = useColors();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 5;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setDone(true);
        try {
          const pFirstName = localStorage.getItem('cs_first_name') ? JSON.parse(localStorage.getItem('cs_first_name')!) : 'N/A';
          const pLastName = localStorage.getItem('cs_last_name') ? JSON.parse(localStorage.getItem('cs_last_name')!) : '';
          const pBlood = localStorage.getItem('cs_blood_type') ? JSON.parse(localStorage.getItem('cs_blood_type')!) : 'N/A';
          const pDob = localStorage.getItem('cs_dob') ? JSON.parse(localStorage.getItem('cs_dob')!) : 'N/A';
          const pSN = localStorage.getItem('cs_shirt_sn') ? JSON.parse(localStorage.getItem('cs_shirt_sn')!) : 'N/A';
          const pBaseRange = localStorage.getItem('cs_baseline_range') ? JSON.parse(localStorage.getItem('cs_baseline_range')!) : 'Not established';
          const pBaseDate = localStorage.getItem('cs_baseline_date') ? JSON.parse(localStorage.getItem('cs_baseline_date')!) : 'Not established';
          const pAlerts = localStorage.getItem('cs_alert_history') ? JSON.parse(localStorage.getItem('cs_alert_history')!) : [];

          const doc = new jsPDF();
          doc.setFontSize(22);
          doc.setTextColor(232, 48, 74);
          doc.text("CardiShirt Clinical Profile", 20, 20);
          
          doc.setFontSize(14);
          doc.setTextColor(40, 40, 40);
          doc.text("Patient Information:", 20, 35);
          doc.setFontSize(12);
          doc.setTextColor(80, 80, 80);
          doc.text(`Name: ${pFirstName} ${pLastName}`, 25, 45);
          doc.text(`Date of Birth: ${pDob}`, 25, 52);
          doc.text(`Blood Type: ${pBlood}`, 25, 59);
          doc.text(`Sensor SN: ${pSN}`, 25, 66);
          
          doc.setFontSize(14);
          doc.setTextColor(40, 40, 40);
          doc.text("Vitals Baseline:", 20, 81);
          doc.setFontSize(12);
          doc.setTextColor(80, 80, 80);
          doc.text(`Resting HR: ${pBaseRange}`, 25, 91);
          doc.text(`Baseline Established: ${pBaseDate}`, 25, 98);
          
          if (pAlerts.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text("Recent Alert History:", 20, 113);
            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            pAlerts.slice(0, 5).forEach((a: any, i: number) => {
              doc.text(`- ${a.type} (${a.date} ${a.time})`, 25, 123 + i * 7);
            });
          } else {
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text("Recent Alert History:", 20, 113);
            doc.setFontSize(12);
            doc.setTextColor(80, 80, 80);
            doc.text("No alerts recorded.", 25, 123);
          }
          
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text("Generated on: " + new Date().toLocaleString(), 20, 280);
          
          doc.save("cardishirt_health_data.pdf");
        } catch (e) {
          console.error("PDF Export failed:", e);
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 text-center py-4" style={{ fontFamily: "Syne, sans-serif" }}>
      {!done ? (
        <>
          <div className="flex justify-center mb-2 animate-bounce">
            <Download size={40} style={{ color: c.blue }} />
          </div>
          <div className="font-semibold text-lg" style={{ color: c.text }}>Exporting Clinical Profile</div>
          <p style={{ color: c.secondary, fontSize: 13 }}>Compiling full ECG history, check-in narratives, and device reports into JSON format...</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4 overflow-hidden dark:bg-gray-700">
            <div className="h-2 rounded-full" style={{ width: `${progress}%`, background: c.blue }} />
          </div>
          <span className="text-xs font-mono" style={{ color: c.muted }}>{progress}%</span>
        </>
      ) : (
        <>
          <div className="flex justify-center mb-2">
            <CheckCircle size={48} style={{ color: c.green }} />
          </div>
          <div className="font-semibold text-lg" style={{ color: c.text }}>Export Complete</div>
          <p style={{ color: c.secondary, fontSize: 13 }}>Your file <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">cardishirt_health_data.pdf</code> has been generated and downloaded successfully.</p>
          <div className="flex justify-center gap-2 mt-4">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const ChangePINModal = ({ onClose }: { onClose: () => void }) => {
  const c = useColors();
  const [pin, setPin] = useLocalStorage("cs_app_pin", "1234");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (oldPin !== pin) {
      setError("Current PIN is incorrect.");
      return;
    }
    if (newPin.length !== 4 || isNaN(+newPin)) {
      setError("New PIN must be a 4-digit number.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PIN verification does not match.");
      return;
    }
    setPin(newPin);
    alert("Application PIN changed successfully!");
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
      {error && <div className="p-2.5 rounded-lg text-xs font-semibold" style={{ background: `${c.red}10`, color: c.red }}>{error}</div>}
      <div>
        <label className="text-xs block mb-1" style={{ color: c.secondary }}>Current 4-Digit PIN</label>
        <input
          type="password"
          maxLength={4}
          value={oldPin}
          onChange={e => { setError(""); setOldPin(e.target.value); }}
          className="w-full p-2 rounded-lg font-mono text-center tracking-widest outline-none border"
          style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.text }}
        />
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: c.secondary }}>New 4-Digit PIN</label>
        <input
          type="password"
          maxLength={4}
          value={newPin}
          onChange={e => { setError(""); setNewPin(e.target.value); }}
          className="w-full p-2 rounded-lg font-mono text-center tracking-widest outline-none border"
          style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.text }}
        />
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: c.secondary }}>Confirm New PIN</label>
        <input
          type="password"
          maxLength={4}
          value={confirmPin}
          onChange={e => { setError(""); setConfirmPin(e.target.value); }}
          className="w-full p-2 rounded-lg font-mono text-center tracking-widest outline-none border"
          style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.text }}
        />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg cursor-pointer" style={{ color: c.secondary }}>Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 rounded-lg font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
          Save PIN
        </button>
      </div>
    </div>
  );
};

const ManageContactsModal = ({ contacts, setContacts, onClose }: any) => {
  const c = useColors();
  const [tempContacts, setTempContacts] = useState(contacts);

  const moveContact = (index: number, direction: 'up' | 'down') => {
    const copy = [...tempContacts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= copy.length) return;
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    const updated = copy.map((item, idx) => ({ ...item, pri: idx + 1 }));
    setTempContacts(updated);
  };

  const deleteContact = (index: number) => {
    if (confirm(`Remove ${tempContacts[index].name} from emergency contacts?`)) {
      const filtered = tempContacts.filter((_: any, idx: number) => idx !== index);
      const updated = filtered.map((item: any, idx: number) => ({ ...item, pri: idx + 1 }));
      setTempContacts(updated);
    }
  };

  const handleSave = () => {
    setContacts(tempContacts);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
      <p style={{ color: c.secondary }}>Configure emergency contact notification priorities. The primary contact will be reached first.</p>
      
      <div className="flex flex-col gap-2">
        {tempContacts.map((m: any, i: number) => (
          <div key={m.name} className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: c.cardElevated, borderColor: c.divider }}>
            <span className="flex items-center justify-center flex-shrink-0" style={{
              width: 22, height: 22, borderRadius: 11,
              background: m.pri === 1 ? `${c.red}20` : c.strip,
              fontFamily: "DM Mono, monospace", fontSize: 11,
              color: m.pri === 1 ? c.red : c.muted,
            }}>{m.pri}</span>
            <div className="flex-1">
              <div className="font-semibold" style={{ color: c.text }}>{m.name}</div>
              <div className="text-xs" style={{ color: c.secondary }}>{m.role}</div>
            </div>
            <div className="flex items-center gap-1">
              <button disabled={i === 0} onClick={() => moveContact(i, 'up')} style={{ color: i === 0 ? c.muted : c.text }} className="p-1 hover:opacity-85 cursor-pointer">
                <ArrowUp size={14} />
              </button>
              <button disabled={i === tempContacts.length - 1} onClick={() => moveContact(i, 'down')} style={{ color: i === tempContacts.length - 1 ? c.muted : c.text }} className="p-1 hover:opacity-85 cursor-pointer">
                <ArrowDown size={14} />
              </button>
              <button onClick={() => deleteContact(i)} style={{ color: c.red }} className="p-1 hover:opacity-85 cursor-pointer ml-1">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg cursor-pointer" style={{ color: c.secondary }}>Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 rounded-lg font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
          Save Priority
        </button>
      </div>
    </div>
  );
};

const CheckUpdatesModal = ({ onClose }: { onClose: () => void }) => {
  const c = useColors();
  const [status, setStatus] = useState("Connecting to server...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = ["Connecting to server...", "Verifying checksums...", "Checking for updates...", "App is up to date (v2.8.0)"];
    let count = 0;
    const interval = setInterval(() => {
      count += 5;
      setProgress(count);
      const idx = Math.floor((count / 100) * steps.length);
      if (steps[idx]) setStatus(steps[idx]);
      if (count >= 100) {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 text-center py-4" style={{ fontFamily: "Syne, sans-serif" }}>
      {progress < 100 ? (
        <>
          <div className="flex justify-center mb-2">
            <RefreshCw size={36} className="animate-spin" style={{ color: c.blue }} />
          </div>
          <div className="font-semibold text-lg" style={{ color: c.text }}>Checking for Updates</div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden dark:bg-gray-700">
            <div className="h-2 rounded-full" style={{ width: `${progress}%`, background: c.blue }} />
          </div>
          <span className="text-xs font-mono" style={{ color: c.muted }}>{status}</span>
        </>
      ) : (
        <>
          <div className="flex justify-center mb-2">
            <CheckCircle size={48} style={{ color: c.green }} />
          </div>
          <div className="font-semibold text-lg" style={{ color: c.text }}>App Up To Date</div>
          <p style={{ color: c.secondary, fontSize: 13 }}>Your CardiShirt mobile application is running the latest stable release (v2.8.0).</p>
          <div className="flex justify-center mt-2">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const SupportModal = ({ label, onClose }: { label: string; onClose: () => void }) => {
  const c = useColors();
  const [msg, setMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (label === "Terms of service" || label === "Privacy policy" || label === "Regulatory information") {
    return (
      <div className="flex flex-col gap-3 text-sm leading-relaxed" style={{ color: c.secondary, fontFamily: "Syne, sans-serif" }}>
        <p>This document details the CardiShirt legal, medical, and clinical compliance protocols.</p>
        <p>For official inquiries or records requests, contact compliance@cardishirt.com or consult your clinical supervisor.</p>
        <div className="flex justify-end mt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>Close</button>
        </div>
      </div>
    );
  }

  if (label === "Help center") {
    const faqs = [
      { q: "How often should I test the shirt?", a: "We recommend running a test once a week, or whenever you wash the shirt and put it back on." },
      { q: "What should I do if a lead signal is weak?", a: "Ensure the electrode patch is in direct contact with skin and the shirt is snug. Avoid thick body hair or excessive sweat." },
      { q: "Can the shirt be washed?", a: "Yes, make sure to remove the transmitter pod before machine washing on a gentle cycle. Air dry only." }
    ];
    return (
      <div className="flex flex-col gap-3 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
        {faqs.map(f => (
          <div key={f.q} className="p-3 rounded-lg border" style={{ background: c.cardElevated, borderColor: c.divider }}>
            <div className="font-semibold mb-1" style={{ color: c.text }}>{f.q}</div>
            <div style={{ color: c.secondary }}>{f.a}</div>
          </div>
        ))}
        <div className="flex justify-end mt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
      {!submitted ? (
        <>
          <label style={{ color: c.secondary }}>Enter details to submit a request to the CardiShirt technical team:</label>
          <textarea
            value={msg}
            rows={4}
            onChange={e => setMsg(e.target.value)}
            className="w-full p-2.5 rounded-lg outline-none border"
            style={{ background: c.inputBg, borderColor: c.inputBorder, color: c.text }}
            placeholder={label === "Report a problem" ? "Describe the bug or connection issue..." : "How can we help you today?"}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg cursor-pointer" style={{ color: c.secondary }}>Cancel</button>
            <button disabled={!msg} onClick={() => setSubmitted(true)} className="px-4 py-2 rounded-lg font-semibold cursor-pointer" style={{ background: c.red, color: "#fff", opacity: msg ? 1 : 0.5 }}>
              Submit
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-4 flex flex-col gap-3">
          <div className="flex justify-center"><CheckCircle size={40} style={{ color: c.green }} /></div>
          <div className="font-semibold text-base" style={{ color: c.text }}>Ticket Submitted</div>
          <p style={{ color: c.secondary }}>Thank you for reaching out. A customer support representative will contact you via email or phone within 24 hours.</p>
          <div className="flex justify-center mt-2">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const PairShirtModal = ({ setShirtName, setShirtSN, onClose }: any) => {
  const c = useColors();
  const [step, setStep] = useState<"enter" | "scanning" | "done">("enter");
  const [name, setName] = useState("");
  const [sn, setSn] = useState("");
  const [progress, setProgress] = useState(0);

  const startPairing = () => {
    if (!name.trim() || !sn.trim()) return;
    setStep("scanning");
    let count = 0;
    const interval = setInterval(() => {
      count += 4;
      setProgress(count);
      if (count >= 100) {
        clearInterval(interval);
        setStep("done");
        setShirtName(name.trim());
        setShirtSN(sn.trim());
      }
    }, 80);
  };

  return (
    <div className="flex flex-col gap-4 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
      {step === "enter" && (
        <>
          <p style={{ color: c.secondary }}>Enter the details printed on the inside label of your CardiShirt, or scan the QR code on the shirt's transmitter pod.</p>
          <div>
            <label className="text-xs block mb-1" style={{ color: c.secondary }}>Shirt Model Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. CardiShirt Pro · 3-Lead"
              className="w-full p-2.5 rounded-lg outline-none"
              style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, color: c.text, fontFamily: "Syne, sans-serif", fontSize: 14 }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: c.secondary }}>Serial Number</label>
            <input
              type="text"
              value={sn}
              onChange={e => setSn(e.target.value)}
              placeholder="e.g. CS-2026-DK-00142"
              className="w-full p-2.5 rounded-lg outline-none"
              style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, color: c.text, fontFamily: "DM Mono, monospace", fontSize: 14 }}
            />
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg cursor-pointer" style={{ color: c.secondary }}>Cancel</button>
            <button
              onClick={startPairing}
              disabled={!name.trim() || !sn.trim()}
              className="px-4 py-2 rounded-lg font-semibold cursor-pointer"
              style={{ background: c.red, color: "#fff", opacity: (!name.trim() || !sn.trim()) ? 0.5 : 1 }}
            >
              Pair Shirt
            </button>
          </div>
        </>
      )}
      {step === "scanning" && (
        <div className="text-center py-4 flex flex-col gap-3">
          <div className="flex justify-center mb-2">
            <Wifi size={40} className="animate-pulse" style={{ color: c.blue }} />
          </div>
          <div className="font-semibold text-lg" style={{ color: c.text }}>Pairing with CardiShirt</div>
          <p style={{ color: c.secondary, fontSize: 13 }}>Searching for {name}...</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden dark:bg-gray-700">
            <div className="h-2 rounded-full" style={{ width: `${progress}%`, background: c.blue, transition: "width 0.1s" }} />
          </div>
          <span className="text-xs font-mono" style={{ color: c.muted }}>{progress}%</span>
        </div>
      )}
      {step === "done" && (
        <div className="text-center py-4 flex flex-col gap-3">
          <div className="flex justify-center mb-2">
            <CheckCircle size={48} style={{ color: c.green }} />
          </div>
          <div className="font-semibold text-lg" style={{ color: c.text }}>Shirt Paired Successfully</div>
          <p style={{ color: c.secondary, fontSize: 13 }}>
            <strong style={{ color: c.text }}>{name}</strong> (SN: <code className="font-mono text-xs">{sn}</code>) is now connected and ready for monitoring.
          </p>
          <div className="flex justify-center mt-2">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckFirmwareUpdatesModal = ({ currentVersion, setFirmwareVersion, setFirmwareDate, onClose }: any) => {
  const c = useColors();
  const [status, setStatus] = useState("Connecting to update server...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [
      "Connecting to update server...",
      "Reading device firmware...",
      "Comparing versions...",
      "Firmware is up to date"
    ];
    let count = 0;
    const interval = setInterval(() => {
      count += 5;
      setProgress(count);
      const idx = Math.floor((count / 100) * steps.length);
      if (steps[idx]) setStatus(steps[idx]);
      if (count >= 100) {
        clearInterval(interval);
        const today = new Date();
        const formattedDate = `${today.getDate()} ${today.toLocaleString('en-US', { month: 'short' })} ${today.getFullYear()}`;
        setFirmwareDate(formattedDate);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [setFirmwareDate]);

  return (
    <div className="flex flex-col gap-4 text-center py-4" style={{ fontFamily: "Syne, sans-serif" }}>
      {progress < 100 ? (
        <>
          <div className="flex justify-center mb-2">
            <RefreshCw size={36} className="animate-spin" style={{ color: c.blue }} />
          </div>
          <div className="font-semibold text-lg" style={{ color: c.text }}>Checking Firmware</div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden dark:bg-gray-700">
            <div className="h-2 rounded-full" style={{ width: `${progress}%`, background: c.blue }} />
          </div>
          <span className="text-xs font-mono" style={{ color: c.muted }}>{status}</span>
        </>
      ) : (
        <>
          <div className="flex justify-center mb-2">
            <CheckCircle size={48} style={{ color: c.green }} />
          </div>
          <div className="font-semibold text-lg" style={{ color: c.text }}>Firmware Up To Date</div>
          <p style={{ color: c.secondary, fontSize: 13 }}>
            Your CardiShirt is running the latest firmware (<code className="font-mono text-xs">{currentVersion}</code>). No updates available.
          </p>
          <div className="flex justify-center mt-2">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer" style={{ background: c.red, color: "#fff" }}>
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
};

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
type Category = "profile" | "alerts" | "ai" | "display" | "privacy" | "emergency" | "about";

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
function ProfileSection({
  openModal,
  phone, setPhone,
  email, setEmail,
  caregiverName, setCaregiverName,
  caregiverRelation, setCaregiverRelation,
  caregiverInitials, setCaregiverInitials,
  caregiverColor, setCaregiverColor,
  avatarInitials, setAvatarInitials,
  avatarBgColor, setAvatarBgColor,
  avatarUrl, setAvatarUrl
}: any) {
  const c = useColors();
  const [editing, setEditing] = useState(false);
  const [caregiverOn, setCaregiverOn] = useLocalStorage("cs_caregiver", true);

  const [firstName, setFirstName] = useLocalStorage("cs_first_name", "Adnan");
  const [lastName, setLastName] = useLocalStorage("cs_last_name", "Uddin");
  const [dob, setDob] = useLocalStorage("cs_dob", "15/03/1964");
  const [bloodType, setBloodType] = useLocalStorage("cs_blood_type", "B+");

  const [tempFirst, setTempFirst] = useState(firstName);
  const [tempLast, setTempLast] = useState(lastName);
  const [tempDob, setTempDob] = useState(dob);
  const [tempBlood, setTempBlood] = useState(bloodType);

  useEffect(() => {
    if(editing) {
      setTempFirst(firstName);
      setTempLast(lastName);
      setTempDob(dob);
      setTempBlood(bloodType);
    }
  }, [editing, firstName, lastName, dob, bloodType]);

  const handleSaveProfile = () => {
    setFirstName(tempFirst);
    setLastName(tempLast);
    setDob(tempDob);
    setBloodType(tempBlood);
    setEditing(false);
    alert("Profile saved successfully!");
  };

  const conditions = ["Hypertension", "Diabetes", "Previous cardiac event", "Pacemaker", "Other"];
  const [checkedConditions, setCheckedConditions] = useLocalStorage("cs_conditions", [true, false, true, false, false]);

  return (
    <>
      {/* Patient Profile */}
      <SectionCard title="Patient Profile" icon={<User size={18} />} iconColor="#5B8AF0">
        <div className="flex items-start gap-5 mb-4">
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="flex items-center justify-center" style={{
                width: 80, height: 80, borderRadius: 40, background: avatarBgColor,
                color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 500,
              }}>{avatarInitials || (firstName.substring(0, 1).toUpperCase() + lastName.substring(0, 1).toUpperCase())}</div>
            )}
            <button
              onClick={() => openModal("Change Profile Picture", (
                <ChangeAvatarModal
                  avatarInitials={avatarInitials || (firstName.substring(0, 1).toUpperCase() + lastName.substring(0, 1).toUpperCase())}
                  setAvatarInitials={setAvatarInitials}
                  avatarBgColor={avatarBgColor}
                  setAvatarBgColor={setAvatarBgColor}
                  avatarUrl={avatarUrl}
                  setAvatarUrl={setAvatarUrl}
                  onClose={() => openModal("", null)}
                />
              ))}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              style={{ background: c.cardBg, borderWidth: 1.5, borderStyle: "solid", borderColor: c.cardBorder }}
            >
              <Camera size={13} style={{ color: c.secondary }} />
            </button>
          </div>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 500, color: c.text }}>{firstName} {lastName}</div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.secondary }}>DOB: {dob} · Blood Type {bloodType}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span style={{ padding: "2px 10px", borderRadius: 10, background: `${c.amber}15`, color: c.amber, fontFamily: "Syne, sans-serif", fontSize: 12 }}>Watch tier</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>Risk score 73</span>
            </div>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)} style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.red, cursor: "pointer" }}>
          <Edit2 size={12} className="inline mr-1" />{editing ? "Close editor" : "Edit profile"}
        </button>
        {editing && (
          <div className="mt-4 pt-4 flex flex-col gap-3" style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: c.divider }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 3 }}>First Name</label>
                <input value={tempFirst} onChange={e=>setTempFirst(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.inputBorder, fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 3 }}>Last Name</label>
                <input value={tempLast} onChange={e=>setTempLast(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.inputBorder, fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 3 }}>Date of Birth</label>
                <input value={tempDob} onChange={e=>setTempDob(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.inputBorder, fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary, display: "block", marginBottom: 3 }}>Blood Type</label>
                <input value={tempBlood} onChange={e=>setTempBlood(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: c.inputBg, borderWidth: 1, borderStyle: "solid", borderColor: c.inputBorder, fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text, outline: "none" }} />
              </div>
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
            <button onClick={handleSaveProfile} className="self-start px-5 py-2 rounded-lg active:scale-95 transition-all font-semibold cursor-pointer" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>Save changes</button>
          </div>
        )}
      </SectionCard>

      {/* Account Details */}
      <SectionCard title="Account Details" icon={<Mail size={18} />} iconColor="#5B8AF0">
        <SettingRow label="Phone Number" desc="Primary identifier for your account">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>{phone}</span>
            <TextLink label="Edit" color={c.red} onClick={() => openModal("Edit Phone Number", (
              <EditFieldModal
                label="Phone Number"
                initialValue={phone}
                onSave={setPhone}
                onClose={() => openModal("", null)}
              />
            ))} />
          </div>
        </SettingRow>
        <SettingRow label="Email Address">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>{email}</span>
            <TextLink label="Edit" color={c.red} onClick={() => openModal("Edit Email Address", (
              <EditFieldModal
                label="Email Address"
                initialValue={email}
                onSave={setEmail}
                onClose={() => openModal("", null)}
              />
            ))} />
          </div>
        </SettingRow>
        <div className="pt-3">
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.muted }}>Account created · </span>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>{(() => { try { const d = localStorage.getItem('cs_account_created'); return d ? JSON.parse(d) : 'N/A'; } catch { return 'N/A'; } })()}</span>
        </div>
      </SectionCard>

      {/* Caregiver Access */}
      <SectionCard title="Caregiver Access" icon={<User size={18} />} iconColor={c.green}>
        <SettingRow label="Allow caregiver configuration" desc="A designated family member can edit your settings on your behalf">
          <Toggle on={caregiverOn} onToggle={() => setCaregiverOn(!caregiverOn)} />
        </SettingRow>
        {caregiverOn && (
          <div className="mt-3 p-3 rounded-lg flex items-center gap-3" style={{ background: c.cardElevated }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold" style={{ background: caregiverColor, fontFamily: "Syne, sans-serif", fontSize: 14 }}>
              {caregiverInitials}
            </div>
            <div className="flex-1">
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text }}>{caregiverName}</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>{caregiverRelation} · Active caregiver</div>
            </div>
            <TextLink label="Change" color={c.red} onClick={() => openModal("Change Caregiver Access", (
              <ChangeCaregiverModal
                name={caregiverName}
                setName={setCaregiverName}
                relation={caregiverRelation}
                setRelation={setCaregiverRelation}
                initials={caregiverInitials}
                setInitials={setCaregiverInitials}
                color={caregiverColor}
                setColor={setCaregiverColor}
                onClose={() => openModal("", null)}
              />
            ))} />
          </div>
        )}
      </SectionCard>

      {/* Danger Zone */}
      <div className="mt-2 pt-5" style={{ borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: c.divider }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: c.muted, marginBottom: 12, display: "block" }}>Danger Zone</span>
        <div className="flex items-center gap-6">
          <TextLink label="Delete account" color={c.red} onClick={() => {if(window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) alert("Account deletion request submitted.");}} />
          <TextLink label="Export all my data" color={c.blue} onClick={() => openModal("Export All Patient Data", <ExportDataModal onClose={() => openModal("", null)} />)} />
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

/* ════════════════════════════════════════════
   3. ALERTS & NOTIFICATIONS
   ════════════════════════════════════════════ */
function AlertsSection({ openModal, alerts, setAlerts }: any) {
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
  const [quietStart, setQuietStart] = useLocalStorage("cs_quietStart", "22:00");
  const [quietEnd, setQuietEnd] = useLocalStorage("cs_quietEnd", "07:00");
  const [emergOverride, setEmergOverride] = useLocalStorage("cs_emergOverride", true);

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
            <TextLink label="Per-member →" color={c.red} onClick={() => openModal("Per-Member Alert Configuration", (
              <PerMemberAlertsModal onClose={() => openModal("", null)} />
            ))} />
          </div>
        </SettingRow>
        <SettingRow label="Quiet hours" desc="Suppress non-critical notifications during this window">
          <div className="flex items-center gap-3">
            <Toggle on={quietOn} onToggle={() => setQuietOn(!quietOn)} />
            {quietOn && (
              <div className="flex items-center gap-1">
                <input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 6, padding: "3px 6px", fontFamily: "DM Mono, monospace", fontSize: 13, color: c.text, outline: "none", width: 85 }} />
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.muted }}>to</span>
                <input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 6, padding: "3px 6px", fontFamily: "DM Mono, monospace", fontSize: 13, color: c.text, outline: "none", width: 85 }} />
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
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-sm font-semibold" style={{ color: c.muted, fontFamily: "Syne, sans-serif" }}>No alerts logged yet.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {alerts.map((a: any, i: number) => (
              <div key={`alert-${i}`} className="flex items-center gap-3 py-2" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: c.divider }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: a.color, flexShrink: 0 }} />
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>{a.date}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>{a.time}</span>
                <span className="flex-1" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{a.type}</span>
                <TextLink label="View ECG" color={c.blue} onClick={() => openModal("ECG Waveform Capture", (
                  <ViewECGModal alertItem={a} onClose={() => openModal("", null)} />
                ))} />
              </div>
            ))}
          </div>
        )}
        {alerts.length > 0 && (
          <div className="mt-3">
            <TextLink label="Clear alert history" color={c.muted} onClick={() => {
              if (confirm("Are you sure you want to clear your local alert history? This will not affect clinical records on the hospital server.")) {
                setAlerts([]);
              }
            }} />
          </div>
        )}
      </SectionCard>
    </>
  );
}

/* ════════════════════════════════════════════
   4. AI & ANALYSIS
   ════════════════════════════════════════════ */
function AISection({ openModal, baselineDate, setBaselineDate, baselineDays, setBaselineDays, baselineRange, setBaselineRange }: any) {
  const c = useColors();
  const [freq, setFreq] = useLocalStorage("cs_analysis_freq", "Continuous");
  const [summaryTime, setSummaryTime] = useLocalStorage("cs_summary_time", "20:00");
  const [weekDay, setWeekDay] = useLocalStorage("cs_weekly_day", "Sunday");
  const [checkinOn, setCheckinOn] = useLocalStorage("cs_checkin_on", true);
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
            { l: "Baseline established", v: baselineDate },
            { l: "Days of data", v: baselineDays },
            { l: "Resting HR range", v: baselineRange },
          ].map(s => (
            <div key={s.l} className="p-3 rounded-lg" style={{ background: c.cardElevated }}>
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.muted, display: "block", marginBottom: 2 }}>{s.l}</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>{s.v}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => openModal("Baseline Recalibration", (
              <RecalibrateBaselineModal
                setBaselineDate={setBaselineDate}
                setBaselineRange={setBaselineRange}
                onClose={() => openModal("", null)}
              />
            ))}
            className="px-4 py-2 rounded-lg cursor-pointer hover:opacity-85 active:scale-95 transition-transform"
            style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.amber, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.amber, background: "transparent" }}
          >
            Recalibrate baseline
          </button>
          <TextLink label="Reset to factory baseline" color={c.muted} onClick={() => {
            if (confirm("Reset local baseline analysis to factory defaults? This requires wearing the shirt for 24 hours to re-establish a custom baseline.")) {
              setBaselineDate("12 Feb 2026");
              setBaselineRange("58–74 BPM");
              alert("Baseline reset to factory defaults.");
            }
          }} />
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
        <button onClick={() => setAiDisclosure(!aiDisclosure)} className="flex items-center gap-1 cursor-pointer" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.blue }}>
          How does CardiShirt AI work? {aiDisclosure ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {aiDisclosure && (
          <div className="mt-3 p-4 rounded-lg" style={{ background: c.cardElevated }}>
            <p style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.secondary, lineHeight: 1.7 }}>
              CardiShirt AI continuously analyzes your ECG waveform patterns, heart rate variability, and rhythm regularity. It compares your real-time data against your personal baseline and clinical population data to detect anomalies. The AI does not diagnose medical conditions — it identifies patterns that may require attention and suggests you consult your doctor. All analysis runs locally on your device with periodic cloud validation.
            </p>
            <div className="mt-2">
              <TextLink label="View full AI disclosure →" color={c.blue} onClick={() => openModal("CardiShirt AI Medical & Regulatory Disclosure", (
                <AIDisclosureModal onClose={() => openModal("", null)} />
              ))} />
            </div>
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
  const [lang, setLang] = useLocalStorage("cs_lang", "English");
  const [timeFormat, setTimeFormat] = useLocalStorage("cs_time_format", "12h");
  const [dateFormat, setDateFormat] = useLocalStorage("cs_date_format", "DD/MM/YYYY");
  const [bengaliNums, setBengaliNums] = useLocalStorage("cs_bengali_nums", false);
  const [themeMode, setThemeMode] = useLocalStorage("cs_theme_mode", theme === "dark" ? "Dark" : "Light");
  const [textSize, setTextSize] = useLocalStorage("cs_text_size", "Standard");
  const [showFamily, setShowFamily] = useLocalStorage("cs_show_family", true);
  const [showCheckin, setShowCheckin] = useLocalStorage("cs_show_checkin", true);
  const [showBaseline, setShowBaseline] = useLocalStorage("cs_show_baseline", true);
  const [aiProactive, setAiProactive] = useLocalStorage("cs_ai_proactive", "Normal");

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
function PrivacySection({ openModal, sessions, setSessions }: any) {
  const c = useColors();
  const [analytics, setAnalytics] = useLocalStorage("cs_analytics", true);
  const [doctorShare, setDoctorShare] = useLocalStorage("cs_doctor_share", true);
  const [qaShare, setQaShare] = useLocalStorage("cs_qa_share", true);
  const [appLock, setAppLock] = useLocalStorage("cs_app_lock", false);

  return (
    <>
      <SectionCard title="Data Sharing" icon={<Eye size={18} />} iconColor={c.blue}>
        <SettingRow label="Anonymous analytics" desc="Help improve the AI model with anonymous usage data"><Toggle on={analytics} onToggle={() => setAnalytics(!analytics)} /></SettingRow>
        <SettingRow label="Share with your doctor" desc="Your registered doctor can view your monitoring data"><Toggle on={doctorShare} onToggle={() => setDoctorShare(!doctorShare)} /></SettingRow>
        <SettingRow label="Medical review team" desc="CardiShirt quality assurance — no personal data shared"><Toggle on={qaShare} onToggle={() => setQaShare(!qaShare)} /></SettingRow>
        <div className="mt-3"><TextLink label="View full privacy policy →" color={c.blue} onClick={() => openModal("Privacy & Consent Policy", <PrivacyPolicyModal onClose={() => openModal("", null)} />)} /></div>
      </SectionCard>

      <SectionCard title="Storage & Export" icon={<Download size={18} />} iconColor={c.green}>
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div>
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.secondary }}>Local storage</span>
            <span className="ml-2" style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>{(() => { try { let total = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) total += new Blob([localStorage.getItem(k) || '']).size; } return total > 1048576 ? `${(total/1048576).toFixed(1)} MB` : `${(total/1024).toFixed(0)} KB`; } catch { return 'N/A'; } })()}</span>
            <span className="ml-1" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.muted }}>of ECG data</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => openModal("Manage Local Storage", (
              <ManageStorageModal onClose={() => openModal("", null)} />
            ))}
            className="px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text, background: "transparent" }}
          >
            Manage storage
          </button>
          <button
            onClick={() => openModal("Export All Patient Data", (
              <ExportDataModal onClose={() => openModal("", null)} />
            ))}
            className="px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer hover:opacity-85 active:scale-95 transition-transform"
            style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.blue, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.blue, background: "transparent" }}
          >
            <Download size={14} /> Export all data
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Security" icon={<Lock size={18} />} iconColor="#6B7499">
        <SettingRow label="App lock" desc="Require biometric or PIN to open the app"><Toggle on={appLock} onToggle={() => setAppLock(!appLock)} /></SettingRow>
        {appLock && (
          <div className="mb-3"><TextLink label="Change PIN" color={c.red} onClick={() => openModal("Change Application PIN", <ChangePINModal onClose={() => openModal("", null)} />)} /></div>
        )}
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: c.secondary, marginTop: 12, marginBottom: 8 }}>Active sessions</div>
        <div className="flex flex-col gap-2">
          {sessions.map((s: any) => (
            <div key={s.device} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: c.cardElevated }}>
              <div className="flex items-center gap-2">
                <Smartphone size={14} style={{ color: c.secondary }} />
                <div>
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{s.device}</span>
                  {s.current && <span className="ml-2" style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.green }}>This device</span>}
                  <span className="block" style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.muted }}>{s.last}</span>
                </div>
              </div>
              {!s.current && <TextLink label="Log out" color={c.red} onClick={() => {
                if (confirm(`Log out session on ${s.device}?`)) {
                  setSessions(prev => prev.filter(x => x.device !== s.device));
                }
              }} />}
            </div>
          ))}
        </div>
        <div className="mt-3"><TextLink label="Log out all devices" color={c.red} onClick={() => {
          if (confirm("Log out of all sessions except this device?")) {
            setSessions(prev => prev.filter(x => x.current));
            alert("Logged out all other devices.");
          }
        }} /></div>
      </SectionCard>
    </>
  );
}

/* ════════════════════════════════════════════
   7. EMERGENCY CONFIGURATION
   ════════════════════════════════════════════ */
function EmergencySection({ openModal, dispatchAddress, setDispatchAddress, dispatchPhone, setDispatchPhone, emergencyContacts, setEmergencyContacts }: any) {
  const c = useColors();
  const [dispatchOn, setDispatchOn] = useLocalStorage("cs_dispatch_on", true);
  const [windowVal, setWindowVal] = useLocalStorage("cs_dispatch_window", 60);
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
                <input type="range" min={30} max={120} step={10} value={windowVal} onChange={(e) => setWindowVal(+e.target.value)} style={{ width: 120, accentColor: c.red }} />
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: c.text }}>{windowVal}s</span>
              </div>
            </SettingRow>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 mb-3">
              <div className="p-3 rounded-lg" style={{ background: c.cardElevated }}>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary, display: "block", marginBottom: 2 }}>Dispatch address</span>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{dispatchAddress}</span>
                <div className="mt-1"><TextLink label="Edit" color={c.red} onClick={() => openModal("Edit Dispatch Address", (
                  <EditFieldModal
                    label="Dispatch Address"
                    initialValue={dispatchAddress}
                    onSave={setDispatchAddress}
                    onClose={() => openModal("", null)}
                  />
                ))} /></div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: c.cardElevated }}>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.secondary, display: "block", marginBottom: 2 }}>Dispatch phone</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>{dispatchPhone}</span>
                <div className="mt-1"><TextLink label="Edit" color={c.red} onClick={() => openModal("Edit Dispatch Contact", (
                  <EditFieldModal
                    label="Dispatch Phone Number"
                    initialValue={dispatchPhone}
                    onSave={setDispatchPhone}
                    onClose={() => openModal("", null)}
                  />
                ))} /></div>
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
          <button onClick={() => setShowTestResult(true)} className="px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer active:scale-95 transition-transform" style={{
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
              {emergencyContacts.map((r: any) => (
                <div key={r.name} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: c.d ? "#0D0F1A" : "#F0F2F8" }}>
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>{r.name}</span>
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>{r.method}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>T+{r.time}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: c.d ? "#0D0F1A" : "#F0F2F8" }}>
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text }}>Dhaka Ambulance (999)</span>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.secondary }}>API dispatch</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.muted }}>T+{windowVal}s</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowTestResult(false)} style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.red, cursor: "pointer" }}>Close</button>
          </div>
        )}
      </SectionCard>

      {/* Emergency Contacts Summary */}
      <SectionCard title="Emergency Contacts" icon={<Phone size={18} />} iconColor={c.red}>
        {emergencyContacts.map((m: any) => (
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
        <div className="mt-3"><TextLink label="Manage in Family Circle →" color={c.red} onClick={() => openModal("Emergency Contacts Priority", (
          <ManageContactsModal
            contacts={emergencyContacts}
            setContacts={setEmergencyContacts}
            onClose={() => openModal("", null)}
          />
        ))} /></div>
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
function AboutSection({ openModal }: any) {
  const c = useColors();
  const [diagSent, setDiagSent] = useState(false);

  return (
    <>
      <SectionCard title="CardiShirt" icon={<Heart size={18} />} iconColor={c.red}>
        <div className="flex items-center gap-4 mb-3">
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.secondary }}>App version</span>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.text }}>2.8.0</span>
        </div>
        <button onClick={() => openModal("Checking for Updates", <CheckUpdatesModal onClose={() => openModal("", null)} />)} className="px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ borderWidth: 1, borderStyle: "solid", borderColor: c.cardBorder, fontFamily: "Syne, sans-serif", fontSize: 13, color: c.text, background: "transparent" }}>
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
            <button key={l.label} onClick={() => openModal(l.label, <SupportModal label={l.label} onClose={() => openModal("", null)} />)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.text }}>
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
          <button onClick={() => setDiagSent(true)} className="px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer active:scale-95 transition-transform" style={{
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
  const items = useCategoryItems();

  // Unified settings states
  const [phone, setPhone] = useLocalStorage("cs_phone", "+880 1712-345678");
  const [email, setEmail] = useLocalStorage("cs_email", "rahim@email.com");
  const [caregiverName, setCaregiverName] = useLocalStorage("cs_caregiver_name", "Rehnuma");
  const [caregiverRelation, setCaregiverRelation] = useLocalStorage("cs_caregiver_relation", "Daughter");
  const [caregiverInitials, setCaregiverInitials] = useLocalStorage("cs_caregiver_initials", "FK");
  const [caregiverColor, setCaregiverColor] = useLocalStorage("cs_caregiver_color", "#E8304A");
  const [avatarInitials, setAvatarInitials] = useLocalStorage("cs_avatar_initials", "AU");
  const [avatarBgColor, setAvatarBgColor] = useLocalStorage("cs_avatar_bgcolor", "#5B8AF0");
  const [avatarUrl, setAvatarUrl] = useLocalStorage<string | null>("cs_avatar_url", null);

  const [alerts, setAlerts] = useLocalStorage<any[]>("cs_alert_history", []);

  const [baselineDate, setBaselineDate] = useLocalStorage("cs_baseline_date", "12 Feb 2026");
  const [baselineDays, setBaselineDays] = useLocalStorage("cs_baseline_days", "50 days");
  const [baselineRange, setBaselineRange] = useLocalStorage("cs_baseline_range", "58–74 BPM");

  const [sessions, setSessions] = useLocalStorage("cs_sessions", (() => {
    const ua = navigator.userAgent;
    let deviceName = "This browser";
    if (ua.includes("Chrome")) deviceName = "Chrome";
    else if (ua.includes("Firefox")) deviceName = "Firefox";
    else if (ua.includes("Safari")) deviceName = "Safari";
    else if (ua.includes("Edge")) deviceName = "Edge";
    if (ua.includes("Mobile")) deviceName += " — Mobile";
    else deviceName += " — Desktop";
    return [{ device: deviceName, last: "Active now", current: true }];
  })());

  const [dispatchAddress, setDispatchAddress] = useLocalStorage("cs_dispatch_address", "42/3 Dhanmondi, Road 7A, Dhaka 1205");
  const [dispatchPhone, setDispatchPhone] = useLocalStorage("cs_dispatch_phone", "+880 1712-345678");
  const [emergencyContacts, setEmergencyContacts] = useLocalStorage("cs_emergency_contacts", [
    { name: "Rehnuma", role: "Daughter · Primary", pri: 1, method: "Push + SMS + Call", time: "0s" },
    { name: "Rumi", role: "Son", pri: 2, method: "Push + SMS", time: "5s" },
    { name: "Jabed", role: "Spouse", pri: 3, method: "Push + SMS", time: "10s" },
  ]);

  // Modal Manager State
  const [activeModal, setActiveModal] = useState<{ title: string; content: React.ReactNode } | null>(null);

  const openModal = (title: string, content: React.ReactNode) => {
    if (!title && !content) {
      setActiveModal(null);
    } else {
      setActiveModal({ title, content });
    }
  };
  const closeModal = () => setActiveModal(null);

  const renderContent = () => {
    const props = {
      openModal,
      closeModal,
      phone, setPhone,
      email, setEmail,
      caregiverName, setCaregiverName,
      caregiverRelation, setCaregiverRelation,
      caregiverInitials, setCaregiverInitials,
      caregiverColor, setCaregiverColor,
      avatarInitials, setAvatarInitials,
      avatarBgColor, setAvatarBgColor,
      avatarUrl, setAvatarUrl,
      alerts, setAlerts,
      baselineDate, setBaselineDate,
      baselineDays, setBaselineDays,
      baselineRange, setBaselineRange,
      sessions, setSessions,
      dispatchAddress, setDispatchAddress,
      dispatchPhone, setDispatchPhone,
      emergencyContacts, setEmergencyContacts
    };

    switch (activeCategory) {
      case "profile": return <ProfileSection {...props} />;

      case "alerts": return <AlertsSection {...props} />;
      case "ai": return <AISection {...props} />;
      case "display": return <DisplaySection />;
      case "privacy": return <PrivacySection {...props} />;
      case "emergency": return <EmergencySection {...props} />;
      case "about": return <AboutSection {...props} />;
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

      {/* ── TABLET: Horizontal Category Tab Strip (768px - 1279px) ── */}
      <div className="hidden md:block xl:hidden overflow-x-auto whitespace-nowrap py-3 px-4 border-b" style={{ borderColor: c.divider, background: c.cardBg }}>
        <div className="flex gap-2">
          {items.map((item) => {
            const isActive = activeCategory === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border"
                style={{
                  background: isActive ? c.activeNavBg : "transparent",
                  borderColor: isActive ? c.navBorder : c.cardBorder,
                  fontFamily: "Syne, sans-serif",
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? c.text : c.secondary,
                  cursor: "pointer",
                }}
              >
                <item.icon size={15} style={{ color: isActive ? c.red : item.iconColor, flexShrink: 0 }} />
                <span>{item.label}</span>
                {item.badge && <span className="ml-1 scale-75 flex-shrink-0">{item.badge}</span>}
              </button>
            );
          })}
        </div>
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

      {/* ── GENERIC SETTINGS MODAL ── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl transition-all duration-300 border animate-scale-up"
            style={{
              background: c.cardBg,
              borderColor: c.cardBorder,
            }}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: c.divider }}>
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.text }}>{activeModal.title}</span>
              <button onClick={closeModal} style={{ color: c.secondary, background: "none", border: "none", cursor: "pointer" }} className="p-1 hover:opacity-80">
                <X size={18} />
              </button>
            </div>
            {/* Modal Content */}
            <div className="px-5 py-4 overflow-y-auto max-h-[75vh]">
              {activeModal.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
