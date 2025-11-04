"""
Analytics Controller

Provides analytics endpoints with plan-based access control.
"""

from typing import Dict, Any

from fastapi import APIRouter, Depends

from app.services.analytics_service import AnalyticsService, get_analytics_service
from app.services.users_service import get_current_user
from app.schemas.auth import CurrentUserResponse

# Create router
analytics_router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@analytics_router.get("/basic")
async def get_basic_analytics(
    current_user: CurrentUserResponse = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> Dict[str, Any]:
    """
    Get basic analytics for Starter+ users.
    
    Includes:
    - Total articles created
    - Published vs draft count
    - Recent activity summary
    
    Requires: BASIC_ANALYTICS permission (Starter plan or higher)
    """
    return await analytics_service.get_basic_analytics()


@analytics_router.get("/advanced")
async def get_advanced_analytics(
    current_user: CurrentUserResponse = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> Dict[str, Any]:
    """
    Get advanced analytics for Pro+ users.
    
    Includes:
    - Detailed performance metrics
    - Monthly breakdown
    - Content analysis
    - Growth trends
    
    Requires: ADVANCED_ANALYTICS permission (Pro plan or higher)
    """
    return await analytics_service.get_advanced_analytics()


@analytics_router.get("/reporting")
async def get_premium_reporting(
    current_user: CurrentUserResponse = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> Dict[str, Any]:
    """
    Get premium reporting features for Premium+ subscribers.
    
    Includes:
    - Custom report generation
    - Data export options
    - Benchmarking data
    - Advanced filtering
    
    Requires: ADVANCED_REPORTING permission (Premium subscription or higher)
    """
    return await analytics_service.get_premium_reporting()


@analytics_router.get("/team")
async def get_team_analytics(
    current_user: CurrentUserResponse = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> Dict[str, Any]:
    """
    Get team analytics for Enterprise subscribers.
    
    Includes:
    - Team performance metrics
    - Collaboration insights
    - Resource utilization
    - Team productivity reports
    
    Requires: TEAM_MANAGEMENT permission (Enterprise subscription)
    """
    return await analytics_service.get_team_analytics()
