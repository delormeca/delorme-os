"""
API endpoints for page crawling and data extraction (Phase 4).
"""
import uuid
import sys
import asyncio
from typing import Optional, List, Literal
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from apscheduler.schedulers.base import STATE_RUNNING, STATE_PAUSED, STATE_STOPPED

from app.db import get_async_db_session
from app.services.users_service import get_current_user
from app.models import User, Client, CrawlRun
from app.services.page_crawl_service import PageCrawlService
from app.services import client_service
from app.tasks.page_crawl_tasks import (
    schedule_page_crawl,
    cancel_page_crawl_job,
    get_page_crawl_jobs,
)

router = APIRouter(prefix="/api/page-crawl", tags=["Page Crawl"])


async def resolve_client_identifier(client_identifier: str, db: AsyncSession) -> uuid.UUID:
    """Helper to resolve client identifier (UUID or slug) to UUID."""
    try:
        # Try parsing as UUID first
        return uuid.UUID(client_identifier)
    except ValueError:
        # If not a UUID, treat as slug and get the client
        client = await client_service.get_client_by_slug(db, client_identifier)
        return client.id


# ============================================================================
# Request/Response Schemas
# ============================================================================


class StartCrawlRequest(BaseModel):
    """Request to start a new crawl."""

    client_id: uuid.UUID = Field(..., description="Client ID to crawl")
    run_type: str = Field(
        default="full",
        description="Type of run: 'full', 'selective', or 'manual'",
    )
    selected_page_ids: Optional[List[uuid.UUID]] = Field(
        default=None,
        description="Optional list of specific page IDs to crawl (for selective runs)",
    )


class CrawlStatusResponse(BaseModel):
    """Response with crawl status."""

    id: str
    status: str
    progress_percentage: int
    current_page_url: Optional[str]
    current_status_message: Optional[str]
    total_pages: int
    successful_pages: int
    failed_pages: int
    started_at: Optional[str]
    completed_at: Optional[str]
    performance_metrics: Optional[dict]
    api_costs: Optional[dict]
    errors: List[dict]


class JobResponse(BaseModel):
    """Response with job information."""

    job_id: str
    message: str


class HealthCheckDetail(BaseModel):
    status: Literal["pass", "warn", "fail"]
    message: str
    details: Optional[dict] = None
    timestamp: datetime


class HealthCheckResponse(BaseModel):
    overall_status: Literal["healthy", "degraded", "unhealthy"]
    timestamp: datetime
    checks: dict[str, HealthCheckDetail]
    execution_time_ms: int
    recommendations: list[str]


# ============================================================================
# Endpoints
# ============================================================================


