"""
Integrations Service

Manages third-party integrations with plan-based access control.
"""

import logging
from typing import List, Dict, Any, Optional

from fastapi import Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.models import User
from app.permissions import FeaturePermission
from app.core.access_control import PlanChecker, get_user_current_plan
from app.schemas.auth import CurrentUserResponse
from app.services.users_service import get_current_user_optional

logger = logging.getLogger(__name__)


class IntegrationsService:
    """Service for managing third-party integrations"""
    
    def __init__(self, db: AsyncSession, current_user: Optional[CurrentUserResponse]):
        self.db = db
        self.current_user = current_user
    
    async def get_available_integrations(self) -> Dict[str, Any]:
        """
        Get available integrations based on user's plan.
        
        Different plans have access to different integration tiers.
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
        plan_checker = PlanChecker(user, self.db, current_plan)
        
        # Base integrations available to all plans
        integrations = {
            "basic": [
                {
                    "id": "webhook_basic",
                    "name": "Basic Webhooks",
                    "description": "Simple webhook notifications",
                    "category": "notifications",
                    "available": True,
                    "setup_required": True,
                }
            ],
            "premium": [],
            "enterprise": [],
        }
        
        # Premium integrations (Premium+ subscribers)
        if plan_checker.has_permission(FeaturePermission.PREMIUM_INTEGRATIONS):
            integrations["premium"] = [
                {
                    "id": "slack_integration",
                    "name": "Slack Integration",
                    "description": "Post articles and notifications to Slack channels",
                    "category": "communication",
                    "available": True,
                    "setup_required": True,
                    "features": ["Auto-posting", "Custom templates", "Channel routing"],
                },
                {
                    "id": "zapier_integration",
                    "name": "Zapier Integration",
                    "description": "Connect with 5000+ apps via Zapier",
                    "category": "automation",
                    "available": True,
                    "setup_required": True,
                    "features": ["Trigger automation", "Data sync", "Multi-step workflows"],
                },
                {
                    "id": "google_analytics",
                    "name": "Google Analytics",
                    "description": "Track article performance and user engagement",
                    "category": "analytics",
                    "available": True,
                    "setup_required": True,
                    "features": ["Performance tracking", "User insights", "Custom events"],
                },
                {
                    "id": "mailchimp_integration",
                    "name": "Mailchimp Integration",
                    "description": "Sync subscribers and send newsletter campaigns",
                    "category": "marketing",
                    "available": True,
                    "setup_required": True,
                    "features": ["Subscriber sync", "Campaign automation", "Segmentation"],
                },
            ]
        
        # Enterprise integrations (Enterprise subscribers only)
        if plan_checker.has_permission(FeaturePermission.CUSTOM_INTEGRATIONS):
            integrations["enterprise"] = [
                {
                    "id": "salesforce_integration",
                    "name": "Salesforce Integration",
                    "description": "Sync data with Salesforce CRM",
                    "category": "crm",
                    "available": True,
                    "setup_required": True,
                    "features": ["Lead sync", "Custom objects", "Workflow automation"],
                },
                {
                    "id": "custom_api",
                    "name": "Custom API Integration",
                    "description": "Build custom integrations with our API",
                    "category": "development",
                    "available": True,
                    "setup_required": True,
                    "features": ["Custom endpoints", "Webhook customization", "API documentation"],
                },
                {
                    "id": "sso_integration",
                    "name": "Single Sign-On (SSO)",
                    "description": "Enterprise SSO with SAML/OIDC support",
                    "category": "security",
                    "available": True,
                    "setup_required": True,
                    "features": ["SAML 2.0", "OIDC", "Active Directory"],
                },
                {
                    "id": "audit_integration",
                    "name": "Audit Log Integration",
                    "description": "Export audit logs to your security systems",
                    "category": "security",
                    "available": True,
                    "setup_required": True,
                    "features": ["Real-time export", "Custom formats", "Compliance reports"],
                },
            ]
        
        return {
            "user_plan": plan_checker.current_plan.value,
            "integrations": integrations,
            "total_available": sum(len(tier) for tier in integrations.values()),
        }
    
    async def get_integration_details(self, integration_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific integration"""
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
        plan_checker = PlanChecker(user, self.db, current_plan)
        
        # Integration details database (in production, this would be in a database)
        integration_details = {
            "webhook_basic": {
                "id": "webhook_basic",
                "name": "Basic Webhooks",
                "description": "Simple webhook notifications for your application events",
                "category": "notifications",
                "required_permission": None,  # Available to all plans
                "setup_steps": [
                    "Configure your webhook endpoint URL",
                    "Select which events to receive notifications for",
                    "Test the webhook with a sample event",
                    "Save your configuration",
                ],
                "features": {
                    "event_notifications": "Receive real-time notifications for application events",
                    "custom_endpoints": "Configure custom webhook URLs",
                    "event_filtering": "Choose which events trigger notifications",
                    "retry_logic": "Automatic retry for failed webhook deliveries",
                },
                "pricing": "Included with all plans",
            },
            "slack_integration": {
                "id": "slack_integration",
                "name": "Slack Integration",
                "description": "Connect your content workflow with Slack for seamless team communication",
                "category": "communication",
                "required_permission": FeaturePermission.PREMIUM_INTEGRATIONS,
                "setup_steps": [
                    "Install Slack app in your workspace",
                    "Authorize CraftYourStartup to access your Slack",
                    "Configure channel routing and notification preferences",
                    "Test the integration with a sample article",
                ],
                "features": {
                    "auto_posting": "Automatically post new articles to designated channels",
                    "custom_templates": "Customize message templates for different content types",
                    "channel_routing": "Route different content types to specific channels",
                    "mentions": "Automatically mention team members based on content tags",
                },
                "pricing": "Included with Premium subscription",
            },
            "zapier_integration": {
                "id": "zapier_integration",
                "name": "Zapier Integration",
                "description": "Automate your workflow by connecting with 5000+ apps",
                "category": "automation",
                "required_permission": FeaturePermission.PREMIUM_INTEGRATIONS,
                "setup_steps": [
                    "Create a Zapier account if you don't have one",
                    "Search for CraftYourStartup in Zapier apps",
                    "Connect your CraftYourStartup account",
                    "Create your first automation (Zap)",
                ],
                "features": {
                    "triggers": "Article published, user registered, payment completed",
                    "actions": "Create article, update user, send notification",
                    "multi_step": "Create complex workflows with multiple steps",
                    "filters": "Add conditions and filters to your automations",
                },
                "pricing": "Included with Premium subscription",
            },
            "salesforce_integration": {
                "id": "salesforce_integration",
                "name": "Salesforce Integration",
                "description": "Sync your content and user data with Salesforce CRM",
                "category": "crm",
                "required_permission": FeaturePermission.CUSTOM_INTEGRATIONS,
                "setup_steps": [
                    "Contact our Enterprise team for setup assistance",
                    "Provide Salesforce org details and requirements",
                    "Complete security and compliance review",
                    "Install and configure the integration",
                    "Test data sync and workflows",
                ],
                "features": {
                    "lead_sync": "Sync user registrations as leads in Salesforce",
                    "custom_objects": "Map content data to custom Salesforce objects",
                    "workflow_automation": "Trigger Salesforce workflows from content events",
                    "reporting": "Generate reports combining content and CRM data",
                },
                "pricing": "Included with Enterprise subscription",
            },
        }
        
        integration = integration_details.get(integration_id)
        if not integration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Integration not found"
            )
        
        # Check if user has permission for this integration
        required_permission = integration["required_permission"]
        has_access = True  # Default to True for integrations with no permission requirement
        
        if required_permission:
            has_access = plan_checker.has_permission(required_permission)
        
        return {
            **integration,
            "has_access": has_access,
            "user_plan": plan_checker.current_plan.value,
            "upgrade_needed": not has_access,
        }
    
    async def setup_integration(self, integration_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Set up a new integration (demo implementation)"""
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
        
        # In a real implementation, this would:
        # 1. Validate the integration exists and user has access
        # 2. Store the configuration securely
        # 3. Test the connection
        # 4. Activate the integration
        
        logger.info(f"Setting up integration {integration_id} for user {user.id}")
        
        return {
            "integration_id": integration_id,
            "status": "configured",
            "message": "Integration setup completed successfully",
            "next_steps": [
                "Test the integration with sample data",
                "Configure notification preferences",
                "Review integration logs",
            ],
        }
    
    async def get_integration_status(self) -> Dict[str, Any]:
        """Get status of all configured integrations for the user"""
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
        
        # Demo implementation - in production, this would query actual integration status
        current_plan = await get_user_current_plan(user, self.db)
        plan_checker = PlanChecker(user, self.db, current_plan)
        
        configured_integrations = []
        
        if plan_checker.has_permission(FeaturePermission.PREMIUM_INTEGRATIONS):
            configured_integrations.extend([
                {
                    "id": "webhook_basic",
                    "name": "Basic Webhooks",
                    "status": "active",
                    "last_used": "2024-01-15T10:30:00Z",
                    "events_sent": 45,
                },
                {
                    "id": "slack_integration",
                    "name": "Slack Integration",
                    "status": "configured",
                    "last_used": "2024-01-14T16:45:00Z",
                    "events_sent": 12,
                },
            ])
        
        if plan_checker.has_permission(FeaturePermission.CUSTOM_INTEGRATIONS):
            configured_integrations.append({
                "id": "custom_api",
                "name": "Custom API Integration",
                "status": "active",
                "last_used": "2024-01-15T09:15:00Z",
                "events_sent": 128,
            })
        
        return {
            "user_plan": plan_checker.current_plan.value,
            "total_integrations": len(configured_integrations),
            "active_integrations": len([i for i in configured_integrations if i["status"] == "active"]),
            "integrations": configured_integrations,
        }


def get_integrations_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
) -> IntegrationsService:
    """Get an instance of the IntegrationsService class."""
    return IntegrationsService(db_session, current_user)
