const { getDb } = require("./db");

async function check() {
  const db = await getDb();
  const res = db.exec("SELECT * FROM realtime_vitals ORDER BY id DESC LIMIT 5");
  console.log("LAST 5 REALTIME VITALS:");
  if (res.length && res[0].values.length) {
    res[0].values.forEach(row => {
      console.log(row);
    });
  } else {
    console.log("No records found.");
  }
}

check().catch(console.error);
