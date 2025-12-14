#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "time.h"

// WiFi and MQTT Configuration
// Uncomment the following line to bypass WiFi and MQTT for hardware testing
// Uncomment the following line to bypass WiFi and MQTT for hardware testing
//#define BYPASS_NETWORKING

const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";
const char* MQTT_SERVER   = "broker.hivemq.com";
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

#define I2C_SDA         8   // ESP32-S3 default SDA
#define I2C_SCL         9   // ESP32-S3 default SCL

// Objects
DHT dht(DHT_PIN, DHT22);
WiFiClient espClient;
PubSubClient client(espClient);

// LCD 1 (Temp/Humidity) - Address 0x27
LiquidCrystal_I2C lcd1(0x27, 20, 4);
// LCD 2 (Status/Time) - Address 0x26
LiquidCrystal_I2C lcd2(0x26, 20, 4);

// Helper Functions
float calculatePPM(int analogValue) {
  // 1. Convert ADC value to Voltage (ESP32-S3 is 3.3V, 12-bit ADC)
  float voltage = analogValue * (3.3 / 4095.0);

  // 2. Handle edge cases to prevent overflow
  // If voltage is too low (sensor disconnected or no gas)
  if (voltage < 0.1) {
    return 0.0;
  }

  // If voltage is too high (near 3.3V), sensor resistance is near 0
  // This would cause division by zero or very high PPM readings
  if (voltage > 3.2) {
    return 9999.0; // Cap at max displayable value
  }

  // 3. Calculate Sensor Resistance (Rs) using voltage divider formula
  // In Wokwi gas sensor: Vout = VCC * RL / (Rs + RL)
  // Assuming internal load resistor RL ≈ 10kΩ
  const float RL = 10.0; // Load resistance in kOhms
  
  // Rearranging: Rs = RL * (VCC / Vout - 1)
  float sensorResistance = RL * ((3.3 / voltage) - 1.0);

  // 4. Calculate Ratio Rs/R0
  float ratio = sensorResistance / R0;

  // 5. Bounds check on ratio to prevent extreme PPM values
  if (ratio < 0.01) {
    return 9999.0;
  }
  if (ratio > 100.0) {
    return 0.0;
  }

  // 6. Calculate PPM using MQ-7 logarithmic formula
  // PPM = A * (Rs/R0)^B
  // For MQ-7: A ≈ 99.048, B ≈ -1.518
  float ppm = 99.048 * pow(ratio, -1.518);

  // 7. Final bounds check
  if (ppm < 0) ppm = 0;
  if (ppm > 9999.0) ppm = 9999.0;

  return ppm;
}

// MQTT Callback Function to handle incoming commands
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println("\n========== MQTT CALLBACK TRIGGERED ==========");
  Serial.print("[MQTT] Topic: ");
  Serial.println(topic);
  Serial.print("[MQTT] Length: ");
  Serial.println(length);
  
  // Convert payload to string
  char message[length + 1];
  for (unsigned int i = 0; i < length; i++) {
    message[i] = (char)payload[i];
  }
  message[length] = '\0';
  
  Serial.print("[MQTT] Payload: '");
  Serial.print(message);
  Serial.println("'");
  
  // Handle FAN commands
  if (strcmp(message, "FAN_ON") == 0) {
    Serial.println("[CONTROL] >>> Executing FAN_ON command");
    digitalWrite(RELAY_FAN1_PIN, HIGH);
    Serial.print("[CONTROL] >>> RELAY_FAN1_PIN (GPIO ");
    Serial.print(RELAY_FAN1_PIN);
    Serial.println(") set to HIGH");
  } else if (strcmp(message, "FAN_OFF") == 0) {
    Serial.println("[CONTROL] >>> Executing FAN_OFF command");
    digitalWrite(RELAY_FAN1_PIN, LOW);
    Serial.print("[CONTROL] >>> RELAY_FAN1_PIN (GPIO ");
    Serial.print(RELAY_FAN1_PIN);
    Serial.println(") set to LOW");
  }
  // Handle PURIFIER commands
  else if (strcmp(message, "PURIFIER_ON") == 0) {
    Serial.println("[CONTROL] >>> Executing PURIFIER_ON command");
    digitalWrite(RELAY_FAN2_PIN, HIGH);
    Serial.print("[CONTROL] >>> RELAY_FAN2_PIN (GPIO ");
    Serial.print(RELAY_FAN2_PIN);
    Serial.println(") set to HIGH");
  } else if (strcmp(message, "PURIFIER_OFF") == 0) {
    Serial.println("[CONTROL] >>> Executing PURIFIER_OFF command");
    digitalWrite(RELAY_FAN2_PIN, LOW);
    Serial.print("[CONTROL] >>> RELAY_FAN2_PIN (GPIO ");
    Serial.print(RELAY_FAN2_PIN);
    Serial.println(") set to LOW");
  }
  // Handle BUZZER commands (if needed in future)
  else if (strcmp(message, "BUZZER_ON") == 0) {
    Serial.println("[CONTROL] >>> Executing BUZZER_ON command");
    ledcWriteTone(LEDC_CHANNEL, 1000);
    Serial.println("[CONTROL] >>> Buzzer tone set to 1000Hz");
  } else if (strcmp(message, "BUZZER_OFF") == 0) {
    Serial.println("[CONTROL] >>> Executing BUZZER_OFF command");
    ledcWriteTone(LEDC_CHANNEL, 0);
    Serial.println("[CONTROL] >>> Buzzer turned OFF");
  }
  else {
    Serial.print("[CONTROL] !!! UNKNOWN COMMAND: '");
    Serial.print(message);
    Serial.println("'");
  }
  Serial.println("========== CALLBACK COMPLETE ==========\n");
}

