"""
API endpoints for page crawling and data extraction (Phase 4).
"""
import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

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
        job_id = schedule_page_crawl(
            client_id=request.client_id,
            run_type=request.run_type,
            selected_page_ids=request.selected_page_ids,
            crawl_run_id=crawl_run_id,
        )

        # Return crawl_run_id as job_id so frontend can track status
        return JobResponse(
            job_id=str(crawl_run_id),
            message=f"Crawl job scheduled successfully. Crawl Run ID: {crawl_run_id}",
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
