import os
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class StripeConfig(BaseModel):
    """Stripe configuration with validation"""

    api_key: str = Field(..., description="Stripe secret API key")
    publishable_key: str = Field(..., description="Stripe publishable key")
    webhook_secret: str = Field(..., description="Stripe webhook endpoint secret")

    @field_validator("api_key")
    def validate_api_key(cls, v):
        # Allow empty or placeholder values during development setup
        if not v or v == "":
            return v
        # Allow any placeholder that doesn't look like a real Stripe key
        if not v.startswith(("sk_test_", "sk_live_", "rk_test_", "rk_live_")):
            # It's a placeholder - allow it but log warning
            return v
        # Validate real Stripe keys
        if not v.startswith(("sk_test_", "sk_live_")):
            raise ValueError("Invalid Stripe API key format")
        return v

    @field_validator("publishable_key")
    def validate_publishable_key(cls, v):
        # Allow empty or placeholder values during development setup
        if not v or v == "":
            return v
        # Allow any placeholder that doesn't look like a real Stripe key
        if not v.startswith(("pk_test_", "pk_live_")):
            # It's a placeholder - allow it
            return v
        return v


class ProductConfig(BaseModel):
    """Product configuration for payment integration"""

    id: str = Field(..., description="Product identifier")
    name: str = Field(..., description="Product display name")
    description: str = Field(..., description="Product description")
    stripe_price_id: str = Field(..., description="Stripe price ID")
    type: str = Field(..., description="Product type: 'subscription' or 'one_time'")
    price_cents: int = Field(..., description="Price in cents")
    currency: str = Field(default="usd", description="Currency code")
    trial_period_days: Optional[int] = Field(
        default=None, description="Trial period for subscriptions"
    )
    features: list[str] = Field(default_factory=list, description="Product features")
    metadata: Dict[str, str] = Field(
        default_factory=dict, description="Additional metadata"
    )

    @field_validator("stripe_price_id")
    def validate_price_id(cls, v):
        # Allow empty or placeholder values
        if not v or v == "":
            return v
        # Allow any value that doesn't look like a real Stripe price ID
        if not v.startswith("price_"):
            # It's a placeholder - allow it
            return v
        # Validate real Stripe price IDs
        return v

    @field_validator("type")
    def validate_type(cls, v):
        if v not in ["subscription", "one_time"]:
            raise ValueError('Product type must be "subscription" or "one_time"')
        return v

    @field_validator("price_cents")
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v


def _get_env_files() -> List[str]:
    """Get environment files to load (same as base config)"""
    env_file = os.environ.get("ENV_FILE")
    if env_file:
        return [env_file]
    return ["local.env", ".env"]


