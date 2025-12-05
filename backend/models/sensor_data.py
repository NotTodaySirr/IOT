"""
SensorData model for storing environmental sensor readings.
"""

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, func, DECIMAL, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from models.database import Base


class SensorData(Base):
    """Model for sensor data readings."""
    
    __tablename__ = 'sensor_data'
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    
    temperature = Column(DECIMAL(5, 2), nullable=False)
    humidity = Column(DECIMAL(5, 2), nullable=False)
    co_level = Column(Integer, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'id': self.id,
            'user_id': str(self.user_id) if self.user_id else None,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None,
            'temperature': float(self.temperature),
            'humidity': float(self.humidity),
            'co_level': self.co_level
        }
    
    def __repr__(self):
        return f"<SensorData(id={self.id}, temp={self.temperature}, hum={self.humidity}, co={self.co_level})>"
