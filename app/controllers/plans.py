"""
Plan Management Controller

Handles API endpoints for plan information, feature access checks, and upgrade recommendations.
"""

from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.permissions import FeaturePermission
from app.services.plan_service import PlanService, get_plan_service
from app.services.users_service import get_current_user
from app.schemas.auth import CurrentUserResponse

# Create router
plans_router = APIRouter(prefix="/api/plans", tags=["plans"])


# Request/Response schemas
class FeatureAccessRequest(BaseModel):
    feature: str


class FeatureAccessResponse(BaseModel):
    feature: str
    has_access: bool
    current_plan: str
    required_plan: Optional[str]
    upgrade_needed: bool


class PlanInfoResponse(BaseModel):
    user_id: str
    current_plan: str
    permissions: List[str]
    subscription: Optional[Dict[str, Any]]
    purchases: List[Dict[str, Any]]
    plan_features: Dict[str, Any]


class UpgradeOptionResponse(BaseModel):
    plan: str
    billing_type: str
    price: int
    currency: str
    features_count: int
    new_features: List[str]


# Endpoints

@plans_router.get("/me", response_model=PlanInfoResponse)
async def get_my_plan_info(
    current_user: CurrentUserResponse = Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
):
    """
    Get comprehensive plan information for the current user.
    
    Returns:
    - Current plan level
    - Available permissions
    - Active subscription details
    - Purchase history
    - Feature breakdown by category
    """
    return await plan_service.get_user_plan_info()


@plans_router.post("/check-feature", response_model=FeatureAccessResponse)
async def check_feature_access(
    request: FeatureAccessRequest,
    current_user: CurrentUserResponse = Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
):
    """
    Check if the current user has access to a specific feature.
    
    This endpoint is useful for frontend components to determine
    whether to show certain features or upgrade prompts.
    """
    try:
        feature = FeaturePermission(request.feature)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid feature: {request.feature}"
        )
    
    result = await plan_service.check_feature_access(feature)
    return FeatureAccessResponse(**result)


@plans_router.get("/upgrades", response_model=List[UpgradeOptionResponse])
async def get_available_upgrades(
    current_user: CurrentUserResponse = Depends(get_current_user),
    plan_service: PlanService = Depends(get_plan_service),
):
    """
    Get available plan upgrades for the current user.
    
    Returns upgrade options with pricing and feature information.
    Useful for displaying upgrade prompts and pricing pages.
    """
    upgrades = await plan_service.get_available_upgrades()
    return [UpgradeOptionResponse(**upgrade) for upgrade in upgrades]


@plans_router.get("/features")
async def get_all_features(
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Get all available features and their descriptions.
    
    Useful for displaying feature comparison tables.
    """
    features = {}
    
    for feature in FeaturePermission:
        features[feature.value] = {
            "name": feature.value.replace("_", " ").title(),
            "description": _get_feature_description(feature),
            "category": _get_feature_category(feature),
        }
    
    return features


@plans_router.get("/comparison")
async def get_plan_comparison():
    """
    Get a comparison of all plans and their features.
    
    Useful for pricing pages and plan comparison tables.
    """
    from app.permissions import PLAN_FEATURES, PlanType
    
    comparison = {}
    
    for plan, permissions in PLAN_FEATURES.items():
        comparison[plan.value] = {
            "name": plan.value.title(),
            "features": [p.value for p in permissions],
            "feature_count": len(permissions),
            "category": _get_plan_category(plan),
        }
    
    return comparison


# Helper functions

def _get_feature_description(feature: FeaturePermission) -> str:
    """Get user-friendly description for a feature"""
    descriptions = {
        FeaturePermission.BASIC_DASHBOARD: "Access to basic dashboard with essential metrics",
        FeaturePermission.USER_PROFILE: "Manage your user profile and settings",
        FeaturePermission.BASIC_ARTICLES: "Create and view basic articles",
        FeaturePermission.ARTICLE_MANAGEMENT: "Full article management with publishing controls",
        FeaturePermission.BASIC_ANALYTICS: "Basic analytics and reporting",
        FeaturePermission.EMAIL_TEMPLATES: "Access to email template system",
        FeaturePermission.ADVANCED_DASHBOARD: "Advanced dashboard with detailed insights",
        FeaturePermission.MULTI_TENANT: "Multi-tenant architecture support",
        FeaturePermission.API_ACCESS: "Full API access for integrations",
        FeaturePermission.ADVANCED_ANALYTICS: "Advanced analytics with custom reports",
        FeaturePermission.PRIORITY_SUPPORT: "Priority customer support",
        FeaturePermission.PREMIUM_INTEGRATIONS: "Access to premium third-party integrations",
        FeaturePermission.CUSTOM_COMPONENTS: "Custom UI components library",
        FeaturePermission.ADVANCED_REPORTING: "Advanced reporting and data export",
        FeaturePermission.TEAM_COLLABORATION: "Team collaboration features",
        FeaturePermission.WHITE_LABEL: "White-label customization options",
        FeaturePermission.CUSTOM_INTEGRATIONS: "Custom integration development",
        FeaturePermission.DEDICATED_SUPPORT: "Dedicated support representative",
        FeaturePermission.TEAM_MANAGEMENT: "Advanced team management tools",
        FeaturePermission.SLA_GUARANTEE: "Service level agreement guarantee",
        FeaturePermission.AUDIT_LOGS: "Comprehensive audit logging",
    }
    
    return descriptions.get(feature, "Feature description not available")


def _get_feature_category(feature: FeaturePermission) -> str:
    """Get category for a feature"""
    if "dashboard" in feature.value:
        return "Dashboard"
    elif "article" in feature.value:
        return "Content Management"
    elif "analytics" in feature.value or "reporting" in feature.value:
        return "Analytics & Reporting"
    elif "integration" in feature.value:
        return "Integrations"
    elif "support" in feature.value:
        return "Support"
    elif "team" in feature.value:
        return "Team Management"
    else:
        return "Advanced Features"


def _get_plan_category(plan) -> str:
    """Get category for a plan"""
    from app.permissions import PlanType
    
    categories = {
        PlanType.FREE: "Free",
        PlanType.STARTER: "One-time Purchase",
        PlanType.PRO: "One-time Purchase",
        PlanType.PREMIUM: "Monthly Subscription",
        PlanType.ENTERPRISE: "Monthly Subscription",
    }
    
    return categories.get(plan, "Unknown")
