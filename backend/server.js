require("dotenv").config();
const express=require("express");
const cors=require("cors");
const http=require("http");
const {Server}=require("socket.io");
const {getDb,persist}=require("./db");
const {GoogleGenerativeAI}=require("@google/generative-ai");
const cron=require("node-cron");
const {calculateBPM,calculateSpO2}=require("./signalProcessing");

let lastInsertTime=0;

const PORT=process.env.PORT||4000;
const app=express();
app.use(cors());
app.use(express.json({limit:"5mb"}));

const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*",methods:["GET","POST"]}});

// ---------- Gemini AI setup ----------
let geminiModel=null;
if(process.env.GEMINI_API_KEY){
const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
geminiModel=genAI.getGenerativeModel({model:"gemini-1.5-flash"});
console.log("[AI] Gemini 1.5 Flash model ready");
}else{
console.log("[AI] No Gemini API key — AI summaries will use fallback text");
}

// ---------- Twilio setup ----------
let twilioClient=null;
const TWILIO_FROM=process.env.TWILIO_PHONE_FROM;
const EMERGENCY_TO=process.env.EMERGENCY_PHONE_TO;
if(process.env.TWILIO_ACCOUNT_SID){
twilioClient=require("twilio")(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN);
console.log("[SOS] Twilio client ready");
}else{
console.log("[SOS] No Twilio credentials — SOS SMS disabled");
}

// ---------- Health check ----------
app.get("/api/health",(_req,res)=>{
res.json({status:"ok",time:new Date().toISOString()});
});

// ---------- ESP32 Data Ingestion (Phase 2 + 3) ----------
app.post("/api/esp32/data",async(req,res)=>{
try{
const{temp=0,fall_detected=false,ecg_array=null,ir_array=[],red_array=[]}=req.body;
const bpm=calculateBPM(ir_array);
const spo2=calculateSpO2(ir_array,red_array);
const db=await getDb();
const ts=new Date().toISOString();
const now=Date.now();

// Throttled Insert vitals (every 60s)
if(now-lastInsertTime>=60000){
db.run("INSERT INTO realtime_vitals(bpm,temp,fall_detected,timestamp)VALUES(?,?,?,?)",[bpm,temp,fall_detected?1:0,ts]);
persist();
lastInsertTime=now;
}

// Emit to frontend via WebSocket
const vitals={bpm,spo2,temp,fall_detected,ecg_array,timestamp:ts};
io.emit("vitals",vitals);
console.log(`[DATA] bpm=${bpm} spo2=${spo2} temp=${temp} fall=${fall_detected}`);

// --- Phase 3: SOS Logic ---
const isDangerous=fall_detected||(bpm>120)||(bpm>0&&bpm<50);
if(isDangerous&&twilioClient){
const reason=fall_detected?"FALL DETECTED":`DANGEROUS BPM: ${bpm}`;
try{
await twilioClient.messages.create({
body:`🚨 CARDISHIRT SOS 🚨\n${reason}\nBPM: ${bpm} | Temp: ${temp}°C\nTime: ${ts}`,
from:TWILIO_FROM,
to:EMERGENCY_TO
});
console.log(`[SOS] SMS sent — ${reason}`);
}catch(smsErr){
console.error("[SOS] SMS failed:",smsErr.message);
}
io.emit("sos",{reason,bpm,temp,timestamp:ts});
}

// --- Phase 3: ECG AI Analysis (Anomaly Trigger) ---
let aiSummary=null;
if(isDangerous&&ecg_array&&Array.isArray(ecg_array)&&ecg_array.length>0){
if(geminiModel){
try{
const snippet=ecg_array.slice(0,200);
const prompt=`You are a cardiologist AI assistant for a wearable ECG shirt called CardiShirt.
Analyze this ECG voltage array (mV, sampled at ~250Hz) and provide a brief 2-3 sentence clinical summary.
Mention rhythm type, any anomalies, and a recommendation.
ECG data snippet (first ${snippet.length} samples): [${snippet.join(",")}]`;
const result=await geminiModel.generateContent(prompt);
aiSummary=result.response.text();
}catch(aiErr){
console.error("[AI] Gemini error:",aiErr.message);
aiSummary="AI analysis unavailable — Gemini returned an error.";
}
}else{
aiSummary="AI analysis unavailable — no API key configured.";
}
db.run("INSERT INTO ecg_sessions(waveform_data,ai_summary,timestamp)VALUES(?,?,?)",[JSON.stringify(ecg_array),aiSummary,ts]);
persist();
io.emit("ecg_session",{id:Date.now(),ai_summary:aiSummary,timestamp:ts});
}

res.json({ok:true,sos_triggered:isDangerous,ai_summary:aiSummary});
}catch(err){
console.error("[ESP32] Error:",err.message);
res.status(500).json({ok:false,error:err.message});
}
});

