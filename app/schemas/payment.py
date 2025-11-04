import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class PaymentStatus(str, Enum):
    """Payment status enumeration"""

    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"
    REFUNDED = "refunded"


class PaymentType(str, Enum):
    """Payment type enumeration"""

    ONE_TIME = "one_time"
    SUBSCRIPTION = "subscription"


class SubscriptionStatus(str, Enum):
    """Subscription status enumeration"""

    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELED = "CANCELED"
    UNPAID = "UNPAID"
    TRIALING = "TRIALING"


# Request Schemas
class CreateCheckoutRequest(BaseModel):
    """Request to create a checkout session"""

    product_id: str = Field(..., description="Product identifier")
    success_url: Optional[str] = Field(default=None, description="Custom success URL")
    cancel_url: Optional[str] = Field(default=None, description="Custom cancel URL")
    customer_email: Optional[str] = Field(
        default=None, description="Pre-fill customer email"
    )
    metadata: Optional[Dict[str, str]] = Field(
        default=None, description="Additional metadata"
    )
    allow_promotion_codes: bool = Field(
        default=True, description="Allow promotion codes"
    )

    @field_validator("product_id")
    def validate_product_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Product ID cannot be empty")
        return v.strip()


class CreateSubscriptionRequest(BaseModel):
    """Request to create a subscription"""

    plan_id: str = Field(..., description="Subscription plan identifier")
    trial_period_days: Optional[int] = Field(
        default=None, description="Trial period override"
    )
    success_url: Optional[str] = Field(default=None, description="Custom success URL")
    cancel_url: Optional[str] = Field(default=None, description="Custom cancel URL")
    customer_email: Optional[str] = Field(
        default=None, description="Pre-fill customer email"
    )
    metadata: Optional[Dict[str, str]] = Field(
        default=None, description="Additional metadata"
    )

    @field_validator("plan_id")
    def validate_plan_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Plan ID cannot be empty")
        return v.strip()


class CancelSubscriptionRequest(BaseModel):
    """Request to cancel a subscription"""

    immediately: bool = Field(
        default=False, description="Cancel immediately or at period end"
    )
    reason: Optional[str] = Field(default=None, description="Cancellation reason")


class CreatePortalSessionRequest(BaseModel):
    """Request to create a customer portal session"""

    return_url: Optional[str] = Field(
        default=None, description="Return URL after portal session"
    )


class WebhookEventRequest(BaseModel):
    """Webhook event payload"""

    stripe_signature: str = Field(..., description="Stripe webhook signature")
    payload: bytes = Field(..., description="Raw webhook payload")


# Response Schemas
class CheckoutSessionResponse(BaseModel):
    """Response for checkout session creation"""

    checkout_url: str = Field(..., description="Stripe checkout URL")
    session_id: str = Field(..., description="Stripe session ID")
    expires_at: datetime = Field(..., description="Session expiration time")


class PaymentResponse(BaseModel):
    """Payment response"""

    id: uuid.UUID = Field(..., description="Payment ID")
    status: PaymentStatus = Field(..., description="Payment status")
    amount: int = Field(..., description="Amount in cents")
    currency: str = Field(..., description="Currency code")
    product_id: str = Field(..., description="Product identifier")
    stripe_payment_intent_id: Optional[str] = Field(
        default=None, description="Stripe payment intent ID"
    )
    download_url: Optional[str] = Field(
        default=None, description="Download URL if applicable"
    )
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    metadata: Optional[Dict[str, str]] = Field(
        default=None, description="Additional metadata"
    )


class SubscriptionResponse(BaseModel):
    """Subscription response"""

    id: uuid.UUID = Field(..., description="Subscription ID")
    status: SubscriptionStatus = Field(..., description="Subscription status")
    plan_id: str = Field(..., description="Plan identifier")
    current_period_start: datetime = Field(..., description="Current period start")
    current_period_end: datetime = Field(..., description="Current period end")
    trial_end: Optional[datetime] = Field(default=None, description="Trial end date")
    cancel_at_period_end: bool = Field(..., description="Will cancel at period end")
    stripe_subscription_id: Optional[str] = Field(
        default=None, description="Stripe subscription ID"
    )
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class ProductResponse(BaseModel):
    """Product information response"""

    id: str = Field(..., description="Product identifier")
    name: str = Field(..., description="Product name")
    description: str = Field(..., description="Product description")
    type: PaymentType = Field(..., description="Payment type")
    price_cents: int = Field(..., description="Price in cents")
    currency: str = Field(..., description="Currency code")
    trial_period_days: Optional[int] = Field(
        default=None, description="Trial period for subscriptions"
    )
    features: List[str] = Field(..., description="Product features")


