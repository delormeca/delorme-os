"""
Apify Crawler API Controller

Provides manual START/STOP/PAUSE controls for Apify crawls with real-time status monitoring.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import BaseModel, Field

from app.db import get_async_db_session
from app.schemas.auth import CurrentUserResponse
from app.services.users_service import get_current_user
from app.services.crawler_service import get_crawler_service

router = APIRouter()


# Pydantic schemas for request/response
class CrawlStartRequest(BaseModel):
    """Request to start a new crawl."""

    client_id: UUID = Field(..., description="Client ID to crawl")
    urls: Optional[List[str]] = Field(None, description="URLs to crawl (if None, uses client base_url)")
    max_depth: int = Field(0, ge=0, description="Maximum crawl depth (0 = exact URLs only)")
    save_html: bool = Field(True, description="Whether to save HTML")
    save_markdown: bool = Field(True, description="Whether to save markdown")
    save_screenshots: bool = Field(True, description="Whether to capture screenshots")


class CrawlStartResponse(BaseModel):
    """Response after starting a crawl."""

    id: str = Field(..., description="Crawl run ID")
    client_id: str = Field(..., description="Client ID")
    apify_run_id: Optional[str] = Field(None, description="Apify run ID")
    status: str = Field(..., description="Crawl status")
    started_at: Optional[str] = Field(None, description="Start timestamp")
    message: str = Field(..., description="Status message")


class CrawlStatusResponse(BaseModel):
    """Crawl status response."""

    id: str = Field(..., description="Crawl run ID")
    client_id: str = Field(..., description="Client ID")
    apify_run_id: Optional[str] = Field(None, description="Apify run ID")
    status: str = Field(..., description="Current status")
    total_pages: int = Field(..., description="Total pages to crawl")
    pages_crawled: int = Field(..., description="Pages crawled so far")
    pages_failed: int = Field(..., description="Pages that failed")
    started_at: Optional[str] = Field(None, description="Start timestamp")
    completed_at: Optional[str] = Field(None, description="Completion timestamp")
    apify_status: Optional[Dict[str, Any]] = Field(None, description="Detailed Apify status")


class CrawlControlResponse(BaseModel):
    """Response for control actions (stop/pause)."""

    success: bool = Field(..., description="Whether the action succeeded")
    crawl_run_id: str = Field(..., description="Crawl run ID")
    action: str = Field(..., description="Action performed")
    message: str = Field(..., description="Status message")


class CrawlProcessResponse(BaseModel):
    """Response after processing crawl results."""

    crawl_run_id: str = Field(..., description="Crawl run ID")
    pages_processed: int = Field(..., description="Pages processed")
    embeddings_generated: int = Field(..., description="Embeddings generated")
    embedding_errors: int = Field(0, description="Embedding errors")
    similarity_calculated: int = Field(..., description="Similarity calculations")
    message: str = Field(..., description="Status message")


@router.post("/clients/{client_id}/crawl/start", response_model=CrawlStartResponse)
async def start_crawl(
    client_id: UUID,
    crawl_data: CrawlStartRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    **START a new Apify crawl (MANUAL TRIGGER).**

    This endpoint allows users to manually trigger a crawl for a client.
    The crawl runs asynchronously in Apify's cloud infrastructure.

    **Features:**
    - Manual start control
    - Customizable crawl depth
    - Optional HTML/Markdown/Screenshots
    - Returns immediately with crawl run ID for status monitoring

    **Usage:**
    1. Call this endpoint to start crawl
    2. Use the returned `id` to monitor status via `/status` endpoint
    3. Stop or pause anytime using control endpoints
    """
    crawler_service = get_crawler_service(db)

    # Validate client_id matches request body
    if client_id != crawl_data.client_id:
        raise HTTPException(
            status_code=400,
            detail="Client ID in path must match client_id in request body"
        )

    # Start the crawl
    crawl_run = await crawler_service.start_crawl(
        client_id=client_id,
        urls=crawl_data.urls,
        max_depth=crawl_data.max_depth,
        save_html=crawl_data.save_html,
        save_markdown=crawl_data.save_markdown,
        save_screenshots=crawl_data.save_screenshots,
    )

    if not crawl_run:
        raise HTTPException(
            status_code=500,
            detail="Failed to start crawl. Check Apify API token configuration."
        )

    return CrawlStartResponse(
        id=str(crawl_run.id),
        client_id=str(crawl_run.client_id),
        apify_run_id=crawl_run.apify_run_id,
        status=crawl_run.status,
        started_at=crawl_run.started_at.isoformat() if crawl_run.started_at else None,
        message=f"Crawl started successfully. Run ID: {crawl_run.apify_run_id}"
    )


