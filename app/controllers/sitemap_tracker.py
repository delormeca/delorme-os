"""
API endpoints for Sitemap Tracker feature.

Provides comprehensive endpoints for managing sitemap tracking including:
- Tracker configuration management
- Run creation and execution
- Change tracking and comparison
- Dashboard overview
"""
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_async_db_session
from app.services.users_service import get_current_user
from app.schemas.auth import CurrentUserResponse
from app.schemas.sitemap_tracker import (
    SitemapTrackerConfigUpdate,
    SitemapTrackerRunCreate,
    SitemapTrackerRunRead,
    SitemapTrackerRunList,
    SitemapChangeList,
    SitemapTrackerDashboard,
    RunComparisonRequest,
    RunComparisonResponse,
)
from app.schemas.client import ClientRead
from app.services.sitemap_tracker_service import SitemapTrackerService
from app.core.exceptions import NotFoundException, ValidationException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sitemap-tracker", tags=["Sitemap Tracker"])


@router.post("/clients/{client_id}/configure", response_model=ClientRead)
async def configure_tracker(
    client_id: UUID = Path(..., description="ID of the client to configure"),
    config: SitemapTrackerConfigUpdate = ...,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Update sitemap tracker configuration for a client.

    This endpoint allows you to configure:
    - Sitemap URL to track
    - Tracking frequency (daily, weekly, bi_monthly, monthly, manual_only)
    - Enable/disable tracking for the client
    """
    try:
        service = SitemapTrackerService(db)
        result = await service.update_tracker_config(client_id, config)
        return result

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to configure tracker for client {client_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to configure tracker: {str(e)}"
        )


@router.post("/clients/{client_id}/runs", response_model=SitemapTrackerRunRead, status_code=status.HTTP_201_CREATED)
async def create_tracker_run(
    client_id: UUID = Path(..., description="ID of the client to create run for"),
    run_data: SitemapTrackerRunCreate = ...,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Start a new sitemap tracker run for a client.

    This creates a pending run record that can be executed using the
    POST /runs/{run_id}/execute endpoint.

    Run types:
    - manual: User-initiated run
    - scheduled: Automatically scheduled run based on frequency
    """
    try:
        service = SitemapTrackerService(db)
        result = await service.create_tracker_run(client_id, run_data)
        return result

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create tracker run for client {client_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create tracker run: {str(e)}"
        )


@router.post("/runs/{run_id}/execute", response_model=SitemapTrackerRunRead)
async def execute_tracker_run(
    run_id: UUID = Path(..., description="ID of the tracker run to execute"),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Execute a pending sitemap tracker run.

    This triggers the actual sitemap parsing, comparison with previous run,
    and change detection. The run will be executed asynchronously in the background.

    The frontend can poll the GET /runs/{run_id} endpoint to track progress.
    """
    try:
        service = SitemapTrackerService(db)
        result = await service.execute_tracker_run(run_id)
        return result

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to execute tracker run {run_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute tracker run: {str(e)}"
        )


@router.get("/runs/{run_id}", response_model=SitemapTrackerRunRead)
async def get_tracker_run(
    run_id: UUID = Path(..., description="ID of the tracker run to retrieve"),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Get details of a specific sitemap tracker run.

    Returns comprehensive information including:
    - Run status and progress
    - URL counts (new, removed, changed, unchanged)
    - Status code summary
    - Performance metrics
    - All detected changes
    """
    try:
        service = SitemapTrackerService(db)
        result = await service.get_tracker_run(run_id)
        return result

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get tracker run {run_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tracker run: {str(e)}"
        )


@router.get("/clients/{client_id}/runs", response_model=SitemapTrackerRunList)
async def list_client_tracker_runs(
    client_id: UUID = Path(..., description="ID of the client to list runs for"),
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    List all tracker runs for a specific client (paginated).

    Returns runs in reverse chronological order (most recent first).
    Use pagination parameters to control the number of results.
    """
    try:
        service = SitemapTrackerService(db)
        result = await service.list_client_runs(client_id, page=page, page_size=page_size)
        return result

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to list tracker runs for client {client_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list tracker runs: {str(e)}"
        )


@router.get("/runs/{run_id}/changes", response_model=SitemapChangeList)
async def list_run_changes(
    run_id: UUID = Path(..., description="ID of the tracker run to get changes for"),
    change_type: Optional[str] = Query(None, description="Filter by change type: 'added', 'removed', 'status_changed'"),
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(50, ge=1, le=100, description="Number of items per page"),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    List all changes detected in a specific tracker run (paginated).

    Optionally filter by change type:
    - 'added': Newly discovered URLs
    - 'removed': URLs that are no longer in the sitemap
    - 'status_changed': URLs with HTTP status code changes

    Returns changes with detailed information about old and new states.
    """
    try:
        service = SitemapTrackerService(db)
        result = await service.list_run_changes(
            run_id,
            change_type=change_type,
            page=page,
            page_size=page_size
        )
        return result

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to list changes for run {run_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list changes: {str(e)}"
        )


@router.post("/compare", response_model=RunComparisonResponse)
async def compare_tracker_runs(
    comparison_request: RunComparisonRequest = ...,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Compare two sitemap tracker runs side by side.

    This endpoint provides detailed comparison between two runs including:
    - URLs added between runs
    - URLs removed between runs
    - URLs with status code changes
    - Summary statistics

    Useful for analyzing sitemap evolution over time.
    """
    try:
        service = SitemapTrackerService(db)
        result = await service.compare_runs(
            comparison_request.run_id_1,
            comparison_request.run_id_2
        )
        return result

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(
            f"Failed to compare runs {comparison_request.run_id_1} and "
            f"{comparison_request.run_id_2}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare runs: {str(e)}"
        )


@router.get("/clients/{client_id}/dashboard", response_model=SitemapTrackerDashboard)
async def get_tracker_dashboard(
    client_id: UUID = Path(..., description="ID of the client to get dashboard for"),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Get dashboard overview for a client's sitemap tracker.

    Provides a high-level summary including:
    - Latest tracker run details
    - Total number of runs executed
    - Total URLs being tracked
    - Recent changes across all runs
    - HTTP status code breakdown

    This is designed for the frontend dashboard view.
    """
    try:
        service = SitemapTrackerService(db)
        result = await service.get_dashboard(client_id)
        return result

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get dashboard for client {client_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard: {str(e)}"
        )
