"""
MQTT Client for handling real-time communication with ESP32 hardware.
Subscribes to sensor data uploads and publishes control commands.
"""

import json
import threading
import random
from datetime import datetime
import paho.mqtt.client as mqtt
from config import Config
from models import get_db, SensorData


class MQTTHandler:
    """Manages MQTT connection and message handling."""
    
    def __init__(self):
        # Append random suffix to avoid conflicts on public broker
        client_id = f"{Config.MQTT_CLIENT_ID}_{random.randint(1000, 9999)}"
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id=client_id)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        
        # State for Throttling & Streaming
        self.last_save_time = datetime.min # Force immediate first save
        self.latest_reading = None # Store latest parsed data for valid streams
        self.new_data_event = threading.Event() # Event to signal SSE threads
        self.app = None # Flask app instance for app context
        
        # Set username and password if provided
        if Config.MQTT_USERNAME and Config.MQTT_PASSWORD:
            self.client.username_pw_set(Config.MQTT_USERNAME, Config.MQTT_PASSWORD)
    
    def on_connect(self, client, userdata, flags, rc):
        """Callback when client connects to MQTT broker."""
        if rc == 0:
            print(f"✓ Connected to MQTT broker: {Config.MQTT_BROKER}:{Config.MQTT_PORT}")
            # Subscribe to the upload topic to receive sensor data from ESP32
            client.subscribe(Config.MQTT_TOPIC_UPLOAD)
            print(f"✓ Subscribed to topic: {Config.MQTT_TOPIC_UPLOAD}")
        else:
            print(f"✗ Failed to connect to MQTT broker. Return code: {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """Callback when client disconnects from MQTT broker."""
        if rc != 0:
            print(f"⚠️  Unexpected MQTT disconnection. Return code: {rc}")
        else:
            print("MQTT client disconnected")
    
    def on_message(self, client, userdata, msg):
        """
        Callback when a message is received from MQTT broker.
        Processes sensor data and saves it to the database.
        """
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')
            
            print(f"📩 Received message on topic '{topic}': {payload}")
            
            # Handle sensor data upload from ESP32
            if topic == Config.MQTT_TOPIC_UPLOAD:
                self.handle_sensor_upload(payload)
            
        except Exception as e:
            print(f"✗ Error processing MQTT message: {e}")
    
    def handle_sensor_upload(self, payload: str):
        """
        Process sensor data from ESP32.
        
        Strategy:
        1. STREAM: Always broadcast to SSE listeners (for real-time dashboard).
        2. STORE: Save to DB only if:
           - CO level is hazardous (> 50 ppm) [High Frequency Logging]
           - OR it has been > 60 seconds since last save [Normal Logging]
        """
        db = None
        try:
            data = json.loads(payload)
            
            temperature = data.get('temperature')
            humidity = data.get('humidity')
            co_level = data.get('co_level')
            
            # Validate data
            if temperature is None or humidity is None or co_level is None:
                print("⚠️  Incomplete sensor data received")
                return
            
            # --- 1. PREPARE DATA ---
            # Determine if CO level is hazardous (threshold: 50 ppm)
            CO_THRESHOLD = 50.0
            is_hazardous = co_level > CO_THRESHOLD
            
            current_time = datetime.now()
            
            # Notify listeners (SSE) - Store latest data for streaming
            self.latest_reading = {
                'temperature': temperature,
                'humidity': humidity,
                'co_level': co_level,
                'is_hazardous': is_hazardous,
                'timestamp': current_time.isoformat()
            }
            self.new_data_event.set() # Wake up waiting threads
            # Note: Don't clear immediately - let waiting threads consume it first
            
            # --- 2. THRoTTLING LOGIC ---
            should_save = False
            
            # Save if hazardous (High Frequency Mode)
            if is_hazardous:
                should_save = True
                print(f"⚠️  HAZARD DETECTED (CO={co_level}) - Saving immediately")
                
            # OR Save if minute passed (Normal Mode)
            elif (current_time - self.last_save_time).total_seconds() >= 60:
                should_save = True
                
            # --- 3. DATABASE SAVE ---
            if should_save:
                if self.app:
                    with self.app.app_context():
                        db = get_db()
                        sensor_reading = SensorData(
                            temperature=temperature,
                            humidity=humidity,
                            co_level=co_level
                            # Note: is_hazardous is not in the DB model, only used for streaming
                        )
                        db.add(sensor_reading)
                        db.commit()
                        db.close()
                        
                        self.last_save_time = current_time
                        print(f"✓ Saved to DB: Temp={temperature}, Hum={humidity}, CO={co_level}")
                else:
                    print("⚠️  No Flask app context available, skipping database save")
            else:
                # print(f"» Streamed only (Skipped DB)") # Optional: Comment out to reduce noise
                pass
                
        except json.JSONDecodeError as e:
            print(f"✗ Invalid JSON in sensor data: {e}")
            if db:
                db.rollback()
        except Exception as e:
            print(f"✗ Error handling sensor upload: {e}")
            if db:
                db.rollback()
        finally:
            if db:
                db.close()
    
    def publish_control_command(self, command: str):
        """
        Publish a control command to the ESP32.
        
        Args:
            command: Command string (e.g., "FAN_ON", "FAN_OFF")
        """
        try:
            self.client.publish(Config.MQTT_TOPIC_CONTROL, command)
            print(f"📤 Published control command: {command}")
        except Exception as e:
            print(f"✗ Failed to publish control command: {e}")
    
    def connect(self):
        """Connect to the MQTT broker."""
        try:
            self.client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, keepalive=60)
            print(f"Connecting to MQTT broker {Config.MQTT_BROKER}:{Config.MQTT_PORT}...")
        except Exception as e:
            print(f"✗ Failed to connect to MQTT broker: {e}")
    
    def start_loop(self):
        """Start the MQTT client loop in a background thread."""
        self.client.loop_start()
        print("✓ MQTT client loop started")
    
    def stop_loop(self):
        """Stop the MQTT client loop."""
        self.client.loop_stop()
        self.client.disconnect()
        print("MQTT client stopped")


# Global MQTT handler instance
mqtt_handler = None

def get_mqtt_handler():
    """Get or create the global MQTT handler instance."""
    global mqtt_handler
    if mqtt_handler is None:
        mqtt_handler = MQTTHandler()
    return mqtt_handler
