/**
 * @file downstream_flow.h
 * @brief DOWNSTREAM COMMAND FLOW: Frontend → Backend → Hardware
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                       DOWNSTREAM COMMAND FLOW                           │
 * │                                                                         │
 * │   ┌─────────────────┐    ┌──────────┐    ┌─────────┐    ┌───────────┐  │
 * │   │  Frontend       │───▶│  Backend │───▶│  MQTT   │───▶│  ESP32    │  │
 * │   │  (User clicks   │    │  API     │    │  Publish│    │  Callback │  │
 * │   │   button)       │    │          │    │         │    │           │  │
 * │   └─────────────────┘    └──────────┘    └─────────┘    └─────┬─────┘  │
 * │                                                               │        │
 * │                                                               ▼        │
 * │                                                         ┌───────────┐  │
 * │                                                         │  RELAYS   │  │
 * │                                                         │  Fan1     │  │
 * │                                                         │  Fan2     │  │
 * │                                                         └───────────┘  │
 * │                                                                         │
 * │   This module handles:                                                  │
 * │   1. Receiving commands via MQTT subscription                           │
 * │   2. Parsing command messages                                           │
 * │   3. Controlling relay outputs (fans)                                   │
 * │   4. Managing manual vs automatic control modes                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

#ifndef DOWNSTREAM_FLOW_H
#define DOWNSTREAM_FLOW_H

#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include "config.h"

// =============================================================================
// EXTERNAL DEPENDENCIES (defined in main.cpp)
// =============================================================================
extern PubSubClient client;
extern bool manualMode;
extern bool manualFan1State;
extern bool manualFan2State;

// =============================================================================
// DOWNSTREAM FLOW: COMMAND DEFINITIONS
// =============================================================================

/**
 * Command Protocol:
 * 
 * Topic: ecs/control/{DEVICE_MAC_ADDRESS}
 * 
 * Commands:
 *   "FAN_ON"       - Turn on AC Fan (Fan1), enter manual mode
 *   "FAN_OFF"      - Turn off AC Fan (Fan1), stay in manual mode
 *   "PURIFIER_ON"  - Turn on Air Purifier (Fan2), enter manual mode
 *   "PURIFIER_OFF" - Turn off Air Purifier (Fan2), stay in manual mode
 *   "AUTO_MODE"    - Return to automatic control based on sensors
 */

// =============================================================================
// DOWNSTREAM FLOW: RELAY CONTROL
// =============================================================================

/**
 * @brief Set the state of Fan 1 (AC Fan).
 * 
 * FLOW: Command → Relay GPIO → Fan Power
 * 
 * @param state true = ON, false = OFF
 */
inline void setFan1(bool state) {
    digitalWrite(RELAY_FAN1_PIN, state ? HIGH : LOW);
    Serial.printf("[DOWNSTREAM] Fan1 (AC Fan): %s\n", state ? "ON" : "OFF");
}

/**
 * @brief Set the state of Fan 2 (Air Purifier).
 * 
 * FLOW: Command → Relay GPIO → Purifier Power
 * 
 * @param state true = ON, false = OFF
 */
inline void setFan2(bool state) {
    digitalWrite(RELAY_FAN2_PIN, state ? HIGH : LOW);
    Serial.printf("[DOWNSTREAM] Fan2 (Purifier): %s\n", state ? "ON" : "OFF");
}

/**
 * @brief Apply automatic control based on sensor readings.
 * 
 * FLOW: Sensor Thresholds → Decision → Relay Control
 * 
 * This is called only when NOT in manual mode.
 * 
 * @param highTemp true if temperature exceeds threshold
 * @param highCO true if CO level exceeds threshold
 */
inline void applyAutomaticControl(bool highTemp, bool highCO) {
    if (manualMode) return;  // Skip if in manual mode
    
    // AC Fan: ON when temperature is high
    setFan1(highTemp);
    
    // Air Purifier: ON when CO is high
    setFan2(highCO);
    
    Serial.printf("[DOWNSTREAM] Auto control: Fan1=%s, Fan2=%s\n",
                  highTemp ? "ON" : "OFF", highCO ? "ON" : "OFF");
}

