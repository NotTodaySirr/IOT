"""
API Blueprint initialization.
"""

from flask import Blueprint

# Create the blueprints
sensor_bp = Blueprint('sensor', __name__, url_prefix='/')
ai_bp = Blueprint('ai', __name__, url_prefix='/ai')

# Import routes to register them with the blueprints
from api import sensor_routes
from api import ai_routes
