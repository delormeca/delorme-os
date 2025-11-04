from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# Schema for creating a new page
class PageCreate(BaseModel):
    project_id: UUID
    url: str
    slug: str
    status: str = "active"
    update_frequency: Optional[str] = None


# Schema for updating a page (all fields optional)
class PageUpdate(BaseModel):
    slug: Optional[str] = None
    status: Optional[str] = None
    update_frequency: Optional[str] = None


# Schema for reading a page (includes all fields)
class PageRead(BaseModel):
    id: UUID
    project_id: UUID
    url: str
    slug: str
    status: str
    update_frequency: Optional[str] = None
    last_crawled_at: Optional[datetime] = None
    next_crawl_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Schema for reading page data
class PageDataRead(BaseModel):
    id: UUID
    page_id: UUID
    data_type: str
    content: dict
    extracted_at: datetime
    model_config = ConfigDict(from_attributes=True)
