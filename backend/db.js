const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "cardishirt.db");
let _db = null;

async function getDb() {
  if (_db) return _db;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }

  // Base table
  _db.run(`CREATE TABLE IF NOT EXISTS realtime_vitals(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bpm REAL,
    temp REAL,
    spo2 REAL,
    fall_detected INTEGER DEFAULT 0,
    timestamp TEXT DEFAULT(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  )`);

  // Existing legacy alterations (keep for backward compatibility)
  try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN spo2 REAL"); } catch (e) {}
  try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN timestamp TEXT"); } catch (e) {}

  // Phase 4: Clinical accuracy columns — safe migration
  try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN hrv_rmssd REAL"); } catch (e) {}
  try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN st_deviation_mv REAL"); } catch (e) {}
  try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN breathing_rate REAL"); } catch (e) {}
  try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN stress_index REAL"); } catch (e) {}
  try { _db.run("ALTER TABLE realtime_vitals ADD COLUMN ai_health_score REAL"); } catch (e) {}

  // Other tables
  _db.run(`CREATE TABLE IF NOT EXISTS ecg_sessions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    waveform_data TEXT,
    ai_summary TEXT,
    timestamp TEXT DEFAULT(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  )`);

  // ECG sessions columns — safe migration
  try { _db.run("ALTER TABLE ecg_sessions ADD COLUMN bpm REAL"); } catch (e) {}
  try { _db.run("ALTER TABLE ecg_sessions ADD COLUMN hrv_rmssd REAL"); } catch (e) {}
  try { _db.run("ALTER TABLE ecg_sessions ADD COLUMN st_deviation_mv REAL"); } catch (e) {}
  try { _db.run("ALTER TABLE ecg_sessions ADD COLUMN breathing_rate REAL"); } catch (e) {}
  try { _db.run("ALTER TABLE ecg_sessions ADD COLUMN r_peak_interval_ms REAL"); } catch (e) {}
  try { _db.run("ALTER TABLE ecg_sessions ADD COLUMN clinical_verdict TEXT"); } catch (e) {}

  _db.run(`CREATE TABLE IF NOT EXISTS daily_summaries(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary TEXT,
    timestamp TEXT DEFAULT(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  )`);

  persist();
  return _db;
}

function persist() {
  if (!_db) return;
  const data = _db.export();
  const buf = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buf);
}

module.exports = { getDb, persist };
