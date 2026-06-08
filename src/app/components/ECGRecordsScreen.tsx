import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Search, Share2, Download, FileText, Play, Pause,
  ZoomIn, ZoomOut, ToggleLeft, ToggleRight, Heart, Activity,
  Clock, Sparkles, Copy, X, Loader2, Beaker, ChevronDown
} from "lucide-react";
import { useTokens } from "./ThemeContext";
import { useECGRecords, API_URL } from "./useBackend";

// Base templates for fallback simulations
const ECG_TEMPLATE_LEAD_II = [
  0, 0, 0, 0, 0, 0.02, 0.04, 0.02, 0, -0.02, 0, 0, 0.05, 0.1, 0.15, 0.08,
  -0.4, 1.0, -0.3, -0.1, 0.05, 0.1, 0.15, 0.2, 0.22, 0.2, 0.15, 0.1, 0.05,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const ECG_TEMPLATE_LEAD_I = [
  0, 0, 0, 0, 0, 0.01, 0.03, 0.01, 0, -0.01, 0, 0, 0.04, 0.08, 0.12, 0.06,
  -0.25, 0.7, -0.2, -0.08, 0.04, 0.08, 0.12, 0.15, 0.16, 0.15, 0.12, 0.08, 0.04,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const ECG_TEMPLATE_LEAD_III = [
  0, 0, 0, 0, 0, 0.01, 0.01, 0.01, 0, -0.01, 0, 0, 0.01, 0.02, 0.03, 0.02,
  -0.15, 0.3, -0.1, -0.02, 0.01, 0.02, 0.03, 0.05, 0.06, 0.05, 0.03, 0.02, 0.01,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const LEAD_TEMPLATES = [ECG_TEMPLATE_LEAD_I, ECG_TEMPLATE_LEAD_II, ECG_TEMPLATE_LEAD_III];
const filterChips = ["All", "Flagged", "Normal", "Manual"];

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

function renderMarkdown(md: string, tk: any) {
  if (!md) return null;
  const lines = md.split("\n");
  return lines.map((line, idx) => {
    const l = line.trim();
    if (!l) return <div key={idx} className="h-2" />;
    
    // Headings (e.g. ### Title)
    if (l.startsWith("### ")) {
      return (
        <h3 key={idx} style={{ color: "#E8304A", fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 600, marginTop: 14, marginBottom: 6 }}>
          {parseInlineStyles(l.substring(4), tk)}
        </h3>
      );
    }
    
    // Lists (e.g. * Item or - Item)
    if (l.startsWith("* ") || l.startsWith("- ")) {
      return (
        <div key={idx} style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: tk.textPrimary, marginLeft: 16, marginBottom: 5, position: "relative", paddingLeft: 12, lineHeight: 1.5 }}>
          <span style={{ position: "absolute", left: 0, color: "#E8304A", fontWeight: "bold" }}>•</span>
          {parseInlineStyles(l.substring(2), tk)}
        </div>
      );
    }
    
    // Paragraph
    return (
      <p key={idx} style={{ color: tk.textPrimary, fontFamily: "Inter, sans-serif", fontSize: 12.5, lineHeight: 1.6, marginBottom: 6 }}>
        {parseInlineStyles(l, tk)}
      </p>
    );
  });
}

function getLocalClinicalVerdict(bpm: number | null | undefined, st_mv: number | null | undefined, hrv_rmssd: number | null | undefined) {
  const findings: string[] = [];
  let condition = "Normal Sinus Rhythm";
  let severity: "normal" | "warning" | "critical" = "normal";

  if (st_mv !== null && st_mv !== undefined) {
    if (st_mv > 0.20) {
      condition = "Possible Acute Myocardial Injury / STEMI";
      severity = "critical";
      findings.push(`ST-Elevation of ${st_mv > 0 ? '+' : ''}${st_mv.toFixed(3)} mV exceeds +0.20 mV threshold`);
      findings.push("Consistent with acute transmural ischemia or infarction");
      findings.push("Immediate clinical correlation and 12-lead ECG recommended");
    } else if (st_mv > 0.10) {
      condition = "ST-Elevation (Borderline)";
      severity = "warning";
      findings.push(`Borderline ST-Elevation of ${st_mv > 0 ? '+' : ''}${st_mv.toFixed(3)} mV`);
    } else if (st_mv < -0.10) {
      condition = "Possible Myocardial Ischemia (ST-Depression)";
      severity = "critical";
      findings.push(`ST-Depression of ${st_mv.toFixed(3)} mV below -0.10 mV threshold`);
      findings.push("Consistent with subendocardial ischemia");
    } else if (st_mv < -0.05) {
      severity = "warning";
      findings.push(`Minor ST-Depression of ${st_mv.toFixed(3)} mV`);
    }
  }

  if (bpm && bpm > 0) {
    if (bpm > 100) {
      if (severity === "normal") {
        condition = "Sinus Tachycardia";
        severity = "warning";
      }
      findings.push(`Elevated heart rate of ${Math.round(bpm)} BPM (>100 BPM threshold)`);
    } else if (bpm < 50) {
      if (severity === "normal") {
        condition = "Sinus Bradycardia";
        severity = "warning";
      }
      findings.push(`Low heart rate of ${Math.round(bpm)} BPM (<50 BPM threshold)`);
    } else {
      findings.push(`Heart rate of ${Math.round(bpm)} BPM within normal range (50-100)`);
    }
  }

  if (hrv_rmssd !== null && hrv_rmssd !== undefined) {
    if (hrv_rmssd < 15) {
      findings.push(`Very low HRV (RMSSD=${Math.round(hrv_rmssd)}ms) — reduced parasympathetic tone`);
    } else if (hrv_rmssd < 25) {
      findings.push(`Low HRV (RMSSD=${Math.round(hrv_rmssd)}ms)`);
    } else if (hrv_rmssd > 100) {
      findings.push(`High HRV (RMSSD=${Math.round(hrv_rmssd)}ms)`);
    }
  }

  if (findings.length === 0) {
    findings.push("All parameters within normal limits");
  }

  return { condition, severity, findings };
}

export function ECGRecordsScreen() {
  const tk = useTokens();
  const { records: backendRecords, loading: backendLoading, refetch } = useECGRecords();

  const [activeSession, setActiveSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [speed, setSpeed] = useState<"25" | "50">("25");
  const [gain, setGain] = useState<"0.5" | "1" | "2">("1");
  const [playing, setPlaying] = useState(false);
  const [doctorNote, setDoctorNote] = useState("");
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  const [showDemoDropdown, setShowDemoDropdown] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);

  const handleGenerateDemo = async (type: string) => {
    setGeneratingDemo(true);
    setShowDemoDropdown(false);
    try {
      const res = await fetch(`${API_URL}/api/ecg-records/create-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        await refetch();
      } else {
        alert("Failed to generate demo record.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingDemo(false);
    }
  };

  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const offsetRef = useRef(0);
  const animRef = useRef(0);

  // Group database sessions and build parameters
  const backendSessions = useMemo(() => {
    return backendRecords
      .map(r => {
        const d = new Date(r.timestamp);
        const wf = r.waveform_data || [];
        const vals = wf.filter((v: any) => typeof v === "number");
        const minV = vals.length ? Math.min(...vals) : 0;
        const maxV = vals.length ? Math.max(...vals) : 0;
        const durSec = Math.round(wf.length / 100);
        const durationStr = durSec >= 60 ? `${Math.floor(durSec / 60)}m ${durSec % 60}s` : `${durSec}s`;

        // Calculate basic status
        const isAnomaly = r.ai_summary && (r.ai_summary.toLowerCase().includes("anomaly") || r.ai_summary.toLowerCase().includes("irregular") || r.ai_summary.toLowerCase().includes("tachycardia"));
        const aiStatus = r.ai_summary && !r.ai_summary.includes("unavailable") ? (isAnomaly ? "alert" : "normal") : "pending";
        const aiStatusText = r.ai_summary && !r.ai_summary.includes("unavailable") ? (isAnomaly ? "Anomaly" : "Normal") : "Pending";

        return {
          id: `backend-${r.id}`,
          dateGroup: d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
          date: d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }),
          time: d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          type: "manual",
          duration: `${durationStr}`,
          hrRange: `${minV.toFixed(1)}–${maxV.toFixed(1)} mV`,
          aiStatus,
          aiStatusText,
          _backendId: r.id,
          _aiSummary: r.ai_summary || "",
          _waveform: wf,
          bpm: r.bpm,
          hrv_rmssd: r.hrv_rmssd,
          st_deviation_mv: r.st_deviation_mv,
          breathing_rate: r.breathing_rate,
          r_peak_interval_ms: r.r_peak_interval_ms,
          clinical_verdict: r.clinical_verdict,
        };
      })
      .filter(s => {
        // Search filter
        const matchesSearch = s.date.toLowerCase().includes(searchQuery.toLowerCase()) || s.time.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        // Chip filter
        if (activeFilter === "All") return true;
        if (activeFilter === "Flagged") return s.aiStatus === "alert";
        if (activeFilter === "Normal") return s.aiStatus === "normal";
        if (activeFilter === "Manual") return s.type === "manual";
        return true;
      });
  }, [backendRecords, searchQuery, activeFilter]);

  // Set default active session
  useEffect(() => {
    if (backendSessions.length > 0 && !activeSession) {
      setActiveSession(backendSessions[0]);
    }
  }, [backendSessions, activeSession]);

  const selectedSession = useMemo(() => {
    if (!activeSession) return backendSessions[0] || null;
    return backendSessions.find(s => s.id === activeSession.id) || activeSession;
  }, [activeSession, backendSessions]);

  // Handle AI analysis request
  const handleAnalyze = async (recordId: number) => {
    if (analyzingId !== null) return;
    setAnalyzingId(recordId);
    try {
      const res = await fetch(`${API_URL}/api/analyze-ecg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recordId })
      });
      if (res.ok) {
        await refetch();
      } else {
        alert("Clinical analysis failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleExportPDF = () => {
    if (!selectedSession) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export the report.");
      return;
    }

    const verdict = selectedSession.clinical_verdict || getLocalClinicalVerdict(selectedSession.bpm, selectedSession.st_deviation_mv, selectedSession.hrv_rmssd);
    let verdictHtml = "";
    if (verdict) {
      const severityColor = verdict.severity === "critical" ? "#E8304A" : verdict.severity === "warning" ? "#F5A623" : "#27C28A";
      verdictHtml = `
        <div class="report-section">
          <h2>Clinical Diagnosis Verdict</h2>
          <div style="background: #F7FAFC; border: 1.5px solid ${severityColor}40; border-left: 5px solid ${severityColor}; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 16px; font-weight: 700; color: ${severityColor}; font-family: sans-serif;">${verdict.condition}</span>
              <span style="font-size: 11px; font-weight: 700; color: ${severityColor}; text-transform: uppercase; background: ${severityColor}15; padding: 3px 8px; border-radius: 12px; font-family: monospace;">${verdict.severity}</span>
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4A5568; line-height: 1.6;">
              ${verdict.findings.map((f: string) => `<li>${f}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
    }

    const waveform = selectedSession._waveform || [];
    let svgContent = "";
    if (waveform.length > 0) {
      const maxPoints = 2000;
      const step = Math.max(1, Math.ceil(waveform.length / maxPoints));
      const points: number[] = [];
      for (let i = 0; i < waveform.length; i += step) {
        if (typeof waveform[i] === "number") {
          points.push(waveform[i]);
        }
      }
      if (points.length > 0) {
        const svgWidth = 1000;
        const svgHeight = 150;
        const minVal = Math.min(...points);
        const maxVal = Math.max(...points);
        const range = maxVal - minVal || 1;
        
        const pathD = points.map((val, idx) => {
          const x = (idx / (points.length - 1)) * svgWidth;
          const norm = (val - minVal) / range;
          const y = svgHeight - (norm * (svgHeight - 20) + 10);
          return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');

        svgContent = `
          <div class="ecg-chart-container">
            <h3>ECG Waveform Visualization</h3>
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="ecg-svg">
              <defs>
                <pattern id="smallGrid" width="4" height="4" patternUnits="userSpaceOnUse">
                  <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(232, 48, 74, 0.15)" stroke-width="0.5"/>
                </pattern>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="20" height="20" fill="url(#smallGrid)"/>
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(232, 48, 74, 0.35)" stroke-width="0.8"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <path d="${pathD}" fill="none" stroke="#E8304A" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
            </svg>
          </div>
        `;
      }
    }

    const summaryHtml = selectedSession._aiSummary
      ? selectedSession._aiSummary.split("\n").map((line: string) => {
          const l = line.trim();
          if (!l) return "";
          if (l.startsWith("### ")) {
            return `<h3>${l.substring(4)}</h3>`;
          }
          if (l.startsWith("* ") || l.startsWith("- ")) {
            const content = l.substring(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            return `<li>${content}</li>`;
          }
          const content = l.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          return `<p>${content}</p>`;
        }).join("")
      : "<p>No clinical AI summary available.</p>";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CardiShirt Report - ${selectedSession.date}</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #2D3748;
              line-height: 1.6;
              padding: 40px;
              max-width: 900px;
              margin: 0 auto;
              background-color: #fff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #E8304A;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 26px;
              font-weight: 800;
              color: #E8304A;
              letter-spacing: -0.5px;
            }
            .title {
              text-align: right;
            }
            .title h1 {
              margin: 0;
              font-size: 22px;
              color: #1A202C;
              font-weight: 700;
            }
            .title p {
              margin: 5px 0 0 0;
              font-size: 13px;
              color: #718096;
            }
            .meta-grid {
              display: grid;
              grid-template-cols: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
              background: #F7FAFC;
              border: 1px solid #E2E8F0;
              padding: 24px;
              border-radius: 12px;
            }
            .meta-item span {
              font-size: 11px;
              color: #A0AEC0;
              text-transform: uppercase;
              font-weight: 600;
              letter-spacing: 0.5px;
              display: block;
              margin-bottom: 4px;
            }
            .meta-item strong {
              font-size: 16px;
              color: #2D3748;
              font-weight: 600;
            }
            .ecg-chart-container {
              margin-bottom: 30px;
            }
            .ecg-chart-container h3 {
              color: #1A202C;
              font-size: 15px;
              margin-bottom: 12px;
              border-bottom: 1px solid #E2E8F0;
              padding-bottom: 6px;
              font-weight: 600;
            }
            .ecg-svg {
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              background: #FFF5F5;
              width: 100%;
              height: auto;
              box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            }
            .report-section {
              margin-bottom: 30px;
            }
            .report-section h2 {
              font-size: 15px;
              color: #E8304A;
              border-bottom: 1.5px solid #E8304A;
              padding-bottom: 6px;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              font-weight: 700;
            }
            .summary-content h3 {
              font-size: 14px;
              color: #2D3748;
              margin-top: 20px;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .summary-content p {
              font-size: 14px;
              margin-bottom: 12px;
              color: #4A5568;
            }
            .summary-content li {
              font-size: 14px;
              margin-bottom: 8px;
              color: #4A5568;
              margin-left: 20px;
            }
            .notes-box {
              background: #F7FAFC;
              border-left: 4px solid #E8304A;
              padding: 20px;
              font-size: 14px;
              border-radius: 0 8px 8px 0;
              color: #4A5568;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #E2E8F0;
              padding-top: 24px;
              text-align: center;
              font-size: 11px;
              color: #A0AEC0;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              💓 CardiShirt
            </div>
            <div class="title">
              <h1>ECG Diagnostic Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span>Patient Name</span>
              <strong>Adnan Borshon</strong>
            </div>
            <div class="meta-item">
              <span>Session Date & Time</span>
              <strong>${selectedSession.date} at ${selectedSession.time}</strong>
            </div>
            <div class="meta-item">
              <span>Signal Metrics</span>
              <strong>${selectedSession.hrRange} (${selectedSession.duration})</strong>
            </div>
            <div class="meta-item">
              <span>AI Status Verdict</span>
              <strong style="color: ${selectedSession.aiStatus === 'alert' ? '#E8304A' : '#27C28A'}">
                ${selectedSession.aiStatusText}
              </strong>
            </div>
          </div>

          ${svgContent}

          ${verdictHtml}

          <div class="report-section">
            <h2>Clinical AI Summary</h2>
            <div class="summary-content">
              ${summaryHtml}
            </div>
          </div>

          <div class="report-section">
            <h2>Notes & Observations</h2>
            <div class="notes-box">
              <strong>Patient Note:</strong> Felt slightly short of breath after walking up Dhanmondi stairs. Triggered manual ECG capture.
              ${doctorNote ? `<br/><br/><strong>Observer Note:</strong> ${doctorNote}` : ""}
            </div>
          </div>

          <div class="footer">
            This document is an automated clinical summary generated by CardiShirt Health Companion.<br/>
            It does not replace professional medical advice, diagnosis, or treatment.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Custom multi-lead canvas renderer
  const drawLeadECG = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, leadIdx: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = tk.ecgBg;
    ctx.fillRect(0, 0, w, h);

    // Render Grid Lines
    const gridCell = 4 * (speed === "50" ? 2 : 1);
    ctx.strokeStyle = tk.ecgGrid;
    ctx.lineWidth = 0.3;
    for (let x = 0; x < w; x += gridCell) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += gridCell) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = tk.ecgGridMajor;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += gridCell * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += gridCell * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const gainMult = gain === "0.5" ? 0.5 : gain === "2" ? 2 : 1;
    ctx.strokeStyle = tk.textPrimary;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();

    const yCenter = h * 0.5;
    const amplitude = (h * 0.35) * gainMult;
    const pixelsPerSample = speed === "50" ? 5 : 3;
    const numSamples = Math.ceil(w / pixelsPerSample);

    const waveformData = selectedSession?._waveform || [];

    if (waveformData.length > 0) {
      // --- Playback actual SQLite database waveform data ---
      const samples: number[] = [];
      const currentOffset = Math.floor(offsetRef.current);

      for (let i = 0; i < numSamples; i++) {
        const idx = (currentOffset + i) % waveformData.length;
        samples.push(waveformData[idx]);
      }

      // Dynamic Auto-Gain Scaling
      let minVal = Infinity;
      let maxVal = -Infinity;
      for (let i = 0; i < samples.length; i++) {
        const v = samples[i];
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
      const range = maxVal - minVal;

      for (let x = 0; x < w; x++) {
        const sampleIdx = Math.floor(x / pixelsPerSample);
        const rawVal = samples[sampleIdx] ?? 0;

        let val = 0;
        if (range > 10) {
          const norm = (rawVal - minVal) / range;
          val = -0.4 + norm * 1.4;
        } else if (range > 0.05) {
          const norm = (rawVal - minVal) / range;
          val = -0.4 + norm * 1.4;
        }

        // Apply Lead coefficients
        let leadCoef = 1.0;
        if (leadIdx === 0) leadCoef = 0.7; // Lead I
        else if (leadIdx === 2) leadCoef = 0.3; // Lead III

        const y = yCenter - (val * leadCoef) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else {
      // --- Fallback mock template simulation ---
      const phaseShift = leadIdx * 9;
      const template = LEAD_TEMPLATES[leadIdx % 3];
      const templateLen = template.length;

      for (let x = 0; x < w; x++) {
        const sampleIdx = (x + offsetRef.current + phaseShift) / pixelsPerSample;
        const idx = sampleIdx % templateLen;
        const floorIdx = Math.floor(idx);
        const frac = idx - floorIdx;
        const v0 = template[floorIdx % templateLen];
        const v1 = template[(floorIdx + 1) % templateLen];
        let val = v0 + (v1 - v0) * frac + (Math.random() - 0.5) * 0.015;

        const y = yCenter - (val * amplitude);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Render AI Segment Zone Highlights
    if (showAnnotations) {
      // Zone dimensions (mocked visually across beats)
      const beatWidth = 120;
      for (let bx = 0; bx < w; bx += beatWidth) {
        const bStart = bx - ((offsetRef.current * 0.5) % beatWidth);
        if (bStart < -beatWidth || bStart > w) continue;
        
        // P-Wave Zone (Blue)
        ctx.fillStyle = "rgba(91, 138, 240, 0.06)";
        ctx.fillRect(bStart + 15, 0, 16, h);
        
        // QRS Complex (Green)
        ctx.fillStyle = "rgba(39, 194, 138, 0.06)";
        ctx.fillRect(bStart + 35, 0, 18, h);
        
        // T-Wave Zone (Orange)
        ctx.fillStyle = "rgba(245, 166, 35, 0.06)";
        ctx.fillRect(bStart + 58, 0, 22, h);
      }
    }
  }, [showAnnotations, speed, gain, tk, selectedSession]);

  // Animation ticks
  useEffect(() => {
    const animate = () => {
      if (playing) {
        const speedStep = speed === "50" ? 4.5 : 2.2;
        offsetRef.current += speedStep;
        
        // Loop offset boundary for real arrays
        if (selectedSession?._waveform && selectedSession._waveform.length > 0) {
          if (offsetRef.current >= selectedSession._waveform.length) {
            offsetRef.current = 0;
          }
        }
      }

      // Draw active canvas elements
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
  }, [drawLeadECG, playing, speed, selectedSession]);

  const leads3 = ["Lead I", "Lead II", "Lead III"];
  const statusColors = { normal: "#27C28A", anomaly: "#F5A623", alert: "#E8304A", pending: "#C2C8D6" };

  return (
    <div className="flex h-full animate-fade-in" style={{ background: tk.pageBg, fontFamily: "Syne, sans-serif" }}>
      
      {/* Left Sidebar: Historical Records List */}
      <div className="w-[280px] flex-shrink-0 flex flex-col h-full overflow-hidden hidden md:flex" style={{ background: tk.cardBg, borderRight: `0.5px solid ${tk.cardBorder}` }}>
        <div className="p-3 space-y-2" style={{ borderBottom: `0.5px solid ${tk.cardBorder}` }}>
          
          {/* Search box */}
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: tk.inputBg, borderWidth: 0.5, borderStyle: "solid", borderColor: tk.cardBorder }}>
            <Search size={14} style={{ color: tk.textMuted }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="flex-1 outline-none bg-transparent"
              style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12 }}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            {filterChips.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setActiveFilter(c);
                  setActiveSession(null); // Reset active
                }}
                className="px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
                style={{
                  background: activeFilter === c ? "#E8304A" : tk.chipBg,
                  color: activeFilter === c ? "#fff" : tk.textSecondary,
                  fontFamily: "DM Mono, monospace",
                  fontSize: 10
                }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Generate Demo Records Section */}
          <div className="relative">
            <button
              onClick={() => setShowDemoDropdown(!showDemoDropdown)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #9B8EC4 0%, #7C6EB0 100%)",
                borderColor: tk.cardBorder,
                fontFamily: "Syne, sans-serif",
                fontSize: 11,
                fontWeight: 600
              }}
              disabled={generatingDemo}
            >
              <div className="flex items-center gap-1.5">
                {generatingDemo ? <Loader2 size={12} className="animate-spin" /> : <Beaker size={12} />}
                <span>{generatingDemo ? "Generating..." : "Generate Demo"}</span>
              </div>
              <ChevronDown size={12} style={{ transform: showDemoDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>

            {showDemoDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg shadow-xl overflow-hidden border" style={{ background: tk.cardBg, borderColor: tk.cardBorder }}>
                {[
                  { key: "normal", label: "Normal Sinus", color: "#27C28A" },
                  { key: "bradycardia", label: "Bradycardia", color: "#5B8AF0" },
                  { key: "tachycardia", label: "Tachycardia", color: "#F5A623" },
                  { key: "arrhythmia", label: "PVC Arrhythmia", color: "#E8304A" },
                  { key: "ischemia", label: "STEMI / Ischemia", color: "#E8304A" },
                  { key: "noisy", label: "Noisy ECG", color: "#9B8EC4" }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleGenerateDemo(item.key)}
                    className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between"
                    style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif" }}
                  >
                    <span>{item.label}</span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto">
          {backendLoading && (
            <div className="flex flex-col items-center justify-center py-10 text-xs font-mono text-gray-500 gap-2">
              <Loader2 size={16} className="animate-spin" />
              Loading database sessions...
            </div>
          )}

          {!backendLoading && backendSessions.length === 0 && (
            <div className="text-center py-10 text-xs font-mono text-gray-400">
              No matching records found.
            </div>
          )}

          {backendSessions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSession(s);
                offsetRef.current = 0; // Reset offset on switch
              }}
              className="w-full text-left px-3 py-2.5 transition-colors border-b"
              style={{
                background: selectedSession?.id === s.id ? tk.chipBg : "transparent",
                borderColor: tk.cardBorder
              }}
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-[3px] rounded-full self-stretch flex-shrink-0 mt-1"
                  style={{ background: statusColors[s.aiStatus as keyof typeof statusColors], minHeight: 36 }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span style={{ color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 12 }}>{s.time}</span>
                    <span
                      className="px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${statusColors[s.aiStatus as keyof typeof statusColors]}15`,
                        color: statusColors[s.aiStatus as keyof typeof statusColors],
                        fontFamily: "DM Mono, monospace",
                        fontSize: 9
                      }}
                    >
                      {s.aiStatusText}
                    </span>
                  </div>
                  <div style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 11, marginTop: 2 }}>{s.duration}</div>
                  <div style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10, marginTop: 1 }}>{s.hrRange}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center Panel: Interactive Multi-Lead Playback Viewer */}
      {selectedSession ? (
        <div className="flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar" style={{ scrollbarWidth: "none" }}>
          
          {/* Active Session Info Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: tk.cardBg, borderBottom: `0.5px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
            <div className="flex items-center gap-3">
              <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 500 }}>{selectedSession.date}</span>
              <span style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 13 }}>{selectedSession.time}</span>
              <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(232, 48, 74, 0.1)", color: "#E8304A", fontFamily: "DM Mono, monospace", fontSize: 10 }}>{selectedSession.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportPDF} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: tk.textSecondary }} title="Export PDF"><FileText size={16} /></button>
            </div>
          </div>

          {/* Active Viewer Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-2 flex-shrink-0" style={{ background: tk.cardBg, borderBottom: `0.5px solid ${tk.cardBorder}` }}>
            <button onClick={() => setPlaying(!playing)} className="p-1.5 rounded-lg hover:scale-105 transition-all" style={{ background: playing ? "rgba(232,48,74,0.12)" : tk.chipBg, color: playing ? "#E8304A" : tk.textSecondary }}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex items-center gap-1.5">
              <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>Speed</span>
              <button onClick={() => setSpeed(speed === "25" ? "50" : "25")} className="px-2.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5" style={{ background: tk.chipBg, color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 11 }}>{speed}mm/s</button>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>Gain</span>
              {(["0.5", "1", "2"] as const).map((g) => (
                <button key={g} onClick={() => setGain(g)} className="px-2.5 py-0.5 rounded transition-all" style={{ background: gain === g ? "rgba(232,48,74,0.12)" : tk.chipBg, color: gain === g ? "#E8304A" : tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 11 }}>{g}x</button>
              ))}
            </div>
            <button onClick={() => setShowAnnotations(!showAnnotations)} className="flex items-center gap-1.5 px-2.5 py-0.5 rounded transition-all" style={{ background: showAnnotations ? "rgba(232,48,74,0.12)" : tk.chipBg, color: showAnnotations ? "#E8304A" : tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 11 }}>
              {showAnnotations ? <ToggleRight size={14} className="text-[#E8304A]" /> : <ToggleLeft size={14} />}
              AI Markups
            </button>
          </div>

          {/* 3-Lead Canvas Grid */}
          <div className="flex-shrink-0 p-2" style={{ background: tk.ecgBg }}>
            <div className="grid grid-cols-1 gap-px" style={{ background: tk.cardBorder }}>
              {leads3.map((lead, i) => (
                <div key={lead} className="relative border-b" style={{ background: tk.ecgBg, borderColor: tk.cardBorder }}>
                  <span className="absolute top-1 left-2 z-10" style={{ color: tk.textSecondary, fontFamily: "DM Mono, monospace", fontSize: 10 }}>{lead}</span>
                  <canvas
                    ref={(el) => { canvasRefs.current[i] = el; }}
                    className="w-full"
                    style={{ height: 90 }}
                  />
                </div>
              ))}
            </div>

            {/* Timeline bar for continuous database waves */}
            {selectedSession._waveform && selectedSession._waveform.length > 0 && (
              <div className="mt-2 px-2 py-2" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}`, borderRadius: 8 }}>
                <div className="h-3 rounded-full relative overflow-hidden" style={{ background: tk.chipBg }}>
                  <div
                    className="absolute h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(offsetRef.current / selectedSession._waveform.length) * 100}%`,
                      background: "rgba(39,194,138,0.3)"
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9 }}>Start</span>
                  <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9 }}>Duration: {selectedSession.duration}</span>
                </div>
              </div>
            )}
          </div>

          {/* Detailed clinical summary, notes, and comparison metrics */}
          <div className="flex-shrink-0 p-4 space-y-4" style={{ background: tk.pageBg }}>

            {/* Clinical Diagnosis Verdict Block */}
            {(() => {
              const verdict = selectedSession.clinical_verdict || getLocalClinicalVerdict(selectedSession.bpm, selectedSession.st_deviation_mv, selectedSession.hrv_rmssd);
              if (!verdict) return null;
              const severityColor = verdict.severity === "critical" ? "#E8304A" : verdict.severity === "warning" ? "#F5A623" : "#27C28A";
              return (
                <div className="rounded-xl p-4 transition-all" style={{
                  background: tk.cardBg,
                  border: `1.5px solid ${
                    verdict.severity === "critical" ? "rgba(232, 48, 74, 0.3)" :
                    verdict.severity === "warning" ? "rgba(245, 166, 35, 0.3)" :
                    "rgba(39, 194, 138, 0.3)"
                  }`,
                  borderLeft: `5px solid ${severityColor}`,
                  boxShadow: tk.shadow
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Heart size={16} style={{ color: severityColor }} />
                      <span style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 600 }}>
                        Clinical Diagnosis Verdict
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full" style={{
                      background: `${severityColor}15`,
                      color: severityColor,
                      fontFamily: "DM Mono, monospace",
                      fontSize: 10,
                      fontWeight: 600
                    }}>
                      {verdict.severity.toUpperCase()}
                    </span>
                  </div>
                  <div style={{
                    color: severityColor,
                    fontFamily: "Syne, sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 10
                  }}>
                    {verdict.condition}
                  </div>
                  <div className="space-y-1.5" style={{ borderTop: `0.5px solid ${tk.cardBorder}`, paddingTop: 10 }}>
                    {verdict.findings.map((finding: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-[11.5px]" style={{ color: tk.textSecondary, fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
                        <span style={{ color: severityColor }}>•</span>
                        <span>{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            
            {/* AI Summary Block */}
            <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={14} style={{ color: "#E8304A" }} />
                <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>Clinical AI Summary Description</span>
              </div>
              <div className="space-y-1">
                {selectedSession._aiSummary ? (
                  renderMarkdown(selectedSession._aiSummary, tk)
                ) : (
                  <p style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 13, lineHeight: 1.65 }}>
                    This session has not been clinically analyzed yet. Click below to generate a comprehensive, structured clinical description using CardiShirt AI.
                  </p>
                )}
              </div>
              {!selectedSession._aiSummary && (
                <button
                  disabled={analyzingId === selectedSession._backendId}
                  onClick={() => handleAnalyze(selectedSession._backendId)}
                  className="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                  style={{ background: "#E8304A", color: "#fff", fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 500 }}
                >
                  {analyzingId === selectedSession._backendId ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Analyzing waveform...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Analyze Waveform</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Key Metrics Dashboard Card */}
            <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
              <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12, marginBottom: 8, display: "block" }}>CardiShirt Diagnostics</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: "Avg HR",
                    value: selectedSession.bpm ? Math.round(selectedSession.bpm).toString() : "—",
                    unit: "BPM",
                    comp: selectedSession.bpm ? (selectedSession.bpm > 90 ? "Tachycardia detected" : selectedSession.bpm < 60 ? "Bradycardia detected" : "Within normal limits") : "—"
                  },
                  {
                    label: "Voltage Range",
                    value: selectedSession.hrRange,
                    unit: "",
                    comp: "Good signal amplitude"
                  },
                  {
                    label: "HRV (RMSSD)",
                    value: selectedSession.hrv_rmssd !== undefined && selectedSession.hrv_rmssd !== null ? Math.round(selectedSession.hrv_rmssd).toString() : "—",
                    unit: "ms",
                    comp: selectedSession.hrv_rmssd !== undefined && selectedSession.hrv_rmssd !== null ? (selectedSession.hrv_rmssd >= 40 ? "Good variability" : "Low variability") : "—"
                  },
                  {
                    label: "Rhythm Verdict",
                    value: selectedSession.aiStatus === "alert" ? "Arrhythmia" : selectedSession.aiStatus === "normal" ? "Normal" : "Pending",
                    unit: "",
                    comp: selectedSession.aiStatus === "alert" ? "Ectopic events noted" : selectedSession.aiStatus === "normal" ? "Normal sinus rhythm" : "Awaiting AI analysis"
                  },
                  {
                    label: "ST Segment",
                    value: selectedSession.st_deviation_mv !== undefined && selectedSession.st_deviation_mv !== null ? (selectedSession.st_deviation_mv >= 0 ? `+${selectedSession.st_deviation_mv.toFixed(2)}` : selectedSession.st_deviation_mv.toFixed(2)) : "—",
                    unit: "mV",
                    comp: selectedSession.st_deviation_mv !== undefined && selectedSession.st_deviation_mv !== null ? (selectedSession.st_deviation_mv < -0.05 || selectedSession.st_deviation_mv > 0.10 ? "Abnormal deviation" : "Stable baseline") : "—"
                  },
                  {
                    label: "T Wave",
                    value: selectedSession.st_deviation_mv !== undefined && selectedSession.st_deviation_mv !== null ? (selectedSession.st_deviation_mv < -0.05 ? "Inverted" : "Upright") : "Upright",
                    unit: "",
                    comp: selectedSession.st_deviation_mv !== undefined && selectedSession.st_deviation_mv !== null ? (selectedSession.st_deviation_mv < -0.05 ? "Possible ischemia" : "Proper repolarization") : "Proper repolarization"
                  },
                  {
                    label: "R-Peak Interval",
                    value: selectedSession.r_peak_interval_ms !== undefined && selectedSession.r_peak_interval_ms !== null ? Math.round(selectedSession.r_peak_interval_ms).toString() : "—",
                    unit: "ms",
                    comp: selectedSession.r_peak_interval_ms !== undefined && selectedSession.r_peak_interval_ms !== null ? "Consistent R-R range" : "—"
                  },
                  {
                    label: "Breathing Rate",
                    value: selectedSession.breathing_rate !== undefined && selectedSession.breathing_rate !== null ? Math.round(selectedSession.breathing_rate).toString() : "—",
                    unit: "BPM",
                    comp: selectedSession.breathing_rate !== undefined && selectedSession.breathing_rate !== null ? "Stable respirations" : "—"
                  },
                ].map((m) => (
                  <div key={m.label} className="p-2.5 rounded-lg border border-black/5 dark:border-white/5" style={{ background: tk.inputBg }}>
                    <span style={{ color: tk.textMuted, fontFamily: "Syne, sans-serif", fontSize: 10 }}>{m.label}</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span style={{ color: tk.textPrimary, fontFamily: "DM Mono, monospace", fontSize: 16, fontWeight: 500 }}>{m.value}</span>
                      <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>{m.unit}</span>
                    </div>
                    <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 9, display: "block", marginTop: 2 }}>{m.comp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div className="rounded-xl p-4" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}`, boxShadow: tk.shadow }}>
              <span style={{ color: tk.textSecondary, fontFamily: "Syne, sans-serif", fontSize: 12, marginBottom: 6, display: "block" }}>Notes & Observations</span>
              
              <div className="p-2.5 rounded-lg mb-3" style={{ background: tk.inputBg }}>
                <div className="flex items-center gap-1 mb-1">
                  <span className="px-1.5 py-0.5 rounded-full" style={{ background: "rgba(91, 138, 240, 0.15)", color: "#5B8AF0", fontFamily: "DM Mono, monospace", fontSize: 9 }}>Patient note</span>
                  <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 9 }}>3:50 PM</span>
                </div>
                <p style={{ color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12 }}>Felt slightly short of breath after walking up Dhanmondi stairs. Triggered manual ECG capture.</p>
              </div>

              <textarea
                value={doctorNote}
                onChange={(e) => setDoctorNote(e.target.value)}
                placeholder="Add medical observer notes here..."
                className="w-full p-2.5 rounded-lg outline-none resize-none"
                rows={2}
                style={{ background: tk.inputBg, color: tk.textPrimary, fontFamily: "Syne, sans-serif", fontSize: 12, borderWidth: 0.5, borderStyle: "solid", borderColor: tk.cardBorder }}
              />
            </div>

          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs font-mono text-gray-500">
          No historical records match search parameters.
        </div>
      )}
    </div>
  );
}