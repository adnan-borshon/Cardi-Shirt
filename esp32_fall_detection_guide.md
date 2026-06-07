# ESP32 & MPU6050 Fall Detection Fixes and Heart Rate Integration

This guide provides the complete solution for correcting the MPU6050 initialization error on your ESP32, implementing a robust 3-Phase Fall Detection algorithm, and configuring your system to correlate heart rate (BPM) with fall detection to eliminate false alarms and prioritize critical emergencies.

---

## 🛠️ Part 1: Resolving the MPU6050 Hardware & Setup Error

### Why the MPU6050 is failing while other sensors work:
1. **Lack of Pull-up Resistors on `Wire1` (Pins 25/26):**
   Unlike the default I2C pins (`GPIO 21 & 22`), auxiliary pins like `GPIO 25 & 26` do not have internal physical pull-up resistors on standard ESP32 development boards. Without pull-up resistors, the I2C lines cannot transition high, causing `mpu.begin()` to fail.
2. **Unnecessary Bus Separation:**
   Both the **MAX30102** and **MPU6050** can safely share the default I2C bus (`Wire`) on pins 21/22. They have different, non-conflicting addresses:
   * **MAX30102:** `0x57`
   * **MPU6050:** `0x68` (or `0x69`)

### ⚡ The Fix:
Connect both sensors to the same physical SDA/SCL pins (`GPIO 21 & 22`) and initialize them on the default `Wire` object.

---

## 🏃 Part 2: Advanced 3-Phase Fall Detection Algorithm

Instead of a simple "high acceleration = fall" check, we use a three-stage validation system:

1. **Phase 1: Free Fall (Low-G):** The acceleration magnitude drops below $0.6g$ (about $5.8\text{ m/s}^2$) as gravity momentarily disappears during a descent.
2. **Phase 2: Impact (High-G):** A sudden deceleration spike exceeding $2.8g$ (about $27.4\text{ m/s}^2$) within 500ms of the free fall.
3. **Phase 3: Posture & Inactivity Validation:** After 2 seconds, the sensor verifies:
   * **Tilt Angle:** The torso's angle has changed from vertical to horizontal (tilt $> 60^\circ$).
   * **Inactivity:** The user remains still (acceleration remains near $1.0g$ with negligible variance). If the user is active, it means they just sat down/stood up, and the alert is canceled.

---

## 💓 Part 3: Heart Rate (BPM) Integration on the Backend

Correlating a fall with the user's heart rate adds a powerful layer of validation:
* **The Logic:** If a fall occurs followed by a sudden spike in heart rate (tachycardia due to shock/panic) or a dramatic drop (bradycardia/asystole), the system upgrades the event to **Critical SOS**.
* **How it fits into the flow:**
  1. The ESP32 sends `fall_detected: true` along with the batch of ECG/MAX30102 raw sensor arrays.
  2. The backend calculates the real-time BPM.
  3. If `fall_detected` is true and the BPM is outside normal bounds ($< 55 \text{ bpm}$ or $> 110 \text{ bpm}$), the alert severity is marked as **Critical**, triggering immediate Twilio emergency broadcasts.

### Backend Integration Example:
Here is how you can modify the backend's `/api/esp32/data` endpoint to implement this logic:

```javascript
// Inside backend/server.js -> app.post("/api/esp32/data", ...)
const bpm = calculateBPM(ir_array);
const spo2 = calculateSpO2(ir_array, red_array);

// Correlate BPM with Fall Detection
let isCriticalEmergency = false;
if (fall_detected) {
  // Check if BPM is abnormally high (shock/tachycardia) or abnormally low (bradycardia)
  if (bpm > 110 || bpm < 55) {
    isCriticalEmergency = true;
    console.log(`[ALERT] CRITICAL FALL: Fall detected with abnormal BPM of ${bpm}!`);
  } else {
    console.log(`[ALERT] Moderate Fall: Fall detected but BPM is normal (${bpm}).`);
  }
}
```

---

## 📝 Part 4: Fully Corrected and Optimized ESP32 Firmware

Here is the complete code with all the fixes. It solves:
1. **MPU6050 Error** (uses shared I2C bus).
2. **Freezing/Gaps** (makes temperature readings non-blocking).
3. **Memory Waste** (reduces JSON document size to 3072 bytes).
4. **ECG Resolution Clipping** (configures ADC1 attenuation).
5. **False Positives** (implements the 3-phase algorithm).

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <MAX30105.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <OneWire.h>
#include <DallasTemperature.h>

const char* ssid = "Borshon";
const char* pass = "Adnan123";
const char* serverUrl = "http://192.168.0.102:4000/api/esp32/data";

#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

MAX30105 particleSensor;
Adafruit_MPU6050 mpu;

const int maxSamples = 50;
float ecgArray[maxSamples];
long irArray[maxSamples];
long redArray[maxSamples];
int sampleCount = 0;

unsigned long lastReadTime = 0;
unsigned long readInterval = 40; // 25Hz sampling rate

// Fall detection state variables
bool freeFallDetected = false;
unsigned long fallStartTime = 0;
bool impactDetected = false;
unsigned long impactTime = 0;
bool fallFlag = false;

// Sensor ready statuses
bool maxReady = false;
bool mpuReady = false;

// Non-blocking temperature variables
unsigned long lastTempRequestTime = 0;
const unsigned long tempInterval = 10000; // Read temperature every 10s
float currentTemperature = 36.5;

