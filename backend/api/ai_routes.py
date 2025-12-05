"""
AI Routes.

Provides endpoints for AI-based analysis and predictions.
"""

from flask import jsonify, request
from api import ai_bp
from services.ai_service import AIService
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
            
        # Call the AI Service
        result = AIService.predict(data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
