"""
Main application entry point for the ECS Backend.
Initializes Flask server, Supabase connection, and MQTT client.
"""

from flask import Flask
from flask_cors import CORS
from config import Config
from models import init_db, close_db
from mqtt.client import get_mqtt_handler
def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for all routes
    CORS(app)
    
    # Register blueprints
    from api import sensor_bp, ai_bp
    app.register_blueprint(sensor_bp)
    app.register_blueprint(ai_bp)
    
    # Initialize Database and Migrations
    init_db(app)
    from flask_migrate import Migrate
    from models.database import db
    Migrate(app, db)
    
    return app


def main():
    """Main function to start the application."""
    print("=" * 60)
    print("   Environment Control System (ECS) - Backend Server")
    print("=" * 60)
    
    # Validate configuration
    config_valid = Config.validate()
    
    # Initialize MQTT
    print("\n[2/3] Initializing MQTT client...")
    mqtt_handler = get_mqtt_handler()
    mqtt_handler.connect()
    mqtt_handler.start_loop()
    
    # Create and configure Flask app
    print("\n[3/3] Starting Flask server...")
    app = create_app()
    
    # Give MQTT handler access to Flask app context for database operations
    mqtt_handler.app = app
    
    print("\n" + "=" * 60)
    print(f"✓ Server running on http://localhost:{Config.PORT}")
    print(f"✓ Environment: {Config.FLASK_ENV}")
    
    if not config_valid:
        print("\n⚠️  WARNING: Some configuration is missing!")
        print("   The server is running but may not function correctly.")
        print("   Please check your .env file.")
    
    print("\n📡 Available endpoints:")
    print(f"   GET  http://localhost:{Config.PORT}/health")
    print(f"   GET  http://localhost:{Config.PORT}/current")
    print(f"   GET  http://localhost:{Config.PORT}/history")
    print(f"   POST http://localhost:{Config.PORT}/control")
    print(f"   POST http://localhost:{Config.PORT}/ai/predict")
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
