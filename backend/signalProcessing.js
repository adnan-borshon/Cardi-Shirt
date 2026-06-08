/**
 * signalProcessing.js — FALLBACK ONLY
 * Primary DSP path: Node.js -> Python dsp_service.py (port 5001)
 * These simple approximations run when Python is unreachable.
 */
let lastBpm = 0;

function calculateBPM(irArray, ppgSampleRate = 25) {
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
  const bpm = Math.round((60 * ppgSampleRate) / avg_d);
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
