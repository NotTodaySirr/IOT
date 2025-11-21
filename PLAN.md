# Smart Room Environment Monitor - Project Plan

## 1. Project Overview
**Name:** Smart Room Environment Monitor ("Vintage Terminal" Edition)  
**Goal:** Create an IoT monitoring system with a nostalgic 1980s/90s industrial aesthetic.  
**Core Functionality:** Monitor environmental data (Temp, Humidity, CO) and control physical actuators (Fan, Heater, Buzzer).  
**Architecture:**  
- **Frontend:** React.js (Web Dashboard)
- **Backend:** Python Flask (API & MQTT Handler)
- **Database:** Supabase (PostgreSQL)
- **Hardware:** ESP32 (Sensors & Relays)
- **Protocol:** MQTT for real-time communication

---

## 2. Project Structure
The codebase is organized to separate concerns, allowing the "Prototype" phase to evolve into the "Production" phase seamlessly.

```text
/smart-room-iot
├── /frontend                   # React Application
│   ├── /src
│   │   ├── /components         # Reusable UI (LCD, 3D Buttons, Layout)
│   │   ├── /mock               # MOCK DATA & SIMULATORS (Prototype only)
│   │   │   ├── dataGenerator.js # Simulates sensor streams
│   │   │   └── mockApi.js       # Simulates backend responses
│   │   ├── /services           # Real API & MQTT services (Future)
│   │   ├── /views              # Page Views (Dashboard, Archives, Terminal)
│   │   ├── /styles             # Global styles & Tailwind config
│   │   └── App.jsx             # Main Router
│   └── package.json
│
├── /backend                    # Python Flask Server
│   ├── app.py                  # Application Entry Point
│   ├── config.py               # Env variables (DB keys, MQTT broker)
│   ├── /api                    # REST Routes (Blueprints)
│   ├── /models                 # Database Models (Supabase interaction)
│   ├── /mqtt                   # MQTT Client Logic (Paho-MQTT)
│   └── /services               # Business Logic
│
├── /ai_service                 # AI Logic (Anomaly Detection & Chatbot)
│   ├── anomaly_detector.py     # Logic for thresholds/predictions
│   └── chatbot_llm.py          # Interface for LLM (e.g., OpenAI/Local)
│
├── /firmware                   # ESP32 Hardware Code
│   ├── main.ino                # Main Arduino Sketch
│   ├── config.h                # WiFi & MQTT Credentials
│   └── sensor_logic.h          # Sensor reading abstraction
│
└── README.md                   # Documentation
```

---

## 3. Phase 1: The Prototype (Current Focus)
The goal is to build the **Frontend** completely, powered by the `src/mock` folder. The Backend and Firmware folders will be scaffolded but empty or minimal.

### 3.1 Frontend (React)
**Key Components:**
1.  **Layout/Shell:**
    *   Global container with "Vintage Hardware" styling (Beige background, distinct borders).
    *   **Mode Switcher:** Navigation tabs for Dashboard, Archives, Terminal.
2.  **Dashboard Mode:**
    *   **LCD Displays:** 3 widgets showing real-time numbers (Font: IBM Plex Mono).
    *   **3D Actuators:** CSS-heavy buttons for Fan/Heater/Buzzer (using the specific CSS provided).
    *   **Status Panel:** LED indicator for "System Normal" or "Warning".
3.  **Archives Mode:**
    *   **Chart:** Line chart visualizing historical mock data (using `recharts`).
    *   **Log Table:** List of recent events.
4.  **Terminal Mode:**
    *   **CLI Interface:** Black screen, green text, typing animation.
    *   **Chat Simulation:** Simple `if/else` logic to respond to commands like "HELP" or "STATUS".

### 3.2 Data Strategy (Mocking)
Instead of fetching from Flask, we will use a custom hook: `useSensorData()`.
*   **Prototype Behavior:** Inside `src/mock/dataGenerator.js`, `setInterval` will emit a new random reading every 2 seconds.
*   **Future Behavior:** We will swap `dataGenerator.js` with `mqttService.js` which subscribes to real topics.

---

## 4. Phase 2: Integration (Future Steps)
Once the UI is approved, we "plug in" the real logic.

### 4.1 Backend (Flask)
*   **API:** Expose endpoints like `/api/history` to fetch data from Supabase.
*   **MQTT Handler:** A background thread using `paho-mqtt` to listen to `iot/sensors`.
*   **Data Storage:** On receiving an MQTT message -> Validate -> Insert into Supabase.

### 4.2 Database (Supabase)
*   **Table: `sensor_logs`** (id, timestamp, temperature, humidity, co_level).
*   **Table: `device_logs`** (id, timestamp, device_name, action, status).

### 4.3 Firmware (ESP32)
*   **`main.ino`:** 
    *   Connects to WiFi & Broker.
    *   Reads DHT11/MQ-7 sensors.
    *   Publishes JSON: `{"temp": 24.5, "humidity": 60, "co": 12}`.
    *   Subscribes to `iot/control` to toggle Relays.

---

## 5. Implementation Roadmap for Today
1.  **Setup Workspace:** Create folders and initialize `package.json` for frontend.
2.  **Styling Foundation:** Configure Tailwind/CSS for the "Vintage" color palette and fonts.
3.  **Component Construction:** Build the `ActuatorButton` and `LCDDisplay`.
4.  **Mock Engine:** Implement `src/mock/dataGenerator.js` to drive the UI.
5.  **View Assembly:** Stitch components into the 3 main Views (Dashboard, Archives, Terminal).

