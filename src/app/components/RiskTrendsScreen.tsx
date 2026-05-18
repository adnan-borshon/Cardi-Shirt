import { useState, useRef, useEffect, useMemo } from "react";
import {
  TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp, Heart,
  Activity, AlertTriangle, Sparkles, Share2, FileText, MessageSquare,
  Shirt, Zap, Brain, Clock, Moon, BarChart3, LineChart as LineChartIcon,
  CheckCircle, Info
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import { useTheme } from "./ThemeContext";
import { useDailySummaries } from "./useBackend";

// ── Colors ──
function useColors() {
  const { theme } = useTheme();
  const d = theme === "dark";
  return {
    // Header zone (always dark-ish in light mode, full dark in dark mode)
    headerBg: d ? "#0D0F1A" : "#F4F5F9",
    headerCard: d ? "#141629" : "#FFFFFF",
    headerText: d ? "#F0F2FF" : "#0D0F1A",
    headerSecondary: d ? "#8890B8" : "#6B7499",
    headerMuted: d ? "#4A5070" : "#9AA0B8",
    headerBorder: d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    // Body zone
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
    // Right panel
    rightBg: d ? "#0D0F1A" : "#FFFFFF",
    rightCard: d ? "#141629" : "#F7F8FC",
    rightText: d ? "#F0F2FF" : "#0D0F1A",
    rightSecondary: d ? "#8890B8" : "#6B7499",
    ringTrack: d ? "rgba(100,120,200,0.1)" : "rgba(0,0,0,0.06)",
    // status
    red: "#E8304A",
    amber: "#F5A623",
    green: "#27C28A",
    blue: "#5B8AF0",
    d,
  };
}

// ── Mock Data ──
const RISK_SCORE=0;const RISK_TIER="Wait";const RISK_COLOR="#9AA0B8";const RISK_DELTA="0";const RISK_DELTA_COLOR="#9AA0B8";const last7=[0,0,0,0,0,0,0];const dayLabels=["Thu","Fri","Sat","Sun","Mon","Tue","Wed"];function genData(range:string,type:string){return[];}const eventMarkers:any[]=[];const alertHistory:any[]=[];const riskFactors:any[]=[];const donutData=[{name:"No Data",value:1,color:"#9AA0B8"}];

const recommendations = [
  { icon: Moon, action: "Rest this afternoon", context: "Your rhythm tends to be irregular on high-activity days." },
  { icon: Shirt, action: "Wear CardiShirt tonight", context: "Sleep HRV data would improve your score accuracy." },
  { icon: Share2, action: "Share this week's data", context: "Your score has been elevated for 5 days." },
];

// ── Ring Chart ──
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

// ── Sparkline mini ──
function MiniSparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
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

// ── Main Component ──
export function RiskTrendsScreen() {
  const c = useColors();

  const handleShare=(reportType:string)=>{try{navigator.clipboard.writeText(`${window.location.origin}/share/trends?type=${reportType}`);alert(`Successfully generated secure sharing link for ${reportType} report and copied it to your clipboard!`);}catch(e){alert("Failed to copy link. Please manually copy the report URL.");}};
  const { summaries, loading } = useDailySummaries();
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [expandedMetric, setExpandedMetric] = useState<number | null>(null);
  const [expandedFactor, setExpandedFactor] = useState<number | null>(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [compMode, setCompMode] = useState<"personal" | "baseline">("personal");
  const [showMobileFactors, setShowMobileFactors] = useState(false);
  const [tabletTab, setTabletTab] = useState<"trends" | "factors">("trends");

  const healthData = useMemo(() => genData(range, "health"), [range]);
  const hrData = useMemo(() => genData(range, "hr"), [range]);
  const hrvData = useMemo(() => genData(range, "hrv"), [range]);
  const rhythmData = useMemo(() => genData(range, "rhythm"), [range]);

  const tooltipDark = { background: "#141629", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", fontFamily: "DM Mono, monospace", fontSize: 11, color: "#F0F2FF" };
  const tooltipLight: React.CSSProperties = { background: c.cardBg, borderRadius: 8, border: `1px solid ${c.cardBorder}`, fontFamily: "DM Mono, monospace", fontSize: 11, color: c.bodyText };

  const bodyCard: React.CSSProperties = { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, boxShadow: c.shadow };

  const ranges: ("7d" | "30d" | "90d" | "1y")[] = ["7d", "30d", "90d", "1y"];
  const rangeLabels: Record<string, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days", "1y": "1 year" };

  const secondaryMetrics = [
    { name: "Heart Rate", value: "0", unit: "BPM", delta: "0 BPM", deltaColor: c.bodySecondary, status: "No data", statusColor: c.bodySecondary, data: [] },
    { name: "SpO2", value: "0", unit: "%", delta: "0 %", deltaColor: c.bodySecondary, status: "No data", statusColor: c.bodySecondary, data: [] },
    { name: "Temperature", value: "0", unit: "°C", delta: "0 °C", deltaColor: c.bodySecondary, status: "No data", statusColor: c.bodySecondary, data: [] },
  ];

  const visibleAlerts = showAllAlerts ? alertHistory : alertHistory.slice(0, 5);

  // ── Right Panel Content (reused in mobile expandable) ──
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
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 32, color: c.rightText }}>{RISK_SCORE}</span>
          </div>
        </div>
      </div>

      {/* Factor List */}
      <div className="flex flex-col gap-2">
        {riskFactors.map((f, i) => (
          <div key={f.name} style={{ background: c.rightCard, border: `1px solid ${c.cardBorder}`, borderRadius: 10, overflow: "hidden" }}>
            <button onClick={() => setExpandedFactor(expandedFactor === i ? null : i)} className="w-full px-4 py-3 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.rightText }}>{f.name}</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: f.color }}>
                  {f.contribution > 0 ? `+${f.contribution}` : f.contribution === 0 ? "—" : f.contribution}
                </span>
              </div>
              {f.status !== "neutral" ? (
                <div className="relative h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: c.ringTrack }}>
                  {f.status === "positive" && (
                    <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.min(100, 50 + f.contribution * 5)}%`, background: f.color }} />
                  )}
                  {f.status === "negative" && (
                    <div className="absolute right-0 top-0 h-full rounded-full" style={{ width: `${Math.min(100, 50 + Math.abs(f.contribution) * 5)}%`, background: f.color }} />
                  )}
                </div>
              ) : (
                <button onClick={() => handleShare("trends")} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg w-full transition-colors mb-1.5 active:scale-95" style={{ background: c.blue, color: "#fff" }}>
                  <Share2 size={16} />
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500 }}>Share trend report</span>
                </button>
              )}
              <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.rightSecondary }}>{f.desc}</span>
            </button>
            {expandedFactor === i && (
              <div className="px-4 pb-3 flex flex-col gap-2">
                <MiniSparkline data={f.sparkData} color={f.color} width={240} height={32} />
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 13, lineHeight: 1.6, color: c.rightSecondary }}>{f.detail}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recommendation Strip */}
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

      {/* ═══════ DARK HEADER ZONE ═══════ */}
      <div style={{ background: c.headerBg, borderBottom: `1px solid ${c.headerBorder}` }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 pb-0">

          {/* Risk Score Hero */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 justify-center pb-5">
            {/* Ring */}
            <div className="relative flex items-center justify-center flex-shrink-0">
              <RingChart score={RISK_SCORE} color={RISK_COLOR} trackColor={c.d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"} />
              <span className="absolute" style={{ fontFamily: "DM Mono, monospace", fontSize: 20, color: RISK_COLOR }}>{RISK_SCORE}</span>
            </div>

            {/* Score + label */}
            <div className="text-center sm:text-left">
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.headerSecondary }}>CardiShirt Risk Score</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 72, lineHeight: 1, color: RISK_COLOR }}>{RISK_SCORE}</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.headerSecondary }}>Today</div>
            </div>

            {/* 7-day sparkline */}
            <div className="flex-shrink-0 hidden md:block">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} style={{ color: RISK_DELTA_COLOR }} />
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: RISK_DELTA_COLOR }}>{RISK_DELTA} points</span>
              </div>
              <MiniSparkline data={last7} color={RISK_COLOR} width={120} height={36} />
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.headerSecondary }}>vs. last week</div>
            </div>
          </div>

          {/* AI Status Statement */}
          <p className="text-center pb-4" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: c.headerText, maxWidth: 600, margin: "0 auto" }}>
            Your score has been slightly elevated since Thursday. We've flagged three factors worth reviewing below.
          </p>

          {/* ── Time Range Selector (sticky) ── */}
          <div className="sticky top-0 z-20 flex justify-center gap-2 py-3" style={{ background: c.headerBg }}>
            {ranges.map(r => (
              <button key={r} onClick={() => setRange(r)} className="px-4 py-1.5 rounded-full transition-colors" style={{
                background: range === r ? c.red : "transparent",
                color: range === r ? "#fff" : c.headerSecondary,
                border: range === r ? "none" : `0.5px solid ${c.d ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                fontFamily: "Syne, sans-serif", fontSize: 13,
              }}>{rangeLabels[r]}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ BODY + RIGHT PANEL LAYOUT ═══════ */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">

        {/* Tablet tab toggle */}
        <div className="flex xl:hidden mb-4 gap-2">
          <button onClick={() => setTabletTab("trends")} className="px-4 py-1.5 rounded-full" style={{
            background: tabletTab === "trends" ? "rgba(232,48,74,0.1)" : "transparent",
            color: tabletTab === "trends" ? c.red : c.bodySecondary,
            border: tabletTab === "trends" ? `1px solid rgba(232,48,74,0.3)` : `1px solid ${c.cardBorder}`,
            fontFamily: "Syne, sans-serif", fontSize: 13,
          }}>Trends</button>
          <button onClick={() => setTabletTab("factors")} className="px-4 py-1.5 rounded-full" style={{
            background: tabletTab === "factors" ? "rgba(232,48,74,0.1)" : "transparent",
            color: tabletTab === "factors" ? c.red : c.bodySecondary,
            border: tabletTab === "factors" ? `1px solid rgba(232,48,74,0.3)` : `1px solid ${c.cardBorder}`,
            fontFamily: "Syne, sans-serif", fontSize: 13,
          }}>Risk Factors</button>
        </div>

        <div className="flex gap-6">

          {/* ── Center Column ── */}
          <div className={`flex-1 min-w-0 flex flex-col gap-5 ${tabletTab === "factors" ? "hidden xl:flex" : ""}`}>

            {/* AI Trend Narrative Card */}
            <div style={{ ...bodyCard, padding: 24 }}>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, lineHeight: 1.7, color: c.bodyText }}>
                {loading ? "Analyzing your long-term heart health trends..." : 
                 (summaries.length > 0 && summaries[0].summary 
                  ? summaries[0].summary 
                  : "Gathering enough data to generate your first AI summary. Please wait until the next summary cycle (08:00 or 20:00).")}
              </p>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} style={{ color: c.red }} />
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.bodySecondary }}>CardiShirt AI</span>
                  <div className="flex gap-0.5 ml-1">
                    {[1, 2, 3, 4, 5].map(i => <div key={`conf-${i}`} className="w-1 h-1 rounded-full" style={{ background: i <= 4 ? c.red : c.cardBorder }} />)}
                  </div>
                </div>
                <button onClick={() => handleShare("trends")} className="flex items-center gap-1 ml-auto active:scale-95 transition-all" style={{ color: c.red, fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                  <Share2 size={12} /> Share with doctor
                </button>
              </div>
            </div>

            {/* Primary Trend Chart */}
            <div style={{ ...bodyCard, padding: 24 }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.bodyText }}>Health Score Trend</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {[
                      { color: c.red, label: "Alert" },
                      { color: c.amber, label: "Anomaly" },
                      { color: c.blue, label: "Doctor" },
                      { color: "#F97316", label: "Symptom" },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 10, color: c.bodyMuted }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setChartType(chartType === "area" ? "bar" : "area")} className="p-1 rounded" style={{ color: c.bodySecondary }}>
                    {chartType === "area" ? <BarChart3 size={14} /> : <LineChartIcon size={14} />}
                  </button>
                </div>
              </div>
              <div style={{ height: 240 }}>
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
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(healthData.length / 8))} />
                      <YAxis tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} domain={[30, 100]} />
                      <Tooltip contentStyle={tooltipLight} formatter={(v: number) => [Math.round(v), "Health Score"]} />
                      <ReferenceLine y={65} stroke={c.bodyMuted} strokeDasharray="4 4" strokeWidth={0.5} label={{ value: "30d avg", position: "right", fontSize: 8, fill: c.bodyMuted }} />
                      <Area type="monotone" dataKey="value" stroke={RISK_COLOR} strokeWidth={2} fill="url(#healthGrad)" dot={false} />
                    </AreaChart>
                  ) : (
                    <BarChart data={healthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={c.gridLine} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(healthData.length / 8))} />
                      <YAxis tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} domain={[30, 100]} />
                      <Tooltip contentStyle={tooltipLight} formatter={(v: number) => [Math.round(v), "Health Score"]} />
                      <Bar dataKey="value" fill={RISK_COLOR} radius={[3, 3, 0, 0]} maxBarSize={16} opacity={0.8} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Secondary Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {secondaryMetrics.map((m, i) => (
                <div key={m.name}>
                  <button onClick={() => setExpandedMetric(expandedMetric === i ? null : i)} className="w-full text-left" style={{ ...bodyCard, padding: 16 }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.bodySecondary }}>{m.name}</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 28, color: c.bodyText }}>{m.value}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.bodyMuted }}>{m.unit}</span>
                    </div>
                    <div className="my-2" style={{ height: 24 }}>
                      <MiniSparkline data={m.data.slice(-7).map(d => d.value)} color={m.statusColor} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: m.deltaColor }}>{m.delta}</span>
                      <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: m.statusColor }}>{m.status}</span>
                    </div>
                    {m.isBar && (
                      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: c.chipBg }}>
                        <div className="h-full rounded-full" style={{ width: `${m.value}%`, background: m.statusColor }} />
                      </div>
                    )}
                  </button>
                  {expandedMetric === i && (
                    <div className="sm:col-span-3 mt-2" style={{ ...bodyCard, padding: 16 }}>
                      <div style={{ height: 160 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={m.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke={c.gridLine} />
                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.bodyMuted, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(m.data.length / 8))} />
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

            {/* Wearing Consistency Panel */}
            <div style={{ ...bodyCard, padding: 20, background: c.d ? c.cardBg : "rgba(39,194,138,0.03)" }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 500, color: c.bodyText }}>Wearing Consistency</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: c.bodyText }}>87%</span>
              </div>
              {/* Coverage bar */}
              <div className="flex gap-0.5 h-3 rounded-full overflow-hidden mb-3">
                {Array.from({ length: 30 }, (_, i) => {
                  const worn = i < 26;
                  const partial = i === 26 || i === 27;
                  return <div key={i} className="flex-1 rounded-sm" style={{ background: worn ? c.green : partial ? "rgba(39,194,138,0.4)" : c.chipBg, opacity: worn ? 1 : partial ? 0.6 : 0.4 }} />;
                })}
              </div>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: c.bodySecondary, lineHeight: 1.6 }}>
                Your data coverage this month is 87% — this is enough for a reliable risk assessment.{" "}
                <span style={{ color: c.red, cursor: "pointer" }}>Improve your coverage</span>
              </p>
            </div>

            {/* Alert History Timeline */}
            <div style={{ ...bodyCard, padding: 20 }}>
              <div className="flex items-center justify-between mb-4">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.bodyText }}>Alert & anomaly history</span>
                <span className="px-2 py-0.5 rounded-full" style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.bodySecondary, background: c.chipBg }}>{alertHistory.length}</span>
              </div>
              <div className="flex flex-col">
                {visibleAlerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 py-3" style={{ borderLeft: `3px solid ${a.color}`, paddingLeft: 12, borderBottom: i < visibleAlerts.length - 1 ? `1px solid ${c.cardBorder}` : "none" }}>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: c.bodySecondary }}>{a.date}</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.bodyText }}>{a.name}</div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.bodySecondary }}>{a.duration}</div>
                    </div>
                    <button style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red, flexShrink: 0 }}>View ECG</button>
                  </div>
                ))}
              </div>
              {alertHistory.length > 5 && (
                <button onClick={() => setShowAllAlerts(!showAllAlerts)} className="mt-3" style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.red }}>
                  {showAllAlerts ? "Show fewer" : `Show all ${alertHistory.length} events`}
                </button>
              )}
            </div>

            {/* Comparison Panel */}
            <div style={{ ...bodyCard, padding: 20 }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.bodyText }}>Comparison</span>
                <div className="flex gap-1">
                  {(["personal", "baseline"] as const).map(m => (
                    <button key={m} onClick={() => setCompMode(m)} className="px-3 py-1 rounded-full" style={{
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
                  { name: "Resting HR", current: "68 BPM", prev: compMode === "personal" ? "72 BPM" : "70 BPM", verdict: "Better", vColor: c.green },
                  { name: "HRV", current: "37 ms", prev: compMode === "personal" ? "44 ms" : "41 ms", verdict: "Watch", vColor: c.amber },
                  { name: "Rhythm", current: "93%", prev: compMode === "personal" ? "95%" : "96%", verdict: "Same", vColor: c.bodySecondary },
                  { name: "Alerts/wk", current: "2", prev: compMode === "personal" ? "1.2" : "1.5", verdict: "Watch", vColor: c.amber },
                ].map(m => (
                  <div key={m.name} className="p-3 rounded-lg" style={{ background: c.surfaceBg }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: c.bodySecondary }}>{m.name}</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 16, color: c.bodyText }}>{m.current}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: c.bodyMuted }}>vs {m.prev}</span>
                    </div>
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: m.vColor }}>{m.verdict}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, lineHeight: 1.6, color: c.bodyText }}>
                {compMode === "personal"
                  ? "Your resting heart rate is improving, but your HRV and alert frequency need attention compared to last month."
                  : "You are close to your personal baseline on most metrics. HRV is the main area trailing your established normal range."}
              </p>
              <div className="flex justify-end mt-3">
                <button onClick={() => handleShare("comparison")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg active:scale-95 transition-all" style={{ background: c.red, color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 13 }}>
                  <Share2 size={13} /> Share comparison report
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Panel (desktop) ── */}
          <aside className={`w-[320px] flex-shrink-0 hidden xl:block ${tabletTab === "trends" ? "" : ""}`}>
            <div className="sticky top-0">
              <div className="mb-4">
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.rightText }}>What's driving your score</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.rightSecondary }}>Based on {rangeLabels[range]} of data</div>
              </div>
              <RightPanelContent id="desktop" />
            </div>
          </aside>

          {/* ── Tablet/Mobile factors tab ── */}
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