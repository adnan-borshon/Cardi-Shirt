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
import sys
print("[DSP] Starting CardiShirt DSP Microservice...")
print("[DSP] Loading heavy clinical ML libraries (scipy, neurokit2) - this may take 10-20 seconds on Windows...")
sys.stdout.flush()

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
    print("[DSP] Libraries loaded successfully!")
    print("[DSP] CardiShirt DSP Microservice — port 5001")
    app.run(host="127.0.0.1", port=5001, debug=False)
