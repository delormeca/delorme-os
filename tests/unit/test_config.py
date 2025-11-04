"""
Unit tests for configuration system.
"""
import pytest
from app.config.base import config


@pytest.mark.unit
def test_settings_loading():
    """Test that settings can be loaded successfully."""
    assert config is not None
    assert config.algorithm == "HS256"


@pytest.mark.unit
def test_database_url_construction():
    """Test that database URL is constructed properly."""
    assert config.database_url is not None
    # Should contain postgresql connection string format
    assert "postgresql" in config.database_url


@pytest.mark.unit
def test_environment_detection():
    """Test that environment is properly detected."""
    assert config.env in ["development", "production", "test", "local"]


@pytest.mark.unit  
def test_basic_config_values():
    """Test that basic configuration values are accessible."""
    assert config.secret_key is not None
    assert config.algorithm == "HS256"
    assert config.access_token_expire_minutes > 0 