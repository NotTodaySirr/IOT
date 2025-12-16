#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "time.h"

//#define BYPASS_NETWORKING

const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";
const char* MQTT_SERVER   = "broker.hivemq.com"; 
const int   MQTT_PORT     = 1883;

// Time configuration
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 25200; // 7 hours
const int   daylightOffset_sec = 0;

const float R0 = 10.0;

// Pin definitions
#define DHT_PIN         4
#define MQ7_PIN         10   
#define RELAY_FAN1_PIN  38  
#define RELAY_FAN2_PIN  39  
#define LED_RED_PIN     18
#define LED_GREEN_PIN   19
#define BUZZER_PIN      5

// Buzzer LEDC Configuration
#define LEDC_CHANNEL 0
#define LEDC_RESOLUTION 8
#define LEDC_BASE_FREQ 2000

#define I2C_SDA         8   
#define I2C_SCL         9   

// Objects
DHT dht(DHT_PIN, DHT22);
WiFiClient espClient;
PubSubClient client(espClient);

LiquidCrystal_I2C lcd1(0x27, 20, 4);
LiquidCrystal_I2C lcd2(0x26, 20, 4);

// Global Variables for Timers
unsigned long lastSensorRead = 0;
const long sensorInterval = 1000; // Read sensors every 1 second

unsigned long lastBlink = 0;
const long blinkInterval = 500;   // Blink LED every 500ms
bool redLedState = LOW;           // Track blink state
bool isGasDanger = false;         // Persist danger state between loops

// Helper Functions
float calculatePPM(int analogValue) {
  float voltage = analogValue * (3.3 / 4095.0);
  if (voltage < 0.1) return 0.0;
  if (voltage > 3.2) return 9999.0;

  const float RL = 10.0; 
  float sensorResistance = RL * ((3.3 / voltage) - 1.0);
  float ratio = sensorResistance / R0;

  if (ratio < 0.01) return 9999.0;
  if (ratio > 100.0) return 0.0;

  float ppm = 99.048 * pow(ratio, -1.518);
  if (ppm < 0) ppm = 0;
  if (ppm > 9999.0) ppm = 9999.0;
  return ppm;
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char message[length + 1];
  for (unsigned int i = 0; i < length; i++) {
    message[i] = (char)payload[i];
  }
  message[length] = '\0';
  
  if (strcmp(message, "FAN_ON") == 0) {
    digitalWrite(RELAY_FAN1_PIN, HIGH);
  } else if (strcmp(message, "FAN_OFF") == 0) {
    digitalWrite(RELAY_FAN1_PIN, LOW);
  } else if (strcmp(message, "PURIFIER_ON") == 0) {
    digitalWrite(RELAY_FAN2_PIN, HIGH);
  } else if (strcmp(message, "PURIFIER_OFF") == 0) {
    digitalWrite(RELAY_FAN2_PIN, LOW);
  }
}

void init_hardware(){
  pinMode(MQ7_PIN, INPUT);
  pinMode(RELAY_FAN1_PIN, OUTPUT);
  pinMode(RELAY_FAN2_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(RELAY_FAN1_PIN, LOW);
  digitalWrite(RELAY_FAN2_PIN, LOW);
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, HIGH); 
  
  ledcSetup(LEDC_CHANNEL, LEDC_BASE_FREQ, LEDC_RESOLUTION);
  ledcAttachPin(BUZZER_PIN, LEDC_CHANNEL);

  Wire.begin(I2C_SDA, I2C_SCL);
  lcd1.init(); lcd1.backlight(); lcd1.clear();
  lcd2.init(); lcd2.backlight(); lcd2.clear();
  
  lcd1.setCursor(0, 0); lcd1.print("LCD1: Sensors");
  lcd2.setCursor(0, 0); lcd2.print("LCD2: Time/Date");
  
  dht.begin();
}

void init_wifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
}

void init_mqtt() {
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);
  // Non-blocking approach preferred, but blocking ok for setup
  int retries = 0;
  while (!client.connected() && retries < 5) {
    if (client.connect("ESP32_Room_Monitor")) {
      client.subscribe("ecs/control");
      client.publish("room/status", "online");
    } else {
      delay(1000);
      retries++;
    }
  }
}

