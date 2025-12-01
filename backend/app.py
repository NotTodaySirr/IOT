"""
Main application entry point for the ECS Backend.
Initializes Flask server, Supabase connection, and MQTT client.
"""

from flask import Flask
from flask_cors import CORS
from config import Config
from models import init_db, close_db
from mqtt.client import get_mqtt_handler
from api import api_bp


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(api_bp)
    
    return app


def main():
    """Main function to start the application."""
    print("=" * 60)
    print("   Environment Control System (ECS) - Backend Server")
    print("=" * 60)
    
    # Validate configuration
    config_valid = Config.validate()
    
    # Initialize Database
    print("\n[1/3] Initializing database connection...")
    init_db()
    
    # Initialize MQTT
    print("\n[2/3] Initializing MQTT client...")
    mqtt_handler = get_mqtt_handler()
    mqtt_handler.connect()
    mqtt_handler.start_loop()
    
    # Create and configure Flask app
    print("\n[3/3] Starting Flask server...")
    app = create_app()
    
    print("\n" + "=" * 60)
    print(f"✓ Server running on http://localhost:{Config.PORT}")
    print(f"✓ Environment: {Config.FLASK_ENV}")
    
    if not config_valid:
        print("\n⚠️  WARNING: Some configuration is missing!")
        print("   The server is running but may not function correctly.")
        print("   Please check your .env file.")
    
    print("\n📡 Available endpoints:")
    print(f"   GET  http://localhost:{Config.PORT}/api/health")
    print(f"   GET  http://localhost:{Config.PORT}/api/current")
    print(f"   GET  http://localhost:{Config.PORT}/api/history")
    print(f"   POST http://localhost:{Config.PORT}/api/control")
    print("=" * 60 + "\n")
    
    # Run the Flask app
    try:
        app.run(
            host='0.0.0.0',
            port=Config.PORT,
            debug=Config.DEBUG
        )
    except KeyboardInterrupt:
        print("\n\nShutting down gracefully...")
        mqtt_handler.stop_loop()
        close_db()
        print("✓ Server stopped")


if __name__ == '__main__':
    main()
