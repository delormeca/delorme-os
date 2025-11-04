"""
Integrations Controller

Manages third-party integrations with plan-based access control.
"""

from typing import Dict, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services.integrations_service import IntegrationsService, get_integrations_service
from app.services.users_service import get_current_user
from app.schemas.auth import CurrentUserResponse

# Create router
integrations_router = APIRouter(prefix="/api/integrations", tags=["integrations"])


# Request/Response schemas
class IntegrationSetupRequest(BaseModel):
    config: Dict[str, Any]


@integrations_router.get("")
async def get_available_integrations(
    current_user: CurrentUserResponse = Depends(get_current_user),
    integrations_service: IntegrationsService = Depends(get_integrations_service),
) -> Dict[str, Any]:
    """
    Get all available integrations based on user's plan.
    
    Returns different integration tiers:
    - Basic: Available to all plans
    - Premium: Available to Premium+ subscribers
    - Enterprise: Available to Enterprise subscribers only
    """
    return await integrations_service.get_available_integrations()


@integrations_router.get("/status")
async def get_integration_status(
    current_user: CurrentUserResponse = Depends(get_current_user),
    integrations_service: IntegrationsService = Depends(get_integrations_service),
) -> Dict[str, Any]:
    """
    Get status of all configured integrations for the current user.
    
    Shows which integrations are active, configured, or need attention.
    """
    return await integrations_service.get_integration_status()


@integrations_router.get("/{integration_id}")
async def get_integration_details(
    integration_id: str,
    current_user: CurrentUserResponse = Depends(get_current_user),
    integrations_service: IntegrationsService = Depends(get_integrations_service),
) -> Dict[str, Any]:
    """
    Get detailed information about a specific integration.
    
    Includes setup instructions, features, and access requirements.
    """
    return await integrations_service.get_integration_details(integration_id)


@integrations_router.post("/{integration_id}/setup")
async def setup_integration(
    integration_id: str,
    request: IntegrationSetupRequest,
    current_user: CurrentUserResponse = Depends(get_current_user),
    integrations_service: IntegrationsService = Depends(get_integrations_service),
) -> Dict[str, Any]:
    """
    Set up and configure a new integration.
    
    Requires appropriate plan permissions for the integration type.
    """
    return await integrations_service.setup_integration(integration_id, request.config)
