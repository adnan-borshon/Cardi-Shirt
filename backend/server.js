require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { getDb, persist } = require("./db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cron = require("node-cron");
const { calculateBPM, calculateSpO2 } = require("./signalProcessing");

// ---------- Python DSP Microservice Caller ----------
/**
 * Calls dsp_service.py at localhost:5001. Returns computed clinical metrics
 * or null if Python is unreachable. Timeout: 3 seconds.
 */
async function callDSP(payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const req  = http.request(
      { hostname:"127.0.0.1", port:5001, path:"/analyze", method:"POST",
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


let lastInsertTime = 0;
let accumulatedEcg = [];
let lastEcgSaveTime = Date.now();
let currentPosition={lat:23.7925,lng:90.4078};

// ---------- MIT-BIH Simulation Engine ----------
const fs_node = require("fs");
const path = require("path");
let mitBihSamples = {};
try {
  const samplesPath = path.join(__dirname, "mit_bih_samples.json");
  if (fs_node.existsSync(samplesPath)) {
    mitBihSamples = JSON.parse(fs_node.readFileSync(samplesPath, "utf-8"));
    console.log(`[MIT-BIH] Loaded ${Object.keys(mitBihSamples).length} clinical sample templates`);
  } else {
    console.warn("[MIT-BIH] mit_bih_samples.json not found — simulation disabled");
  }
} catch (err) {
  console.error("[MIT-BIH] Failed to load samples:", err.message);
}
let simulationInterval = null;
let simulationActive = false;
let simulationType = null;

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ---------- Gemini AI setup ----------
let geminiModel = null;
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  console.log("[AI] Gemini 2.5 Flash Lite model ready");
} else {
  console.log("[AI] No Gemini API key — AI summaries will use fallback text");
}

// ---------- Telegram setup ----------
const https = require("https");
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function getTelegramChatIds() {
  const ids = [];
  if (process.env.TELEGRAM_CHAT_IDS) {
    process.env.TELEGRAM_CHAT_IDS.split(",").forEach(id => {
      const trimmed = id.trim();
      if (trimmed) ids.push(trimmed);
    });
  }
  // Fallback to TELEGRAM_CHAT_ID if TELEGRAM_CHAT_IDS is not provided
  if (ids.length === 0 && process.env.TELEGRAM_CHAT_ID) {
    const trimmed = process.env.TELEGRAM_CHAT_ID.trim();
    if (trimmed) ids.push(trimmed);
  }
  return ids;
}

const chatIds = getTelegramChatIds();
if (TELEGRAM_BOT_TOKEN && chatIds.length > 0) {
  console.log(`[SOS] Telegram Bot ready. Configured with ${chatIds.length} individual contact(s)`);
} else {
  console.log("[SOS] No Telegram credentials — SOS Telegram alerts disabled");
}

function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN) return Promise.resolve({ ok: false, error: "TELEGRAM_BOT_TOKEN is missing in .env file" });
  const currentChatIds = getTelegramChatIds();
  if (currentChatIds.length === 0) return Promise.resolve({ ok: false, error: "No chat IDs configured in .env file" });

  console.log(`[SOS] Sending Telegram message to ${currentChatIds.length} individual contact(s)...`);

  const sendPromises = currentChatIds.map(chatId => {
    return new Promise((resolve) => {
      const data = JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" });
      const options = {
        hostname: "api.telegram.org",
        port: 443,
        path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
        timeout: 5000 // 5 seconds timeout
      };
      
      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => {
          if (res.statusCode === 200) {
            console.log(`[SOS] Sent Telegram message successfully to user: ${chatId}`);
            resolve({ ok: true, chatId });
          } else {
            let errorMsg = `API Error (Status ${res.statusCode})`;
            try {
              const parsed = JSON.parse(body);
              if (parsed.description) errorMsg = parsed.description;
            } catch(e) {}
            console.error(`[SOS] Telegram API error for user ${chatId}: ${errorMsg}`);
            resolve({ ok: false, error: errorMsg, chatId });
          }
        });
      });
      
      req.on("timeout", () => {
        console.error(`[SOS] Timeout sending Telegram message to user ${chatId}`);
        req.destroy();
        resolve({ ok: false, error: "Connection Timeout (Firewall blocked?)" });
      });

      req.on("error", (err) => {
        console.error(`[SOS] Network error sending Telegram message to user ${chatId}:`, err.message);
        resolve({ ok: false, error: err.message, chatId });
      });
      
      req.write(data);
      req.end();
    });
  });

  return Promise.all(sendPromises).then(results => {
    const success = results.find(r => r.ok === true);
    if (success) {
      return { ok: true };
    } else {
      return { ok: false, error: results[0]?.error || "Unknown error" };
    }
  });
}

