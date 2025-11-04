"""
Core Payment Manager - Orchestrates all payment operations
Handles both subscription and one-time payments with comprehensive error handling
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union

import stripe
from fastapi import Depends, Request
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config.payments import payment_config
from app.core.exceptions import (CustomerNotFoundError,
                                 InvalidProductError,
                                 PaymentConfigurationError,
                                 PaymentErrorContext, PaymentProcessingError,
                                 SubscriptionError, handle_stripe_errors)
from app.db import get_async_db_session
from app.models import Purchase, Subscription, SubscriptionStatus, User
from app.schemas.auth import CurrentUserResponse
from app.schemas.payment import (CancelSubscriptionRequest,
                                 CheckoutSessionResponse,
                                 CreateCheckoutRequest, CustomerPortalResponse,
                                 PaymentResponse, PaymentStatus, PaymentType,
                                 ProductResponse, SubscriptionResponse)
from app.services.users_service import get_current_user_optional
from app.core.access_control import update_user_plan

logger = logging.getLogger(__name__)

# Initialize Stripe conditionally
if not payment_config.stripe.api_key.endswith("_not_configured"):
    stripe.api_key = payment_config.stripe.api_key


class PaymentManager:
    """
    Core payment manager that handles all payment operations
    """

    def __init__(
        self,
        db: AsyncSession,
        current_user: Optional[CurrentUserResponse] = None,
        request: Optional[Request] = None,
    ):
        self.db = db
        self.current_user = current_user
        self.request = request
        self.config = payment_config

    def _validate_stripe_config(self):
        """Validate that Stripe is properly configured"""
        if self.config.stripe.api_key.endswith(
            "_not_configured"
        ) or self.config.stripe.publishable_key.endswith("_not_configured"):
            raise PaymentConfigurationError(
                "Stripe API keys are not configured. Please set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY environment variables."
            )

        if not stripe.api_key or stripe.api_key.endswith("_not_configured"):
            raise PaymentConfigurationError(
                "Stripe API key is not properly initialized."
            )



    # Product Management
    async def get_products(self) -> List[ProductResponse]:
        """Get all available products"""
        products = []
        for _, product_config in self.config.products.items():
            products.append(
                ProductResponse(
                    id=product_config.id,
                    name=product_config.name,
                    description=product_config.description,
                    type=(
                        PaymentType.SUBSCRIPTION
                        if product_config.type == "subscription"
                        else PaymentType.ONE_TIME
                    ),
                    price_cents=product_config.price_cents,
                    currency=product_config.currency,
                    trial_period_days=product_config.trial_period_days,
                    features=product_config.features,
                )
            )
        return products

    async def get_product(self, product_id: str) -> ProductResponse:
        """Get a specific product by ID"""
        if product_id not in self.config.products:
            raise InvalidProductError(product_id)

        product_config = self.config.products[product_id]
        return ProductResponse(
            id=product_config.id,
            name=product_config.name,
            description=product_config.description,
            type=(
                PaymentType.SUBSCRIPTION
                if product_config.type == "subscription"
                else PaymentType.ONE_TIME
            ),
            price_cents=product_config.price_cents,
            currency=product_config.currency,
            trial_period_days=product_config.trial_period_days,
            features=product_config.features,
        )

    # Checkout Session Creation
    @handle_stripe_errors
    async def create_checkout_session(
        self, request: CreateCheckoutRequest
    ) -> CheckoutSessionResponse:
        """Create a checkout session for either one-time or subscription payment"""

        # Validate Stripe configuration
        self._validate_stripe_config()

        # Validate product exists
        if request.product_id not in self.config.products:
            raise InvalidProductError(request.product_id)

        product_config = self.config.products[request.product_id]

        # Check if product has valid Stripe price ID
        if product_config.stripe_price_id.endswith("_placeholder"):
            raise PaymentConfigurationError(
                f"Product '{request.product_id}' is not properly configured with a valid Stripe price ID."
            )

        # Ensure user is authenticated
        if not self.current_user:
            raise PaymentProcessingError(
                "User must be authenticated to create checkout session"
            )

        with PaymentErrorContext(
            "create_checkout_session", product_id=request.product_id
        ):

            # Create or get Stripe customer
            customer_id = await self._get_or_create_stripe_customer()

            # Build URLs properly
            base_domain = self.config.domain.rstrip('/')
            
            # Handle success URL - use Stripe's session_id parameter
            if request.success_url:
                if request.success_url.startswith('http'):
                    # Remove any existing session_id placeholder and add proper Stripe parameter
                    clean_url = request.success_url.replace('?session_id={session_id}', '').replace('&session_id={session_id}', '')
                    success_url = f"{clean_url}{'&' if '?' in clean_url else '?'}session_id={{CHECKOUT_SESSION_ID}}"
                else:
                    success_path = request.success_url if request.success_url.startswith('/') else '/' + request.success_url
                    clean_path = success_path.replace('?session_id={session_id}', '').replace('&session_id={session_id}', '')
                    success_url = f"{base_domain}{clean_path}{'&' if '?' in clean_path else '?'}session_id={{CHECKOUT_SESSION_ID}}"
            else:
                # Use default template but clean it up
                success_path = self.config.success_url_template
                if not success_path.startswith('/'):
                    success_path = '/' + success_path
                clean_path = success_path.replace('?session_id={session_id}', '').replace('&session_id={session_id}', '')
                success_url = f"{base_domain}{clean_path}{'&' if '?' in clean_path else '?'}session_id={{CHECKOUT_SESSION_ID}}"
            
            # Handle cancel URL
            if request.cancel_url:
                if request.cancel_url.startswith('http'):
                    cancel_url = request.cancel_url
                else:
                    cancel_path = request.cancel_url if request.cancel_url.startswith('/') else '/' + request.cancel_url
                    cancel_url = f"{base_domain}{cancel_path}"
            else:
                cancel_path = self.config.cancel_url
                if not cancel_path.startswith('/'):
                    cancel_path = '/' + cancel_path
                cancel_url = f"{base_domain}{cancel_path}"
            
            logger.info(f"Creating checkout with URLs - Success: {success_url}, Cancel: {cancel_url}")
            
            # Build checkout session parameters
            session_params = {
                "customer": customer_id,
                "payment_method_types": ["card"],
                "success_url": success_url,
                "cancel_url": cancel_url,
                "metadata": {
                    "product_id": request.product_id,
                    "user_id": str(self.current_user.user_id),
                    **(request.metadata or {}),
                },
            }
            
            # Add optional parameters
            if request.allow_promotion_codes is not None:
                session_params["allow_promotion_codes"] = request.allow_promotion_codes

            # Configure for subscription vs one-time payment
            if product_config.type == "subscription":
                session_params.update(
                    {
                        "mode": "subscription",
                        "line_items": [{"price": product_config.stripe_price_id, "quantity": 1}],
                        "subscription_data": {
                            "metadata": session_params["metadata"],
                        },
                    }
                )

                # Add trial period if configured
                if product_config.trial_period_days:
                    session_params["subscription_data"][
                        "trial_period_days"
                    ] = product_config.trial_period_days

            else:  # one-time payment
                session_params.update(
                    {
                        "mode": "payment",
                        "line_items": [
                            {"price": product_config.stripe_price_id, "quantity": 1}
                        ],
                    }
                )

            # Create the checkout session
            session = stripe.checkout.Session.create(**session_params)

            # Log the session creation
            logger.info(
                "Created checkout session for user %s, product %s",
                self.current_user.user_id,
                request.product_id,
                extra={
                    "user_id": str(self.current_user.user_id),
                    "product_id": request.product_id,
                    "session_id": session.id,
                    "payment_type": product_config.type,
                },
            )

            return CheckoutSessionResponse(
                checkout_url=session.url,
                session_id=session.id,
                expires_at=datetime.fromtimestamp(session.expires_at),
            )

    @handle_stripe_errors
    async def _get_or_create_stripe_customer(self) -> str:
        """Get existing Stripe customer or create new one"""

        # Validate Stripe configuration
        self._validate_stripe_config()

        # Get user from database
        user_stmt = select(User).where(User.id == self.current_user.user_id)
        user_result = await self.db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            raise CustomerNotFoundError(str(self.current_user.user_id))

        # Return existing customer ID if available
        if user.stripe_customer_id:
            return user.stripe_customer_id

        # Create new Stripe customer
        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name,
            metadata={"user_id": str(user.id)},
        )

        # Update user record with customer ID
        user.stripe_customer_id = customer.id
        await self.db.commit()

        return customer.id

    # Payment Processing
    @handle_stripe_errors
    async def handle_successful_checkout(
        self, session_id: str
    ) -> Union[PaymentResponse, SubscriptionResponse]:
        """Handle successful checkout completion"""

        with PaymentErrorContext("handle_successful_checkout", session_id=session_id):

            # Retrieve the checkout session
            session = stripe.checkout.Session.retrieve(
                session_id, expand=["line_items", "subscription", "payment_intent"]
            )

            # Extract metadata
            product_id = session.metadata.get("product_id")
            user_id = session.metadata.get("user_id")

            if not product_id or not user_id:
                raise PaymentProcessingError(
                    "Missing required metadata in checkout session"
                )

            # Get product configuration
            if product_id not in self.config.products:
                raise InvalidProductError(product_id)

            product_config = self.config.products[product_id]

            # Handle based on payment type
            if product_config.type == "subscription":
                return await self._handle_subscription_success(
                    session, product_config, uuid.UUID(user_id)
                )

            return await self._handle_one_time_payment_success(
                session, product_config, uuid.UUID(user_id)
            )

    async def _handle_one_time_payment_success(
        self, session: stripe.checkout.Session, product_config, user_id: uuid.UUID
    ) -> PaymentResponse:
        """Handle successful one-time payment"""

        payment_intent_id = (
            session.payment_intent.id if session.payment_intent else None
        )

        # Check for duplicate payment
        existing_stmt = select(Purchase).where(
            Purchase.transaction_id == payment_intent_id
        )
        existing_result = await self.db.execute(existing_stmt)
        existing_purchase = existing_result.scalar_one_or_none()
        if existing_purchase:
            # Return existing purchase instead of error (for idempotency)
            logger.info(f"Returning existing purchase for payment intent {payment_intent_id}")
            return PaymentResponse(
                id=existing_purchase.id,
                status=PaymentStatus.SUCCEEDED,
                amount=int(existing_purchase.amount * 100),
                currency=existing_purchase.currency,
                product_id=product_config.id,
                stripe_payment_intent_id=payment_intent_id,
                created_at=existing_purchase.purchase_date,
                updated_at=existing_purchase.purchase_date,
            )



        # Create purchase record
        purchase = Purchase(
            id=uuid.uuid4(),
            user_id=user_id,
            product_type=product_config.id,
            price_id=product_config.stripe_price_id,
            transaction_id=payment_intent_id,
            amount=session.amount_total / 100,  # Convert from cents
            currency=session.currency.upper(),
            is_successful=True,
            purchase_date=datetime.utcnow(),
        )

        purchase_id = purchase.id
        purchase_amount = purchase.amount
        purchase_currency = purchase.currency
        purchase_date = purchase.purchase_date
        
        self.db.add(purchase)
        await self.db.commit()

        # Update user's plan based on the new purchase
        user = await self.db.get(User, user_id)
        if user:
            await update_user_plan(user, self.db)
            logger.info(f"Updated user {user_id} plan after purchase")

        logger.info(
            "Processed one-time payment for user %s, product %s",
            user_id,
            product_config.id,
            extra={
                "user_id": str(user_id),
                "product_id": product_config.id,
                "payment_intent_id": payment_intent_id,
                "amount": purchase_amount,
            },
        )

        return PaymentResponse(
            id=purchase_id,
            status=PaymentStatus.SUCCEEDED,
            amount=int(purchase_amount * 100),  # Convert back to cents
            currency=purchase_currency,
            product_id=product_config.id,
            stripe_payment_intent_id=payment_intent_id,
            created_at=purchase_date,
            updated_at=purchase_date,
        )

    async def _handle_subscription_success(
        self, session: stripe.checkout.Session, product_config, user_id: uuid.UUID
    ) -> SubscriptionResponse:
        """Handle successful subscription creation"""

        stripe_subscription = session.subscription
        if not stripe_subscription:
            raise SubscriptionError("No subscription found in checkout session")

        # Get full subscription details
        subscription = stripe.Subscription.retrieve(stripe_subscription.id)

        # Check for existing subscription
        existing_stmt = select(Subscription).where(Subscription.user_id == user_id)
        existing_result = await self.db.execute(existing_stmt)
        existing_subscription = existing_result.scalar_one_or_none()

        if existing_subscription:
            # Update existing subscription
            existing_subscription.stripe_subscription_id = subscription.id
            existing_subscription.plan = product_config.id
            existing_subscription.status = self._map_stripe_subscription_status(
                subscription.status
            )
            existing_subscription.start_date = datetime.fromtimestamp(
                subscription.current_period_start
            )
            existing_subscription.end_date = datetime.fromtimestamp(
                subscription.current_period_end
            )

            db_subscription = existing_subscription
        else:
            # Create new subscription
            db_subscription = Subscription(
                id=uuid.uuid4(),
                user_id=user_id,
                stripe_subscription_id=subscription.id,
                plan=product_config.id,
                status=self._map_stripe_subscription_status(subscription.status),
                start_date=datetime.fromtimestamp(subscription.current_period_start),
                end_date=datetime.fromtimestamp(subscription.current_period_end),
            )
            self.db.add(db_subscription)

        subscription_id = db_subscription.id
        subscription_status = db_subscription.status
        subscription_start_date = db_subscription.start_date
        subscription_end_date = db_subscription.end_date
        
        await self.db.commit()

        # Update user's plan based on the new subscription
        user = await self.db.get(User, user_id)
        if user:
            await update_user_plan(user, self.db)
            logger.info(f"Updated user {user_id} plan after subscription creation")

        logger.info(
            "Processed subscription for user %s, plan %s",
            user_id,
            product_config.id,
            extra={
                "user_id": str(user_id),
                "plan_id": product_config.id,
                "stripe_subscription_id": subscription.id,
                "status": subscription.status,
            },
        )

        return SubscriptionResponse(
            id=subscription_id,
            status=subscription_status,
            plan_id=product_config.id,
            current_period_start=subscription_start_date,
            current_period_end=subscription_end_date,
            trial_end=(
                datetime.fromtimestamp(subscription.trial_end)
                if subscription.trial_end
                else None
            ),
            cancel_at_period_end=subscription.cancel_at_period_end,
            stripe_subscription_id=subscription.id,
            created_at=subscription_start_date,
            updated_at=subscription_start_date,
        )

    def _map_stripe_subscription_status(self, stripe_status: str) -> str:
        """Map Stripe subscription status to our enum value"""
        mapping = {
            "active": SubscriptionStatus.ACTIVE.value,
            "trialing": SubscriptionStatus.TRIALING.value,
            "past_due": SubscriptionStatus.PAST_DUE.value,
            "canceled": SubscriptionStatus.CANCELED.value,
            "unpaid": SubscriptionStatus.UNPAID.value,
            "incomplete": SubscriptionStatus.INCOMPLETE.value,
            "incomplete_expired": SubscriptionStatus.INCOMPLETE_EXPIRED.value,
        }
        return mapping.get(stripe_status, SubscriptionStatus.EXPIRED.value)

    # Subscription Management
    @handle_stripe_errors
    async def cancel_subscription(
        self, request: CancelSubscriptionRequest
    ) -> SubscriptionResponse:
        """Cancel user's subscription"""

        if not self.current_user:
            raise PaymentProcessingError("User must be authenticated")

        # Get user's subscription
        stmt = select(Subscription).where(
            Subscription.user_id == self.current_user.user_id
        )
        result = await self.db.execute(stmt)
        subscription = result.scalar_one_or_none()

        if not subscription or not subscription.stripe_subscription_id:
            raise SubscriptionError("No active subscription found")

        with PaymentErrorContext(
            "cancel_subscription", subscription_id=subscription.stripe_subscription_id
        ):

            # Cancel the Stripe subscription
            if request.immediately:
                stripe.Subscription.delete(subscription.stripe_subscription_id)
                subscription.status = SubscriptionStatus.CANCELED
                subscription.end_date = datetime.utcnow()
            else:
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id, cancel_at_period_end=True
                )

            await self.db.commit()

            logger.info(
                "Canceled subscription for user %s",
                self.current_user.user_id,
                extra={
                    "user_id": str(self.current_user.user_id),
                    "subscription_id": subscription.stripe_subscription_id,
                    "immediately": request.immediately,
                },
            )

            return SubscriptionResponse(
                id=subscription.id,
                status=subscription.status,
                plan_id=subscription.plan,
                current_period_start=subscription.start_date,
                current_period_end=subscription.end_date,
                cancel_at_period_end=not request.immediately,
                stripe_subscription_id=subscription.stripe_subscription_id,
                created_at=subscription.start_date,
                updated_at=datetime.utcnow(),
            )

    @handle_stripe_errors
    async def create_customer_portal_session(
        self, return_url: Optional[str] = None
    ) -> CustomerPortalResponse:
        """Create a customer portal session for subscription management"""

        if not self.current_user:
            raise PaymentProcessingError("User must be authenticated")

        # Get user's Stripe customer ID
        customer_id = await self._get_or_create_stripe_customer()

        # Create portal session
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url or f"{self.config.domain}/dashboard",
        )

        return CustomerPortalResponse(
            portal_url=session.url,
            expires_at=datetime.utcnow()
            + timedelta(hours=1),  # Portal sessions typically expire in 1 hour
        )



    # User Payment Information
    async def get_user_payment_info(self) -> Dict:
        """Get comprehensive payment information for the current user"""

        if not self.current_user:
            raise PaymentProcessingError("User must be authenticated")

        # Get user's subscription
        subscription_stmt = select(Subscription).where(
            Subscription.user_id == self.current_user.user_id
        )
        subscription_result = await self.db.execute(subscription_stmt)
        subscription = subscription_result.scalar_one_or_none()

        # Get user's purchases
        purchases_stmt = (
            select(Purchase)
            .where(Purchase.user_id == self.current_user.user_id)
            .order_by(Purchase.purchase_date.desc())
            .limit(10)
        )
        purchases_result = await self.db.execute(purchases_stmt)
        purchases = purchases_result.scalars().all()

        # Calculate total spent
        total_spent = sum(
            purchase.amount * 100 for purchase in purchases
        )  # Convert to cents

        return {
            "active_subscription": subscription,
            "recent_payments": purchases,
            "total_spent": int(total_spent),
        }


# Dependency injection
def get_payment_manager(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
    request: Request = None,
) -> PaymentManager:
    return PaymentManager(db_session, current_user, request)
