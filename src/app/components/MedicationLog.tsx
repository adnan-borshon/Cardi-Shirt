import { useState } from "react";
import { Pill, Check } from "lucide-react";
import { useTokens } from "./ThemeContext";

const medications = [
  { name: "Metoprolol 25mg", slots: { morning: true, noon: false, evening: false } },
  { name: "Aspirin 75mg", slots: { morning: true, noon: false, evening: false } },
  { name: "Atorvastatin 10mg", slots: { morning: false, noon: false, evening: false } },
];

type Slot = "morning" | "noon" | "evening";

export function MedicationLog() {
  const [meds, setMeds] = useState(medications);
  const tk = useTokens();

  const toggle = (idx: number, slot: Slot) => {
    setMeds((prev) => prev.map((m, i) => i === idx ? { ...m, slots: { ...m.slots, [slot]: !m.slots[slot] } } : m));
  };

  return (
    <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
      <div className="flex items-center gap-2 mb-3">
        <Pill size={14} style={{ color: tk.textSecondary }} />
        <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>Medication Log</span>
      </div>
      <div className="space-y-2">
        {meds.map((m, idx) => (
          <div key={m.name} className="flex items-center justify-between">
            <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12, flex: 1 }}>{m.name}</span>
            <div className="flex gap-2">
              {(["morning", "noon", "evening"] as Slot[]).map((slot) => (
                <button key={slot} onClick={() => toggle(idx, slot)} className="w-7 h-7 rounded-md flex items-center justify-center transition-colors" style={{ background: m.slots[slot] ? "rgba(39,194,138,0.2)" : tk.chipBg, border: `0.5px solid ${m.slots[slot] ? "rgba(39,194,138,0.4)" : tk.cardBorder}` }} title={slot}>
                  {m.slots[slot] ? <Check size={12} style={{ color: "#27C28A" }} /> : <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 8 }}>{slot[0].toUpperCase()}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
