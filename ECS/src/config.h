/**
 * @file config.h
 * @brief Configuration file containing all pin definitions, network settings,
 *        and hardware constants for the Environmental Control System (ECS).
 * 
 * This file centralizes all configurable parameters to make hardware changes
 * easier and keep the main code clean.
 */

#ifndef CONFIG_H
#define CONFIG_H

// =============================================================================
// NETWORKING CONFIGURATION
// =============================================================================
// Uncomment the following line to bypass networking (for offline testing)
// #define BYPASS_NETWORKING

// WiFi Credentials
const char* WIFI_SSID     = "Wokwi-GUEST";         // Your WiFi network name
const char* WIFI_PASSWORD = "";      // Your WiFi password

// MQTT Broker Configuration
const char* MQTT_SERVER   = "broker.hivemq.com"; // Public MQTT broker
const int   MQTT_PORT     = 1883;                // Standard MQTT port

// MQTT Topic Definitions
const char* MQTT_TOPIC_UPLOAD  = "ecs/upload";      // Sensor data publishing
const char* MQTT_TOPIC_ALERT   = "room/alert";      // Alert messages
const char* MQTT_TOPIC_CONTROL = "ecs/control/";    // Control commands (append MAC)

// =============================================================================
// TIME CONFIGURATION (NTP)
// =============================================================================
const char* ntpServer = "pool.ntp.org";     // NTP server for time sync
const long  gmtOffset_sec = 25200;          // GMT+7 (7 hours * 3600 seconds)
const int   daylightOffset_sec = 0;         // No daylight saving time

// =============================================================================
// MQ7 GAS SENSOR CONFIGURATION
// =============================================================================
#define BOARD "ESP-32"
#define VOLTAGE_RESOLUTION 5.0    // MQ7 operates at 5V heater voltage
#define ADC_BIT_RESOLUTION 12     // ESP32 uses 12-bit ADC (0-4095)
#define RATIO_MQ7_CLEAN_AIR 27.5  // Rs/R0 ratio in clean air (from datasheet)

// =============================================================================
// GPIO PIN DEFINITIONS
// =============================================================================

// --- Sensor Pins ---
#define DHT_PIN         13        // DHT22 Temperature & Humidity sensor
#define MQ7_PIN         10        // MQ7 CO Gas sensor (analog input)

// --- Relay Pins (Active High) ---
#define RELAY_FAN1_PIN  38        // AC Fan relay control
#define RELAY_FAN2_PIN  39        // Air Purifier relay control

// --- LED Indicator Pins ---
#define LED_RED_PIN     15        // Red LED (danger indicator)
#define LED_GREEN_PIN   16        // Green LED (normal status)

// --- Buzzer Pin ---
#define BUZZER_PIN      5         // Piezo buzzer for alarm

// =============================================================================
// BUZZER LEDC CONFIGURATION
// =============================================================================
#define LEDC_CHANNEL    0         // LEDC channel for PWM buzzer
#define LEDC_RESOLUTION 8         // 8-bit resolution (0-255)
#define LEDC_BASE_FREQ  2000      // Base frequency 2kHz

// =============================================================================
// I2C BUS PIN DEFINITIONS
// =============================================================================
// ESP32-S3 supports multiple I2C buses
// Wire  (I2C Bus 0) - LCD1
#define I2C1_SDA        8         // I2C Bus 1 SDA pin
#define I2C1_SCL        9         // I2C Bus 1 SCL pin

// Wire1 (I2C Bus 1) - LCD2
#define I2C2_SDA        3         // I2C Bus 2 SDA pin
#define I2C2_SCL        4         // I2C Bus 2 SCL pin

// =============================================================================
// TIMING INTERVALS (milliseconds)
// =============================================================================
const long SENSOR_READ_INTERVAL = 2000;     // Read sensors every 2 seconds
const long STATUS_ALERT_DURATION = 5000;    // Show status page for 5s after state change
const long LED_BLINK_INTERVAL = 250;        // Blink LED every 250ms during danger

// =============================================================================
// THRESHOLD VALUES
// =============================================================================
const float TEMP_HIGH_THRESHOLD = 35.0;     // Temperature threshold for fan activation (°C)
const float CO_DANGER_THRESHOLD = 50.0;     // CO level threshold for danger alert (ppm)

#endif // CONFIG_H