// ---------- Phase 3: GET ECG Records ----------
app.get("/api/ecg-records",async(_req,res)=>{
try{
const db=await getDb();
const rows=db.exec("SELECT id,waveform_data,ai_summary,timestamp FROM ecg_sessions ORDER BY id DESC");
if(!rows.length||!rows[0].values.length)return res.json([]);
const records=rows[0].values.map(r=>({
id:r[0],
waveform_data:JSON.parse(r[1]||"[]"),
ai_summary:r[2]||"",
timestamp:r[3]
}));
res.json(records);
}catch(err){
console.error("[ECG] Fetch error:",err.message);
res.status(500).json({error:err.message});
}
});

// ---------- Socket.io ----------
io.on("connection",(socket)=>{
console.log(`[WS] Client connected: ${socket.id}`);
socket.on("disconnect",()=>console.log(`[WS] Client disconnected: ${socket.id}`));
});

// ---------- Phase 3: Scheduled Trigger (Twice Daily Summaries) ----------
cron.schedule("0 8,20 * * *",async()=>{
try{
const db=await getDb();
const rows=db.exec("SELECT bpm,temp,fall_detected FROM realtime_vitals WHERE timestamp >= datetime('now','-12 hours')");
if(!rows.length||!rows[0].values.length)return;
const data=rows[0].values;
const avgBpm=Math.round(data.reduce((a,b)=>a+b[0],0)/data.length);
const falls=data.filter(r=>r[2]===1).length;
let summary="No data for summary.";
if(geminiModel){
const prompt=`You are a CardiShirt AI. Summarize the last 12 hours of vitals. Avg BPM: ${avgBpm}, Falls detected: ${falls}, Data points: ${data.length}. Keep it to 2 brief sentences.`;
const res=await geminiModel.generateContent(prompt);
summary=res.response.text();
}else{
summary=`12-hour summary: Avg BPM is ${avgBpm} with ${falls} falls.`;
}
db.run("INSERT INTO daily_summaries(summary)VALUES(?)",[summary]);
persist();
console.log("[CRON] Generated 12-hour summary");
}catch(err){
console.error("[CRON] Error:",err.message);
}
});

// ---------- Phase 3: On-Demand Trigger (Chatbot) ----------
app.post("/api/chat",async(req,res)=>{
try{
const{userMessage}=req.body;
const db=await getDb();
const rows=db.exec("SELECT bpm,temp,fall_detected FROM realtime_vitals ORDER BY id DESC LIMIT 5");
const recentVitals=rows.length&&rows[0].values.length?rows[0].values:"No recent vitals.";
let reply="Chatbot unavailable.";
if(geminiModel){
const prompt=`You are CardiShirt AI. The user says: "${userMessage}". Recent vitals (bpm, temp, fall_detected): ${JSON.stringify(recentVitals)}. Answer concisely.`;
const aiRes=await geminiModel.generateContent(prompt);
reply=aiRes.response.text();
}
res.json({reply});
}catch(err){
console.error("[CHAT] Error:",err.message);
res.status(500).json({error:err.message});
}
});

// ---------- Boot ----------
(async()=>{
const db=await getDb();
console.log("[DB] SQLite ready — tables created");
server.listen(PORT,()=>console.log(`[SERVER] CardiShirt backend running on http://localhost:${PORT}`));
})();

module.exports={app,io,server};
