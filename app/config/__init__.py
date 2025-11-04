"""
Configuration module for the CraftYourStartup application.

This module provides a centralized configuration system that includes:
- Base application settings (authentication, storage, etc.)
- Payment configuration (Stripe integration)
- Environment-specific configurations

Usage:
    # Import base configuration
    from app.config import config, SECRET_KEY, JWT_COOKIE_NAME

    # Import payment configuration
    from app.config import payment_config, PaymentConfig

    # Import specific modules
    from app.config.base import BaseConfig
    from app.config.payments import PaymentConfig
"""

# Import all base configuration
from .base import (  # Individual variables for backward compatibility
    ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, DOMAIN, ENV, FROM_EMAIL,
    FROM_NAME, GOOGLE_OAUTH2_CLIENT_ID, GOOGLE_OAUTH2_SECRET,
    JWT_COOKIE_NAME, MAILCHIMP_API_KEY, REDIRECT_AFTER_LOGIN,
    RESET_TOKEN_EXPIRE_HOURS, SECRET_KEY, SUPPORT_EMAIL, BaseConfig,
    config)
# Import payment configuration
from .payments import PaymentConfig, ProductConfig, payment_config

__all__ = [
    # Base configuration
    "config",
    "BaseConfig",
    # Individual variables (backward compatibility)
    "ENV",
    "SECRET_KEY",
    "ALGORITHM",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "JWT_COOKIE_NAME",
    "RESET_TOKEN_EXPIRE_HOURS",
    "DOMAIN",
    "REDIRECT_AFTER_LOGIN",
    "GOOGLE_OAUTH2_CLIENT_ID",
    "GOOGLE_OAUTH2_SECRET",
    "MAILCHIMP_API_KEY",
    "FROM_EMAIL",
    "FROM_NAME",
    "SUPPORT_EMAIL",
    # Payment system
    "payment_config",
    "PaymentConfig",
    "ProductConfig",
]
