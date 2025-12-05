import pytest
import sys
import os
from unittest.mock import MagicMock

# Add backend directory to path so we can import from app, models, etc.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from config import Config

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Override config for testing
    Config.TESTING = True
    Config.DATABASE_URL = "sqlite:///:memory:"  # Use in-memory SQLite for tests if needed, but we mock DB mostly
    
    app = create_app()
    
    yield app

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's CLI commands."""
    return app.test_cli_runner()

@pytest.fixture
def mock_db_session(mocker):
    """Mock the database session."""
    mock_session = MagicMock()
    
    # Mock the query chain: db.query(Model).order_by(...).limit(...).all()
    mock_query = MagicMock()
    mock_filter = MagicMock()
    mock_order_by = MagicMock()
    mock_limit = MagicMock()
    
    mock_session.query.return_value = mock_query
    mock_query.filter.return_value = mock_filter
    mock_query.order_by.return_value = mock_order_by
    mock_query.first.return_value = None
    mock_query.all.return_value = []
    
    # Chain returns
    mock_filter.order_by.return_value = mock_order_by
    mock_order_by.limit.return_value = mock_limit
    mock_limit.all.return_value = []
    
    # Patch get_db in the modules where it's used
    mocker.patch('api.sensor_routes.get_db', return_value=mock_session)
    mocker.patch('mqtt.client.get_db', return_value=mock_session)
    
    return mock_session

@pytest.fixture
def mock_mqtt(mocker):
    """Mock the MQTT handler."""
    mock_handler = MagicMock()
    mocker.patch('api.sensor_routes.get_mqtt_handler', return_value=mock_handler)
    mocker.patch('mqtt.client.get_mqtt_handler', return_value=mock_handler)
    return mock_handler

@pytest.fixture
def mock_ai_service(mocker):
    """Mock the AI service."""
    mock_service = MagicMock()
    mocker.patch('api.ai_routes.AIService', mock_service)
    return mock_service

@pytest.fixture(autouse=True)
def mock_supabase(mocker):
    """Mock Supabase client for all tests."""
    mock_client = MagicMock()
    mock_user = MagicMock()
    mock_client.auth.get_user.return_value = mock_user
    
    # Patch get_supabase_client in middleware
    mocker.patch('api.middleware.get_supabase_client', return_value=mock_client)
    
    return mock_client
