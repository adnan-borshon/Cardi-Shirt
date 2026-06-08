import { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowRight, Loader2, Activity, ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTokens } from "./ThemeContext";
import { useLiveVitals, LiveVitals } from "./useBackend";
import { useNavigate } from "react-router";

function parseInlineStyles(text: string, tk: any) {
  if (!text) return "";
  const parts = text.split("**");
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return (
        <strong key={idx} style={{ color: tk.textPrimary, fontWeight: 700 }}>
          {part}
        </strong>
      );
    }
    return part;
  });
}

function getRealtimeSummaryText(vitals: LiveVitals | null, connected: boolean): string {
  if (!connected) {
    return "Your CardiShirt is currently **disconnected**. Please connect your device to view your real-time health summary.";
  }
  if (!vitals || (vitals.bpm === 0 && !vitals.spo2)) {
    return "Waiting for **CardiShirt sensor connection**. Put on the shirt and connect your device to see your real-time health analysis.";
  }

  const { bpm, temp, fall_detected, spo2 = 98, hrv_rmssd = 40, st_deviation_mv, breathing_rate = 16, stress_index = 25 } = vitals;

  // 1. Fall Detected
  if (fall_detected) {
    return "Alert: A **fall has been detected**. Please remain still if you are hurt. We are immediately reaching out to your emergency contacts to ensure you are safe.";
  }

  // 2. High-Risk ECG (ST elevation/depression)
  if (st_deviation_mv !== undefined && st_deviation_mv !== null) {
    if (st_deviation_mv > 0.2) {
      return "Notice: Significant **ST segment elevation** has been detected. Please sit down immediately, rest, and contact emergency assistance or your doctor.";
    }
    if (st_deviation_mv < -0.1) {
      return "Notice: **ST segment depression** has been detected, indicating potential reduced cardiac oxygen flow. Please rest and consult your physician.";
    }
  }

  // 3. Status messages based on combinations
  const criticalList: string[] = [];
  const warningList: string[] = [];

  // Heart Rate status
  if (bpm > 120) {
    criticalList.push("**high heart rate**");
  } else if (bpm > 100) {
    warningList.push("**slightly elevated heart rate**");
  } else if (bpm < 50 && bpm > 0) {
    warningList.push("**slower resting heart rate**");
  }

  // SpO2 status
  if (spo2 !== undefined && spo2 !== null && spo2 > 0) {
    if (spo2 < 90) {
      criticalList.push("**low blood oxygen**");
    } else if (spo2 < 95) {
      warningList.push("**slightly low oxygen levels**");
    }
  }

  // Stress Index status
  if (stress_index !== undefined && stress_index !== null) {
    if (stress_index > 150) {
      criticalList.push("**high physiological stress**");
    } else if (stress_index > 50) {
      warningList.push("**moderate stress levels**");
    }
  }

  // Breathing Rate status
  if (breathing_rate !== undefined && breathing_rate !== null) {
    if (breathing_rate > 20) {
      warningList.push("**rapid breathing**");
    } else if (breathing_rate < 12) {
      warningList.push("**slow breathing**");
    }
  }

  // Temperature status
  if (temp > 38.0) {
    criticalList.push("**elevated body temperature**");
  } else if (temp > 0 && temp < 35.0) {
    criticalList.push("**low body temperature**");
  }

  // 4. Build narrative output
  if (criticalList.length > 0) {
    const listText = criticalList.join(" and ");
    return `We noticed ${listText} right now. Your current heart rate is **${bpm} BPM**, oxygen level is **${spo2}%**, and temperature is **${temp}°C**. Please sit down, rest, and try to take slow, calming breaths. We recommend letting a caregiver know how you feel.`;
  }

  if (warningList.length > 0) {
    const listText = warningList.join(" and ");
    return `Your heart is stable, though we notice ${listText}. Your heart rate is **${bpm} BPM**, oxygen level is **${spo2}%**, and breathing is at **${breathing_rate} breaths/min**. Consider taking a short break, getting some fresh air, or drinking water to help your body recover.`;
  }

  // 5. Normal / stable vitals
  const hour = new Date().getHours();
  let timeGreeting = "This morning";
  if (hour >= 12 && hour < 17) timeGreeting = "This afternoon";
  else if (hour >= 17 || hour < 5) timeGreeting = "This evening";

  let hrvRemark = "excellent cardiovascular stability";
  if (hrv_rmssd !== undefined && hrv_rmssd !== null && hrv_rmssd > 45) {
    hrvRemark = "high heart rate variability, which is a great sign of recovery";
  }

  return `${timeGreeting}, your heart rate is steady and calm at **${bpm} BPM**, indicating ${hrvRemark}. With an optimal blood oxygen level of **${spo2}%**, steady breathing at **${breathing_rate} breaths/min**, and low physiological stress (index: **${stress_index}**), your body is in a healthy, restorative rhythm.`;
}

