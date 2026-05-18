require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { getDb, persist } = require("./db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cron = require("node-cron");
const { calculateBPM, calculateSpO2 } = require("./signalProcessing");

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
if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  console.log("[AI] Gemini 2.5 Flash Lite model ready");
} else {
  console.log("[AI] No Gemini API key — AI summaries will use fallback text");
}

// ---------- Twilio setup ----------
let twilioClient = null;
const TWILIO_FROM = process.env.TWILIO_PHONE_FROM;
const EMERGENCY_TO = process.env.EMERGENCY_PHONE_TO;
if (process.env.TWILIO_ACCOUNT_SID) {
  twilioClient = require("twilio")(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );
  console.log("[SOS] Twilio client ready");
} else {
  console.log("[SOS] No Twilio credentials — SOS SMS disabled");
}

// ---------- Health check ----------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---------- Geolocation Endpoints (Phase 1) ----------
app.post("/api/location/update",async(req,res)=>{try{const{lat,lng}=req.body;if(typeof lat==="number"&&typeof lng==="number"){currentPosition={lat,lng};io.emit("location_change",currentPosition);return res.json({ok:true,currentPosition});}res.status(400).json({error:"Invalid coordinates"});}catch(err){res.status(500).json({error:err.message});}});
app.get("/api/location/current",async(_req,res)=>{res.json(currentPosition);});

