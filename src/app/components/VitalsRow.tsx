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

  // Moving average history states (last 5 calculations ~ 10 seconds of data)
  const [bpmHistory, setBpmHistory] = useState<number[]>([]);
  const [tempHistory, setTempHistory] = useState<number[]>([]);
  const [spo2History, setSpo2History] = useState<number[]>([]);
  const [aiHistory, setAiHistory] = useState<number[]>([]);
  const [hrvHistory, setHrvHistory] = useState<number[]>([]);
  const [brHistory, setBrHistory] = useState<number[]>([]);
  const [siHistory, setSiHistory] = useState<number[]>([]);
  const [stHistory, setStHistory] = useState<number[]>([]);
  const [rPeakHistory, setRPeakHistory] = useState<number[]>([]);

  useEffect(() => {
    if (vitals) {
      lastActiveRef.current = Date.now();
      setIsHardwareActive(true);
    }
  }, [vitals]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastActiveRef.current > 8000) {
        setIsHardwareActive(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isActive = connected && isHardwareActive && vitals;

  useEffect(() => {
    if (isActive && vitals) {
      const updateHistory = (
        val: number | null | undefined,
        setter: React.Dispatch<React.SetStateAction<number[]>>,
        allowZero = false
      ) => {
        if (val !== null && val !== undefined && !isNaN(val) && (allowZero || val !== 0)) {
          setter((prev) => {
            const next = [...prev, val];
            if (next.length > 5) return next.slice(-5);
            return next;
          });
        }
      };

      updateHistory(vitals.bpm, setBpmHistory);
      updateHistory(vitals.temp, setTempHistory);
      updateHistory(vitals.spo2, setSpo2History);
      updateHistory(vitals.ai_health_score, setAiHistory);
      updateHistory(vitals.hrv_rmssd, setHrvHistory);
      updateHistory(vitals.breathing_rate, setBrHistory);
      updateHistory(vitals.stress_index, setSiHistory);
      updateHistory(vitals.st_deviation_mv, setStHistory, true);
      updateHistory(vitals.r_peak_interval_ms, setRPeakHistory);
    } else {
      // Clear histories on disconnect
      setBpmHistory([]);
      setTempHistory([]);
      setSpo2History([]);
      setAiHistory([]);
      setHrvHistory([]);
      setBrHistory([]);
      setSiHistory([]);
      setStHistory([]);
      setRPeakHistory([]);
    }
  }, [vitals, isActive]);

  // Averaged display values
  const avgBpm = bpmHistory.length > 0 ? bpmHistory.reduce((a, b) => a + b, 0) / bpmHistory.length : 0;
  const avgTemp = tempHistory.length > 0 ? tempHistory.reduce((a, b) => a + b, 0) / tempHistory.length : 0;
  const avgSpo2 = spo2History.length > 0 ? spo2History.reduce((a, b) => a + b, 0) / spo2History.length : 0;
  const avgAi = aiHistory.length > 0 ? aiHistory.reduce((a, b) => a + b, 0) / aiHistory.length : null;
  const avgHrv = hrvHistory.length > 0 ? hrvHistory.reduce((a, b) => a + b, 0) / hrvHistory.length : null;
  const avgBr = brHistory.length > 0 ? brHistory.reduce((a, b) => a + b, 0) / brHistory.length : null;
  const avgSi = siHistory.length > 0 ? siHistory.reduce((a, b) => a + b, 0) / siHistory.length : null;
  const avgSt = stHistory.length > 0 ? stHistory.reduce((a, b) => a + b, 0) / stHistory.length : null;
  const avgRPeak = rPeakHistory.length > 0 ? rPeakHistory.reduce((a, b) => a + b, 0) / rPeakHistory.length : null;

  const getCardProps = (
    label: string,
    historyLen: number,
    displayVal: string,
    unit: string,
    icon: any,
    normalAccent: string | (() => string),
    normalTrendLabel: string,
    normalDetail: string,
    fallbackDetail: string
  ) => {
    if (!isActive) {
      return {
        label,
        value: "—",
        unit,
        icon,
        accent: "#9AA0B8",
        trendLabel: "Offline",
        detail: fallbackDetail,
      };
    }
    if (historyLen === 0) {
      return {
        label,
        value: "Calc...",
        unit: "",
        icon,
        accent: "#5B8AF0",
        trendLabel: "Calculating...",
        detail: "Processing raw signal...",
      };
    }
    const accentColor = typeof normalAccent === "function" ? normalAccent() : normalAccent;
    return {
      label,
      value: displayVal,
      unit,
      icon,
      accent: accentColor,
      trendLabel: normalTrendLabel,
      detail: normalDetail,
    };
  };

  const cards = [
    getCardProps(
      "Heart Rate",
      bpmHistory.length,
      String(Math.round(avgBpm)),
      "BPM",
      Heart,
      () => (avgBpm > 100 || avgBpm < 50 ? "#E8304A" : "#27C28A"),
      "Live",
      "Averaging last 10s of data",
      "Awaiting hardware signal"
    ),
    getCardProps(
      "Body Temp",
      tempHistory.length,
      avgTemp.toFixed(1),
      "°C",
      Activity,
      () => (avgTemp > 37.5 || avgTemp < 35.5 ? "#E8304A" : "#27C28A"),
      "Live",
      "From shirt thermistor",
      "Sensor offline"
    ),
    getCardProps(
      "SpO2",
      spo2History.length,
      String(Math.round(avgSpo2)),
      "%",
      Droplet,
      () => (avgSpo2 < 95 ? "#E8304A" : "#27C28A"),
      "Live",
      "Pulse Oximeter reading",
      "Sensor offline"
    ),
    getCardProps(
      "AI Health Score",
      aiHistory.length,
      avgAi !== null ? String(Math.round(avgAi)) : "—",
      "/100",
      Shield,
      () => (avgAi === null ? "#9AA0B8" : avgAi >= 80 ? "#27C28A" : avgAi >= 50 ? "#F5A623" : "#E8304A"),
      "Dynamic",
      "Calculated by vitals check",
      "Awaiting calibration"
    ),
    getCardProps(
      "HRV (RMSSD)",
      hrvHistory.length,
      avgHrv !== null ? String(Math.round(avgHrv)) : "—",
      "ms",
      Activity,
      () => (avgHrv === null ? "#9AA0B8" : avgHrv >= 40 ? "#27C28A" : "#F5A623"),
      "Good variability",
      "RMSSD index",
      "No active stream"
    ),
    getCardProps(
      "Breathing Rate",
      brHistory.length,
      avgBr !== null ? String(Math.round(avgBr)) : "—",
      "BPM",
      Wind,
      "#5B8AF0",
      "Normal",
      "ECG-amplitude derived",
      "Sensor offline"
    ),
    getCardProps(
      "Stress Index",
      siHistory.length,
      avgSi !== null ? String(Math.round(avgSi)) : "—",
      "/100",
      Brain,
      () => (avgSi === null ? "#9AA0B8" : avgSi < 35 ? "#27C28A" : avgSi < 70 ? "#F5A623" : "#E8304A"),
      avgSi !== null ? (avgSi < 35 ? "Low stress" : avgSi < 70 ? "Moderate stress" : "High stress") : "Offline",
      "Derived from HRV",
      "Awaiting baseline"
    ),
    getCardProps(
      "ST Segment",
      stHistory.length,
      avgSt !== null ? (avgSt >= 0 ? `+${avgSt.toFixed(2)}` : avgSt.toFixed(2)) : "—",
      "mV",
      TrendingUp,
      () => (avgSt === null ? "#9AA0B8" : avgSt < -0.05 || avgSt > 0.10 ? "#E8304A" : "#27C28A"),
      "Stable range",
      "Lead II displacement",
      "Lead offline"
    ),
    getCardProps(
      "R-Peak Interval",
      rPeakHistory.length,
      avgRPeak !== null ? String(Math.round(avgRPeak)) : "—",
      "ms",
      Zap,
      "#5B8AF0",
      "Regular rhythm",
      "Interval consistency",
      "Awaiting R-peaks"
    ),
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