@router.post("/crawl/{crawl_run_id}/stop", response_model=CrawlControlResponse)
async def stop_crawl(
    crawl_run_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    **STOP/ABORT a running crawl immediately.**

    This endpoint allows users to forcefully stop a running crawl.
    The crawl is aborted immediately in Apify's infrastructure.

    **Features:**
    - Immediate abort
    - Stops consuming Apify compute units
    - Partial results may be available for processing

    **Usage:**
    Call this endpoint with the crawl run ID to immediately stop the crawl.
    """
    crawler_service = get_crawler_service(db)

    success = await crawler_service.stop_crawl(crawl_run_id)

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to stop crawl. It may have already completed or been aborted."
        )

    return CrawlControlResponse(
        success=True,
        crawl_run_id=str(crawl_run_id),
        action="stop",
        message="Crawl stopped successfully"
    )


@router.post("/crawl/{crawl_run_id}/pause", response_model=CrawlControlResponse)
async def pause_crawl(
    crawl_run_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    **PAUSE a running crawl gracefully.**

    This endpoint allows users to pause a running crawl.
    Note: Apify doesn't support native pause/resume, so this performs a graceful stop.
    To resume, you would need to start a new crawl with remaining URLs.

    **Features:**
    - Graceful stop
    - Partial results available for processing

    **Usage:**
    Call this endpoint with the crawl run ID to pause the crawl.
    """
    crawler_service = get_crawler_service(db)

    success = await crawler_service.pause_crawl(crawl_run_id)

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to pause crawl. It may have already completed or been aborted."
        )

    return CrawlControlResponse(
        success=True,
        crawl_run_id=str(crawl_run_id),
        action="pause",
        message="Crawl paused successfully (graceful stop)"
    )