void display_time() {
  #ifndef BYPASS_NETWORKING
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    lcd2.setCursor(0, 2); lcd2.print("Time: Sync Error    ");
    return;
  }
  char timeStr[10], dateStr[12];
  strftime(timeStr, 10, "%H:%M:%S", &timeinfo);
  strftime(dateStr, 12, "%d/%m/%Y", &timeinfo);

  lcd2.setCursor(0, 2); lcd2.print("Time: "); lcd2.print(timeStr);
  lcd2.setCursor(0, 3); lcd2.print("Date: "); lcd2.print(dateStr);
  #endif
}

void setup() {
  Serial.begin(115200);
  init_hardware();
  #ifndef BYPASS_NETWORKING
  init_wifi();
  init_mqtt();
  #endif
}

void loop() {
  unsigned long currentMillis = millis();

  // --- 1. NETWORK TASK (Always Run) ---
  #ifndef BYPASS_NETWORKING
  if (!client.connected()) {
    // Basic reconnect if needed
    if (WiFi.status() == WL_CONNECTED) {
       if (client.connect("ESP32_Room_Monitor")) {
          client.subscribe("ecs/control");
       }
    }
  }
  client.loop();
  #endif

  // --- 2. SENSOR TASK (Run every 1 second) ---
  if (currentMillis - lastSensorRead >= sensorInterval) {
    lastSensorRead = currentMillis;
    
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    int rawGas = analogRead(MQ7_PIN);
    float coPPM = calculatePPM(rawGas);

    if (!isnan(temp) && !isnan(hum)) {
      // Logic Thresholds
      bool highTemp = (temp > 35.0);
      isGasDanger = (coPPM > 50.0); // Update global flag for the blink task

      // Actuators (Fans/Buzzer)
      digitalWrite(RELAY_FAN1_PIN, highTemp ? HIGH : LOW);

      if (isGasDanger) {
        digitalWrite(RELAY_FAN2_PIN, HIGH);
        ledcWriteTone(LEDC_CHANNEL, 1000);
        #ifndef BYPASS_NETWORKING
        client.publish("room/alert", "HIGH CO DETECTED!");
        #endif
      } else {
        digitalWrite(RELAY_FAN2_PIN, LOW);
        ledcWriteTone(LEDC_CHANNEL, 0);
      }

      // Display Update
      lcd1.setCursor(0, 0); lcd1.print("Temp: "); lcd1.print(temp, 1); lcd1.print("C     ");
      lcd1.setCursor(0, 1); lcd1.print("Hum:  "); lcd1.print(hum, 1); lcd1.print("%     ");
      lcd1.setCursor(0, 2); lcd1.print("CO:   "); lcd1.print(coPPM, 1); lcd1.print(" ppm   ");
      lcd1.setCursor(0, 3); 
      if (isGasDanger) lcd1.print("Status: DANGER!     ");
      else lcd1.print("Status: Safe        ");

      display_time();

      // MQTT Publish
      char tempStr[16], humStr[16], gasStr[16];
      dtostrf(temp, 1, 2, tempStr);
      dtostrf(hum, 1, 2, humStr);
      dtostrf(min(coPPM, 9999.0f), 1, 2, gasStr);

      #ifndef BYPASS_NETWORKING
      String payload = "{\"temperature\":" + String(tempStr) + ",\"humidity\":" + String(humStr) + ",\"co_level\":" + String(gasStr) + "}";
      client.publish("ecs/upload", payload.c_str());
      #endif
    }
  }

  // --- 3. LED BLINK TASK (Run very frequently) ---
  if (isGasDanger) {
    // DANGER MODE: Green OFF, Red Blinking
    digitalWrite(LED_GREEN_PIN, LOW);
    
    if (currentMillis - lastBlink >= blinkInterval) {
      lastBlink = currentMillis;
      redLedState = !redLedState; // Toggle state
      digitalWrite(LED_RED_PIN, redLedState);
    }
  } else {
    // SAFE MODE: Green ON, Red OFF
    digitalWrite(LED_GREEN_PIN, HIGH);
    digitalWrite(LED_RED_PIN, LOW);
    redLedState = LOW; // Reset state so it starts ON/OFF cleanly next time
  }
}