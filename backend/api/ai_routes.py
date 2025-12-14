"""
AI Routes.

Provides endpoints for AI-based analysis and predictions.
"""

from flask import jsonify, request
from api import ai_bp
from services.ai_prediction_service import AIPredictionService
from api.middleware import require_auth

@ai_bp.route('/predict', methods=['POST'])
@require_auth
def predict():
    """
    Generate a prediction using the AI service.
    
    Request Body (JSON):
        {
            "data": <input_data>
        }
    
    Returns:
        JSON response with the prediction result.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400
            
        # Validate required fields
        required_fields = ['temperature_C', 'humidity_%', 'CO_ppm', 'action']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
             return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
             
        # Call the AI Service
        result = AIPredictionService.prediction(data)
        
        if result.get('status') == 'error':
             return jsonify(result), 500
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
