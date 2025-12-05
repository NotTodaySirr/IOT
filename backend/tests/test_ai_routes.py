import pytest
from tests.schemas import AIResponse, ErrorResponse

# Auth header for tests
AUTH_HEADER = {'Authorization': 'Bearer test_token'}

def test_predict_success(client, mock_ai_service):
    """Test AI prediction endpoint success."""
    # Mock AI service response
    mock_ai_service.predict.return_value = {
        "status": "success",
        "message": "Prediction generated",
        "prediction": {"result": "ok"}
    }
    
    payload = {"data": "test input"}
    response = client.post('/ai/predict', json=payload, headers=AUTH_HEADER)
    
    assert response.status_code == 200
    AIResponse(**response.json)
    
    mock_ai_service.predict.assert_called_with(payload)

def test_predict_unauthorized(client):
    """Test AI prediction without token."""
    payload = {"data": "test input"}
    response = client.post('/ai/predict', json=payload)
    assert response.status_code == 401

def test_predict_no_data(client):
    """Test AI prediction with missing data."""
    response = client.post('/ai/predict', json={}, headers=AUTH_HEADER)
    assert response.status_code == 400
    ErrorResponse(**response.json)
