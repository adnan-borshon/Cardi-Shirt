import { useState, useEffect, useRef } from "react";
import {
  Heart,
  TrendingUp,
  Activity,
  Shield,
  Wind,
  Gauge,
  Brain,
  AlertCircle,
  Droplet,
  Zap,
} from "lucide-react";
import { useTokens } from "./ThemeContext";
import { useLiveVitals } from "./useBackend";

export function VitalsRow() {
  const tk = useTokens();
  const { vitals, connected } = useLiveVitals();

  // Watchdog timer to check if hardware data is active
  const lastActiveRef = useRef<number>(Date.now());
  const [isHardwareActive, setIsHardwareActive] = useState(false);

  useEffect(() => {
    if (vitals) {
      lastActiveRef.current = Date.now();
      setIsHardwareActive(true);
    }
  }, [vitals]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastActiveRef.current > 4000) {
        setIsHardwareActive(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isActive = connected && isHardwareActive && vitals;

  // Server-computed clinical values — NO local math.
  // All values are pre-computed in Python DSP and received via WebSocket.
  // null = DSP unavailable or insufficient data for that metric.
  const bpm    = isActive ? Math.round(vitals.bpm) : 0;
  const temp   = isActive ? vitals.temp : 0;
  const spo2   = isActive && vitals.spo2 ? Math.round(vitals.spo2) : 0;

  const aiScore       = isActive ? (vitals.ai_health_score   ?? null) : null;
  const hrv           = isActive ? (vitals.hrv_rmssd          ?? null) : null;
  const breathingRate = isActive ? (vitals.breathing_rate     ?? null) : null;
  const stressIndex   = isActive ? (vitals.stress_index       ?? null) : null;
  const rPeakInterval = isActive ? (vitals.r_peak_interval_ms ?? null) : null;

  // Format ST float as "+0.12" or "-0.05" for display
  const stSegmentRaw = isActive ? (vitals.st_deviation_mv ?? null) : null;
  const stSegment    = stSegmentRaw !== null
    ? (stSegmentRaw >= 0 ? `+${stSegmentRaw.toFixed(2)}` : stSegmentRaw.toFixed(2))
    : null;

  // Define Cards
  const cards = [
    {
      label: "Heart Rate",
      value: isActive && bpm > 0 ? String(bpm) : "—",
      unit: "BPM",
      icon: Heart,
      accent: !isActive || bpm === 0 ? "#9AA0B8" : bpm > 100 || bpm < 50 ? "#E8304A" : "#27C28A",
      trendLabel: isActive ? "Live" : "Offline",
      detail: isActive ? `Updated just now` : "Awaiting hardware signal",
    },
    {
      label: "Body Temp",
      value: isActive && temp > 0 ? temp.toFixed(1) : "—",
      unit: "°C",
      icon: Activity,
      accent: !isActive || temp === 0 ? "#9AA0B8" : temp > 37.5 || temp < 35.5 ? "#E8304A" : "#27C28A",
      trendLabel: isActive ? "Live" : "Offline",
      detail: isActive ? "From shirt thermistor" : "Sensor offline",
    },
    {
      label: "SpO2",
      value: isActive && spo2 > 0 ? String(spo2) : "—",
      unit: "%",
      icon: Droplet,
      accent: !isActive || spo2 === 0 ? "#9AA0B8" : spo2 < 95 ? "#E8304A" : "#27C28A",
      trendLabel: isActive ? "Live" : "Offline",
      detail: isActive ? "Pulse Oximeter reading" : "Sensor offline",
    },
    {
      label: "AI Health Score",
      value: aiScore !== null ? String(aiScore) : "—",
      unit: "/100",
      icon: Shield,
      accent: aiScore === null ? "#9AA0B8" : aiScore >= 80 ? "#27C28A" : aiScore >= 50 ? "#F5A623" : "#E8304A",
      trendLabel: isActive ? "Dynamic" : "Offline",
      detail: isActive ? "Calculated by vitals check" : "Awaiting calibration",
    },
    {
      label: "HRV (RMSSD)",
      value: hrv !== null ? String(hrv) : "—",
      unit: "ms",
      icon: Activity,
      accent: hrv === null ? "#9AA0B8" : hrv >= 40 ? "#27C28A" : "#F5A623",
      trendLabel: isActive ? "Good variability" : "Offline",
      detail: isActive ? "RMSSD index" : "No active stream",
    },
    {
      label: "Breathing Rate",
      value: breathingRate !== null ? String(breathingRate) : "—",
      unit: "BPM",
      icon: Wind,
      accent: breathingRate === null ? "#9AA0B8" : "#5B8AF0",
      trendLabel: isActive ? "Normal" : "Offline",
      detail: isActive ? "ECG-amplitude derived" : "Sensor offline",
    },
    {
      label: "Stress Index",
      value: stressIndex !== null ? String(stressIndex) : "—",
      unit: "/100",
      icon: Brain,
      accent: stressIndex === null ? "#9AA0B8" : stressIndex < 35 ? "#27C28A" : stressIndex < 70 ? "#F5A623" : "#E8304A",
      trendLabel: isActive ? (stressIndex < 35 ? "Low stress" : stressIndex < 70 ? "Moderate stress" : "High stress") : "Offline",
      detail: isActive ? "Derived from HRV" : "Awaiting baseline",
    },
    {
      label: "ST Segment",
      value: stSegment !== null ? stSegment : "—",
      unit: "mV",
      icon: TrendingUp,
      accent: stSegment === null ? "#9AA0B8" : stSegment.includes("-") || Number(stSegment) > 0.3 ? "#E8304A" : "#27C28A",
      trendLabel: isActive ? "Stable range" : "Offline",
      detail: isActive ? "Lead II displacement" : "Lead offline",
    },
    {
      label: "R-Peak Interval",
      value: rPeakInterval !== null ? String(rPeakInterval) : "—",
      unit: "ms",
      icon: Zap,
      accent: rPeakInterval === null ? "#9AA0B8" : "#5B8AF0",
      trendLabel: isActive ? "Regular rhythm" : "Offline",
      detail: isActive ? "Interval consistency" : "Awaiting R-peaks",
    },
  ];

  // Prepend Emergency/Fall Alert if triggered
  if (isActive && vitals.fall_detected) {
    cards.unshift({
      label: "⚠ FALL DETECTED",
      value: "SOS",
      unit: "",
      icon: AlertCircle,
      accent: "#E8304A",
      trendLabel: "Emergency triggered",
      detail: `Fallen at ${new Date(vitals.timestamp).toLocaleTimeString()}`,
    });
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer"
          style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: c.accent }} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                {c.label}
              </span>
              <c.icon size={16} style={{ color: c.accent }} />
            </div>
            
            <div className="flex items-baseline gap-1">
              <span
                style={{
                  color: c.value === "—" ? tk.textMuted : tk.textPrimary,
                  fontFamily: "DM Mono, monospace",
                  fontSize: 26,
                  fontWeight: 500,
                }}
              >
                {c.value}
              </span>
              {c.value !== "—" && c.unit && (
                <span style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 13 }}>
                  {c.unit}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${isActive && c.value !== "—" ? "animate-pulse" : ""}`}
                style={{ background: c.accent }}
              />
              <span style={{ color: c.accent, fontFamily: "DM Mono, monospace", fontSize: 11 }}>
                {c.trendLabel}
              </span>
            </div>
            
            <div style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10, marginTop: 4 }}>
              {c.detail}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}