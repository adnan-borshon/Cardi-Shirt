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
import { useTheme } from "./ThemeContext";
import { useDailySummaries, API_URL } from "./useBackend";

function useColors() {
  const { theme } = useTheme();
  const d = theme === "dark";
  return {
    headerBg: d ? "#0D0F1A" : "#F4F5F9",
    headerCard: d ? "#141629" : "#FFFFFF",
    headerText: d ? "#F0F2FF" : "#0D0F1A",
    headerSecondary: d ? "#8890B8" : "#6B7499",
    headerMuted: d ? "#4A5070" : "#9AA0B8",
    headerBorder: d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    bodyBg: d ? "#0D0F1A" : "#FFFFFF",
    cardBg: d ? "#141629" : "#F7F8FC",
    cardBorder: d ? "rgba(100,120,200,0.15)" : "rgba(0,0,0,0.08)",
    bodyText: d ? "#F0F2FF" : "#0D0F1A",
    bodySecondary: d ? "#8890B8" : "#6B7499",
    bodyMuted: d ? "#4A5070" : "#9AA0B8",
    gridLine: d ? "rgba(100,120,200,0.06)" : "rgba(0,0,0,0.06)",
    shadow: d ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
    chipBg: d ? "#1A1D35" : "#F3F4F6",
    surfaceBg: d ? "#1A1D35" : "#F7F8FC",
    rightBg: d ? "#0D0F1A" : "#FFFFFF",
    rightCard: d ? "#141629" : "#F7F8FC",
    rightText: d ? "#F0F2FF" : "#0D0F1A",
    rightSecondary: d ? "#8890B8" : "#6B7499",
    ringTrack: d ? "rgba(100,120,200,0.1)" : "rgba(0,0,0,0.06)",
    red: "#E8304A", amber: "#F5A623", green: "#27C28A", blue: "#5B8AF0", d,
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

  useEffect(() => {
    fetch(`${API_URL}/api/trends?range=${range}`)
      .then(res => res.json())
      .then(d => setApiData(Array.isArray(d) ? d : []))
      .catch(e => console.error("[Trends]", e));
  }, [range]);

  const { healthData, hrData, spo2Data, tempData, RISK_SCORE, RISK_COLOR, last7 } = useMemo(() => {
    let rawData = apiData;
    let isMock = false;
    if (apiData.length === 0) {
      rawData = generateMockTrendsData(range);
      isMock = true;
    }

    let totalScore = 0;
    const hData = rawData.map((d, index) => {
      if (isMock) {
        totalScore += d.value;
        return d;
      }
      
      const bpmVal = d.avgBpm || 72;
      const spo2Val = d.avgSpo2 || 97;
      const s = Math.round(Math.max(40, Math.min(100, 100 - Math.abs(72 - bpmVal) - Math.max(0, 95 - spo2Val) * 4)));
      totalScore += s;
      
      let event: any = undefined;
      const dateStr = d.day;
      const dayLabel = d.day.substring(5);
      
      if (range === "7d") {
        if (index === 2) event = { type: "anomaly", title: "Elevated resting HR", description: "32 minutes above baseline during afternoon" };
        else if (index === 5) event = { type: "alert", title: "Irregular rhythm episode", description: "42 seconds, self-resolved at 2:14 PM" };
      } else if (range === "30d") {
        if (index === 9) event = { type: "symptom", title: "Symptom: mild fatigue", description: "Logged by patient at 6:00 PM" };
        else if (index === 14) event = { type: "alert", title: "ST segment deviation", description: "+0.8 mV detected during mild exertion" };
        else if (index === 21) event = { type: "visit", title: "Report Shared", description: "Weekly trend data shared with Dr. Adnan" };
        else if (index === 27) event = { type: "anomaly", title: "Afternoon rhythm variation", description: "Brief variation, within normal range" };
      } else if (range === "90d") {
        if (index === 20) event = { type: "alert", title: "Irregular rhythm episode", description: "35 seconds, self-resolved" };
        else if (index === 45) event = { type: "visit", title: "Report Shared", description: "Monthly report shared with Dr. Adnan" };
        else if (index === 70) event = { type: "anomaly", title: "HRV drop below baseline", description: "Low sleep quality noted" };
      } else if (range === "1y") {
        if (index === Math.round(rawData.length / 4)) event = { type: "alert", title: "Irregular rhythm episode", description: "55 seconds, self-resolved" };
        else if (index === Math.round(rawData.length / 2)) event = { type: "visit", title: "Doctor Review", description: "Data reviewed at cardiology clinic" };
      }

      return {
        label: dayLabel,
        value: s,
        dateStr,
        event
      };
    });

    const avgScore = rawData.length ? Math.round(totalScore / rawData.length) : 73;
    const color = avgScore >= 78 ? c.green : avgScore >= 60 ? c.amber : c.red;
    const l7 = hData.slice(-7).map(x => x.value);
    
    return {
      healthData: hData,
      hrData: rawData.map(d => ({ label: d.day.substring(5), value: d.avgBpm || 72 })),
      spo2Data: rawData.map(d => ({ label: d.day.substring(5), value: d.avgSpo2 || 98 })),
      tempData: rawData.map(d => ({ label: d.day.substring(5), value: d.avgTemp || 36.6 })),
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

  const visibleAlerts = showAllAlerts ? alertHistory : alertHistory.slice(0, 5);

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
            <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: c.rightCard, border: `1px solid ${c.cardBorder}` }}>
              <r.icon size={16} style={{ color: c.red, marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.rightText }}>{r.action}</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.rightSecondary }}>{r.context}</div>
              </div>
            </div>
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
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} style={{ color: c.red }} />
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.bodySecondary }}>CardiShirt AI Summary</span>
                </div>
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
              <div style={{ height: 240 }}>
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
                        <Area type="monotone" dataKey="value" stroke={RISK_COLOR} strokeWidth={2} fill="url(#healthGrad)" dot={false} />
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
                    <button className="hover:underline" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red, flexShrink: 0 }}>View ECG</button>
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
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg hover:opacity-90" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>
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
    </div>
  );
}