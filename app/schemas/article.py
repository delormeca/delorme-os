from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# Schema for creating a new article
class ArticleCreate(BaseModel):
    title: str
    content: str
    is_published: bool = False


# Schema for updating an article (all fields optional)
class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = None


# Schema for reading an article (includes all fields)
class ArticleRead(BaseModel):
    id: int
    title: str
    content: str
    author: str
    published_at: Optional[datetime] = None
    is_published: bool
    model_config = ConfigDict(from_attributes=True)