// =============================================================================
// DOWNSTREAM FLOW: COMMAND PROCESSING
// =============================================================================

/**
 * @brief Process a received command string.
 * 
 * FLOW: MQTT Message → Parse → Execute → Update State
 * 
 * @param command The command string to process
 */
inline void processCommand(const char* command) {
    Serial.printf("[DOWNSTREAM] Processing command: %s\n", command);
    
    // --- Fan 1 (AC Fan) Commands ---
    if (strcmp(command, "FAN_ON") == 0) {
        manualMode = true;
        manualFan1State = HIGH;
        setFan1(true);
    }
    else if (strcmp(command, "FAN_OFF") == 0) {
        manualMode = true;
        manualFan1State = LOW;
        setFan1(false);
    }
    // --- Fan 2 (Air Purifier) Commands ---
    else if (strcmp(command, "PURIFIER_ON") == 0) {
        manualMode = true;
        manualFan2State = HIGH;
        setFan2(true);
    }
    else if (strcmp(command, "PURIFIER_OFF") == 0) {
        manualMode = true;
        manualFan2State = LOW;
        setFan2(false);
    }
    // --- Mode Commands ---
    else if (strcmp(command, "AUTO_MODE") == 0) {
        manualMode = false;
        Serial.println("[DOWNSTREAM] Switched to AUTO mode");
    }
    // --- Unknown Command ---
    else {
        Serial.printf("[DOWNSTREAM] Unknown command: %s\n", command);
        return;
    }
    
    // Log current state
    Serial.printf("[DOWNSTREAM] State: ManualMode=%s, Fan1=%s, Fan2=%s\n",
                  manualMode ? "YES" : "NO",
                  manualFan1State ? "ON" : "OFF",
                  manualFan2State ? "ON" : "OFF");
}

// =============================================================================
// DOWNSTREAM FLOW: MQTT CALLBACK
// =============================================================================

/**
 * @brief MQTT callback function for incoming messages.
 * 
 * FLOW: MQTT Broker → PubSubClient → This Callback → processCommand()
 * 
 * This function is registered with the MQTT client and called automatically
 * when a message arrives on a subscribed topic.
 * 
 * @param topic The topic the message was received on
 * @param payload The message payload bytes
 * @param length Length of the payload
 */
inline void mqttCommandCallback(char* topic, byte* payload, unsigned int length) {
    // Convert payload to null-terminated string
    char message[length + 1];
    memcpy(message, payload, length);
    message[length] = '\0';
    
    Serial.println("\n╔════════════════════════════════════════╗");
    Serial.println("║     DOWNSTREAM: COMMAND RECEIVED       ║");
    Serial.println("╠════════════════════════════════════════╣");
    Serial.printf("║ Topic: %-31s║\n", topic);
    Serial.printf("║ Command: %-29s║\n", message);
    Serial.printf("║ Length: %-30d║\n", length);
    Serial.println("╚════════════════════════════════════════╝\n");
    
    // Process the command
    processCommand(message);
}

// =============================================================================
// DOWNSTREAM FLOW: MQTT SUBSCRIPTION
// =============================================================================

/**
 * @brief Subscribe to the device-specific control topic.
 * 
 * FLOW: Device MAC → Topic String → MQTT Subscribe
 * 
 * Topic format: ecs/control/{MAC_ADDRESS}
 * Example: ecs/control/AA:BB:CC:DD:EE:FF
 * 
 * @return true if subscription successful
 */
inline bool subscribeToControlTopic() {
    #ifndef BYPASS_NETWORKING
    String controlTopic = String(MQTT_TOPIC_CONTROL) + WiFi.macAddress();
    
    if (client.subscribe(controlTopic.c_str())) {
        Serial.printf("[DOWNSTREAM] Subscribed to: %s\n", controlTopic.c_str());
        return true;
    } else {
        Serial.println("[DOWNSTREAM] Failed to subscribe to control topic");
        return false;
    }
    #endif
    return false;
}



#endif // DOWNSTREAM_FLOW_H