@router.post("/start", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_crawl(
    request: StartCrawlRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Start a new page crawl job.

    This will:
    1. Create a new CrawlRun record
    2. Schedule a background job to crawl pages
    3. Extract all 22 data points from each page
    4. Update database with results

    The crawl runs asynchronously in the background.
    Use the GET /status endpoint to track progress.
    """
    # Verify client exists and user has access
    client = await db.get(Client, request.client_id)

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {request.client_id} not found",
        )

    # TODO: Add permission check - user must own the client

    # Create CrawlRun record first
    try:
        page_crawl_service = PageCrawlService(db)
        crawl_run = await page_crawl_service.start_crawl_run(
            client_id=request.client_id,
            run_type=request.run_type,
            selected_pages=request.selected_page_ids,
        )

        # Extract ID immediately before any other operations
        crawl_run_id = crawl_run.id

        await db.commit()

        # Schedule the crawl job with the crawl_run_id (this is sync, so do it after commit)
        apscheduler_job_id = schedule_page_crawl(
            client_id=request.client_id,
            run_type=request.run_type,
            selected_page_ids=request.selected_page_ids,
            crawl_run_id=crawl_run_id,
        )

        # CRITICAL FIX: Return the actual APScheduler job ID for cancellation
        # Frontend can extract crawl_run_id from job_id (format: page_crawl_{crawl_run_id})
        return JobResponse(
            job_id=apscheduler_job_id,
            message=f"Crawl job scheduled successfully. Job ID: {apscheduler_job_id}, Crawl Run ID: {crawl_run_id}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule crawl job: {str(e)}",
        )


@router.get("/status/{crawl_run_id}", response_model=CrawlStatusResponse)
async def get_crawl_status(
    crawl_run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get the current status of a crawl run.

    Returns real-time progress information including:
    - Progress percentage
    - Current page being crawled
    - Success/failure counts
    - Performance metrics
    - Error log
    """
    page_crawl_service = PageCrawlService(db)

    status_info = await page_crawl_service.get_crawl_run_status(crawl_run_id)

    if not status_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crawl run {crawl_run_id} not found",
        )

    # TODO: Add permission check - user must own the client

    return CrawlStatusResponse(**status_info)


@router.post("/cancel/{job_id}", response_model=JobResponse)
async def cancel_crawl(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a running or scheduled crawl job.

    Note: This cancels the scheduled job. If the job is already running,
    it will continue until the current page finishes.
    """
    success = cancel_page_crawl_job(job_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found or already completed",
        )

    return JobResponse(
        job_id=job_id,
        message=f"Crawl job {job_id} cancelled successfully",
    )


@router.get("/jobs", response_model=List[dict])
async def list_crawl_jobs(
    current_user: User = Depends(get_current_user),
):
    """
    List all scheduled and running crawl jobs.

    Returns information about currently active jobs in the queue.
    """
    jobs = get_page_crawl_jobs()

    job_list = []
    for job in jobs:
        job_list.append({
            "id": job.id,
            "name": job.name,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
        })

    return job_list


@router.get("/client/{client_identifier}/runs", response_model=List[dict])
async def list_client_crawl_runs(
    client_identifier: str,
    limit: int = 10,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    List recent crawl runs for a client (accepts UUID or slug).

    Returns the most recent crawl runs, ordered by creation date.
    """
    from sqlalchemy import select

    # Resolve client identifier to UUID
    client_id = await resolve_client_identifier(client_identifier, db)

    # TODO: Add permission check - user must own the client

    query = (
        select(CrawlRun)
        .where(CrawlRun.client_id == client_id)
        .order_by(CrawlRun.created_at.desc())
        .limit(limit)
    )

    result = await db.execute(query)
    crawl_runs = result.scalars().all()

    runs_list = []
    for run in crawl_runs:
        runs_list.append({
            "id": str(run.id),
            "run_type": run.run_type,
            "status": run.status,
            "total_pages": run.total_pages,
            "successful_pages": run.successful_pages,
            "failed_pages": run.failed_pages,
            "progress_percentage": run.progress_percentage,
            "started_at": run.started_at.isoformat() if run.started_at else None,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        })

    return runs_list


@router.get("/health", response_model=HealthCheckResponse)
async def get_page_crawl_health(
    include_test_crawl: bool = False,
):
    """
    Comprehensive health check for page crawl infrastructure.

    Diagnoses common issues that cause crawls to get stuck:
    - Windows event loop policy (ProactorEventLoop required)
    - Playwright browser installation
    - Crawl4AI initialization capability
    - APScheduler running status
    - Optional: End-to-end test crawl

    Args:
        include_test_crawl: Whether to perform actual crawl test (adds ~5-10s)

    Returns:
        HealthCheckResponse with detailed diagnostic information
    """
    start_time = asyncio.get_event_loop().time()
    timestamp = datetime.now(timezone.utc)
    checks: dict[str, HealthCheckDetail] = {}
    recommendations: list[str] = []

    # Check 1: Event Loop Policy (Windows-specific)
    try:
        if sys.platform == 'win32':
            policy = asyncio.get_event_loop_policy()
            loop = asyncio.get_running_loop()
            is_proactor = isinstance(loop, asyncio.ProactorEventLoop)

            if is_proactor:
                checks["event_loop_policy"] = HealthCheckDetail(
                    status="pass",
                    message="Windows ProactorEventLoop policy is correctly set",
                    details={
                        "policy_type": type(policy).__name__,
                        "loop_type": type(loop).__name__,
                        "platform": sys.platform
                    },
                    timestamp=datetime.now(timezone.utc)
                )
            else:
                checks["event_loop_policy"] = HealthCheckDetail(
                    status="fail",
                    message="Windows event loop policy is not ProactorEventLoop",
                    details={
                        "policy_type": type(policy).__name__,
                        "loop_type": type(loop).__name__,
                        "platform": sys.platform,
                        "expected": "ProactorEventLoop",
                        "actual": type(loop).__name__
                    },
                    timestamp=datetime.now(timezone.utc)
                )
                recommendations.append(
                    "Set event loop policy in main.py before uvicorn starts: "
                    "asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())"
                )
        else:
            checks["event_loop_policy"] = HealthCheckDetail(
                status="pass",
                message="Not Windows, event loop check not applicable",
                details={"platform": sys.platform},
                timestamp=datetime.now(timezone.utc)
            )
    except Exception as e:
        checks["event_loop_policy"] = HealthCheckDetail(
            status="fail",
            message=f"Failed to check event loop policy: {str(e)}",
            details={"error": str(e), "error_type": type(e).__name__},
            timestamp=datetime.now(timezone.utc)
        )
        recommendations.append("Investigate event loop configuration error")

    # Check 2: Playwright Installation
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser_type = p.chromium
            executable_path = browser_type.executable_path
            checks["playwright_installation"] = HealthCheckDetail(
                status="pass",
                message="Playwright Chromium browser is installed",
                details={"executable_path": str(executable_path)},
                timestamp=datetime.now(timezone.utc)
            )
    except ImportError as e:
        checks["playwright_installation"] = HealthCheckDetail(
            status="fail",
            message="Playwright not installed",
            details={"error": str(e)},
            timestamp=datetime.now(timezone.utc)
        )
        recommendations.append("Install Playwright: pip install playwright")
    except Exception as e:
        checks["playwright_installation"] = HealthCheckDetail(
            status="fail",
            message=f"Playwright browser not found: {str(e)}",
            details={"error": str(e), "error_type": type(e).__name__},
            timestamp=datetime.now(timezone.utc)
        )
        recommendations.append("Install Playwright browsers: playwright install chromium")

    # Check 3: Crawl4AI Initialization
    try:
        from app.services.crawl4ai_service import Crawl4AIService
        init_start = asyncio.get_event_loop().time()
        async with Crawl4AIService() as crawler:
            init_time_ms = int((asyncio.get_event_loop().time() - init_start) * 1000)
            checks["crawl4ai_initialization"] = HealthCheckDetail(
                status="pass",
                message="Crawl4AI service initialized successfully",
                details={"initialization_time_ms": init_time_ms},
                timestamp=datetime.now(timezone.utc)
            )
    except Exception as e:
        checks["crawl4ai_initialization"] = HealthCheckDetail(
            status="fail",
            message=f"Crawl4AI initialization failed: {str(e)}",
            details={
                "error": str(e),
                "error_type": type(e).__name__
            },
            timestamp=datetime.now(timezone.utc)
        )
        recommendations.append(
            f"Check Crawl4AI dependencies and event loop policy. Error: {str(e)}"
        )

    # Check 4: APScheduler Status
    try:
        from app.tasks.page_crawl_tasks import get_page_crawl_scheduler
        scheduler = get_page_crawl_scheduler()
        state = scheduler.state
        state_names = {
            STATE_STOPPED: "stopped",
            STATE_RUNNING: "running",
            STATE_PAUSED: "paused"
        }
        state_name = state_names.get(state, "unknown")
        job_count = len(scheduler.get_jobs())

        if state == STATE_RUNNING:
            checks["apscheduler_status"] = HealthCheckDetail(
                status="pass",
                message=f"APScheduler is running with {job_count} active jobs",
                details={
                    "state": state_name,
                    "state_code": state,
                    "job_count": job_count,
                    "scheduler_class": type(scheduler).__name__
                },
                timestamp=datetime.now(timezone.utc)
            )
        else:
            checks["apscheduler_status"] = HealthCheckDetail(
                status="fail",
                message=f"APScheduler is not running (state: {state_name})",
                details={
                    "state": state_name,
                    "state_code": state,
                    "job_count": job_count,
                    "expected_state": "running"
                },
                timestamp=datetime.now(timezone.utc)
            )
            recommendations.append(
                "APScheduler not running. Check main.py lifespan manager and ensure "
                "get_page_crawl_scheduler() is called during startup"
            )
    except Exception as e:
        checks["apscheduler_status"] = HealthCheckDetail(
            status="fail",
            message=f"Failed to check APScheduler status: {str(e)}",
            details={"error": str(e), "error_type": type(e).__name__},
            timestamp=datetime.now(timezone.utc)
        )
        recommendations.append("Check APScheduler initialization in main.py")

    # Check 5: Test Crawl (optional)
    if include_test_crawl:
        try:
            from app.services.crawl4ai_service import Crawl4AIService
            crawl_start = asyncio.get_event_loop().time()
            async with Crawl4AIService() as crawler:
                result = await asyncio.wait_for(
                    crawler.crawl_page("https://example.com"),
                    timeout=30.0
                )
                crawl_time_ms = int((asyncio.get_event_loop().time() - crawl_start) * 1000)

                if result.success:
                    checks["test_crawl"] = HealthCheckDetail(
                        status="pass",
                        message="Test crawl of example.com succeeded",
                        details={
                            "url": "https://example.com",
                            "status_code": result.status_code,
                            "crawl_time_ms": crawl_time_ms,
                            "html_length": len(result.html) if result.html else 0
                        },
                        timestamp=datetime.now(timezone.utc)
                    )
                else:
                    checks["test_crawl"] = HealthCheckDetail(
                        status="fail",
                        message=f"Test crawl failed: {result.error_message}",
                        details={
                            "url": "https://example.com",
                            "error": result.error_message,
                            "crawl_time_ms": crawl_time_ms
                        },
                        timestamp=datetime.now(timezone.utc)
                    )
                    recommendations.append(
                        f"Test crawl failed. Error: {result.error_message}"
                    )
        except asyncio.TimeoutError:
            checks["test_crawl"] = HealthCheckDetail(
                status="warn",
                message="Test crawl timed out after 30 seconds",
                details={"timeout_seconds": 30, "url": "https://example.com"},
                timestamp=datetime.now(timezone.utc)
            )
            recommendations.append(
                "Test crawl timed out. Check network connectivity and performance."
            )
        except Exception as e:
            checks["test_crawl"] = HealthCheckDetail(
                status="fail",
                message=f"Test crawl failed: {str(e)}",
                details={
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "url": "https://example.com"
                },
                timestamp=datetime.now(timezone.utc)
            )
            recommendations.append(
                f"Test crawl failed. Check network connectivity and Playwright. Error: {str(e)}"
            )

    # Calculate overall status
    statuses = [check.status for check in checks.values()]
    if "fail" in statuses:
        overall_status = "unhealthy"
    elif "warn" in statuses:
        overall_status = "degraded"
    else:
        overall_status = "healthy"

    # Calculate execution time
    execution_time_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)

    return HealthCheckResponse(
        overall_status=overall_status,
        timestamp=timestamp,
        checks=checks,
        execution_time_ms=execution_time_ms,
        recommendations=recommendations
    )
