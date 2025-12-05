"""
DeviceState model for storing the state of user devices.
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from models.database import Base


class DeviceState(Base):
    """Model for device states."""
    
    __tablename__ = 'device_states'
    
    device_id = Column(String(50), primary_key=True)
    user_id = Column(UUID(as_uuid=True), primary_key=True)
    is_active = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'device_id': self.device_id,
            'user_id': str(self.user_id),
            'is_active': self.is_active,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f"<DeviceState(user={self.user_id}, device={self.device_id}, active={self.is_active})>"
