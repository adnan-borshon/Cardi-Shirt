import { Sparkles, ArrowRight } from "lucide-react";
import { useTokens } from "./ThemeContext";

export function AISummaryCard() {
  const tk = useTokens();
  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{ background: tk.cardBg, border: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} style={{ color: tk.amber }} />
        <span style={{ color: tk.amber, fontFamily: "Syne, sans-serif", fontSize: 12 }}>Today's AI Summary</span>
        <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10, marginLeft: "auto" }}>3:42 PM</span>
      </div>
      <p style={{ color: tk.textPrimary, fontFamily: "'DM Serif Display', serif", fontSize: 15, lineHeight: 1.65 }}>
        This afternoon your heart has been steady and calm. Your resting heart rate has stayed within your
        personal normal range, and your HRV is trending upward — a sign that your body is recovering well.
        Your breathing rate is steady at 16 breaths per minute, your stress index shows low stress (24/100),
        and all ECG markers including ST segments, T waves, and R-peak intervals are within normal ranges.
        No anomalies have been detected today.
      </p>
      <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full" style={{ background: "rgba(232,48,74,0.1)", fontFamily: "DM Mono, monospace", fontSize: 10, color: "#E8304A" }}>
            CardiShirt AI v2.1
          </div>
          <div className="px-2 py-0.5 rounded-full" style={{ background: "rgba(39,194,138,0.1)", fontFamily: "DM Mono, monospace", fontSize: 10, color: "#27C28A" }}>
            96% confidence
          </div>
        </div>
        <button className="flex items-center gap-1 hover:gap-2 transition-all" style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
          See full diary entry <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}