#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <MAX30105.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <OneWire.h>
#include <DallasTemperature.h>

const char* ssid="Borshon";
const char* pass="Adnan123";
const char* serverUrl="http://192.168.0.102:4000/api/esp32/data";

#define ONE_WIRE_BUS 4

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);

MAX30105 particleSensor;
Adafruit_MPU6050 mpu;

const int maxSamples=50;

float ecgArray[maxSamples];
long irArray[maxSamples];
long redArray[maxSamples];

int sampleCount=0;

unsigned long lastReadTime=0;
unsigned long readInterval=40;

bool fallFlag=false;
bool maxReady=false;
bool mpuReady=false;

void setup(){

Serial.begin(9600);
delay(2000);

Serial.println("BOOTING...");

// ---------- I2C ----------
Wire.begin(21,22);
Wire.setClock(100000);

Wire1.begin(25,26);
Wire1.setClock(100000);

delay(500);

// ---------- TEMP ----------
tempSensor.begin();

// ---------- MAX30102 ----------
Serial.println("Starting MAX30102...");

if(!particleSensor.begin(Wire,I2C_SPEED_STANDARD)){
Serial.println("MAX30102 FAIL");
}else{
particleSensor.setup(60,4,2,400,411,4096);
maxReady=true;
Serial.println("MAX30102 READY");
}

delay(500);

// ---------- MPU6050 ----------
Serial.println("Starting MPU6050...");

// retry system
for(int i=0;i<5;i++){

if(mpu.begin(0x68,&Wire1)){

mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
mpu.setGyroRange(MPU6050_RANGE_500_DEG);
mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

mpuReady=true;

Serial.println("MPU6050 READY");
break;

}else{

Serial.print("MPU TRY FAILED: ");
Serial.println(i+1);

delay(1000);
}
}

if(!mpuReady){
Serial.println("MPU6050 FINAL FAIL");
}

// ---------- WIFI ----------
Serial.println("Connecting WiFi...");

WiFi.begin(ssid,pass);

while(WiFi.status()!=WL_CONNECTED){
delay(500);
Serial.print(".");
}

Serial.println("");
Serial.println("WiFi Connected");
Serial.println("SETUP DONE");
}

void loop(){

if(millis()-lastReadTime>readInterval){

lastReadTime=millis();

if(sampleCount<maxSamples){

// ECG
ecgArray[sampleCount]=analogRead(34);

// MAX30102
if(maxReady){
irArray[sampleCount]=particleSensor.getIR();
redArray[sampleCount]=particleSensor.getRed();
}else{
irArray[sampleCount]=0;
redArray[sampleCount]=0;
}

// MPU6050
if(mpuReady){

sensors_event_t a,g,temp;

mpu.getEvent(&a,&g,&temp);

float accelMag=sqrt(
sq(a.acceleration.x)+
sq(a.acceleration.y)+
sq(a.acceleration.z)
);

Serial.print("AX:");
Serial.print(a.acceleration.x);

Serial.print(" AY:");
Serial.print(a.acceleration.y);

Serial.print(" AZ:");
Serial.println(a.acceleration.z);

if(accelMag>25.0){
fallFlag=true;
}
}

sampleCount++;

}else{

Serial.println("Sending Data...");

if(WiFi.status()==WL_CONNECTED){

HTTPClient http;

http.begin(serverUrl);
http.addHeader("Content-Type","application/json");

DynamicJsonDocument doc(8192);

tempSensor.requestTemperatures();

doc["temp"]=tempSensor.getTempCByIndex(0);
doc["fall_detected"]=fallFlag;

JsonArray ecg=doc.createNestedArray("ecg_array");
JsonArray ir=doc.createNestedArray("ir_array");
JsonArray red=doc.createNestedArray("red_array");

for(int i=0;i<maxSamples;i++){

ecg.add(ecgArray[i]);
ir.add(irArray[i]);
red.add(redArray[i]);
}

String payload;

serializeJson(doc,payload);

int resp=http.POST(payload);

Serial.print("Response: ");
Serial.println(resp);

http.end();

}else{

Serial.println("WiFi Lost");
}

sampleCount=0;
fallFlag=false;
}
}
}