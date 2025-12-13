# Software Technical Specification: Environment Control System (E.C.S.)

**Project:** E.C.S. (Environment Control System)
**Architecture Style:** IoT (MQTT + Cloud Database)
**Design Language:** Vintage Hardware / Retro Industrial
**Based on Proposal Dated:** November 20, 2025

---

## 1. Software Architecture & Data Flow

The system uses a hybrid architecture where monitoring is database-driven, but control is direct via MQTT.

### 1.1 Monitoring Flow (Sensor $\to$ Cloud)
**Responsible:** Hà Thư Hoàng (Firmware) & Võ Minh Tuấn (Backend)
* [cite_start]**Step 1 (Edge):** ESP32 collects Temp/Humidity (DHT22) and CO (MQ-7) data[cite: 114].
* [cite_start]**Step 2 (Transport):** ESP32 packages data into JSON and publishes to **MQTT Broker**[cite: 116].
* [cite_start]**Step 3 (Ingestion):** A Backend Server subscribes to the MQTT topic, receives the JSON, and saves it to the **Cloud Database**[cite: 116].
* [cite_start]**Step 4 (Presentation):** The Website queries the **Database** (not MQTT) to update the Dashboard Charts and Virtual LCD Widgets[cite: 117].

### 1.2 Control Flow (Web $\to$ Actuator)
**Responsible:** Võ Minh Tuấn (Web) & Hà Thư Hoàng (Firmware)
* [cite_start]**Step 1 (Interaction):** User clicks "Fan AC" or "Purifier" on the Web Dashboard[cite: 120].
* [cite_start]**Step 2 (Command):** The Website publishes a command (ON/OFF) directly to the **MQTT Broker**[cite: 121].
* [cite_start]**Step 3 (Execution):** ESP32 receives the command via MQTT and triggers the Relay[cite: 122].
* [cite_start]**Step 4 (Feedback):** ESP32 publishes the new status back to the Web to update the UI buttons (ACK)[cite: 123].

#### Frontend → Hardware Command Path (Fans & Buzzer)
* **Step A:** The Dashboard buttons (Fan/Purifier/Buzzer) call the backend `POST /control` endpoint with `{ device: 'fan' | 'purifier' | 'buzzer', action: 'on' | 'off' }`.
* **Step B:** The backend translates the request into MQTT commands (`FAN_ON` / `FAN_OFF`, `PURIFIER_ON` / `PURIFIER_OFF`, `BUZZER_ON` / `BUZZER_OFF`) and publishes them to the `ecs/control` topic.
* **Step C:** The ESP32 firmware listens on `ecs/control`; in `mqttCallback` it maps the commands to GPIO: `RELAY_FAN1_PIN` / `RELAY_FAN2_PIN` drive the two fan relays, while `BUZZER_PIN` uses `ledcWriteTone` to start/stop the buzzer.
* **Step D:** After executing the command, the ESP32 can publish a status payload on `ecs/status` so the web UI LEDs stay in sync with the physical relays and buzzer.

---

## 2. Infrastructure & Database Specification

### 2.1 Database Schema (Cloud DB)
[cite_start]**Owner:** Võ Minh Tuấn [cite: 190]
The system requires storage for user accounts and sensor logs.

[cite_start]**Table: `SensorData`** (Stores telemetry for Charts/History) [cite: 116, 174]
* `id` (Primary Key)
* [cite_start]`timestamp` (DateTime) - Critical for the "Environmental Trends" chart[cite: 105].
* `temperature` (Float) - From DHT22.
* `humidity` (Float) - From DHT22.
* `co_level` (Float) - From MQ-7.
* `is_hazardous` (Boolean) - Derived from CO threshold logic.

[cite_start]**Table: `Users`** (Security) [cite: 177]
* `username` (String)
* [cite_start]`password_hash` (String) - For authentication[cite: 81].

### 2.2 MQTT Topic Map
**Protocol:** MQTT
The following topics must be defined in the Firmware and Web code:

| Topic | Publisher | Subscriber | Payload Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ecs/upload` | ESP32 | Backend Server | JSON | [cite_start]Sensor readings to be saved to DB[cite: 116]. |
| `ecs/control` | Website | ESP32 | String/JSON | [cite_start]Commands (e.g., `FAN_ON`)[cite: 121]. |
| `ecs/status` | ESP32 | Website | JSON | [cite_start]Device status feedback (ACK)[cite: 123]. |

---

## 3. Feature Specifications (Software)

### 3.1 Firmware (ESP32) 

[Image of ESP32 pinout diagram]

[cite_start]**Developer:** Hà Thư Hoàng [cite: 189]
* [cite_start]**Main Loop:** Read sensors $\to$ Update Local LCD 2 $\to$ Check CO Threshold $\to$ Publish to MQTT[cite: 129, 140].
* [cite_start]**Safety Logic:** If CO > Threshold $\to$ Trigger Buzzer immediately (Hard real-time requirement)[cite: 133, 137].
* [cite_start]**Time Sync:** LCD 1 must display real-time clock synced via Internet (NTP)[cite: 115].

### 3.2 Web Application (Dashboard)
[cite_start]**Developer:** Võ Minh Tuấn [cite: 190]
* [cite_start]**Stack:** Custom website (No NodeRED allowed)[cite: 178].
* [cite_start]**UI Style:** "Vintage Hardware" / Retro 90s aesthetic[cite: 38].
* **Key Views:**
    * [cite_start]**Login Page:** Authentication required[cite: 83].
    * [cite_start]**Dashboard:** Displays "Sensor Readings" (LCD style) and "Manual Override" (Switches)[cite: 91].
    * [cite_start]**Charts:** Line charts showing Temp/Hum/CO trends over time[cite: 95].
* [cite_start]**AI Chatbot UI:** A terminal-like interface for typing commands/questions[cite: 108].

### 3.3 Advanced Functions (AI & Backend)
[cite_start]**Developer:** Hà Thư Hoàng [cite: 189]
* [cite_start]**Anomaly Detection:** Use AI to analyze data for "Abnormalities" (e.g., Toxic gas, Overheating)[cite: 49].
* [cite_start]**Chatbot Logic:** Generative text responses to user queries about system status[cite: 176].

---

## 4. Development Roadmap (Software)

* **Week 7 (Nov 17 - 23):**
    * [cite_start][Tuấn] UI/UX Design on Figma (Vintage Style)[cite: 188].
* **Week 8 (Nov 24 - 30):**
    * [cite_start][Hoàng] Write ESP32 Firmware & Train AI Models[cite: 189].
    * [cite_start][Tuấn] Code Frontend/Backend & Setup Database[cite: 190].
* **Week 9 (Dec 01 - 07):**
    * [cite_start][Both] Integrate Firmware with Web via MQTT[cite: 191].
* **Week 10 (Dec 08 - 14):**
    * [cite_start][Hoàng] Unit Testing (Software modules)[cite: 192].
    * [cite_start][Tuấn] Bug fixing[cite: 192].