class CustomerPortalResponse(BaseModel):
    """Customer portal session response"""

    portal_url: str = Field(..., description="Customer portal URL")
    expires_at: datetime = Field(..., description="Portal session expiration")


class PaymentMethodResponse(BaseModel):
    """Payment method information"""

    id: str = Field(..., description="Payment method ID")
    type: str = Field(..., description="Payment method type")
    card_last4: Optional[str] = Field(default=None, description="Last 4 digits of card")
    card_brand: Optional[str] = Field(default=None, description="Card brand")
    card_exp_month: Optional[int] = Field(
        default=None, description="Card expiration month"
    )
    card_exp_year: Optional[int] = Field(
        default=None, description="Card expiration year"
    )


class UserPaymentInfoResponse(BaseModel):
    """User payment information summary"""

    active_subscription: Optional[SubscriptionResponse] = Field(default=None)
    payment_methods: List[PaymentMethodResponse] = Field(default_factory=list)
    recent_payments: List[PaymentResponse] = Field(default_factory=list)
    total_spent: int = Field(default=0, description="Total amount spent in cents")


class WebhookEventResponse(BaseModel):
    """Webhook processing response"""

    event_id: str = Field(..., description="Stripe event ID")
    event_type: str = Field(..., description="Event type")
    processed: bool = Field(..., description="Whether event was processed")
    message: str = Field(..., description="Processing result message")


# Error Schemas
class PaymentErrorResponse(BaseModel):
    """Payment error response"""

    error_type: str = Field(..., description="Error type")
    error_code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict] = Field(
        default=None, description="Additional error details"
    )


# Webhook Event Types
class WebhookEventType(str, Enum):
    """Stripe webhook event types we handle"""

    # Payment intents
    PAYMENT_INTENT_SUCCEEDED = "payment_intent.succeeded"
    PAYMENT_INTENT_PAYMENT_FAILED = "payment_intent.payment_failed"

    # Checkout sessions
    CHECKOUT_SESSION_COMPLETED = "checkout.session.completed"
    CHECKOUT_SESSION_EXPIRED = "checkout.session.expired"

    # Subscriptions
    CUSTOMER_SUBSCRIPTION_CREATED = "customer.subscription.created"
    CUSTOMER_SUBSCRIPTION_UPDATED = "customer.subscription.updated"
    CUSTOMER_SUBSCRIPTION_DELETED = "customer.subscription.deleted"
    CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END = "customer.subscription.trial_will_end"

    # Invoices
    INVOICE_PAYMENT_SUCCEEDED = "invoice.payment_succeeded"
    INVOICE_PAYMENT_FAILED = "invoice.payment_failed"
    INVOICE_FINALIZED = "invoice.finalized"

    # Customers
    CUSTOMER_CREATED = "customer.created"
    CUSTOMER_UPDATED = "customer.updated"
    CUSTOMER_DELETED = "customer.deleted"


# Analytics Schemas
class PaymentAnalyticsResponse(BaseModel):
    """Payment analytics response"""

    total_revenue: int = Field(..., description="Total revenue in cents")
    total_transactions: int = Field(..., description="Total number of transactions")
    active_subscriptions: int = Field(..., description="Number of active subscriptions")
    churn_rate: float = Field(..., description="Monthly churn rate percentage")
    average_order_value: int = Field(..., description="Average order value in cents")
    conversion_rate: float = Field(
        ..., description="Checkout conversion rate percentage"
    )
    period_start: datetime = Field(..., description="Analytics period start")
    period_end: datetime = Field(..., description="Analytics period end")