// Initialise Function (Flow A)
void init_hardware(){
  Serial.println("[HW] Starting hardware init...");
  
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
  
  // Initialize LEDC for buzzer
  ledcSetup(LEDC_CHANNEL, LEDC_BASE_FREQ, LEDC_RESOLUTION);
  ledcAttachPin(BUZZER_PIN, LEDC_CHANNEL);
  Serial.println("[HW] Pins configured");
  Serial.println("[HW] LEDC configured for buzzer");

  // 2. Initialise I2C and LCDs
  Serial.println("[HW] Starting I2C...");
  Wire.begin(I2C_SDA, I2C_SCL);
  delay(200); // Allow I2C bus to stabilize
  Serial.println("[HW] I2C started on SDA=" + String(I2C_SDA) + ", SCL=" + String(I2C_SCL));
  
  // Scan for I2C devices
  Serial.println("[HW] Scanning I2C bus...");
  for (byte addr = 0x20; addr < 0x30; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("[HW] Found device at 0x");
      Serial.println(addr, HEX);
    }
  }
  
  Serial.println("[HW] Initializing LCD1 (0x27)...");
  lcd1.init(); 
  lcd1.backlight();
  lcd1.clear();
  Serial.println("[HW] LCD1 initialized");
  
  Serial.println("[HW] Initializing LCD2 (0x26)...");
  lcd2.init(); 
  lcd2.backlight();
  lcd2.clear();
  Serial.println("[HW] LCD2 initialized");
  
  lcd1.setCursor(0, 0); lcd1.print("LCD1: Sensors");
  lcd2.setCursor(0, 0); lcd2.print("LCD2: Time/Date");
  Serial.println("[HW] Hardware init complete!");
  
  // 3. Initialise DHT Sensor
  dht.begin();
  delay(2000); // DHT22 needs time to stabilize
  Serial.println("[HW] DHT sensor initialized");
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
  client.setCallback(mqttCallback);  // Set the callback for incoming messages
  
  lcd1.setCursor(0, 2); lcd1.print("MQTT: Connecting...");
  
  // Loop until we're connected
  while (!client.connected()) {
    Serial.print("[MQTT] Attempting connection...");
    
    if (client.connect("ESP32_Room_Monitor")) {
      Serial.println("connected");
      lcd1.setCursor(0, 2); lcd1.print("MQTT: Connected  ");
      
      // Subscribe to control topic
      client.subscribe("ecs/control");
      Serial.println("[MQTT] Subscribed to ecs/control");
      
      // Publish online status
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
  #ifndef BYPASS_NETWORKING
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    lcd2.setCursor(0, 2);
    lcd2.print("Time: Sync Error    ");
    lcd2.setCursor(0, 3);
    lcd2.print("Date: N/A           ");
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
  #else
  lcd2.setCursor(0, 2);
  lcd2.print("Time: N/A           ");
  lcd2.setCursor(0, 3);
  lcd2.print("Date: N/A           ");
  #endif
}

void setup() {
  Serial.begin(115200);

  // Execute Flow A
  init_hardware();
  #ifndef BYPASS_NETWORKING
  init_wifi();
  init_mqtt();
  #endif
  delay(500);
  Serial.println("[SETUP] Network init complete/skipped");

  // Final System Status
  lcd2.clear();
  lcd2.setCursor(0, 0); lcd2.print("System Ready");
  #ifndef BYPASS_NETWORKING
  lcd2.setCursor(0, 1); lcd2.print("IP: "); lcd2.print(WiFi.localIP());
  #else
  lcd2.setCursor(0, 1); lcd2.print("Mode: Offline");
  #endif
  delay(2000);
  lcd1.clear(); lcd2.clear();
  Serial.println("[SETUP] Setup complete, entering loop");
}

void loop() {
  static bool firstRun = true;
  if (firstRun) {
    delay(3000); // Allow all systems to fully stabilize
    Serial.println("[LOOP] First loop iteration starting");
    firstRun = false;
  }
  
  #ifndef BYPASS_NETWORKING
  // Check MQTT connection status
  if (!client.connected()) {
    Serial.println("[LOOP] MQTT disconnected, reconnecting...");
    init_mqtt();
  }
  // CRITICAL: Process incoming MQTT messages
  client.loop();
  #endif

  // 1. Read Sensors
  Serial.println("[LOOP] Reading DHT temperature...");
  float temp = dht.readTemperature();
  Serial.println("[LOOP] Reading DHT humidity...");
  float hum = dht.readHumidity();
  Serial.println("[LOOP] Reading gas sensor...");
  int rawGas = analogRead(MQ7_PIN);
  Serial.println("[LOOP] Sensors read complete");

  // 2. Convert to PPM
  float coPPM = calculatePPM(rawGas);

  if (isnan(temp) || isnan(hum)) {
    Serial.println("[LOOP] Invalid sensor data, skipping");
    return;
  }
  Serial.println("[LOOP] Sensor data valid");

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
    ledcWriteTone(LEDC_CHANNEL, 1000);
    #ifndef BYPASS_NETWORKING
    client.publish("room/alert", "HIGH CO DETECTED!");
    #endif
  } else {
    digitalWrite(RELAY_FAN2_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(LED_GREEN_PIN, HIGH);
    ledcWriteTone(LEDC_CHANNEL, 0);
  }

  // 5. Display Update
  Serial.println("[LOOP] Updating LCD1...");
  // LCD1 (0x27): Sensor Data
  lcd1.setCursor(0, 0); lcd1.print("Temp: "); lcd1.print(temp, 1); lcd1.print("C     ");
  lcd1.setCursor(0, 1); lcd1.print("Hum:  "); lcd1.print(hum, 1); lcd1.print("%     ");
  lcd1.setCursor(0, 2); lcd1.print("CO:   "); lcd1.print(coPPM, 1); lcd1.print(" ppm   ");
  lcd1.setCursor(0, 3); 
  if (gasDanger) {
    lcd1.print("Status: DANGER!     ");
  } else {
    lcd1.print("Status: Safe        ");
  }
  Serial.println("[LOOP] LCD1 updated");
  
  // LCD2 (0x26): Time/Date Display
  Serial.println("[LOOP] Updating LCD2...");
  lcd2.setCursor(0, 0); lcd2.print("System Ready        ");
  display_time();
  Serial.println("[LOOP] LCD2 updated");

  // 6. MQTT Publish
  char tempStr[16], humStr[16], gasStr[16];  // Increased buffer size to prevent overflow
  dtostrf(temp, 1, 2, tempStr);
  dtostrf(hum, 1, 2, humStr);
  dtostrf(min(coPPM, 9999.0f), 1, 2, gasStr); // Cap PPM to prevent buffer overflow

  #ifndef BYPASS_NETWORKING
  // Construct JSON Payload manually to avoid extra dependencies
  String payload = "{\"temperature\":";
  payload += tempStr;
  payload += ",\"humidity\":";
  payload += humStr;
  payload += ",\"co_level\":";
  payload += gasStr;
  payload += "}";
  
  // Publish to 'ecs/upload'
  client.publish("ecs/upload", payload.c_str());
  #endif
  
  Serial.println("[LOOP] Loop iteration complete");
  delay(1000);
}


