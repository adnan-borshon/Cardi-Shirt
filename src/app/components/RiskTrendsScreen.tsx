import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp, Heart,
  Activity, AlertTriangle, Sparkles, Share2, FileText, MessageSquare,
  Shirt, Zap, Brain, Clock, Moon, BarChart3, LineChart as LineChartIcon,
  CheckCircle, Info, X
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import { useTheme, useTokens } from "./ThemeContext";
import { useDailySummaries, useECGRecords, API_URL } from "./useBackend";

function useColors() {
  const { theme } = useTheme();
  const tk = useTokens();
  const d = theme === "dark" || theme === "ocean";
  return {
    headerBg: tk.pageBg,
    headerCard: tk.cardBg,
    headerText: tk.textPrimary,
    headerSecondary: tk.textSecondary,
    headerMuted: tk.textMuted,
    headerBorder: tk.cardBorder,
    bodyBg: tk.pageBg,
    cardBg: tk.cardBg,
    cardBorder: tk.cardBorder,
    bodyText: tk.textPrimary,
    bodySecondary: tk.textSecondary,
    bodyMuted: tk.textMuted,
    gridLine: tk.ecgGrid,
    shadow: tk.shadow,
    chipBg: tk.chipBg,
    surfaceBg: tk.cardElevated,
    rightBg: tk.pageBg,
    rightCard: tk.cardBg,
    rightText: tk.textPrimary,
    rightSecondary: tk.textSecondary,
    ringTrack: tk.ecgGrid,
    red: tk.cardiacRed, amber: tk.amber, green: tk.green, blue: "#5B8AF0", d,
  };
}

const recommendations = [
  { icon: Moon, action: "Rest this afternoon", context: "Your rhythm tends to be irregular on high-activity days." },
  { icon: Shirt, action: "Wear CardiShirt tonight", context: "Sleep HRV data would improve your score accuracy." },
  { icon: Share2, action: "Share this week's data", context: "Your score has been elevated for 5 days." },
];

const alertHistory = [
  { date: "Mar 28, 2:14 PM", type: "alert", name: "Irregular rhythm episode", duration: "42 seconds, self-resolved", color: "#E8304A" },
  { date: "Mar 28, 2:18 PM", type: "alert", name: "T wave inversion — Lead III", duration: "During irregular episode", color: "#E8304A" },
  { date: "Mar 25, 3:47 PM", type: "alert", name: "Irregular rhythm episode", duration: "28 seconds, self-resolved", color: "#E8304A" },
  { date: "Mar 22, 11:03 AM", type: "anomaly", name: "Elevated resting HR", duration: "32 minutes above baseline", color: "#F5A623" },
  { date: "Mar 18, 2:31 PM", type: "anomaly", name: "Afternoon rhythm variation", duration: "Brief, within normal range", color: "#F5A623" },
  { date: "Mar 14, 9:15 AM", type: "anomaly", name: "Morning HR spike", duration: "8 minutes, exercise-related", color: "#F5A623" },
  { date: "Mar 12, 10:20 AM", type: "alert", name: "T wave inversion — Lead II", duration: "18 seconds, normalized", color: "#E8304A" },
  { date: "Mar 10, 4:52 PM", type: "alert", name: "Irregular rhythm episode", duration: "55 seconds, self-resolved", color: "#E8304A" },
  { date: "Mar 7, 1:20 PM", type: "anomaly", name: "HRV drop below baseline", duration: "Low sleep quality noted", color: "#F5A623" },
  { date: "Mar 3, 3:10 PM", type: "alert", name: "Irregular rhythm episode", duration: "35 seconds, self-resolved", color: "#E8304A" },
];

function RingChart({ score, color, trackColor, size = 120 }: { score: number; color: string; trackColor: string; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={10} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

function MiniSparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} className="block">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload || !payload.event) return null;
  
  const colors = {
    alert: "#E8304A",   // Red
    anomaly: "#F5A623", // Amber
    visit: "#5B8AF0",   // Blue
    symptom: "#FF8C00"  // Orange
  };
  
  const color = colors[payload.event.type as keyof typeof colors] || "#5B8AF0";
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={color}
      stroke="#fff"
      strokeWidth={2}
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        props.onDotClick(payload, cx, cy, color);
      }}
    />
  );
};

function EcgWaveformPlayer({ type }: { type: "normal" | "irregular" | "anomalous" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let x = 0;
    const width = canvas.width;
    const height = canvas.height;
    const points: number[] = [];
    
    const ecgCycle: number[] = [];
    const cycleLen = 100;
    for (let i = 0; i < cycleLen; i++) {
      let val = 0;
      if (i >= 10 && i <= 20) {
        val = Math.sin((i - 10) * Math.PI / 10) * 4;
      } else if (i === 28) {
        val = -3;
      } else if (i >= 29 && i <= 32) {
        val = 25 * Math.sin((i - 29) * Math.PI / 3);
      } else if (i === 33) {
        val = -6;
      } else if (i >= 45 && i <= 60) {
        const multiplier = type === "irregular" ? -6 : 6;
        val = Math.sin((i - 45) * Math.PI / 15) * multiplier;
      }
      
      if (type === "irregular" && i > 60) {
        val += Math.sin(i * 0.5) * 1.5;
      }
      ecgCycle.push(val);
    }

    for (let i = 0; i < width; i++) {
      points.push(height / 2);
    }

    const draw = () => {
      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(232, 48, 74, 0.05)";
      ctx.lineWidth = 0.5;
      const gridSize = 10;
      for (let i = 0; i < width; i += gridSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let j = 0; j < height; j += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
      }

      ctx.strokeStyle = "rgba(232, 48, 74, 0.12)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += gridSize * 5) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let j = 0; j < height; j += gridSize * 5) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
      }

      points.shift();
      const cycleIdx = x % cycleLen;
      let ecgVal = ecgCycle[cycleIdx];
      
      if (type === "irregular" && Math.random() < 0.05) {
        x += Math.floor(Math.random() * 3);
      }
      
      const nextY = height / 2 - ecgVal * 1.5;
      points.push(nextY);
      x++;

      ctx.strokeStyle = "#E8304A";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, points[0]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(i, points[i]);
      }
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [type]);

  return (
    <canvas
      id="print-ecg-canvas"
      ref={canvasRef}
      width={500}
      height={180}
      style={{ width: "100%", height: 180 }}
      className="bg-[#FCF8F8] dark:bg-[#120A0B] rounded-lg border border-red-500/10"
    />
  );
}

