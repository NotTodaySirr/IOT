"""
Configuration module for the ECS Backend.
Loads environment variables and provides configuration classes.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration class."""
    
    # Flask Configuration
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    PORT = int(os.getenv('FLASK_PORT', 5000))
    
    # Database Configuration
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/ecs_db')
    
    # Supabase Configuration
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    
    # MQTT Configuration
    MQTT_BROKER = os.getenv('MQTT_BROKER', 'broker.hivemq.com')
    MQTT_PORT = int(os.getenv('MQTT_PORT', 1883))
    MQTT_USERNAME = os.getenv('MQTT_USERNAME', '')
    MQTT_PASSWORD = os.getenv('MQTT_PASSWORD', '')
    MQTT_CLIENT_ID = os.getenv('MQTT_CLIENT_ID', 'ecs_backend_client')
    
    # MQTT Topics
    MQTT_TOPIC_UPLOAD = os.getenv('MQTT_TOPIC_UPLOAD', 'ecs/upload')
    MQTT_TOPIC_CONTROL = os.getenv('MQTT_TOPIC_CONTROL', 'ecs/control')
    MQTT_TOPIC_STATUS = os.getenv('MQTT_TOPIC_STATUS', 'ecs/status')
    
    @staticmethod
    def validate():
        """Validate that required configuration is present."""
        if not os.getenv('DATABASE_URL'):
            print("⚠️  Warning: DATABASE_URL not set. Using default: postgresql://postgres:postgres@localhost:5432/ecs_db")
            print("   For production, set DATABASE_URL in your .env file.")
            return False
            
        if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_KEY'):
            print("⚠️  Warning: SUPABASE_URL or SUPABASE_KEY not set.")
            print("   Authentication will not work correctly.")
            return False
            
        return True
