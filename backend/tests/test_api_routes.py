import pytest
from tests.schemas import HealthResponse, HistoryResponse, CurrentReadingResponse, ControlResponse, ErrorResponse

def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    
    # Validate schema
    HealthResponse(**response.json)

def test_get_history_success(client, mock_db_session):
    """Test retrieving history successfully."""
    # Mock database response
    mock_record = MagicMock()
    mock_record.to_dict.return_value = {
        'id': 1,
        'user_id': None,
        'recorded_at': '2023-01-01T12:00:00',
        'temperature': 25.0,
        'humidity': 50.0,
        'co_level': 5
    }
    
    # Configure mock session to return list of records
    mock_db_session.query.return_value.order_by.return_value.limit.return_value.all.return_value = [mock_record]
    
    response = client.get('/api/history?limit=10')
    assert response.status_code == 200
    
    # Validate schema
    HistoryResponse(**response.json)
    
    # Verify DB was queried correctly
    mock_db_session.query.assert_called()

def test_get_history_invalid_limit(client):
    """Test retrieving history with invalid limit."""
    response = client.get('/api/history?limit=0')
    assert response.status_code == 400
    
    # Validate error schema
    ErrorResponse(**response.json)

def test_get_current_readings_success(client, mock_db_session):
    """Test retrieving current readings successfully."""
    # Mock database response
    mock_record = MagicMock()
    mock_record.to_dict.return_value = {
        'id': 1,
        'user_id': None,
        'recorded_at': '2023-01-01T12:00:00',
        'temperature': 25.0,
        'humidity': 50.0,
        'co_level': 5
    }
    
    mock_db_session.query.return_value.order_by.return_value.first.return_value = mock_record
    
    response = client.get('/api/current')
    assert response.status_code == 200
    
    # Validate schema
    CurrentReadingResponse(**response.json)

def test_get_current_readings_not_found(client, mock_db_session):
    """Test retrieving current readings when no data exists."""
    mock_db_session.query.return_value.order_by.return_value.first.return_value = None
    
    response = client.get('/api/current')
    assert response.status_code == 404
    
    ErrorResponse(**response.json)

def test_control_device_success(client, mock_mqtt):
    """Test controlling a device successfully."""
    payload = {
        'device': 'fan',
        'action': 'on'
    }
    
    response = client.post('/api/control', json=payload)
    assert response.status_code == 200
    
    # Validate schema
    ControlResponse(**response.json)
    
    # Verify MQTT publish was called
    mock_mqtt.publish_control_command.assert_called_with('FAN_ON')

def test_control_device_invalid_input(client):
    """Test controlling a device with invalid input."""
    payload = {
        'device': 'invalid_device',
        'action': 'on'
    }
    
    response = client.post('/api/control', json=payload)
    assert response.status_code == 400
    
    ErrorResponse(**response.json)

from unittest.mock import MagicMock