function generateMockTrendsData(range: "7d" | "30d" | "90d" | "1y") {
  const points = [];
  const now = new Date();
  let numDays = 30;
  if (range === "7d") numDays = 7;
  else if (range === "90d") numDays = 90;
  else if (range === "1y") numDays = 365;

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    
    let label = "";
    if (range === "7d" || range === "30d") {
      label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (range === "90d") {
      label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    }

    const dayIndex = numDays - 1 - i;
    let baseScore = 70;
    if (range === "7d") {
      const scores = [70, 71, 72, 70, 71, 72, 73];
      baseScore = scores[dayIndex] || 72;
    } else if (range === "30d") {
      baseScore = 70 + Math.sin(dayIndex / 5) * 3 + (dayIndex / 15) * 2;
    } else if (range === "90d") {
      baseScore = 68 + Math.cos(dayIndex / 10) * 4 + (dayIndex / 30) * 3;
    } else {
      baseScore = 65 + Math.sin(dayIndex / 40) * 5 + (dayIndex / 90) * 4;
    }
    
    const score = Math.round(Math.max(40, Math.min(100, baseScore)));
    const avgBpm = Math.round(72 + Math.sin(dayIndex / 3) * 4 + (score - 70) * -0.5);
    const avgSpo2 = Math.round(97 + Math.sin(dayIndex / 7) * 1 + (score - 70) * 0.1);
    const avgTemp = parseFloat((36.5 + Math.cos(dayIndex / 4) * 0.2).toFixed(1));

    let event: any = undefined;
    if (range === "7d") {
      if (dayIndex === 2) {
        event = {
          type: "anomaly",
          title: "Elevated resting HR",
          description: "32 minutes above baseline during afternoon",
        };
      } else if (dayIndex === 5) {
        event = {
          type: "alert",
          title: "Irregular rhythm episode",
          description: "42 seconds, self-resolved at 2:14 PM",
        };
      }
    } else if (range === "30d") {
      if (dayIndex === 9) {
        event = {
          type: "symptom",
          title: "Symptom: mild fatigue",
          description: "Logged by patient at 6:00 PM",
        };
      } else if (dayIndex === 14) {
        event = {
          type: "alert",
          title: "ST segment deviation",
          description: "+0.8 mV detected during mild exertion",
        };
      } else if (dayIndex === 21) {
        event = {
          type: "visit",
          title: "Report Shared",
          description: "Weekly trend data shared with Dr. Adnan",
        };
      } else if (dayIndex === 27) {
        event = {
          type: "anomaly",
          title: "Afternoon rhythm variation",
          description: "Brief variation, within normal range",
        };
      }
    } else if (range === "90d") {
      if (dayIndex === 20) {
        event = { type: "alert", title: "Irregular rhythm episode", description: "35 seconds, self-resolved" };
      } else if (dayIndex === 45) {
        event = { type: "visit", title: "Report Shared", description: "Monthly report shared with Dr. Adnan" };
      } else if (dayIndex === 70) {
        event = { type: "anomaly", title: "HRV drop below baseline", description: "Low sleep quality noted" };
      }
    } else if (range === "1y") {
      if (dayIndex === 100) {
        event = { type: "alert", title: "Irregular rhythm episode", description: "55 seconds, self-resolved" };
      } else if (dayIndex === 220) {
        event = { type: "visit", title: "Doctor Review", description: "Data reviewed at cardiology clinic" };
      }
    }

    points.push({
      day: dateStr,
      avgBpm,
      avgSpo2,
      avgTemp,
      label,
      value: score,
      dateStr,
      event
    });
  }
  return points;
}

