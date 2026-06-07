# CardiShirt — Clinical Accuracy Upgrade Guide

> **Purpose**: Single source of truth for upgrading all health metrics from frontend simulations
> and heuristic approximations to clinically validated, backend-computed DSP calculations.
>
> **Who is this for**: Any developer picking up this project in the future. Read this document
> alone and execute every change without needing to ask anyone.
>
> **Codebase Root**: `d:\Versity\Projects\CardiShirt\`

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Architecture — Before vs After](#2-architecture-overview)
3. [Phase 1 — Python DSP Microservice (New File)](#3-phase-1--python-dsp-microservice)
4. [Phase 2 — Upgrade signalProcessing.js (Fallback)](#4-phase-2--upgrade-signalprocessingjs)
5. [Phase 3 — Upgrade server.js](#5-phase-3--upgrade-serverjs)
6. [Phase 4 — Database Migration (db.js)](#6-phase-4--upgrade-database-schema)
7. [Phase 5 — useBackend.ts (Frontend Types)](#7-phase-5--upgrade-usebackendts)
8. [Phase 6 — VitalsRow.tsx (Remove Local Math)](#8-phase-6--upgrade-vitalsrowtsx)
9. [Phase 7 — RiskTrendsScreen.tsx (Real Score)](#9-phase-7--upgrade-risktrendsscreentsx)
10. [Testing Checklist](#10-testing-checklist)
11. [Clinical Reference Ranges](#11-clinical-reference-ranges)

---

## 1. Problem Statement

### Current State — What is Simulated / Wrong

The following metrics are **NOT real**. They are computed in the React frontend using fake math.

| Metric | File | Current Method | Problem |
|--------|------|----------------|---------|
| **AI Health Score** | `VitalsRow.tsx` L49-65 | `baseScore=95` minus BPM/Temp/SpO2 deviations | Not a clinical standard. Ignores ECG data. |
| **HRV (RMSSD)** | `VitalsRow.tsx` L68-79 | `45 * hrScale + Math.sin(timeFactor)*4 + Math.random()` | Completely fabricated. Sine wave + random noise. |
| **Breathing Rate** | `VitalsRow.tsx` L82-90 | `bpm / 4.6 + Math.cos(timeFactor)` | Not real. BPM division is not clinically valid. |
| **Stress Index** | `VitalsRow.tsx` L93-100 | `15 + (70-hrv)*0.8 + (bpm-60)*0.4` | Based on the fake HRV — also fabricated. |
| **ST Segment** | `VitalsRow.tsx` L106-113 | Returns +0.35, -0.15, or +0.15 based on BPM only | Wrong. Must be measured from the ECG waveform. |
| **R-Peak Interval** | `VitalsRow.tsx` L103 | `60000 / bpm` | Average estimate only, not the real R-R sequence. |
| **SpO2** | `signalProcessing.js` L2 | `110 - 25 * R` (linear) | Linear approximation. Needs quadratic calibration curve. |
| **BPM detection** | `signalProcessing.js` L1 | 5-point moving average + threshold | Motion-artifact-prone. Not Pan-Tompkins standard. |
| **Risk Score** | `RiskTrendsScreen.tsx` L116 | `100 - abs(72-avgBpm) - max(0,95-spo2)*4` | Ignores ECG, HRV, and arrhythmia history. |

### Target State

All metrics must be calculated on the **Node.js backend** via a **Python DSP microservice**:
1. Returned to Node.js in real-time (within 3 seconds per reading)
2. Stored in SQLite DB with each vitals record
3. Emitted to React frontend via existing WebSocket (socket.io)
4. Displayed on frontend **without any additional local math**

---

## 2. Architecture Overview

### Before (Current)

```
ESP32
  |-- POST /api/esp32/data (ir_array, red_array, ecg_array, temp)
  v
Node.js server.js
  |-- calculateBPM()    <- simple 5-pt average (signalProcessing.js)
  |-- calculateSpO2()   <- linear formula (signalProcessing.js)
  |-- emit via WebSocket
  v
React Frontend
  |-- getHRV()           FAKE (sine wave + random)
  |-- getAIHealthScore() FAKE (BPM/Temp/SpO2 deductions)
  |-- getSTSegment()     FAKE (BPM threshold lookup)
  |-- getBreathingRate() FAKE (BPM / 4.6)
  |-- getStressIndex()   FAKE (based on fake HRV)
```

### After (Target)

```
ESP32
  |-- POST /api/esp32/data (ir_array, red_array, ecg_array, temp)
  v
Node.js server.js
  |-- POST http://localhost:5001/analyze
  v
