import { useState } from "react";
import { MapPin, ChevronDown, ChevronUp, Phone, Navigation, Cross, Zap, Filter, Plus, Minus } from "lucide-react";
import { useTokens } from "./ThemeContext";

const hospitals = [
  { id: 1, name: "Dhaka Medical College Hospital", distance: "1.8 km", time: "~7 min", type: "government", badges: ["Cardiac ICU", "24h Emergency", "ECG Available"], phone: "+880-2-8626812" },
  { id: 2, name: "National Heart Foundation", distance: "3.2 km", time: "~12 min", type: "private", badges: ["Cardiac ICU", "24h Emergency"], phone: "+880-2-9116761" },
  { id: 3, name: "Square Hospital", distance: "4.1 km", time: "~15 min", type: "private", badges: ["Cardiac ICU", "ECG Available"], phone: "+880-2-8159457" },
];

export function MapPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<"all" | "hospitals" | "ambulance">("all");
  const [selectedFacility, setSelectedFacility] = useState<typeof hospitals[0] | null>(null);
  const tk = useTokens();

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: tk.cardBg, border: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
      <button className="flex items-center justify-between w-full px-4 py-3" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-2">
          <MapPin size={16} style={{ color: "#E8304A" }} />
          <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 14 }}>Emergency resources near you</span>
          <span className="px-2 py-0.5 rounded-full" style={{ background: tk.chipBg, color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 10 }}>Dhanmondi, Dhaka</span>
        </div>
        {collapsed ? <ChevronDown size={16} style={{ color: tk.textSecondary }} /> : <ChevronUp size={16} style={{ color: tk.textSecondary }} />}
      </button>

      {!collapsed && (
        <>
          <div className="flex items-center gap-2 px-4 py-2" style={{ borderTop: `0.5px solid ${tk.borderSubtle}` }}>
            <Filter size={12} style={{ color: tk.textMuted }} />
            {(["all", "hospitals", "ambulance"] as const).map((f) => (
              <button key={f} className="px-3 py-1 rounded-full transition-colors" style={{ background: filter === f ? "rgba(232,48,74,0.15)" : "transparent", color: filter === f ? "#E8304A" : tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 11, border: filter === f ? "none" : `0.5px solid ${tk.borderSubtle}` }} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative mx-4" style={{ height: 300, background: tk.mapBg, borderRadius: 12, overflow: "hidden" }}>
            <svg className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke={tk.mapGrid} strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapGrid)" />
              <line x1="0" y1="150" x2="100%" y2="150" stroke={tk.mapRoad} strokeWidth="3" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke={tk.mapRoad} strokeWidth="3" />
              <line x1="20%" y1="0" x2="80%" y2="100%" stroke={tk.mapGrid} strokeWidth="2" />
              <line x1="0" y1="80" x2="100%" y2="220" stroke={tk.mapGrid} strokeWidth="2" />
            </svg>

            <div className="absolute" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-[#E8304A] border-2 border-white z-10 relative" />
                <div className="absolute inset-0 w-4 h-4 rounded-full bg-[#E8304A] animate-ping opacity-40" />
                <div className="absolute rounded-full animate-pulse" style={{ width: 60, height: 60, top: -22, left: -22, background: "rgba(232,48,74,0.08)", border: "1px solid rgba(232,48,74,0.15)" }} />
              </div>
            </div>

            {(filter === "all" || filter === "hospitals") && (
              <>
                <button className="absolute flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-transform hover:scale-110" style={{ top: "30%", left: "35%", background: "#1A3A6E" }} onClick={() => setSelectedFacility(hospitals[0])}>
                  <Cross size={14} style={{ color: "#fff" }} />
                </button>
                <button className="absolute flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-transform hover:scale-110" style={{ top: "25%", left: "65%", background: "#1A6E6E" }} onClick={() => setSelectedFacility(hospitals[1])}>
                  <Cross size={14} style={{ color: "#fff" }} />
                </button>
                <button className="absolute flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-transform hover:scale-110" style={{ top: "65%", left: "70%", background: "#1A6E6E" }} onClick={() => setSelectedFacility(hospitals[2])}>
                  <Cross size={14} style={{ color: "#fff" }} />
                </button>
              </>
            )}

            {(filter === "all" || filter === "ambulance") && (
              <>
                <button className="absolute flex items-center justify-center w-7 h-7 rounded-full shadow-lg transition-transform hover:scale-110" style={{ top: "45%", left: "28%", background: "#E8304A" }}>
                  <Zap size={12} style={{ color: "#fff" }} />
                </button>
                <button className="absolute flex items-center justify-center w-7 h-7 rounded-full shadow-lg transition-transform hover:scale-110" style={{ top: "60%", left: "40%", background: "#666" }}>
                  <Phone size={10} style={{ color: "#fff" }} />
                </button>
              </>
            )}

            <div className="absolute bottom-3 right-3 flex flex-col gap-1">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tk.cardElevated, border: `0.5px solid ${tk.cardBorder}` }}>
                <Plus size={14} style={{ color: tk.textSecondary }} />
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tk.cardElevated, border: `0.5px solid ${tk.cardBorder}` }}>
                <Minus size={14} style={{ color: tk.textSecondary }} />
              </button>
            </div>

            <div className="absolute bottom-3 left-3 flex items-center gap-3 px-2.5 py-1.5 rounded-lg" style={{ background: tk.cardBg, border: `0.5px solid ${tk.cardBorder}`, opacity: 0.95 }}>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#1A3A6E]" /><span style={{ color: tk.textSecondary, fontSize: 9, fontFamily: "DM Mono, monospace" }}>Govt</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#1A6E6E]" /><span style={{ color: tk.textSecondary, fontSize: 9, fontFamily: "DM Mono, monospace" }}>Private</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#E8304A]" /><span style={{ color: tk.textSecondary, fontSize: 9, fontFamily: "DM Mono, monospace" }}>Integrated</span></div>
            </div>

            {selectedFacility && (
              <div className="absolute top-0 right-0 h-full p-4 overflow-y-auto" style={{ width: 260, background: tk.cardBg, borderLeft: `0.5px solid ${tk.cardBorder}`, opacity: 0.97 }}>
                <button className="mb-3" style={{ color: tk.textSecondary, fontSize: 11 }} onClick={() => setSelectedFacility(null)}>✕ Close</button>
                <h3 style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 15, marginBottom: 8 }}>{selectedFacility.name}</h3>
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 13 }}>{selectedFacility.distance}</span>
                  <span style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 12 }}>{selectedFacility.time}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedFacility.badges.map((b) => (
                    <span key={b} className="px-2 py-0.5 rounded-full" style={{ background: "rgba(39,194,138,0.1)", color: "#27C28A", fontFamily: "DM Mono, monospace", fontSize: 10 }}>{b}</span>
                  ))}
                </div>
                <a href={`tel:${selectedFacility.phone}`} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg mb-2" style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>
                  <Phone size={14} /> Call Now
                </a>
                <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg" style={{ background: tk.cardElevated, color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 13, border: `0.5px solid ${tk.cardBorder}` }}>
                  <Navigation size={14} /> Navigate
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex gap-3 px-4 py-3 overflow-x-auto">
        {hospitals.map((h) => (
          <div key={h.id} className="flex-shrink-0 p-3 rounded-lg cursor-pointer transition-colors" style={{ background: tk.chipBg, border: `0.5px solid ${tk.cardBorder}`, minWidth: 200 }} onClick={() => { setCollapsed(false); setSelectedFacility(h); }}>
            <div style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12, marginBottom: 4 }}>{h.name}</div>
            <div className="flex items-center gap-2">
              <span style={{ color: "#E8304A", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{h.distance}</span>
              <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 11 }}>{h.time}</span>
            </div>
            <a href={`tel:${h.phone}`} className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md w-fit" style={{ background: "rgba(232,48,74,0.1)", color: "#E8304A", fontFamily: "DM Mono, monospace", fontSize: 11 }} onClick={(e) => e.stopPropagation()}>
              <Phone size={12} /> Call
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