export function RiskTrendsScreen() {
  const c = useColors();
  const navigate = useNavigate();
  const { summaries, loading } = useDailySummaries();
  const { records: backendRecords } = useECGRecords();
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [expandedMetric, setExpandedMetric] = useState<number | null>(null);
  const [expandedFactor, setExpandedFactor] = useState<number | null>(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [compMode, setCompMode] = useState<"personal" | "baseline">("personal");
  const [tabletTab, setTabletTab] = useState<"trends" | "factors">("trends");
  const [apiData, setApiData] = useState<any[]>([]);

  // Modals & Popups state
  const [activeEcgAlert, setActiveEcgAlert] = useState<any | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(false);
  const [clickedEvent, setClickedEvent] = useState<{
    label: string;
    value: number;
    dateStr: string;
    event: { type: string; title: string; description: string };
    x: number;
    y: number;
    color: string;
  } | null>(null);

  const handleDotClick = (payload: any, cx: number, cy: number, color: string) => {
    setClickedEvent({
      label: payload.label,
      value: payload.value,
      dateStr: payload.dateStr,
      event: payload.event,
      x: cx,
      y: cy,
      color
    });
  };

  const handleRecommendationClick = (action: string) => {
    if (action.toLowerCase().includes("share")) {
      setShareModalOpen(true);
    } else if (action.toLowerCase().includes("wear")) {
      navigate("/settings");
    } else if (action.toLowerCase().includes("rest")) {
      alert("Recommendation logged: Activity limit set. We've updated your daily plan.");
    }
  };

  const handlePrintComparisonReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download the PDF report.");
      return;
    }
    
    const currentRange = rangeLabels[range];
    const compareText = compMode === "personal" ? "vs. Last Period" : "vs. Baseline";
    const metrics = [
      { name: "Resting Heart Rate", current: `${recentHr} BPM`, prev: compMode === "personal" ? "72 BPM" : "70 BPM", verdict: "Stable" },
      { name: "Heart Rate Variability (RMSSD)", current: "37 ms", prev: compMode === "personal" ? "44 ms" : "41 ms", verdict: "Watch" },
      { name: "Rhythm Stability", current: "93%", prev: compMode === "personal" ? "95%" : "96%", verdict: "Same" },
      { name: "Alerts/week", current: "2", prev: compMode === "personal" ? "1.2" : "1.5", verdict: "Watch" }
    ];
    
    const aiSummary = summaries.length > 0 && summaries[0].summary 
      ? summaries[0].summary 
      : "Based on recorded vitals, your cardiac health score is stable. Average heart rate is stable, but physiological stress and alert frequencies require monitoring.";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CardiShirt Trend Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #161519; padding: 40px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E8304A; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #E8304A; }
          .meta-info { text-align: right; font-size: 13px; color: #4A4A6A; }
          .section-title { font-size: 16px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #0D0F1A; border-left: 3px solid #E8304A; padding-left: 10px; }
          .summary-card { background: #F7F8FC; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 20px; font-size: 14px; margin-bottom: 30px; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px; }
          th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.06); }
          th { background: #F4F5F9; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #6B7499; }
          td { font-size: 14px; }
          .verdict-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .verdict-stable { background: rgba(39,194,138,0.1); color: #27C28A; }
          .verdict-watch { background: rgba(245,166,35,0.1); color: #F5A623; }
          .verdict-same { background: rgba(0,0,0,0.05); color: #6B7499; }
          .footer { margin-top: 60px; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 15px; font-size: 11px; color: #9AA0B8; text-align: center; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">CardiShirt Clinical Trend Digest</div>
            <div style="font-size: 14px; color: #4A4A6A; margin-top: 4px;">Patient: Adnan (CardiShirt Wearer)</div>
          </div>
          <div class="meta-info">
            <div>Report Range: ${currentRange}</div>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
        </div>
        
        <div class="section-title">AI Trend Narrative</div>
        <div class="summary-card">
          ${aiSummary}
        </div>
        
        <div class="section-title">Metrics Comparison (${compareText})</div>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Current Period Avg</th>
              <th>Comparison Period</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            ${metrics.map(m => {
              let badgeClass = "verdict-same";
              if (m.verdict.toLowerCase().includes("stable") || m.verdict.toLowerCase().includes("better")) {
                badgeClass = "verdict-stable";
              } else if (m.verdict.toLowerCase().includes("watch")) {
                badgeClass = "verdict-watch";
              }
              return `
                <tr>
                  <td><strong>${m.name}</strong></td>
                  <td>${m.current}</td>
                  <td>${m.prev}</td>
                  <td><span class="verdict-badge ${badgeClass}">${m.verdict}</span></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
        
        <div class="footer">
          This is an AI-assisted longitudinal cardiac vital trend report generated by the CardiShirt cloud service.<br/>
          This document does not substitute for a professional diagnosis. Please review these trends with your cardiologist.
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintEcgReport = (alertItem: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export the ECG report.");
      return;
    }
    
    const canvasElement = document.getElementById("print-ecg-canvas") as HTMLCanvasElement;
    const canvasImage = canvasElement ? canvasElement.toDataURL("image/png") : "";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CardiShirt ECG Report - ${alertItem.name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #161519; padding: 40px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E8304A; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #E8304A; }
          .meta-info { text-align: right; font-size: 13px; color: #4A4A6A; }
          .section-title { font-size: 16px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #0D0F1A; border-left: 3px solid #E8304A; padding-left: 10px; }
          .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; background: #F7F8FC; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 20px; font-size: 14px; margin-bottom: 30px; }
          .details-grid div span { color: #6B7499; font-weight: 500; }
          .ecg-container { border: 1px solid #E8304A; border-radius: 8px; padding: 15px; text-align: center; background: #FCF8F8; }
          .ecg-image { max-width: 100%; border-radius: 4px; border: 1px solid rgba(0,0,0,0.05); }
          .footer { margin-top: 60px; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 15px; font-size: 11px; color: #9AA0B8; text-align: center; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">CardiShirt Diagnostic ECG Snapshot</div>
            <div style="font-size: 14px; color: #4A4A6A; margin-top: 4px;">Patient: Adnan (CardiShirt Wearer)</div>
          </div>
          <div class="meta-info">
            <div>Record ID: ECG-${Math.floor(100000 + Math.random() * 900000)}</div>
            <div>Export Date: ${new Date().toLocaleString()}</div>
          </div>
        </div>
        
        <div class="section-title">Event Details</div>
        <div class="details-grid">
          <div><span>Alert Type:</span> ${alertItem.name}</div>
          <div><span>Timestamp:</span> ${alertItem.date}</div>
          <div><span>Duration:</span> ${alertItem.duration}</div>
          <div><span>Lead Channel:</span> Lead II (Precordial)</div>
        </div>
        
        <div class="section-title">ECG Waveform Capture</div>
        <div class="ecg-container">
          ${canvasImage ? `<img src="${canvasImage}" class="ecg-image" alt="ECG Snapshot" />` : `<div style="padding: 50px; color: #9AA0B8;">Waveform Capture Unavailable</div>`}
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #6B7499; margin-top: 10px; font-family: monospace;">
            <span>Scale: 25mm/s • 10mm/mV</span>
            <span>Lead II • 12-Bit Resolution</span>
          </div>
        </div>
        
        <div class="footer">
          This document represents a static, high-fidelity capture of a registered cardiac event from the CardiShirt wearable shirt sensor.<br/>
          This waveform analysis does not constitute medical advice. Please share this file directly with your doctor.
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => {
    fetch(`${API_URL}/api/trends?range=${range}`)
      .then(res => res.json())
      .then(d => setApiData(Array.isArray(d) ? d : []))
      .catch(e => console.error("[Trends]", e));
  }, [range]);

  const { healthData, hrData, spo2Data, tempData, RISK_SCORE, RISK_COLOR, last7 } = useMemo(() => {
    // Generate the full range of mock data (e.g. 7, 30, 90, or 365 days)
    const mockData = generateMockTrendsData(range);

    // Merge real apiData into the mockData
    const realDataByDate: Record<string, any> = {};
    apiData.forEach(d => {
      if (!d.day) return;
      const dateKey = d.day.substring(0, 10); // Extract "YYYY-MM-DD"
      if (!realDataByDate[dateKey]) {
        realDataByDate[dateKey] = [];
      }
      realDataByDate[dateKey].push(d);
    });

    // Now, map mockData and override with real data if it exists for that date!
    const mergedData = mockData.map((mockPoint, index) => {
      const dateKey = mockPoint.day; // mockPoint.day is already "YYYY-MM-DD"
      const realPoints = realDataByDate[dateKey];
      
      if (realPoints && realPoints.length > 0) {
        // We have real data for this date! Average the values
        let totalBpm = 0;
        let totalSpo2 = 0;
        let totalTemp = 0;
        let totalScore = 0;
        let scoreCount = 0;
        
        realPoints.forEach((p: any) => {
          totalBpm += p.avgBpm || 72;
          totalSpo2 += p.avgSpo2 || 97;
          totalTemp += p.avgTemp || 36.6;
          
          if (p.avgScore != null && p.avgScore > 0) {
            totalScore += p.avgScore;
            scoreCount++;
          }
        });
        
        const avgBpm = Math.round(totalBpm / realPoints.length);
        const avgSpo2 = Math.round(totalSpo2 / realPoints.length);
        const avgTemp = parseFloat((totalTemp / realPoints.length).toFixed(1));
        
        let s: number;
        if (scoreCount > 0) {
          s = Math.round(totalScore / scoreCount);
        } else {
          // Calculate score from bpm and spo2
          s = Math.round(Math.max(40, Math.min(100, 100 - Math.abs(72 - avgBpm) - Math.max(0, 95 - avgSpo2) * 4)));
        }
        
        // Use the event from the last real point if it exists
        const lastRealPoint = realPoints[realPoints.length - 1];
        
        return {
          ...mockPoint,
          avgBpm,
          avgSpo2,
          avgTemp,
          value: s,
          isReal: true,
          event: lastRealPoint.event || mockPoint.event
        };
      }
      
      return mockPoint;
    });

    let totalScore = 0;
    mergedData.forEach(d => {
      totalScore += d.value;
    });

    const avgScore = mergedData.length ? Math.round(totalScore / mergedData.length) : 73;
    const color = avgScore >= 78 ? c.green : avgScore >= 60 ? c.amber : c.red;
    const l7 = mergedData.slice(-7).map(x => x.value);
    
    return {
      healthData: mergedData,
      hrData: mergedData.map(d => ({ label: d.label, value: d.avgBpm })),
      spo2Data: mergedData.map(d => ({ label: d.label, value: d.avgSpo2 })),
      tempData: mergedData.map(d => ({ label: d.label, value: d.avgTemp })),
      RISK_SCORE: avgScore,
      RISK_COLOR: color,
      last7: l7.length > 0 ? l7 : [70, 71, 72, 70, 71, 72, 73]
    };
  }, [apiData, range, c]);

  const recentHr = hrData.length ? hrData[hrData.length - 1].value : 72;
  const recentSpo2 = spo2Data.length ? spo2Data[spo2Data.length - 1].value : 98;
  const recentTemp = tempData.length ? tempData[tempData.length - 1].value : 36.6;

  const secondaryMetrics = [
    { name: "Heart Rate", value: recentHr.toString(), unit: "BPM", delta: "Normal", deltaColor: c.green, status: "Stable", statusColor: c.green, data: hrData },
    { name: "SpO2", value: recentSpo2.toString(), unit: "%", delta: "Normal", deltaColor: c.green, status: "Good", statusColor: c.green, data: spo2Data },
    { name: "Temperature", value: recentTemp.toString(), unit: "°C", delta: "Normal", deltaColor: c.green, status: "Stable", statusColor: c.green, data: tempData },
  ];

  const RISK_DELTA = last7.length > 1 ? Math.round(last7[last7.length - 1] - last7[0]) : 0;
  const RISK_DELTA_COLOR = RISK_DELTA >= 0 ? c.green : c.red;

  // Complete list of 11 detailed Risk Factors from the Figma designs
  const riskFactors = [
    { name: "Resting Heart Rate", contribution: +6, color: c.green, status: "positive", desc: "Your resting rate has been lower than usual this month.", sparkData: [72, 70, 69, 68, 70, 67, 68], detail: "Your average resting heart rate this month is 68 BPM, down from 72 BPM last month. Lower resting heart rate generally indicates improved cardiovascular fitness." },
    { name: "Heart Rate Variability", contribution: -4, color: c.red, status: "negative", desc: "Your HRV dropped after the 18th and has not fully recovered.", sparkData: [44, 42, 40, 36, 34, 35, 37], detail: "Your RMSSD averaged 37ms this week, down from 44ms. HRV tends to decrease with poor sleep, high stress, or dehydration." },
    { name: "Rhythm Stability", contribution: -3, color: c.amber, status: "negative", desc: "Five brief irregular episodes this month, all self-resolving.", sparkData: [96, 95, 94, 92, 93, 91, 93], detail: "Your rhythm has been 93% stable this month. The five irregular episodes were all brief and self-resolving, but the slight increase in frequency is worth monitoring." },
    { name: "ST Segment Deviation", contribution: +4, color: c.green, status: "positive", desc: "No significant ST elevation or depression detected this month.", sparkData: [0.1, 0.15, 0.2, 0.1, 0.15, 0.1, 0.2], detail: "ST segments have remained within normal range (0 to +0.3 mV). No signs of ischemia or myocardial injury detected." },
    { name: "T Wave Morphology", contribution: +3, color: c.green, status: "positive", desc: "All T waves upright and normal throughout monitoring period.", sparkData: [100, 100, 100, 100, 100, 100, 100], detail: "No T wave inversions or abnormalities detected. T wave amplitude and duration remain consistent and within healthy parameters." },
    { name: "R-Peak Consistency", contribution: +2, color: c.green, status: "positive", desc: "R-R intervals show excellent regularity.", sparkData: [98, 97, 98, 99, 98, 97, 98], detail: "Your R-peak intervals show 98% consistency, indicating a very stable cardiac rhythm." },
    { name: "Breathing Rate", contribution: +1, color: c.green, status: "positive", desc: "Respiratory rate steady and calm throughout the day.", sparkData: [15, 16, 15, 16, 17, 16, 15], detail: "Your average breathing rate of 16 breaths per minute is within the ideal range. Respiratory-sinus arrhythmia patterns are healthy." },
    { name: "Stress Index", contribution: -3, color: c.amber, status: "negative", desc: "Stress levels slightly elevated this week.", sparkData: [18, 22, 28, 32, 28, 24, 26], detail: "Your average stress index this week is 26/100, up from 18/100 last week. Consider incorporating relaxation techniques." },
    { name: "Strain Level", contribution: -2, color: c.amber, status: "negative", desc: "Physical exertion has been higher than baseline.", sparkData: [20, 25, 35, 40, 38, 32, 30], detail: "Your average strain level is at 32% of maximum capacity this week. Ensure adequate recovery time between intense activities." },
    { name: "Wearing Consistency", contribution: +2, color: c.green, status: "positive", desc: "You wore the shirt on 87% of days — good coverage.", sparkData: [80, 85, 82, 90, 88, 85, 87], detail: "Consistent wearing gives the AI more data to work with. Your 87% coverage is above the threshold needed for reliable trend analysis." },
    { name: "Sleep Heart Rate", contribution: -2, color: c.amber, status: "negative", desc: "Your overnight heart rate has been slightly elevated.", sparkData: [62, 63, 64, 65, 63, 64, 63], detail: "Your average sleeping heart rate this week is 63 BPM, up from 60 BPM. This can be influenced by late meals, stress, or room temperature." },
  ];

  const donutData = riskFactors.map(f => ({
    name: f.name,
    value: Math.abs(f.contribution) || 1,
    color: f.color,
  }));

  const dynamicAlertHistory = useMemo(() => {
    const realAlerts = backendRecords
      .filter(r => {
        const isAnomaly = r.ai_summary && (r.ai_summary.toLowerCase().includes("anomaly") || r.ai_summary.toLowerCase().includes("irregular") || r.ai_summary.toLowerCase().includes("tachycardia"));
        const severity = r.clinical_verdict?.severity || (isAnomaly ? "critical" : "normal");
        return severity === "critical" || severity === "warning";
      })
      .map(r => {
        const d = new Date(r.timestamp);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + `, ` + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        const condition = r.clinical_verdict?.condition || "Irregular rhythm episode";
        const severity = r.clinical_verdict?.severity || "critical";
        return {
          date: dateStr,
          type: severity === "critical" ? "alert" : "anomaly",
          name: condition,
          duration: `${Math.round((r.waveform_data || []).length / 100)} seconds, self-resolved`,
          color: severity === "critical" ? "#E8304A" : "#F5A623",
          isReal: true,
          recordId: r.id
        };
      });

    return [...realAlerts, ...alertHistory];
  }, [backendRecords]);

  const visibleAlerts = showAllAlerts ? dynamicAlertHistory : dynamicAlertHistory.slice(0, 5);

  const tooltipLight: React.CSSProperties = { background: c.cardBg, borderRadius: 8, border: `1px solid ${c.cardBorder}`, fontFamily: "DM Mono, monospace", fontSize: 11, color: c.bodyText };
  const bodyCard: React.CSSProperties = { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, boxShadow: c.shadow };
  const ranges: ("7d" | "30d" | "90d" | "1y")[] = ["7d", "30d", "90d", "1y"];
  const rangeLabels: Record<string, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days", "1y": "1 year" };

  const RightPanelContent = ({ id }: { id: string }) => (
    <div className="flex flex-col gap-5">
      {/* Donut Chart */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: 160, height: 160 }}>
          <PieChart width={160} height={160}>
            <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" stroke="none">
              {donutData.map((d, i) => <Cell key={`${id}-donut-${i}`} fill={d.color} />)}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 32, color: c.rightText, fontWeight: 500 }}>{RISK_SCORE}</span>
          </div>
        </div>
      </div>

      {/* Factor List */}
      <div className="flex flex-col gap-2">
        {riskFactors.map((f, i) => (
          <div key={f.name} style={{ background: c.rightCard, border: `1px solid ${c.cardBorder}`, borderRadius: 10, overflow: "hidden" }}>
            <button onClick={() => setExpandedFactor(expandedFactor === i ? null : i)} className="w-full px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: c.rightText }}>{f.name}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: f.color, fontWeight: 500 }}>
                  {f.contribution > 0 ? `+${f.contribution}` : f.contribution === 0 ? "—" : f.contribution}
                </span>
              </div>
              {/* Contribution bar */}
              <div className="relative h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: c.ringTrack }}>
                {f.status === "positive" && (
                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.min(100, 50 + f.contribution * 5)}%`, background: f.color }} />
                )}
                {f.status === "negative" && (
                  <div className="absolute right-0 top-0 h-full rounded-full" style={{ width: `${Math.min(100, 50 + Math.abs(f.contribution) * 5)}%`, background: f.color }} />
                )}
                {f.status === "neutral" && (
                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: "50%", background: f.color }} />
                )}
              </div>
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.rightSecondary }}>{f.desc}</span>
            </button>
            {expandedFactor === i && (
              <div className="px-4 pb-3 flex flex-col gap-2 animate-slide-down">
                <MiniSparkline data={f.sparkData} color={f.color} width={240} height={32} />
                <p style={{ fontFamily: "Syne, sans-serif", fontSize: 12, lineHeight: 1.6, color: c.rightSecondary }}>{f.detail}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Suggestions Strip */}
      <div>
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: c.rightText, marginBottom: 8, display: "block" }}>Suggestions</span>
        <div className="flex flex-col gap-2">
          {recommendations.map((r, i) => (
            <button key={i} onClick={() => handleRecommendationClick(r.action)} className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" style={{ background: c.rightCard, border: `1px solid ${c.cardBorder}` }}>
              <r.icon size={16} style={{ color: c.red, marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.rightText, fontWeight: 500 }}>{r.action}</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.rightSecondary }}>{r.context}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto hide-scrollbar" style={{ background: c.bodyBg }}>

      {/* ── HERO RISK HEADER ZONE ── */}
      <div style={{ background: c.headerBg, borderBottom: `1px solid ${c.headerBorder}` }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 pb-0">

          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 justify-center pb-5">
            <div className="relative flex items-center justify-center flex-shrink-0">
              <RingChart score={RISK_SCORE} color={RISK_COLOR} trackColor={c.d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"} />
              <span className="absolute" style={{ fontFamily: "DM Mono, monospace", fontSize: 20, color: RISK_COLOR }}>{RISK_SCORE}</span>
            </div>

            <div className="text-center sm:text-left">
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.headerSecondary }}>CardiShirt Health Score</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 72, lineHeight: 1, color: RISK_COLOR, fontWeight: 500 }}>{RISK_SCORE}</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.headerSecondary }}>Today</div>
            </div>

            <div className="flex-shrink-0 hidden md:block">
              <div className="flex items-center gap-2 mb-1">
                {RISK_DELTA >= 0 ? <TrendingUp size={14} style={{ color: RISK_DELTA_COLOR }} /> : <TrendingDown size={14} style={{ color: RISK_DELTA_COLOR }} />}
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: RISK_DELTA_COLOR }}>{Math.abs(RISK_DELTA)} points</span>
              </div>
              <MiniSparkline data={last7} color={RISK_COLOR} width={120} height={36} />
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.headerSecondary }}>vs. last week</div>
            </div>
          </div>

          <p className="text-center pb-4" style={{ fontFamily: "Syne, sans-serif", fontSize: 16, color: c.headerText, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            {apiData.length === 0 
              ? "Your health score is stable at 73. Awaiting more historical vital entries to process advanced curves."
              : `Based on ${apiData.length} days of recorded vitals, your cardiac health score is trending ${RISK_DELTA >= 0 ? "upward" : "downward"}.`}
          </p>

          {/* Time range tabs */}
          <div className="sticky top-0 z-10 flex justify-center gap-2 py-3" style={{ background: c.headerBg }}>
            {ranges.map(r => (
              <button key={r} onClick={() => setRange(r)} className="px-4 py-1.5 rounded-full transition-colors hover:scale-105" style={{
                background: range === r ? c.red : "transparent",
                color: range === r ? "#fff" : c.headerSecondary,
                border: range === r ? "none" : `0.5px solid ${c.d ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                fontFamily: "Syne, sans-serif", fontSize: 13,
              }}>{rangeLabels[r]}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">

        {/* Tab Toggle for mobile */}
        <div className="flex xl:hidden mb-4 gap-2">
          <button onClick={() => setTabletTab("trends")} className="px-4 py-1.5 rounded-full transition-all" style={{
            background: tabletTab === "trends" ? "rgba(232,48,74,0.1)" : "transparent",
            color: tabletTab === "trends" ? c.red : c.bodySecondary,
            border: tabletTab === "trends" ? `1px solid rgba(232,48,74,0.3)` : `1px solid ${c.cardBorder}`,
            fontFamily: "Syne, sans-serif", fontSize: 13,
          }}>Trends</button>
          <button onClick={() => setTabletTab("factors")} className="px-4 py-1.5 rounded-full transition-all" style={{
            background: tabletTab === "factors" ? "rgba(232,48,74,0.1)" : "transparent",
            color: tabletTab === "factors" ? c.red : c.bodySecondary,
            border: tabletTab === "factors" ? `1px solid rgba(232,48,74,0.3)` : `1px solid ${c.cardBorder}`,
            fontFamily: "Syne, sans-serif", fontSize: 13,
          }}>Risk Factors</button>
        </div>

        <div className="flex gap-6">

          {/* Left / Main Column */}
          <div className={`flex-1 min-w-0 flex flex-col gap-5 ${tabletTab === "factors" ? "hidden xl:flex" : ""}`}>
            
            {/* AI Summary Card */}
            <div style={{ ...bodyCard, padding: 24 }}>
              <p style={{ fontFamily: "Syne, sans-serif", fontSize: 16, lineHeight: 1.7, color: c.bodyText }}>
                {loading ? "Analyzing your long-term heart health trends..." : 
                 (summaries.length > 0 && summaries[0].summary 
                  ? summaries[0].summary 
                  : "We found cardiac data for this day. The AI indicates normal patterns for the duration worn.")}
              </p>
              <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} style={{ color: c.red }} />
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.bodySecondary }}>CardiShirt AI Summary</span>
                </div>
                <button onClick={() => setShareModalOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold hover:underline cursor-pointer" style={{ color: c.red, fontFamily: "Syne, sans-serif" }}>
                  <Share2 size={12} /> Share with doctor
                </button>
              </div>
            </div>

            {/* Health Score Trend Chart */}
            <div style={{ ...bodyCard, padding: 24 }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.bodyText }}>Health Score Trend</span>
                <button onClick={() => setChartType(chartType === "area" ? "bar" : "area")} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: c.bodySecondary }}>
                  {chartType === "area" ? <BarChart3 size={14} /> : <LineChartIcon size={14} />}
                </button>
              </div>
              <div style={{ height: 240, position: "relative" }}>
                {healthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "area" ? (
                      <AreaChart data={healthData}>
                        <defs>
                          <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={RISK_COLOR} stopOpacity={0.1} />
                            <stop offset="100%" stopColor={RISK_COLOR} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={c.gridLine} />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} domain={[30, 100]} />
                        <Tooltip contentStyle={tooltipLight} formatter={(v: number) => [Math.round(v), "Health Score"]} />
                        <Area type="monotone" dataKey="value" stroke={RISK_COLOR} strokeWidth={2} fill="url(#healthGrad)" dot={<CustomDot onDotClick={handleDotClick} />} />
                      </AreaChart>
                    ) : (
                      <BarChart data={healthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={c.gridLine} vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} domain={[30, 100]} />
                        <Tooltip contentStyle={tooltipLight} formatter={(v: number) => [Math.round(v), "Health Score"]} />
                        <Bar dataKey="value" fill={RISK_COLOR} radius={[3, 3, 0, 0]} maxBarSize={16} opacity={0.8} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-gray-500">
                    Awaiting server ingestion logs to build trends graph...
                  </div>
                )}
                {/* ── CHART EVENT MARKER TOOLTIP POPOVER ── */}
                {clickedEvent && (
                  <div
                    className="absolute z-30 p-3 rounded-lg shadow-lg border animate-slide-up"
                    style={{
                      left: Math.max(10, Math.min(clickedEvent.x - 100, 480)),
                      top: Math.max(5, clickedEvent.y - 110),
                      width: 200,
                      background: c.cardBg,
                      borderColor: c.cardBorder,
                      color: c.bodyText,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 9, color: c.bodyMuted }}>{clickedEvent.dateStr}</span>
                      <button onClick={() => setClickedEvent(null)} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded text-gray-400">
                        <X size={12} />
                      </button>
                    </div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 600, color: clickedEvent.color }}>
                      {clickedEvent.event.title}
                    </div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.bodySecondary, marginTop: 2, marginBottom: 6, lineHeight: 1.3 }}>
                      {clickedEvent.event.description}
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span style={{ fontFamily: "DM Mono, monospace", color: RISK_COLOR, fontWeight: 600 }}>Score: {clickedEvent.value}</span>
                      <button
                        onClick={() => {
                          navigate(`/cardiac-diary?date=${clickedEvent.dateStr}`);
                        }}
                        className="text-[#E8304A] hover:underline font-semibold"
                        style={{ fontFamily: "Syne, sans-serif" }}
                      >
                        View in diary
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {secondaryMetrics.map((m, i) => (
                <div key={m.name}>
                  <button onClick={() => setExpandedMetric(expandedMetric === i ? null : i)} className="w-full text-left hover:scale-[1.01] transition-all cursor-pointer" style={{ ...bodyCard, padding: 16 }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.bodySecondary }}>{m.name}</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 28, color: c.bodyText, fontWeight: 500 }}>{m.value}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.bodyMuted }}>{m.unit}</span>
                    </div>
                    <div className="my-2" style={{ height: 24 }}>
                      <MiniSparkline data={m.data.map(d => d.value)} color={m.statusColor} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: m.deltaColor }}>{m.delta}</span>
                      <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: m.statusColor }}>{m.status}</span>
                    </div>
                  </button>
                  {expandedMetric === i && (
                    <div className="sm:col-span-3 mt-2 animate-slide-down" style={{ ...bodyCard, padding: 16 }}>
                      <div style={{ height: 160 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={m.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke={c.gridLine} />
                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={tooltipLight} />
                            <Line type="monotone" dataKey="value" stroke={m.statusColor} strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Alert & Anomaly History Timeline */}
            <div style={{ ...bodyCard, padding: 20 }}>
              <div className="flex items-center justify-between mb-4">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.bodyText }}>Alert & Anomaly History</span>
                <span className="px-2 py-0.5 rounded-full" style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.bodySecondary, background: c.chipBg }}>{alertHistory.length}</span>
              </div>
              <div className="flex flex-col">
                {visibleAlerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 py-3" style={{ borderLeft: `3px solid ${a.color}`, paddingLeft: 12, borderBottom: i < visibleAlerts.length - 1 ? `1px solid ${c.cardBorder}` : "none" }}>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.bodySecondary }}>{a.date}</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.bodyText, fontWeight: 500 }}>{a.name}</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.bodySecondary }}>{a.duration}</div>
                    </div>
                    <button onClick={() => setActiveEcgAlert(a)} className="hover:underline cursor-pointer" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red, flexShrink: 0 }}>View ECG</button>
                  </div>
                ))}
              </div>
              {alertHistory.length > 5 && (
                <button onClick={() => setShowAllAlerts(!showAllAlerts)} className="mt-3 text-xs font-semibold hover:underline block" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red }}>
                  {showAllAlerts ? "Show fewer" : `Show all ${alertHistory.length} events`}
                </button>
              )}
            </div>

            {/* Comparison Panel */}
            <div style={{ ...bodyCard, padding: 20 }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.bodyText }}>Comparison Metrics</span>
                <div className="flex gap-1">
                  {(["personal", "baseline"] as const).map(m => (
                    <button key={m} onClick={() => setCompMode(m)} className="px-3 py-1 rounded-full hover:scale-105 transition-all" style={{
                      background: compMode === m ? "rgba(232,48,74,0.1)" : "transparent",
                      color: compMode === m ? c.red : c.bodySecondary,
                      border: compMode === m ? "1px solid rgba(232,48,74,0.3)" : `1px solid ${c.cardBorder}`,
                      fontFamily: "Syne, sans-serif", fontSize: 12,
                    }}>{m === "personal" ? "vs. Last Period" : "vs. Baseline"}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Resting HR", current: `${recentHr} BPM`, prev: compMode === "personal" ? "72 BPM" : "70 BPM", verdict: "Stable", verdictColor: c.green },
                  { name: "HRV (RMSSD)", current: "37 ms", prev: compMode === "personal" ? "44 ms" : "41 ms", verdict: "Watch", verdictColor: c.amber },
                  { name: "Rhythm Stability", current: "93%", prev: compMode === "personal" ? "95%" : "96%", verdict: "Same", verdictColor: c.bodySecondary },
                  { name: "Alerts/week", current: "2", prev: compMode === "personal" ? "1.2" : "1.5", verdict: "Watch", verdictColor: c.amber },
                ].map(m => (
                  <div key={m.name} className="p-3 rounded-lg border border-black/5 dark:border-white/5" style={{ background: c.surfaceBg }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.bodySecondary }}>{m.name}</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: c.bodyText, fontWeight: 500 }}>{m.current}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.bodyMuted }}>vs {m.prev}</span>
                    </div>
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: m.verdictColor, display: "block", marginTop: 2 }}>{m.verdict}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4" style={{ fontFamily: "Syne, sans-serif", fontSize: 14, lineHeight: 1.6, color: c.bodyText }}>
                {compMode === "personal"
                  ? "Your average heart rate is stable, but your physiological stress and alert frequencies require careful monitoring."
                  : "Overall metrics stay close to your baseline values. Physiological recovery rates indicate a slight latency."}
              </p>
              <div className="flex justify-end mt-3">
                <button onClick={() => setShareModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg hover:opacity-90 cursor-pointer" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>
                  <Share2 size={13} /> Share comparison report
                </button>
              </div>
            </div>

          </div>

          {/* Right Column / Sidebar */}
          <aside className="w-[320px] flex-shrink-0 hidden xl:block">
            <div className="sticky top-16">
              <div className="mb-4">
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.rightText }}>What's driving your score</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.rightSecondary }}>Based on {rangeLabels[range]} of data</div>
              </div>
              <RightPanelContent id="desktop" />
            </div>
          </aside>

          {/* Mobile factor tab content */}
          {tabletTab === "factors" && (
            <div className="flex-1 min-w-0 xl:hidden">
              <div className="mb-4">
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.rightText }}>What's driving your score</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.rightSecondary }}>Based on {rangeLabels[range]} of data</div>
              </div>
              <RightPanelContent id="mobile" />
            </div>
          )}

      </div>
    </div>

      {/* ── ECG WAVEFORM PLAYER MODAL ── */}
      {activeEcgAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl border" style={{ background: c.cardBg, borderColor: c.cardBorder }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${c.cardBorder}` }}>
              <div className="flex items-center gap-2">
                <Heart className="animate-pulse" style={{ color: "#E8304A" }} size={18} />
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 600, color: c.bodyText }}>
                  ECG Waveform Player
                </span>
              </div>
              <button onClick={() => setActiveEcgAlert(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer" style={{ color: c.bodySecondary }}>
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.bodyMuted }}>{activeEcgAlert.date}</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 600, color: c.bodyText, marginTop: 2 }}>{activeEcgAlert.name}</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.bodySecondary, marginTop: 1 }}>Duration: {activeEcgAlert.duration}</div>
              </div>

              <div className="rounded-lg overflow-hidden border" style={{ borderColor: c.cardBorder }}>
                <EcgWaveformPlayer type={activeEcgAlert.name.toLowerCase().includes("irregular") ? "irregular" : "normal"} />
              </div>

              <div className="flex items-center justify-between" style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: c.bodyMuted }}>
                <span>Lead II • Continuous Stream</span>
                <span>25 mm/s • 10 mm/mV</span>
              </div>
            </div>

            <div className="px-6 py-3 flex justify-end gap-2" style={{ borderTop: `1px solid ${c.cardBorder}`, background: c.chipBg }}>
              <button
                onClick={() => handlePrintEcgReport(activeEcgAlert)}
                className="px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 cursor-pointer"
                style={{ background: "transparent", border: `1px solid ${c.cardBorder}`, color: c.bodyText, fontFamily: "Syne, sans-serif" }}
              >
                Export PDF
              </button>
              <button
                onClick={() => setActiveEcgAlert(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 cursor-pointer"
                style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif" }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARE REPORT MODAL ── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl border" style={{ background: c.cardBg, borderColor: c.cardBorder }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${c.cardBorder}` }}>
              <div className="flex items-center gap-2">
                <Share2 style={{ color: "#E8304A" }} size={18} />
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 600, color: c.bodyText }}>
                  Share Cardiac Trend Report
                </span>
              </div>
              <button onClick={() => { setShareModalOpen(false); setCopyStatus(false); setDownloadStatus(false); }} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer" style={{ color: c.bodySecondary }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <p style={{ fontFamily: "Syne, sans-serif", fontSize: 13, lineHeight: 1.5, color: c.bodySecondary }}>
                Generate a secure, clinical-grade summary report of your cardiac trends for the past <strong>{rangeLabels[range]}</strong> to share with your physician or family.
              </p>

              {/* Report Preview card */}
              <div className="p-4 rounded-lg border flex flex-col gap-3" style={{ background: c.chipBg, borderColor: c.cardBorder }}>
                <div className="flex justify-between items-center">
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 600, color: c.bodyMuted }}>REPORT PREVIEW</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono" style={{ background: "rgba(39,194,138,0.15)", color: "#27C28A" }}>Ready</span>
                </div>
                
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 600, color: c.bodyText }}>
                  CardiShirt Trend Digest (Adnan)
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs" style={{ fontFamily: "DM Mono, monospace" }}>
                  <div>
                    <span style={{ color: c.bodyMuted }}>Period:</span> <span style={{ color: c.bodyText }}>{rangeLabels[range]}</span>
                  </div>
                  <div>
                    <span style={{ color: c.bodyMuted }}>Avg Score:</span> <span style={{ color: RISK_COLOR, fontWeight: 600 }}>{RISK_SCORE}</span>
                  </div>
                  <div>
                    <span style={{ color: c.bodyMuted }}>Vitals Quality:</span> <span style={{ color: "#27C28A" }}>98.2% NSR</span>
                  </div>
                  <div>
                    <span style={{ color: c.bodyMuted }}>Alerts Logged:</span> <span style={{ color: "#E8304A" }}>{alertHistory.length}</span>
                  </div>
                </div>
                
                <div className="text-[11px] italic" style={{ fontFamily: "Syne, sans-serif", color: c.bodySecondary }}>
                  "Includes 24h average Heart Rate, SpO2 stability metrics, and detailed anomaly timelines."
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={() => {
                    const simulatedLink = `https://cardishirt.care/report/adnan?range=${range}&token=9d2k84a`;
                    navigator.clipboard.writeText(simulatedLink);
                    setCopyStatus(true);
                    setTimeout(() => setCopyStatus(false), 2000);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  style={{
                    background: copyStatus ? "rgba(39,194,138,0.1)" : "transparent",
                    border: `1px solid ${copyStatus ? "#27C28A" : c.cardBorder}`,
                    color: copyStatus ? "#27C28A" : c.bodyText,
                    fontFamily: "Syne, sans-serif"
                  }}
                >
                  {copyStatus ? <CheckCircle size={16} /> : <Share2 size={16} />}
                  {copyStatus ? "Link Copied!" : "Copy Shareable Link"}
                </button>

                <button
                  onClick={() => {
                    setDownloadStatus(true);
                    setTimeout(() => {
                      setDownloadStatus(false);
                      handlePrintComparisonReport();
                    }, 1200);
                  }}
                  disabled={downloadStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-95 cursor-pointer"
                  style={{
                    background: "#E8304A",
                    fontFamily: "Syne, sans-serif",
                    opacity: downloadStatus ? 0.7 : 1
                  }}
                >
                  {downloadStatus ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  {downloadStatus ? "Generating PDF..." : "Download Clinical PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}