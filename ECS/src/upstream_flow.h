/**
 * @file upstream_flow.h
 * @brief UPSTREAM DATA FLOW: Hardware → Backend → Frontend
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                        UPSTREAM DATA FLOW                               │
 * │                                                                         │
 * │   ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────────────┐     │
 * │   │ SENSORS │───▶│  ESP32  │───▶│  MQTT    │───▶│  Backend/     │     │
 * │   │ DHT22   │    │ Process │    │  Publish │    │  Frontend       │     │
 * │   │ MQ7     │    │ + LCD   │    │          │    │                 │     │
 * │   └─────────┘    └─────────┘    └──────────┘    └─────────────────┘     │
 * │                                                                         │
 * │   This module handles:                                                  │
 * │   1. Reading sensor data (temperature, humidity, CO level)              │
 * │   2. Displaying data on LCD screens                                     │
 * │   3. Publishing sensor data to MQTT broker                              │
 * │   4. Triggering automatic alerts based on sensor thresholds             │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

#ifndef UPSTREAM_FLOW_H
#define UPSTREAM_FLOW_H

#include <Arduino.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <MQUnifiedsensor.h>
#include <LiquidCrystal_I2C.h>
#include "config.h"
#include "LCD_I2C_Wire1.h"

// =============================================================================
// EXTERNAL DEPENDENCIES (defined in main.cpp)
// =============================================================================
extern DHT dht;
extern PubSubClient client;
extern LiquidCrystal_I2C lcd1;
extern LCD_I2C_Wire1 lcd2;
extern MQUnifiedsensor MQ7;

// Shared state variables
extern float lastTemp, lastHum, lastCO;
extern bool isGasDanger;
extern bool manualMode;
extern int displayPage;

// =============================================================================
// UPSTREAM FLOW: SENSOR READING
// =============================================================================

/**
 * @brief Read CO level from MQ7 sensor.
 * 
 * FLOW: MQ7 Sensor → ADC → MQUnifiedsensor Library → PPM Value
 * 
 * The MQ7 sensor outputs an analog voltage proportional to CO concentration.
 * The library converts this to PPM using a calibrated regression formula.
 * 
 * @return float CO level in parts per million (0-9999 ppm)
 */
inline float readCOLevel() {
    MQ7.update();                    // Sample ADC and update internal values
    float ppm = MQ7.readSensor();    // Calculate PPM: ppm = A * (Rs/R0)^B
    
    Serial.printf("[UPSTREAM] MQ7 CO Level: %.2f ppm\n", ppm);
    
    // Validate reading
    if (isnan(ppm) || isinf(ppm)) {
        Serial.println("[UPSTREAM] Warning: Invalid MQ7 reading");
        return 0;
    }
    
    // Clamp to valid range
    return constrain(ppm, 0, 9999.0);
}

/**
 * @brief Read all sensors and update global state.
 * 
 * FLOW: DHT22 + MQ7 → Read Values → Update Global Variables
 * 
 * @param[out] temp Temperature in Celsius
 * @param[out] hum Humidity in percentage
 * @param[out] co CO level in PPM
 * @return true if readings are valid, false otherwise
 */
inline bool readAllSensors(float& temp, float& hum, float& co) {
    temp = dht.readTemperature();
    hum = dht.readHumidity();
    co = readCOLevel();
    
    if (isnan(temp) || isnan(hum)) {
        Serial.println("[UPSTREAM] Error: DHT22 read failed");
        return false;
    }
    
    Serial.printf("[UPSTREAM] Sensors: T=%.1f°C, H=%.1f%%, CO=%.2f ppm\n", 
                  temp, hum, co);
    return true;
}

// =============================================================================
// UPSTREAM FLOW: LCD DISPLAY
// =============================================================================

/**
 * @brief Update LCD1 with current sensor readings.
 * 
 * FLOW: Sensor Values → Format String → LCD1 Display
 * 
 * Display format:
 *   Line 1: T:XX.XC H:XX.X%
 *   Line 2: CO:XXXX.Xppm
 */
inline void displaySensorData() {
    lcd1.setCursor(0, 0);
    lcd1.print("T:"); 
    lcd1.print(lastTemp, 1); 
    lcd1.print("C H:"); 
    lcd1.print(lastHum, 1); 
    lcd1.print("%");
    
    lcd1.setCursor(0, 1);
    lcd1.print("CO:"); 
    lcd1.print(lastCO, 1); 
    lcd1.print("ppm      ");
}

