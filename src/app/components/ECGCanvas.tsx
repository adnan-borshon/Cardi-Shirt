import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { useTokens } from "./ThemeContext";

// Base ECG template for Lead II (most prominent)
const ECG_TEMPLATE_LEAD_II = [
  0, 0, 0, 0, 0, 0.02, 0.04, 0.02, 0, -0.02, 0, 0, 0.05, 0.1, 0.15, 0.08,
  -0.05, -0.4, 1.0, -0.3, -0.1, 0.05, 0.1, 0.15, 0.2, 0.22, 0.2, 0.15, 0.1,
  0.05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

// Lead I template (moderate amplitude)
const ECG_TEMPLATE_LEAD_I = [
  0, 0, 0, 0, 0, 0.01, 0.03, 0.01, 0, -0.01, 0, 0, 0.04, 0.08, 0.12, 0.06,
  -0.03, -0.25, 0.7, -0.2, -0.08, 0.04, 0.08, 0.12, 0.15, 0.16, 0.15, 0.12, 0.08,
  0.04, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

// Lead III template (smaller amplitude, calculated based on II - I relationship)
const ECG_TEMPLATE_LEAD_III = [
  0, 0, 0, 0, 0, 0.01, 0.01, 0.01, 0, -0.01, 0, 0, 0.01, 0.02, 0.03, 0.02,
  -0.02, -0.15, 0.3, -0.1, -0.02, 0.01, 0.02, 0.03, 0.05, 0.06, 0.05, 0.03, 0.02,
  0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const LEAD_TEMPLATES = {
  "Lead I": ECG_TEMPLATE_LEAD_I,
  "Lead II": ECG_TEMPLATE_LEAD_II,
  "Lead III": ECG_TEMPLATE_LEAD_III,
};

export function ECGCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniCanvasRefs = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
  const offsetRef = useRef(0);
  const [lead, setLead] = useState<"Lead I" | "Lead II" | "Lead III">("Lead II");
  const [speed, setSpeed] = useState("25mm/s");
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const tk = useTokens();
  const tkRef = useRef(tk);
  tkRef.current = tk;

  const drawECG = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, color: string, glowColor: string, noiseLevel = 0, template: number[]) => {
      const tokens = tkRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = tokens.ecgBg;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = tokens.ecgGrid;
      ctx.lineWidth = 0.5;
      const gridSpacing = 20;
      for (let x = 0; x < w; x += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const baselineY = h * 0.55;
      const bandHeight = h * 0.12;
      ctx.fillStyle = tokens.cardiacRedGlow;
      ctx.fillRect(0, baselineY - bandHeight, w, bandHeight * 2);

      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();

      const templateLen = template.length;
      const yCenter = h * 0.55;
      const amplitude = h * 0.35;
      const pixelsPerSample = 3;

      for (let x = 0; x < w; x++) {
        const sampleIndex = (x + offsetRef.current) / pixelsPerSample;
        const idx = sampleIndex % templateLen;
        const floorIdx = Math.floor(idx);
        const frac = idx - floorIdx;
        const v0 = template[floorIdx % templateLen];
        const v1 = template[(floorIdx + 1) % templateLen];
        let val = v0 + (v1 - v0) * frac;
        val += (Math.random() - 0.5) * noiseLevel;
        const y = yCenter - val * amplitude;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
    []
  );

  useEffect(() => {
    let animId: number;
    const animate = () => {
      offsetRef.current += 1.5;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          ctx.scale(dpr, dpr);
          drawECG(ctx, w, h, "#E8304A", "rgba(232,48,74,0.25)", 0, LEAD_TEMPLATES[lead]);
        }
      }
      const miniColors = ["#E8304A", "#F5A623", "#27C28A"];
      const miniGlows = ["rgba(232,48,74,0.15)", "rgba(245,166,35,0.15)", "rgba(39,194,138,0.15)"];
      const miniTemplates = [ECG_TEMPLATE_LEAD_I, ECG_TEMPLATE_LEAD_II, ECG_TEMPLATE_LEAD_III];
      miniCanvasRefs.forEach((ref, i) => {
        const c = ref.current;
        if (c) {
          const ctx = c.getContext("2d");
          if (ctx) {
            const dpr = window.devicePixelRatio || 1;
            const w = c.clientWidth; const h = c.clientHeight;
            c.width = w * dpr; c.height = h * dpr;
            ctx.scale(dpr, dpr);
            drawECG(ctx, w, h, miniColors[i], miniGlows[i], 0.03, miniTemplates[i]);
          }
        }
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [drawECG, lead]);

  const leads: ("Lead I" | "Lead II" | "Lead III")[] = ["Lead I", "Lead II", "Lead III"];
  const miniLeads = ["Lead I", "Lead II", "Lead III"];

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: tk.ecgBg, border: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `0.5px solid ${tk.borderSubtle}`, background: tk.cardBg }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors"
              style={{ color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 13, background: "transparent" }}
              onClick={() => setShowLeadDropdown(!showLeadDropdown)}
            >
              {lead}
              <ChevronDown size={14} style={{ color: tk.textSecondary }} />
            </button>
            {showLeadDropdown && (
              <div className="absolute top-full left-0 mt-1 py-1 rounded-lg z-10 min-w-[120px]" style={{ background: tk.cardElevated, border: `0.5px solid ${tk.cardBorder}` }}>
                {leads.map((l) => (
                  <button key={l} className="block w-full text-left px-3 py-1.5 transition-colors" style={{ color: l === lead ? "#E8304A" : tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 12 }} onClick={() => { setLead(l); setShowLeadDropdown(false); }}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="px-2.5 py-1 rounded-md transition-colors" style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 12 }} onClick={() => setSpeed(speed === "25mm/s" ? "50mm/s" : "25mm/s")}>
            {speed}
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: "rgba(232,48,74,0.1)", color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 12 }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#E8304A] animate-pulse" />
          Normal sinus rhythm
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full" style={{ height: 220 }} />
      <div className="grid grid-cols-3 gap-px" style={{ background: tk.borderSubtle }}>
        {miniLeads.map((ml, i) => (
          <div key={ml} className="px-3 py-1.5" style={{ background: tk.ecgBg }}>
            <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>{ml}</span>
            <canvas ref={miniCanvasRefs[i]} className="w-full" style={{ height: 40 }} />
          </div>
        ))}
      </div>
    </div>
  );
}