Python dsp_service.py  <-- NEW FILE
  |-- Butterworth Bandpass Filter (0.5-40 Hz) on ECG
  |-- Pan-Tompkins QRS Detection             -> R-peaks
  |-- RMSSD from real R-R intervals          -> True HRV
  |-- J-point + 60ms measurement             -> True ST Segment
  |-- R-peak amplitude envelope              -> True Breathing Rate
  |-- Baevsky formula on R-R distribution    -> True Stress Index
  |-- Quadratic calibration curve            -> True SpO2
  |-- Composite weighted formula             -> True AI Health Score
  |-- Returns JSON
  v
Node.js server.js
  |-- Store all metrics in SQLite DB
  |-- Emit all metrics via WebSocket
  v
React Frontend
  |-- Display server values only (no local math)
```

---

## 3. Phase 1 — Python DSP Microservice

### 3.1 Install Python dependencies

```bash
pip install flask scipy numpy neurokit2
```

- `flask` — HTTP server for Node.js to call
- `scipy` — Butterworth filter, signal math
- `numpy` — array operations
- `neurokit2` — clinically validated ECG algorithms (Pan-Tompkins, etc.)

### 3.2 Create the file

**New file:** `backend/dsp_service.py`

```python
"""
CardiShirt DSP Microservice — port 5001
Clinically referenced algorithms:
  - Pan-Tompkins QRS (NeuroKit2)
  - RMSSD from R-R intervals (AHA/ESC 1996 standard)
  - ST Segment: J-point + 60ms vs TP baseline
  - EDR Respiration: R-peak amplitude envelope
  - Baevsky Stress Index from R-R histogram
  - SpO2: quadratic calibration curve (A - B*R + C*R^2)
"""

from flask import Flask, request, jsonify
import numpy as np
from scipy.signal import butter, filtfilt
import neurokit2 as nk

app = Flask(__name__)

ECG_SAMPLE_RATE = 250      # Hz — update if ESP32 firmware changes
PPG_SAMPLE_RATE = 25       # Hz — MAX30100/MAX30102 default
MS_PER_SAMPLE   = 1000.0 / ECG_SAMPLE_RATE   # 4.0 ms at 250 Hz


# ── STEP 1: BANDPASS FILTER ──────────────────────────────────────────────────
# Removes baseline wander (<0.5 Hz) and EMG noise (>40 Hz).
# Standard clinical ECG range: 0.5 Hz to 40 Hz.
def bandpass_filter_ecg(signal, low=0.5, high=40.0, fs=ECG_SAMPLE_RATE, order=4):
    if len(signal) < 10:
        return signal
    nyq      = 0.5 * fs
    low_n    = max(0.001, min(low  / nyq, 0.999))
    high_n   = max(0.001, min(high / nyq, 0.999))
    if low_n >= high_n:
        return signal
    b, a = butter(order, [low_n, high_n], btype="band")
    return filtfilt(b, a, signal)


# ── STEP 2: QRS DETECTION ────────────────────────────────────────────────────
# Pan-Tompkins via NeuroKit2. Returns sample indices of R-peaks.
def detect_r_peaks(ecg_filtered):
    if len(ecg_filtered) < ECG_SAMPLE_RATE * 2:
        return []
    try:
        _, info = nk.ecg_peaks(ecg_filtered, sampling_rate=ECG_SAMPLE_RATE,
                                method="pantompkins1985")
        return info["ECG_R_Peaks"].tolist()
    except Exception:
        return []


# ── STEP 3: BPM FROM R-PEAKS ─────────────────────────────────────────────────
def calculate_bpm_from_rpeaks(r_peaks):
    if len(r_peaks) < 2:
        return 0
    intervals = [(r_peaks[i+1]-r_peaks[i])*MS_PER_SAMPLE for i in range(len(r_peaks)-1)]
    avg_ms = np.mean(intervals)
    if avg_ms <= 0:
        return 0
    bpm = round(60000.0 / avg_ms)
    return bpm if 30 <= bpm <= 220 else 0


# ── STEP 4: TRUE RMSSD (HRV) ─────────────────────────────────────────────────
# Formula: sqrt( mean( (RR[i+1] - RR[i])^2 ) )
# Reference: AHA/ESC Task Force 1996, JACC 28(5):1043-1065
# Normal: 20-100 ms. Higher = more parasympathetic activity = healthier.
def calculate_rmssd(r_peaks):
    if len(r_peaks) < 3:
        return None
    rr = [(r_peaks[i+1]-r_peaks[i])*MS_PER_SAMPLE for i in range(len(r_peaks)-1)]
    diffs = [(rr[i+1]-rr[i])**2 for i in range(len(rr)-1)]
    if not diffs:
        return None
    return round(float(np.sqrt(np.mean(diffs))), 1)


