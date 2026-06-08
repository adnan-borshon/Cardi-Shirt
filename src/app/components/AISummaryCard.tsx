import {Sparkles,ArrowRight,Loader2} from "lucide-react";
import {useTokens} from "./ThemeContext";
import {useLiveVitals, LiveVitals} from "./useBackend";
import {useNavigate} from "react-router";

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

  const { bpm, temp, fall_detected, spo2, hrv_rmssd, st_deviation_mv, breathing_rate, stress_index } = vitals;

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
    return `We noticed ${listText} right now. Please sit down, rest, and try to take slow, calming breaths. We recommend letting a caregiver know how you feel.`;
  }

  if (warningList.length > 0) {
    const listText = warningList.join(" and ");
    return `Your heart is stable, though we notice ${listText}. Consider taking a short break, getting some fresh air, or drinking water to help your body recover.`;
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

  return `${timeGreeting} your heart has been **steady and calm**, indicating ${hrvRemark}. With **normal oxygen levels** and **low physiological stress**, your body is in a healthy rhythm.`;
}

export function AISummaryCard(){
const tk=useTokens();
const navigate = useNavigate();
const {vitals, connected} = useLiveVitals();

const summaryText = getRealtimeSummaryText(vitals, connected);
const time = vitals ? new Date(vitals.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "Live";
const hasData = !!(vitals && vitals.bpm > 0);

// Use a slightly warmer card background as requested by design briefs: a hint of deep blue rather than pure charcoal.
// For dark mode: rgba(28, 38, 57, 0.4), for light mode: #F0F4FF or similar
const isDark = tk.cardBg.includes("1d") || tk.cardBg.includes("11") || tk.cardBg.includes("16") || tk.cardBg.includes("rgba");
const warmerCardBg = isDark ? "rgba(28, 38, 57, 0.45)" : "#F0F4FF";

return(
<div
className="rounded-xl p-5 relative overflow-hidden transition-all duration-300"
style={{
  background: warmerCardBg,
  border: `0.5px solid ${isDark ? "rgba(74, 114, 189, 0.2)" : "#D3E0FF"}`,
  boxShadow: tk.shadow
}}
>
<div className="flex items-center gap-2 mb-3">
<Sparkles size={16} style={{color: tk.amber}}/>
<span style={{color: tk.amber,fontFamily:"Syne, sans-serif",fontSize:12,fontWeight:600}}>
{!connected ? "CardiShirt Connection" : !hasData ? "Awaiting Sensor Stream" : "Today's AI Summary"}
</span>
<span style={{color:tk.textMuted,fontFamily:"DM Mono, monospace",fontSize:10,marginLeft:"auto"}}>{time}</span>
</div>

<p style={{color:tk.textPrimary,fontFamily:"'DM Serif Display', serif",fontSize:16,lineHeight:1.65,letterSpacing:"0.01em"}}>
{parseInlineStyles(summaryText, tk)}
</p>

<div className="flex items-center justify-between mt-5 flex-wrap gap-2 pt-2 border-t" style={{borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}}>
<div className="flex items-center gap-2">
<div className="px-2 py-0.5 rounded-full" style={{background: isDark ? "rgba(100, 150, 255, 0.1)" : "rgba(0, 80, 255, 0.05)", fontFamily:"DM Mono, monospace",fontSize:10,color: isDark ? "#76A2FF" : "#0055FF"}}>
CardiShirt Companion
</div>
<div className="px-2 py-0.5 rounded-full" style={{background:"rgba(39,194,138,0.1)",fontFamily:"DM Mono, monospace",fontSize:10,color:"#27C28A"}}>
{hasData ? "Real-time analysis" : "Waiting"}
</div>
</div>
<button 
  onClick={() => navigate("/cardiac-diary")}
  className="flex items-center gap-1 hover:gap-2 transition-all" 
  style={{color:tk.textSecondary,fontFamily:"Syne, sans-serif",fontSize:12,fontWeight:500}}
>
See full diary entry <ArrowRight size={14}/>
</button>
</div>
</div>
);
}