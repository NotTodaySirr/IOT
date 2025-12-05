"""
API Routes for the ECS Backend.
Provides endpoints for sensor data retrieval and device control.
"""

from flask import jsonify, request
from api import sensor_bp
from models import get_db, SensorData
from mqtt.client import get_mqtt_handler
from api.middleware import require_auth


@sensor_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'ECS Backend API',
        'version': '1.0.0'
    }), 200


@sensor_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    """
    Retrieve historical sensor data.
    
    Query Parameters:
        limit (int): Maximum number of records to retrieve (default: 100)
    
    Returns:
        JSON array of sensor data records
    """
    db = None
    try:
        limit = request.args.get('limit', 100, type=int)
        
        # Validate limit
        if limit < 1 or limit > 1000:
            return jsonify({'error': 'Limit must be between 1 and 1000'}), 400
        
        # Query database using SQLAlchemy
        db = get_db()
        sensor_data = db.query(SensorData).order_by(SensorData.recorded_at.desc()).limit(limit).all()
        
        # Convert to dictionaries
        data = [record.to_dict() for record in sensor_data]
        
        return jsonify({
            'success': True,
            'count': len(data),
            'data': data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if db:
            db.close()


@sensor_bp.route('/control', methods=['POST'])
@require_auth
def control_device():
    """
    Send control commands to ESP32 devices via MQTT.
    
    Request Body (JSON):
        {
            "device": "fan" | "heater" | "purifier",
            "action": "on" | "off"
        }
    
    Returns:
        Success confirmation
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400
        
        device = data.get('device', '').lower()
        action = data.get('action', '').lower()
        
        # Validate input
        valid_devices = ['fan', 'heater', 'purifier']
        valid_actions = ['on', 'off']
        
        if device not in valid_devices:
            return jsonify({'error': f'Invalid device. Must be one of: {", ".join(valid_devices)}'}), 400
        
        if action not in valid_actions:
            return jsonify({'error': f'Invalid action. Must be one of: {", ".join(valid_actions)}'}), 400
        
        # Build MQTT command
        command = f"{device.upper()}_{action.upper()}"
        
        # Publish to MQTT
        mqtt_handler = get_mqtt_handler()
        mqtt_handler.publish_control_command(command)
        
        return jsonify({
            'success': True,
            'message': f'Command sent: {command}',
            'device': device,
            'action': action
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sensor_bp.route('/current', methods=['GET'])
@require_auth
def get_current_readings():
    """
    Get the most recent sensor readings.
    
    Returns:
        Latest sensor data record
    """
    db = None
    try:
        db = get_db()
        latest = db.query(SensorData).order_by(SensorData.recorded_at.desc()).first()
        
        if latest is None:
            return jsonify({'error': 'No sensor data available'}), 404
        
        return jsonify({
            'success': True,
            'data': latest.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if db:
            db.close()
