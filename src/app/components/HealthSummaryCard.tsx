import { useEffect, useRef, useState } from "react";
import {
  Heart,
  Droplet,
  Wind,
  Brain,
  TrendingUp,
  Shield,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useTokens } from "./ThemeContext";
import { useLiveVitals } from "./useBackend";

const POLL_MS = 1 * 60 * 1000; // 1 minute

interface DSPResult {
  bpm: number;
  spo2: number | null;
  hrv_rmssd: number | null;
  st_deviation_mv: number | null;
  breathing_rate: number | null;
  stress_index: number | null;
  ai_health_score: number | null;
}

// ── Interpretation helpers ────────────────────────────────────────────────────
function interpretBpm(v: number | null) {
  if (v === null || v === 0) return { value: "—", status: "neutral", text: "No signal yet" };
  if (v < 50) return { value: `${v} BPM`, status: "warn", text: "Slower than normal — possible bradycardia" };
  if (v <= 100) return { value: `${v} BPM`, status: "good", text: "Normal resting heart rate" };
  if (v <= 120) return { value: `${v} BPM`, status: "warn", text: "Slightly elevated — monitor closely" };
  return { value: `${v} BPM`, status: "bad", text: "Heart rate is high — rest and stay calm" };
}

function interpretSpo2(v: number | null) {
  if (v === null || v === 0) return { value: "—", status: "neutral", text: "Sensor not ready" };
  if (v >= 95) return { value: `${v}%`, status: "good", text: "Excellent oxygen saturation" };
  if (v >= 90) return { value: `${v}%`, status: "warn", text: "Slightly low — breathe deeply" };
  return { value: `${v}%`, status: "bad", text: "Low SpO₂ — seek medical attention" };
}

function interpretHrv(v: number | null) {
  if (v === null) return { value: "—", status: "neutral", text: "Calculating…" };
  if (v >= 40) return { value: `${v} ms`, status: "good", text: "Great heart variability — low stress" };
  if (v >= 20) return { value: `${v} ms`, status: "warn", text: "Moderate variability — mild fatigue possible" };
  return { value: `${v} ms`, status: "bad", text: "Low HRV — elevated physiological stress" };
}

function interpretBreathing(v: number | null) {
  if (v === null) return { value: "—", status: "neutral", text: "Deriving from ECG…" };
  if (v >= 12 && v <= 20) return { value: `${v} br/min`, status: "good", text: "Normal breathing rate" };
  if (v < 12) return { value: `${v} br/min`, status: "warn", text: "Breathing is slow — check posture" };
  return { value: `${v} br/min`, status: "warn", text: "Breathing is fast — try to relax" };
}

function interpretStress(v: number | null) {
  if (v === null) return { value: "—", status: "neutral", text: "Computing…" };
  if (v <= 50) return { value: String(v), status: "good", text: "Low stress — you feel relaxed" };
  if (v <= 150) return { value: String(v), status: "warn", text: "Moderate stress — consider a short break" };
  return { value: String(v), status: "bad", text: "High stress — please rest" };
}

function interpretSt(v: number | null) {
  if (v === null) return { value: "—", status: "neutral", text: "Calculating J-point…" };
  const disp = v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
  if (v > 0.2) return { value: `${disp} mV`, status: "bad", text: "ST elevation — possible cardiac event" };
  if (v > 0.1) return { value: `${disp} mV`, status: "warn", text: "Mild ST elevation — watch closely" };
  if (v < -0.1) return { value: `${disp} mV`, status: "bad", text: "ST depression — possible ischemia" };
  if (v < -0.05) return { value: `${disp} mV`, status: "warn", text: "Slight ST depression" };
  return { value: `${disp} mV`, status: "good", text: "Normal ST segment" };
}

function interpretScore(v: number | null) {
  if (v === null) return { value: "—", status: "neutral", text: "Awaiting data" };
  if (v >= 85) return { value: `${v}/100`, status: "good", text: "Excellent — your vitals are in great shape" };
  if (v >= 65) return { value: `${v}/100`, status: "warn", text: "Fair — a few metrics need attention" };
  return { value: `${v}/100`, status: "bad", text: "Several vitals are outside normal range" };
}

// ── Status colour helper ──────────────────────────────────────────────────────
const STATUS_COLORS = {
  good: "#27C28A",
  warn: "#F5A623",
  bad: "#E8304A",
  neutral: "#9AA0B8",
};

const STATUS_ICONS = {
  good: CheckCircle,
  warn: AlertCircle,
  bad: XCircle,
  neutral: AlertCircle,
};