export function AISummaryCard() {
  const tk = useTokens();
  const navigate = useNavigate();
  const { vitals, connected } = useLiveVitals();

  const vitalsHistoryRef = useRef<LiveVitals[]>([]);
  const [displaySummary, setDisplaySummary] = useState<string>("");
  const [averagedVitals, setAveragedVitals] = useState<LiveVitals | null>(null);
  const lastUpdatedRef = useRef<number>(0);

  // 1. Maintain sliding window of vitals for smoothing
  useEffect(() => {
    if (!connected || !vitals) {
      vitalsHistoryRef.current = [];
      setAveragedVitals(null);
    } else {
      const history = vitalsHistoryRef.current;
      const last = history[history.length - 1];

      // Reset history if simulation status or type changes to avoid mixing baseline data
      if (
        last &&
        (last.simulation_type !== vitals.simulation_type ||
          last.simulation_active !== vitals.simulation_active)
      ) {
        vitalsHistoryRef.current = [];
      }

      vitalsHistoryRef.current.push(vitals);
      // Keep last 20 samples (approx. 10s of data at 500ms intervals)
      if (vitalsHistoryRef.current.length > 20) {
        vitalsHistoryRef.current.shift();
      }

      // Calculate averages from sliding window
      const currentHistory = vitalsHistoryRef.current;
      const len = currentHistory.length;

      const sum = {
        bpm: 0,
        temp: 0,
        spo2: 0,
        hrv_rmssd: 0,
        st_deviation_mv: 0,
        breathing_rate: 0,
        stress_index: 0,
        fall_detected_count: 0,
        spo2_count: 0,
        hrv_count: 0,
        st_count: 0,
        breathing_count: 0,
        stress_count: 0,
      };

      currentHistory.forEach((v) => {
        sum.bpm += v.bpm;
        sum.temp += v.temp;
        if (v.fall_detected) sum.fall_detected_count++;
        if (v.spo2 !== undefined && v.spo2 !== null && v.spo2 > 0) {
          sum.spo2 += v.spo2;
          sum.spo2_count++;
        }
        if (v.hrv_rmssd !== undefined && v.hrv_rmssd !== null) {
          sum.hrv_rmssd += v.hrv_rmssd;
          sum.hrv_count++;
        }
        if (v.st_deviation_mv !== undefined && v.st_deviation_mv !== null) {
          sum.st_deviation_mv += v.st_deviation_mv;
          sum.st_count++;
        }
        if (v.breathing_rate !== undefined && v.breathing_rate !== null) {
          sum.breathing_rate += v.breathing_rate;
          sum.breathing_count++;
        }
        if (v.stress_index !== undefined && v.stress_index !== null) {
          sum.stress_index += v.stress_index;
          sum.stress_count++;
        }
      });

      const avgVitals: LiveVitals = {
        bpm: Math.round(sum.bpm / len),
        temp: parseFloat((sum.temp / len).toFixed(1)),
        fall_detected: sum.fall_detected_count > 0,
        spo2: sum.spo2_count > 0 ? Math.round(sum.spo2 / sum.spo2_count) : vitals.spo2 ?? 98,
        hrv_rmssd: sum.hrv_count > 0 ? Math.round(sum.hrv_rmssd / sum.hrv_count) : vitals.hrv_rmssd ?? 40,
        st_deviation_mv: sum.st_count > 0 ? parseFloat((sum.st_deviation_mv / sum.st_count).toFixed(3)) : vitals.st_deviation_mv ?? 0.0,
        breathing_rate: sum.breathing_count > 0 ? Math.round(sum.breathing_rate / sum.breathing_count) : vitals.breathing_rate ?? 16,
        stress_index: sum.stress_count > 0 ? Math.round(sum.stress_index / sum.stress_count) : vitals.stress_index ?? 25,
        timestamp: vitals.timestamp,
        simulation_active: vitals.simulation_active,
        simulation_type: vitals.simulation_type,
      };

      setAveragedVitals(avgVitals);
    }
  }, [vitals, connected]);

  // 2. Throttled update of summary narrative text, with immediate bypass for critical events
  useEffect(() => {
    if (!connected) {
      setDisplaySummary(getRealtimeSummaryText(null, false));
      lastUpdatedRef.current = 0;
      return;
    }
    if (!vitals || (vitals.bpm === 0 && !vitals.spo2)) {
      setDisplaySummary(getRealtimeSummaryText(vitals, true));
      lastUpdatedRef.current = 0;
      return;
    }

    // Check for critical/emergency events that bypass any throttle delay
    const isCriticalBypass =
      vitals.fall_detected ||
      (vitals.st_deviation_mv !== undefined &&
        vitals.st_deviation_mv !== null &&
        (vitals.st_deviation_mv > 0.2 || vitals.st_deviation_mv < -0.1)) ||
      vitals.bpm > 120 ||
      (vitals.bpm < 40 && vitals.bpm > 0) ||
      (vitals.spo2 !== undefined && vitals.spo2 !== null && vitals.spo2 > 0 && vitals.spo2 < 90);

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdatedRef.current;

    // Use averaged/smoothed vitals for the summary calculation to prevent flickering, 
    // unless it is an active critical event in the raw vitals.
    const vitalsToUse = isCriticalBypass ? vitals : (averagedVitals || vitals);

    if (
      isCriticalBypass ||
      timeSinceLastUpdate >= 10000 ||
      !displaySummary ||
      displaySummary.startsWith("Waiting") ||
      displaySummary.startsWith("Your CardiShirt")
    ) {
      setDisplaySummary(getRealtimeSummaryText(vitalsToUse, true));
      lastUpdatedRef.current = now;
    }
  }, [vitals, connected, averagedVitals, displaySummary]);

  const time = vitals ? new Date(vitals.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live";
  const hasData = !!(vitals && vitals.bpm > 0);

  // Use a slightly warmer card background as requested by design briefs: a hint of deep blue rather than pure charcoal.
  // For dark mode: rgba(28, 38, 57, 0.4), for light mode: #F0F4FF or similar
  const isDark = tk.cardBg.includes("1d") || tk.cardBg.includes("11") || tk.cardBg.includes("16") || tk.cardBg.includes("rgba");
  const warmerCardBg = isDark ? "rgba(28, 38, 57, 0.45)" : "#F0F4FF";

  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden transition-all duration-300"
      style={{
        background: warmerCardBg,
        border: `0.5px solid ${isDark ? "rgba(74, 114, 189, 0.2)" : "#D3E0FF"}`,
        boxShadow: tk.shadow
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} style={{ color: tk.amber }} />
        <span style={{ color: tk.amber, fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 600 }}>
          {!connected ? "CardiShirt Connection" : !hasData ? "Awaiting Sensor Stream" : "Today's AI Summary"}
        </span>
        <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10, marginLeft: "auto" }}>{time}</span>
      </div>

      <p style={{ color: tk.textPrimary, fontFamily: "'DM Serif Display', serif", fontSize: 16, lineHeight: 1.65, letterSpacing: "0.01em" }}>
        {parseInlineStyles(displaySummary, tk)}
      </p>

      {/* Structured Stats Grid showcasing smoothed averages */}
      {hasData && averagedVitals && (
        <div 
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-2 p-3 rounded-lg transition-all" 
          style={{ 
            background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)", 
            border: `0.5px solid ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"}` 
          }}
        >
          <div className="flex flex-col">
            <span style={{ color: tk.textSecondary, fontSize: 10, fontFamily: "Syne, sans-serif", fontWeight: 500 }}>HR (AVG)</span>
            <span style={{ color: tk.textPrimary, fontSize: 16, fontWeight: 700, fontFamily: "DM Mono, monospace" }}>
              {averagedVitals.bpm} <span style={{ fontSize: 10, color: tk.textSecondary, fontWeight: 400 }}>BPM</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span style={{ color: tk.textSecondary, fontSize: 10, fontFamily: "Syne, sans-serif", fontWeight: 500 }}>SPO2 (AVG)</span>
            <span style={{ color: tk.textPrimary, fontSize: 16, fontWeight: 700, fontFamily: "DM Mono, monospace" }}>
              {averagedVitals.spo2 ?? "--"} <span style={{ fontSize: 10, color: tk.textSecondary, fontWeight: 400 }}>%</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span style={{ color: tk.textSecondary, fontSize: 10, fontFamily: "Syne, sans-serif", fontWeight: 500 }}>RESPIRATION (AVG)</span>
            <span style={{ color: tk.textPrimary, fontSize: 16, fontWeight: 700, fontFamily: "DM Mono, monospace" }}>
              {averagedVitals.breathing_rate ?? "--"} <span style={{ fontSize: 10, color: tk.textSecondary, fontWeight: 400 }}>/min</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span style={{ color: tk.textSecondary, fontSize: 10, fontFamily: "Syne, sans-serif", fontWeight: 500 }}>ST DEVIATION (AVG)</span>
            <span 
              style={{ 
                color: averagedVitals.st_deviation_mv && (averagedVitals.st_deviation_mv > 0.2 || averagedVitals.st_deviation_mv < -0.1) ? tk.cardiacRed : tk.textPrimary, 
                fontSize: 16, 
                fontWeight: 700, 
                fontFamily: "DM Mono, monospace" 
              }}
            >
              {averagedVitals.st_deviation_mv !== undefined && averagedVitals.st_deviation_mv !== null 
                ? `${averagedVitals.st_deviation_mv > 0 ? "+" : ""}${averagedVitals.st_deviation_mv.toFixed(2)}` 
                : "--"
              } <span style={{ fontSize: 10, color: tk.textSecondary, fontWeight: 400 }}>mV</span>
            </span>
          </div>
        </div>
      )}

      {/* MIT-BIH Clinical Diagnostic Verdict Section */}
      {hasData && (
        <div 
          className="mt-4 p-4 rounded-lg transition-all duration-300" 
          style={{ 
            background: isDark ? "rgba(20, 24, 40, 0.6)" : "rgba(255, 255, 255, 0.5)",
            border: `1px dashed ${
              vitals?.clinical_verdict?.severity === "critical"
                ? "rgba(232, 48, 74, 0.3)"
                : vitals?.clinical_verdict?.severity === "warning"
                ? "rgba(245, 166, 35, 0.3)"
                : "rgba(39, 194, 138, 0.2)"
            }`,
            borderLeft: `4px solid ${
              vitals?.clinical_verdict?.severity === "critical"
                ? tk.cardiacRed
                : vitals?.clinical_verdict?.severity === "warning"
                ? tk.amber
                : tk.green
            }`
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: tk.textSecondary }} className="animate-pulse" />
              <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 600 }}>
                Clinical Decision Support
              </span>
              <span style={{ color: tk.textMuted, fontSize: 10, fontFamily: "DM Mono, monospace" }}>
                (MIT-BIH Reference Standard)
              </span>
            </div>
            
            {vitals?.clinical_verdict ? (
              <div 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ 
                  background: 
                    vitals.clinical_verdict.severity === "critical" 
                      ? "rgba(232, 48, 74, 0.12)" 
                      : vitals.clinical_verdict.severity === "warning" 
                      ? "rgba(245, 166, 35, 0.12)" 
                      : "rgba(39, 194, 138, 0.12)",
                  color: 
                    vitals.clinical_verdict.severity === "critical" 
                      ? tk.cardiacRed 
                      : vitals.clinical_verdict.severity === "warning" 
                      ? tk.amber 
                      : tk.green
                }}
              >
                <span 
                  className={`w-1.5 h-1.5 rounded-full ${
                    vitals.clinical_verdict.severity !== "normal" ? "animate-ping animate-duration-1000" : ""
                  }`} 
                  style={{ 
                    background: 
                      vitals.clinical_verdict.severity === "critical" 
                        ? tk.cardiacRed 
                        : vitals.clinical_verdict.severity === "warning" 
                        ? tk.amber 
                        : tk.green 
                  }} 
                />
                {vitals.clinical_verdict.severity}
              </div>
            ) : (
              <div className="flex items-center gap-1" style={{ color: tk.textSecondary }}>
                <Loader2 size={11} className="animate-spin" />
                <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace" }}>Analyzing...</span>
              </div>
            )}
          </div>

          {vitals?.clinical_verdict ? (
            <div className="space-y-2">
              <div 
                style={{ 
                  color: 
                    vitals.clinical_verdict.severity === "critical" 
                      ? tk.cardiacRed 
                      : vitals.clinical_verdict.severity === "warning" 
                      ? tk.amber 
                      : tk.textPrimary,
                  fontFamily: "Syne, sans-serif",
                  fontSize: 14, 
                  fontWeight: 600 
                }}
              >
                {vitals.clinical_verdict.condition}
              </div>
              <ul className="space-y-1.5 pl-1">
                {vitals.clinical_verdict.findings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[12px] leading-relaxed" style={{ color: tk.textSecondary }}>
                    {vitals.clinical_verdict?.severity === "critical" ? (
                      <ShieldAlert size={13} style={{ color: tk.cardiacRed, marginTop: 2, flexShrink: 0 }} />
                    ) : vitals.clinical_verdict?.severity === "warning" ? (
                      <AlertCircle size={13} style={{ color: tk.amber, marginTop: 2, flexShrink: 0 }} />
                    ) : (
                      <CheckCircle2 size={13} style={{ color: tk.green, marginTop: 2, flexShrink: 0 }} />
                    )}
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ color: tk.textSecondary, fontSize: 12, fontFamily: "Syne, sans-serif" }}>
              Awaiting standard 10-second ECG window to compile disease classification metrics.
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-5 flex-wrap gap-2 pt-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full" style={{ background: isDark ? "rgba(100, 150, 255, 0.1)" : "rgba(0, 80, 255, 0.05)", fontFamily: "DM Mono, monospace", fontSize: 10, color: isDark ? "#76A2FF" : "#0055FF" }}>
            CardiShirt Companion
          </div>
          <div className="px-2 py-0.5 rounded-full" style={{ background: "rgba(39,194,138,0.1)", fontFamily: "DM Mono, monospace", fontSize: 10, color: "#27C28A" }}>
            {hasData ? "Real-time analysis" : "Waiting"}
          </div>
        </div>
        <button
          onClick={() => navigate("/cardiac-diary")}
          className="flex items-center gap-1 hover:gap-2 transition-all"
          style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 500 }}
        >
          See full diary entry <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}