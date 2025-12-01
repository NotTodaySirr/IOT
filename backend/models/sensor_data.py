"""
SensorData model for storing environmental sensor readings.
"""

from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from models.database import Base


class SensorData(Base):
    """Model for sensor data readings."""
    
    __tablename__ = 'sensor_data'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    co_level = Column(Float, nullable=False)
    is_hazardous = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="sensor_readings")
    
    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'temperature': self.temperature,
            'humidity': self.humidity,
            'co_level': self.co_level,
            'is_hazardous': self.is_hazardous
        }
    
    def __repr__(self):
        return f"<SensorData(id={self.id}, temp={self.temperature}°C, hum={self.humidity}%, co={self.co_level})>"
