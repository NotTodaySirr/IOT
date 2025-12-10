#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "time.h"

// WiFi and MQTT Configuration
const char* WIFI_SSID     = "Your_WiFi_Name";
const char* WIFI_PASSWORD = "Your_WiFi_Password";
const char* MQTT_SERVER   = "192.168.1.100";
const int   MQTT_PORT     = 1883;

// Time configuration
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 25200; // 7 hours * 60 min * 60 sec
const int   daylightOffset_sec = 0;

// MQ-7 Sensor Calibration Constant
// R0 = Resistance in clean air (in kOhms)
// 10.0 kOhms is a common value for MQ-7 sensors
const float R0 = 10.0;

// Pin definitions
#define DHT_PIN         4
#define MQ7_PIN         34
#define RELAY_FAN1_PIN  26
#define RELAY_FAN2_PIN  27
#define LED_RED_PIN     18
#define LED_GREEN_PIN   19
#define BUZZER_PIN      5

#define I2C_SDA         21 
#define I2C_SCL         22

// Objects
DHT dht(DHT_PIN, DHT22);
WiFiClient espClient;
PubSubClient client(espClient);

// LCD 1 (Temp/Humidity)
LiquidCrystal_I2C lcd1(0x27, 20, 4);
// LCD 2 (Status/Time)
LiquidCrystal_I2C lcd2(0x26, 20, 4);

// Helper Functions
float calculatePPM(int analogValue) {
  // 1. Convert ADC value to Voltage (ESP32 is 3.3V, 12-bit ADC)
  float voltage = analogValue * (3.3 / 4095.0);

  // Avoid division by zero if sensor is disconnected
  if(voltage == 0) return 0;

  // 2. Calculate Sensor Resistance (Rs)
  float resistance = (3.3 - voltage) / voltage; 

  // 3. Calculate Ratio Rs/R0
  float ratio = resistance / R0;

  // 4. Calculate PPM using standard Logarithmic Formula for MQ-7
  // PPM = A * (Rs/R0)^B
  // A = 99.048, B = -1.518 (Derived from datasheet curve)
  float ppm = 99.048 * pow(ratio, -1.518);

  return ppm;
}

// Initialise Function (Flow A)
void init_hardware(){
  // 1. Initialise Pins
  pinMode(MQ7_PIN, INPUT);
  pinMode(RELAY_FAN1_PIN, OUTPUT);
  pinMode(RELAY_FAN2_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Set Default State (Safe)
  digitalWrite(RELAY_FAN1_PIN, LOW);
  digitalWrite(RELAY_FAN2_PIN, LOW);
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, HIGH); // Green ON

  // 2. Initialise I2C and LCDs
  Wire.begin(I2C_SDA, I2C_SCL);
  
  lcd1.init(); lcd1.backlight();
  lcd2.init(); lcd2.backlight();
  
  lcd1.setCursor(0, 0); lcd1.print("Hardware: OK");
  
  // 3. Initialise DHT Sensor
  dht.begin();
}

void init_wifi() {
  delay(10);
  Serial.print("[WIFI] Connecting to "); Serial.println(WIFI_SSID);
  
  lcd1.setCursor(0, 1); lcd1.print("WiFi: Connecting...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WIFI] Connected");
  lcd1.setCursor(0, 1); lcd1.print("WiFi: Connected  ");

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  lcd1.setCursor(0, 2); lcd1.print("Time: Syncing...");
}

void init_mqtt() {
  client.setServer(MQTT_SERVER, MQTT_PORT);
  
  lcd1.setCursor(0, 2); lcd1.print("MQTT: Connecting...");
  
  // Loop until we're connected
  while (!client.connected()) {
    Serial.print("[MQTT] Attempting connection...");
    
    if (client.connect("ESP32_Room_Monitor")) {
      Serial.println("connected");
      lcd1.setCursor(0, 2); lcd1.print("MQTT: Connected  ");
      client.publish("room/status", "online");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void display_time() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    lcd2.setCursor(0, 2);
    lcd2.print("Time: Sync Error    ");
    return;
  }

  // Format Time: HH:MM:SS
  char timeStr[10];
  strftime(timeStr, 10, "%H:%M:%S", &timeinfo);
  
  // Format Date: DD/MM/YYYY
  char dateStr[12];
  strftime(dateStr, 12, "%d/%m/%Y", &timeinfo);

  // Print to LCD 2 (Rows 2 and 3)
  lcd2.setCursor(0, 2);
  lcd2.print("Time: "); lcd2.print(timeStr);
  
  lcd2.setCursor(0, 3);
  lcd2.print("Date: "); lcd2.print(dateStr);
}

void setup() {
  Serial.begin(115200);

  // Execute Flow A
  init_hardware();
  init_wifi();
  init_mqtt();

  // Final System Status
  lcd2.clear();
  lcd2.setCursor(0, 0); lcd2.print("System Ready");
  lcd2.setCursor(0, 1); lcd2.print("IP: "); lcd2.print(WiFi.localIP());
  delay(2000);
  lcd1.clear(); lcd2.clear();
}

void loop() {
  if (!client.connected()) init_mqtt();
  client.loop();

  // 1. Read Sensors
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int rawGas = analogRead(MQ7_PIN);

  // 2. Convert to PPM
  float coPPM = calculatePPM(rawGas);

  if (isnan(temp) || isnan(hum)) return;

  // 3. Logic Thresholds
  // > 50 PPM is generally considered "Unhealthy" or "Caution"
  bool gasDanger = (coPPM > 50.0); 
  bool highTemp = (temp > 35.0);

  // 4. Actuators
  digitalWrite(RELAY_FAN1_PIN, highTemp ? HIGH : LOW);
  
  if (gasDanger) {
    digitalWrite(RELAY_FAN2_PIN, HIGH);
    digitalWrite(LED_RED_PIN, HIGH);
    digitalWrite(LED_GREEN_PIN, LOW);
    tone(BUZZER_PIN, 1000);
    lcd2.setCursor(0, 0); lcd2.print("DANGER: HIGH CO! ");
    client.publish("room/alert", "HIGH CO DETECTED!");
  } else {
    digitalWrite(RELAY_FAN2_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(LED_GREEN_PIN, HIGH);
    noTone(BUZZER_PIN);
    lcd2.setCursor(0, 0); lcd2.print("CO: Safe        ");
  }

  // 5. Display Update
  lcd1.setCursor(0, 0); lcd1.print("Temp: "); lcd1.print(temp, 1); lcd1.print("C");
  lcd1.setCursor(0, 1); lcd1.print("Hum:  "); lcd1.print(hum, 1); lcd1.print("%");
  
  // Show PPM on LCD 2
  lcd2.setCursor(0, 1); 
  lcd2.print("CO: "); lcd2.print(coPPM, 1); lcd2.print(" ppm   "); // Spaces clear old text

  display_time();

  // 6. MQTT Publish
  char tempStr[8], humStr[8], gasStr[8];
  dtostrf(temp, 1, 2, tempStr);
  dtostrf(hum, 1, 2, humStr);
  dtostrf(coPPM, 1, 2, gasStr); // Convert float PPM to string

  client.publish("room/temp", tempStr);
  client.publish("room/humidity", humStr);
  client.publish("room/co_ppm", gasStr);
  
  delay(1000);
}