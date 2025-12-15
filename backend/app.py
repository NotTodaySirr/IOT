"""
Main application entry point for the ECS Backend.
Initializes Flask server, Supabase connection, and MQTT client.
"""

import os
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
    
    # Create and configure Flask app first
    print("\n[2/3] Starting Flask server...")
    app = create_app()
    
    # Initialize MQTT
    # Only run in the reloader child process (or if not using reloader/debug)
    # This prevents running two MQTT clients (one in parent, one in child) when debug=True
    mqtt_handler = get_mqtt_handler()
    
    if not Config.DEBUG or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        print("\n[3/3] Initializing MQTT client...")
        mqtt_handler.connect()
        mqtt_handler.start_loop()
        # Give MQTT handler access to Flask app context
        mqtt_handler.app = app
    else:
        print("\n[3/3] Skipping MQTT init in reloader parent process")
    
    print("\n" + "=" * 60)
    print(f"✓ Server running on http://localhost:{Config.PORT}")
    print(f"✓ Environment: {Config.FLASK_ENV}")
    
    if not config_valid:
        print("\n⚠️  WARNING: Some configuration is missing!")
        print("   The server is running but may not function correctly.")
        print("   Please check your .env file.")
    
    # Run the Flask app
    try:
        app.run(
            host='0.0.0.0',
            port=Config.PORT,
            debug=Config.DEBUG
        )
    except KeyboardInterrupt:
        print("\n\nShutting down gracefully...")
        # Only stop if it was started
        if not Config.DEBUG or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
            mqtt_handler.stop_loop()
        close_db()
        print("✓ Server stopped")


if __name__ == '__main__':
    main()
