import { Heart, TrendingUp, Activity, Shield, Wind, Gauge, Brain, AlertCircle, TrendingDown, Zap } from "lucide-react";
import { useTokens } from "./ThemeContext";

const vitals = [
  { label: "Heart Rate", value: "72", unit: "BPM", icon: Heart, accent: "#E8304A", trendLabel: "Stable", detail: "+0 from 10m ago" },
  { label: "AI Health Score", value: "87", unit: "/100", icon: Shield, accent: "#27C28A", trendLabel: "+3 from yesterday", detail: "Tap to expand" },
  { label: "HRV", value: "42", unit: "ms", icon: Activity, accent: "#27C28A", trendLabel: "Good variability", detail: "Improving trend" },
  { label: "Breathing Rate", value: "16", unit: "BPM", icon: Wind, accent: "#5B8AF0", trendLabel: "Normal", detail: "Calm & steady" },
  { label: "T Wave Status", value: "Normal", unit: "", icon: TrendingUp, accent: "#27C28A", trendLabel: "No inversion", detail: "All leads upright" },
  { label: "Strain Level", value: "Low", unit: "", icon: Gauge, accent: "#27C28A", trendLabel: "Minimal exertion", detail: "Below 30% max" },
  { label: "Stress Index", value: "24", unit: "/100", icon: Brain, accent: "#27C28A", trendLabel: "Low stress", detail: "Well recovered" },
  { label: "ST Segment", value: "+0.2", unit: "mV", icon: TrendingUp, accent: "#27C28A", trendLabel: "Normal range", detail: "No deviation" },
  { label: "R-Peak Interval", value: "834", unit: "ms", icon: Zap, accent: "#5B8AF0", trendLabel: "Regular", detail: "Consistent timing" },
];

export function VitalsRow() {
  const tk = useTokens();
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {vitals.map((v) => (
        <div
          key={v.label}
          className="rounded-xl relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
          style={{ background: tk.cardBg, boxShadow: tk.shadow }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: v.accent }} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>{v.label}</span>
              <v.icon size={16} style={{ color: v.accent }} />
            </div>
            <div className="flex items-baseline gap-1">
              <span style={{ color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 28 }}>{v.value}</span>
              <span style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 13 }}>{v.unit}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: v.accent }} />
              <span style={{ color: v.accent, fontFamily: "DM Mono, monospace", fontSize: 11 }}>{v.trendLabel}</span>
            </div>
            <div style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10, marginTop: 4 }}>{v.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}