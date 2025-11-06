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
    """Schema for reading client page data."""
    id: uuid.UUID
    client_id: uuid.UUID
    status_code: Optional[int] = None
    is_failed: bool
    failure_reason: Optional[str] = None
    retry_count: int
    last_checked_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


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
