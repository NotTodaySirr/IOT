/**
 * @file main.cpp
 * @brief Environmental Control System (ECS) - Main Application
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                    SYSTEM ARCHITECTURE OVERVIEW                             │
 * │                                                                             │
 * │   ┌─────────────────────────────────────────────────────────────────────┐   │
 * │   │                    UPSTREAM FLOW (Data Out)                         │   │
 * │   │   Sensors ──▶ ESP32 Processing ──▶ LCD Display                      │   │
 * │   │                      │                                              │   │
 * │   │                      └──▶ MQTT Publish ──▶ Backend ──▶ Frontend     │   │
 * │   └─────────────────────────────────────────────────────────────────────┘   │
 * │                                                                             │
 * │   ┌─────────────────────────────────────────────────────────────────────┐   │
 * │   │                   DOWNSTREAM FLOW (Commands In)                     │   │
 * │   │   Frontend ──▶ Backend ──▶ MQTT Publish                             │   │
 * │   │                              │                                      │   │
 * │   │                              └──▶ ESP32 Subscribe ──▶ Relay Control │   │
 * │   └─────────────────────────────────────────────────────────────────────┘   │
 * │                                                                             │
 * │   Files:                                                                    │
 * │   - config.h         : Pin definitions, network settings, thresholds       │
 * │   - LCD_I2C_Wire1.h  : Custom LCD class for secondary I2C bus              │
 * │   - upstream_flow.h  : Sensor reading, display, data publishing            │
 * │   - downstream_flow.h: Command reception and relay control                 │
 * │   - main.cpp         : Initialization and main loop orchestration          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

// =============================================================================
// INCLUDES
// =============================================================================
#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <MQUnifiedsensor.h>
#include "time.h"

// Project headers
#include "config.h"
#include "LCD_I2C_Wire1.h"
#include "upstream_flow.h"
#include "downstream_flow.h"

// =============================================================================
// GLOBAL OBJECTS
// =============================================================================

// --- Sensors ---
DHT dht(DHT_PIN, DHT22);

// --- Networking ---
WiFiClient espClient;
PubSubClient client(espClient);

// --- Display ---
LiquidCrystal_I2C lcd1(0x27, 16, 2);  // Primary LCD (Wire bus)
LCD_I2C_Wire1 lcd2(0x27, 16, 2);      // Secondary LCD (Wire1 bus)

// --- MQ7 Gas Sensor ---
MQUnifiedsensor MQ7(BOARD, VOLTAGE_RESOLUTION, ADC_BIT_RESOLUTION, MQ7_PIN, "MQ-7");

// =============================================================================
// GLOBAL STATE VARIABLES
// =============================================================================

// --- Timing Control ---
unsigned long lastSensorRead = 0;
unsigned long lastBlinkTime = 0;
unsigned long statusMessageStartTime = 0;

// --- Display Control ---
int displayPage = 0;

// --- System State ---
bool isGasDanger = false;
bool manualMode = false;
bool manualFan1State = LOW;
bool manualFan2State = LOW;
bool ledBlinkState = false;

float lastTemp = 0;
float lastHum = 0;
float lastCO = 0;

// --- Connection State Tracking (for event-driven LCD2) ---
wl_status_t lastWiFiStatus = WL_IDLE_STATUS;
bool lastMqttConnected = false;

// =============================================================================
// INITIALIZATION FUNCTIONS
// =============================================================================

/**
 * @brief Initialize all hardware components.
 * 
 * Sets up GPIO pins, I2C buses, LCD displays, and sensors.
 */
