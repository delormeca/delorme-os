"""
Client Page schemas for request/response validation.
These are pages discovered during engine setup, different from Project.pages.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import uuid
import datetime


class ClientPageBase(BaseModel):
    """Base schema for client page data."""
    url: str = Field(..., min_length=1, description="Full URL of the page")
    slug: Optional[str] = Field(None, description="URL slug for the page")


class ClientPageCreate(ClientPageBase):
    """Schema for creating a new client page."""
    client_id: uuid.UUID = Field(..., description="Client ID this page belongs to")


class ClientPageUpdate(BaseModel):
    """Schema for updating an existing client page."""
    status_code: Optional[int] = Field(None, ge=100, le=599, description="HTTP status code")
    is_failed: Optional[bool] = Field(None, description="Whether the page check failed")
    failure_reason: Optional[str] = Field(None, description="Reason for failure")
    retry_count: Optional[int] = Field(None, ge=0, description="Number of retry attempts")
    last_checked_at: Optional[datetime.datetime] = Field(None, description="Last time page was checked")


class ClientPageRead(ClientPageBase):
    """Schema for reading client page data with all Phase 3 fields."""
    model_config = {"from_attributes": True}

    id: uuid.UUID
    client_id: uuid.UUID
    status_code: Optional[int] = None
    is_failed: bool
    failure_reason: Optional[str] = None
    retry_count: int
    last_checked_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    # Phase 3: SEO Data Points (22 fields)
    # Core SEO Data
    page_title: Optional[str] = Field(default=None, description="HTML title tag")
    meta_title: Optional[str] = Field(default=None, description="SEO meta title")
    meta_description: Optional[str] = Field(default=None, description="SEO meta description")
    h1: Optional[str] = Field(default=None, description="Main H1 heading")
    canonical_url: Optional[str] = Field(default=None, description="Canonical URL")
    hreflang: Optional[str] = Field(default=None, description="Hreflang tags")
    meta_robots: Optional[str] = Field(default=None, description="Meta robots directives")
    word_count: Optional[int] = Field(default=None, description="Word count of body content")

    # Content Analysis
    body_content: Optional[str] = Field(default=None, description="Full page body text")
    webpage_structure: Optional[dict] = Field(default=None, description="Heading hierarchy structure")
    schema_markup: Optional[dict] = Field(default=None, description="Structured data/schema markup")
    salient_entities: Optional[dict] = Field(default=None, description="Named entities with salience scores")

    # Links
    internal_links: Optional[dict] = Field(default=None, description="Internal links found on page")
    external_links: Optional[dict] = Field(default=None, description="External links found on page")
    image_count: Optional[int] = Field(default=None, description="Number of images on page")

    # Embeddings
    body_content_embedding: Optional[str] = Field(default=None, description="Vector embedding of body content")

    # Screenshots
    screenshot_url: Optional[str] = Field(default=None, description="Screenshot thumbnail URL")
    screenshot_full_url: Optional[str] = Field(default=None, description="Full page screenshot URL")

    # Metadata
    last_crawled_at: Optional[datetime.datetime] = Field(default=None, description="Last crawl timestamp")
    crawl_run_id: Optional[uuid.UUID] = Field(default=None, description="Associated crawl run ID")


class ClientPageList(BaseModel):
    """Schema for paginated client page list response."""
    pages: list[ClientPageRead]
    total: int
    page: int
    page_size: int
    total_pages: int

    @field_validator("total_pages", mode="before")
    @classmethod
    def calculate_total_pages(cls, v, info):
        """Calculate total pages based on total count and page size."""
        if "total" in info.data and "page_size" in info.data:
            page_size = info.data["page_size"]
            total = info.data["total"]
            return (total + page_size - 1) // page_size if page_size > 0 else 0
        return v


class ClientPageSearchParams(BaseModel):
    """Schema for client page search/filter parameters."""
    client_id: Optional[uuid.UUID] = None
    is_failed: Optional[bool] = None
    status_code: Optional[int] = None
    search: Optional[str] = Field(None, description="Search in URL or slug")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(50, ge=1, le=100, description="Items per page")
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: str = Field("desc", description="Sort order (asc/desc)")

    @field_validator("sort_order")
    @classmethod
    def validate_sort_order(cls, v):
        """Validate sort order is either 'asc' or 'desc'."""
        if v not in ["asc", "desc"]:
            raise ValueError("sort_order must be 'asc' or 'desc'")
        return v
