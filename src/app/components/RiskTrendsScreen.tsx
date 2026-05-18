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

export function RiskTrendsScreen() {
  const c = useColors();
  const { summaries, loading } = useDailySummaries();
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [expandedMetric, setExpandedMetric] = useState<number | null>(null);
  const [expandedFactor, setExpandedFactor] = useState<number | null>(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [compMode, setCompMode] = useState<"personal" | "baseline">("personal");
  const [tabletTab, setTabletTab] = useState<"trends" | "factors">("trends");
  const [apiData, setApiData] = useState<any[]>([]);

  useEffect(()=>{
    fetch(`${API_URL}/api/trends?range=${range}`)
      .then(res=>res.json())
      .then(d=>setApiData(Array.isArray(d)?d:[]))
      .catch(e=>console.error("[Trends]",e));
  },[range]);

  const {healthData,hrData,spo2Data,tempData,RISK_SCORE,RISK_COLOR,last7}=useMemo(()=>{
    if(apiData.length===0)return{healthData:[],hrData:[],spo2Data:[],tempData:[],RISK_SCORE:0,RISK_COLOR:c.bodyMuted,last7:[]};
    let totalScore=0;
    const hData=apiData.map(d=>{
      const s=Math.round(Math.max(40,Math.min(100,100-Math.abs(75-d.avgBpm)+(d.avgSpo2-95)*3)));
      totalScore+=s;
      return{label:d.day.substring(5),value:s};
    });
    const avgScore=Math.round(totalScore/apiData.length);
    const color=avgScore>=75?c.green:avgScore>=40?c.amber:c.red;
    const l7=hData.slice(-7).map(x=>x.value);
    return {
      healthData:hData,
      hrData:apiData.map(d=>({label:d.day.substring(5),value:d.avgBpm})),
      spo2Data:apiData.map(d=>({label:d.day.substring(5),value:d.avgSpo2})),
      tempData:apiData.map(d=>({label:d.day.substring(5),value:d.avgTemp})),
      RISK_SCORE:avgScore,
      RISK_COLOR:color,
      last7:l7.length>0?l7:[0]
    };
  },[apiData,c]);

  const recentHr=hrData.length?hrData[hrData.length-1].value:0;
  const recentSpo2=spo2Data.length?spo2Data[spo2Data.length-1].value:0;
  const recentTemp=tempData.length?tempData[tempData.length-1].value:0;

  const secondaryMetrics = [
    { name: "Heart Rate", value: recentHr.toString(), unit: "BPM", delta: "Normal", deltaColor: c.green, status: "Stable", statusColor: c.green, data: hrData },
    { name: "SpO2", value: recentSpo2.toString(), unit: "%", delta: "Normal", deltaColor: c.green, status: "Good", statusColor: c.green, data: spo2Data },
    { name: "Temperature", value: recentTemp.toString(), unit: "°C", delta: "Normal", deltaColor: c.green, status: "Stable", statusColor: c.green, data: tempData },
  ];

  const RISK_DELTA=last7.length>1?Math.round(last7[last7.length-1]-last7[0]):0;
  const RISK_DELTA_COLOR=RISK_DELTA>0?c.green:RISK_DELTA<0?c.red:c.bodySecondary;
  const riskFactors=[
    {name:"Resting HR",contribution:2,color:c.green,status:"positive",desc:"Slightly lower than usual",detail:"Your resting heart rate is consistently lower, indicating good cardiovascular adaptation.",sparkData:last7},
    {name:"SpO2 Consistency",contribution:0,color:c.bodySecondary,status:"neutral",desc:"Stable oxygenation",detail:"Your SpO2 levels are well maintained overnight and during the day.",sparkData:last7},
    {name:"Temperature Anomaly",contribution:-1,color:c.amber,status:"negative",desc:"Slightly elevated yesterday",detail:"We noticed a brief spike in skin temperature yesterday afternoon.",sparkData:last7}
  ];
  const donutData=[{name:"Score",value:RISK_SCORE,color:RISK_COLOR},{name:"Rest",value:100-RISK_SCORE,color:c.ringTrack}];

  const handleShare=(t:string)=>alert(`Shared ${t} report!`);
  const tooltipLight: React.CSSProperties = { background: c.cardBg, borderRadius: 8, border: `1px solid ${c.cardBorder}`, fontFamily: "DM Mono, monospace", fontSize: 11, color: c.bodyText };
  const bodyCard: React.CSSProperties = { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, boxShadow: c.shadow };
  const ranges: ("7d" | "30d" | "90d" | "1y")[] = ["7d", "30d", "90d", "1y"];
  const rangeLabels: Record<string, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days", "1y": "1 year" };

  const RightPanelContent = ({ id }: { id: string }) => (
    <div className="flex flex-col gap-5">
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
              <div className="relative h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: c.ringTrack }}>
                <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.min(100, 50 + f.contribution * 5)}%`, background: f.color }} />
              </div>
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
      <div style={{ background: c.headerBg, borderBottom: `1px solid ${c.headerBorder}` }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 pb-0">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 justify-center pb-5">
            <div className="relative flex items-center justify-center flex-shrink-0">
              <RingChart score={RISK_SCORE} color={RISK_COLOR} trackColor={c.d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"} />
              <span className="absolute" style={{ fontFamily: "DM Mono, monospace", fontSize: 20, color: RISK_COLOR }}>{RISK_SCORE}</span>
            </div>
            <div className="text-center sm:text-left">
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: c.headerSecondary }}>CardiShirt Risk Score</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 72, lineHeight: 1, color: RISK_COLOR }}>{RISK_SCORE}</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.headerSecondary }}>Today</div>
            </div>
            <div className="flex-shrink-0 hidden md:block">
              <div className="flex items-center gap-2 mb-1">
                {RISK_DELTA>=0?<TrendingUp size={14} style={{ color: RISK_DELTA_COLOR }} />:<TrendingDown size={14} style={{ color: RISK_DELTA_COLOR }} />}
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: RISK_DELTA_COLOR }}>{Math.abs(RISK_DELTA)} points</span>
              </div>
              <MiniSparkline data={last7} color={RISK_COLOR} width={120} height={36} />
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.headerSecondary }}>vs. last week</div>
            </div>
          </div>
          <p className="text-center pb-4" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: c.headerText, maxWidth: 600, margin: "0 auto" }}>
            Based on {apiData.length} days of data, your trend is {RISK_DELTA>=0?"improving":"declining"}. We've highlighted key factors.
          </p>
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
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
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
          <div className={`flex-1 min-w-0 flex flex-col gap-5 ${tabletTab === "factors" ? "hidden xl:flex" : ""}`}>
            <div style={{ ...bodyCard, padding: 24 }}>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, lineHeight: 1.7, color: c.bodyText }}>
                {loading ? "Analyzing your long-term heart health trends..." : 
                 (summaries.length > 0 && summaries[0].summary 
                  ? summaries[0].summary 
                  : "AI summary unavailable. Please wait for the next cycle.")}
              </p>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} style={{ color: c.red }} />
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: c.bodySecondary }}>CardiShirt AI</span>
                </div>
              </div>
            </div>
            <div style={{ ...bodyCard, padding: 24 }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500, color: c.bodyText }}>Health Score Trend</span>
                <button onClick={() => setChartType(chartType === "area" ? "bar" : "area")} className="p-1 rounded" style={{ color: c.bodySecondary }}>
                  {chartType === "area" ? <BarChart3 size={14} /> : <LineChartIcon size={14} />}
                </button>
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
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.bodyMuted }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: c.bodyMuted }} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipLight} />
                      <Area type="monotone" dataKey="value" stroke={RISK_COLOR} strokeWidth={2} fill="url(#healthGrad)" dot={false} />
                    </AreaChart>
                  ) : (
                    <BarChart data={healthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={c.gridLine} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.bodyMuted }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: c.bodyMuted }} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipLight} />
                      <Bar dataKey="value" fill={RISK_COLOR} radius={[3, 3, 0, 0]} maxBarSize={16} opacity={0.8} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
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
                  </button>
                  {expandedMetric === i && (
                    <div className="sm:col-span-3 mt-2" style={{ ...bodyCard, padding: 16 }}>
                      <div style={{ height: 160 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={m.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke={c.gridLine} />
                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.bodyMuted }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: c.bodyMuted }} tickLine={false} axisLine={false} />
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
          </div>
          <aside className={`w-[320px] flex-shrink-0 hidden xl:block ${tabletTab === "trends" ? "" : ""}`}>
            <div className="sticky top-0">
              <div className="mb-4">
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: c.rightText }}>What's driving your score</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 13, color: c.rightSecondary }}>Based on {rangeLabels[range]} of data</div>
              </div>
              <RightPanelContent id="desktop" />
            </div>
          </aside>
          {tabletTab === "factors" && (
          <div className="flex-1 min-w-0 xl:hidden">
            <RightPanelContent id="mobile" />
          </div>
          )}
        </div>
      </div>
    </div>
  );
}