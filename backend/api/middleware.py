from functools import wraps
from flask import request, jsonify, g
from supabase import create_client, Client
from config import Config

def get_supabase_client() -> Client:
    """Get or create Supabase client."""
    if 'supabase' not in g:
        g.supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
    return g.supabase

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
            
            # Verify token using Supabase
            supabase = get_supabase_client()
            user = supabase.auth.get_user(token)
            
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
