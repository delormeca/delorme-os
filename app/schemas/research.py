"""
Pydantic schemas for Deep Researcher feature.
"""

import datetime
import uuid
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ==================== Research Request Schemas ====================


class ResearchRequestCreate(BaseModel):
    """Schema for creating a new research request."""

    query: str = Field(..., min_length=3, max_length=500, description="Research question")
    report_type: str = Field(default="research_report", description="Type of report")
    tone: str = Field(default="objective", description="Tone of the report")
    max_iterations: int = Field(default=5, ge=1, le=10, description="Max iterations")
    search_depth: int = Field(default=5, ge=1, le=10, description="Search depth")
    retrievers: List[str] = Field(default=["tavily"], description="List of retrievers to use")
    auto_start: bool = Field(default=True, description="Start research immediately")


class ResearchRequestRead(BaseModel):
    """Schema for reading research request (list view)."""

    id: uuid.UUID
    user_id: uuid.UUID
    query: str
    report_type: str
    tone: str
    status: str
    progress: float
    total_sources: int
    cost_usd: float
    duration_seconds: Optional[float]
    created_at: datetime.datetime
    started_at: Optional[datetime.datetime]
    completed_at: Optional[datetime.datetime]

    model_config = ConfigDict(from_attributes=True)


class ResearchSourceRead(BaseModel):
    """Schema for reading a research source."""

    id: uuid.UUID
    url: str
    title: Optional[str]
    summary: Optional[str]
    retriever: str
    relevance_score: Optional[float]
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class ResearchRequestDetail(ResearchRequestRead):
    """Schema for detailed research request view (includes sources and report)."""

    report_content: Optional[str]
    report_markdown: Optional[str]
    sources: List[ResearchSourceRead] = []
    error_message: Optional[str]


class ResearchRequestUpdate(BaseModel):
    """Schema for updating research request."""

    status: Optional[str] = None
    progress: Optional[float] = None
    report_content: Optional[str] = None


# ==================== Chat Schemas ====================


class ChatMessageCreate(BaseModel):
    """Schema for creating a chat message."""

    content: str = Field(..., min_length=1, max_length=2000, description="Chat message content")


class ChatMessageRead(BaseModel):
    """Schema for reading a chat message."""

    id: uuid.UUID
    role: str
    content: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class ChatMessageResponse(BaseModel):
    """Schema for chat response (includes both user message and AI response)."""

    message: ChatMessageRead
    response: ChatMessageRead


# ==================== Retriever Schemas ====================


class RetrieverInfo(BaseModel):
    """Schema for retriever information."""

    name: str
    display_name: str
    description: str
    requires_api_key: bool
    is_configured: bool
    category: str  # "web", "academic", "local"


class RetrieverListResponse(BaseModel):
    """Schema for list of available retrievers."""

    retrievers: List[RetrieverInfo]


# ==================== WebSocket Schemas ====================


class ProgressMessage(BaseModel):
    """Schema for WebSocket progress messages."""

    type: str  # "progress", "log", "error", "complete"
    content: Optional[str] = None
    progress: Optional[float] = None
    step: Optional[str] = None
    cost: Optional[float] = None
