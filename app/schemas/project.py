from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# Schema for creating a new project
class ProjectCreate(BaseModel):
    client_id: UUID
    name: str
    url: str
    description: Optional[str] = None
    sitemap_url: Optional[str] = None


# Schema for updating a project (all fields optional)
class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    sitemap_url: Optional[str] = None


# Schema for reading a project (includes all fields)
class ProjectRead(BaseModel):
    id: UUID
    client_id: UUID
    name: str
    url: str
    description: Optional[str] = None
    sitemap_url: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Schema for deleting a project (requires password confirmation)
class ProjectDelete(BaseModel):
    password: str
