"""
Plan Upgrade Service

Handles plan upgrades with proper proration, subscription changes, and billing logic.
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any

import stripe
from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.models import User, Subscription, Purchase
from app.permissions import PlanType
from app.core.access_control import get_user_current_plan, update_user_plan
from app.schemas.auth import CurrentUserResponse
from app.services.users_service import get_current_user_optional
from app.config.payments import load_payment_config

logger = logging.getLogger(__name__)
payment_config = load_payment_config()

# Initialize Stripe
if not payment_config.stripe.api_key.endswith("_not_configured"):
    stripe.api_key = payment_config.stripe.api_key


class UpgradeService:
    """Service for handling plan upgrades with proration"""
    
    def __init__(self, db: AsyncSession, current_user: Optional[CurrentUserResponse]):
        self.db = db
        self.current_user = current_user
    
    async def get_upgrade_options(self) -> Dict[str, Any]:
        """
        Get available upgrade options with proration calculations.
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        current_plan = await get_user_current_plan(user, self.db)
        
        # Get current subscription if any
        current_subscription = None
        if user.subscription and user.subscription.status in ["ACTIVE", "TRIALING"]:
            current_subscription = user.subscription
        
        upgrade_options = []
        
        # Define upgrade paths
        if current_plan == PlanType.FREE:
            upgrade_options.extend([
                await self._create_upgrade_option("starter", "one_time", 9900, current_subscription),
                await self._create_upgrade_option("pro", "one_time", 19900, current_subscription),
                await self._create_upgrade_option("premium", "subscription", 2900, current_subscription),
                await self._create_upgrade_option("enterprise", "subscription", 9900, current_subscription),
            ])
        elif current_plan == PlanType.STARTER:
            upgrade_options.extend([
                await self._create_upgrade_option("pro", "one_time", 19900, current_subscription),
                await self._create_upgrade_option("premium", "subscription", 2900, current_subscription),
                await self._create_upgrade_option("enterprise", "subscription", 9900, current_subscription),
            ])
        elif current_plan == PlanType.PRO:
            upgrade_options.extend([
                await self._create_upgrade_option("premium", "subscription", 2900, current_subscription),
                await self._create_upgrade_option("enterprise", "subscription", 9900, current_subscription),
            ])
        elif current_plan == PlanType.PREMIUM:
            upgrade_options.append(
                await self._create_upgrade_option("enterprise", "subscription", 9900, current_subscription)
            )
        
        return {
            "current_plan": current_plan.value,
            "has_active_subscription": current_subscription is not None,
            "upgrade_options": upgrade_options,
        }
    
    async def create_upgrade_checkout(self, target_plan: str) -> Dict[str, Any]:
        """
        Create checkout session for plan upgrade with proper proration.
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        current_plan = await get_user_current_plan(user, self.db)
        current_subscription = user.subscription if user.subscription and user.subscription.status in ["ACTIVE", "TRIALING"] else None
        
        # Validate upgrade path
        if not self._is_valid_upgrade(current_plan, target_plan):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot upgrade from {current_plan.value} to {target_plan}"
            )
        
        # Get or create Stripe customer
        customer_id = await self._get_or_create_customer(user)
        
        # Handle different upgrade scenarios
        if target_plan in ["premium", "enterprise"]:
            return await self._create_subscription_upgrade(user, target_plan, customer_id, current_subscription)
        else:
            return await self._create_one_time_upgrade(user, target_plan, customer_id)
    
    async def _create_subscription_upgrade(
        self, 
        user: User, 
        target_plan: str, 
        customer_id: str, 
        current_subscription: Optional[Subscription]
    ) -> Dict[str, Any]:
        """Create subscription upgrade with proration"""
        
        # Get price ID for target plan
        price_id = self._get_price_id_for_plan(target_plan)
        if not price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Price configuration not found for {target_plan}"
            )
        
        if current_subscription:
            # Upgrade existing subscription with proration
            try:
                # Calculate proration preview
                proration_preview = stripe.Invoice.upcoming(
                    customer=customer_id,
                    subscription=current_subscription.stripe_subscription_id,
                    subscription_items=[{
                        'id': current_subscription.stripe_subscription_id,
                        'price': price_id,
                    }],
                )
                
                # Create checkout session for subscription change
                session = stripe.checkout.Session.create(
                    customer=customer_id,
                    mode='subscription',
                    line_items=[{
                        'price': price_id,
                        'quantity': 1,
                    }],
                    success_url=f"{payment_config.domain}/dashboard/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                    cancel_url=f"{payment_config.domain}/dashboard/payment/cancel",
                    metadata={
                        "user_id": str(user.id),
                        "product_id": target_plan,
                        "upgrade_type": "subscription_change",
                        "old_plan": current_subscription.plan,
                        "new_plan": target_plan,
                    },
                    subscription_data={
                        "metadata": {
                            "user_id": str(user.id),
                            "plan": target_plan,
                        },
                    },
                )
                
                # Calculate proration amount
                proration_amount = sum(
                    line.amount for line in proration_preview.lines.data 
                    if line.proration
                )
                
                return {
                    "session_id": session.id,
                    "url": session.url,
                    "upgrade_type": "subscription_change",
                    "proration": {
                        "amount_cents": proration_amount,
                        "amount_formatted": f"${proration_amount / 100:.2f}",
                        "description": "Prorated amount for immediate upgrade",
                        "billing_cycle_adjustment": True,
                    },
                }
                
            except stripe.StripeError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create upgrade session: {str(e)}"
                )
        else:
            # Create new subscription
            try:
                session = stripe.checkout.Session.create(
                    customer=customer_id,
                    mode='subscription',
                    line_items=[{
                        'price': price_id,
                        'quantity': 1,
                    }],
                    success_url=f"{payment_config.domain}/dashboard/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                    cancel_url=f"{payment_config.domain}/dashboard/payment/cancel",
                    metadata={
                        "user_id": str(user.id),
                        "product_id": target_plan,
                        "upgrade_type": "new_subscription",
                        "old_plan": "none",
                        "new_plan": target_plan,
                    },
                    subscription_data={
                        "trial_period_days": 14 if target_plan == "premium" else 30,
                        "metadata": {
                            "user_id": str(user.id),
                            "plan": target_plan,
                        },
                    },
                )
                
                return {
                    "session_id": session.id,
                    "url": session.url,
                    "upgrade_type": "new_subscription",
                    "trial": {
                        "days": 14 if target_plan == "premium" else 30,
                        "description": f"Start with a free {14 if target_plan == 'premium' else 30}-day trial",
                    },
                }
                
            except stripe.StripeError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create subscription: {str(e)}"
                )
    
    async def _create_one_time_upgrade(self, user: User, target_plan: str, customer_id: str) -> Dict[str, Any]:
        """Create one-time payment upgrade"""
        
        price_id = self._get_price_id_for_plan(target_plan)
        if not price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Price configuration not found for {target_plan}"
            )
        
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                mode='payment',
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                success_url=f"{payment_config.domain}/dashboard/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{payment_config.domain}/dashboard/payment/cancel",
                metadata={
                    "user_id": str(user.id),
                    "product_id": target_plan,
                    "upgrade_type": "one_time_upgrade",
                    "new_plan": target_plan,
                },
            )
            
            return {
                "session_id": session.id,
                "url": session.url,
                "upgrade_type": "one_time_upgrade",
                "payment": {
                    "amount_cents": self._get_plan_price(target_plan),
                    "description": f"One-time payment for {target_plan} plan",
                    "immediate_access": True,
                },
            }
            
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create payment session: {str(e)}"
            )
    
    async def get_proration_preview(self, target_plan: str) -> Dict[str, Any]:
        """
        Get proration preview for subscription upgrade without creating checkout.
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        current_subscription = user.subscription if user.subscription and user.subscription.status in ["ACTIVE", "TRIALING"] else None
        
        if not current_subscription:
            return {
                "has_subscription": False,
                "message": "No active subscription to upgrade",
            }
        
        price_id = self._get_price_id_for_plan(target_plan)
        if not price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Price configuration not found for {target_plan}"
            )
        
        try:
            # Get proration preview from Stripe
            upcoming_invoice = stripe.Invoice.upcoming(
                customer=user.stripe_customer_id,
                subscription=current_subscription.stripe_subscription_id,
                subscription_items=[{
                    'id': current_subscription.stripe_subscription_id,
                    'price': price_id,
                }],
            )
            
            proration_amount = sum(
                line.amount for line in upcoming_invoice.lines.data 
                if line.proration
            )
            
            return {
                "has_subscription": True,
                "current_plan": current_subscription.plan,
                "target_plan": target_plan,
                "proration": {
                    "amount_cents": proration_amount,
                    "amount_formatted": f"${proration_amount / 100:.2f}",
                    "description": "Prorated amount for immediate upgrade",
                    "next_billing_date": datetime.fromtimestamp(upcoming_invoice.next_payment_attempt).isoformat(),
                    "explanation": self._get_proration_explanation(current_subscription.plan, target_plan, proration_amount),
                },
            }
            
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to calculate proration: {str(e)}"
            )
    
    # Helper methods
    
    def _is_valid_upgrade(self, current_plan: PlanType, target_plan: str) -> bool:
        """Check if upgrade path is valid"""
        valid_upgrades = {
            PlanType.FREE: ["starter", "pro", "premium", "enterprise"],
            PlanType.STARTER: ["pro", "premium", "enterprise"],
            PlanType.PRO: ["premium", "enterprise"],
            PlanType.PREMIUM: ["enterprise"],
            PlanType.ENTERPRISE: [],
        }
        
        return target_plan in valid_upgrades.get(current_plan, [])
    
    def _get_price_id_for_plan(self, plan: str) -> Optional[str]:
        """Get Stripe price ID for a plan"""
        from app.config.payments import PaymentSettings
        settings = PaymentSettings()
        
        price_mapping = {
            "starter": settings.stripe_price_starter,
            "pro": settings.stripe_price_pro,
            "premium": settings.stripe_price_premium_sub,
            "enterprise": settings.stripe_price_enterprise_sub,
        }
        
        return price_mapping.get(plan)
    
    def _get_plan_price(self, plan: str) -> int:
        """Get plan price in cents"""
        prices = {
            "starter": 9900,  # $99
            "pro": 19900,     # $199
            "premium": 2900,   # $29/month
            "enterprise": 9900, # $99/month
        }
        
        return prices.get(plan, 0)
    
    async def _create_upgrade_option(
        self, 
        plan: str, 
        billing_type: str, 
        price_cents: int, 
        current_subscription: Optional[Subscription]
    ) -> Dict[str, Any]:
        """Create upgrade option with proration info"""
        
        option = {
            "plan": plan,
            "billing_type": billing_type,
            "price_cents": price_cents,
            "price_formatted": f"${price_cents / 100:.0f}",
            "features": self._get_plan_features(plan),
        }
        
        # Add proration info for subscription upgrades
        if billing_type == "subscription" and current_subscription:
            try:
                # Calculate proration for preview
                price_id = self._get_price_id_for_plan(plan)
                if price_id and current_subscription.stripe_subscription_id:
                    upcoming = stripe.Invoice.upcoming(
                        customer=current_subscription.stripe_customer_id,
                        subscription=current_subscription.stripe_subscription_id,
                        subscription_items=[{
                            'id': current_subscription.stripe_subscription_id,
                            'price': price_id,
                        }],
                    )
                    
                    proration_amount = sum(
                        line.amount for line in upcoming.lines.data 
                        if line.proration
                    )
                    
                    option["proration"] = {
                        "amount_cents": proration_amount,
                        "amount_formatted": f"${proration_amount / 100:.2f}",
                        "explanation": f"You'll be charged ${proration_amount / 100:.2f} today for the upgrade, then ${price_cents / 100:.0f}/month going forward.",
                    }
            except stripe.StripeError:
                # If proration calculation fails, provide estimate
                option["proration"] = {
                    "amount_cents": price_cents,
                    "amount_formatted": f"${price_cents / 100:.2f}",
                    "explanation": f"Estimated charge: ${price_cents / 100:.2f} (prorated for current billing cycle)",
                }
        
        return option
    
    def _get_proration_explanation(self, current_plan: str, target_plan: str, proration_amount: int) -> str:
        """Generate user-friendly proration explanation"""
        if proration_amount > 0:
            return (
                f"You'll be charged ${proration_amount / 100:.2f} today for upgrading from "
                f"{current_plan} to {target_plan}. This covers the remaining days in your current "
                f"billing cycle at the new plan rate."
            )
        else:
            return (
                f"No additional charge today! Your upgrade to {target_plan} will take effect "
                f"immediately, and you'll be billed the new rate on your next billing cycle."
            )
    
    def _get_plan_features(self, plan: str) -> list[str]:
        """Get key features for a plan"""
        features = {
            "starter": [
                "Article creation & management",
                "Basic analytics dashboard", 
                "Email templates",
                "Basic documentation",
            ],
            "pro": [
                "Everything in Starter",
                "Advanced analytics & reporting",
                "Full API access",
                "Advanced dashboard features",
                "Priority support",
            ],
            "premium": [
                "Everything in Pro",
                "Premium integrations",
                "Advanced reporting & export",
                "Team collaboration",
                "Monthly feature updates",
            ],
            "enterprise": [
                "Everything in Premium",
                "Team analytics & management",
                "Custom integrations",
                "Enterprise SSO",
                "Dedicated support",
                "White-label options",
            ],
        }
        
        return features.get(plan, [])
    
    async def _get_or_create_customer(self, user: User) -> str:
        """Get or create Stripe customer"""
        if user.stripe_customer_id:
            return user.stripe_customer_id
        
        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name,
            metadata={"user_id": str(user.id)},
        )
        
        user.stripe_customer_id = customer.id
        self.db.add(user)
        await self.db.commit()
        
        return customer.id


def get_upgrade_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
) -> UpgradeService:
    """Get an instance of the UpgradeService class."""
    return UpgradeService(db_session, current_user)
