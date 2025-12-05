"""
AI Routes.

Provides endpoints for AI-based analysis and predictions.
"""

from flask import jsonify, request
from api import api_bp
from services.ai_service import AIService

@api_bp.route('/ai/predict', methods=['POST'])
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