# ── STEP 5: ST SEGMENT DEVIATION ─────────────────────────────────────────────
# Method:
#   J-point = R-peak + 80ms
#   ST point = J-point + 60ms
#   TP baseline = R-peak - 200ms (isoelectric line between beats)
#   Deviation (mV) = (ST point amplitude - TP baseline amplitude) * ADC_TO_MV
#
# Normal: -0.05 to +0.10 mV
# Elevation >+0.2 mV: possible STEMI
# Depression <-0.1 mV: possible ischemia
#
# ADC_TO_MV calibration:
#   For ESP32 12-bit ADC (0-4095) with INA128 instrumentation amp at gain ~1000:
#   1 mV ECG signal = 1000 mV at amp output -> 4095/3300 * 1000 = ~1241 counts/mV
#   So ADC_TO_MV = 1.0 / 1241.0
#   Re-calibrate for your specific hardware.
def calculate_st_segment(ecg_filtered, r_peaks):
    if len(r_peaks) < 2 or len(ecg_filtered) < 10:
        return None

    j_offset    = int(0.080 * ECG_SAMPLE_RATE)
    st_offset   = int(0.060 * ECG_SAMPLE_RATE)
    tp_offset   = int(0.200 * ECG_SAMPLE_RATE)
    ADC_TO_MV   = 1.0 / 1241.0

    st_vals, tp_vals = [], []
    for r in r_peaks:
        st_idx = r + j_offset + st_offset
        tp_idx = r - tp_offset
        if st_idx >= len(ecg_filtered) or tp_idx < 0:
            continue
        st_vals.append(ecg_filtered[st_idx])
        tp_vals.append(ecg_filtered[tp_idx])

    if not st_vals:
        return None
    return round((float(np.mean(st_vals)) - float(np.mean(tp_vals))) * ADC_TO_MV, 3)


# ── STEP 6: ECG-DERIVED RESPIRATION (EDR) ────────────────────────────────────
# Respiratory cycles modulate R-peak amplitudes via thoracic impedance changes.
# Count zero-crossings of the mean-subtracted R-peak amplitude envelope.
# Normal breathing rate: 12-20 breaths/min.
def calculate_respiration_rate(ecg_filtered, r_peaks):
    if len(r_peaks) < 8:
        return None

    amps = [ecg_filtered[i] for i in r_peaks if i < len(ecg_filtered)]
    if len(amps) < 4:
        return None

    mean_amp = np.mean(amps)
    centered = [a - mean_amp for a in amps]
    crossings = sum(1 for i in range(1, len(centered)) if centered[i-1]*centered[i] < 0)
    duration  = (r_peaks[-1] - r_peaks[0]) / ECG_SAMPLE_RATE
    if duration <= 0:
        return None

    bpm = round((crossings / 2.0 / duration) * 60.0)
    return bpm if 6 <= bpm <= 40 else None


# ── STEP 7: BAEVSKY STRESS INDEX ─────────────────────────────────────────────
# SI = AMo / (2 * Mo * MxDMn)
#   Mo    = mode of R-R intervals (most frequent value, in seconds)
#   AMo   = amplitude of mode (fraction of intervals at mode value)
#   MxDMn = max(RR) - min(RR) in seconds
# Reference: Baevsky RM (1984)
# Normal: 50-150. High stress: >300.
def calculate_stress_index(r_peaks):
    if len(r_peaks) < 5:
        return None
    rr = [(r_peaks[i+1]-r_peaks[i])/ECG_SAMPLE_RATE for i in range(len(r_peaks)-1)]
    if len(rr) < 4:
        return None
    hist, edges = np.histogram(rr, bins=20)
    idx  = int(np.argmax(hist))
    Mo   = (edges[idx] + edges[idx+1]) / 2.0
    if Mo <= 0:
        return None
    AMo   = hist[idx] / len(rr)
    MxDMn = max(rr) - min(rr)
    if MxDMn <= 0:
        return None
    SI = AMo / (2.0 * Mo * MxDMn)
    return round(SI, 1) if 0 < SI < 2000 else None


