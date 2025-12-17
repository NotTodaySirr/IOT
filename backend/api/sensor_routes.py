"""
API Routes for the ECS Backend.
Provides endpoints for sensor data retrieval and device control.
"""

from flask import jsonify, request, Response, stream_with_context
from api import sensor_bp
from models import get_db, SensorData, DeviceState
from mqtt.client import get_mqtt_handler
from api.middleware import require_auth
import json
import time


@sensor_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'ECS Backend API',
        'version': '1.0.0'
    }), 200


@sensor_bp.route('/stream', methods=['GET'])
@require_auth
def stream_readings():
    """
    Server-Sent Events (SSE) endpoint for real-time sensor updates.
    Yields data immediately when available from MQTT handler.
    
    Authentication required - only streams data from user's registered devices.
    """
    from flask import g
    
    # Get user's registered device IDs (query once at connection start)
    user_id = g.user.get('id')
    db = get_db()
    try:
        user_devices = db.query(DeviceState.device_id).filter(
            DeviceState.user_id == user_id,
            DeviceState.is_active == True
        ).all()
        my_device_ids = {d.device_id for d in user_devices}
    finally:
        db.close()
    
    mqtt_handler = get_mqtt_handler()
    
    def generate():
        last_data = None
        while True:
            # Wait for new data with a timeout (so we can send keep-alives)
            event_occurred = mqtt_handler.new_data_event.wait(timeout=5.0)
            
            if event_occurred and mqtt_handler.latest_reading:
                current_data = mqtt_handler.latest_reading
                # Clear event after reading so we can wait for next one
                mqtt_handler.new_data_event.clear()
                
                # Filter: only send data from user's registered devices
                data_device_id = current_data.get('device_id')
                if data_device_id not in my_device_ids:
                    continue  # Skip data from other users' devices
                
                # Only yield if data has changed
                if current_data != last_data:
                    data = json.dumps(current_data)
                    yield f"data: {data}\n\n"
                    last_data = current_data
            else:
                # Send a keep-alive comment to prevent connection timeout
                yield ": keep-alive\n\n"
                
    response = Response(stream_with_context(generate()), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'
    response.headers['Connection'] = 'keep-alive'
    return response


@sensor_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    """
    Retrieve historical sensor data for the authenticated user.
    
    Query Parameters:
        page (int): Page number for pagination
        per_page (int): Items per page (default: 20)
        limit (int): Max records (if no page provided)
        start (iso_str): Start date
        end (iso_str): End date
    """
    from flask import g
    
    db = None
    try:
        page = request.args.get('page', type=int)
        per_page = request.args.get('per_page', 20, type=int)
        limit = request.args.get('limit', 100, type=int)
        
        start = request.args.get('start')
        end = request.args.get('end')
        
        db = get_db()
        query = db.query(SensorData)
        
        # Filter by authenticated user's data only
        user_id = g.user.get('id')
        query = query.filter(SensorData.user_id == user_id)
        
        # Apply Date Filtering
        if start:
            query = query.filter(SensorData.recorded_at >= start)
        if end:
            query = query.filter(SensorData.recorded_at <= end)
            
        # Order by newest first
        query = query.order_by(SensorData.recorded_at.desc())
        
        response_data = {}
        
        if page:
            # PAGINATION MODE (For Tables)
            pagination = query.paginate(page=page, per_page=per_page, error_out=False)
            data = [record.to_dict() for record in pagination.items]
            response_data = {
                'success': True,
                'data': data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': pagination.total,
                    'pages': pagination.pages
                }
            }
        else:
            # LIMIT MODE (For Charts)
            sensor_data = query.limit(limit).all()
            data = [record.to_dict() for record in sensor_data]
            response_data = {
                'success': True,
                'count': len(data),
                'data': data
            }
        
        return jsonify(response_data), 200
        
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
            "device": "fan" | "purifier",
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
        device_id = data.get('device_id')  # Extract device_id
        
        # Validate input
        valid_devices = ['fan', 'purifier']
        valid_actions = ['on', 'off']
        
        if device not in valid_devices:
            return jsonify({'error': f'Invalid device. Must be one of: {", ".join(valid_devices)}'}), 400
        
        if action not in valid_actions:
            return jsonify({'error': f'Invalid action. Must be one of: {", ".join(valid_actions)}'}), 400
        
        # Build MQTT command
        command = f"{device.upper()}_{action.upper()}"
        
        # Publish to MQTT with device_id
        mqtt_handler = get_mqtt_handler()
        mqtt_handler.publish_control_command(command, device_id)
        
        return jsonify({
            'success': True,
            'message': f'Command sent: {command}',
            'device': device,
            'action': action,
            'device_id': device_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sensor_bp.route('/current', methods=['GET'])
@require_auth
def get_current_readings():
    """
    Get the most recent sensor readings for the authenticated user.
    
    Returns:
        Latest sensor data record from user's devices
    """
    from flask import g
    
    db = None
    try:
        user_id = g.user.get('id')
        db = get_db()
        latest = db.query(SensorData).filter(
            SensorData.user_id == user_id
        ).order_by(SensorData.recorded_at.desc()).first()
        
        if latest is None:
            return jsonify({'error': 'No sensor data available for your devices'}), 404
        
        return jsonify({
            'success': True,
            'data': latest.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if db:
            db.close()


@sensor_bp.route('/register-device', methods=['POST'])
@require_auth
def register_device():
    """
    Register a device to a user account.
    
    This endpoint is used by developers via Postman to link an ESP32 device
    to the authenticated user account.
    
    -------------------- POSTMAN USAGE --------------------
    
    Endpoint: POST /api/register-device
    Headers:
        Authorization: Bearer <supabase_jwt_token>
        Content-Type: application/json
    
    Request Body:
        {
            "device_id": "AA:BB:CC:DD:EE:FF"  // Required: ESP32 MAC Address
        }
    
    Success Response (201):
        {
            "success": true,
            "message": "Device registered successfully",
            "device_id": "AA:BB:CC:DD:EE:FF",
            "user_id": "uuid-string"
        }
    
    --------------------------------------------------------
    """
    db = None
    try:
        data = request.get_json()
        
        # Validate request body exists
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body must be JSON'
            }), 400
        
        device_id = data.get('device_id')
        
        # Get user_id from the authenticated token (set by middleware)
        from flask import g
        user_id = g.user.get('id')
        
        # Validate required fields
        if not device_id:
            return jsonify({
                'success': False,
                'error': 'Missing required field: device_id'
            }), 400
            
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'Authenticated user ID not found'
            }), 401
        
        db = get_db()
        
        # Check if device is already registered
        existing = db.query(DeviceState).filter(
            DeviceState.device_id == device_id
        ).first()
        
        if existing:
            # If it's already registered to THIS user, just return success
            if str(existing.user_id) == str(user_id):
                 return jsonify({
                    'success': True,
                    'message': 'Device already registered to you',
                    'device_id': device_id,
                    'user_id': user_id
                }), 200
            
            return jsonify({
                'success': False,
                'error': 'Device already registered to another user',
                # Security: Don't reveal who owns it
            }), 400
        
        # Create new device registration
        new_device = DeviceState(
            device_id=device_id,
            user_id=user_id,
            is_active=True
        )
        db.add(new_device)
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Device registered successfully',
            'device_id': device_id,
            'user_id': user_id
        }), 201
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': f'Invalid data format: {str(e)}'
        }), 400
    except Exception as e:
        if db:
            db.rollback()
        return jsonify({
            'success': False,
            'error': f'Database error: {str(e)}'
        }), 500
    finally:
        if db:
            db.close()
