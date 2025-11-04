"""
Plan Upgrade Controller

Handles plan upgrade requests with proration and billing logic.
"""

from typing import Dict, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services.upgrade_service import UpgradeService, get_upgrade_service
from app.services.users_service import get_current_user
from app.schemas.auth import CurrentUserResponse

# Create router
upgrades_router = APIRouter(prefix="/api/upgrades", tags=["upgrades"])


# Request/Response schemas
class UpgradeRequest(BaseModel):
    target_plan: str


class ProrationPreviewRequest(BaseModel):
    target_plan: str


@upgrades_router.get("/options")
async def get_upgrade_options(
    current_user: CurrentUserResponse = Depends(get_current_user),
    upgrade_service: UpgradeService = Depends(get_upgrade_service),
) -> Dict[str, Any]:
    """
    Get available upgrade options for the current user.
    
    Returns upgrade paths with pricing, proration info, and feature comparisons.
    Includes trial information for new subscriptions and proration details for upgrades.
    """
    return await upgrade_service.get_upgrade_options()


@upgrades_router.post("/checkout")
async def create_upgrade_checkout(
    request: UpgradeRequest,
    current_user: CurrentUserResponse = Depends(get_current_user),
    upgrade_service: UpgradeService = Depends(get_upgrade_service),
) -> Dict[str, Any]:
    """
    Create checkout session for plan upgrade.
    
    Handles:
    - One-time plan purchases (Starter, Pro)
    - New subscription creation (Premium, Enterprise)
    - Subscription upgrades with proration
    - Trial periods for new subscriptions
    """
    return await upgrade_service.create_upgrade_checkout(request.target_plan)


@upgrades_router.post("/proration-preview")
async def get_proration_preview(
    request: ProrationPreviewRequest,
    current_user: CurrentUserResponse = Depends(get_current_user),
    upgrade_service: UpgradeService = Depends(get_upgrade_service),
) -> Dict[str, Any]:
    """
    Get proration preview for subscription upgrade.
    
    Shows exactly how much the user will be charged today and explains
    the billing cycle changes without creating a checkout session.
    """
    return await upgrade_service.get_proration_preview(request.target_plan)