class PaymentSettings(BaseSettings):
    """Payment settings with automatic environment loading"""
    
    model_config = SettingsConfigDict(
        env_file=_get_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # Stripe configuration - loaded from environment
    stripe_secret_key: str = Field(
        default="sk_test_placeholder_key_not_configured",
        description="Stripe secret API key"
    )
    stripe_publishable_key: str = Field(
        default="pk_test_placeholder_key_not_configured", 
        description="Stripe publishable key"
    )
    stripe_webhook_secret: str = Field(
        default="whsec_placeholder_not_configured",
        description="Stripe webhook secret"
    )
    
    # Stripe Product Price IDs
    stripe_price_starter: str = Field(
        default="price_starter_placeholder",
        description="Starter plan price ID"
    )
    stripe_price_pro: str = Field(
        default="price_pro_placeholder",
        description="Pro plan price ID"
    )
    stripe_price_premium_sub: str = Field(
        default="price_premium_sub_placeholder",
        description="Premium subscription price ID"
    )
    stripe_price_enterprise_sub: str = Field(
        default="price_enterprise_sub_placeholder",
        description="Enterprise subscription price ID"
    )
    
    # Domain configuration
    domain: str = Field(
        default="http://localhost:5173",
        description="Application domain"
    )


class PaymentConfig(BaseModel):
    """Main payment configuration - streamlined for production use"""

    domain: str = Field(..., description="Application domain")
    stripe: StripeConfig
    products: Dict[str, ProductConfig] = Field(default_factory=dict)
    success_url_template: str = Field(
        default="/dashboard/payment/success?session_id={session_id}"
    )
    cancel_url: str = Field(default="/dashboard/payment/cancel")


def load_payment_config() -> PaymentConfig:
    """Load payment configuration from environment variables - simplified"""
    
    # Load settings using pydantic-settings (automatically loads from local.env)
    settings = PaymentSettings()

    # Create Stripe configuration
    stripe_config = StripeConfig(
        api_key=settings.stripe_secret_key,
        publishable_key=settings.stripe_publishable_key,
        webhook_secret=settings.stripe_webhook_secret,
    )

    # Create payment configuration
    config = PaymentConfig(
        domain=settings.domain,
        stripe=stripe_config,
    )

    return config


def load_products_from_config() -> Dict[str, ProductConfig]:
    """Load product configurations from environment or config file"""
    products = {}
    
    # Load settings to get price IDs
    settings = PaymentSettings()

    # Example products - these should be loaded from a config file or database in production
    default_products = []

    # Use price IDs from settings (which loads from local.env)
    starter_price_id = settings.stripe_price_starter
    pro_price_id = settings.stripe_price_pro
    premium_price_id = settings.stripe_price_premium_sub
    enterprise_price_id = settings.stripe_price_enterprise_sub

    # Add Starter Plan
    default_products.append(
        {
            "id": "starter",
            "name": "Starter Plan",
            "description": "Perfect for solo entrepreneurs getting started",
            "stripe_price_id": starter_price_id,
            "type": "one_time",
            "price_cents": 9900,  # $99
            "currency": "usd",
            "features": [
                "Complete SaaS boilerplate",
                "Authentication & user management", 
                "Payment integration (Stripe)",
                "Database setup & migrations",
                "Basic admin panel",
                "Email templates",
                "Basic documentation",
                "✨ Article creation & management",
                "✨ Basic analytics dashboard",
            ],
        }
    )

    # Add Pro Plan
    default_products.append(
        {
            "id": "pro",
            "name": "Pro Plan",
            "description": "Everything you need to scale your startup",
            "stripe_price_id": pro_price_id,
            "type": "one_time",
            "price_cents": 19900,  # $199
            "currency": "usd",
            "features": [
                "Everything in Starter",
                "Advanced admin dashboard",
                "Multi-tenant support", 
                "API documentation",
                "Advanced auth (OAuth, SSO)",
                "Priority email support",
                "Video tutorials & guides",
                "1 year of updates",
                "🚀 Advanced analytics & reporting",
                "🚀 Full API access",
                "🚀 Advanced dashboard features",
            ],
        }
    )

    # Add Premium Subscription
    default_products.append(
        {
            "id": "premium",
            "name": "Premium Subscription",
            "description": "Monthly subscription for ongoing features",
            "stripe_price_id": premium_price_id,
            "type": "subscription",
            "price_cents": 2900,  # $29/month
            "currency": "usd",
            "trial_period_days": 14,
            "features": [
                "All Pro features",
                "Monthly feature updates",
                "Priority support",
                "Custom components library",
                "💎 Premium integrations (Slack, Zapier, etc.)",
                "💎 Advanced reporting & data export",
                "💎 Team collaboration features",
                "💎 Custom report generation",
            ],
        }
    )

    # Add Enterprise Subscription
    default_products.append(
        {
            "id": "enterprise",
            "name": "Enterprise Subscription",
            "description": "For teams that need ongoing support",
            "stripe_price_id": enterprise_price_id,
            "type": "subscription",
            "price_cents": 9900,  # $99/month
            "currency": "usd",
            "trial_period_days": 30,
            "features": [
                "Everything in Premium",
                "Dedicated support channel",
                "1-on-1 onboarding call",
                "White-label options",
                "SLA guarantee",
                "Team training sessions",
                "⭐ Custom integrations & API",
                "⭐ Team analytics & management",
                "⭐ Enterprise SSO & security",
                "⭐ Audit logs & compliance",
            ],
        }
    )

    for product_data in default_products:
        products[product_data["id"]] = ProductConfig(**product_data)

    return products


# Global payment configuration instance
payment_config = load_payment_config()
payment_config.products = load_products_from_config()
