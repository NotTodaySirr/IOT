"""
SQLAlchemy database setup and session management using Flask-SQLAlchemy.
"""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
  pass

db = SQLAlchemy(model_class=Base)

def init_db(app):
    """Initialize database with Flask app."""
    db.init_app(app)
    
    # Import models to register them with SQLAlchemy
    from models.sensor_data import SensorData
    from models.device_state import DeviceState
    
    with app.app_context():
        # Create tables for development (migrations will handle this in production)
        # db.create_all() 
        pass

def get_db():
    """
    Get the database session.
    In Flask-SQLAlchemy, this is just db.session.
    """
    return db.session

def close_db(e=None):
    """
    Close database connection.
    Flask-SQLAlchemy handles this automatically at the end of the request.
    """
    # db.session.remove() is handled by Flask-SQLAlchemy
    pass
