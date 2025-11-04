"""
Pytest configuration and fixtures for testing.
Provides database fixtures, authentication fixtures, and test utilities.
"""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from sqlmodel import Session, create_engine, SQLModel
from unittest.mock import Mock, AsyncMock
import uuid
from datetime import datetime

from app.models import User
from main import app


# Database fixtures
@pytest.fixture
def db_session():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session


# HTTP Client fixtures
@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    return TestClient(app)


@pytest.fixture
async def test_client():
    """Create an async test client for integration tests."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


# Authentication fixtures
@pytest.fixture
def mock_db_user():
    """Create a mock user for testing."""
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        password_hash="$2b$12$hashed_password",
        verified=True,
        is_superuser=False,
        created_at=datetime.utcnow(),
        last_login=datetime.utcnow()
    )


@pytest.fixture
def mock_superuser():
    """Create a mock superuser for testing."""
    return User(
        id=uuid.uuid4(),
        email="admin@example.com",
        full_name="Admin User",
        password_hash="$2b$12$hashed_password",
        verified=True,
        is_superuser=True,
        created_at=datetime.utcnow(),
        last_login=datetime.utcnow()
    )


@pytest.fixture
def auth_headers():
    """Provide authentication headers for testing."""
    return {"Authorization": "Bearer mock_jwt_token"}


@pytest.fixture
def mock_jwt_token():
    """Mock JWT token for testing."""
    return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock_payload.mock_signature"


# Service mocks
@pytest.fixture
def mock_users_service():
    """Mock users service for testing."""
    mock_service = Mock()
    mock_service.authenticate_user = AsyncMock()
    mock_service.create_user = AsyncMock()
    mock_service.get_user_by_email = AsyncMock()
    mock_service.update_user = AsyncMock()
    return mock_service


@pytest.fixture
def mock_payment_service():
    """Mock payment service for testing."""
    mock_service = Mock()
    mock_service.create_checkout_session = AsyncMock()
    mock_service.handle_webhook = AsyncMock()
    return mock_service


# HTTP Client mocks
@pytest.fixture
def mock_http_client():
    """Mock HTTP client for external API calls."""
    mock_client = AsyncMock()
    mock_client.get = AsyncMock()
    mock_client.post = AsyncMock()
    return mock_client


# Database operation mocks
@pytest.fixture
def mock_db_session():
    """Mock database session for testing."""
    mock_session = Mock(spec=Session)
    mock_session.add = Mock()
    mock_session.commit = Mock()
    mock_session.refresh = Mock()
    mock_session.get = Mock()
    mock_session.exec = Mock()
    mock_session.delete = Mock()
    return mock_session


# Test data fixtures
@pytest.fixture
def sample_users():
    """Sample user data for testing."""
    return [
        {
            "email": "user1@example.com",
            "full_name": "User One",
            "password_hash": "hashed_password_1"
        },
        {
            "email": "user2@example.com",
            "full_name": "User Two",
            "password_hash": "hashed_password_2"
        }
    ]


@pytest.fixture
def sample_article_data():
    """Sample article data for testing."""
    return {
        "title": "Test Article",
        "content": "This is test content for the article.",
        "is_published": False
    }


@pytest.fixture
def sample_login_data():
    """Sample login data for testing."""
    return {
        "email": "test@example.com",
        "password": "testpassword123"
    }


@pytest.fixture
def sample_signup_data():
    """Sample signup data for testing."""
    return {
        "email": "newuser@example.com",
        "password": "newpassword123",
        "full_name": "New User"
    }


# Environment and configuration fixtures
@pytest.fixture
def mock_env_vars(monkeypatch):
    """Mock environment variables for testing."""
    env_vars = {
        "SECRET_KEY": "test_secret_key",
        "DATABASE_URL": "sqlite:///:memory:",
        "FRONTEND_URL": "http://localhost:3000",
        "STRIPE_SECRET_KEY": "sk_test_mock_key",
        "STRIPE_PUBLISHABLE_KEY": "pk_test_mock_key"
    }
    for key, value in env_vars.items():
        monkeypatch.setenv(key, value)
    return env_vars


@pytest.fixture
def test_config():
    """Test configuration settings."""
    return {
        "debug": True,
        "testing": True,
        "database_url": "sqlite:///:memory:"
    }


# Error simulation fixtures
@pytest.fixture
def network_error():
    """Simulate network errors for testing."""
    def _network_error():
        raise ConnectionError("Network connection failed")
    return _network_error


@pytest.fixture
def database_error():
    """Simulate database errors for testing."""
    def _database_error():
        raise Exception("Database operation failed")
    return _database_error


# File and temporary fixtures
@pytest.fixture
def temp_file(tmp_path):
    """Create a temporary file for testing."""
    temp_file = tmp_path / "test_file.txt"
    temp_file.write_text("test content")
    return temp_file


@pytest.fixture
def temp_directory(tmp_path):
    """Create a temporary directory for testing."""
    temp_dir = tmp_path / "test_dir"
    temp_dir.mkdir()
    return temp_dir


# Performance testing fixtures
@pytest.fixture
def performance_timer():
    """Timer for performance testing."""
    import time
    
    class Timer:
        def __init__(self):
            self.start_time = None
            self.end_time = None
        
        def start(self):
            self.start_time = time.time()
        
        def stop(self):
            self.end_time = time.time()
        
        @property
        def elapsed(self):
            if self.start_time and self.end_time:
                return self.end_time - self.start_time
            return None
    
    return Timer()


# Cleanup fixtures
@pytest.fixture
def cleanup_after_test():
    """Cleanup resources after test completion."""
    resources_to_cleanup = []
    
    def add_cleanup(resource):
        resources_to_cleanup.append(resource)
    
    yield add_cleanup
    
    # Cleanup after test
    for resource in resources_to_cleanup:
        try:
            if hasattr(resource, 'close'):
                resource.close()
            elif hasattr(resource, 'cleanup'):
                resource.cleanup()
        except Exception:
            pass  # Ignore cleanup errors


# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "auth: mark test as authentication related"
    )
    config.addinivalue_line(
        "markers", "database: mark test as database related"
    )


# Cache fixture for performance testing
@pytest.fixture
def cache():
    """Simple cache implementation for testing."""
    _cache = {}
    
    def get(key):
        return _cache.get(key)
    
    def set(key, value):
        _cache[key] = value
    
    def clear():
        _cache.clear()
    
    cache_obj = type('Cache', (), {
        'get': get,
        'set': set,
        'clear': clear
    })()
    
    yield cache_obj
    
    # Cleanup
    _cache.clear()


# Pytest collection hooks
def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically."""
    for item in items:
        # Add integration marker to integration tests
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        
        # Add unit marker to unit tests
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        
        # Add database marker to database related tests
        if "database" in item.name or "db" in item.name:
            item.add_marker(pytest.mark.database)
        
        # Add auth marker to authentication tests
        if "auth" in item.name or "login" in item.name or "signup" in item.name:
            item.add_marker(pytest.mark.auth) 