"""
SQLAlchemy database setup and session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from config import Config

# Create base class for declarative models
Base = declarative_base()

# Create database engine
engine = None
SessionLocal = None


def init_db():
    """Initialize database connection and create tables."""
    global engine, SessionLocal
    
    try:
        # Create engine with connection pooling
        engine = create_engine(
            Config.DATABASE_URL,
            pool_pre_ping=True,  # Verify connections before using
            pool_size=5,
            max_overflow=10
        )
        
        # Create session factory
        SessionLocal = scoped_session(
            sessionmaker(autocommit=False, autoflush=False, bind=engine)
        )
        
        # Import models to register them with Base
        from models.sensor_data import SensorData
        from models.user import User
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✓ Database initialized successfully")
        return True
        
    except Exception as e:
        print(f"✗ Failed to initialize database: {e}")
        return False


def get_db():
    """
    Get a database session.
    
    Usage:
        db = get_db()
        try:
            # Your database operations
            db.commit()
        except:
            db.rollback()
            raise
        finally:
            db.close()
    """
    if SessionLocal is None:
        init_db()
    return SessionLocal()


def close_db():
    """Close database connection."""
    if SessionLocal:
        SessionLocal.remove()
    if engine:
        engine.dispose()
    print("✓ Database connection closed")
