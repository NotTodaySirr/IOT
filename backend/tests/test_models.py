import pytest
from datetime import datetime
from models.sensor_data import SensorData
from models.device_state import DeviceState

def test_sensor_data_model():
    """Test SensorData model creation and serialization."""
    now = datetime.now()
    sensor_data = SensorData(
        id=1,
        user_id=None,
        temperature=25.5,
        humidity=60.0,
        co_level=10,
        recorded_at=now
    )
    
    data_dict = sensor_data.to_dict()
    
    assert data_dict['id'] == 1
    assert data_dict['temperature'] == 25.5
    assert data_dict['humidity'] == 60.0
    assert data_dict['co_level'] == 10
    assert data_dict['recorded_at'] == now.isoformat()

def test_device_state_model():
    """Test DeviceState model creation and serialization."""
    now = datetime.now()
    device_state = DeviceState(
        device_id="fan",
        user_id=None,
        is_active=True,
        updated_at=now
    )
    
    data_dict = device_state.to_dict()
    
    assert data_dict['device_id'] == "fan"
    assert data_dict['is_active'] is True
    assert data_dict['updated_at'] == now.isoformat()
