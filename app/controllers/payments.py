"""
Unified Payment Controller - Handles both one-time payments and subscriptions
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse

from app.core.exceptions import PaymentBaseException, payment_exception_to_http
from app.schemas.auth import CurrentUserResponse
from app.schemas.payment import (CancelSubscriptionRequest,
                                 CheckoutSessionResponse,
                                 CreateCheckoutRequest, CustomerPortalResponse,
                                 ProductResponse, SubscriptionResponse,
                                 WebhookEventResponse)
from app.services.payment_manager import PaymentManager, get_payment_manager
from app.services.users_service import get_current_user
from app.services.webhook_handler import WebhookHandler, get_webhook_handler

logger = logging.getLogger(__name__)

# Create router
payments_router = APIRouter()


# Product Endpoints
@payments_router.get("/products", response_model=List[ProductResponse])
async def get_products(payment_manager: PaymentManager = Depends(get_payment_manager)):
    """Get all available products and plans"""
    try:
        return await payment_manager.get_products()
    except PaymentBaseException as e:
        raise payment_exception_to_http(e)


@payments_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str, payment_manager: PaymentManager = Depends(get_payment_manager)
):
    """Get a specific product by ID"""
    try:
        return await payment_manager.get_product(product_id)
    except PaymentBaseException as e:
        raise payment_exception_to_http(e)


# Checkout Session Endpoints
@payments_router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest,
    payment_manager: PaymentManager = Depends(get_payment_manager),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Create a checkout session for either one-time payment or subscription
    """
    try:
        return await payment_manager.create_checkout_session(request)
    except PaymentBaseException as e:
        raise payment_exception_to_http(e)


@payments_router.get("/checkout/success")
async def handle_checkout_success(
    session_id: str,
    payment_manager: PaymentManager = Depends(get_payment_manager),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Handle successful checkout completion
    Returns either PaymentResponse for one-time payments or SubscriptionResponse for subscriptions
    """
    try:
        result = await payment_manager.handle_successful_checkout(session_id)
        return result
    except PaymentBaseException as e:
        raise payment_exception_to_http(e)


# Subscription Management Endpoints
@payments_router.post("/subscriptions/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    request: CancelSubscriptionRequest,
    payment_manager: PaymentManager = Depends(get_payment_manager),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Cancel the current user's subscription"""
    try:
        return await payment_manager.cancel_subscription(request)
    except PaymentBaseException as e:
        raise payment_exception_to_http(e)


@payments_router.post("/portal", response_model=CustomerPortalResponse)
async def create_customer_portal(
    return_url: Optional[str] = None,
    payment_manager: PaymentManager = Depends(get_payment_manager),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Create a customer portal session for subscription management"""
    try:
        return await payment_manager.create_customer_portal_session(return_url)
    except PaymentBaseException as e:
        raise payment_exception_to_http(e)


# User Payment Information
@payments_router.get("/user/info")
async def get_user_payment_info(
    payment_manager: PaymentManager = Depends(get_payment_manager),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get comprehensive payment information for the current user"""
    try:
        return await payment_manager.get_user_payment_info()
    except PaymentBaseException as e:
        raise payment_exception_to_http(e)


# Webhook Endpoint
@payments_router.post("/webhook", response_model=WebhookEventResponse)
async def handle_stripe_webhook(
    request: Request, webhook_handler: WebhookHandler = Depends(get_webhook_handler)
):
    """
    Handle Stripe webhook events
    This endpoint is called by Stripe to notify about payment events
    """
    try:
        return await webhook_handler.handle_webhook(request)
    except PaymentBaseException as e:
        logger.error(f"Webhook processing error: {e.message}")
        raise payment_exception_to_http(e)
    except Exception as e:
        logger.error(f"Unexpected webhook error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal server error processing webhook"},
        )
