const http = require("http");

const payload = JSON.stringify({
  ecg_array: Array.from({ length: 500 }, () => Math.floor(Math.random() * 1000)),
  ir_array: Array.from({ length: 50 }, () => Math.floor(Math.random() * 1000)),
  red_array: Array.from({ length: 50 }, () => Math.floor(Math.random() * 1000)),
  temp: 36.5,
  current_bpm: 72,
  fall_detected: false,
  sample_rate: 250
});

const req = http.request(
  {
    hostname: "127.0.0.1",
    port: 5001,
    path: "/analyze",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    },
    timeout: 5000
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => data += chunk);
    res.on("end", () => {
      console.log("STATUS:", res.statusCode);
      console.log("RESPONSE:", data);
    });
  }
);

req.on("error", (err) => {
  console.error("ERROR:", err.message);
});

req.write(payload);
req.end();
