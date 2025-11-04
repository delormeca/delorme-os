"""
Access Control System for Plan-based Features

This module provides decorators and utilities for controlling access to features
based on user plans and permissions.
"""

import functools
import logging
from typing import Optional, Union

from fastapi import HTTPException, status
from sqlmodel import Session

from app.models import User, Subscription, Purchase
from app.permissions import PlanType, FeaturePermission, user_has_permission
from app.schemas.auth import CurrentUserResponse

logger = logging.getLogger(__name__)


class AccessDeniedError(HTTPException):
    """Custom exception for access denied scenarios"""
    
    def __init__(self, message: str, required_plan: Optional[PlanType] = None):
        detail = {
            "error": "access_denied",
            "message": message,
            "required_plan": required_plan.value if required_plan else None,
        }
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


async def get_user_current_plan(user: User, db: Session) -> PlanType:
    """
    Determine user's current plan based on purchases and active subscriptions.
    
    Business Logic:
    1. Check for active subscriptions first (Enterprise > Premium)
    2. If no active subscription, check one-time purchases (Pro > Starter)
    3. Default to FREE if no purchases/subscriptions
    """
    subscription = user.subscription
    
    # Check for active subscriptions (highest priority)
    if subscription:
        if subscription.status in ["ACTIVE", "TRIALING"]:
            if subscription.plan in ["enterprise"]:
                return PlanType.ENTERPRISE
            elif subscription.plan in ["premium"]:
                return PlanType.PREMIUM
    
    # Check for one-time purchases
    successful_purchases = [
        p for p in user.purchases 
        if p.is_successful
    ]
    
    if successful_purchases:
        # Get the highest tier purchase
        if any(p.product_type == "pro" for p in successful_purchases):
            return PlanType.PRO
        elif any(p.product_type == "starter" for p in successful_purchases):
            return PlanType.STARTER
    
    return PlanType.FREE


async def update_user_plan(user: User, db: Session) -> PlanType:
    """Update user's current_plan field based on their purchases/subscriptions"""
    current_plan = await get_user_current_plan(user, db)
    user.current_plan = current_plan
    db.add(user)
    await db.commit()
    return current_plan


def require_permission(permission: FeaturePermission):
    """
    Decorator to require a specific permission for accessing an endpoint.
    
    Usage:
        @require_permission(FeaturePermission.ADVANCED_ANALYTICS)
        async def get_advanced_analytics(user: User = Depends(get_current_user)):
            return analytics_data
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from function arguments
            user = None
            db = None
            
            # Look for User and Session objects in arguments
            for arg in args + tuple(kwargs.values()):
                if isinstance(arg, User):
                    user = arg
                elif isinstance(arg, Session):
                    db = arg
                elif isinstance(arg, CurrentUserResponse):
                    # Handle CurrentUserResponse - need to fetch full User object
                    # This will be handled by the service layer
                    pass
            
            if not user:
                # Check if we have CurrentUserResponse and db session
                current_user_response = None
                for arg in args + tuple(kwargs.values()):
                    if isinstance(arg, CurrentUserResponse):
                        current_user_response = arg
                        break
                
                if current_user_response and db:
                    user = db.get(User, current_user_response.user_id)
            
            if not user:
                raise AccessDeniedError("Authentication required")
            
            if not db:
                raise AccessDeniedError("Database session required")
            
            # Get user's current plan
            current_plan = await get_user_current_plan(user, db)
            
            # Check permission
            if not user_has_permission(current_plan, permission):
                required_plan = _get_minimum_plan_for_permission(permission)
                raise AccessDeniedError(
                    f"This feature requires {required_plan.value} plan or higher",
                    required_plan=required_plan
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_plan(min_plan: PlanType):
    """
    Decorator to require a minimum plan level for accessing an endpoint.
    
    Usage:
        @require_plan(PlanType.PRO)
        async def pro_feature(user: User = Depends(get_current_user)):
            return pro_data
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user and db from function arguments
            user = None
            db = None
            
            for arg in args + tuple(kwargs.values()):
                if isinstance(arg, User):
                    user = arg
                elif isinstance(arg, Session):
                    db = arg
            
            if not user or not db:
                raise AccessDeniedError("Authentication and database session required")
            
            # Get user's current plan
            current_plan = await get_user_current_plan(user, db)
            
            # Check if user's plan meets minimum requirement
            if not _plan_meets_requirement(current_plan, min_plan):
                raise AccessDeniedError(
                    f"This feature requires {min_plan.value} plan or higher",
                    required_plan=min_plan
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


async def check_user_permission(user: User, permission: FeaturePermission, db: Session) -> bool:
    """Check if a user has a specific permission"""
    current_plan = await get_user_current_plan(user, db)
    return user_has_permission(current_plan, permission)


async def check_user_plan(user: User, min_plan: PlanType, db: Session) -> bool:
    """Check if user meets minimum plan requirement"""
    current_plan = await get_user_current_plan(user, db)
    return _plan_meets_requirement(current_plan, min_plan)


async def get_upgrade_recommendation(user: User, permission: FeaturePermission, db: Session) -> dict:
    """Get upgrade recommendation for accessing a feature"""
    current_plan = await get_user_current_plan(user, db)
    required_plan = _get_minimum_plan_for_permission(permission)
    
    return {
        "current_plan": current_plan.value,
        "required_plan": required_plan.value if required_plan else None,
        "needs_upgrade": required_plan and not _plan_meets_requirement(current_plan, required_plan),
        "feature": permission.value,
    }


# Helper functions

def _plan_meets_requirement(current_plan: PlanType, required_plan: PlanType) -> bool:
    """Check if current plan meets the required plan level"""
    plan_hierarchy = {
        PlanType.FREE: 0,
        PlanType.STARTER: 1,
        PlanType.PRO: 2,
        PlanType.PREMIUM: 3,
        PlanType.ENTERPRISE: 4,
    }
    
    return plan_hierarchy.get(current_plan, 0) >= plan_hierarchy.get(required_plan, 0)


def _get_minimum_plan_for_permission(permission: FeaturePermission) -> Optional[PlanType]:
    """Get the minimum plan that has a specific permission"""
    from app.permissions import PLAN_FEATURES
    
    for plan, permissions in PLAN_FEATURES.items():
        if permission in permissions:
            return plan
    return None


class PlanChecker:
    """Utility class for checking user plans and permissions in services"""
    
    def __init__(self, user: User, db: Session, current_plan: PlanType):
        self.user = user
        self.db = db
        self.current_plan = current_plan
    
    def has_permission(self, permission: FeaturePermission) -> bool:
        """Check if user has specific permission"""
        return user_has_permission(self.current_plan, permission)
    
    def has_plan(self, min_plan: PlanType) -> bool:
        """Check if user meets minimum plan requirement"""
        return _plan_meets_requirement(self.current_plan, min_plan)
    
    def require_permission(self, permission: FeaturePermission) -> None:
        """Raise exception if user doesn't have permission"""
        if not self.has_permission(permission):
            required_plan = _get_minimum_plan_for_permission(permission)
            raise AccessDeniedError(
                f"This feature requires {required_plan.value} plan or higher",
                required_plan=required_plan
            )
    
    def require_plan(self, min_plan: PlanType) -> None:
        """Raise exception if user doesn't meet plan requirement"""
        if not self.has_plan(min_plan):
            raise AccessDeniedError(
                f"This feature requires {min_plan.value} plan or higher",
                required_plan=min_plan
            )
    
    def get_upgrade_info(self, permission: FeaturePermission) -> dict:
        """Get information about required upgrade for a feature"""
        return get_upgrade_recommendation(self.user, permission, self.db)
