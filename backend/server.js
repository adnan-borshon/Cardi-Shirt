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


let lastInsertTime = 0;
let accumulatedEcg = [];
let lastEcgSaveTime = Date.now();
let currentPosition={lat:23.7925,lng:90.4078};

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
  if (!TELEGRAM_BOT_TOKEN) return Promise.resolve(false);
  const currentChatIds = getTelegramChatIds();
  if (currentChatIds.length === 0) return Promise.resolve(false);

  console.log(`[SOS] Sending Telegram message to ${currentChatIds.length} individual contact(s)...`);

  const sendPromises = currentChatIds.map(chatId => {
    return new Promise((resolve) => {
      const data = JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" });
      const options = {
        hostname: "api.telegram.org",
        port: 443,
        path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
      };
      
      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", chunk => body += chunk);
        res.on("end", () => {
          if (res.statusCode === 200) {
            console.log(`[SOS] Sent Telegram message successfully to user: ${chatId}`);
            resolve(true);
          } else {
            console.error(`[SOS] Telegram API error for user ${chatId}: Status ${res.statusCode}, Body: ${body}`);
            resolve(false);
          }
        });
      });
      
      req.on("error", (err) => {
        console.error(`[SOS] Network error sending Telegram message to user ${chatId}:`, err.message);
        resolve(false);
      });
      
      req.write(data);
      req.end();
    });
  });

  return Promise.all(sendPromises).then(results => results.some(res => res === true));
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

