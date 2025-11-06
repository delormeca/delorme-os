from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Schema for creating a new project lead
class ProjectLeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr


# Schema for updating a project lead
class ProjectLeadUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None


# Schema for reading a project lead
class ProjectLeadRead(BaseModel):
    id: UUID
    name: str
    email: str
    created_at: datetime
    updated_at: datetime
    client_count: int = 0  # Computed field for number of clients
    model_config = ConfigDict(from_attributes=True)


# Schema for basic project lead info (for inclusion in other schemas)
class ProjectLeadBasic(BaseModel):
    id: UUID
    name: str
    email: str
    model_config = ConfigDict(from_attributes=True)
