import { Plus } from "lucide-react";
import { useTokens } from "./ThemeContext";

const family = [
  { name: "Rehnuma", initials: "R", online: true, lastSeen: "Viewing now", color: "#E8304A" },
  { name: "Rumi", initials: "R", online: true, lastSeen: "5 min ago", color: "#F5A623" },
  { name: "Jabed", initials: "J", online: false, lastSeen: "2h ago", color: "#27C28A" },
  { name: "DR. Rohan", initials: "DR", online: false, lastSeen: "Yesterday", color: "#8890B8" },
];

export function FamilyCircle() {
  const tk = useTokens();
  return (
    <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
      <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12, marginBottom: 12, display: "block" }}>Family Circle</span>
      <div className="flex items-center gap-5 overflow-x-auto pb-1">
        {family.map((f) => (
          <div key={f.name} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="relative">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: f.color, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 14 }}>{f.initials}</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: f.online ? "#27C28A" : tk.textMuted, borderColor: tk.cardBg }} />
            </div>
            <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>{f.name}</span>
            <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9 }}>{f.lastSeen}</span>
          </div>
        ))}
        <button className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-dashed" style={{ borderColor: tk.cardBorder, color: tk.textSecondary }}>
            <Plus size={18} />
          </div>
          <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>Add</span>
        </button>
      </div>
    </div>
  );
}
