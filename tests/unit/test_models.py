"""
Unit tests for database models.
"""
import pytest


@pytest.mark.unit
def test_basic_model_imports():
    """Test that model imports work correctly."""
    try:
        from app.models import User
        assert User is not None
    except ImportError:
        pytest.fail("Failed to import User model")


@pytest.mark.unit
def test_model_class_exists():
    """Test that User model class exists and has expected attributes."""
    from app.models import User
    
    # Check that the class has expected attributes
    assert hasattr(User, 'email')
    assert hasattr(User, 'password_hash')
    assert hasattr(User, 'full_name')


@pytest.mark.unit  
def test_model_table_name():
    """Test that model has proper table configuration."""
    from app.models import User
    
    # Basic class inspection
    assert User.__name__ == "User"
    # Check if it's a SQLModel table
    assert hasattr(User, '__tablename__') or hasattr(User, '__table__')

 