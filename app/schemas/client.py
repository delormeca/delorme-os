from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# Schema for creating a new client
class ClientCreate(BaseModel):
    name: str
    industry: Optional[str] = None


# Schema for updating a client (all fields optional)
class ClientUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None


# Schema for reading a client (includes all fields)
class ClientRead(BaseModel):
    id: UUID
    name: str
    industry: Optional[str] = None
    created_by: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Schema for deleting a client (requires password confirmation)
class ClientDelete(BaseModel):
    password: str
