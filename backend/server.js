require("dotenv").config();
const express=require("express");
const cors=require("cors");
const http=require("http");
const {Server}=require("socket.io");
const {getDb,persist}=require("./db");
const {GoogleGenerativeAI}=require("@google/generative-ai");

const PORT=process.env.PORT||4000;
const app=express();
app.use(cors());
app.use(express.json({limit:"5mb"}));

const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*",methods:["GET","POST"]}});

// ---------- Gemini AI setup ----------
let geminiModel=null;
if(process.env.GEMINI_API_KEY&&process.env.GEMINI_API_KEY!=="your_gemini_api_key_here"){
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
if(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_ACCOUNT_SID!=="your_twilio_sid_here"){
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
const{bpm=0,temp=0,fall_detected=false,ecg_array=null}=req.body;
const db=await getDb();
const ts=new Date().toISOString();

// Insert vitals
db.run("INSERT INTO realtime_vitals(bpm,temp,fall_detected,timestamp)VALUES(?,?,?,?)",[bpm,temp,fall_detected?1:0,ts]);
persist();

// Emit to frontend via WebSocket
const vitals={bpm,temp,fall_detected,timestamp:ts};
io.emit("vitals",vitals);
console.log(`[DATA] bpm=${bpm} temp=${temp} fall=${fall_detected}`);

// --- Phase 3: SOS Logic ---
const isDangerous=fall_detected||(bpm>150)||(bpm>0&&bpm<35);
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

// --- Phase 3: ECG AI Analysis ---
let aiSummary=null;
if(ecg_array&&Array.isArray(ecg_array)&&ecg_array.length>0){
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

// ---------- Boot ----------
(async()=>{
const db=await getDb();
console.log("[DB] SQLite ready — tables created");
server.listen(PORT,()=>console.log(`[SERVER] CardiShirt backend running on http://localhost:${PORT}`));
})();

module.exports={app,io,server};
