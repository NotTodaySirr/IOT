import pytest
from tests.schemas import AIResponse, ErrorResponse

def test_predict_success(client, mock_ai_service):
    """Test AI prediction endpoint success."""
    # Mock AI service response
    mock_ai_service.predict.return_value = {
        "status": "success",
        "message": "Prediction generated",
        "prediction": {"result": "ok"}
    }
    
    payload = {"data": "test input"}
    response = client.post('/api/ai/predict', json=payload)
    
    assert response.status_code == 200
    AIResponse(**response.json)
    
    mock_ai_service.predict.assert_called_with(payload)

def test_predict_no_data(client):
    """Test AI prediction with missing data."""
    response = client.post('/api/ai/predict', json={})
    # Note: The current implementation checks `if not data`, but `request.get_json()` might return {} if body is empty JSON object.
    # However, if body is empty string, get_json() returns None (or raises error depending on silent=True).
    # Let's assume we send empty dict, if the code checks `if not data` it might pass if data is empty dict (truthy? no, empty dict is falsy).
    # Let's check the code: `data = request.get_json()`. If we send `{}`, `data` is `{}`. `if not data:` is True.
    
    # Wait, `if not data` is true for empty dict.
    
    assert response.status_code == 400
    ErrorResponse(**response.json)