/**
 * @brief Update LCD2 with status or time information.
 * 
 * FLOW: System State / NTP Time → Format → LCD2 Display
 * 
 * Page 0: System status + WiFi status
 * Page 1: Current time and date
 */
inline void displayStatusOrTime() {
    lcd2.clear();
    
    if (displayPage == 0) {
        // STATUS PAGE
        lcd2.setCursor(0, 0);
        if (isGasDanger) {
            lcd2.print("!! DANGER !!");
        } else if (lastTemp > TEMP_HIGH_THRESHOLD) {
            lcd2.print("TEMP HIGH!");
        } else {
            lcd2.print("Status: OK");
        }
        
        lcd2.setCursor(0, 1);
        #ifndef BYPASS_NETWORKING
        lcd2.print(WiFi.status() == WL_CONNECTED ? "WiFi: Connected" : "WiFi: Offline");
        #else
        lcd2.print("Offline Mode");
        #endif
    } else {
        // TIME PAGE
        struct tm timeinfo;
        if (!getLocalTime(&timeinfo)) {
            lcd2.setCursor(0, 0);
            lcd2.print("Time Error");
            return;
        }
        lcd2.setCursor(4, 0);
        lcd2.printf("%02d:%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
        lcd2.setCursor(3, 1);
        lcd2.printf("%02d/%02d/%04d", timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900);
    }
}

// =============================================================================
// UPSTREAM FLOW: MQTT PUBLISH
// =============================================================================

/**
 * @brief Publish sensor data to MQTT broker.
 * 
 * FLOW: Sensor Values → JSON Payload → MQTT Publish → Backend
 * 
 * Topic: "ecs/upload"
 * Payload: {"device_id":"XX:XX:XX:XX:XX:XX","temperature":XX.XX,"humidity":XX.XX,"co_level":XX.XX}
 * 
 * The backend receives this data, stores it in the database, and forwards
 * it to connected frontend clients via Server-Sent Events (SSE).
 */
inline void publishSensorData() {
    #ifndef BYPASS_NETWORKING
    if (!client.connected()) return;
    
    // Format values as strings
    char tempStr[16], humStr[16], gasStr[16];
    dtostrf(lastTemp, 1, 2, tempStr);
    dtostrf(lastHum, 1, 2, humStr);
    dtostrf(min(lastCO, 9999.0f), 1, 2, gasStr);
    
    // Build JSON payload
    String payload = "{\"device_id\":\"" + WiFi.macAddress() + 
                    "\",\"temperature\":" + tempStr +
                    ",\"humidity\":" + humStr + 
                    ",\"co_level\":" + gasStr + "}";
    
    // Publish to upload topic
    client.publish(MQTT_TOPIC_UPLOAD, payload.c_str());
    Serial.printf("[UPSTREAM] Published: %s\n", payload.c_str());
    #endif
}

/**
 * @brief Publish alert message when danger is detected.
 * 
 * FLOW: Danger Condition → Alert Message → MQTT Publish → Backend
 * 
 * Topic: "room/alert"
 */
inline void publishAlert(const char* message) {
    #ifndef BYPASS_NETWORKING
    if (client.connected()) {
        client.publish(MQTT_TOPIC_ALERT, message);
        Serial.printf("[UPSTREAM] Alert published: %s\n", message);
    }
    #endif
}

// =============================================================================
// UPSTREAM FLOW: AUTOMATIC ALERTS
// =============================================================================

/**
 * @brief Update LED indicators based on system state.
 * 
 * FLOW: Sensor Thresholds → LED State
 * 
 * Normal: Green LED solid ON, Red LED OFF
 * Danger: Green LED OFF, Red LED blinks (handled separately)
 */
inline void updateLEDIndicators(bool isDanger) {
    if (isDanger) {
        digitalWrite(LED_GREEN_PIN, LOW);   // Turn off green
        // Red LED blinking is handled in main loop
    } else {
        digitalWrite(LED_RED_PIN, LOW);     // Turn off red
        digitalWrite(LED_GREEN_PIN, HIGH);  // Solid green
    }
}

/**
 * @brief Control buzzer alarm based on gas danger.
 * 
 * FLOW: CO Threshold Exceeded → Buzzer ON (1kHz tone)
 */
inline void updateBuzzerAlarm(bool gasDanger) {
    if (gasDanger) {
        ledcWriteTone(LEDC_CHANNEL, 1000);  // 1kHz alarm tone
    } else {
        ledcWriteTone(LEDC_CHANNEL, 0);     // Silence
    }
}

#endif // UPSTREAM_FLOW_H
