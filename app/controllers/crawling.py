"""
API endpoints for web crawling and content extraction.
"""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db import get_async_db_session
from app.models import CrawlJob, Page, Project
from app.schemas.auth import CurrentUserResponse
from app.schemas.crawling import (
    AddManualPageRequest,
    AddManualPageResponse,
    CancelCrawlJobRequest,
    CancelCrawlJobResponse,
    CrawlJobStatusResponse,
    PageDetailResponse,
    PageWithStatsResponse,
    RescanSitemapRequest,
    RescanSitemapResponse,
    ScrapeSelectedPagesRequest,
    ScrapeSelectedPagesResponse,
    StartCrawlRequest,
    StartCrawlResponse,
)
from app.services.crawling_service import CrawlingService
from app.services.users_service import get_current_user
from app.tasks.crawl_tasks import cancel_crawl_job, schedule_crawl_job
from app.utils.helpers import get_utcnow

router = APIRouter()


@router.post("/start", response_model=StartCrawlResponse)
async def start_crawl_job(
    request: StartCrawlRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> StartCrawlResponse:
    """
    Start a new crawl job for a project.

    This endpoint initiates a background crawl job that will:
    1. Discover URLs from sitemap or crawling
    2. Test multiple extraction methods
    3. Extract content from all pages using the best method

    Args:
        request: Request containing project_id
        current_user: Authenticated user
        db: Database session

    Returns:
        StartCrawlResponse with job details
    """
    # Verify project exists and user has access
    result = await db.execute(
        select(Project).where(Project.id == request.project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Create crawl job in database
    crawling_service = CrawlingService(db)
    crawl_job = await crawling_service.start_crawl_job(request.project_id)

    # Schedule background task
    job_id = schedule_crawl_job(request.project_id)

    return StartCrawlResponse(
        crawl_job_id=crawl_job.id,
        status=crawl_job.status,
        phase=crawl_job.phase,
        message=f"Crawl job started successfully. Job ID: {job_id}",
    )


@router.get("/status/{crawl_job_id}", response_model=CrawlJobStatusResponse)
async def get_crawl_job_status(
    crawl_job_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> CrawlJobStatusResponse:
    """
    Get the status of a crawl job.

    Args:
        crawl_job_id: The crawl job ID
        current_user: Authenticated user
        db: Database session

    Returns:
        CrawlJobStatusResponse with job status
    """
    result = await db.execute(
        select(CrawlJob).where(CrawlJob.id == crawl_job_id)
    )
    crawl_job = result.scalar_one_or_none()

    if not crawl_job:
        raise HTTPException(status_code=404, detail="Crawl job not found")

    # Calculate progress percentage
    progress_percentage = 0.0
    if crawl_job.phase == "discovering":
        progress_percentage = 10.0
    elif crawl_job.phase == "testing":
        progress_percentage = 30.0
    elif crawl_job.phase == "extracting":
        if crawl_job.pages_total > 0:
            progress_percentage = 30.0 + (
                (crawl_job.pages_crawled / crawl_job.pages_total) * 70.0
            )
    elif crawl_job.phase == "completed":
        progress_percentage = 100.0

    return CrawlJobStatusResponse(
        id=crawl_job.id,
        project_id=crawl_job.project_id,
        phase=crawl_job.phase,
        status=crawl_job.status,
        urls_discovered=crawl_job.urls_discovered,
        discovery_method=crawl_job.discovery_method,
        test_results=crawl_job.test_results,
        winning_method=crawl_job.winning_method,
        pages_total=crawl_job.pages_total,
        pages_crawled=crawl_job.pages_crawled,
        pages_failed=crawl_job.pages_failed,
        started_at=crawl_job.started_at,
        completed_at=crawl_job.completed_at,
        error_message=crawl_job.error_message,
        progress_percentage=round(progress_percentage, 2),
    )


@router.post("/manual-page", response_model=AddManualPageResponse)
async def add_manual_page(
    request: AddManualPageRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> AddManualPageResponse:
    """
    Manually add a page URL to a project.

    Args:
        request: Request containing project_id and URL
        current_user: Authenticated user
        db: Database session

    Returns:
        AddManualPageResponse with page details
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == request.project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Generate slug if not provided
    slug = request.slug
    if not slug:
        from urllib.parse import urlparse

        parsed_url = urlparse(request.url)
        slug = parsed_url.path.strip("/") or "home"

    # Check if page already exists
    existing_page_result = await db.execute(
        select(Page).where(
            Page.project_id == request.project_id, Page.url == request.url
        )
    )
    existing_page = existing_page_result.scalar_one_or_none()

    if existing_page:
        raise HTTPException(status_code=400, detail="Page URL already exists")

    # Create new page
    page = Page(
        project_id=request.project_id,
        url=request.url,
        slug=slug,
        status="discovered",
        created_at=get_utcnow(),
    )
    db.add(page)
    await db.commit()
    await db.refresh(page)

    return AddManualPageResponse(
        page_id=page.id,
        url=page.url,
        slug=page.slug,
        status=page.status,
        message="Page added successfully",
    )


@router.get("/project/{project_id}/pages", response_model=List[PageDetailResponse])
async def get_project_pages(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> List[PageDetailResponse]:
    """
    Get all pages for a project.

    Args:
        project_id: The project ID
        current_user: Authenticated user
        db: Database session

    Returns:
        List of PageDetailResponse
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get all pages
    pages_result = await db.execute(
        select(Page).where(Page.project_id == project_id)
    )
    pages = pages_result.scalars().all()

    return [
        PageDetailResponse(
            id=page.id,
            project_id=page.project_id,
            url=page.url,
            slug=page.slug,
            status=page.status,
            extraction_method=page.extraction_method,
            last_crawled_at=page.last_crawled_at,
            created_at=page.created_at,
            page_data=page.page_data,
        )
        for page in pages
    ]


@router.get("/project/{project_id}/crawl-jobs", response_model=List[CrawlJobStatusResponse])
async def get_project_crawl_jobs(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> List[CrawlJobStatusResponse]:
    """
    Get all crawl jobs for a project.

    Args:
        project_id: The project ID
        current_user: Authenticated user
        db: Database session

    Returns:
        List of CrawlJobStatusResponse
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get all crawl jobs
    crawl_jobs_result = await db.execute(
        select(CrawlJob)
        .where(CrawlJob.project_id == project_id)
        .order_by(CrawlJob.created_at.desc())
    )
    crawl_jobs = crawl_jobs_result.scalars().all()

    return [
        CrawlJobStatusResponse(
            id=job.id,
            project_id=job.project_id,
            phase=job.phase,
            status=job.status,
            urls_discovered=job.urls_discovered,
            discovery_method=job.discovery_method,
            test_results=job.test_results,
            winning_method=job.winning_method,
            pages_total=job.pages_total,
            pages_crawled=job.pages_crawled,
            pages_failed=job.pages_failed,
            started_at=job.started_at,
            completed_at=job.completed_at,
            error_message=job.error_message,
            progress_percentage=0.0,  # Calculate if needed
        )
        for job in crawl_jobs
    ]


@router.post("/cancel", response_model=CancelCrawlJobResponse)
async def cancel_crawl_job_endpoint(
    request: CancelCrawlJobRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> CancelCrawlJobResponse:
    """
    Cancel a running crawl job.

    Args:
        request: Request containing crawl_job_id
        current_user: Authenticated user
        db: Database session

    Returns:
        CancelCrawlJobResponse with cancellation result
    """
    # Verify crawl job exists
    result = await db.execute(
        select(CrawlJob).where(CrawlJob.id == request.crawl_job_id)
    )
    crawl_job = result.scalar_one_or_none()

    if not crawl_job:
        raise HTTPException(status_code=404, detail="Crawl job not found")

    # Cancel the scheduled job
    job_id = f"crawl_job_{crawl_job.project_id}"
    success = cancel_crawl_job(job_id)

    if success:
        # Update job status in database
        crawl_job.status = "failed"
        crawl_job.error_message = "Cancelled by user"
        await db.commit()

        return CancelCrawlJobResponse(
            success=True, message="Crawl job cancelled successfully"
        )
    else:
        return CancelCrawlJobResponse(
            success=False, message="Crawl job could not be cancelled (may already be completed)"
        )


@router.post("/rescan-sitemap", response_model=RescanSitemapResponse)
async def rescan_sitemap(
    request: RescanSitemapRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> RescanSitemapResponse:
    """
    Re-scan sitemap and detect changes.

    Compares current sitemap with existing pages and returns:
    - New URLs discovered
    - URLs removed from sitemap
    - Unchanged URLs

    Args:
        request: Request containing project_id
        current_user: Authenticated user
        db: Database session

    Returns:
        RescanSitemapResponse with diff results
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == request.project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Rescan sitemap
    crawling_service = CrawlingService(db)
    diff_result = await crawling_service.rescan_sitemap(request.project_id)

    # Create summary message
    message = f"Scan complete: {diff_result['new_count']} new, {diff_result['removed_count']} removed, {diff_result['unchanged_count']} unchanged"

    return RescanSitemapResponse(
        new_urls=diff_result["new_urls"],
        removed_urls=diff_result["removed_urls"],
        new_count=diff_result["new_count"],
        removed_count=diff_result["removed_count"],
        unchanged_count=diff_result["unchanged_count"],
        total_in_sitemap=diff_result["total_in_sitemap"],
        message=message,
    )


@router.post("/scrape-selected", response_model=ScrapeSelectedPagesResponse)
async def scrape_selected_pages(
    request: ScrapeSelectedPagesRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> ScrapeSelectedPagesResponse:
    """
    Scrape selected pages using specified extraction method.

    Args:
        request: Request containing page_ids and extraction_method
        current_user: Authenticated user
        db: Database session

    Returns:
        ScrapeSelectedPagesResponse with scraping results
    """
    print(f"🟢 scrape_selected_pages endpoint called!")
    print(f"🟢 Request: page_ids={request.page_ids}, extraction_method={request.extraction_method}")
    print(f"🟢 Current user: {current_user.email if current_user else 'None'}")

    # Scrape pages
    crawling_service = CrawlingService(db)
    result = await crawling_service.scrape_selected_pages(
        request.page_ids, request.extraction_method
    )

    message = f"Scraped {result['success_count']}/{result['total']} pages successfully using {request.extraction_method}"

    return ScrapeSelectedPagesResponse(
        success_count=result["success_count"],
        failed_count=result["failed_count"],
        total=result["total"],
        results=result["results"],
        message=message,
    )


@router.get("/project/{project_id}/pages-with-stats", response_model=List[PageWithStatsResponse])
async def get_project_pages_with_stats(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> List[PageWithStatsResponse]:
    """
    Get all pages for a project with crawl statistics.

    Includes current page data, version count, and crawl status.

    Args:
        project_id: The project ID
        current_user: Authenticated user
        db: Database session

    Returns:
        List of PageWithStatsResponse
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get pages with stats
    crawling_service = CrawlingService(db)
    pages = await crawling_service.get_pages_with_stats(project_id)

    return [PageWithStatsResponse(**page) for page in pages]