@router.get("/crawl/{crawl_run_id}/status", response_model=CrawlStatusResponse)
async def get_crawl_status(
    crawl_run_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    **Get real-time status of a crawl run.**

    This endpoint provides live status monitoring for a crawl.
    It fetches the latest status from Apify and updates the local database.

    **Status Values:**
    - `READY`: Crawl is queued but not started
    - `RUNNING`: Crawl is actively running
    - `SUCCEEDED`: Crawl completed successfully
    - `FAILED`: Crawl failed with errors
    - `ABORTED`: Crawl was manually stopped
    - `TIMED-OUT`: Crawl exceeded timeout

    **Usage:**
    Poll this endpoint to monitor crawl progress. Recommended interval: 5-10 seconds.
    """
    crawler_service = get_crawler_service(db)

    status = await crawler_service.get_crawl_status(crawl_run_id)

    if not status:
        raise HTTPException(
            status_code=404,
            detail=f"Crawl run not found: {crawl_run_id}"
        )

    return CrawlStatusResponse(**status)


@router.post("/crawl/{crawl_run_id}/process", response_model=CrawlProcessResponse)
async def process_crawl_results(
    crawl_run_id: UUID,
    generate_embeddings: bool = True,
    calculate_similarity: bool = True,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    **Process completed crawl results.**

    This endpoint fetches results from Apify, generates embeddings, and calculates similarity.
    Call this after a crawl completes (status = SUCCEEDED).

    **Processing Steps:**
    1. Fetch all crawled pages from Apify dataset
    2. Create ClientPageVersion records with all 83 data columns
    3. Generate 3 OpenAI embeddings per page (raw_text, page_title, slug)
    4. Calculate cosine similarity for "similar to" recommendations

    **Features:**
    - Automatic embedding generation (optional)
    - Similarity calculations (optional)
    - Historical versioning

    **Usage:**
    Call this endpoint after crawl completes to persist and process all results.
    """
    crawler_service = get_crawler_service(db)

    result = await crawler_service.process_crawl_results(
        crawl_run_id=crawl_run_id,
        generate_embeddings=generate_embeddings,
        calculate_similarity=calculate_similarity,
    )

    if "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )

    return CrawlProcessResponse(
        crawl_run_id=str(crawl_run_id),
        pages_processed=result.get("pages_processed", 0),
        embeddings_generated=result.get("embeddings_generated", 0),
        embedding_errors=result.get("embedding_errors", 0),
        similarity_calculated=result.get("similarity_calculated", 0),
        message=f"Processed {result.get('pages_processed', 0)} pages successfully"
    )


@router.get("/clients/{client_id}/crawls", response_model=List[CrawlStatusResponse])
async def get_client_crawls(
    client_id: UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    **Get all crawl runs for a client.**

    Returns a list of all crawl runs for the specified client,
    ordered by most recent first.

    **Usage:**
    Use this to display crawl history in the UI.
    """
    from sqlmodel import select
    from app.models import ApifyCrawlRun

    # Query crawl runs for client
    result = await db.execute(
        select(ApifyCrawlRun)
        .where(ApifyCrawlRun.client_id == client_id)
        .order_by(ApifyCrawlRun.created_at.desc())
        .limit(limit)
    )
    crawl_runs = result.scalars().all()

    # Convert to response format
    return [
        CrawlStatusResponse(
            id=str(run.id),
            client_id=str(run.client_id),
            apify_run_id=run.apify_run_id,
            status=run.status,
            total_pages=run.total_pages,
            pages_crawled=run.pages_crawled,
            pages_failed=run.pages_failed,
            started_at=run.started_at.isoformat() if run.started_at else None,
            completed_at=run.completed_at.isoformat() if run.completed_at else None,
            apify_status=None,
        )
        for run in crawl_runs
    ]


class PullPagesResponse(BaseModel):
    """Response after pulling pages from sitemap tracker."""

    total_urls_in_sitemap: int = Field(..., description="Total URLs in latest sitemap")
    new_pages_added: int = Field(..., description="Number of new pages added")
    existing_pages_skipped: int = Field(..., description="Number of pages that already existed")
    pages: List[str] = Field(..., description="URLs of newly added pages")
    message: str = Field(..., description="Status message")


@router.post("/clients/{client_id}/pull-from-sitemap", response_model=PullPagesResponse)
async def pull_pages_from_sitemap(
    client_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    **Pull latest pages from sitemap tracker and add them to the client.**

    This endpoint:
    1. Gets the latest completed sitemap tracker run
    2. Extracts all URLs from the sitemap
    3. Checks which URLs don't already exist in ClientPage
    4. Adds only the new URLs to ClientPage

    **Purpose:**
    - Allows crawler to import pages discovered by sitemap tracker
    - Only adds pages that haven't been added yet (no duplicates)
    - Works alongside manual page addition

    **Usage:**
    Call this endpoint before starting a crawl to ensure all sitemap URLs are available.
    """
    from sqlmodel import select
    from app.models import Client, ClientPage, SitemapTrackerRun, PageSource
    from app.utils.helpers import get_utcnow
    from sqlalchemy import desc

    # Get client
    client_result = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    client = client_result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=404,
            detail=f"Client with ID {client_id} not found"
        )

    # Get latest completed sitemap tracker run
    run_result = await db.execute(
        select(SitemapTrackerRun)
        .where(
            SitemapTrackerRun.client_id == client_id,
            SitemapTrackerRun.status == "completed"
        )
        .order_by(desc(SitemapTrackerRun.completed_at))
        .limit(1)
    )
    latest_run = run_result.scalar_one_or_none()

    if not latest_run:
        raise HTTPException(
            status_code=404,
            detail="No completed sitemap tracker run found for this client. Please run sitemap tracker first."
        )

    # Get all URLs from the sitemap (from comparison_baseline_snapshot)
    sitemap_urls = []
    if latest_run.comparison_baseline_snapshot:
        sitemap_urls = list(latest_run.comparison_baseline_snapshot.keys())

    if not sitemap_urls:
        return PullPagesResponse(
            total_urls_in_sitemap=0,
            new_pages_added=0,
            existing_pages_skipped=0,
            pages=[],
            message="No URLs found in sitemap tracker run"
        )

    # Get existing page URLs for this client
    existing_pages_result = await db.execute(
        select(ClientPage.url).where(ClientPage.client_id == client_id)
    )
    existing_urls = set(row[0] for row in existing_pages_result.fetchall())

    # Find URLs that don't exist yet
    new_urls = [url for url in sitemap_urls if url not in existing_urls]

    # Add new pages to ClientPage
    new_pages = []
    for url in new_urls:
        # Extract slug from URL (last part of path)
        url_parts = url.rstrip('/').split('/')
        slug = url_parts[-1] if len(url_parts) > 3 else ''

        page = ClientPage(
            client_id=client_id,
            url=url,
            slug=slug,
            source=PageSource.SITEMAP_AUTO,  # Mark as coming from sitemap
            created_at=get_utcnow(),
            updated_at=get_utcnow()
        )
        new_pages.append(page)

    if new_pages:
        db.add_all(new_pages)
        await db.commit()

    return PullPagesResponse(
        total_urls_in_sitemap=len(sitemap_urls),
        new_pages_added=len(new_pages),
        existing_pages_skipped=len(sitemap_urls) - len(new_pages),
        pages=new_urls[:100],  # Return first 100 URLs to avoid huge response
        message=f"Successfully added {len(new_pages)} new pages from sitemap. {len(sitemap_urls) - len(new_pages)} pages already existed."
    )
