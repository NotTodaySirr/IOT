"""
User model for authentication (future use).
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from models.database import Base


class User(Base):
    """Model for user accounts."""
    
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    sensor_readings = relationship("SensorData", back_populates="user")
    
    def to_dict(self):
        """Convert model instance to dictionary (excluding password)."""
        return {
            'id': self.id,
            'username': self.username
        }
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username})>"
