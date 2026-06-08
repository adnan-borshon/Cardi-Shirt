#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <MAX30105.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>

const char* ssid = "Borshon";
const char* pass = "Adnan123";
const char* serverUrl = "http://192.168.0.101:4000/api/esp32/data";

#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

MAX30105 particleSensor;
// We removed Adafruit_MPU6050 mpu; because we are reading it directly now
const int MPU_ADDR = 0x68; // Address for the MPU6050

const int maxEcgSamples = 500;
const int maxPpgSamples = 50;
float ecgArray[maxEcgSamples];
long irArray[maxPpgSamples];
long redArray[maxPpgSamples];
int ecgSampleCount = 0;
int ppgSampleCount = 0;

unsigned long lastEcgReadTime = 0;
unsigned long ecgReadInterval = 4; // 250Hz sampling rate

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

// ---------- background upload task config ----------
TaskHandle_t uploadTaskHandle = NULL;

float ecgTxBuffer[maxEcgSamples];
long irTxBuffer[maxPpgSamples];
long redTxBuffer[maxPpgSamples];
float txTemp = 36.5;
bool txFallFlag = false;
volatile bool txReady = false;

void uploadTask(void * pvParameters) {
  for(;;) {
    if (txReady) {
      Serial.println("\n[Upload Task] Sending Data Packets to Server...");
      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        DynamicJsonDocument doc(16384);
        doc["temp"] = txTemp;
        doc["fall_detected"] = txFallFlag;

        JsonArray ecg = doc.createNestedArray("ecg_array");
        JsonArray ir = doc.createNestedArray("ir_array");
        JsonArray red = doc.createNestedArray("red_array");

        for (int i = 0; i < maxEcgSamples; i++) {
          ecg.add(ecgTxBuffer[i]);
        }
        for (int i = 0; i < maxPpgSamples; i++) {
          ir.add(irTxBuffer[i]);
          red.add(redTxBuffer[i]);
        }

        String payload;
        serializeJson(doc, payload);
        int resp = http.POST(payload);

        Serial.print("[Upload Task] Payload size: ");
        Serial.print(payload.length());
        Serial.print(" | Server Response: ");
        Serial.println(resp);

        http.end();
      } else {
        Serial.println("[Upload Task] [ERROR] WiFi Disconnected! Skipping upload.");
      }
      txReady = false;
    }
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("\n=== ESP32 NEW MAIN FILE BOOTING ===");

  // ---------- Configure ECG Pin (ADC1) ----------
  analogSetAttenuation(ADC_11db); // Full 0-3.3V range for ESP32 ADC1 pins

  // ---------- Setup Shared I2C Bus ----------
  Serial.println("Initializing I2C Bus on Pins 21 (SDA) and 22 (SCL)...");
  Wire.begin(21, 22); 
  Wire.setClock(400000); // 400kHz fast I2C mode
  delay(500);

  // ---------- Temp Sensor Setup ----------
  Serial.println("Initializing Dallas Temperature Sensor...");
  tempSensor.begin();
  tempSensor.setWaitForConversion(false);
  tempSensor.requestTemperatures();       
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

  // ---------- MPU6050 Setup (Direct Raw Mode) ----------
  Serial.println("Starting MPU6050 on shared I2C bus (Raw Mode)...");
  for (int i = 0; i < 5; i++) {
    // Talk to the power management register to wake it up
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x6B); 
    Wire.write(0);    // 0 wakes it up
    byte error = Wire.endTransmission(true);
    
    if (error == 0) { 
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

  // ---------- Launch Background Upload Task (Core 0) ----------
  xTaskCreatePinnedToCore(
    uploadTask,
    "UploadTask",
    8192,
    NULL,
    1,
    &uploadTaskHandle,
    0
  );
  Serial.println("[FreeRTOS] Background Upload Task started on Core 0");

  Serial.println("=== SETUP COMPLETE ===\n");
}

void loop() {
  unsigned long now = millis();

  // ---------- Non-blocking Temperature Handler ----------
  if (now - lastTempRequestTime >= tempInterval) {
    currentTemperature = tempSensor.getTempCByIndex(0);
    tempSensor.requestTemperatures(); 
    lastTempRequestTime = now;
    Serial.print("[DEBUG] Temp read: ");
    Serial.print(currentTemperature);
    Serial.println(" C");
  }

  // ---------- Main Sensor Sampling (250Hz for ECG, 25Hz for PPG/MPU6050) ----------
  if (now - lastEcgReadTime >= ecgReadInterval) {
    lastEcgReadTime = now;

    if (ecgSampleCount < maxEcgSamples) {
      // 1. Read ECG
      ecgArray[ecgSampleCount] = analogRead(34);

      // 2. Read PPG & MPU6050 (at 25 Hz, i.e., every 10th ECG sample)
      if (ecgSampleCount % 10 == 0 && ppgSampleCount < maxPpgSamples) {
        // Read MAX30102
        if (maxReady) {
          irArray[ppgSampleCount] = particleSensor.getIR();
          redArray[ppgSampleCount] = particleSensor.getRed();
        } else {
          irArray[ppgSampleCount] = 0;
          redArray[ppgSampleCount] = 0;
        }

        // Read MPU6050 & Run Fall Logic
        if (mpuReady) {
          // Go to the memory spot where acceleration data starts
          Wire.beginTransmission(MPU_ADDR);
          Wire.write(0x3B);
          Wire.endTransmission(false);
          // Ask for 6 bytes of data (X, Y, and Z)
          Wire.requestFrom(MPU_ADDR, 6, true);
          
          if (Wire.available() == 6) {
            int16_t rawX = Wire.read() << 8 | Wire.read();
            int16_t rawY = Wire.read() << 8 | Wire.read();
            int16_t rawZ = Wire.read() << 8 | Wire.read();

            // Convert raw numbers to meters per second squared (m/s^2)
            // 16384.0 is the scale factor for the sensor. 9.81 is Earth's gravity.
            float ax = (rawX / 16384.0) * 9.81;
            float ay = (rawY / 16384.0) * 9.81;
            float az = (rawZ / 16384.0) * 9.81;

            // Now we run your exact fall detection math
            float accelMag = sqrt(sq(ax) + sq(ay) + sq(az));

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
              // Calculate tilt using the converted Z-axis (az)
              float tiltAngle = acos(az / accelMag) * 180.0 / PI;
              bool isStationary = abs(accelMag - 9.81) < 1.96; // Within 0.2g margin
              bool isHorizontal = tiltAngle > 60.0; // Torso is tilted horizontally

              Serial.print("[DEBUG] Validation: Tilt Angle = ");
              Serial.print(tiltAngle);
              Serial.print(" deg (Horizontal threshold > 60) | Stationary = ");
              Serial.println(isStationary ? "TRUE" : "FALSE");

              if (isHorizontal && isStationary) {
                fallFlag = true;
                Serial.println("[FALL] ALERT! Fall Confirmed. Posture is horizontal and user is inactive.");
              } else {
                Serial.println("[DEBUG] Alert Canceled: User is either active or upright.");
              }
              impactDetected = false;
            }
          }
        }
        ppgSampleCount++;
      }
      ecgSampleCount++;
      
    } else {
      // ---------- Handoff Data Packet to Upload Task ----------
      if (!txReady) {
        for (int i = 0; i < maxEcgSamples; i++) {
          ecgTxBuffer[i] = ecgArray[i];
        }
        for (int i = 0; i < maxPpgSamples; i++) {
          irTxBuffer[i] = irArray[i];
          redTxBuffer[i] = redArray[i];
        }
        txTemp = currentTemperature;
        txFallFlag = fallFlag;
        txReady = true; // Signal upload task
        Serial.println("\n[Main Loop] Packet handoff to Tx buffer succeeded.");
      } else {
        Serial.println("\n[Main Loop] [WARN] Previous upload task still active. Skipping packet.");
      }

      // Reset buffers and variables
      ecgSampleCount = 0;
      ppgSampleCount = 0;
      fallFlag = false;
      Serial.println();
    }
  }
}