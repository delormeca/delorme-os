"""
Plan Management Service

Handles user plan upgrades, downgrades, and plan-related operations.
"""

import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.models import User, Purchase, Subscription, SubscriptionStatus
from app.permissions import PlanType, FeaturePermission, get_user_permissions
from app.core.access_control import get_user_current_plan, update_user_plan
from app.schemas.auth import CurrentUserResponse
from app.services.users_service import get_current_user_optional

logger = logging.getLogger(__name__)


class PlanService:
    """Service for managing user plans and permissions"""
    
    def __init__(self, db: AsyncSession, current_user: Optional[CurrentUserResponse]):
        self.db = db
        self.current_user = current_user
    
    async def get_user_plan_info(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get comprehensive plan information for a user.
        If user_id is not provided, use current user.
        """
        if not user_id and not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        target_user_id = user_id or self.current_user.user_id
        user = await self.db.get(User, target_user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get current plan based on purchases and subscriptions
        current_plan = await get_user_current_plan(user, self.db)
        
        # Get all available permissions
        permissions = get_user_permissions(current_plan)
        subscription = user.subscription
        
        # Get active subscription info
        subscription_info = None
        if subscription and subscription.status in ["ACTIVE", "TRIALING"]:
            subscription_info = {
                "id": str(subscription.id),
                "plan": subscription.plan,
                "status": subscription.status.value,
                "start_date": subscription.start_date.isoformat(),
                "end_date": subscription.end_date.isoformat() if subscription.end_date else None,
                "stripe_subscription_id": subscription.stripe_subscription_id,
            }
        
        # Get purchase history
        purchases = []
        for purchase in user.purchases:
            if purchase.is_successful:
                purchases.append({
                    "id": str(purchase.id),
                    "product_type": purchase.product_type,
                    "amount": purchase.amount,
                    "currency": purchase.currency,
                    "purchase_date": purchase.purchase_date.isoformat(),
                    "transaction_id": purchase.transaction_id,
                })
        
        return {
            "user_id": str(user.id),
            "current_plan": current_plan.value,
            "permissions": [p.value for p in permissions],
            "subscription": subscription_info,
            "purchases": purchases,
            "plan_features": self._get_plan_features_info(current_plan),
        }
    
    async def check_feature_access(self, feature: FeaturePermission, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Check if user has access to a specific feature"""
        if not user_id and not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        target_user_id = user_id or self.current_user.user_id
        user = await self.db.get(User, target_user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        current_plan = await get_user_current_plan(user, self.db)
        permissions = get_user_permissions(current_plan)
        has_access = feature in permissions
        
        # Get required plan for this feature
        required_plan = None
        for plan, plan_permissions in self._get_all_plan_features().items():
            if feature in plan_permissions:
                required_plan = plan
                break
        
        return {
            "feature": feature.value,
            "has_access": has_access,
            "current_plan": current_plan.value,
            "required_plan": required_plan.value if required_plan else None,
            "upgrade_needed": not has_access and required_plan is not None,
        }
    
    async def get_available_upgrades(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get available plan upgrades for a user"""
        if not user_id and not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        target_user_id = user_id or self.current_user.user_id
        user = await self.db.get(User, target_user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        current_plan = await get_user_current_plan(user, self.db)
        
        # Define upgrade paths
        upgrade_options = []
        
        if current_plan == PlanType.FREE:
            upgrade_options.extend([
                self._create_upgrade_option(PlanType.STARTER, "One-time purchase"),
                self._create_upgrade_option(PlanType.PRO, "One-time purchase"),
                self._create_upgrade_option(PlanType.PREMIUM, "Monthly subscription"),
                self._create_upgrade_option(PlanType.ENTERPRISE, "Monthly subscription"),
            ])
        elif current_plan == PlanType.STARTER:
            upgrade_options.extend([
                self._create_upgrade_option(PlanType.PRO, "One-time purchase"),
                self._create_upgrade_option(PlanType.PREMIUM, "Monthly subscription"),
                self._create_upgrade_option(PlanType.ENTERPRISE, "Monthly subscription"),
            ])
        elif current_plan == PlanType.PRO:
            upgrade_options.extend([
                self._create_upgrade_option(PlanType.PREMIUM, "Monthly subscription"),
                self._create_upgrade_option(PlanType.ENTERPRISE, "Monthly subscription"),
            ])
        elif current_plan == PlanType.PREMIUM:
            upgrade_options.append(
                self._create_upgrade_option(PlanType.ENTERPRISE, "Monthly subscription")
            )
        
        return upgrade_options
    
    async def handle_successful_purchase(self, purchase_id: str) -> Dict[str, Any]:
        """Handle successful purchase and update user plan"""
        purchase = await self.db.get(Purchase, purchase_id)
        
        if not purchase:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase not found"
            )
        
        user = await self.db.get(User, purchase.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user's plan based on the purchase
        old_plan = get_user_current_plan(user, self.db)
        new_plan = await update_user_plan(user, self.db)
        
        logger.info(f"User {user.id} plan updated from {old_plan.value} to {new_plan.value} due to purchase {purchase_id}")
        
        return {
            "user_id": str(user.id),
            "purchase_id": purchase_id,
            "old_plan": old_plan.value,
            "new_plan": new_plan.value,
            "upgraded": new_plan != old_plan,
        }
    
    async def handle_subscription_change(self, subscription_id: str) -> Dict[str, Any]:
        """Handle subscription status change and update user plan"""
        subscription = await self.db.get(Subscription, subscription_id)
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )
        
        user = await self.db.get(User, subscription.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user's plan based on subscription status
        old_plan = get_user_current_plan(user, self.db)
        new_plan = await update_user_plan(user, self.db)
        
        logger.info(f"User {user.id} plan updated from {old_plan.value} to {new_plan.value} due to subscription change")
        
        return {
            "user_id": str(user.id),
            "subscription_id": subscription_id,
            "old_plan": old_plan.value,
            "new_plan": new_plan.value,
            "changed": new_plan != old_plan,
        }
    
    def _get_plan_features_info(self, plan: PlanType) -> Dict[str, Any]:
        """Get detailed feature information for a plan"""
        permissions = get_user_permissions(plan)
        
        feature_categories = {
            "dashboard": [],
            "content": [],
            "analytics": [],
            "integrations": [],
            "support": [],
            "advanced": [],
        }
        
        # Categorize features
        for permission in permissions:
            if "dashboard" in permission.value:
                feature_categories["dashboard"].append(permission.value)
            elif "article" in permission.value:
                feature_categories["content"].append(permission.value)
            elif "analytics" in permission.value or "reporting" in permission.value:
                feature_categories["analytics"].append(permission.value)
            elif "integration" in permission.value:
                feature_categories["integrations"].append(permission.value)
            elif "support" in permission.value:
                feature_categories["support"].append(permission.value)
            else:
                feature_categories["advanced"].append(permission.value)
        
        return {
            "plan": plan.value,
            "total_features": len(permissions),
            "categories": feature_categories,
        }
    
    def _create_upgrade_option(self, plan: PlanType, billing_type: str) -> Dict[str, Any]:
        """Create upgrade option information"""
        permissions = get_user_permissions(plan)
        
        # This would normally come from your payment configuration
        pricing_info = {
            PlanType.STARTER: {"price": 99, "currency": "USD"},
            PlanType.PRO: {"price": 199, "currency": "USD"},
            PlanType.PREMIUM: {"price": 29, "currency": "USD"},
            PlanType.ENTERPRISE: {"price": 99, "currency": "USD"},
        }
        
        price_info = pricing_info.get(plan, {"price": 0, "currency": "USD"})
        
        return {
            "plan": plan.value,
            "billing_type": billing_type,
            "price": price_info["price"],
            "currency": price_info["currency"],
            "features_count": len(permissions),
            "new_features": self._get_new_features_for_plan(plan),
        }
    
    def _get_new_features_for_plan(self, plan: PlanType) -> List[str]:
        """Get features that are new in this plan compared to lower plans"""
        all_features = self._get_all_plan_features()
        plan_features = set(all_features[plan])
        
        # Get features from lower plans
        lower_plan_features = set()
        plan_hierarchy = [PlanType.FREE, PlanType.STARTER, PlanType.PRO, PlanType.PREMIUM, PlanType.ENTERPRISE]
        
        for lower_plan in plan_hierarchy:
            if lower_plan == plan:
                break
            lower_plan_features.update(all_features[lower_plan])
        
        new_features = plan_features - lower_plan_features
        return [f.value for f in new_features]
    
    def _get_all_plan_features(self) -> Dict[PlanType, List[FeaturePermission]]:
        """Get all plan features mapping"""
        from app.permissions import PLAN_FEATURES
        return PLAN_FEATURES


def get_plan_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
) -> PlanService:
    """Get an instance of the PlanService class."""
    return PlanService(db_session, current_user)
