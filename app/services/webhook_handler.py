"""
Stripe Webhook Handler - Secure processing of Stripe webhooks
Handles all subscription and payment related webhook events
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

import stripe
from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.payments import payment_config
from app.core.exceptions import (PaymentErrorContext, PaymentProcessingError,
                                 WebhookValidationError)
from app.db import get_async_db_session
from app.models import Purchase, Subscription, User
from app.schemas.payment import WebhookEventResponse, WebhookEventType

logger = logging.getLogger(__name__)

# Initialize Stripe conditionally
if not payment_config.stripe.api_key.endswith("_not_configured"):
    stripe.api_key = payment_config.stripe.api_key


class WebhookHandler:
    """
    Handles Stripe webhook events with proper validation and processing
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.config = payment_config

    async def handle_webhook(self, request: Request) -> WebhookEventResponse:
        """
        Main webhook handler that validates and processes Stripe events
        """
        # Check if Stripe is configured
        if self.config.stripe.webhook_secret.endswith("_not_configured"):
            raise WebhookValidationError("Stripe webhook secret is not configured")

        # Get the raw payload and signature
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        if not sig_header:
            raise WebhookValidationError("Missing stripe-signature header")

        # Validate the webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.config.stripe.webhook_secret
            )
        except ValueError as e:
            raise WebhookValidationError(f"Invalid payload: {str(e)}")
        except stripe.error.SignatureVerificationError as e:
            raise WebhookValidationError(f"Invalid signature: {str(e)}")

        event_type = event["type"]
        event_data = event["data"]["object"]

        logger.info(
            f"Processing webhook event: {event_type}",
            extra={
                "event_id": event["id"],
                "event_type": event_type,
                "object_id": event_data.get("id"),
            },
        )

        # Process the event based on its type
        processed = await self._process_event(event_type, event_data, event["id"])

        return WebhookEventResponse(
            event_id=event["id"],
            event_type=event_type,
            processed=processed,
            message=(
                f"Successfully processed {event_type}"
                if processed
                else f"Ignored {event_type}"
            ),
        )

    async def _process_event(
        self, event_type: str, event_data: Dict[str, Any], event_id: str
    ) -> bool:
        """
        Process individual webhook events
        """
        try:
            # Payment Intent Events
            if event_type == WebhookEventType.PAYMENT_INTENT_SUCCEEDED:
                return await self._handle_payment_intent_succeeded(event_data)

            elif event_type == WebhookEventType.PAYMENT_INTENT_PAYMENT_FAILED:
                return await self._handle_payment_intent_failed(event_data)

            # Checkout Session Events
            elif event_type == WebhookEventType.CHECKOUT_SESSION_COMPLETED:
                return await self._handle_checkout_session_completed(event_data)

            elif event_type == WebhookEventType.CHECKOUT_SESSION_EXPIRED:
                return await self._handle_checkout_session_expired(event_data)

            # Subscription Events
            elif event_type == WebhookEventType.CUSTOMER_SUBSCRIPTION_CREATED:
                return await self._handle_subscription_created(event_data)

            elif event_type == WebhookEventType.CUSTOMER_SUBSCRIPTION_UPDATED:
                return await self._handle_subscription_updated(event_data)

            elif event_type == WebhookEventType.CUSTOMER_SUBSCRIPTION_DELETED:
                return await self._handle_subscription_deleted(event_data)

            elif event_type == WebhookEventType.CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END:
                return await self._handle_subscription_trial_will_end(event_data)

            # Invoice Events
            elif event_type == WebhookEventType.INVOICE_PAYMENT_SUCCEEDED:
                return await self._handle_invoice_payment_succeeded(event_data)

            elif event_type == WebhookEventType.INVOICE_PAYMENT_FAILED:
                return await self._handle_invoice_payment_failed(event_data)

            # Customer Events
            elif event_type == WebhookEventType.CUSTOMER_CREATED:
                return await self._handle_customer_created(event_data)

            elif event_type == WebhookEventType.CUSTOMER_UPDATED:
                return await self._handle_customer_updated(event_data)

            elif event_type == WebhookEventType.CUSTOMER_DELETED:
                return await self._handle_customer_deleted(event_data)

            else:
                logger.info(f"Unhandled webhook event type: {event_type}")
                return False

        except Exception as e:
            logger.error(
                f"Error processing webhook event {event_type}: {str(e)}",
                extra={"event_id": event_id, "event_type": event_type, "error": str(e)},
            )
            raise PaymentProcessingError(f"Failed to process webhook event: {str(e)}")

    # Payment Intent Handlers
    async def _handle_payment_intent_succeeded(
        self, payment_intent: Dict[str, Any]
    ) -> bool:
        """Handle successful payment intent"""

        payment_intent_id = payment_intent["id"]

        with PaymentErrorContext(
            "payment_intent_succeeded", payment_intent_id=payment_intent_id
        ):

            # Find the corresponding purchase
            stmt = select(Purchase).where(Purchase.transaction_id == payment_intent_id)
            result = await self.db.execute(stmt)
            purchase = result.scalar_one_or_none()

            if purchase:
                purchase.is_successful = True
                await self.db.commit()

                logger.info(f"Marked purchase {purchase.id} as successful")
                return True

            logger.warning(f"No purchase found for payment intent {payment_intent_id}")
            return False

    async def _handle_payment_intent_failed(
        self, payment_intent: Dict[str, Any]
    ) -> bool:
        """Handle failed payment intent"""

        payment_intent_id = payment_intent["id"]

        with PaymentErrorContext(
            "payment_intent_failed", payment_intent_id=payment_intent_id
        ):

            # Find the corresponding purchase
            stmt = select(Purchase).where(Purchase.transaction_id == payment_intent_id)
            result = await self.db.execute(stmt)
            purchase = result.scalar_one_or_none()

            if purchase:
                purchase.is_successful = False
                await self.db.commit()

                logger.info(f"Marked purchase {purchase.id} as failed")
                return True

            logger.warning(f"No purchase found for payment intent {payment_intent_id}")
            return False

    # Checkout Session Handlers
    async def _handle_checkout_session_completed(self, session: Dict[str, Any]) -> bool:
        """Handle completed checkout session"""

        session_id = session["id"]

        # This is typically handled by the success callback,
        # but we can use this as a backup or for logging
        logger.info(f"Checkout session {session_id} completed")
        return True

    async def _handle_checkout_session_expired(self, session: Dict[str, Any]) -> bool:
        """Handle expired checkout session"""

        session_id = session["id"]
        logger.info(f"Checkout session {session_id} expired")
        return True

    # Subscription Handlers
    async def _handle_subscription_created(
        self, subscription_data: Dict[str, Any]
    ) -> bool:
        """Handle new subscription creation"""

        stripe_subscription_id = subscription_data["id"]
        customer_id = subscription_data["customer"]

        with PaymentErrorContext(
            "subscription_created", subscription_id=stripe_subscription_id
        ):

            # Find the user by customer ID
            user = await self._find_user_by_customer_id(customer_id)
            if not user:
                logger.warning(f"No user found for customer {customer_id}")
                return False

            # Check if subscription already exists
            stmt = select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_subscription_id
            )
            result = await self.db.execute(stmt)
            existing_subscription = result.scalar_one_or_none()

            if not existing_subscription:
                # Create new subscription record
                subscription = Subscription(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    stripe_subscription_id=stripe_subscription_id,
                    plan=self._extract_plan_from_subscription(subscription_data),
                    status=self._map_subscription_status(subscription_data["status"]),
                    start_date=datetime.fromtimestamp(
                        subscription_data["current_period_start"]
                    ),
                    end_date=datetime.fromtimestamp(
                        subscription_data["current_period_end"]
                    ),
                )

                self.db.add(subscription)
                await self.db.commit()

                logger.info(
                    f"Created subscription {subscription.id} for user {user.id}"
                )

            return True

    async def _handle_subscription_updated(
        self, subscription_data: Dict[str, Any]
    ) -> bool:
        """Handle subscription updates"""

        stripe_subscription_id = subscription_data["id"]

        with PaymentErrorContext(
            "subscription_updated", subscription_id=stripe_subscription_id
        ):

            # Find the subscription
            stmt = select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_subscription_id
            )
            result = await self.db.execute(stmt)
            subscription = result.scalar_one_or_none()

            if subscription:
                # Update subscription details
                subscription.status = self._map_subscription_status(
                    subscription_data["status"]
                )
                subscription.start_date = datetime.fromtimestamp(
                    subscription_data["current_period_start"]
                )
                subscription.end_date = datetime.fromtimestamp(
                    subscription_data["current_period_end"]
                )

                await self.db.commit()

                logger.info(f"Updated subscription {subscription.id}")
                return True

            logger.warning(f"No subscription found for {stripe_subscription_id}")
            return False

    async def _handle_subscription_deleted(
        self, subscription_data: Dict[str, Any]
    ) -> bool:
        """Handle subscription cancellation"""

        stripe_subscription_id = subscription_data["id"]

        with PaymentErrorContext(
            "subscription_deleted", subscription_id=stripe_subscription_id
        ):

            # Find the subscription
            stmt = select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_subscription_id
            )
            result = await self.db.execute(stmt)
            subscription = result.scalar_one_or_none()

            if subscription:
                subscription.status = self._map_subscription_status("canceled")
                subscription.end_date = datetime.utcnow()

                await self.db.commit()

                logger.info(f"Canceled subscription {subscription.id}")
                return True

            logger.warning(f"No subscription found for {stripe_subscription_id}")
            return False

    async def _handle_subscription_trial_will_end(
        self, subscription_data: Dict[str, Any]
    ) -> bool:
        """Handle trial ending notification"""

        stripe_subscription_id = subscription_data["id"]

        # Here you could send email notifications to users about trial ending
        logger.info(f"Trial will end for subscription {stripe_subscription_id}")

        # You could trigger email notifications here
        # await self._send_trial_ending_notification(subscription_data)

        return True

    # Invoice Handlers
    async def _handle_invoice_payment_succeeded(self, invoice: Dict[str, Any]) -> bool:
        """Handle successful invoice payment"""

        subscription_id = invoice.get("subscription")
        if not subscription_id:
            return False

        # Update subscription status and period
        stmt = select(Subscription).where(
            Subscription.stripe_subscription_id == subscription_id
        )
        result = await self.db.execute(stmt)
        subscription = result.scalar_one_or_none()

        if subscription:
            subscription.status = self._map_subscription_status("active")

            # Update period if available
            if invoice.get("period_start") and invoice.get("period_end"):
                subscription.start_date = datetime.fromtimestamp(
                    invoice["period_start"]
                )
                subscription.end_date = datetime.fromtimestamp(invoice["period_end"])

            await self.db.commit()

            logger.info(
                f"Updated subscription {subscription.id} after successful invoice payment"
            )
            return True

        return False

    async def _handle_invoice_payment_failed(self, invoice: Dict[str, Any]) -> bool:
        """Handle failed invoice payment"""

        subscription_id = invoice.get("subscription")
        if not subscription_id:
            return False

        # Update subscription status
        stmt = select(Subscription).where(
            Subscription.stripe_subscription_id == subscription_id
        )
        result = await self.db.execute(stmt)
        subscription = result.scalar_one_or_none()

        if subscription:
            subscription.status = self._map_subscription_status("past_due")
            await self.db.commit()

            logger.info(f"Marked subscription {subscription.id} as past due")

            # You could trigger payment retry notifications here
            # await self._send_payment_failed_notification(subscription)

            return True

        return False

    # Customer Handlers
    async def _handle_customer_created(self, customer: Dict[str, Any]) -> bool:
        """Handle customer creation"""

        customer_id = customer["id"]
        logger.info(f"Customer {customer_id} created in Stripe")
        return True

    async def _handle_customer_updated(self, customer: Dict[str, Any]) -> bool:
        """Handle customer updates"""

        customer_id = customer["id"]
        logger.info(f"Customer {customer_id} updated in Stripe")
        return True

    async def _handle_customer_deleted(self, customer: Dict[str, Any]) -> bool:
        """Handle customer deletion"""

        customer_id = customer["id"]

        # Find and update user
        user = await self._find_user_by_customer_id(customer_id)
        if user:
            user.stripe_customer_id = None
            await self.db.commit()

            logger.info(f"Removed Stripe customer ID from user {user.id}")
            return True

        return False

    # Helper Methods
    async def _find_user_by_customer_id(self, customer_id: str) -> Optional[User]:
        """Find user by Stripe customer ID"""

        stmt = select(User).where(User.stripe_customer_id == customer_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    def _extract_plan_from_subscription(self, subscription_data: Dict[str, Any]) -> str:
        """Extract plan ID from subscription data"""

        items = subscription_data.get("items", {}).get("data", [])
        if items:
            price_id = items[0].get("price", {}).get("id")

            # Map price ID to plan ID
            for plan_id, product_config in self.config.products.items():
                if product_config.stripe_price_id == price_id:
                    return plan_id

        return "unknown"

    def _map_subscription_status(self, stripe_status: str) -> str:
        """Map Stripe subscription status to our status"""

        status_mapping = {
            "active": "ACTIVE",
            "past_due": "PAST_DUE",
            "unpaid": "UNPAID",
            "canceled": "CANCELED",
            "incomplete": "INCOMPLETE",
            "incomplete_expired": "INCOMPLETE_EXPIRED",
            "trialing": "TRIALING",
        }

        return status_mapping.get(stripe_status, "EXPIRED")


# Dependency injection
def get_webhook_handler(
    db_session: AsyncSession = Depends(get_async_db_session),
) -> WebhookHandler:
    return WebhookHandler(db_session)