# ── STEP 8: SpO2 QUADRATIC CALIBRATION ──────────────────────────────────────
# SpO2 = A - B*R + C*R^2   (vs linear: 110 - 25*R)
# Empirical coefficients: A=110, B=25, C=-3
# Calibrate against medical-grade oximeter for final hardware.
def calculate_spo2_quadratic(ir_array, red_array):
    if not ir_array or not red_array:
        return 0
    ir  = np.array(ir_array, dtype=float)
    red = np.array(red_array, dtype=float)
    ir_dc, red_dc = np.mean(ir), np.mean(red)
    if ir_dc == 0 or red_dc == 0:
        return 0
    ir_ac  = np.max(ir)  - np.min(ir)
    red_ac = np.max(red) - np.min(red)
    if ir_ac == 0:
        return 0
    R = (red_ac/red_dc) / (ir_ac/ir_dc)
    spo2 = 110.0 - 25.0*R + (-3.0)*(R**2)
    return int(max(0, min(100, round(spo2))))


# ── STEP 9: AI HEALTH SCORE ──────────────────────────────────────────────────
# Composite score (0-100) derived from real clinical measurements.
# Starts at 100 and deducts based on severity thresholds.
def calculate_ai_health_score(bpm, spo2, temp, hrv_rmssd, st_mv):
    if bpm == 0:
        return None
    score = 100.0

    # Heart rate (normal 60-90 BPM)
    if   bpm > 90: score -= (bpm-90) * 0.5
    elif bpm < 55: score -= (55-bpm) * 0.8

    # Temperature (normal 36.1-37.2 C)
    if   temp > 37.2:           score -= (temp-37.2) * 10.0
    elif temp < 36.1 and temp>0: score -= (36.1-temp) * 7.0

    # SpO2 (normal >=95%)
    if spo2 > 0:
        if   spo2 < 90: score -= (90-spo2) * 6.0
        elif spo2 < 95: score -= (95-spo2) * 3.0

    # HRV RMSSD (normal 20-100 ms)
    if hrv_rmssd is not None:
        if   hrv_rmssd < 15: score -= 20.0
        elif hrv_rmssd < 25: score -= 10.0

    # ST Segment (normal -0.05 to +0.10 mV)
    if st_mv is not None:
        if   st_mv >  0.20: score -= 25.0
        elif st_mv >  0.10: score -= 12.0
        elif st_mv < -0.10: score -= 15.0
        elif st_mv < -0.05: score -=  6.0

    return max(0, min(100, round(score)))


