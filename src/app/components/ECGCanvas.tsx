import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDown, Radio } from "lucide-react";
import { useTokens } from "./ThemeContext";
import { useLiveVitals } from "./useBackend";

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

// Lead III template (smaller amplitude)
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
  const { vitals, connected } = useLiveVitals();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniCanvasRefs = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
  
  // Buffers for real-time ESP32 data ingestion
  const ecgDataBuffer = useRef<number[]>([]);
  const drawPointerRef = useRef(0);
  const offsetRef = useRef(0); // For fallback simulation

  // Watchdog timer to detect active hardware transmissions
  const lastActiveRef = useRef<number>(Date.now());
  const [isHardwareActive, setIsHardwareActive] = useState(false);

  const [lead, setLead] = useState<"Lead I" | "Lead II" | "Lead III">("Lead II");
  const [speed, setSpeed] = useState("25mm/s");
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);

  const tk = useTokens();
  const tkRef = useRef(tk);
  tkRef.current = tk;

  // Track vital incoming timestamp updates
  useEffect(() => {
    if (vitals) {
      lastActiveRef.current = Date.now();
      setIsHardwareActive(true);

      // Append new ECG values to the buffer
      if (vitals.ecg_array && vitals.ecg_array.length > 0) {
        ecgDataBuffer.current = [...ecgDataBuffer.current, ...vitals.ecg_array];
        // Bounded circular buffer size to avoid memory growth
        if (ecgDataBuffer.current.length > 2000) {
          ecgDataBuffer.current = ecgDataBuffer.current.slice(-2000);
        }
      }
    }
  }, [vitals]);

  // Check hardware transmission status every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastActiveRef.current > 8000) {
        setIsHardwareActive(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isActiveConnection = connected && isHardwareActive;

  const drawECG = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      color: string,
      glowColor: string,
      noiseLevel = 0,
      currentLead: "Lead I" | "Lead II" | "Lead III",
      isMini = false
    ) => {
      const tokens = tkRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = tokens.ecgBg;
      ctx.fillRect(0, 0, w, h);

      // Draw Grid Lines
      ctx.strokeStyle = tokens.ecgGrid;
      ctx.lineWidth = 0.5;
      const gridSpacing = 20;
      for (let x = 0; x < w; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const baselineY = h * 0.55;
      const bandHeight = h * 0.12;

      // Glow Band
      ctx.fillStyle = tokens.cardiacRedGlow;
      ctx.fillRect(0, baselineY - bandHeight, w, bandHeight * 2);

      // Signal Draw Style
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isMini ? 0 : 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = isMini ? 1.0 : 1.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();

      const pixelsPerSample = speed === "50mm/s" ? 5 : 3;
      const numSamples = Math.ceil(w / pixelsPerSample);

      if (isActiveConnection && ecgDataBuffer.current.length > 0) {
        // --- Live WebSocket Data Rendering ---
        const buffer = ecgDataBuffer.current;
        const bufferLen = buffer.length;
        const currentPointer = Math.floor(drawPointerRef.current);

        // Extract window of samples
        const samples: number[] = [];
        for (let i = 0; i < numSamples; i++) {
          const idx = currentPointer - numSamples + i;
          if (idx >= 0 && idx < bufferLen) {
            samples.push(buffer[idx]);
          } else {
            samples.push(0);
          }
        }

        // Auto-Scale Gain Control (AGC) to dynamically center signal
        let minVal = Infinity;
        let maxVal = -Infinity;
        for (let i = 0; i < samples.length; i++) {
          const v = samples[i];
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
        }
        const range = maxVal - minVal;

        const yCenter = h * 0.55;
        const amplitude = h * 0.35;

        for (let x = 0; x < w; x++) {
          const sampleFloat = x / pixelsPerSample;
          const idx0 = Math.floor(sampleFloat);
          const idx1 = Math.min(samples.length - 1, idx0 + 1);
          const t = sampleFloat - idx0;

          const val0 = samples[idx0] ?? 0;
          const val1 = samples[idx1] ?? 0;
          const rawVal = val0 + (val1 - val0) * t;

          let val = 0;
          if (range > 10) {
            // Raw ADC integer values
            const norm = (rawVal - minVal) / range;
            val = -0.4 + norm * 1.4;
          } else if (range > 0.05) {
            // Already scaled decimal values
            const norm = (rawVal - minVal) / range;
            val = -0.4 + norm * 1.4;
          } else {
            // Flatline
            val = (Math.random() - 0.5) * 0.02;
          }

          // Apply relative Lead coefficients
          let leadCoef = 1.0;
          if (currentLead === "Lead I") leadCoef = 0.7;
          else if (currentLead === "Lead III") leadCoef = 0.3;

          const y = yCenter - (val * leadCoef) * amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      } else {
        // --- Offline Flatline Simulation ---
        const template = LEAD_TEMPLATES[currentLead];
        const templateLen = template.length;
        const yCenter = h * 0.55;
        const amplitude = h * 0.35;

        for (let x = 0; x < w; x++) {
          // Subtle baseline jitter to make it look like a disconnected lead, not just static SVG
          const noise = (Math.random() - 0.5) * noiseLevel;
          const y = yCenter - noise * amplitude;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    },
    [isActiveConnection, speed]
  );

  useEffect(() => {
    let animId: number;
    const animate = () => {
      // 1. Advance playback pointer for live buffer
      if (isActiveConnection) {
        const bufferSize = ecgDataBuffer.current.length;
        const currentPointer = drawPointerRef.current;
        const lag = bufferSize - currentPointer;

        // Proportional feedback controller to adjust step rate dynamically
        const targetLag = 50; // Keep target buffer delay around 2 seconds of data (50 samples at 25Hz)
        let step = 0.4167 + (lag - targetLag) * 0.01; // Base step is 25Hz / 60fps = 0.4167
        step = Math.max(0.08, Math.min(2.0, step));

        if (bufferSize > 0) {
          drawPointerRef.current = Math.min(bufferSize, drawPointerRef.current + step);
        }
      } else {
        // Slow rotation offset for fallback/noise states
        offsetRef.current += 1.5;
      }

      // 2. Draw Main Canvas
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
          drawECG(ctx, w, h, "#E8304A", "rgba(232,48,74,0.25)", 0.015, lead, false);
        }
      }

      // 3. Draw Mini Lead Canvases
      const miniColors = ["#E8304A", "#F5A623", "#27C28A"];
      const miniGlows = ["rgba(232,48,74,0.15)", "rgba(245,166,35,0.15)", "rgba(39,194,138,0.15)"];
      const miniLeads: ("Lead I" | "Lead II" | "Lead III")[] = ["Lead I", "Lead II", "Lead III"];
      
      miniCanvasRefs.forEach((ref, i) => {
        const c = ref.current;
        if (c) {
          const ctx = c.getContext("2d");
          if (ctx) {
            const dpr = window.devicePixelRatio || 1;
            const w = c.clientWidth;
            const h = c.clientHeight;
            c.width = w * dpr;
            c.height = h * dpr;
            ctx.scale(dpr, dpr);
            drawECG(ctx, w, h, miniColors[i], miniGlows[i], 0.01, miniLeads[i], true);
          }
        }
      });

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [drawECG, lead, isActiveConnection]);

  const leads: ("Lead I" | "Lead II" | "Lead III")[] = ["Lead I", "Lead II", "Lead III"];
  const miniLeads = ["Lead I", "Lead II", "Lead III"];

  // Dynamic status text for UI
  const getStatusDisplay = () => {
    if (!isActiveConnection) {
      return {
        text: "Offline - Shirt Disconnected",
        bg: "rgba(107, 116, 153, 0.1)",
        color: tk.textSecondary,
        pulse: false
      };
    }
    const bpm = vitals?.bpm ?? 0;
    if (bpm === 0) {
      return {
        text: "Calculating Vitals...",
        bg: "rgba(91, 138, 240, 0.1)",
        color: "#5B8AF0",
        pulse: true
      };
    }
    if (bpm > 100) {
      return {
        text: `Tachycardia detected - ${bpm} BPM`,
        bg: "rgba(232, 48, 74, 0.1)",
        color: "#E8304A",
        pulse: true
      };
    }
    if (bpm < 50) {
      return {
        text: `Bradycardia detected - ${bpm} BPM`,
        bg: "rgba(245, 166, 35, 0.1)",
        color: "#F5A623",
        pulse: true
      };
    }
    return {
      text: "Live - Normal sinus rhythm",
      bg: "rgba(39, 194, 138, 0.1)",
      color: "#27C28A",
      pulse: true
    };
  };

  const status = getStatusDisplay();

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: tk.ecgBg, border: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `0.5px solid ${tk.borderSubtle}`, background: tk.cardBg }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 13, background: "transparent" }}
              onClick={() => setShowLeadDropdown(!showLeadDropdown)}
            >
              {lead}
              <ChevronDown size={14} style={{ color: tk.textSecondary }} />
            </button>
            {showLeadDropdown && (
              <div className="absolute top-full left-0 mt-1 py-1 rounded-lg z-20 min-w-[120px]" style={{ background: tk.cardElevated, border: `0.5px solid ${tk.cardBorder}`, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                {leads.map((l) => (
                  <button
                    key={l}
                    className="block w-full text-left px-3 py-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: l === lead ? "#E8304A" : tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 12 }}
                    onClick={() => {
                      setLead(l);
                      setShowLeadDropdown(false);
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="px-2.5 py-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 12 }}
            onClick={() => setSpeed(speed === "25mm/s" ? "50mm/s" : "25mm/s")}
          >
            {speed}
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-300" style={{ background: status.bg, color: status.color, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
          {status.pulse && (
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: status.color }} />
          )}
          {!status.pulse && (
            <Radio size={12} style={{ color: status.color }} />
          )}
          {status.text}
        </div>
      </div>
      
      {/* Canvas Wrap with Overlay */}
      <div className="relative w-full overflow-hidden" style={{ height: 220, background: tk.ecgBg }}>
        <canvas ref={canvasRef} className="w-full h-full" />
        
        {/* Hardware Disconnected Blur Overlay */}
        {!isActiveConnection && (
          <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[1.5px] bg-black/35 transition-all duration-500">
            <div className="px-5 py-4 rounded-xl border border-red-500/20 bg-black/75 text-center max-w-[300px] shadow-2xl animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-red-500 font-semibold text-sm tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Device Disconnected
              </div>
              <div className="text-gray-400 text-[11px] mt-2 font-mono leading-relaxed">
                Awaiting real-time ESP32 bluetooth/WiFi sensor ingestion. Check hardware power status.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-px" style={{ background: tk.borderSubtle }}>
        {miniLeads.map((ml, i) => (
          <div key={ml} className="px-3 py-2 relative" style={{ background: tk.ecgBg }}>
            <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10, display: "block", marginBottom: 2 }}>{ml}</span>
            <canvas ref={miniCanvasRefs[i]} className="w-full" style={{ height: 40 }} />
            {!isActiveConnection && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}