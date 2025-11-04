import enum
from typing import List, Optional


class PlanType(enum.Enum):
    """User plan types based on purchases and subscriptions"""
    FREE = "free"                    # Default - no purchases
    STARTER = "starter"              # One-time $99 purchase
    PRO = "pro"                      # One-time $199 purchase
    PREMIUM = "premium"              # $29/month subscription
    ENTERPRISE = "enterprise"        # $99/month subscription


class FeaturePermission(enum.Enum):
    """Feature permissions for different plans"""
    # Basic features (available to all plans)
    BASIC_DASHBOARD = "basic_dashboard"
    USER_PROFILE = "user_profile"
    BASIC_ARTICLES = "basic_articles"
    
    # Starter features
    ARTICLE_MANAGEMENT = "article_management"
    BASIC_ANALYTICS = "basic_analytics"
    EMAIL_TEMPLATES = "email_templates"
    
    # Pro features
    ADVANCED_DASHBOARD = "advanced_dashboard"
    MULTI_TENANT = "multi_tenant"
    API_ACCESS = "api_access"
    ADVANCED_ANALYTICS = "advanced_analytics"
    PRIORITY_SUPPORT = "priority_support"
    
    # Premium features (subscription)
    PREMIUM_INTEGRATIONS = "premium_integrations"
    CUSTOM_COMPONENTS = "custom_components"
    ADVANCED_REPORTING = "advanced_reporting"
    TEAM_COLLABORATION = "team_collaboration"
    
    # Enterprise features (subscription)
    WHITE_LABEL = "white_label"
    CUSTOM_INTEGRATIONS = "custom_integrations"
    DEDICATED_SUPPORT = "dedicated_support"
    TEAM_MANAGEMENT = "team_management"
    SLA_GUARANTEE = "sla_guarantee"
    AUDIT_LOGS = "audit_logs"


# Plan to features mapping - defines what each plan can access
PLAN_FEATURES: dict[PlanType, List[FeaturePermission]] = {
    PlanType.FREE: [
        FeaturePermission.BASIC_DASHBOARD,
        FeaturePermission.USER_PROFILE,
    ],
    
    PlanType.STARTER: [
        # All free features plus:
        FeaturePermission.BASIC_DASHBOARD,
        FeaturePermission.USER_PROFILE,
        FeaturePermission.BASIC_ARTICLES,
        FeaturePermission.ARTICLE_MANAGEMENT,
        FeaturePermission.BASIC_ANALYTICS,
        FeaturePermission.EMAIL_TEMPLATES,
    ],
    
    PlanType.PRO: [
        # All starter features plus:
        FeaturePermission.BASIC_DASHBOARD,
        FeaturePermission.USER_PROFILE,
        FeaturePermission.BASIC_ARTICLES,
        FeaturePermission.ARTICLE_MANAGEMENT,
        FeaturePermission.BASIC_ANALYTICS,
        FeaturePermission.EMAIL_TEMPLATES,
        FeaturePermission.ADVANCED_DASHBOARD,
        FeaturePermission.MULTI_TENANT,
        FeaturePermission.API_ACCESS,
        FeaturePermission.ADVANCED_ANALYTICS,
        FeaturePermission.PRIORITY_SUPPORT,
    ],
    
    PlanType.PREMIUM: [
        # All pro features plus:
        FeaturePermission.BASIC_DASHBOARD,
        FeaturePermission.USER_PROFILE,
        FeaturePermission.BASIC_ARTICLES,
        FeaturePermission.ARTICLE_MANAGEMENT,
        FeaturePermission.BASIC_ANALYTICS,
        FeaturePermission.EMAIL_TEMPLATES,
        FeaturePermission.ADVANCED_DASHBOARD,
        FeaturePermission.MULTI_TENANT,
        FeaturePermission.API_ACCESS,
        FeaturePermission.ADVANCED_ANALYTICS,
        FeaturePermission.PRIORITY_SUPPORT,
        FeaturePermission.PREMIUM_INTEGRATIONS,
        FeaturePermission.CUSTOM_COMPONENTS,
        FeaturePermission.ADVANCED_REPORTING,
        FeaturePermission.TEAM_COLLABORATION,
    ],
    
    PlanType.ENTERPRISE: [
        # All premium features plus:
        FeaturePermission.BASIC_DASHBOARD,
        FeaturePermission.USER_PROFILE,
        FeaturePermission.BASIC_ARTICLES,
        FeaturePermission.ARTICLE_MANAGEMENT,
        FeaturePermission.BASIC_ANALYTICS,
        FeaturePermission.EMAIL_TEMPLATES,
        FeaturePermission.ADVANCED_DASHBOARD,
        FeaturePermission.MULTI_TENANT,
        FeaturePermission.API_ACCESS,
        FeaturePermission.ADVANCED_ANALYTICS,
        FeaturePermission.PRIORITY_SUPPORT,
        FeaturePermission.PREMIUM_INTEGRATIONS,
        FeaturePermission.CUSTOM_COMPONENTS,
        FeaturePermission.ADVANCED_REPORTING,
        FeaturePermission.TEAM_COLLABORATION,
        FeaturePermission.WHITE_LABEL,
        FeaturePermission.CUSTOM_INTEGRATIONS,
        FeaturePermission.DEDICATED_SUPPORT,
        FeaturePermission.TEAM_MANAGEMENT,
        FeaturePermission.SLA_GUARANTEE,
        FeaturePermission.AUDIT_LOGS,
    ],
}


def get_user_permissions(plan: PlanType) -> List[FeaturePermission]:
    """Get all permissions for a given plan"""
    return PLAN_FEATURES.get(plan, PLAN_FEATURES[PlanType.FREE])


def user_has_permission(plan: PlanType, permission: FeaturePermission) -> bool:
    """Check if a plan has a specific permission"""
    return permission in get_user_permissions(plan)


def get_required_plan_for_permission(permission: FeaturePermission) -> Optional[PlanType]:
    """Get the minimum plan required for a specific permission"""
    for plan, permissions in PLAN_FEATURES.items():
        if permission in permissions:
            return plan
    return None


# Legacy support - keep AccountType for backward compatibility but deprecated
class AccountType(enum.Enum):
    """@deprecated Use PlanType instead"""
    free = 1
    premium = 2
