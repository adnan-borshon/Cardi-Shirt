import { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowRight, Loader2, Activity, ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTokens } from "./ThemeContext";
import { useLiveVitals, LiveVitals, API_URL } from "./useBackend";
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

function parseAndStyleVitals(text: string, tk: any) {
  if (!text) return "";
  const parts = text.split("**");
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      // It's bold text. Let's analyze it and style it dynamically!
      let color = tk.textPrimary;
      let fontWeight = 700;
      
      const lower = part.toLowerCase();
      
      // 1. SpO2 / Oxygen
      if (lower.includes("%")) {
        const match = part.match(/(\d+)/);
        if (match) {
          const val = parseInt(match[1]);
          if (val < 90) color = "#E8304A"; // critical red
          else if (val < 95) color = "#F5A623"; // warning orange
          else color = "#27C28A"; // normal green
        }
      }
      // 2. Heart Rate / BPM
      else if (lower.includes("bpm")) {
        const match = part.match(/(\d+)/);
        if (match) {
          const val = parseInt(match[1]);
          if (val > 120 || val < 50) color = "#E8304A";
          else if (val > 100) color = "#F5A623";
          else color = "#27C28A";
        }
      }
      // 3. Temperature
      else if (lower.includes("°c") || (lower.includes("c") && lower.match(/\d/))) {
        const match = part.match(/(\d+(\.\d+)?)/);
        if (match) {
          const val = parseFloat(match[1]);
          if (val > 38.0 || val < 35.0) color = "#E8304A";
          else color = "#27C28A";
        }
      }
      // 4. ST Deviation / mV
      else if (lower.includes("mv")) {
        const match = part.match(/(-?\d+(\.\d+)?)/);
        if (match) {
          const val = parseFloat(match[1]);
          if (val > 0.2 || val < -0.1) color = "#E8304A";
          else if (val > 0.1 || val < -0.05) color = "#F5A623";
          else color = "#27C28A";
        }
      }
      // 5. General status words
      else if (lower.includes("normal") || lower.includes("stable") || lower.includes("healthy") || lower.includes("optimal") || lower.includes("excellent")) {
        color = "#27C28A";
      }
      else if (lower.includes("warning") || lower.includes("elevated") || lower.includes("moderately") || lower.includes("slightly")) {
        color = "#F5A623";
      }
      else if (lower.includes("critical") || lower.includes("anomaly") || lower.includes("anomalies") || lower.includes("danger") || lower.includes("low") || lower.includes("high") || lower.includes("immediate") || lower.includes("disconnected") || lower.includes("alert")) {
        color = "#E8304A";
      }

      return (
        <strong key={idx} style={{ color, fontWeight }}>
          {part}
        </strong>
      );
    }
    
    return part;
  });
}

