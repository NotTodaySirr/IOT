"""
MQTT Client for handling real-time communication with ESP32 hardware.
Subscribes to sensor data uploads and publishes control commands.
"""

import json
import paho.mqtt.client as mqtt
from config import Config
from models import get_db, SensorData


class MQTTHandler:
    """Manages MQTT connection and message handling."""
    
    def __init__(self):
        self.client = mqtt.Client(client_id=Config.MQTT_CLIENT_ID)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        
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
        Process sensor data from ESP32 and save to database.
        
        Expected JSON format:
        {
            "temperature": 24.5,
            "humidity": 60.0,
            "co_level": 12.5
        }
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
            
            # Determine if CO level is hazardous (threshold: 50 ppm)
            CO_THRESHOLD = 50.0
            is_hazardous = co_level > CO_THRESHOLD
            
            # Save to database using SQLAlchemy
            db = get_db()
            sensor_reading = SensorData(
                temperature=temperature,
                humidity=humidity,
                co_level=co_level,
                is_hazardous=is_hazardous
            )
            db.add(sensor_reading)
            db.commit()
            
            print(f"✓ Inserted sensor data: Temp={temperature}°C, Hum={humidity}%, CO={co_level}")
                
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