// ── Metric row ────────────────────────────────────────────────────────────────
function MetricRow({
  icon: Icon,
  label,
  value,
  status,
  text,
  tk,
}: {
  icon: any;
  label: string;
  value: string;
  status: string;
  text: string;
  tk: any;
}) {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.neutral;
  const SIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] ?? AlertCircle;

  return (
    <div
      className="flex items-start gap-3 py-3"
      style={{ borderBottom: `0.5px solid ${tk.cardBorder}` }}
    >
      {/* left accent */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${color}1A` }}
      >
        <Icon size={15} style={{ color }} />
      </div>

      {/* centre */}
      <div className="flex-1 min-w-0">
        <div
          style={{
            color: tk.textSecondary,
            fontFamily: "Syne, sans-serif",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            color: tk.textPrimary,
            fontFamily: "DM Mono, monospace",
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
        <div style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 11, marginTop: 2 }}>
          {text}
        </div>
      </div>

      {/* right status icon */}
      <SIcon size={16} style={{ color, flexShrink: 0, marginTop: 10 }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function HealthSummaryCard() {
  const tk = useTokens();
  const { vitals, connected } = useLiveVitals();

  // Derive DSP data directly from WebSocket vitals (already processed by backend -> DSP)
  const data: DSPResult | null = vitals
    ? {
        bpm: vitals.bpm ?? 0,
        spo2: vitals.spo2 ?? null,
        hrv_rmssd: vitals.hrv_rmssd ?? null,
        st_deviation_mv: vitals.st_deviation_mv ?? null,
        breathing_rate: vitals.breathing_rate ?? null,
        stress_index: vitals.stress_index ?? null,
        ai_health_score: vitals.ai_health_score ?? null,
      }
    : null;

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Update timestamp whenever vitals change
  useEffect(() => {
    if (vitals) {
      setLastUpdated(new Date());
    }
  }, [vitals]);

  const loading = !data && connected;
  const error = !connected && !data ? "Not connected to server" : null;

  const scoreInfo = interpretScore(data?.ai_health_score ?? null);
  const scoreColor = STATUS_COLORS[scoreInfo.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.neutral;

  const metrics = data
    ? [
        { icon: Heart, label: "Heart Rate", ...interpretBpm(data.bpm) },
        { icon: Droplet, label: "Blood Oxygen (SpO₂)", ...interpretSpo2(data.spo2) },
        { icon: Wind, label: "Breathing Rate", ...interpretBreathing(data.breathing_rate) },
        { icon: Brain, label: "Stress Level", ...interpretStress(data.stress_index) },
        { icon: Heart, label: "Heart Variability (HRV)", ...interpretHrv(data.hrv_rmssd) },
        { icon: TrendingUp, label: "ST Segment", ...interpretSt(data.st_deviation_mv) },
      ]
    : [];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: tk.cardBg,
        border: `0.5px solid ${tk.cardBorder}`,
        boxShadow: tk.shadow,
        animation: "hscFadeIn 0.5s ease-out",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `0.5px solid ${tk.cardBorder}` }}
      >
        <div className="flex items-center gap-2">
          <Shield size={15} style={{ color: "#5B8AF0" }} />
          <span
            style={{
              color: tk.textPrimary,
              fontFamily: "Syne, sans-serif",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Health Overview
          </span>
          <span
            className="px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(91,138,240,0.12)",
              color: "#5B8AF0",
              fontFamily: "DM Mono, monospace",
              fontSize: 10,
            }}
          >
            Live analysis
          </span>
        </div>

        <div className="flex items-center gap-2">
          {loading && <Loader2 size={13} className="animate-spin" style={{ color: tk.textMuted }} />}
          <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>
            {loading ? "Waiting for data…" : connected ? "Streaming live" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* AI Health Score banner */}
      {data && (
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: `${scoreColor}14`, borderBottom: `0.5px solid ${tk.cardBorder}` }}
        >
          <div>
            <div
              style={{
                color: scoreColor,
                fontFamily: "DM Mono, monospace",
                fontSize: 28,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {scoreInfo.value}
            </div>
            <div style={{ color: scoreColor, fontFamily: "Syne, sans-serif", fontSize: 11 }}>
              AI Health Score
            </div>
          </div>
          <div
            style={{
              flex: 1,
              color: tk.textSecondary,
              fontFamily: "DM Mono, monospace",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {scoreInfo.text}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ color: "#E8304A", fontFamily: "DM Mono, monospace", fontSize: 12 }}
        >
          <XCircle size={14} />
          {error} — showing last known values
        </div>
      )}

      {/* Metric rows */}
      <div className="px-4">
        {loading && !data && (
          <div className="flex items-center gap-2 py-6" style={{ color: tk.textMuted }}>
            <Loader2 size={15} className="animate-spin" />
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13 }}>
              Fetching health analysis…
            </span>
          </div>
        )}
        {metrics.map((m) => (
          <MetricRow
            key={m.label}
            icon={m.icon}
            label={m.label}
            value={m.value}
            status={m.status}
            text={m.text}
            tk={tk}
          />
        ))}
      </div>

      {/* Footer */}
      {lastUpdated && (
        <div
          className="px-4 py-2 flex items-center gap-1.5"
          style={{ borderTop: `0.5px solid ${tk.cardBorder}` }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#27C28A" }} />
          <span style={{ color: tk.textMuted, fontFamily: "DM Mono, monospace", fontSize: 10 }}>
            Last updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            &nbsp;· Live streaming via WebSocket
          </span>
        </div>
      )}

      <style>{`
        @keyframes hscFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
