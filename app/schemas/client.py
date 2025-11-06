from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.schemas.project_lead import ProjectLeadBasic


# Schema for creating a new client
class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    website_url: Optional[str] = None
    sitemap_url: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    crawl_frequency: str = Field(default="Manual Only")
    status: str = Field(default="Active")
    project_lead_id: Optional[UUID] = None


# Schema for updating a client (all fields optional)
class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    website_url: Optional[str] = None
    sitemap_url: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    crawl_frequency: Optional[str] = None
    status: Optional[str] = None
    project_lead_id: Optional[UUID] = None


# Schema for reading a client (includes all fields)
class ClientRead(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    website_url: Optional[str] = None
    sitemap_url: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    crawl_frequency: str
    status: str
    page_count: int
    engine_setup_completed: bool = False
    last_setup_run_id: Optional[UUID] = None
    project_lead_id: Optional[UUID] = None
    project_lead: Optional[ProjectLeadBasic] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Schema for deleting a client (requires password confirmation)
class ClientDelete(BaseModel):
    password: str


# Schema for bulk delete request
class ClientBulkDelete(BaseModel):
    client_ids: list[UUID] = Field(..., min_length=1)
    create_backup: bool = Field(default=True)


# Schema for sitemap test request
class ClientSitemapTest(BaseModel):
    sitemap_url: str = Field(..., min_length=1)


# Schema for sitemap test response
class ClientSitemapTestResult(BaseModel):
    is_valid: bool
    url_count: int
    error: Optional[str] = None
    sample_urls: list[str] = Field(default_factory=list)