void init_hardware() {
    // --- GPIO Configuration ---
    pinMode(MQ7_PIN, INPUT);
    pinMode(RELAY_FAN1_PIN, OUTPUT);
    pinMode(RELAY_FAN2_PIN, OUTPUT);
    pinMode(LED_RED_PIN, OUTPUT);
    pinMode(LED_GREEN_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    
    // --- Initial States ---
    digitalWrite(RELAY_FAN1_PIN, LOW);
    digitalWrite(RELAY_FAN2_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(LED_GREEN_PIN, HIGH);
    
    // --- Buzzer PWM ---
    ledcSetup(LEDC_CHANNEL, LEDC_BASE_FREQ, LEDC_RESOLUTION);
    ledcAttachPin(BUZZER_PIN, LEDC_CHANNEL);
    
    // --- I2C Buses ---
    Wire.begin(I2C1_SDA, I2C1_SCL);
    Wire1.begin(I2C2_SDA, I2C2_SCL);
    
    // --- I2C Scanner (Debug) ---
    Serial.println("\n==== I2C Scanner ====");
    Serial.println("Scanning Wire (LCD1)...");
    for (uint8_t addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            Serial.printf("  Found: 0x%02X\n", addr);
        }
    }
    Serial.println("Scanning Wire1 (LCD2)...");
    for (uint8_t addr = 1; addr < 127; addr++) {
        Wire1.beginTransmission(addr);
        if (Wire1.endTransmission() == 0) {
            Serial.printf("  Found: 0x%02X\n", addr);
        }
    }
    Serial.println("====================\n");
    
    // --- LCD Initialization ---
    lcd1.init();
    lcd1.backlight();
    lcd1.setCursor(0, 0);
    lcd1.print("LCD1 OK");
    
    lcd2.init();
    lcd2.backlight();
    lcd2.setCursor(0, 0);
    lcd2.print("LCD2 OK");
    
    // --- DHT22 Initialization ---
    dht.begin();
    
    // --- MQ7 Initialization ---
    Serial.println("\n==== MQ7 Initialization ====");
    MQ7.setRegressionMethod(1);
    MQ7.setA(99.043);
    MQ7.setB(-1.518);
    MQ7.init();
    
    lcd2.setCursor(0, 1);
    lcd2.print("MQ7 Calibrating");
    
    Serial.print("[MQ7] Calibrating");
    float calcR0 = 0;
    for (int i = 1; i <= 10; i++) {
        MQ7.update();
        calcR0 += MQ7.calibrate(RATIO_MQ7_CLEAN_AIR);
        Serial.print(".");
        delay(100);
    }
    MQ7.setR0(calcR0 / 10);
    Serial.printf(" done! R0=%.2f\n", calcR0 / 10);
    Serial.println("============================\n");
}

/**
 * @brief Initialize WiFi connection.
 */
void init_wifi() {
    lcd2.setCursor(0, 1);
    lcd2.print("WiFi...");
    
    Serial.println("\n==== WiFi Initialization ====");
    Serial.printf("[WIFI] Connecting to: %s\n", WIFI_SSID);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.printf("[WIFI] Attempt %d/30\n", ++attempts);
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[WIFI] Connected! IP: %s, MAC: %s\n", 
                      WiFi.localIP().toString().c_str(),
                      WiFi.macAddress().c_str());
        configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    } else {
        Serial.println("[WIFI] Connection failed!");
    }
    Serial.println("=============================\n");
}

/**
 * @brief Initialize MQTT connection.
 * 
 * Uses the downstream flow callback for command reception.
 */
void init_mqtt() {
    Serial.println("\n==== MQTT Initialization ====");
    Serial.printf("[MQTT] Broker: %s:%d\n", MQTT_SERVER, MQTT_PORT);
    
    client.setServer(MQTT_SERVER, MQTT_PORT);
    client.setCallback(mqttCommandCallback);  // DOWNSTREAM: Register callback
    
    String clientId = "ESP32_" + WiFi.macAddress();
    
    int retries = 0;
    while (!client.connected() && retries < 5) {
        Serial.printf("[MQTT] Attempt %d/5\n", ++retries);
        
        if (client.connect(clientId.c_str())) {
            Serial.println("[MQTT] Connected!");
            subscribeToControlTopic();  // DOWNSTREAM: Subscribe to commands
        } else {
            Serial.printf("[MQTT] Failed, rc=%d\n", client.state());
            delay(2000);
        }
    }
    Serial.println("=============================\n");
}

// =============================================================================
// MAIN PROGRAM
// =============================================================================

/**
 * @brief Arduino setup function.
 */
void setup() {
    Serial.begin(115200);
    Serial.println("\n");
    Serial.println("╔═══════════════════════════════════════════════════════╗");
    Serial.println("║     ENVIRONMENTAL CONTROL SYSTEM (ECS) v2.0           ║");
    Serial.println("╚═══════════════════════════════════════════════════════╝\n");
    
    init_hardware();
    
    #ifndef BYPASS_NETWORKING
    init_wifi();
    init_mqtt();
    #endif
    
    displayPage = 0;
    displayStatusOrTime();
    
    Serial.println("[SETUP] Complete!\n");
}

/**
 * @brief Arduino loop function.
 * 
 * Orchestrates both UPSTREAM and DOWNSTREAM flows:
 * 
 * UPSTREAM (executed every SENSOR_READ_INTERVAL):
 *   1. Read sensors
 *   2. Update LCD displays
 *   3. Apply automatic control (if not in manual mode)
 *   4. Update alerts (LED, buzzer)
 *   5. Publish data to MQTT
 * 
 * DOWNSTREAM (event-driven via MQTT callback):
 *   - Commands are processed in mqttCommandCallback()
 *   - Relay states are updated immediately upon receipt
 */
