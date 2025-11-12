"""
Engine Setup schemas for request/response validation.
"""
from pydantic import BaseModel, Field, field_validator, HttpUrl
from typing import Optional, Literal
import uuid
import datetime


class EngineSetupRequest(BaseModel):
    """Schema for starting an engine setup run."""
    client_id: uuid.UUID = Field(..., description="Client ID to run setup for")
    setup_type: Literal["sitemap", "manual"] = Field(..., description="Type of setup: sitemap or manual")
    sitemap_url: Optional[str] = Field(None, description="Sitemap URL (required for sitemap type)")
    manual_urls: Optional[list[str]] = Field(None, description="List of URLs (required for manual type)")

    @field_validator("sitemap_url")
    @classmethod
    def validate_sitemap_url(cls, v, info):
        """Validate sitemap URL is provided when setup_type is sitemap."""
        if info.data.get("setup_type") == "sitemap" and not v:
            raise ValueError("sitemap_url is required when setup_type is 'sitemap'")
        return v

    @field_validator("manual_urls")
    @classmethod
    def validate_manual_urls(cls, v, info):
        """Validate manual URLs are provided when setup_type is manual."""
        if info.data.get("setup_type") == "manual":
            if not v or len(v) == 0:
                raise ValueError("manual_urls must contain at least one URL when setup_type is 'manual'")
        return v


class EngineSetupRunRead(BaseModel):
    """Schema for reading engine setup run data."""
    id: uuid.UUID
    client_id: uuid.UUID
    setup_type: str
    total_pages: int
    successful_pages: int
    failed_pages: int
    skipped_pages: int
    status: str
    current_url: Optional[str] = None
    progress_percentage: int
    error_message: Optional[str] = None
    started_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class EngineSetupProgressResponse(BaseModel):
    """Schema for progress tracking response."""
    run_id: uuid.UUID
    status: str
    progress_percentage: int
    current_url: Optional[str] = None
    total_pages: int
    successful_pages: int
    failed_pages: int
    skipped_pages: int
    error_message: Optional[str] = None
    started_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None


class EngineSetupStartResponse(BaseModel):
    """Schema for response when starting an engine setup."""
    run_id: uuid.UUID
    message: str
    status: str


class EngineSetupListResponse(BaseModel):
    """Schema for listing engine setup runs."""
    runs: list[EngineSetupRunRead]
    total: int


class EngineSetupStatsResponse(BaseModel):
    """Schema for engine setup statistics for a client."""
    client_id: uuid.UUID
    total_runs: int
    total_pages_discovered: int
    last_run_at: Optional[datetime.datetime] = None
    engine_setup_completed: bool


class SitemapValidationRequest(BaseModel):
    """Schema for validating a sitemap URL."""
    sitemap_url: str = Field(..., description="Sitemap URL to validate")


class SitemapValidationResponse(BaseModel):
    """Schema for sitemap validation response."""
    valid: bool = Field(..., description="Whether sitemap is valid and accessible")
    status_code: Optional[int] = Field(None, description="HTTP status code if fetched")
    url_count: int = Field(0, description="Number of URLs found in sitemap")
    sitemap_type: Optional[str] = Field(None, description="Type of sitemap (urlset, sitemap_index, rss)")
    error_type: Optional[str] = Field(None, description="Error category if validation failed")
    error_message: Optional[str] = Field(None, description="Detailed error message if validation failed")
    suggestion: Optional[str] = Field(None, description="User-friendly suggestion for resolution")
    parse_time: float = Field(0.0, description="Time taken to parse in seconds")