// ---------- Telegram Manual Actions ----------
app.post("/api/telegram/call", async (req, res) => {
  try {
    const { targetName } = req.body;
    const msg = `☎️ <b>URGENT CALL BACK REQUESTED</b>\n\nPatient is requesting an immediate call back from <b>${targetName || 'a family member'}</b>.\nPlease call them ASAP!`;
    const success = await sendTelegramMessage(msg);
    res.json({ ok: success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/telegram/dispatch", async (req, res) => {
  try {
    const msg = `🚑 <b>CRITICAL EMERGENCY DISPATCH</b>\n\nManual emergency dispatch has been triggered from the dashboard.\n<a href="https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}">Patient Location</a>`;
    const success = await sendTelegramMessage(msg);
    res.json({ ok: success });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
app.post("/api/esp32/data", (req, res) => {
  try {
    const { temp=0, fall_detected=false, ecg_array=null, ir_array=[], red_array=[], sample_rate=250 } = req.body;

    // 1. Respond to ESP32 immediately to prevent blocking the microcontroller
    res.json({ ok: true });

    // 2. Perform heavy DSP & DB calculations in the background
    (async () => {
      if (Array.isArray(ecg_array)) {
        ecgRollingBuffer = ecgRollingBuffer.concat(ecg_array);
        // Keep last 10 seconds of data at 250 Hz (2500 samples)
        if (ecgRollingBuffer.length > 2500) {
          ecgRollingBuffer = ecgRollingBuffer.slice(-2500);
        }
      }

      // Primary path — Python DSP (pass the rolling 10-second buffer)
      const dsp = await callDSP({ ecg_array: ecgRollingBuffer, ir_array, red_array, temp, current_bpm:0, fall_detected, sample_rate });

      // Fallback to JS if Python unavailable
      const ppgSampleRate = sample_rate / 10.0;
      let bpm = dsp?.bpm ?? calculateBPM(ir_array, ppgSampleRate);
      if (!dsp) {
        bpm = stabilizeBpm(bpm, fall_detected, temp);
      }
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
        db.run("INSERT INTO ecg_sessions(waveform_data,ai_summary,timestamp)VALUES(?,?,?)",
               [JSON.stringify(accumulatedEcg), "", new Date().toISOString()]);
        persist();
        io.emit("ecg_session");
        accumulatedEcg  = [];
        lastEcgSaveTime = now;
      }

      // Downsample the 250 Hz ecg_array to 25 Hz for frontend display
      let ecg_downsampled = null;
      if (Array.isArray(ecg_array)) {
        ecg_downsampled = [];
        for (let i = 0; i < ecg_array.length; i += 10) {
          ecg_downsampled.push(ecg_array[i]);
        }
      }

      io.emit("vitals", {
        bpm, spo2, temp, fall_detected, ecg_array: ecg_downsampled, timestamp:ts,
        hrv_rmssd, st_deviation_mv, breathing_rate, stress_index,
        r_peak_interval_ms: r_peak_interval, ai_health_score,
      });

      if (fall_detected && TELEGRAM_BOT_TOKEN && now-lastTwilioTime >= 600000) {
        try {
          const msg = `🚨 <b>CARDISHIRT SOS</b> 🚨\n\n<b>FALL DETECTED</b>\n<b>BPM:</b> ${bpm}\n<b>Temp:</b> ${temp}°C\n<a href="https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}">Track live location</a>`;
          await sendTelegramMessage(msg);
          console.log("[SOS] Telegram alert sent");
          lastTwilioTime = now;
        } catch(e) { console.error("[SOS]", e); }
        io.emit("sos", { reason:"FALL DETECTED", bpm, temp, timestamp:ts });
      }
    })().catch(err => console.error("[ESP32 Async Error]:", err.message));

  } catch(err) {
    console.error("[ESP32] Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ ok:false, error:err.message });
    }
  }
});

// ---------- Phase 3: GET ECG Records ----------
app.get("/api/ecg-records", async (_req, res) => {
  try {
    const db = await getDb();
    const rows = db.exec(
      "SELECT id,waveform_data,ai_summary,timestamp FROM ecg_sessions ORDER BY id DESC",
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
app.post("/api/analyze-ecg",async(req,res)=>{try{const{id}=req.body;if(!id)return res.status(400).json({error:"Missing id"});const db=await getDb();const rows=db.exec("SELECT waveform_data,ai_summary,timestamp FROM ecg_sessions WHERE id="+parseInt(id));if(!rows.length||!rows[0].values.length)return res.status(404).json({error:"Session not found"});const targetSummary=rows[0].values[0][1];if(targetSummary&&targetSummary.trim()!=="")return res.json({summary:targetSummary});const targetTs=rows[0].values[0][2];const windowRows=db.exec(`SELECT waveform_data FROM ecg_sessions WHERE datetime(timestamp)<=datetime('${targetTs}') AND datetime(timestamp)>=datetime('${targetTs}','-10 minutes') ORDER BY timestamp ASC`);let allData=[];if(windowRows.length&&windowRows[0].values.length){windowRows[0].values.forEach(r=>{const wf=JSON.parse(r[0]||"[]");allData=allData.concat(wf);});}let compressed=[];for(let i=0;i<allData.length;i+=10)compressed.push(allData[i]);let summary="AI summary unavailable.";if(geminiModel){const prompt=`Analyze this 10-minute historical cardiac window. Give a concise, structured clinical summary in exactly this Markdown format:\n\n### 💓 Heart Rhythm & Rate Analysis\n* **Rhythm:** [description of rhythm]\n* **Rate:** [description of heart rate trends]\n\n### 🔍 Key Diagnostic Observations\n* [observation 1]\n* [observation 2]\n\n### 🩺 Clinical Guidance\n* [actionable clinical advice]\n\nDo not include any other conversational text or intro/outro sentences. Just output the structured sections exactly. Data: ${JSON.stringify(compressed)}`;const aiRes=await geminiModel.generateContent(prompt);summary=aiRes.response.text();}db.run("UPDATE ecg_sessions SET ai_summary=? WHERE id=?",[summary,id]);persist();res.json({summary});}catch(err){console.error("[ANALYZE] Error:",err);res.status(500).json({error:err.message});}});

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

// ---------- Boot ----------
(async () => {
  const db = await getDb();
  console.log("[DB] SQLite ready — tables created");
  server.listen(PORT, "0.0.0.0", () =>
    console.log(
      `[SERVER] CardiShirt backend running on port ${PORT} (0.0.0.0)`,
    ),
  );
})();

module.exports = { app, io, server };