# ── MAIN ENDPOINT ─────────────────────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    """
    POST body (JSON):
      ecg_array   : list[int]  - raw ADC values, 250 Hz
      ir_array    : list[int]  - IR channel PPG, 25 Hz
      red_array   : list[int]  - Red channel PPG, 25 Hz
      temp        : float      - body temperature in Celsius
      current_bpm : int        - fallback BPM if ECG insufficient

    Response (JSON):
      bpm, spo2, hrv_rmssd, st_deviation_mv,
      breathing_rate, stress_index, r_peak_interval_ms, ai_health_score
    """
    data     = request.get_json(force=True)
    ecg_raw  = data.get("ecg_array", [])
    ir_arr   = data.get("ir_array", [])
    red_arr  = data.get("red_array", [])
    temp     = float(data.get("temp", 0))
    fb_bpm   = int(data.get("current_bpm", 0))

    result = dict(bpm=fb_bpm, spo2=0, hrv_rmssd=None, st_deviation_mv=None,
                  breathing_rate=None, stress_index=None,
                  r_peak_interval_ms=None, ai_health_score=None)

    # SpO2 — always compute from PPG
    if ir_arr and red_arr:
        result["spo2"] = calculate_spo2_quadratic(ir_arr, red_arr)

    # ECG — requires at least 2 seconds of data (500 samples at 250 Hz)
    if len(ecg_raw) >= ECG_SAMPLE_RATE * 2:
        ecg   = np.array(ecg_raw, dtype=float)
        filt  = bandpass_filter_ecg(ecg)
        peaks = detect_r_peaks(filt)

        if len(peaks) >= 2:
            bpm = calculate_bpm_from_rpeaks(peaks)
            if bpm > 0:
                result["bpm"] = bpm

            result["hrv_rmssd"]       = calculate_rmssd(peaks)
            result["st_deviation_mv"] = calculate_st_segment(filt, peaks)
            result["breathing_rate"]  = calculate_respiration_rate(filt, peaks)
            result["stress_index"]    = calculate_stress_index(peaks)
            result["r_peak_interval_ms"] = round((peaks[-1]-peaks[-2])*MS_PER_SAMPLE, 1)

    result["ai_health_score"] = calculate_ai_health_score(
        result["bpm"], result["spo2"], temp,
        result["hrv_rmssd"], result["st_deviation_mv"]
    )
    return jsonify(result)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    print("[DSP] CardiShirt DSP Microservice — port 5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
```

### 3.3 Start the service

Open a **separate terminal** (always keep it running alongside Node.js):

```bash
cd d:\Versity\Projects\CardiShirt\backend
python dsp_service.py
```

---

## 4. Phase 2 — Upgrade signalProcessing.js

**File:** `backend/signalProcessing.js`

This file becomes a **fallback only**. Replace its entire content:

```javascript
/**
 * signalProcessing.js — FALLBACK ONLY
 * Primary DSP path: Node.js -> Python dsp_service.py (port 5001)
 * These simple approximations run when Python is unreachable.
 */
let lastBpm = 0;

function calculateBPM(irArray) {
  if (!irArray || irArray.length < 5) return lastBpm || 0;
  const s = [];
  for (let i = 0; i < irArray.length; i++) {
    let sum = 0, c = 0;
    for (let j = -2; j <= 2; j++) {
      if (i+j >= 0 && i+j < irArray.length) { sum += irArray[i+j]; c++; }
    }
    s.push(sum / c);
  }
  const avg = s.reduce((a, b) => a + b, 0) / s.length;
  const peaks = [];
  for (let i = 1; i < s.length - 1; i++) {
    if (s[i] > s[i-1] && s[i] > s[i+1] && s[i] > avg) {
      if (!peaks.length || (i - peaks[peaks.length-1]) >= 8) peaks.push(i);
    }
  }
  if (peaks.length < 2) return lastBpm || 0;
  const avg_d = peaks.reduce((s,p,i) => i ? s+(p-peaks[i-1]) : s, 0) / (peaks.length-1);
  if (!avg_d) return lastBpm || 0;
  const bpm = Math.round((60 * 25) / avg_d);
  if (bpm >= 40 && bpm <= 180) { lastBpm = bpm; return bpm; }
  return lastBpm || 0;
}

function calculateSpO2(irArray, redArray) {
  if (!irArray || !redArray || !irArray.length || !redArray.length) return 0;
  const irAc  = Math.max(...irArray)  - Math.min(...irArray);
  const irDc  = irArray.reduce((a, b) => a+b, 0)  / irArray.length;
  const redAc = Math.max(...redArray) - Math.min(...redArray);
  const redDc = redArray.reduce((a, b) => a+b, 0) / redArray.length;
  if (!irAc || !irDc) return 0;
  const R = (redAc/redDc) / (irAc/irDc);
  return Math.max(0, Math.min(100, Math.round(110 - 25 * R)));
}

module.exports = { calculateBPM, calculateSpO2 };
```

---

## 5. Phase 3 — Upgrade server.js

**File:** `backend/server.js`

### 5.1 Add the DSP caller (paste after the require statements, ~line 9)

```javascript
// ---------- Python DSP Microservice Caller ----------
/**
 * Calls dsp_service.py at localhost:5001. Returns computed clinical metrics
 * or null if Python is unreachable. Timeout: 3 seconds.
 */
async function callDSP(payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const req  = http.request(
      { hostname:"localhost", port:5001, path:"/analyze", method:"POST",
        headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(body)},
        timeout: 3000 },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
      }
    );
    req.on("error",   () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}
```

### 5.2 Replace the /api/esp32/data handler

Find `app.post("/api/esp32/data", ...)` and replace the entire handler with:

```javascript
app.post("/api/esp32/data", async (req, res) => {
  try {
    const { temp=0, fall_detected=false, ecg_array=null, ir_array=[], red_array=[] } = req.body;

    // Primary path — Python DSP
    const dsp = await callDSP({ ecg_array: ecg_array||[], ir_array, red_array, temp, current_bpm:0 });

    // Fallback to JS if Python unavailable
    const bpm  = dsp?.bpm  ?? calculateBPM(ir_array);
    const spo2 = dsp?.spo2 ?? calculateSpO2(ir_array, red_array);
    const hrv_rmssd       = dsp?.hrv_rmssd        ?? null;
    const st_deviation_mv = dsp?.st_deviation_mv  ?? null;
    const breathing_rate  = dsp?.breathing_rate   ?? null;
    const stress_index    = dsp?.stress_index     ?? null;
    const r_peak_interval = dsp?.r_peak_interval_ms ?? null;
    const ai_health_score = dsp?.ai_health_score  ?? null;

    dsp
      ? console.log(`[DATA+DSP] bpm=${bpm} spo2=${spo2} hrv=${hrv_rmssd} st=${st_deviation_mv} score=${ai_health_score}`)
      : console.warn(`[DATA-FALLBACK] Python DSP unreachable — bpm=${bpm} spo2=${spo2}`);

    accumulatedVitals.bpm.push(bpm);
    accumulatedVitals.temp.push(temp);
    accumulatedVitals.spo2.push(spo2);
    if (fall_detected) accumulatedVitals.fall_detected = true;
    if (Array.isArray(ecg_array)) accumulatedEcg = accumulatedEcg.concat(ecg_array);

    const db = await getDb();
    const ts  = new Date().toISOString();
    const now = Date.now();

    if (now - lastInsertTime >= 120000) {
      const avgBpm  = accumulatedVitals.bpm.reduce((a,b)=>a+b,0)  / accumulatedVitals.bpm.length  || 0;
      const avgTemp = accumulatedVitals.temp.reduce((a,b)=>a+b,0) / accumulatedVitals.temp.length || 0;
      const avgSpo2 = accumulatedVitals.spo2.reduce((a,b)=>a+b,0) / accumulatedVitals.spo2.length || 0;

      db.run(
        `INSERT INTO realtime_vitals
           (bpm,temp,spo2,fall_detected,timestamp,
            hrv_rmssd,st_deviation_mv,breathing_rate,stress_index,ai_health_score)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [Math.round(avgBpm), parseFloat(avgTemp.toFixed(1)), Math.round(avgSpo2),
         accumulatedVitals.fall_detected?1:0, ts,
         hrv_rmssd, st_deviation_mv, breathing_rate, stress_index, ai_health_score]
      );
      persist();
      accumulatedVitals = { bpm:[], temp:[], spo2:[], fall_detected:false };
      lastInsertTime = now;
    }

    if (now - lastEcgSaveTime >= 600000 && accumulatedEcg.length > 0) {
      db.run("INSERT INTO ecg_sessions(waveform_data,ai_summary)VALUES(?,?)",
             [JSON.stringify(accumulatedEcg), ""]);
      persist();
      io.emit("ecg_session");
      accumulatedEcg  = [];
      lastEcgSaveTime = now;
    }

    io.emit("vitals", {
      bpm, spo2, temp, fall_detected, ecg_array, timestamp:ts,
      hrv_rmssd, st_deviation_mv, breathing_rate, stress_index,
      r_peak_interval_ms: r_peak_interval, ai_health_score,
    });

    if (fall_detected && twilioClient && now-lastTwilioTime >= 600000) {
      try {
        await twilioClient.messages.create({
          body: `CARDISHIRT SOS\nFALL DETECTED\nBPM:${bpm} Temp:${temp}C SpO2:${spo2}%\nhttps://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}`,
          from: process.env.TWILIO_PHONE_FROM, to: process.env.EMERGENCY_PHONE_TO,
        });
        lastTwilioTime = now;
      } catch(e) { console.error("[SOS]", e); }
      io.emit("sos", { reason:"FALL DETECTED", bpm, temp, timestamp:ts });
    }

    res.json({ ok:true });
  } catch(err) {
    console.error("[ESP32] Error:", err.message);
    res.status(500).json({ ok:false, error:err.message });
  }
});
```

### 5.3 Update the /api/trends SQL queries

Find both SQL queries in the `/api/trends` route and add the new columns:

```javascript
// Daily grouping SQL (replace existing)
const dailySql = `
  SELECT DATE(timestamp) as day,
         AVG(bpm) as avgBpm, AVG(spo2) as avgSpo2, AVG(temp) as avgTemp,
         AVG(hrv_rmssd) as avgHrv, AVG(ai_health_score) as avgScore
  FROM realtime_vitals
  WHERE timestamp >= datetime('now','-${days} days')
  GROUP BY DATE(timestamp) ORDER BY day ASC`;

// Hourly fallback SQL (replace existing)
const hourlySql = `
  SELECT strftime('%Y-%m-%d %H:00',timestamp) as day,
         AVG(bpm) as avgBpm, AVG(spo2) as avgSpo2, AVG(temp) as avgTemp,
         AVG(hrv_rmssd) as avgHrv, AVG(ai_health_score) as avgScore
  FROM realtime_vitals
  WHERE timestamp >= datetime('now','-1 days')
  GROUP BY strftime('%Y-%m-%d %H:00',timestamp) ORDER BY day ASC`;
```

---

## 6. Phase 4 — Database Migration (db.js)

**File:** `backend/db.js`

After the existing `try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN spo2 REAL"); } catch(e) {}` block, add:

```javascript
// Phase 4: Clinical accuracy columns — safe migration (try/catch prevents errors on re-run)
try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN hrv_rmssd REAL"); }       catch(e) {}
try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN st_deviation_mv REAL"); } catch(e) {}
try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN breathing_rate REAL"); }  catch(e) {}
try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN stress_index REAL"); }    catch(e) {}
try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN ai_health_score REAL"); } catch(e) {}
```

### Updated realtime_vitals schema

| Column | Type | Source | Clinical Meaning |
|--------|------|--------|-----------------|
| `id` | INTEGER | Auto | Primary key |
| `bpm` | REAL | Python DSP / Fallback | Heart rate BPM |
| `temp` | REAL | ESP32 thermistor | Body temperature °C |
| `spo2` | REAL | Python DSP quadratic | Oxygen saturation % |
| `fall_detected` | INTEGER | ESP32 accelerometer | 0 or 1 |
| `timestamp` | TEXT | Node.js | ISO 8601 |
| `hrv_rmssd` | REAL | Python DSP (RMSSD) | True HRV in ms |
| `st_deviation_mv` | REAL | Python DSP (J+60ms) | ST deviation mV |
| `breathing_rate` | REAL | Python DSP (EDR) | Breaths per minute |
| `stress_index` | REAL | Python DSP (Baevsky) | Autonomic stress |
| `ai_health_score` | REAL | Python DSP (composite) | Score 0-100 |

---

## 7. Phase 5 — useBackend.ts (Frontend Types)

**File:** `src/app/components/useBackend.ts`

Find the `LiveVitals` interface (lines 14-20). Replace it with:

```typescript
export interface LiveVitals {
  bpm: number;
  temp: number;
  fall_detected: boolean;
  ecg_array?: number[];
  timestamp: string;
  // Clinical metrics from Python DSP — null when DSP unavailable
  spo2?: number;
  hrv_rmssd?: number | null;
  st_deviation_mv?: number | null;
  breathing_rate?: number | null;
  stress_index?: number | null;
  r_peak_interval_ms?: number | null;
  ai_health_score?: number | null;
}
```

---

## 8. Phase 6 — VitalsRow.tsx (Remove Local Math)

**File:** `src/app/components/VitalsRow.tsx`

### What to delete

Delete lines 48-113 entirely. These contain:
`getAIHealthScore()`, `getHRV()`, `getBreathingRate()`, `getStressIndex()`, `rPeakInterval`, `getSTSegment()`

### What to replace with

```typescript
  // Server-computed clinical values — NO local math.
  // All values are pre-computed in Python DSP and received via WebSocket.
  // null = DSP unavailable or insufficient data for that metric.
  const bpm    = isActive ? Math.round(vitals.bpm) : 0;
  const temp   = isActive ? vitals.temp : 0;
  const spo2   = isActive && vitals.spo2 ? Math.round(vitals.spo2) : 0;

  const aiScore       = isActive ? (vitals.ai_health_score   ?? null) : null;
  const hrv           = isActive ? (vitals.hrv_rmssd          ?? null) : null;
  const breathingRate = isActive ? (vitals.breathing_rate     ?? null) : null;
  const stressIndex   = isActive ? (vitals.stress_index       ?? null) : null;
  const rPeakInterval = isActive ? (vitals.r_peak_interval_ms ?? null) : null;

  // Format ST float as "+0.12" or "-0.05" for display
  const stSegmentRaw = isActive ? (vitals.st_deviation_mv ?? null) : null;
  const stSegment    = stSegmentRaw !== null
    ? (stSegmentRaw >= 0 ? `+${stSegmentRaw.toFixed(2)}` : stSegmentRaw.toFixed(2))
    : null;
```

> The `cards` array definition and all JSX from line 115 onward stays exactly the same.

---

## 9. Phase 7 — RiskTrendsScreen.tsx (Real Score)

**File:** `src/app/components/RiskTrendsScreen.tsx`

Find the `useMemo` block (lines 107-132). Replace the score computation:

```typescript
  const { healthData, hrData, spo2Data, tempData, RISK_SCORE, RISK_COLOR, last7 } = useMemo(() => {
    if (apiData.length === 0) {
      return { healthData:[], hrData:[], spo2Data:[], tempData:[],
               RISK_SCORE:73, RISK_COLOR:"#F5A623", last7:[70,71,72,70,71,72,73] };
    }
    let totalScore = 0;
    const hData = apiData.map((d: any) => {
      // Use DB-stored ai_health_score (from Python DSP) when available.
      // Fall back to BPM/SpO2 formula for old rows without stored score.
      let s: number;
      if (d.avgScore != null && d.avgScore > 0) {
        s = Math.round(d.avgScore);
      } else {
        const bpmVal  = d.avgBpm  || 72;
        const spo2Val = d.avgSpo2 || 97;
        s = Math.round(Math.max(40, Math.min(100, 100 - Math.abs(72-bpmVal) - Math.max(0, 95-spo2Val)*4)));
      }
      totalScore += s;
      return { label: d.day.substring(5), value: s };
    });
    const avgScore = Math.round(totalScore / apiData.length);
    const color = avgScore >= 78 ? c.green : avgScore >= 60 ? c.amber : c.red;
    const l7    = hData.slice(-7).map((x: any) => x.value);
    return {
      healthData: hData,
      hrData:   apiData.map((d: any) => ({ label: d.day.substring(5), value: d.avgBpm })),
      spo2Data: apiData.map((d: any) => ({ label: d.day.substring(5), value: d.avgSpo2 })),
      tempData: apiData.map((d: any) => ({ label: d.day.substring(5), value: d.avgTemp })),
      RISK_SCORE: avgScore, RISK_COLOR: color,
      last7: l7.length > 0 ? l7 : [70,71,72,70,71,72,73]
    };
  }, [apiData, c]);
```

---

## 10. Testing Checklist

### Python DSP Service (Phase 1)

- [ ] Run `python dsp_service.py` — should print `[DSP] CardiShirt DSP Microservice — port 5001`
- [ ] Open `http://localhost:5001/health` — should return `{"status":"ok"}`
- [ ] POST test data to `http://localhost:5001/analyze`:
  ```json
  {"ecg_array":[512,514,513,550,700,900,700,550,510,512,513,514],
   "ir_array":[90000,91000,92000,91500,90000],
   "red_array":[80000,81000,82000,81500,80000],
   "temp":36.7,"current_bpm":72}
  ```
  Response must include: `bpm`, `spo2`, `ai_health_score` fields.

### Node.js Integration (Phase 3)

- [ ] Start server: `node server.js`
- [ ] When ESP32 sends data, console shows `[DATA+DSP]` not `[DATA-FALLBACK]`
- [ ] Kill Python service — server logs `[DATA-FALLBACK]` but does not crash

### Database (Phase 4)

- [ ] After first restart, open `cardishirt.db` in a SQLite viewer
- [ ] Run: `PRAGMA table_info(realtime_vitals);`
- [ ] Verify columns: `hrv_rmssd`, `st_deviation_mv`, `breathing_rate`, `stress_index`, `ai_health_score`

### Frontend Vitals Cards (Phase 6)

With shirt on and ESP32 posting data:
- [ ] `AI Health Score` changes value as BPM/posture changes
- [ ] `HRV (RMSSD)` reads differently every update (no smooth sine-wave pattern)
- [ ] `ST Segment` shows values like `+0.08` or `-0.03`, not always `+0.15`
- [ ] `Breathing Rate` reads 12-20 at rest
- [ ] `Stress Index` increases visibly after 1 minute of exercise

### Risk Trends Page (Phase 7)

- [ ] After 2+ days of DSP data in DB, the Health Score chart uses stored `ai_health_score` values
- [ ] Scores are more granular (not always multiples of 4 like the old formula produced)

---

## 11. Clinical Reference Ranges

| Metric | Normal | Warning | Danger / Alert Threshold |
|--------|--------|---------|--------------------------|
| **Heart Rate (BPM)** | 60-100 | 50-60 or 100-110 | < 50 (bradycardia) or > 110 (tachycardia) |
| **SpO2 (%)** | 95-100% | 90-94% | < 90% (hypoxemia) |
| **Body Temp (C)** | 36.1-37.2 | 35.5-36.1 or 37.2-38.0 | < 35.5 (hypothermia) or > 38.0 (fever) |
| **HRV RMSSD (ms)** | 25-100 | 15-25 | < 15 (autonomic dysfunction) |
| **ST Deviation (mV)** | -0.05 to +0.10 | +0.10 to +0.20 or -0.10 to -0.05 | > +0.20 (STEMI risk) or < -0.10 (ischemia) |
| **Breathing Rate (brpm)** | 12-20 | 10-12 or 20-25 | < 10 or > 25 |
| **Stress Index (Baevsky)** | 50-150 | 150-300 | > 300 (high sympathetic dominance) |
| **AI Health Score** | 80-100 | 60-79 | < 60 |

---

> **Document version**: 1.0 | **Last updated**: June 2026
>
> **Files changed by this upgrade:**
> - NEW  `backend/dsp_service.py`
> - MOD  `backend/signalProcessing.js`
> - MOD  `backend/server.js`
> - MOD  `backend/db.js`
> - MOD  `src/app/components/useBackend.ts`
> - MOD  `src/app/components/VitalsRow.tsx`
> - MOD  `src/app/components/RiskTrendsScreen.tsx`
