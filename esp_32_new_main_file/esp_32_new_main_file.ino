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
const char* serverUrl = "http://192.168.0.101:4000/api/esp32/data";

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
  Serial.begin(115200); // 115200 is much better for ESP32 and prevents serial blockages
  delay(2000);
  Serial.println("\n=== ESP32 NEW MAIN FILE BOOTING ===");

  // ---------- Configure ECG Pin (ADC1) ----------
  analogSetAttenuation(ADC_11db); // Full 0-3.3V range for ESP32 ADC1 pins

  // ---------- Setup Shared I2C Bus ----------
  Serial.println("Initializing I2C Bus on Pins 21 (SDA) and 22 (SCL)...");
  Wire.begin(21, 22); // Both sensors share I2C Pin 21 and Pin 22
  Wire.setClock(400000); // 400kHz fast I2C mode

  delay(500);

  // ---------- Temp Sensor Setup ----------
  Serial.println("Initializing Dallas Temperature Sensor...");
  tempSensor.begin();
  tempSensor.setWaitForConversion(false); // Enable non-blocking temperature reads
  tempSensor.requestTemperatures();       // Initial request
  Serial.println("Dallas Temp Sensor Initialized.");

  // ---------- MAX30102 Setup ----------
  Serial.println("Starting MAX30102 on shared I2C bus...");
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[ERROR] MAX30102 Initialization FAIL");
  } else {
    particleSensor.setup(60, 4, 2, 400, 411, 4096);
    maxReady = true;
    Serial.println("[SUCCESS] MAX30102 READY");
  }

  delay(500);

  // ---------- MPU6050 Setup ----------
  Serial.println("Starting MPU6050 on shared I2C bus...");
  for (int i = 0; i < 5; i++) {
    if (mpu.begin(0x68, &Wire)) { // Shared Wire I2C bus on 21/22
      mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
      mpu.setGyroRange(MPU6050_RANGE_500_DEG);
      mpu.setFilterBandwidth(MPU6050_BAND_21_HZ); // Filter noise
      mpuReady = true;
      Serial.println("[SUCCESS] MPU6050 READY");
      break;
    } else {
      Serial.print("MPU Try failed: ");
      Serial.println(i + 1);
      delay(1000);
    }
  }

  if (!mpuReady) {
    Serial.println("[ERROR] MPU6050 FINAL FAIL");
  }

  // ---------- WiFi Setup ----------
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[SUCCESS] WiFi Connected. IP address: ");
  Serial.println(WiFi.localIP());
  Serial.println("=== SETUP COMPLETE ===\n");
}

void loop() {
  unsigned long now = millis();

  // ---------- Non-blocking Temperature Handler ----------
  if (now - lastTempRequestTime >= tempInterval) {
    currentTemperature = tempSensor.getTempCByIndex(0);
    tempSensor.requestTemperatures(); // Request next reading asynchronously
    lastTempRequestTime = now;
    Serial.print("[DEBUG] Temp read: ");
    Serial.print(currentTemperature);
    Serial.println(" C");
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

        // --- Debug output of accelerometer values (highly helpful) ---
        Serial.print("AX: "); Serial.print(a.acceleration.x);
        Serial.print(" | AY: "); Serial.print(a.acceleration.y);
        Serial.print(" | AZ: "); Serial.print(a.acceleration.z);
        Serial.print(" | Mag: "); Serial.println(accelMag);

        // --- Multi-Phase Fall Detection ---
        // Phase 1: Free Fall (Low-G)
        if (!freeFallDetected && accelMag < 5.88) { // 0.6g
          freeFallDetected = true;
          fallStartTime = now;
          Serial.println("[DEBUG] Phase 1 Triggered: Free Fall detected (Low-G). Waiting for impact...");
        }

        // Reset Free Fall if no impact happens within 500ms
        if (freeFallDetected && (now - fallStartTime > 500)) {
          freeFallDetected = false;
          Serial.println("[DEBUG] Phase 1 Reset: Timeout (no impact within 500ms).");
        }

        // Phase 2: Impact (High-G)
        if (freeFallDetected && accelMag > 27.44) { // 2.8g
          impactDetected = true;
          freeFallDetected = false;
          impactTime = now;
          Serial.println("[DEBUG] Phase 2 Triggered: Impact detected (High-G). Validating posture...");
        }

        // Phase 3: Posture & Inactivity Validation (Evaluated 2s after impact)
        if (impactDetected && (now - impactTime >= 2000)) {
          float tiltAngle = acos(a.acceleration.z / accelMag) * 180.0 / PI;
          bool isStationary = abs(accelMag - 9.81) < 1.96; // Within 0.2g margin
          bool isHorizontal = tiltAngle > 60.0;            // Torso is tilted horizontally

          Serial.print("[DEBUG] Validation: Tilt Angle = ");
          Serial.print(tiltAngle);
          Serial.print(" deg (Horizontal threshold > 60) | Stationary = ");
          Serial.println(isStationary ? "TRUE" : "FALSE");

          if (isHorizontal && isStationary) {
            fallFlag = true; // Fall confirmed
            Serial.println("[FALL] ALERT! Fall Confirmed. Posture is horizontal and user is inactive.");
          } else {
            Serial.println("[DEBUG] Alert Canceled: User is either active or upright.");
          }
          impactDetected = false;
        }
      }
      sampleCount++;
    } else {
      // ---------- Transmit Data Packet to Backend ----------
      Serial.println("\nSending Data Packets to Server...");
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
        Serial.println("[ERROR] WiFi Disconnected! Skipping upload.");
      }

      // Reset buffers and variables
      sampleCount = 0;
      fallFlag = false;
      Serial.println();
    }
  }
}
