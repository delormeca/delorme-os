"""
Engine Setup API endpoints.
"""
import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.schemas.auth import CurrentUserResponse
from app.schemas.engine_setup import (
    EngineSetupRequest,
    EngineSetupRunRead,
    EngineSetupProgressResponse,
    EngineSetupStartResponse,
    EngineSetupStatsResponse,
    EngineSetupListResponse,
    SitemapValidationRequest,
    SitemapValidationResponse
)
from app.services.engine_setup_service import EngineSetupService
from app.services.users_service import get_current_user
from app.tasks import engine_setup_tasks
from app.core.exceptions import NotFoundException, ValidationException

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/engine-setup/start", response_model=EngineSetupStartResponse)
async def start_engine_setup(
    setup_request: EngineSetupRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Start an engine setup run (sitemap or manual import).

    This creates a setup run and schedules a background task to process it.
    """
    try:
        engine_setup_service = EngineSetupService(db)

        # Start setup (creates run record)
        response = await engine_setup_service.start_setup(setup_request)

        # Schedule background task based on setup type
        if setup_request.setup_type == "sitemap":
            if not setup_request.sitemap_url:
                raise ValidationException("sitemap_url is required for sitemap setup")

            engine_setup_tasks.schedule_sitemap_setup(
                response.run_id,
                setup_request.sitemap_url
            )
        else:  # manual
            if not setup_request.manual_urls:
                raise ValidationException("manual_urls is required for manual setup")

            engine_setup_tasks.schedule_manual_setup(
                response.run_id,
                setup_request.manual_urls
            )

        return response

    except (NotFoundException, ValidationException) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start engine setup: {str(e)}"
        )


@router.get("/engine-setup/{run_id}", response_model=EngineSetupRunRead)
async def get_setup_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get details of a specific setup run."""
    try:
        engine_setup_service = EngineSetupService(db)
        return await engine_setup_service.get_setup_run(run_id)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get setup run: {str(e)}"
        )


@router.get("/engine-setup/{run_id}/progress", response_model=EngineSetupProgressResponse)
async def get_setup_progress(
    run_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Get real-time progress of a setup run.

    Frontend polls this endpoint every 2 seconds during setup.
    """
    try:
        engine_setup_service = EngineSetupService(db)
        return await engine_setup_service.get_progress(run_id)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get setup progress: {str(e)}"
        )


@router.get("/engine-setup/client/{client_id}/runs", response_model=EngineSetupListResponse)
async def list_client_setup_runs(
    client_id: UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """List all setup runs for a specific client."""
    try:
        engine_setup_service = EngineSetupService(db)
        runs = await engine_setup_service.list_client_runs(client_id, limit=limit)

        return EngineSetupListResponse(
            runs=runs,
            total=len(runs)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list setup runs: {str(e)}"
        )


@router.get("/engine-setup/client/{client_id}/stats", response_model=EngineSetupStatsResponse)
async def get_client_setup_stats(
    client_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get engine setup statistics for a client."""
    try:
        engine_setup_service = EngineSetupService(db)
        return await engine_setup_service.get_client_stats(client_id)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get setup stats: {str(e)}"
        )


@router.post("/engine-setup/{run_id}/cancel", response_model=EngineSetupRunRead)
async def cancel_setup_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Cancel a running setup.

    This marks the run as failed and attempts to cancel the background job.
    """
    try:
        engine_setup_service = EngineSetupService(db)

        # Get run to check setup type
        setup_run = await engine_setup_service.get_setup_run(run_id)

        # Try to cancel background job
        engine_setup_tasks.cancel_setup_job(run_id, setup_run.setup_type)

        # Mark run as cancelled
        return await engine_setup_service.cancel_setup(run_id)

    except (NotFoundException, ValidationException) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel setup: {str(e)}"
        )


@router.post("/engine-setup/validate-sitemap", response_model=SitemapValidationResponse)
async def validate_sitemap(
    validation_request: SitemapValidationRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Validate a sitemap URL without creating a setup run.

    This endpoint tests sitemap accessibility and parsing using the robust
    sitemap parser service. It returns URL count and detailed error information
    to help users diagnose issues before starting the full engine setup.
    """
    from app.services.robust_sitemap_parser import (
        RobustSitemapParserService,
        SitemapParserConfig,
    )

    # Configure parser with reasonable timeout for validation
    config = SitemapParserConfig(
        timeout=10,
        max_retries=2,
        log_progress=False,  # Don't spam logs during validation
    )

    parser = RobustSitemapParserService(config)

    try:
        # Parse sitemap (recursive to count all nested URLs)
        result = await parser.parse_sitemap(
            url=validation_request.sitemap_url,
            recursive=True,
        )

        if result.success:
            return SitemapValidationResponse(
                valid=True,
                url_count=result.total_count,
                sitemap_type=result.sitemap_type,
                parse_time=result.parse_time,
            )
        else:
            return SitemapValidationResponse(
                valid=False,
                url_count=0,
                error_type=result.error_type,
                error_message=result.error_message,
                suggestion=result.suggestion,
                parse_time=result.parse_time,
            )

    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"Unexpected error in validate_sitemap: {str(e)}")
        return SitemapValidationResponse(
            valid=False,
            url_count=0,
            error_type="UNEXPECTED_ERROR",
            error_message=str(e),
            suggestion="An unexpected error occurred. Please try again or contact support.",
            parse_time=0.0,
        )