void setup() {
  Serial.begin(115200); // Upgraded baud rate for faster debugging
  delay(2000);
  Serial.println("BOOTING...");

  // ---------- Configure ECG Pin (ADC1) ----------
  analogSetAttenuation(ADC_11db); // Full 0-3.3V range for ESP32 ADC1 pins

  // ---------- Setup Shared I2C Bus ----------
  Wire.begin(21, 22); // Both sensors must be connected to Pin 21 (SDA) and Pin 22 (SCL)
  Wire.setClock(400000); // 400kHz fast I2C mode

  delay(500);

  // ---------- Temp Sensor Setup ----------
  tempSensor.begin();
  tempSensor.setWaitForConversion(false); // Enable non-blocking temperature reads
  tempSensor.requestTemperatures();       // Initial request

  // ---------- MAX30102 Setup ----------
  Serial.println("Starting MAX30102...");
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 FAIL");
  } else {
    particleSensor.setup(60, 4, 2, 400, 411, 4096);
    maxReady = true;
    Serial.println("MAX30102 READY");
  }

  delay(500);

  // ---------- MPU6050 Setup ----------
  Serial.println("Starting MPU6050...");
  for (int i = 0; i < 5; i++) {
    if (mpu.begin(0x68, &Wire)) { // Shared Wire I2C bus
      mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
      mpu.setGyroRange(MPU6050_RANGE_500_DEG);
      mpu.setFilterBandwidth(MPU6050_BAND_21_HZ); // Filter noise
      mpuReady = true;
      Serial.println("MPU6050 READY");
      break;
    } else {
      Serial.print("MPU TRY FAILED: ");
      Serial.println(i + 1);
      delay(1000);
    }
  }

  if (!mpuReady) {
    Serial.println("MPU6050 FINAL FAIL");
  }

  // ---------- WiFi Setup ----------
  Serial.println("Connecting WiFi...");
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected. Setup complete.");
}

void loop() {
  unsigned long now = millis();

  // ---------- Non-blocking Temperature Handler ----------
  if (now - lastTempRequestTime >= tempInterval) {
    currentTemperature = tempSensor.getTempCByIndex(0);
    tempSensor.requestTemperatures(); // Request next reading asynchronously
    lastTempRequestTime = now;
  }

  // ---------- Main Sensor Sampling (25Hz) ----------
  if (now - lastReadTime > readInterval) {
    lastReadTime = now;

    if (sampleCount < maxSamples) {
      // 1. Read ECG
      ecgArray[sampleCount] = analogRead(34);

      // 2. Read MAX30102
      if (maxReady) {
        irArray[sampleCount] = particleSensor.getIR();
        redArray[sampleCount] = particleSensor.getRed();
      } else {
        irArray[sampleCount] = 0;
        redArray[sampleCount] = 0;
      }

      // 3. Read MPU6050 & Run Fall Logic
      if (mpuReady) {
        sensors_event_t a, g, temp;
        mpu.getEvent(&a, &g, &temp);

        float accelMag = sqrt(sq(a.acceleration.x) + sq(a.acceleration.y) + sq(a.acceleration.z));

        // --- Multi-Phase Fall Detection ---
        // Phase 1: Free Fall (Low-G)
        if (!freeFallDetected && accelMag < 5.88) { // 0.6g
          freeFallDetected = true;
          fallStartTime = now;
        }

        // Reset Free Fall if no impact happens within 500ms
        if (freeFallDetected && (now - fallStartTime > 500)) {
          freeFallDetected = false;
        }

        // Phase 2: Impact (High-G)
        if (freeFallDetected && accelMag > 27.44) { // 2.8g
          impactDetected = true;
          freeFallDetected = false;
          impactTime = now;
        }

        // Phase 3: Posture & Inactivity Validation (Evaluated 2s after impact)
        if (impactDetected && (now - impactTime >= 2000)) {
          float tiltAngle = acos(a.acceleration.z / accelMag) * 180.0 / PI;
          bool isStationary = abs(accelMag - 9.81) < 1.96; // Within 0.2g margin
          bool isHorizontal = tiltAngle > 60.0;            // Torso is tilted horizontally

          if (isHorizontal && isStationary) {
            fallFlag = true; // Fall confirmed
            Serial.println("[FALL] Confirmed! Posture horizontal and user inactive.");
          }
          impactDetected = false;
        }
      }
      sampleCount++;
    } else {
      // ---------- Transmit Data Packet to Backend ----------
      Serial.println("Sending Data Packets...");
      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        // Reduced Json document size from 8192 to 3072 bytes (safe & efficient)
        StaticJsonDocument<3072> doc;
        doc["temp"] = currentTemperature;
        doc["fall_detected"] = fallFlag;

        JsonArray ecg = doc.createNestedArray("ecg_array");
        JsonArray ir = doc.createNestedArray("ir_array");
        JsonArray red = doc.createNestedArray("red_array");

        for (int i = 0; i < maxSamples; i++) {
          ecg.add(ecgArray[i]);
          ir.add(irArray[i]);
          red.add(redArray[i]);
        }

        String payload;
        serializeJson(doc, payload);
        int resp = http.POST(payload);

        Serial.print("Payload size: ");
        Serial.print(payload.length());
        Serial.print(" | Server Response: ");
        Serial.println(resp);

        http.end();
      } else {
        Serial.println("WiFi Disconnected!");
      }

      // Reset buffers and variables
      sampleCount = 0;
      fallFlag = false;
    }
  }
}
```
