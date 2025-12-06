import time
import json
import random
import os
import sys
from datetime import datetime

# Add the current directory to sys.path to ensure we can find local modules if needed, 
# though for this script we primarily rely on installed packages.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import paho.mqtt.client as mqtt
    from dotenv import load_dotenv
except ImportError:
    print("Error: Missing dependencies. Please run 'pip install paho-mqtt python-dotenv'")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Configuration
BROKER = os.getenv('MQTT_BROKER', 'broker.hivemq.com')
PORT = int(os.getenv('MQTT_PORT', 1883))
TOPIC = os.getenv('MQTT_TOPIC_UPLOAD', 'ecs/upload')
USERNAME = os.getenv('MQTT_USERNAME', '')
PASSWORD = os.getenv('MQTT_PASSWORD', '')

def generate_sensor_data():
    """Generates random sensor data simulating an environment."""
    
    # Base values
    temp_base = 24.0
    humid_base = 55.0
    co_base = 5
    
    # Add random jitter
    temp = temp_base + random.uniform(-2.0, 5.0)
    humidity = humid_base + random.uniform(-5.0, 10.0)
    
    # Occasional CO spike simulation
    if random.random() > 0.9:
        co_level = random.randint(30, 80) # Dangerous levels
    else:
        co_level = co_base + random.randint(0, 10)
        
    return {
        "temperature": round(temp, 1),
        "humidity": round(humidity, 1),
        "co_level": co_level,
        "timestamp": datetime.now().isoformat()
    }

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✓ Connected to MQTT Broker ({BROKER}:{PORT})")
    else:
        print(f"✗ Connection failed. Return code: {rc}")

def main():
    print(f"--- ECS Hardware Simulator ---")
    print(f"Target Broker: {BROKER}:{PORT}")
    print(f"Target Topic:  {TOPIC}")
    print(f"------------------------------")
    
    client_id = f"ecs_hardware_simulator_{random.randint(1000, 9999)}"
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id=client_id)
    
    if USERNAME and PASSWORD:
        client.username_pw_set(USERNAME, PASSWORD)
        
    client.on_connect = on_connect
    
    try:
        client.connect(BROKER, PORT, 60)
        client.loop_start()
    except Exception as e:
        print(f"Error connecting to broker: {e}")
        return

    try:
        while True:
            data = generate_sensor_data()
            payload = json.dumps(data)
            
            client.publish(TOPIC, payload)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 📤 Sent: {payload}")
            
            # Sleep for 2 seconds (simulate frequency)
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\nStopping simulator...")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
