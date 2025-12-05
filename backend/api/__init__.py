"""
API Blueprint initialization.
"""

from flask import Blueprint

# Create the API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import routes to register them with the blueprint
from api import sensor_routes
from api import ai_routes