// ---------- ESP32 Data Ingestion (Phase 2 + 3) ----------
let accumulatedVitals = { bpm: [], temp: [], spo2: [], fall_detected: false };
let lastTwilioTime = 0;
app.post("/api/esp32/data", async (req, res) => {
  try {
    const {
      temp = 0,
      fall_detected = false,
      ecg_array = null,
      ir_array = [],
      red_array = [],
    } = req.body;
    const bpm = calculateBPM(ir_array);
    const spo2 = calculateSpO2(ir_array, red_array);
    accumulatedVitals.bpm.push(bpm);
    accumulatedVitals.temp.push(temp);
    accumulatedVitals.spo2.push(spo2);
    if (fall_detected) accumulatedVitals.fall_detected = true;
    if (Array.isArray(ecg_array))
      accumulatedEcg = accumulatedEcg.concat(ecg_array);
    const db = await getDb();
    const ts = new Date().toISOString();
    const now = Date.now();
    if (now - lastInsertTime >= 120000) {
      const avgBpm =
        accumulatedVitals.bpm.reduce((a, b) => a + b, 0) /
          accumulatedVitals.bpm.length || 0;
      const avgTemp =
        accumulatedVitals.temp.reduce((a, b) => a + b, 0) /
          accumulatedVitals.temp.length || 0;
      const avgSpo2 =
        accumulatedVitals.spo2.reduce((a, b) => a + b, 0) /
          accumulatedVitals.spo2.length || 0;
      const fall = accumulatedVitals.fall_detected ? 1 : 0;
      db.run(
        "INSERT INTO realtime_vitals(bpm,temp,spo2,fall_detected,timestamp)VALUES(?,?,?,?,?)",
        [
          Math.round(avgBpm),
          parseFloat(avgTemp.toFixed(1)),
          Math.round(avgSpo2),
          fall,
          ts,
        ],
      );
      persist();
      accumulatedVitals = { bpm: [], temp: [], spo2: [], fall_detected: false };
      lastInsertTime = now;
    }
    if (now - lastEcgSaveTime >= 600000 && accumulatedEcg.length > 0) {
      db.run("INSERT INTO ecg_sessions(waveform_data,ai_summary)VALUES(?,?)", [
        JSON.stringify(accumulatedEcg),
        "",
      ]);
      persist();
      io.emit("ecg_session");
      accumulatedEcg = [];
      lastEcgSaveTime = now;
    }
    const vitals = { bpm, spo2, temp, fall_detected, ecg_array, timestamp: ts };
    io.emit("vitals", vitals);
    if (fall_detected && twilioClient && now - lastTwilioTime >= 600000) {
      try {
        await twilioClient.messages.create({
          body: `🚨 CARDISHIRT SOS 🚨\nFALL DETECTED\nBPM: ${bpm} | Temp: ${temp}°C\nTrack live location: https://maps.google.com/?q=${currentPosition.lat},${currentPosition.lng}`,
          from: process.env.TWILIO_PHONE_FROM,
          to: process.env.EMERGENCY_PHONE_TO,
        });
        console.log("[SOS] SMS sent");
        lastTwilioTime = now;
      } catch (err) {
        console.error("[SOS] Twilio error:", err);
      }
      io.emit("sos", { reason: "FALL DETECTED", bpm, temp, timestamp: ts });
    }
    console.log(
      `[DATA] bpm=${bpm} spo2=${spo2} temp=${temp} fall=${fall_detected}`,
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[ESP32] Error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
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
    const records = rows[0].values.map((r) => ({
      id: r[0],
      waveform_data: JSON.parse(r[1] || "[]"),
      ai_summary: r[2] || "",
      timestamp: r[3],
    }));
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
    const summaries = rows[0].values.map((r) => ({
      id: r[0],
      summary: r[1],
      created_at: r[2],
    }));
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
    const { userMessage } = req.body;
    const db = await getDb();
    const rows = db.exec(
      "SELECT bpm,temp,fall_detected FROM realtime_vitals ORDER BY id DESC LIMIT 5",
    );
    const recentVitals =
      rows.length && rows[0].values.length ? rows[0].values : "No vitals.";
    let reply = "Chatbot unavailable.";
    if (geminiModel) {
      const prompt = `Imagine you are a doctor in this simulation for practice where You are CardiShirt AI assistant for a user who have a ecg, bpm and temperature hardware module on their body. You are CardiShirt AI. User: "${userMessage}". Recent vitals: ${JSON.stringify(recentVitals)}. Answer concisely as a guide, remind user you are AI but use internet to search the best advice for the user.`;
      const aiRes = await geminiModel.generateContent(prompt);
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
app.get("/api/trends",async(req,res)=>{try{const{range}=req.query;let days=30;if(range==="7d")days=7;if(range==="90d")days=90;if(range==="1y")days=365;const db=await getDb();const countRows=db.exec(`SELECT COUNT(DISTINCT DATE(timestamp)) as uniqueDays FROM realtime_vitals WHERE timestamp>=datetime('now','-${days} days')`);const uniqueDays=countRows.length&&countRows[0].values.length?countRows[0].values[0][0]:0;let rows;if(uniqueDays>=2){rows=db.exec(`SELECT DATE(timestamp) as day,AVG(bpm) as avgBpm,AVG(spo2) as avgSpo2,AVG(temp) as avgTemp FROM realtime_vitals WHERE timestamp>=datetime('now','-${days} days') GROUP BY DATE(timestamp) ORDER BY day ASC`);}else{rows=db.exec(`SELECT strftime('%Y-%m-%d %H:00',timestamp) as day,AVG(bpm) as avgBpm,AVG(spo2) as avgSpo2,AVG(temp) as avgTemp FROM realtime_vitals WHERE timestamp>=datetime('now','-1 days') GROUP BY strftime('%Y-%m-%d %H:00',timestamp) ORDER BY day ASC`);console.log("[TRENDS] Fallback: grouping by hour (uniqueDays="+uniqueDays+")");}if(!rows.length||!rows[0].values.length)return res.json([]);const data=rows[0].values.map(r=>({day:r[0],avgBpm:Math.round(r[1]),avgSpo2:Math.round(r[2]),avgTemp:parseFloat(r[3].toFixed(1))}));res.json(data);}catch(err){console.error("[TRENDS]",err.message);res.status(500).json({error:err.message});}});

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
