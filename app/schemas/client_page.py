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
    tags: Optional[list[str]] = Field(None, description="Array of tags for filtering and categorization")

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v):
        """Validate tags array contains only non-empty strings."""
        if v is None:
            return v
        if not isinstance(v, list):
            raise ValueError("tags must be an array")
        for tag in v:
            if not isinstance(tag, str):
                raise ValueError("Each tag must be a string")
            if not tag.strip():
                raise ValueError("Tags cannot be empty strings")
        # Remove duplicates while preserving order
        seen = set()
        validated = []
        for tag in v:
            if tag not in seen:
                seen.add(tag)
                validated.append(tag)
        return validated


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
    schema_markup: Optional[list] = Field(default=None, description="Structured data/schema markup (array of JSON-LD objects)")
    salient_entities: Optional[dict] = Field(default=None, description="Named entities with salience scores")

    # Links
    internal_links: Optional[list] = Field(default=None, description="Internal links found on page")
    external_links: Optional[list] = Field(default=None, description="External links found on page")
    image_count: Optional[int] = Field(default=None, description="Number of images on page")

    # Embeddings
    body_content_embedding: Optional[str] = Field(default=None, description="Vector embedding of body content")

    # Screenshots
    screenshot_url: Optional[str] = Field(default=None, description="Screenshot thumbnail URL")
    screenshot_full_url: Optional[str] = Field(default=None, description="Full page screenshot URL")

    # Tags
    tags: Optional[list[str]] = Field(default=None, description="Array of tags for filtering and categorization")

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
    tags: Optional[list[str]] = Field(None, description="Filter by tags (pages containing ANY of these tags)")
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


# Enhanced Crawler Table Schemas with Historical Tracking

class DatapointHistory(BaseModel):
    """Historical value for a single datapoint."""
    value: Optional[str | int | float | bool | dict | list] = Field(None, description="Historical value")
    crawled_at: datetime.datetime = Field(..., description="When this value was crawled")
    crawl_run_id: uuid.UUID = Field(..., description="Crawl run that produced this value")
    version: int = Field(..., description="Version number")


class EnhancedDatapoint(BaseModel):
    """Datapoint with current value and historical versions."""
    current: Optional[str | int | float | bool | dict | list] = Field(None, description="Current/latest value")
    history: list[DatapointHistory] = Field(default_factory=list, description="Historical values ordered by crawled_at desc")
    has_changed: bool = Field(False, description="Whether value changed from previous crawl")


class EnhancedCrawlPageData(BaseModel):
    """Enhanced page data with historical tracking for all 83 datapoints from Apify."""
    model_config = {"from_attributes": True}

    # Core identifiers
    id: uuid.UUID
    url: str
    slug: Optional[str] = None

    # Status with history
    status_code: EnhancedDatapoint

    # Core SEO datapoints with history
    page_title: EnhancedDatapoint
    meta_title: EnhancedDatapoint
    meta_description: EnhancedDatapoint
    h1: EnhancedDatapoint
    canonical_url: EnhancedDatapoint
    meta_robots: EnhancedDatapoint
    word_count: EnhancedDatapoint

    # Dates with history
    publishing_date: EnhancedDatapoint
    last_modified: EnhancedDatapoint

    # Headings with history
    h1_count: EnhancedDatapoint
    h2_count: EnhancedDatapoint
    h3_count: EnhancedDatapoint
    h4_count: EnhancedDatapoint
    h5_count: EnhancedDatapoint
    h6_count: EnhancedDatapoint
    h1_list: EnhancedDatapoint
    webpage_structure: EnhancedDatapoint

    # Content with history
    raw_text: EnhancedDatapoint
    markdown_text: EnhancedDatapoint
    character_count: EnhancedDatapoint
    readability_score: EnhancedDatapoint

    # Page metrics with history
    page_weight_kb: EnhancedDatapoint
    page_weight_mb: EnhancedDatapoint
    load_time_ms: EnhancedDatapoint

    # SEO metadata with history
    meta_keywords: EnhancedDatapoint
    meta_viewport: EnhancedDatapoint
    meta_generator: EnhancedDatapoint

    # Structured data with history
    schema_markup: EnhancedDatapoint
    schema_types: EnhancedDatapoint
    hreflang: EnhancedDatapoint

    # Links with history
    internal_links: EnhancedDatapoint
    internal_link_count: EnhancedDatapoint
    external_links: EnhancedDatapoint
    external_link_count: EnhancedDatapoint
    total_link_count: EnhancedDatapoint

    # Media with history
    image_count: EnhancedDatapoint
    image_alt_texts: EnhancedDatapoint
    video_count: EnhancedDatapoint
    iframe_count: EnhancedDatapoint

    # Open Graph with history
    og_title: EnhancedDatapoint
    og_description: EnhancedDatapoint
    og_image: EnhancedDatapoint
    og_type: EnhancedDatapoint
    og_url: EnhancedDatapoint
    og_site_name: EnhancedDatapoint
    og_locale: EnhancedDatapoint

    # Twitter Card with history
    twitter_card: EnhancedDatapoint
    twitter_title: EnhancedDatapoint
    twitter_description: EnhancedDatapoint
    twitter_image: EnhancedDatapoint
    twitter_site: EnhancedDatapoint
    twitter_creator: EnhancedDatapoint

    # Facebook with history
    fb_app_id: EnhancedDatapoint
    fb_admins: EnhancedDatapoint

    # Apify crawl info with history
    http_status_code: EnhancedDatapoint
    apify_loaded_url: EnhancedDatapoint
    apify_loaded_time: EnhancedDatapoint
    apify_referrer_url: EnhancedDatapoint
    apify_crawl_depth: EnhancedDatapoint
    apify_request_handler_mode: EnhancedDatapoint

    # Apify flags with history
    apify_has_html: EnhancedDatapoint
    apify_has_markdown: EnhancedDatapoint
    apify_has_screenshot: EnhancedDatapoint

    # Screenshots with history
    screenshot_url: EnhancedDatapoint
    screenshot_file: EnhancedDatapoint

    # HTML technical info with history
    html_lang: EnhancedDatapoint
    html_dir: EnhancedDatapoint
    charset: EnhancedDatapoint
    favicon: EnhancedDatapoint

    # Forms & interactivity with history
    form_count: EnhancedDatapoint
    input_count: EnhancedDatapoint
    button_count: EnhancedDatapoint

    # Scripts & styles with history
    script_count: EnhancedDatapoint
    style_count: EnhancedDatapoint
    external_scripts: EnhancedDatapoint
    external_stylesheets: EnhancedDatapoint

    # Language & author with history
    language: EnhancedDatapoint
    author: EnhancedDatapoint

    # Additional metadata
    tags: Optional[list[str]] = None
    last_crawled_at: Optional[datetime.datetime] = None
    crawl_count: int = Field(0, description="Total number of times crawled")
    created_at: datetime.datetime


class EnhancedCrawlResultsList(BaseModel):
    """Paginated list of enhanced crawl results with historical tracking."""
    pages: list[EnhancedCrawlPageData]
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