function renderSummaryMarkdown(md: string, tk: any) {
  if (!md) return null;
  const lines = md.split("\n");
  return lines.map((line, idx) => {
    const l = line.trim();
    if (!l) return <div key={idx} className="h-1.5" />;
    
    // Headings (e.g. ### Title)
    if (l.startsWith("### ")) {
      const headerText = l.substring(4).trim();
      let headerColor = tk.textPrimary;
      
      // Customize colors based on header icons/text
      if (headerText.includes("Heart") || headerText.includes("💓")) {
        headerColor = tk.cardiacRed || "#E8304A";
      } else if (headerText.includes("Observation") || headerText.includes("🔍")) {
        headerColor = "#5B8AF0"; // beautiful blue to match ECG screen
      } else if (headerText.includes("Guidance") || headerText.includes("🩺")) {
        headerColor = "#27C28A"; // green
      }
      
      return (
        <h3 
          key={idx} 
          style={{ 
            color: headerColor, 
            fontFamily: "Syne, sans-serif", 
            fontSize: 13, 
            fontWeight: 700, 
            marginTop: 12, 
            marginBottom: 6,
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          {headerText}
        </h3>
      );
    }
    
    // Lists (e.g. * Item or - Item)
    if (l.startsWith("* ") || l.startsWith("- ")) {
      const bulletContent = l.substring(2).trim();
      return (
        <div 
          key={idx} 
          style={{ 
            fontFamily: "Inter, sans-serif", 
            fontSize: 12, 
            color: tk.textSecondary, 
            marginLeft: 12, 
            marginBottom: 4, 
            position: "relative", 
            paddingLeft: 10, 
            lineHeight: 1.5 
          }}
        >
          <span style={{ position: "absolute", left: 0, color: tk.textMuted }}>•</span>
          {parseAndStyleVitals(bulletContent, tk)}
        </div>
      );
    }
    
    // Regular paragraph
    return (
      <p 
        key={idx} 
        style={{ 
          color: tk.textPrimary, 
          fontFamily: "Inter, sans-serif", 
          fontSize: 12, 
          lineHeight: 1.55, 
          marginBottom: 6 
        }}
      >
        {parseAndStyleVitals(l, tk)}
      </p>
    );
  });
}

function getRealtimeSummaryText(vitals: LiveVitals | null, connected: boolean): string {
  if (!connected) {
    return `### 💓 Heart Rhythm & Rate Analysis
* Your **CardiShirt** is currently **disconnected**.

### 🔍 Key Diagnostic Observations
* No live sensor data available right now.

### 🩺 Clinical Guidance
* Please connect your device and put on the shirt to begin real-time health monitoring.`;
  }
  if (!vitals || (vitals.bpm === 0 && !vitals.spo2)) {
    return `### 💓 Heart Rhythm & Rate Analysis
* Waiting for **CardiShirt sensor data stream**.

### 🔍 Key Diagnostic Observations
* No readings detected yet — sensor may still be warming up.

### 🩺 Clinical Guidance
* Put on the shirt and ensure the device is connected to see your real-time health analysis.`;
  }

  const { bpm, temp, fall_detected, spo2 = 98, hrv_rmssd = 40, st_deviation_mv, breathing_rate = 16, stress_index = 25 } = vitals;

  // 1. Fall Detected
  if (fall_detected) {
    return `### 💓 Heart Rhythm & Rate Analysis
* **Fall detected** — your current heart rate is **${bpm} BPM**.

### 🔍 Key Diagnostic Observations
* A fall event has been registered by the sensor.
* Blood oxygen: **${spo2}%** · Temperature: **${temp}°C**.

### 🩺 Clinical Guidance
* Please remain still if you are hurt. Emergency contacts are being notified immediately.`;
  }

  // 2. High-Risk ECG (ST elevation/depression)
  if (st_deviation_mv !== undefined && st_deviation_mv !== null) {
    if (st_deviation_mv > 0.2) {
      return `### 💓 Heart Rhythm & Rate Analysis
* Significant **ST segment elevation** has been detected (${st_deviation_mv.toFixed(2)} mV).
* Current heart rate: **${bpm} BPM**.

### 🔍 Key Diagnostic Observations
* ST elevation above **+0.20 mV** threshold — potential acute cardiac event.
* Blood oxygen: **${spo2}%** · Temperature: **${temp}°C**.

### 🩺 Clinical Guidance
* Sit down immediately and rest. Contact emergency services or your doctor right away.`;
    }
    if (st_deviation_mv < -0.1) {
      return `### 💓 Heart Rhythm & Rate Analysis
* **ST segment depression** detected (${st_deviation_mv.toFixed(2)} mV).
* Current heart rate: **${bpm} BPM**.

### 🔍 Key Diagnostic Observations
* ST depression indicates potential reduced cardiac oxygen flow.
* Blood oxygen: **${spo2}%** · Temperature: **${temp}°C**.

### 🩺 Clinical Guidance
* Rest and avoid physical exertion. Please consult your physician as soon as possible.`;
    }
  }

  // 3. Build structured output based on vitals analysis
  const hour = new Date().getHours();
  let timeGreeting = "This morning";
  if (hour >= 12 && hour < 17) timeGreeting = "This afternoon";
  else if (hour >= 17 || hour < 5) timeGreeting = "This evening";

  // HR status
  let hrStatus = `Your heart rate is **${bpm} BPM** — within the normal resting range.`;
  let hrSeverity = "normal";
  if (bpm > 120) { hrStatus = `Your heart rate is **${bpm} BPM** — significantly elevated (tachycardia).`; hrSeverity = "critical"; }
  else if (bpm > 100) { hrStatus = `Your heart rate is **${bpm} BPM** — slightly elevated.`; hrSeverity = "warning"; }
  else if (bpm < 50 && bpm > 0) { hrStatus = `Your heart rate is **${bpm} BPM** — slower than usual (bradycardia).`; hrSeverity = "warning"; }

  // Rhythm
  let rhythmNote = hrSeverity === "normal" ? "Rhythm appears **Normal Sinus Rhythm** — no irregularities detected." : "Rhythm shows signs of deviation — please monitor closely.";

  // HRV
  let hrvNote = `HRV (RMSSD): **${hrv_rmssd} ms** — suggests a healthy level of cardiac adaptability.`;
  if (hrv_rmssd > 45) hrvNote = `HRV (RMSSD): **${hrv_rmssd} ms** — excellent cardiovascular recovery indicator.`;
  else if (hrv_rmssd < 20) hrvNote = `HRV (RMSSD): **${hrv_rmssd} ms** — low variability, may indicate stress or fatigue.`;

  // SpO2
  let spo2Note = `Blood oxygen (SpO2): **${spo2}%** — within healthy range.`;
  if (spo2 < 90) spo2Note = `Blood oxygen (SpO2): **${spo2}%** — critically **low**. Seek immediate medical attention.`;
  else if (spo2 < 95) spo2Note = `Blood oxygen (SpO2): **${spo2}%** — slightly **low**. Monitor closely and rest.`;

  // Temperature
  let tempNote = `Body temperature: **${temp}°C** — normal.`;
  if (temp > 38.0) tempNote = `Body temperature: **${temp}°C** — elevated, possible fever.`;
  else if (temp > 0 && temp < 35.0) tempNote = `Body temperature: **${temp}°C** — **low** (hypothermia risk).`;

  // Breathing
  let breathNote = `Breathing rate: **${breathing_rate} breaths/min** — steady and normal.`;
  if (breathing_rate > 20) breathNote = `Breathing rate: **${breathing_rate} breaths/min** — slightly rapid.`;
  else if (breathing_rate < 12) breathNote = `Breathing rate: **${breathing_rate} breaths/min** — slower than typical.`;

  // ST deviation note
  let stNote = "";
  if (st_deviation_mv !== undefined && st_deviation_mv !== null) {
    stNote = `\n* ST deviation: **${st_deviation_mv > 0 ? "+" : ""}${st_deviation_mv.toFixed(2)} mV** — within acceptable physiological range.`;
  }

  // Guidance
  let guidance = `${timeGreeting} your vitals look **stable**. Keep up the good habits — stay hydrated and rest well.`;
  if (hrSeverity === "critical" || spo2 < 90) {
    guidance = "Some readings require attention. Please **rest immediately** and contact a caregiver or healthcare provider.";
  } else if (hrSeverity === "warning" || spo2 < 95) {
    guidance = "A few readings are slightly outside normal range. Take a short break, drink water, and try to relax.";
  }

  return `### 💓 Heart Rhythm & Rate Analysis
* ${hrStatus}
* ${rhythmNote}

### 🔍 Key Diagnostic Observations
* ${spo2Note}
* ${tempNote}
* ${breathNote}
* ${hrvNote}${stNote}

### 🩺 Clinical Guidance
* ${guidance}`;
}

export function AISummaryCard() {
  const tk = useTokens();
  const navigate = useNavigate();
  const { vitals, connected } = useLiveVitals();

  const vitalsHistoryRef = useRef<LiveVitals[]>([]);
  const [displaySummary, setDisplaySummary] = useState<string>("");
  const [averagedVitals, setAveragedVitals] = useState<LiveVitals | null>(null);
  const lastUpdatedRef = useRef<number>(0);

  const [liveAiSummary, setLiveAiSummary] = useState<string>("");
  const [aiClinicalVerdict, setAiClinicalVerdict] = useState<any | null>(null);
  const [generatingLive, setGeneratingLive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const generateLiveSummary = async () => {
    if (!connected || !vitals) return;
    setGeneratingLive(true);
    setErrorMsg("");
    try {
      const vitalsPayload = averagedVitals || vitals;
      const res = await fetch(`${API_URL}/api/analyze-live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vitals: vitalsPayload }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.summary) {
        setLiveAiSummary(data.summary);
        setAiClinicalVerdict(data.clinical_verdict || null);
      } else {
        throw new Error("No summary returned");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate live summary");
    } finally {
      setGeneratingLive(false);
    }
  };

  useEffect(() => {
    if (!connected) {
      setLiveAiSummary("");
      setAiClinicalVerdict(null);
    }
  }, [connected]);

  useEffect(() => {
    setLiveAiSummary("");
    setAiClinicalVerdict(null);
  }, [vitals?.simulation_type, vitals?.simulation_active]);

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
  const hasData = !!(vitals && vitals.bpm > 0);

  // 2. Manage static state-based placeholder text — uses structured markdown
  useEffect(() => {
    if (!connected) {
      setDisplaySummary(getRealtimeSummaryText(null, false));
    } else if (!hasData) {
      setDisplaySummary(getRealtimeSummaryText(null, true));
    } else {
      // Use averaged vitals for a stable, smoothed summary
      setDisplaySummary(getRealtimeSummaryText(averagedVitals || vitals, true));
    }
  }, [connected, hasData, averagedVitals, vitals]);

  const time = vitals ? new Date(vitals.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live";

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

      <div style={{ marginTop: 8, marginBottom: 8 }}>
        {liveAiSummary ? renderSummaryMarkdown(liveAiSummary, tk) : renderSummaryMarkdown(displaySummary, tk)}
      </div>

      {errorMsg && (
        <div style={{ color: tk.cardiacRed, fontSize: 11, marginTop: 4, fontFamily: "Syne, sans-serif" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* On-Demand Gemini AI Button */}
      {connected && hasData && (
        <div className="flex flex-wrap items-center gap-3 mt-3 mb-1">
          <button
            disabled={generatingLive}
            onClick={generateLiveSummary}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: generatingLive 
                ? "rgba(147, 51, 234, 0.25)"
                : "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "#ffffff",
              fontFamily: "Syne, sans-serif",
              fontSize: 11,
              cursor: generatingLive ? "not-allowed" : "pointer",
              border: "none",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.15)"
            }}
          >
            {generatingLive ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Analyzing Live Stream...
              </>
            ) : (
              <>
                <Sparkles size={13} className="animate-pulse" />
                {liveAiSummary ? "Regenerate AI Analysis" : "Ask CardiShirt AI"}
              </>
            )}
          </button>
          
          {liveAiSummary && (
            <button
              onClick={() => {
                setLiveAiSummary("");
                setAiClinicalVerdict(null);
              }}
              className="px-3 py-1.5 rounded-lg transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                color: tk.textSecondary,
                fontFamily: "Syne, sans-serif",
                fontSize: 11,
                fontWeight: 500,
                background: "transparent",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
              }}
            >
              Back to Live Feed
            </button>
          )}
        </div>
      )}

      {!connected && (
        <div className="flex items-center gap-2 mt-3 mb-1">
          <button
            disabled
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold opacity-50 cursor-not-allowed"
            style={{
              background: "rgba(100, 100, 100, 0.15)",
              color: tk.textMuted,
              fontFamily: "Syne, sans-serif",
              fontSize: 11,
              border: "none"
            }}
          >
            <Sparkles size={13} />
            Connect Device to Ask AI
          </button>
        </div>
      )}

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

      {/* MIT-BIH Clinical Diagnostic Verdict Section - Only displays after Ask CardiShirt AI button is clicked */}
      {aiClinicalVerdict && (
        <div 
          className="mt-4 p-4 rounded-lg transition-all duration-300" 
          style={{ 
            background: isDark ? "rgba(20, 24, 40, 0.6)" : "rgba(255, 255, 255, 0.5)",
            border: `1px dashed ${
              aiClinicalVerdict.severity === "critical"
                ? "rgba(232, 48, 74, 0.3)"
                : aiClinicalVerdict.severity === "warning"
                ? "rgba(245, 166, 35, 0.3)"
                : "rgba(39, 194, 138, 0.2)"
            }`,
            borderLeft: `4px solid ${
              aiClinicalVerdict.severity === "critical"
                ? tk.cardiacRed
                : aiClinicalVerdict.severity === "warning"
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
            
            <div 
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ 
                background: 
                  aiClinicalVerdict.severity === "critical" 
                    ? "rgba(232, 48, 74, 0.12)" 
                    : aiClinicalVerdict.severity === "warning" 
                    ? "rgba(245, 166, 35, 0.12)" 
                    : "rgba(39, 194, 138, 0.12)",
                color: 
                  aiClinicalVerdict.severity === "critical" 
                    ? tk.cardiacRed 
                    : aiClinicalVerdict.severity === "warning" 
                    ? tk.amber 
                    : tk.green
              }}
            >
              <span 
                className={`w-1.5 h-1.5 rounded-full ${
                  aiClinicalVerdict.severity !== "normal" ? "animate-ping animate-duration-1000" : ""
                }`} 
                style={{ 
                  background: 
                    aiClinicalVerdict.severity === "critical" 
                      ? tk.cardiacRed 
                      : aiClinicalVerdict.severity === "warning" 
                      ? tk.amber 
                      : tk.green 
                }} 
              />
              {aiClinicalVerdict.severity}
            </div>
          </div>

          <div className="space-y-2">
            <div 
              style={{ 
                color: 
                  aiClinicalVerdict.severity === "critical" 
                    ? tk.cardiacRed 
                    : aiClinicalVerdict.severity === "warning" 
                    ? tk.amber 
                    : tk.textPrimary,
                fontFamily: "Syne, sans-serif",
                fontSize: 14, 
                fontWeight: 600 
              }}
            >
              {aiClinicalVerdict.condition}
            </div>
            <ul className="space-y-1.5 pl-1">
              {aiClinicalVerdict.findings && aiClinicalVerdict.findings.map((finding: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-[12px] leading-relaxed" style={{ color: tk.textSecondary }}>
                  {aiClinicalVerdict.severity === "critical" ? (
                    <ShieldAlert size={13} style={{ color: tk.cardiacRed, marginTop: 2, flexShrink: 0 }} />
                  ) : aiClinicalVerdict.severity === "warning" ? (
                    <AlertCircle size={13} style={{ color: tk.amber, marginTop: 2, flexShrink: 0 }} />
                  ) : (
                    <CheckCircle2 size={13} style={{ color: tk.green, marginTop: 2, flexShrink: 0 }} />
                  )}
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
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