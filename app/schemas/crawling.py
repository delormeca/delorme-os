"""
Schemas for crawling API endpoints.
"""
import datetime
import uuid
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class StartCrawlRequest(BaseModel):
    """Request schema for starting a crawl job."""

    project_id: uuid.UUID = Field(..., description="The project ID to crawl")


class StartCrawlResponse(BaseModel):
    """Response schema for starting a crawl job."""

    crawl_job_id: uuid.UUID = Field(..., description="The created crawl job ID")
    status: str = Field(..., description="Current status of the job")
    phase: str = Field(..., description="Current phase of the job")
    message: str = Field(..., description="Success message")


class CrawlJobStatusResponse(BaseModel):
    """Response schema for crawl job status."""

    id: uuid.UUID
    project_id: uuid.UUID
    phase: str = Field(..., description="Current phase: discovering, testing, extracting, completed, failed")
    status: str = Field(..., description="Current status: pending, running, completed, failed")

    # Discovery results
    urls_discovered: int
    discovery_method: Optional[str] = None

    # Testing results
    test_results: Optional[Dict] = None
    winning_method: Optional[str] = None

    # Extraction results
    pages_total: int
    pages_crawled: int
    pages_failed: int

    # Timing
    started_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None

    # Errors
    error_message: Optional[str] = None

    # Progress percentage
    progress_percentage: float = Field(default=0.0, description="Overall progress percentage")

    class Config:
        from_attributes = True


class AddManualPageRequest(BaseModel):
    """Request schema for manually adding a page to crawl."""

    project_id: uuid.UUID = Field(..., description="The project ID")
    url: str = Field(..., description="The page URL to add")
    slug: Optional[str] = Field(None, description="Optional slug for the page")


class AddManualPageResponse(BaseModel):
    """Response schema for manually adding a page."""

    page_id: uuid.UUID
    url: str
    slug: str
    status: str
    message: str


class PageDataResponse(BaseModel):
    """Response schema for page data."""

    id: uuid.UUID
    page_id: uuid.UUID
    data_type: str
    content: Dict
    extracted_at: datetime.datetime

    class Config:
        from_attributes = True


class PageDetailResponse(BaseModel):
    """Response schema for detailed page information."""

    id: uuid.UUID
    project_id: uuid.UUID
    url: str
    slug: str
    status: str
    extraction_method: Optional[str] = None
    last_crawled_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime

    # Page data
    page_data: List[PageDataResponse] = []

    class Config:
        from_attributes = True


class CancelCrawlJobRequest(BaseModel):
    """Request schema for canceling a crawl job."""

    crawl_job_id: uuid.UUID = Field(..., description="The crawl job ID to cancel")


class CancelCrawlJobResponse(BaseModel):
    """Response schema for canceling a crawl job."""

    success: bool
    message: str


class RescanSitemapRequest(BaseModel):
    """Request schema for re-scanning sitemap."""

    project_id: uuid.UUID = Field(..., description="The project ID to rescan")


class RescanSitemapResponse(BaseModel):
    """Response schema for re-scanning sitemap."""

    new_urls: List[str] = Field(..., description="Newly discovered URLs")
    removed_urls: List[str] = Field(..., description="URLs removed from sitemap")
    new_count: int = Field(..., description="Number of new URLs")
    removed_count: int = Field(..., description="Number of removed URLs")
    unchanged_count: int = Field(..., description="Number of unchanged URLs")
    total_in_sitemap: int = Field(..., description="Total URLs in current sitemap")
    message: str = Field(..., description="Summary message")


class ScrapeSelectedPagesRequest(BaseModel):
    """Request schema for scraping selected pages."""

    page_ids: List[uuid.UUID] = Field(..., description="List of page IDs to scrape")
    extraction_method: str = Field("crawl4ai", description="Extraction method: crawl4ai or jina")


class ScrapeSelectedPagesResponse(BaseModel):
    """Response schema for scraping selected pages."""

    success_count: int
    failed_count: int
    total: int
    results: List[Dict]
    message: str


class PageWithStatsResponse(BaseModel):
    """Response schema for page with statistics."""

    id: str
    url: str
    slug: str
    status: str
    is_in_sitemap: bool
    removed_from_sitemap_at: Optional[str] = None
    extraction_method: Optional[str] = None
    last_crawled_at: Optional[str] = None
    created_at: str
    version_count: int
    current_data: Dict