void loop() {
    unsigned long currentMillis = millis();
    
    // =========================================================================
    // DOWNSTREAM: MQTT MESSAGE PROCESSING
    // =========================================================================
    // The client.loop() call checks for incoming MQTT messages.
    // If a message arrives, mqttCommandCallback() is invoked automatically.
    // This is the DOWNSTREAM flow entry point.
    
    #ifndef BYPASS_NETWORKING
    if (!client.connected()) {
        if (WiFi.status() == WL_CONNECTED) {
            String clientId = "ESP32_" + WiFi.macAddress();
            if (client.connect(clientId.c_str())) {
                subscribeToControlTopic();
            }
        }
    }
    client.loop();  // <-- DOWNSTREAM: Check for incoming commands
    #endif
    
    // =========================================================================
    // UPSTREAM: SENSOR READING & DATA PUBLISHING
    // =========================================================================
    // This section handles the UPSTREAM flow:
    //   Sensors → Processing → Display → MQTT Publish → Backend → Frontend
    
    if (currentMillis - lastSensorRead >= SENSOR_READ_INTERVAL) {
        lastSensorRead = currentMillis;
        
        // --- UPSTREAM: Read Sensors ---
        float temp, hum, co;
        if (readAllSensors(temp, hum, co)) {
            lastTemp = temp;
            lastHum = hum;
            lastCO = co;
            
            // Evaluate conditions
            bool highTemp = (temp > TEMP_HIGH_THRESHOLD);
            isGasDanger = (co > CO_DANGER_THRESHOLD);
            
            // --- DOWNSTREAM: Automatic Control (if not manual) ---
            // This bridges UPSTREAM sensor data with DOWNSTREAM relay control
            applyAutomaticControl(highTemp, isGasDanger);
            
            // --- UPSTREAM: Update Displays ---
            displaySensorData();
            
            // --- UPSTREAM: Update Alerts ---
            updateLEDIndicators(isGasDanger || highTemp);
            updateBuzzerAlarm(isGasDanger);
            
            if (isGasDanger) {
                publishAlert("HIGH CO DETECTED!");
            }
            
            // --- UPSTREAM: Publish to Backend ---
            publishSensorData();
        }
    }
    
    // =========================================================================
    // UPSTREAM: LCD2 DISPLAY LOGIC (Event-Driven)
    // =========================================================================
    // Rule 1: If WiFi is offline, always show status page.
    // Rule 2: If WiFi is online, show status briefly on state changes, then show time.
    
    #ifndef BYPASS_NETWORKING
    wl_status_t currentWiFiStatus = WiFi.status();
    bool currentMqttConnected = client.connected();
    
    // LCD2 refresh interval (500ms) to prevent overwhelming the display
    static unsigned long lastLcd2Update = 0;
    const unsigned long LCD2_REFRESH_INTERVAL = 500;
    
    // Detect state changes
    bool stateChanged = (currentWiFiStatus != lastWiFiStatus) || 
                        (currentMqttConnected != lastMqttConnected);
    
    if (stateChanged) {
        lastWiFiStatus = currentWiFiStatus;
        lastMqttConnected = currentMqttConnected;
        displayPage = 0;  // Show status page
        statusMessageStartTime = currentMillis;
        displayStatusOrTime();
        lastLcd2Update = currentMillis;
    } else if (currentWiFiStatus != WL_CONNECTED) {
        // WiFi offline: persistently show status (throttled)
        displayPage = 0;
        if (currentMillis - lastLcd2Update >= LCD2_REFRESH_INTERVAL) {
            lastLcd2Update = currentMillis;
            displayStatusOrTime();
        }
    } else {
        // WiFi online: check if status alert duration expired
        if (displayPage == 0 && (currentMillis - statusMessageStartTime >= STATUS_ALERT_DURATION)) {
            displayPage = 1;  // Switch to time page
        }
        
        // Update display at refresh interval
        if (currentMillis - lastLcd2Update >= (displayPage == 1 ? 1000 : LCD2_REFRESH_INTERVAL)) {
            lastLcd2Update = currentMillis;
            displayStatusOrTime();
        }
    }
    #else
    // Offline mode: just show time
    static unsigned long lastClockUpdate = 0;
    if (currentMillis - lastClockUpdate > 1000) {
        lastClockUpdate = currentMillis;
        displayPage = 1;
        displayStatusOrTime();
    }
    #endif
    
    // =========================================================================
    // UPSTREAM: LED BLINKING (Danger Alert)
    // =========================================================================
    if (isGasDanger || lastTemp > TEMP_HIGH_THRESHOLD) {
        if (currentMillis - lastBlinkTime >= LED_BLINK_INTERVAL) {
            lastBlinkTime = currentMillis;
            ledBlinkState = !ledBlinkState;
            digitalWrite(LED_RED_PIN, ledBlinkState ? HIGH : LOW);
        }
    }
}




