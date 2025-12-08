from functools import wraps
from flask import request, jsonify, g
import urllib.request
import urllib.error
import json
from config import Config


def verify_token_with_supabase(token: str):
    """
    Verify a JWT token by calling Supabase Auth API directly.
    Bypasses the Python SDK which has compatibility issues.
    """
    url = f"{Config.SUPABASE_URL}/auth/v1/user"
    
    req = urllib.request.Request(url, method='GET')
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('apikey', Config.SUPABASE_KEY)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data  # Returns user object if valid
    except Exception:
        return None


def require_auth(f):
    """Decorator to require authentication for an endpoint."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Missing Authorization header'}), 401
            
        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1]
            
            # Verify token using direct HTTP request
            user = verify_token_with_supabase(token)
            
            if not user:
                return jsonify({'error': 'Invalid token'}), 401
                
            # Store user in g for access in routes
            g.user = user
            
        except IndexError:
            return jsonify({'error': 'Invalid Authorization header format'}), 401
        except Exception as e:
            return jsonify({'error': f'Authentication failed: {str(e)}'}), 401
            
        return f(*args, **kwargs)
    return decorated_function