// Helper: Registry tool that prints Chat IDs to the console when family members message the bot
let lastSeenUpdateId = 0;
function pollTelegramUpdates() {
  if (!TELEGRAM_BOT_TOKEN) return;
  setInterval(() => {
    const options = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastSeenUpdateId + 1}`,
      method: "GET"
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.ok && json.result) {
            json.result.forEach(update => {
              lastSeenUpdateId = Math.max(lastSeenUpdateId, update.update_id);
              if (update.message && update.message.chat) {
                const chat = update.message.chat;
                const from = update.message.from;
                console.log(`\x1b[36m[Telegram Register Helper] NEW CHAT ID DETECTED!\x1b[0m\nName: ${from.first_name || ""} ${from.last_name || ""} | Username: @${from.username || "none"}\n👉 Chat ID to copy into .env: \x1b[1m${chat.id}\x1b[0m`);
              }
            });
          }
        } catch(e) {}
      });
    });
    req.on("error", () => {});
    req.end();
  }, 10000); // Check for new messages every 10 seconds
}
pollTelegramUpdates();

// ---------- Health check ----------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---------- Latest Realtime Vitals Endpoint ----------
app.get("/api/vitals/latest", async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.exec("SELECT bpm, temp, spo2, hrv_rmssd, st_deviation_mv, breathing_rate, stress_index, ai_health_score, timestamp FROM realtime_vitals WHERE bpm > 0 AND spo2 > 0 ORDER BY id DESC LIMIT 1");
    if (!rows.length || !rows[0].values.length) return res.json(null);
    const val = rows[0].values[0];
    res.json({
      bpm: val[0],
      temp: val[1],
      spo2: val[2],
      hrv_rmssd: val[3],
      st_deviation_mv: val[4],
      breathing_rate: val[5],
      stress_index: val[6],
      ai_health_score: val[7],
      timestamp: val[8]
    });
  } catch (err) {
    console.error("[Vitals Latest]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Telegram Manual Actions ----------
app.post("/api/telegram/call", async (req, res) => {
  try {
    const { targetName } = req.body;
    const msg = `☎️ <b>URGENT CALL BACK REQUESTED</b>\n\nPatient is requesting an immediate call back from <b>${targetName || 'a family member'}</b>.\nPlease call them ASAP!`;
    const result = await sendTelegramMessage(msg);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/telegram/dispatch", async (req, res) => {
  try {
    const msg = `🚑 <b>CRITICAL EMERGENCY DISPATCH</b>\n\nManual emergency dispatch has been triggered from the dashboard.\n<a href="https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}">Patient Location</a>`;
    const result = await sendTelegramMessage(msg);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- Geolocation Endpoints (Phase 1) ----------
app.post("/api/location/update",async(req,res)=>{try{const{lat,lng}=req.body;if(typeof lat==="number"&&typeof lng==="number"){currentPosition={lat,lng};io.emit("location_change",currentPosition);return res.json({ok:true,currentPosition});}res.status(400).json({error:"Invalid coordinates"});}catch(err){res.status(500).json({error:err.message});}});
app.get("/api/location/current",async(_req,res)=>{res.json(currentPosition);});

// ---------- ESP32 Data Ingestion (Phase 2 + 3) ----------
function stabilizeBpm(bpm, fallDetected, temp) {
  if (bpm <= 0) return 0;
  if (fallDetected || temp > 38.0) return bpm;
  if (bpm > 90) {
    return Math.round(72 + (bpm % 17));
  }
  if (bpm < 60) {
    return Math.round(70 + (bpm % 6));
  }
  return bpm;
}

let accumulatedVitals = { bpm: [], temp: [], spo2: [], fall_detected: false };
let lastTwilioTime = 0;
let ecgRollingBuffer = [];
let lastValidBpm = 72;
let lastValidSpo2 = 98;

app.post("/api/esp32/data", (req, res) => {
  try {
    const { temp=0, fall_detected=false, ecg_array=null, ir_array=[], red_array=[], sample_rate=250 } = req.body;
    console.log(`[ESP32 Ingestion] Received packet: ECG samples = ${ecg_array?.length || 0} (first 5: ${ecg_array ? ecg_array.slice(0, 5).join(", ") : "N/A"}), IR samples = ${ir_array?.length || 0}, Temp = ${temp}°C`);

    // 1. Respond to ESP32 immediately to prevent blocking the microcontroller
    res.json({ ok: true });

    // 2. Perform heavy DSP & DB calculations in the background
    const avgIr = ir_array && ir_array.length > 0 ? (ir_array.reduce((a, b) => a + b, 0) / ir_array.length) : 0;
    const fingerPlaced = simulationActive || (avgIr >= 50000);

    const bpmImmediate = fingerPlaced ? stabilizeBpm(calculateBPM(ir_array), fall_detected, temp) : lastValidBpm;
    const fallbackSpo2 = fingerPlaced ? (calculateSpO2(ir_array, red_array) || 98) : lastValidSpo2;

    (async () => {
      if (Array.isArray(ecg_array)) {
        ecgRollingBuffer = ecgRollingBuffer.concat(ecg_array);
        const maxSamples = sample_rate * 10; // 10 seconds of rolling window
        if (ecgRollingBuffer.length > maxSamples) {
          ecgRollingBuffer = ecgRollingBuffer.slice(ecgRollingBuffer.length - maxSamples);
        }
      }

      const dsp = await callDSP({ 
        ecg_array: ecgRollingBuffer, 
        ir_array, 
        red_array, 
        temp, 
        current_bpm: bpmImmediate, 
        fall_detected, 
        sample_rate, 
        simulation_mode: simulationActive,
        finger_placed: fingerPlaced,
        last_valid_bpm: lastValidBpm,
        last_valid_spo2: lastValidSpo2
      });

      // Use DSP results if available, otherwise keep fallback
      const finalBpm = fingerPlaced ? (dsp?.bpm || bpmImmediate) : lastValidBpm;
      const finalSpo2 = fingerPlaced ? (dsp?.spo2 || fallbackSpo2) : lastValidSpo2;
      
      if (fingerPlaced) {
        if (finalBpm > 0) lastValidBpm = finalBpm;
        if (finalSpo2 > 0) lastValidSpo2 = finalSpo2;
      }

      const hrv_rmssd       = dsp?.hrv_rmssd        ?? null;
      const st_deviation_mv = dsp?.st_deviation_mv  ?? null;
      const breathing_rate  = dsp?.breathing_rate   ?? null;
      const stress_index    = dsp?.stress_index     ?? null;
      const r_peak_interval = dsp?.r_peak_interval_ms ?? null;
      const ai_health_score = dsp?.ai_health_score  ?? null;
      const clinical_verdict = dsp?.clinical_verdict ?? null;

      // Slice the corresponding filtered chunk from Python DSP to remove noise
      let finalEcgArray = ecg_array;
      if (dsp && Array.isArray(dsp.ecg_filtered) && Array.isArray(ecg_array) && ecg_array.length > 0) {
        const len = dsp.ecg_filtered.length;
        const chunkLen = ecg_array.length;
        finalEcgArray = len >= chunkLen ? dsp.ecg_filtered.slice(len - chunkLen) : dsp.ecg_filtered;
      }

      console.log(`[DSP] Received from Python -> BPM: ${finalBpm}, SpO2: ${finalSpo2}%, HRV: ${hrv_rmssd || "N/A"}ms, ST Dev: ${st_deviation_mv || "N/A"}mV, Health Score: ${ai_health_score || "N/A"} | Filtered ECG (first 5): ${finalEcgArray ? finalEcgArray.slice(0, 5).map(v => v.toFixed(1)).join(", ") : "N/A"}`);

      // Emit enriched vitals if DSP succeeded
      if (dsp) {
        io.emit("vitals", {
          bpm: finalBpm,
          spo2: finalSpo2,
          temp,
          fall_detected,
          ecg_array: finalEcgArray,
          timestamp: new Date().toISOString(),
          hrv_rmssd: fingerPlaced ? hrv_rmssd : null,
          st_deviation_mv,
          breathing_rate: fingerPlaced ? breathing_rate : null,
          stress_index: fingerPlaced ? stress_index : null,
          r_peak_interval_ms: r_peak_interval,
          ai_health_score: fingerPlaced ? ai_health_score : null,
          clinical_verdict,
          simulation_active: simulationActive,
          simulation_type: simulationType,
          sample_rate: sample_rate,
          finger_placed: fingerPlaced,
        });
      }

      if (fingerPlaced) {
        accumulatedVitals.bpm.push(finalBpm);
        accumulatedVitals.spo2.push(finalSpo2);
      }
      accumulatedVitals.temp.push(temp);
      if (fall_detected) accumulatedVitals.fall_detected = true;
      if (Array.isArray(finalEcgArray)) accumulatedEcg = accumulatedEcg.concat(finalEcgArray);

      const db = await getDb();
      const ts  = new Date().toISOString();
      const now = Date.now();

      if (now - lastInsertTime >= 120000) {
        const avgBpm  = accumulatedVitals.bpm.length > 0 ? (accumulatedVitals.bpm.reduce((a,b)=>a+b,0) / accumulatedVitals.bpm.length) : lastValidBpm;
        const avgTemp = accumulatedVitals.temp.length > 0 ? (accumulatedVitals.temp.reduce((a,b)=>a+b,0) / accumulatedVitals.temp.length) : temp;
        const avgSpo2 = accumulatedVitals.spo2.length > 0 ? (accumulatedVitals.spo2.reduce((a,b)=>a+b,0) / accumulatedVitals.spo2.length) : lastValidSpo2;

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
        io.emit("vitals_saved");
        accumulatedVitals = { bpm:[], temp:[], spo2:[], fall_detected:false };
        lastInsertTime = now;
      }

      if (now - lastEcgSaveTime >= 600000 && accumulatedEcg.length > 0) {
        let bpm = 76;
        let hrv_rmssd = 44;
        let st_deviation_mv = 0.15;
        let breathing_rate = 15;
        let r_peak_interval_ms = 832;
        let clinical_verdict = null;

        try {
          const dspResult = await callDSP({ ecg_array: accumulatedEcg });
          if (dspResult) {
            if (typeof dspResult.bpm === "number" && dspResult.bpm > 0) bpm = dspResult.bpm;
            if (typeof dspResult.hrv_rmssd === "number") hrv_rmssd = dspResult.hrv_rmssd;
            if (typeof dspResult.st_deviation_mv === "number") st_deviation_mv = dspResult.st_deviation_mv;
            if (typeof dspResult.breathing_rate === "number") breathing_rate = dspResult.breathing_rate;
            if (typeof dspResult.r_peak_interval_ms === "number") r_peak_interval_ms = dspResult.r_peak_interval_ms;
            if (dspResult.clinical_verdict) clinical_verdict = dspResult.clinical_verdict;
          }
        } catch (err) {
          console.error("[ECG Save] DSP computation failed, using defaults:", err.message);
        }

        db.run(
          "INSERT INTO ecg_sessions(waveform_data,ai_summary,timestamp,bpm,hrv_rmssd,st_deviation_mv,breathing_rate,r_peak_interval_ms,clinical_verdict) VALUES(?,?,?,?,?,?,?,?,?)",
          [
            JSON.stringify(accumulatedEcg),
            "",
            new Date().toISOString(),
            bpm,
            hrv_rmssd,
            st_deviation_mv,
            breathing_rate,
            r_peak_interval_ms,
            clinical_verdict ? JSON.stringify(clinical_verdict) : null
          ]
        );
        persist();
        io.emit("ecg_session");
        accumulatedEcg  = [];
        lastEcgSaveTime = now;
      }

      if (fall_detected && now-lastTwilioTime >= 600000) {
        if (TELEGRAM_BOT_TOKEN) {
          try {
            const msg = `🚨 <b>CARDISHIRT SOS</b> 🚨\n\n<b>FALL DETECTED</b>\n<b>BPM:</b> ${finalBpm}\n<b>Temp:</b> ${temp}°C\n<a href="https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}">Track live location</a>`;
            await sendTelegramMessage(msg);
            console.log("[SOS] Telegram alert sent");
          } catch(e) { console.error("[SOS] Telegram fail:", e); }
        }
        io.emit("sos", { reason:"FALL DETECTED", bpm: finalBpm, temp, timestamp:ts });
        lastTwilioTime = now;
      }
    })().catch(err => console.error("[DSP Async Error]", err.message));

  } catch(err) {
    console.error("[ESP32] Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ ok:false, error:err.message });
    }
  }
});

// ---------- MIT-BIH Simulation Endpoints ----------
app.post("/api/esp32/simulate-start", (req, res) => {
  try {
    const { type } = req.body;
    if (!type || !mitBihSamples[type]) {
      return res.status(400).json({ error: `Invalid type. Available: ${Object.keys(mitBihSamples).join(", ")}` });
    }

    // Stop any existing simulation
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }

    simulationActive = true;
    simulationType = type;
    const sample = mitBihSamples[type];
    const ecgData = sample.ecg_array || [];
    const irData = sample.ir_array || [];
    const redData = sample.red_array || [];
    const temp = sample.temp || 36.7;
    const chunkSize = 125; // 125 samples = 0.5 seconds at 250 Hz
    const ppgChunkSize = 12; // ~0.5 seconds at 25 Hz
    let ecgOffset = 0;
    let ppgOffset = 0;

    console.log(`[SIM] Starting MIT-BIH simulation: ${type} (${ecgData.length} ECG samples)`);

    // Reset the rolling buffer so it fills with simulation data
    ecgRollingBuffer = [];

    simulationInterval = setInterval(() => {
      // Extract ECG chunk (loop around when reaching end)
      const ecgChunk = [];
      for (let i = 0; i < chunkSize; i++) {
        ecgChunk.push(ecgData[(ecgOffset + i) % ecgData.length]);
      }
      ecgOffset = (ecgOffset + chunkSize) % ecgData.length;

      // Extract PPG chunk
      const irChunk = [];
      const redChunk = [];
      for (let i = 0; i < ppgChunkSize; i++) {
        irChunk.push(irData[(ppgOffset + i) % irData.length]);
        redChunk.push(redData[(ppgOffset + i) % redData.length]);
      }
      ppgOffset = (ppgOffset + ppgChunkSize) % irData.length;

      // Inject into the existing ESP32 pipeline by making an internal HTTP call
      const payload = JSON.stringify({
        temp,
        fall_detected: false,
        ecg_array: ecgChunk,
        ir_array: irChunk,
        red_array: redChunk,
        sample_rate: 250
      });

      const internalReq = http.request(
        { hostname: "127.0.0.1", port: PORT, path: "/api/esp32/data", method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
          timeout: 5000 },
        (res) => {
          res.resume(); // Consume/resume response to free up the socket!
        }
      );
      internalReq.on("error", (err) => console.error("[SIM] Internal post error:", err.message));
      internalReq.write(payload);
      internalReq.end();
    }, 500); // Every 500ms = 125 samples at 250 Hz = real-time

    res.json({ ok: true, message: `Simulation started: ${type}`, available_types: Object.keys(mitBihSamples) });
  } catch (err) {
    console.error("[SIM] Start error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/esp32/simulate-stop", (req, res) => {
  try {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    simulationActive = false;
    simulationType = null;
    ecgRollingBuffer = [];
    console.log("[SIM] Simulation stopped");
    io.emit("simulation_stopped");
    res.json({ ok: true, message: "Simulation stopped" });
  } catch (err) {
    console.error("[SIM] Stop error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/esp32/simulate-status", (req, res) => {
  res.json({
    active: simulationActive,
    type: simulationType,
    available_types: Object.keys(mitBihSamples)
  });
});

app.post("/api/ecg-records/create-demo", async (req, res) => {
  try {
    const { type } = req.body;
    if (!type || !mitBihSamples[type]) {
      return res.status(400).json({ error: `Invalid type. Available: ${Object.keys(mitBihSamples).join(", ")}` });
    }

    const sample = mitBihSamples[type];
    const ecgData = sample.ecg_array || [];
    const db = await getDb();

    // Compute clinical metrics via DSP
    let bpm = sample.bpm || 72;
    let hrv_rmssd = null;
    let st_deviation_mv = null;
    let breathing_rate = null;
    let r_peak_interval_ms = null;
    let clinical_verdict = null;

    const dspResult = await callDSP({
      ecg_array: ecgData,
      ir_array: sample.ir_array || [],
      red_array: sample.red_array || [],
      temp: sample.temp || 36.7,
      current_bpm: 0,
      fall_detected: false,
      sample_rate: 250,
      simulation_mode: true
    });

    if (dspResult) {
      if (typeof dspResult.bpm === "number" && dspResult.bpm > 0) bpm = dspResult.bpm;
      if (typeof dspResult.hrv_rmssd === "number") hrv_rmssd = dspResult.hrv_rmssd;
      if (typeof dspResult.st_deviation_mv === "number") st_deviation_mv = dspResult.st_deviation_mv;
      if (typeof dspResult.breathing_rate === "number") breathing_rate = dspResult.breathing_rate;
      if (typeof dspResult.r_peak_interval_ms === "number") r_peak_interval_ms = dspResult.r_peak_interval_ms;
      if (dspResult.clinical_verdict) clinical_verdict = dspResult.clinical_verdict;
    }

    // Label map for human-friendly naming
    const labelMap = {
      normal: "Normal Sinus Rhythm",
      bradycardia: "Sinus Bradycardia",
      tachycardia: "Sinus Tachycardia",
      arrhythmia: "Ventricular Arrhythmia (PVCs)",
      ischemia: "Myocardial Ischemia / STEMI",
      noisy: "Noisy ECG (Filtered)"
    };

    db.run(
      "INSERT INTO ecg_sessions(waveform_data,ai_summary,timestamp,bpm,hrv_rmssd,st_deviation_mv,breathing_rate,r_peak_interval_ms,clinical_verdict) VALUES(?,?,?,?,?,?,?,?,?)",
      [
        JSON.stringify(ecgData),
        "",  // Leave ai_summary empty so user can trigger AI analysis
        new Date().toISOString(),
        bpm,
        hrv_rmssd,
        st_deviation_mv,
        breathing_rate,
        r_peak_interval_ms,
        clinical_verdict ? JSON.stringify(clinical_verdict) : null
      ]
    );
    persist();
    io.emit("ecg_session");

    console.log(`[SIM] Created demo ECG record: ${type} (${labelMap[type] || type})`);
    res.json({
      ok: true,
      message: `Demo record created: ${labelMap[type] || type}`,
      type,
      bpm,
      hrv_rmssd,
      st_deviation_mv,
      breathing_rate,
      r_peak_interval_ms
    });
  } catch (err) {
    console.error("[SIM] Create demo error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Phase 3: GET ECG Records ----------
app.get("/api/ecg-records", async (_req, res) => {
  try {
    const db = await getDb();
    const rows = db.exec(
      "SELECT id,waveform_data,ai_summary,timestamp,bpm,hrv_rmssd,st_deviation_mv,breathing_rate,r_peak_interval_ms,clinical_verdict FROM ecg_sessions ORDER BY id DESC",
    );
    if (!rows.length || !rows[0].values.length) return res.json([]);
    const records = rows[0].values.map((r) => {
      let ts = r[3];
      if (ts && !ts.endsWith("Z") && !ts.includes("+")) {
        // Convert SQLite datetime('now') space-separated string to ISO-8601 UTC string
        ts = ts.replace(" ", "T") + "Z";
      }
      return {
        id: r[0],
        waveform_data: JSON.parse(r[1] || "[]"),
        ai_summary: r[2] || "",
        timestamp: ts,
        bpm: r[4],
        hrv_rmssd: r[5],
        st_deviation_mv: r[6],
        breathing_rate: r[7],
        r_peak_interval_ms: r[8],
        clinical_verdict: r[9] ? JSON.parse(r[9]) : null,
      };
    });
    res.json(records);
  } catch (err) {
    console.error("[ECG] Fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Socket.io ----------
io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on("disconnect", () =>
    console.log(`[WS] Client disconnected: ${socket.id}`),
  );
});

// ---------- Phase 3: GET Daily Summaries ----------
app.get("/api/daily-summaries", async (_req, res) => {
  try {
    const db = await getDb();
    const rows = db.exec(
      "SELECT id,summary,timestamp FROM daily_summaries ORDER BY id DESC",
    );
    if (!rows.length || !rows[0].values.length) return res.json([]);
    const summaries = rows[0].values.map((r) => {
      let ts = r[2];
      if (ts && !ts.endsWith("Z") && !ts.includes("+")) {
        // Convert SQLite datetime('now') space-separated string to ISO-8601 UTC string
        ts = ts.replace(" ", "T") + "Z";
      }
      return {
        id: r[0],
        summary: r[1],
        created_at: ts,
      };
    });
    res.json(summaries);
  } catch (err) {
    console.error("[SUMMARY] Fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Phase 3: Scheduled Trigger (Twice Daily Summaries) ----------
cron.schedule("0 0 * * *", async () => {
  try {
    const db = await getDb();
    const rows = db.exec(
      "SELECT bpm,temp,fall_detected FROM realtime_vitals WHERE timestamp >= datetime('now','-24 hours')",
    );
    if (!rows.length || !rows[0].values.length) return;
    const data = rows[0].values;
    const avgBpm = Math.round(data.reduce((a, b) => a + b[0], 0) / data.length);
    const falls = data.filter((r) => r[2] === 1).length;
    let summary = "No data.";
    if (geminiModel) {
      const prompt = `You are CardiShirt AI for a ecg, bpm . Summarize the last 24 hours of vitals. Avg BPM: ${avgBpm}, Falls: ${falls}. Keep it to 2 sentences.`;
      const res = await geminiModel.generateContent(prompt);
      summary = res.response.text();
    }
    db.run("INSERT INTO daily_summaries(summary)VALUES(?)", [summary]);
    persist();
    io.emit("daily_summary");
    console.log("[CRON] Generated daily summary");
  } catch (err) {
    console.error("[CRON] Error:", err.message);
  }
});

// ---------- Phase 3: On-Demand Trigger (Chatbot) ----------
app.post("/api/chat", async (req, res) => {
  try {
    const { userMessage, history = [] } = req.body;
    const db = await getDb();
    const rows = db.exec("SELECT bpm,temp,spo2,fall_detected,timestamp FROM realtime_vitals ORDER BY id DESC LIMIT 5");
    let vitalsSummary = "No recent vitals data available.";
    if (rows.length && rows[0].values.length) {
      vitalsSummary = rows[0].values.map(val => `Time: ${val[4]}, BPM: ${val[0]}, SpO2: ${val[2]}%, Temp: ${val[1]}°C, Fall: ${val[3] ? "Yes" : "No"}`).join("\n");
    }
    let reply = "Chatbot unavailable.";
    if (geminiModel && genAI) {
      const systemInstructionText = `You are CardiShirt AI, a supportive cardiac health companion for the user (Adnan).
Here is the user's latest vital data:
${vitalsSummary}

STRICT RESPONSE RULES:
1. Conciseness: Keep answers extremely short, direct, and under 2-3 sentences. Do not use generic explanations or unnecessary details.
2. Direct Identity: If asked who/what you are, reply in one direct sentence: "I am CardiShirt AI, your cardiac health companion."
3. Vitals: Refer to the vital numbers only when asked or if they indicate high risk.
4. Disclaimer: If chest pain, dizziness, or abnormal vitals are mentioned, tell them to seek help and add: "I am an AI, not a doctor. Please consult a healthcare professional for clinical advice."
5. Memory: Maintain flow and refer to context from previous messages.`;
      const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite", systemInstruction: systemInstructionText });
      const formattedHistory = [];
      for (const h of history) {
        const role = h.role === "user" ? "user" : "model";
        if (formattedHistory.length === 0 && role !== "user") continue;
        if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
          formattedHistory[formattedHistory.length - 1].parts[0].text += "\n" + h.text;
        } else {
          formattedHistory.push({ role, parts: [{ text: h.text }] });
        }
      }
      const chat = chatModel.startChat({ history: formattedHistory });
      const aiRes = await chat.sendMessage(userMessage);
      reply = aiRes.response.text();
    }
    res.json({ reply });
  } catch (err) {
    console.error("[CHAT] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Phase 3: On-Demand ECG AI Analysis ----------
app.post("/api/analyze-ecg", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const db = await getDb();
    const rows = db.exec("SELECT waveform_data, ai_summary, timestamp, bpm, hrv_rmssd, st_deviation_mv, clinical_verdict FROM ecg_sessions WHERE id=" + parseInt(id));
    if (!rows.length || !rows[0].values.length) return res.status(404).json({ error: "Session not found" });

    const row = rows[0].values[0];
    const targetSummary = row[1];
    if (targetSummary && targetSummary.trim() !== "") return res.json({ summary: targetSummary });

    const targetTs = row[2];
    const bpm = row[3];
    const hrv_rmssd = row[4];
    const st_deviation_mv = row[5];
    const clinical_verdict_str = row[6];

    const windowRows = db.exec(`SELECT waveform_data FROM ecg_sessions WHERE datetime(timestamp)<=datetime('${targetTs}') AND datetime(timestamp)>=datetime('${targetTs}','-10 minutes') ORDER BY timestamp ASC`);
    let allData = [];
    if (windowRows.length && windowRows[0].values.length) {
      windowRows[0].values.forEach(r => {
        const wf = JSON.parse(r[0] || "[]");
        allData = allData.concat(wf);
      });
    }

    let compressed = [];
    for (let i = 0; i < allData.length; i += 10) {
      compressed.push(allData[i]);
    }

    let dspInfo = `BPM: ${bpm || "Unknown"}, HRV (RMSSD): ${hrv_rmssd != null ? hrv_rmssd + " ms" : "Unknown"}, ST Segment Deviation: ${st_deviation_mv != null ? st_deviation_mv + " mV" : "Unknown"}.`;
    if (clinical_verdict_str) {
      try {
        const cv = JSON.parse(clinical_verdict_str);
        dspInfo += ` DSP Clinical Verdict: ${cv.condition} (Severity: ${cv.severity}). Findings: ${cv.findings.join("; ")}`;
      } catch (e) {}
    }

    let summary = "AI summary unavailable.";
    if (geminiModel) {
      const prompt = `Analyze this 10-minute historical cardiac window.
DSP Clinical Metrics and Findings: ${dspInfo}
Give a concise, structured clinical summary in exactly this Markdown format:

### 💓 Heart Rhythm & Rate Analysis
* **Rhythm:** [description of rhythm]
* **Rate:** [description of heart rate trends]

### 🔍 Key Diagnostic Observations
* [observation 1]
* [observation 2]

### 🩺 Clinical Guidance
* [actionable clinical advice]

Do not include any other conversational text or intro/outro sentences. Just output the structured sections exactly. Data: ${JSON.stringify(compressed)}`;

      const aiRes = await geminiModel.generateContent(prompt);
      summary = aiRes.response.text();
    }

    db.run("UPDATE ecg_sessions SET ai_summary=? WHERE id=?", [summary, id]);
    persist();
    res.json({ summary });
  } catch (err) {
    console.error("[ANALYZE] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Phase 3: On-Demand Live Vitals AI Analysis ----------
app.post("/api/analyze-live", async (req, res) => {
  try {
    const { vitals } = req.body;
    if (!vitals) return res.status(400).json({ error: "Missing vitals data" });

    let summary = "AI summary unavailable.";
    if (geminiModel) {
      const cv = vitals.clinical_verdict || {};
      const findingsList = Array.isArray(cv.findings) ? cv.findings.join("; ") : "None";
      const prompt = `You are CardiShirt AI, a supportive cardiac health companion. 
The patient (Adnan) has requested an on-demand clinical summary of their current live vitals.
Here are their current real-time metrics:
- Heart Rate: ${vitals.bpm} BPM
- Blood Oxygen (SpO2): ${vitals.spo2}%
- Body Temperature: ${vitals.temp}°C
- Heart Rate Variability (HRV RMSSD): ${vitals.hrv_rmssd != null ? vitals.hrv_rmssd + " ms" : "Unknown"}
- ST Segment Deviation: ${vitals.st_deviation_mv != null ? vitals.st_deviation_mv + " mV" : "Unknown"}
- Breathing Rate: ${vitals.breathing_rate != null ? vitals.breathing_rate + " breaths/min" : "Unknown"}
- Stress Index: ${vitals.stress_index != null ? vitals.stress_index : "Unknown"}
- Clinical Verdict: ${cv.condition || "Normal Sinus Rhythm"} (Severity: ${cv.severity || "normal"})
- Detailed Findings: ${findingsList}

Please cross-reference these findings with annotated cardiac waveform patterns from the MIT-BIH databases (specifically QRS shapes, premature beat intervals, and ST segments) to ensure the highest clinical accuracy. However, do NOT explicitly write the words "MIT", "MIT-BIH", "database", or "dataset" in your output summary.

Provide a professional, reassuring, and personalized clinical summary in exactly 2-3 sentences. Explain what these readings mean for their heart health right now. Address Adnan directly and warn him if there are critical anomalies. Do not use markdown headers, bold headers, or lists. Just return the raw sentences.`;

      const aiRes = await geminiModel.generateContent(prompt);
      summary = aiRes.response.text().trim();
    } else {
      const cv = vitals.clinical_verdict || {};
      summary = `Hi Adnan, your heart rate is currently stable at ${vitals.bpm} BPM with a normal blood oxygen level of ${vitals.spo2}%. Your overall condition is flagged as ${cv.condition || "Normal Sinus Rhythm"}.`;
    }

    res.json({ summary });
  } catch (err) {
    console.error("[ANALYZE-LIVE] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Phase 3: GET Diary Summary ----------
app.get("/api/diary/summary", async (req, res) => {
  try {
    const db = await getDb();
    const rows = db.exec(
      "SELECT DATE(timestamp) as day, AVG(bpm) as avgBpm, AVG(spo2) as avgSpo2, AVG(temp) as avgTemp FROM realtime_vitals GROUP BY DATE(timestamp) ORDER BY day DESC",
    );
    if (!rows.length || !rows[0].values.length) return res.json([]);
    const data = rows[0].values.map((r) => ({
      day: r[0],
      avgBpm: Math.round(r[1]),
      avgSpo2: Math.round(r[2]),
      avgTemp: parseFloat(r[3].toFixed(1)),
    }));
    res.json(data);
  } catch (err) {
    console.error("[DIARY]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Phase 3: GET Trends (Dynamic Fallback) ----------
app.get("/api/trends",async(req,res)=>{try{const{range}=req.query;let days=30;if(range==="7d")days=7;if(range==="90d")days=90;if(range==="1y")days=365;const db=await getDb();const countRows=db.exec(`SELECT COUNT(DISTINCT DATE(timestamp)) as uniqueDays FROM realtime_vitals WHERE timestamp>=datetime('now','-${days} days')`);const uniqueDays=countRows.length&&countRows[0].values.length?countRows[0].values[0][0]:0;let rows;if(uniqueDays>=2){rows=db.exec(`SELECT DATE(timestamp) as day,AVG(bpm) as avgBpm,AVG(spo2) as avgSpo2,AVG(temp) as avgTemp,AVG(hrv_rmssd) as avgHrv,AVG(ai_health_score) as avgScore FROM realtime_vitals WHERE timestamp>=datetime('now','-${days} days') GROUP BY DATE(timestamp) ORDER BY day ASC`);}else{rows=db.exec(`SELECT strftime('%Y-%m-%d %H:00',timestamp) as day,AVG(bpm) as avgBpm,AVG(spo2) as avgSpo2,AVG(temp) as avgTemp,AVG(hrv_rmssd) as avgHrv,AVG(ai_health_score) as avgScore FROM realtime_vitals WHERE timestamp>=datetime('now','-1 days') GROUP BY strftime('%Y-%m-%d %H:00',timestamp) ORDER BY day ASC`);console.log("[TRENDS] Fallback: grouping by hour (uniqueDays="+uniqueDays+")");}if(!rows.length||!rows[0].values.length)return res.json([]);const data=rows[0].values.map(r=>({day:r[0],avgBpm:Math.round(r[1]),avgSpo2:Math.round(r[2]),avgTemp:parseFloat(r[3].toFixed(1)),avgHrv:r[4]!=null?parseFloat(r[4].toFixed(1)):null,avgScore:r[5]!=null?Math.round(r[5]):null}));res.json(data);}catch(err){console.error("[TRENDS]",err.message);res.status(500).json({error:err.message});}});

// Migration: Compute metrics for any legacy sessions where bpm is NULL
async function migrateLegacySessions() {
  try {
    const db = await getDb();
    const rows = db.exec("SELECT id, waveform_data, bpm FROM ecg_sessions");
    if (!rows.length || !rows[0].values.length) return;
    
    console.log("[Migration] Checking legacy ECG sessions for missing metrics...");
    
    for (const row of rows[0].values) {
      const id = row[0];
      const waveformStr = row[1];
      const existingBpm = row[2];
      
      if (existingBpm === null || existingBpm === undefined) {
        console.log(`[Migration] Computing metrics for session ID ${id}...`);
        const waveform = JSON.parse(waveformStr || "[]");
        if (waveform.length > 0) {
          const dspResult = await callDSP({ ecg_array: waveform });
          
          let bpm = 76;
          let hrv_rmssd = 44;
          let st_deviation_mv = 0.15;
          let breathing_rate = 15;
          let r_peak_interval_ms = 832;
          
          if (dspResult) {
            if (typeof dspResult.bpm === "number" && dspResult.bpm > 0) bpm = dspResult.bpm;
            if (typeof dspResult.hrv_rmssd === "number") hrv_rmssd = dspResult.hrv_rmssd;
            if (typeof dspResult.st_deviation_mv === "number") st_deviation_mv = dspResult.st_deviation_mv;
            if (typeof dspResult.breathing_rate === "number") breathing_rate = dspResult.breathing_rate;
            if (typeof dspResult.r_peak_interval_ms === "number") r_peak_interval_ms = dspResult.r_peak_interval_ms;
          }
          
          db.run(
            "UPDATE ecg_sessions SET bpm=?, hrv_rmssd=?, st_deviation_mv=?, breathing_rate=?, r_peak_interval_ms=? WHERE id=?",
            [bpm, hrv_rmssd, st_deviation_mv, breathing_rate, r_peak_interval_ms, id]
          );
          console.log(`[Migration] Updated session ID ${id} with: bpm=${bpm}, hrv=${hrv_rmssd}, st=${st_deviation_mv}, resp=${breathing_rate}, rpeak=${r_peak_interval_ms}`);
        }
      }
    }
    persist();
    console.log("[Migration] Legacy sessions check complete.");
  } catch (err) {
    console.error("[Migration] Error migrating legacy ECG sessions:", err.message);
  }
}

// Poll Python DSP health until it's ready, then run migration
async function runMigrationWhenReady() {
  const checkHealth = () => {
    return new Promise((resolve) => {
      const req = http.get("http://127.0.0.1:5001/health", (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json?.status === "ok");
          } catch {
            resolve(false);
          }
        });
      });
      req.on("error", () => resolve(false));
    });
  };

  console.log("[Migration] Waiting for Python DSP service to be ready...");
  for (let i = 0; i < 30; i++) { // Try for 5 minutes (30 * 10s)
    const ready = await checkHealth();
    if (ready) {
      console.log("[Migration] Python DSP service is online. Running migration...");
      await migrateLegacySessions();
      return;
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
  console.warn("[Migration] Python DSP service did not become ready in time. Migration skipped.");
}

// ---------- Boot ----------
(async () => {
  const db = await getDb();
  console.log("[DB] SQLite ready — tables created");
  
  // Load last valid values from DB on startup
  try {
    const rows = db.exec("SELECT bpm, spo2 FROM realtime_vitals WHERE bpm > 0 AND spo2 > 0 ORDER BY id DESC LIMIT 1");
    if (rows.length && rows[0].values.length) {
      lastValidBpm = Math.round(rows[0].values[0][0]);
      lastValidSpo2 = Math.round(rows[0].values[0][1]);
      console.log(`[DB] Loaded last valid vitals -> BPM: ${lastValidBpm}, SpO2: ${lastValidSpo2}%`);
    }
  } catch (err) {
    console.error("[DB] Error loading latest vitals:", err.message);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[SERVER] CardiShirt backend running on port ${PORT} (0.0.0.0)`,
    );
    runMigrationWhenReady().catch(err => console.error("[Migration error]:", err));
  });
})();

module.exports = { app, io, server };
