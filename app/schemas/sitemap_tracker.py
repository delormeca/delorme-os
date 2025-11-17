"""
Pydantic schemas for Sitemap Tracker feature.

Defines request and response schemas for sitemap tracking operations including:
- Tracker configuration updates
- Run creation and retrieval
- Change tracking and comparison
- Dashboard data
"""

from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class SitemapTrackerConfigUpdate(BaseModel):
    """Request schema for updating sitemap tracker configuration."""

    sitemap_url: Optional[str] = Field(None, description="URL of the sitemap to track")
    tracking_frequency: Optional[str] = Field(None, description="Frequency of automatic tracking (e.g., 'daily', 'weekly', 'bi_monthly', 'monthly', 'manual_only')")
    enabled: Optional[bool] = Field(None, description="Whether tracking is enabled for this client")


class SitemapTrackerRunCreate(BaseModel):
    """Request schema for creating a new sitemap tracker run."""

    run_type: str = Field(..., description="Type of run: 'manual' or 'scheduled'")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "run_type": "manual"
        }
    })


class SitemapChangeRead(BaseModel):
    """Response schema for individual sitemap change records."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    sitemap_tracker_run_id: UUID
    url: str
    change_type: str
    old_status_code: Optional[int] = None
    new_status_code: Optional[int] = None
    detected_at: datetime
    last_seen_at: Optional[datetime] = None
    pushed_to_crawler: bool
    pushed_at: Optional[datetime] = None
    importance: Optional[str] = None
    notes: Optional[str] = None


class SitemapTrackerRunRead(BaseModel):
    """Response schema for individual sitemap tracker run records."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    schedule_frequency: str
    sitemap_url: str
    status: str
    progress_percentage: int
    current_url_being_checked: Optional[str] = None
    current_status_message: Optional[str] = None
    total_urls_in_sitemap: int
    total_urls_checked: int
    new_urls_count: int
    removed_urls_count: int
    status_code_changes_count: int
    unchanged_urls_count: int
    status_code_summary: Optional[Dict[str, int]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    error_message: Optional[str] = None
    error_log: Optional[Dict[str, Any]] = None
    previous_run_id: Optional[UUID] = None
    comparison_baseline_snapshot: Optional[Dict[str, Any]] = None
    execution_time_seconds: Optional[float] = None
    average_response_time_ms: Optional[float] = None
    # Note: Changes are fetched separately via /runs/{run_id}/changes endpoint


class SitemapTrackerRunList(BaseModel):
    """Response schema for paginated list of tracker runs."""

    items: List[SitemapTrackerRunRead] = Field(..., description="List of tracker runs")
    total: int = Field(..., description="Total number of runs")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")


class SitemapChangeList(BaseModel):
    """Response schema for paginated list of sitemap changes."""

    items: List[SitemapChangeRead] = Field(..., description="List of sitemap changes")
    total: int = Field(..., description="Total number of changes")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")


class SitemapTrackerDashboard(BaseModel):
    """Response schema for sitemap tracker dashboard overview."""

    latest_run: Optional[SitemapTrackerRunRead] = Field(None, description="Most recent tracker run")
    total_runs: int = Field(..., description="Total number of runs executed")
    total_urls_tracked: int = Field(..., description="Total number of unique URLs being tracked")
    recent_changes: List[SitemapChangeRead] = Field(default_factory=list, description="Recent sitemap changes")
    status_code_breakdown: Dict[str, int] = Field(default_factory=dict, description="Breakdown of HTTP status codes")


class RunComparisonRequest(BaseModel):
    """Request schema for comparing two tracker runs."""

    run_id_1: UUID = Field(..., description="ID of the first run to compare")
    run_id_2: UUID = Field(..., description="ID of the second run to compare")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "run_id_1": "550e8400-e29b-41d4-a716-446655440000",
            "run_id_2": "660e8400-e29b-41d4-a716-446655440001"
        }
    })


class RunComparisonResponse(BaseModel):
    """Response schema for comparing two tracker runs."""

    run_1: SitemapTrackerRunRead = Field(..., description="First run details")
    run_2: SitemapTrackerRunRead = Field(..., description="Second run details")
    added_urls: List[str] = Field(default_factory=list, description="URLs added between runs")
    removed_urls: List[str] = Field(default_factory=list, description="URLs removed between runs")
    status_code_changes: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="URLs with status code changes"
    )
    summary: Dict[str, Any] = Field(
        default_factory=dict,
        description="Summary statistics of the comparison"
    )
