import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Search, Filter, Share2, Download, FileText, MessageSquare, Play, Pause,
  ZoomIn, ZoomOut, ToggleLeft, ToggleRight, ChevronRight, Heart, Activity,
  Clock, Sparkles, Copy, X, Loader2
} from "lucide-react";
import { useTokens } from "./ThemeContext";
import { useECGRecords, API_URL } from "./useBackend";

// --- Mock Data ---
type SessionType = "continuous" | "manual" | "alert" | "doctor";
interface Session {
  id: string;
  date: string;
  dateGroup: string;
  time: string;
  type: SessionType;
  duration: string;
  hrRange: string;
  aiStatus: "normal" | "anomaly" | "alert";
  aiStatusText: string;
  shared: boolean;
}

const sessions: Session[] = [];

const typeColors: Record<SessionType, string> = { continuous: "#27C28A", manual: "#E8304A", alert: "#F5A623", doctor: "#4A90D9" };
const filterChips = ["All", "Flagged", "Normal", "Doctor Shared", "Manual"];

// Base ECG template for Lead II (most prominent)
const ECG_TEMPLATE_LEAD_II = [0, 0, 0, 0, 0, 0.02, 0.04, 0.02, 0, -0.02, 0, 0, 0.05, 0.1, 0.15, 0.08, -0.4, 1.0, -0.3, -0.1, 0.05, 0.1, 0.15, 0.2, 0.22, 0.2, 0.15, 0.1, 0.05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// Lead I template (moderate amplitude)
const ECG_TEMPLATE_LEAD_I = [0, 0, 0, 0, 0, 0.01, 0.03, 0.01, 0, -0.01, 0, 0, 0.04, 0.08, 0.12, 0.06, -0.25, 0.7, -0.2, -0.08, 0.04, 0.08, 0.12, 0.15, 0.16, 0.15, 0.12, 0.08, 0.04, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// Lead III template (smaller amplitude)
const ECG_TEMPLATE_LEAD_III = [0, 0, 0, 0, 0, 0.01, 0.01, 0.01, 0, -0.01, 0, 0, 0.01, 0.02, 0.03, 0.02, -0.15, 0.3, -0.1, -0.02, 0.01, 0.02, 0.03, 0.05, 0.06, 0.05, 0.03, 0.02, 0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const LEAD_TEMPLATES = [ECG_TEMPLATE_LEAD_I, ECG_TEMPLATE_LEAD_II, ECG_TEMPLATE_LEAD_III];

const leads3 = ["I", "II", "III"];

const detectedEvents: any[] = [];

export function ECGRecordsScreen() {
  const tk = useTokens();
  const {records:backendRecords,loading:backendLoading,refetch}=useECGRecords();

  // Merge backend records into session list
  const backendSessions:Session[]=useMemo(()=>backendRecords.map((r,i)=>{
    const d=new Date(r.timestamp);
    const dateStr=d.toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric"});
    const timeStr=d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
    const wf=r.waveform_data||[];
    const vals=wf.filter(v=>typeof v==="number");
    const minV=vals.length?Math.min(...vals):0;
    const maxV=vals.length?Math.max(...vals):0;
    return{
      id:`backend-${r.id}`,
      dateGroup:"From Device",
      date:dateStr,
      time:timeStr,
      type:"manual" as SessionType,
      duration:`${wf.length} samples`,
      hrRange:`${minV.toFixed(1)}–${maxV.toFixed(1)} mV`,
      aiStatus:(r.ai_summary&&!r.ai_summary.includes("unavailable")?"normal":"anomaly") as Session["aiStatus"],
      aiStatusText:r.ai_summary&&!r.ai_summary.includes("unavailable")?"AI analyzed":"Pending",
      shared:false,
      _backendId:r.id,
      _aiSummary:r.ai_summary||"",
      _waveform:wf,
    };
  }),[backendRecords]) as any[];

  const allSessions=useMemo(()=>backendSessions,[backendSessions]);
  const [activeSession, setActiveSession] = useState<any>(null);
  useEffect(()=>{if(allSessions.length>0&&!activeSession)setActiveSession(allSessions[0]);},[allSessions]);
  const selectedSession=useMemo(()=>{
    if(!activeSession)return allSessions[0]||{date:"No data",time:"",duration:"",type:"manual",hrRange:"",aiStatus:"normal",aiStatusText:"",shared:false};
    const found=allSessions.find(s=>s.id===activeSession.id);
    return found||activeSession;
  },[activeSession,allSessions]);

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [speed, setSpeed] = useState<"25" | "50">("25");
  const [gain, setGain] = useState<"0.5" | "1" | "2">("1");
  const [playing, setPlaying] = useState(false);
  const [doctorNote, setDoctorNote] = useState("");
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  const handleAnalyze=async(recordId:number)=>{
    if(analyzingId!==null)return;
    setAnalyzingId(recordId);
    try{
      const res=await fetch(`${API_URL}/api/analyze-ecg`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:recordId})
      });
      if(res.ok){
        await refetch();
      }else{
        alert("Analysis failed");
      }
    }catch(e){
      console.error(e);
    }finally{
      setAnalyzingId(null);
    }
  };
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const offsetRef = useRef(0);
  const animRef = useRef(0);

  const statusColors = { normal: "#27C28A", anomaly: "#F5A623", alert: "#E8304A" };

  const drawLeadECG = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, leadIdx: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = tk.ecgBg;
    ctx.fillRect(0, 0, w, h);

    // Grid
    const small = 4 * (speed === "50" ? 2 : 1);
    ctx.strokeStyle = tk.ecgGrid;
    ctx.lineWidth = 0.3;
    for (let x = 0; x < w; x += small) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += small) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = tk.ecgGridMajor;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += small * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += small * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // ECG line
    const gainMult = gain === "0.5" ? 0.5 : gain === "2" ? 2 : 1;
    ctx.strokeStyle = tk.textPrimary;
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";
    ctx.beginPath();
    const phaseShift = leadIdx * 7;
    const amplitude = (h * 0.35) * gainMult;
    const yCenter = h * 0.5;
    
    // Select the appropriate template based on lead index (0=Lead I, 1=Lead II, 2=Lead III)
    const template = LEAD_TEMPLATES[leadIdx % 3];
    const waveform = (selectedSession as any)?._waveform;
    
    for (let x = 0; x < w; x++) {
      let val = 0;
      if (waveform && waveform.length > 0) {
        const idx = Math.floor((x + offsetRef.current) / 3) % waveform.length;
        val = waveform[idx];
      } else {
        const sampleIdx = (x + offsetRef.current + phaseShift) / 3;
        const idx = sampleIdx % template.length;
        const fi = Math.floor(idx);
        const frac = idx - fi;
        const v0 = template[fi % template.length];
        const v1 = template[(fi + 1) % template.length];
        val = v0 + (v1 - v0) * frac + (Math.random() - 0.5) * 0.01;
      }
      const y = yCenter - val * amplitude;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Annotations
    if (showAnnotations) {
      const beatWidth = template.length * 3;
      for (let bx = 0; bx < w; bx += beatWidth) {
        const bStart = bx - (offsetRef.current % beatWidth);
        if (bStart < -beatWidth || bStart > w) continue;
        // P wave
        ctx.fillStyle = "rgba(74,144,217,0.08)";
        ctx.fillRect(bStart + 30, 0, 18, h);
        // QRS
        ctx.fillStyle = "rgba(39,194,138,0.08)";
        ctx.fillRect(bStart + 48, 0, 18, h);
        // T wave
        ctx.fillStyle = "rgba(245,166,35,0.08)";
        ctx.fillRect(bStart + 72, 0, 24, h);
      }
    }
  }, [showAnnotations, speed, gain, tk]);

  useEffect(() => {
    const animate = () => {
      if (playing) offsetRef.current += (speed === "50" ? 3 : 1.5);
      canvasRefs.current.forEach((c, i) => {
        if (!c) return;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const w = c.clientWidth;
        const h = c.clientHeight;
        c.width = w * dpr;
        c.height = h * dpr;
        ctx.scale(dpr, dpr);
        drawLeadECG(ctx, w, h, i);
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [drawLeadECG, playing, speed]);

  const grouped = allSessions.reduce<Record<string, Session[]>>((acc, s) => {
    if (!acc[s.dateGroup]) acc[s.dateGroup] = [];
    acc[s.dateGroup].push(s);
    return acc;
  }, {});

  return (
    <div className="flex h-full" style={{ background: tk.pageBg, fontFamily: "Syne, sans-serif" }}>
      {/* Left Panel — Session List */}
      <div className="w-[280px] flex-shrink-0 flex flex-col h-full overflow-hidden hidden md:flex" style={{ background: tk.cardBg, borderRight: `0.5px solid ${tk.cardBorder}` }}>
        <div className="p-3 space-y-2" style={{ borderBottom: `0.5px solid ${tk.cardBorder}` }}>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: tk.inputBg, borderWidth: 0.5, borderStyle: "solid", borderColor: tk.cardBorder }}>
            <Search size={14} style={{ color: tk.textMuted }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search records..." className="flex-1 outline-none bg-transparent" style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12 }} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {filterChips.map((c) => (
              <button key={c} onClick={() => setActiveFilter(c)} className="px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: activeFilter === c ? "#E8304A" : tk.chipBg, color: activeFilter === c ? "#fff" : tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 10 }}>{c}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="px-3 py-2" style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>{group}</div>
              {items.map((s) => (
                <button key={s.id} onClick={() => setActiveSession(s)} className="w-full text-left px-3 py-2.5 transition-colors" style={{ background: (activeSession?.id||allSessions[0]?.id) === s.id ? tk.chipBg : "transparent" }}>
                  <div className="flex items-start gap-2">
                    <div className="w-[3px] rounded-full self-stretch flex-shrink-0 mt-1" style={{ background: typeColors[s.type], minHeight: 36 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span style={{ color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 12 }}>{s.time}</span>
                        <div className="flex items-center gap-1">
                          {s.shared && <Share2 size={10} style={{ color: "#4A90D9" }} />}
                          <span className="px-1.5 py-0.5 rounded-full" style={{ background: `${statusColors[s.aiStatus]}15`, color: statusColors[s.aiStatus], fontFamily: "DM Mono, monospace", fontSize: 9 }}>{s.aiStatusText}</span>
                        </div>
                      </div>
                      <div style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11, marginTop: 2 }}>{s.duration}</div>
                      <div style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10, marginTop: 1 }}>{s.hrRange}</div>
                      {/* Mini waveform */}
                      <svg width="60" height="20" viewBox="0 0 60 20" className="mt-1">
                        <polyline points="0,10 5,10 8,10 10,8 12,12 14,10 18,10 20,4 22,16 24,2 26,18 28,10 32,10 36,10 38,8 40,12 42,10 46,10 48,4 50,16 52,2 54,18 56,10 60,10" fill="none" stroke={typeColors[s.type]} strokeWidth="1" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar" style={{ scrollbarWidth: "none" }}>
        {/* Session Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: tk.cardBg, borderBottom: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
          <div className="flex items-center gap-3">
            <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 15 }}>{selectedSession?.date||"No Data"}</span>
            <span style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 13 }}>{selectedSession?.time}</span>
            <span className="px-2 py-0.5 rounded-full" style={{ background: `${typeColors[selectedSession?.type||"manual"]}15`, color: typeColors[selectedSession?.type||"manual"], fontFamily: "DM Mono, monospace", fontSize: 10 }}>{selectedSession?.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg transition-colors" style={{ color: tk.textSecondary }} title="Export"><Download size={16} /></button>
            <button className="p-1.5 rounded-lg transition-colors" style={{ color: tk.textSecondary }} title="Share"><Share2 size={16} /></button>
            <button className="p-1.5 rounded-lg transition-colors" style={{ color: tk.textSecondary }} title="Note"><MessageSquare size={16} /></button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 flex-shrink-0" style={{ background: tk.cardBg, borderBottom: `0.5px solid ${tk.cardBorder}` }}>
          <button onClick={() => setPlaying(!playing)} className="p-1.5 rounded-lg" style={{ background: playing ? "rgba(232,48,74,0.1)" : tk.chipBg, color: playing ? "#E8304A" : tk.textSecondary }}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <div className="flex items-center gap-1.5">
            <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>Speed</span>
            <button onClick={() => setSpeed(speed === "25" ? "50" : "25")} className="px-2 py-0.5 rounded" style={{ background: tk.chipBg, color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 11 }}>{speed}mm/s</button>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>Gain</span>
            {(["0.5", "1", "2"] as const).map((g) => (
              <button key={g} onClick={() => setGain(g)} className="px-2 py-0.5 rounded" style={{ background: gain === g ? "rgba(232,48,74,0.1)" : tk.chipBg, color: gain === g ? "#E8304A" : tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 11 }}>{g}x</button>
            ))}
          </div>
          <button onClick={() => setShowAnnotations(!showAnnotations)} className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: showAnnotations ? "rgba(232,48,74,0.1)" : tk.chipBg, color: showAnnotations ? "#E8304A" : tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 11 }}>
            {showAnnotations ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            AI
          </button>
        </div>

        {/* 12-Lead Grid */}
        <div className="flex-shrink-0 p-2" style={{ background: tk.ecgBg }}>
          <div className="grid grid-cols-3 gap-px" style={{ background: tk.cardBorder }}>
            {leads3.map((lead, i) => (
              <div key={lead} className="relative" style={{ background: tk.ecgBg }}>
                <span className="absolute top-1 left-2 z-10" style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 10 }}>{lead}</span>
                <canvas
                  ref={(el) => { canvasRefs.current[i] = el; }}
                  className="w-full"
                  style={{ height: selectedSession.type === "manual" ? 80 : 65 }}
                />
              </div>
            ))}
          </div>
          {/* Rhythm strip Lead II */}
          {selectedSession.type === "manual" && (
            <div className="mt-2 relative" style={{ background: tk.ecgBg, borderTop: `0.5px solid ${tk.cardBorder}` }}>
              <span className="absolute top-1 left-2 z-10" style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>Rhythm Strip — Lead II</span>
              <canvas ref={(el) => { canvasRefs.current[12] = el; }} className="w-full" style={{ height: 60 }} />
            </div>
          )}
          {/* Timeline bar for continuous sessions */}
          {selectedSession.type !== "manual" && (
            <div className="mt-2 px-2 py-2" style={{ background: tk.cardBg, borderTop: `0.5px solid ${tk.cardBorder}` }}>
              <div className="h-3 rounded-full relative overflow-hidden" style={{ background: tk.chipBg }}>
                <div className="absolute h-full rounded-full" style={{ width: "55%", background: "rgba(39,194,138,0.3)" }} />
                {/* Event markers */}
                <div className="absolute top-0.5 w-2 h-2 rounded-full" style={{ left: "12%", background: "#E8304A" }} />
                <div className="absolute top-0.5 w-2 h-2 rounded-full" style={{ left: "35%", background: "#F5A623" }} />
                <div className="absolute top-0.5 w-2 h-2 rounded-full" style={{ left: "78%", background: "#9CA3AF" }} />
              </div>
              <div className="flex justify-between mt-1">
                <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9 }}>Start</span>
                <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9 }}>{selectedSession.duration}</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis, Detected Events, Baseline Comparison, Notes — below ECG */}
        <div className="flex-shrink-0 p-4 space-y-4" style={{ background: tk.pageBg }}>
          {/* Summary */}
          <div className="rounded-xl p-4" style={{ background: tk.cardBg, boxShadow: tk.shadow }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={14} style={{ color: "#E8304A" }} />
              <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>AI Analysis</span>
            </div>
            <p style={{ color: tk.textPrimary, fontFamily: "'DM Serif Display', serif", fontSize: 14, lineHeight: 1.65 }}>
              {(selectedSession as any)._aiSummary || (selectedSession._backendId ? `This session has not been clinically analyzed yet. Click below to generate a 2-sentence clinical description using Gemini 2.0 Flash Lite.` : `This recording was made on ${selectedSession.date}. Your heart showed a normal sinus rhythm for most of the session, with one brief irregular period at the 12-minute mark that resolved on its own. Overall, your cardiac pattern remains within your established baseline.`)}
            </p>
            {!(selectedSession as any)._aiSummary && (selectedSession as any)._backendId && (
              <button disabled={analyzingId===(selectedSession as any)._backendId} onClick={()=>handleAnalyze((selectedSession as any)._backendId)} className="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50" style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12 }}>
                {analyzingId===(selectedSession as any)._backendId ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Analyze Session</span>
                  </>
                )}
              </button>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { label: "Avg HR", value: "76", unit: "BPM", comp: "+4 above afternoon avg" },
                { label: "HR Range", value: selectedSession.hrRange, unit: "", comp: "Within your range" },
                { label: "HRV", value: "44", unit: "ms", comp: "+2 from baseline" },
                { label: "Rhythm", value: "NSR", unit: "", comp: "Normal sinus" },
                { label: "ST Segment", value: "+0.1", unit: "mV", comp: "Normal elevation" },
                { label: "T Wave", value: "Normal", unit: "", comp: "Upright, no inversion" },
                { label: "R-Peak", value: "832", unit: "ms", comp: "Consistent interval" },
                { label: "Breathing", value: "15", unit: "BPM", comp: "Relaxed state" },
              ].map((m) => (
                <div key={m.label} className="p-2.5 rounded-lg" style={{ background: tk.inputBg }}>
                  <span style={{ color: tk.textMuted, fontFamily: "Syne, sans-serif", fontSize: 10 }}>{m.label}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span style={{ color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 16 }}>{m.value}</span>
                    <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>{m.unit}</span>
                  </div>
                  <span style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 9 }}>{m.comp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Events */}
          <div className="rounded-xl p-4" style={{ background: tk.cardBg, boxShadow: tk.shadow }}>
            <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12, marginBottom: 8, display: "block" }}>Detected Events</span>
            <div className="space-y-2">
              {detectedEvents.map((ev, i) => (
                <div key={i} className="p-2.5 rounded-lg" style={{ background: tk.inputBg, borderLeftWidth: 3, borderLeftStyle: "solid", borderLeftColor: ev.alert ? "#E8304A" : "#F5A623" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: "#E8304A", fontFamily: "DM Mono, monospace", fontSize: 11 }}>{ev.time}</span>
                    {ev.alert && <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(232,48,74,0.1)", color: "#E8304A", fontFamily: "DM Mono, monospace", fontSize: 8 }}>Alert</span>}
                  </div>
                  <div style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12, marginTop: 3 }}>{ev.type}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>{ev.duration}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div key={d} className="w-1 h-1 rounded-full" style={{ background: d <= ev.confidence ? "#E8304A" : tk.cardBorder }} />
                      ))}
                    </div>
                  </div>
                  <p style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11, marginTop: 3, lineHeight: 1.4 }}>{ev.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Baseline Comparison */}
          <div className="rounded-xl p-4" style={{ background: tk.cardBg, boxShadow: tk.shadow }}>
            <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12, marginBottom: 8, display: "block" }}>Baseline Comparison</span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Heart Rate", baseline: 72, session: 76, unit: "BPM" },
                { label: "HRV", baseline: 42, session: 44, unit: "ms" },
              ].map((b) => (
                <div key={b.label} className="px-2.5 py-2 rounded-lg" style={{ background: tk.inputBg }}>
                  <span style={{ color: tk.textMuted, fontFamily: "Syne, sans-serif", fontSize: 10 }}>{b.label}</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1">
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: tk.chipBg }}>
                        <div className="h-full rounded-full" style={{ width: `${(b.baseline / 120) * 100}%`, background: "rgba(39,194,138,0.4)" }} />
                      </div>
                      <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9, marginTop: 1, display: "block" }}>Baseline {b.baseline}{b.unit}</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: tk.chipBg }}>
                        <div className="h-full rounded-full" style={{ width: `${(b.session / 120) * 100}%`, background: "rgba(232,48,74,0.4)" }} />
                      </div>
                      <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9, marginTop: 1, display: "block" }}>Session {b.session}{b.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
              Your heart rate during this session was slightly higher than your usual afternoon readings. This is within acceptable variation.
            </p>
          </div>

          {/* Notes */}
          <div className="rounded-xl p-4" style={{ background: tk.cardBg, boxShadow: tk.shadow }}>
            <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12, marginBottom: 6, display: "block" }}>Notes</span>
            <div className="p-2.5 rounded-lg mb-2" style={{ background: tk.inputBg }}>
              <div className="flex items-center gap-1 mb-1">
                <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,144,217,0.1)", color: "#4A90D9", fontFamily: "DM Mono, monospace", fontSize: 9 }}>Patient note</span>
                <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9 }}>3:50 PM</span>
              </div>
              <p style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>Had just walked up two flights of stairs before this recording.</p>
            </div>
            <textarea
              value={doctorNote}
              onChange={(e) => setDoctorNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full p-2.5 rounded-lg outline-none resize-none"
              rows={2}
              style={{ background: tk.inputBg, color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12, borderWidth: 0.5, borderStyle: "solid", borderColor: tk.cardBorder }}
            />
          </div>

          {/* Export */}
          <div className="flex gap-2 pb-4">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg" style={{ background: tk.chipBg, color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>
              <FileText size={13} /> PDF
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg" style={{ background: tk.chipBg, color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>
              <Download size={13} /> CSV
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg" style={{ background: tk.chipBg, color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11 }}>
              <Copy size={13} /> Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}