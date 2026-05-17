const initSqlJs=require("sql.js");
const fs=require("fs");
const path=require("path");

const DB_PATH=path.join(__dirname,"cardishirt.db");
let _db=null;

async function getDb(){
if(_db)return _db;
const SQL=await initSqlJs();
if(fs.existsSync(DB_PATH)){
const buf=fs.readFileSync(DB_PATH);
_db=new SQL.Database(buf);
}else{
_db=new SQL.Database();
}
_db.run(`CREATE TABLE IF NOT EXISTS realtime_vitals(
id INTEGER PRIMARY KEY AUTOINCREMENT,
bpm REAL,
temp REAL,
fall_detected INTEGER DEFAULT 0,
timestamp TEXT DEFAULT(datetime('now'))
)`);
_db.run(`CREATE TABLE IF NOT EXISTS ecg_sessions(
id INTEGER PRIMARY KEY AUTOINCREMENT,
waveform_data TEXT,
ai_summary TEXT,
timestamp TEXT DEFAULT(datetime('now'))
)`);
_db.run(`CREATE TABLE IF NOT EXISTS daily_summaries(
id INTEGER PRIMARY KEY AUTOINCREMENT,
summary TEXT,
timestamp TEXT DEFAULT(datetime('now'))
)`);
persist();
return _db;
}

function persist(){
if(!_db)return;
const data=_db.export();
const buf=Buffer.from(data);
fs.writeFileSync(DB_PATH,buf);
}

module.exports={getDb,persist};
