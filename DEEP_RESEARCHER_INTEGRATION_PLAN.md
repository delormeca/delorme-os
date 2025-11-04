# Deep Researcher Integration Plan for Velocity v2.0.1

## Executive Summary

This document outlines the complete integration plan for adding GPT Researcher as a standalone utility app within the Velocity boilerplate application. The integration will provide users with AI-powered deep research capabilities, multiple search retrievers, and comprehensive report generation.

---

## 1. Integration Architecture Overview

### Approach: Hybrid Integration

We will use a **hybrid integration approach** that combines:

1. **Backend Service Layer**: Python service that interfaces with GPT Researcher library
2. **API Endpoints**: FastAPI controllers for research operations
3. **Database Persistence**: Store research requests, results, and history
4. **WebSocket Streaming**: Real-time research progress updates
5. **Frontend Interface**: React components for user interaction

### Why Hybrid vs. Standalone Server?

**Hybrid Advantages**:
- ✅ Unified authentication (uses Velocity's JWT system)
- ✅ Permission-based access control (can gate by plan)
- ✅ Database persistence (research history)
- ✅ Consistent UI/UX with Velocity theme
- ✅ Single deployment (no separate server management)
- ✅ Shared environment configuration

**Trade-offs**:
- GPT Researcher's frontend won't be used (we'll build custom React components)
- Multi-agent system will be integrated as a separate feature option

---

## 2. Technical Architecture

### Component Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│                     Velocity Frontend                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React Components                                    │   │
│  │  - DeepResearchList.tsx                             │   │
│  │  - CreateResearch.tsx                               │   │
│  │  - ResearchDetail.tsx                               │   │
│  │  - ResearchProgress.tsx (WebSocket)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API Hooks (React Query)                            │   │
│  │  - useResearchList()                                │   │
│  │  - useCreateResearch()                              │   │
│  │  - useResearchDetail()                              │   │
│  │  - useResearchWebSocket()                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                     Velocity Backend                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FastAPI Controllers                                 │   │
│  │  - /api/research (CRUD operations)                  │   │
│  │  - /api/research/{id}/execute                       │   │
│  │  - /api/research/{id}/chat                          │   │
│  │  - /ws/research/{id} (WebSocket)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Service Layer                                       │   │
│  │  - ResearchService                                   │   │
│  │  - GPTResearcherWrapper                             │   │
│  │  - RetrieverFactory                                  │   │
│  │  - WebSocketManager                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  GPT Researcher Library                              │   │
│  │  - GPTResearcher agent                              │   │
│  │  - Retrievers (Tavily, Google, etc.)                │   │
│  │  - Multi-agent system                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Database (PostgreSQL)                               │   │
│  │  - research_requests table                           │   │
│  │  - research_results table                            │   │
│  │  - research_sources table                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  - OpenAI API (GPT-4o, GPT-4o-mini)                         │
│  - Tavily Search API                                         │
│  - Other retrievers (Google, Bing, DuckDuckGo, etc.)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Design

### Models to Create

#### 3.1 ResearchRequest Model

```python
class ResearchRequest(UUIDModelBase, table=True):
    """Main research request model"""
    __tablename__ = "research_requests"

    # Relationships
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, index=True)

    # Research Parameters
    query: str = Field(nullable=False, description="Research query/question")
    report_type: str = Field(default="research_report", nullable=False)
    # Options: research_report, detailed_report, deep_research, resource_report, etc.

    tone: str = Field(default="objective", nullable=False)
    # Options: objective, formal, analytical, persuasive, informative, etc.

    max_iterations: int = Field(default=5, nullable=False)
    search_depth: int = Field(default=5, nullable=False)

    # Retriever Configuration
    retrievers: List[str] = Field(sa_column=Column(JSON), default=["tavily"])
    # Options: ["tavily", "google", "duckduckgo", "arxiv", "semantic_scholar", etc.]

    # Status Tracking
    status: str = Field(default="pending", nullable=False, index=True)
    # Options: pending, processing, completed, failed, cancelled

    progress: float = Field(default=0.0, nullable=False)
    # 0.0 to 100.0

    # Results
    report_content: Optional[str] = Field(default=None, sa_column=Column(Text))
    report_markdown: Optional[str] = Field(default=None, sa_column=Column(Text))
    report_html: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Metadata
    total_sources: int = Field(default=0, nullable=False)
    cost_usd: float = Field(default=0.0, nullable=False)
    duration_seconds: Optional[float] = Field(default=None)

    error_message: Optional[str] = Field(default=None)

    # Timestamps
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)
    started_at: Optional[datetime.datetime] = Field(default=None)
    completed_at: Optional[datetime.datetime] = Field(default=None)

    # Relationships
    user: "User" = Relationship(back_populates="research_requests")
    sources: List["ResearchSource"] = Relationship(back_populates="research_request",
                                                     cascade_delete=True)
    chat_messages: List["ResearchChatMessage"] = Relationship(
        back_populates="research_request",
        cascade_delete=True
    )
```

#### 3.2 ResearchSource Model

```python
class ResearchSource(UUIDModelBase, table=True):
    """Individual sources used in research"""
    __tablename__ = "research_sources"

    # Relationships
    research_request_id: uuid.UUID = Field(
        foreign_key="research_requests.id",
        nullable=False,
        index=True
    )

    # Source Information
    url: str = Field(nullable=False)
    title: Optional[str] = Field(default=None)
    summary: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Retriever that found this source
    retriever: str = Field(nullable=False)

    # Relevance score
    relevance_score: Optional[float] = Field(default=None)

    # Timestamps
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    # Relationships
    research_request: "ResearchRequest" = Relationship(back_populates="sources")
```

#### 3.3 ResearchChatMessage Model

```python
class ResearchChatMessage(UUIDModelBase, table=True):
    """Chat messages about research results"""
    __tablename__ = "research_chat_messages"

    # Relationships
    research_request_id: uuid.UUID = Field(
        foreign_key="research_requests.id",
        nullable=False,
        index=True
    )

    # Message Content
    role: str = Field(nullable=False)  # "user" or "assistant"
    content: str = Field(nullable=False, sa_column=Column(Text))

    # Timestamps
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    # Relationships
    research_request: "ResearchRequest" = Relationship(back_populates="chat_messages")
```

### Migration Script

```bash
# Create migration
task db:migrate-create -- "add deep researcher models"

# Review and apply
task db:migrate-up
```

---

## 4. Backend Implementation Plan

### 4.1 Service Layer Architecture

#### File: `app/services/research_service.py`

**Responsibilities**:
- CRUD operations for research requests
- Orchestrate GPT Researcher execution
- WebSocket progress streaming
- Cost tracking
- Error handling

**Key Methods**:
```python
class ResearchService:
    async def create_research_request(
        db: AsyncSession,
        user_id: UUID,
        research_data: ResearchRequestCreate
    ) -> ResearchRequestRead

    async def get_user_research_requests(
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[ResearchRequestRead]

    async def get_research_request_detail(
        db: AsyncSession,
        research_id: UUID,
        user_id: UUID
    ) -> ResearchRequestDetail

    async def execute_research(
        db: AsyncSession,
        research_id: UUID,
        websocket: Optional[WebSocket] = None
    ) -> ResearchRequestRead

    async def cancel_research(
        db: AsyncSession,
        research_id: UUID,
        user_id: UUID
    ) -> ResearchRequestRead

    async def delete_research(
        db: AsyncSession,
        research_id: UUID,
        user_id: UUID
    ) -> bool

    async def chat_with_research(
        db: AsyncSession,
        research_id: UUID,
        user_id: UUID,
        message: str
    ) -> ChatMessageResponse
```

#### File: `app/services/gpt_researcher_wrapper.py`

**Responsibilities**:
- Wrap GPT Researcher library
- Handle configuration
- Stream progress updates
- Extract results and metadata

**Key Methods**:
```python
class GPTResearcherWrapper:
    def __init__(
        self,
        query: str,
        report_type: str,
        tone: str,
        retrievers: List[str],
        websocket_manager: Optional[WebSocketManager] = None
    ):
        pass

    async def conduct_research(self) -> ResearchResult:
        """Execute research and return structured results"""
        pass

    async def stream_progress(self, message: str, progress: float):
        """Stream progress to WebSocket"""
        pass

    def get_cost_breakdown(self) -> CostBreakdown:
        """Get detailed cost information"""
        pass
```

#### File: `app/services/retriever_factory.py`

**Responsibilities**:
- Configure available retrievers
- Validate API keys
- Return retriever instances

**Key Methods**:
```python
class RetrieverFactory:
    @staticmethod
    def get_available_retrievers() -> List[RetrieverInfo]:
        """Return list of available retrievers with requirements"""
        pass

    @staticmethod
    def validate_retriever_config(retriever_name: str) -> bool:
        """Check if retriever is properly configured"""
        pass

    @staticmethod
    def get_retriever_instance(retriever_name: str):
        """Get configured retriever instance"""
        pass
```

### 4.2 Controller Layer

#### File: `app/controllers/research.py`

```python
from fastapi import APIRouter, Depends, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List
from uuid import UUID

from app.db import get_async_db_session
from app.schemas.auth import CurrentUserResponse
from app.schemas.research import (
    ResearchRequestCreate,
    ResearchRequestRead,
    ResearchRequestDetail,
    ResearchRequestUpdate,
    ChatMessageCreate,
    ChatMessageResponse,
    RetrieverListResponse
)
from app.services import research_service
from app.services.users_service import get_current_user
from app.core.access_control import require_permission, FeaturePermission

router = APIRouter()

# Create research request
@router.post("/research", response_model=ResearchRequestRead)
@require_permission(FeaturePermission.DEEP_RESEARCH)
async def create_research(
    research_data: ResearchRequestCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Create a new research request and optionally start execution"""
    research = await research_service.create_research_request(
        db, current_user.user_id, research_data
    )

    # Execute in background if requested
    if research_data.auto_start:
        background_tasks.add_task(
            research_service.execute_research,
            db,
            research.id
        )

    return research

# List user's research requests
@router.get("/research", response_model=List[ResearchRequestRead])
async def list_research(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get all research requests for the current user"""
    return await research_service.get_user_research_requests(
        db, current_user.user_id, skip, limit
    )

# Get research detail
@router.get("/research/{research_id}", response_model=ResearchRequestDetail)
async def get_research_detail(
    research_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get detailed information about a research request"""
    return await research_service.get_research_request_detail(
        db, research_id, current_user.user_id
    )

# Execute research (with WebSocket)
@router.websocket("/ws/research/{research_id}")
async def research_websocket(
    websocket: WebSocket,
    research_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
):
    """WebSocket endpoint for real-time research progress"""
    await websocket.accept()

    try:
        # TODO: Validate user has access to this research
        await research_service.execute_research(
            db, research_id, websocket=websocket
        )
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
    finally:
        await websocket.close()

# Cancel research
@router.post("/research/{research_id}/cancel", response_model=ResearchRequestRead)
async def cancel_research(
    research_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Cancel a running research request"""
    return await research_service.cancel_research(
        db, research_id, current_user.user_id
    )

# Delete research
@router.delete("/research/{research_id}")
async def delete_research(
    research_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Delete a research request and all associated data"""
    await research_service.delete_research(
        db, research_id, current_user.user_id
    )
    return {"message": "Research deleted successfully"}

# Chat with research
@router.post("/research/{research_id}/chat", response_model=ChatMessageResponse)
async def chat_with_research(
    research_id: UUID,
    message: ChatMessageCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Chat with AI about the research results"""
    return await research_service.chat_with_research(
        db, research_id, current_user.user_id, message.content
    )

# Get available retrievers
@router.get("/research/retrievers", response_model=RetrieverListResponse)
async def get_available_retrievers():
    """Get list of available search retrievers"""
    from app.services.retriever_factory import RetrieverFactory
    return RetrieverFactory.get_available_retrievers()
```

### 4.3 Pydantic Schemas

#### File: `app/schemas/research.py`

```python
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

# Create
class ResearchRequestCreate(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    report_type: str = Field(default="research_report")
    tone: str = Field(default="objective")
    max_iterations: int = Field(default=5, ge=1, le=10)
    search_depth: int = Field(default=5, ge=1, le=10)
    retrievers: List[str] = Field(default=["tavily"])
    auto_start: bool = Field(default=True)

# Read
class ResearchRequestRead(BaseModel):
    id: UUID
    user_id: UUID
    query: str
    report_type: str
    tone: str
    status: str
    progress: float
    total_sources: int
    cost_usd: float
    duration_seconds: Optional[float]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

# Detail (includes sources and report)
class ResearchSourceRead(BaseModel):
    id: UUID
    url: str
    title: Optional[str]
    summary: Optional[str]
    retriever: str
    relevance_score: Optional[float]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ResearchRequestDetail(ResearchRequestRead):
    report_content: Optional[str]
    report_markdown: Optional[str]
    sources: List[ResearchSourceRead]
    error_message: Optional[str]

# Update
class ResearchRequestUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[float] = None
    report_content: Optional[str] = None

# Chat
class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class ChatMessageRead(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatMessageResponse(BaseModel):
    message: ChatMessageRead
    response: ChatMessageRead

# Retrievers
class RetrieverInfo(BaseModel):
    name: str
    display_name: str
    description: str
    requires_api_key: bool
    is_configured: bool
    category: str  # "web", "academic", "local"

class RetrieverListResponse(BaseModel):
    retrievers: List[RetrieverInfo]
```

### 4.4 Configuration Updates

#### File: `app/config/base.py`

Add configuration for GPT Researcher:

```python
class Config(BaseSettings):
    # ... existing config ...

    # Deep Researcher Configuration
    OPENAI_API_KEY: str = Field(..., description="OpenAI API key")
    TAVILY_API_KEY: str = Field(..., description="Tavily API key")

    # Optional retriever API keys
    GOOGLE_API_KEY: Optional[str] = Field(None, description="Google Custom Search API key")
    GOOGLE_CX: Optional[str] = Field(None, description="Google Custom Search Engine ID")
    BING_API_KEY: Optional[str] = Field(None, description="Bing Search API key")
    SERPER_API_KEY: Optional[str] = Field(None, description="Serper API key")
    SERPAPI_API_KEY: Optional[str] = Field(None, description="SerpAPI key")

    # Research defaults
    RESEARCH_MAX_ITERATIONS: int = Field(5, description="Default max research iterations")
    RESEARCH_DEFAULT_RETRIEVER: str = Field("tavily", description="Default retriever")
    RESEARCH_OUTPUT_DIR: str = Field("./outputs/research", description="Research output directory")
```

#### File: `local.env`

Add credentials:

```bash
# Deep Researcher Configuration
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# Optional retrievers (add as needed)
# GOOGLE_API_KEY=
# GOOGLE_CX=
# BING_API_KEY=
```

### 4.5 Dependencies Installation

#### Update `pyproject.toml`:

```toml
[tool.poetry.dependencies]
# ... existing dependencies ...

# Deep Researcher
gpt-researcher = "^0.14.4"
tavily-python = "^0.7.12"
duckduckgo-search = "^4.1.1"
beautifulsoup4 = "^4.12.2"
lxml = "^4.9.2"
aiohttp = "^3.12.0"
unstructured = "^0.13"
python-docx = "^1.1.0"
PyMuPDF = "^1.23.6"
md2pdf = "^1.0.1"
langchain-core = "^0.3.61"
langchain-community = "^0.3.17"
langchain-openai = "^0.3.6"
tiktoken = "^0.7.0"
```

Install:
```bash
poetry install
```

---

## 5. Frontend Implementation Plan

### 5.1 File Structure

```
frontend/src/
├── pages/
│   └── DeepResearch/
│       ├── DeepResearchList.tsx         # Main list view
│       ├── CreateResearch.tsx            # Create new research form
│       ├── ResearchDetail.tsx            # View research results
│       ├── ResearchProgress.tsx          # Real-time progress tracker
│       └── ResearchChat.tsx              # Chat with research results
├── components/
│   └── research/
│       ├── ResearchCard.tsx              # Card for research item
│       ├── RetrieverSelector.tsx         # Multi-select for retrievers
│       ├── ReportTypeSelector.tsx        # Select report type
│       ├── ToneSelector.tsx              # Select report tone
│       ├── SourcesList.tsx               # Display sources
│       ├── ProgressStream.tsx            # WebSocket progress display
│       └── MarkdownRenderer.tsx          # Render markdown reports
├── hooks/
│   └── api/
│       └── useDeepResearch.ts            # API hooks
└── utils/
    └── websocket.ts                       # WebSocket utilities
```

### 5.2 API Hooks Implementation

#### File: `frontend/src/hooks/api/useDeepResearch.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResearchService } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import type {
  ResearchRequestCreate,
  ResearchRequestRead,
  ResearchRequestDetail,
  ChatMessageCreate,
} from "@/client/types.gen";

// List research requests
export const useResearchList = () => {
  return useQuery({
    queryKey: ["research"],
    queryFn: () => ResearchService.listResearchApiResearchGet(),
  });
};

// Get research detail
export const useResearchDetail = (researchId: string) => {
  return useQuery({
    queryKey: ["research", researchId],
    queryFn: () =>
      ResearchService.getResearchDetailApiResearchResearchIdGet({
        researchId
      }),
    enabled: !!researchId,
  });
};

// Create research
export const useCreateResearch = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: (data: ResearchRequestCreate) =>
      ResearchService.createResearchApiResearchPost({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research"] });
      createSnackBar({
        content: "Research request created successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.message || "Failed to create research",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

// Cancel research
export const useCancelResearch = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: (researchId: string) =>
      ResearchService.cancelResearchApiResearchResearchIdCancelPost({
        researchId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research"] });
      createSnackBar({
        content: "Research cancelled",
        severity: "info",
        autoHide: true,
      });
    },
  });
};

// Delete research
export const useDeleteResearch = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: (researchId: string) =>
      ResearchService.deleteResearchApiResearchResearchIdDelete({
        researchId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research"] });
      createSnackBar({
        content: "Research deleted",
        severity: "success",
        autoHide: true,
      });
    },
  });
};

// Chat with research
export const useChatWithResearch = (researchId: string) => {
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: (message: ChatMessageCreate) =>
      ResearchService.chatWithResearchApiResearchResearchIdChatPost({
        researchId,
        requestBody: message,
      }),
    onError: (error: any) => {
      createSnackBar({
        content: error.message || "Failed to send message",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

// Get available retrievers
export const useAvailableRetrievers = () => {
  return useQuery({
    queryKey: ["retrievers"],
    queryFn: () =>
      ResearchService.getAvailableRetrieversApiResearchRetrieversGet(),
  });
};
```

### 5.3 WebSocket Hook

#### File: `frontend/src/hooks/useResearchWebSocket.ts`

```typescript
import { useEffect, useRef, useState } from 'react';

interface ProgressMessage {
  type: string;
  content?: string;
  progress?: number;
  step?: string;
  cost?: number;
}

export const useResearchWebSocket = (researchId: string | null) => {
  const [messages, setMessages] = useState<ProgressMessage[]>([]);
  const [progress, setProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!researchId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/research/${researchId}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data: ProgressMessage = JSON.parse(event.data);

      setMessages((prev) => [...prev, data]);

      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    // Cleanup
    return () => {
      ws.current?.close();
    };
  }, [researchId]);

  return { messages, progress, isConnected };
};
```

### 5.4 Main Page Components

#### File: `frontend/src/pages/DeepResearch/DeepResearchList.tsx`

```typescript
import React from 'react';
import {
  Box,
  Grid2 as Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Visibility,
  Cancel,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  DashboardLayout,
  PageLayout,
  PageHeader,
  LoadingState,
  EmptyState,
  StandardButton,
} from '@/components/ui';
import {
  useResearchList,
  useDeleteResearch,
  useCancelResearch,
} from '@/hooks/api/useDeepResearch';

const DeepResearchList: React.FC = () => {
  const navigate = useNavigate();
  const { data: research, isLoading } = useResearchList();
  const deleteResearch = useDeleteResearch();
  const cancelResearch = useCancelResearch();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLayout maxWidth="lg">
          <LoadingState message="Loading research..." />
        </PageLayout>
      </DashboardLayout>
    );
  }

  if (!research || research.length === 0) {
    return (
      <DashboardLayout>
        <PageLayout maxWidth="lg">
          <EmptyState
            icon={<Search sx={{ fontSize: 80 }} />}
            title="No research yet"
            description="Start your first deep research query to generate comprehensive AI-powered reports"
            action={{
              label: "Start Research",
              onClick: () => navigate("/dashboard/deep-researcher/new"),
              variant: "contained",
            }}
          />
        </PageLayout>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageLayout maxWidth="lg">
        <PageHeader
          title="Deep Research"
          subtitle="AI-powered research with comprehensive reports and citations"
          action={
            <StandardButton
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/dashboard/deep-researcher/new")}
            >
              New Research
            </StandardButton>
          }
        />

        <Grid container spacing={3}>
          {research.map((item) => (
            <Grid size={{ xs: 12, md: 6 }} key={item.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" noWrap sx={{ flex: 1, mr: 2 }}>
                      {item.query}
                    </Typography>
                    <Chip
                      label={item.status}
                      color={getStatusColor(item.status)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {item.report_type} • {item.tone} tone
                  </Typography>

                  {item.status === 'processing' && (
                    <Box mb={2}>
                      <LinearProgress
                        variant="determinate"
                        value={item.progress}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {item.progress.toFixed(0)}% complete
                      </Typography>
                    </Box>
                  )}

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {item.total_sources} sources • ${item.cost_usd.toFixed(4)}
                    </Typography>

                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/dashboard/deep-researcher/${item.id}`)}
                      >
                        <Visibility />
                      </IconButton>

                      {item.status === 'processing' && (
                        <IconButton
                          size="small"
                          onClick={() => cancelResearch.mutate(item.id)}
                        >
                          <Cancel />
                        </IconButton>
                      )}

                      <IconButton
                        size="small"
                        onClick={() => deleteResearch.mutate(item.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </PageLayout>
    </DashboardLayout>
  );
};

export default DeepResearchList;
```

#### File: `frontend/src/pages/DeepResearch/CreateResearch.tsx`

```typescript
import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Slider,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  DashboardLayout,
  PageLayout,
  PageHeader,
  StandardButton,
  ModernCard,
} from '@/components/ui';
import {
  useCreateResearch,
  useAvailableRetrievers,
} from '@/hooks/api/useDeepResearch';

const REPORT_TYPES = [
  { value: 'research_report', label: 'Research Report (~2 min)' },
  { value: 'detailed_report', label: 'Detailed Report (~5 min)' },
  { value: 'deep_research', label: 'Deep Research (~5 min, most thorough)' },
  { value: 'resource_report', label: 'Resource Report' },
  { value: 'outline_report', label: 'Outline Report' },
];

const TONES = [
  'objective',
  'formal',
  'analytical',
  'persuasive',
  'informative',
  'explanatory',
  'descriptive',
  'critical',
  'comparative',
  'speculative',
  'reflective',
  'narrative',
  'humorous',
  'optimistic',
  'pessimistic',
];

const CreateResearch: React.FC = () => {
  const navigate = useNavigate();
  const createResearch = useCreateResearch();
  const { data: retrieversData } = useAvailableRetrievers();

  const [query, setQuery] = useState('');
  const [reportType, setReportType] = useState('research_report');
  const [tone, setTone] = useState('objective');
  const [retrievers, setRetrievers] = useState<string[]>(['tavily']);
  const [maxIterations, setMaxIterations] = useState(5);
  const [searchDepth, setSearchDepth] = useState(5);

  const handleSubmit = async () => {
    await createResearch.mutateAsync({
      query,
      report_type: reportType,
      tone,
      retrievers,
      max_iterations: maxIterations,
      search_depth: searchDepth,
      auto_start: true,
    });

    navigate('/dashboard/deep-researcher');
  };

  return (
    <DashboardLayout>
      <PageLayout maxWidth="md">
        <PageHeader
          title="Create Research"
          subtitle="Start a new AI-powered research query"
        />

        <ModernCard>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Query Input */}
            <TextField
              label="Research Question"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
              helperText="Enter your research question or topic"
            />

            {/* Report Type */}
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
              >
                {REPORT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Tone */}
            <FormControl fullWidth>
              <InputLabel>Tone</InputLabel>
              <Select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                label="Tone"
              >
                {TONES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Retrievers */}
            <FormControl fullWidth>
              <InputLabel>Search Retrievers</InputLabel>
              <Select
                multiple
                value={retrievers}
                onChange={(e) => setRetrievers(e.target.value as string[])}
                input={<OutlinedInput label="Search Retrievers" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {retrieversData?.retrievers?.map((retriever) => (
                  <MenuItem
                    key={retriever.name}
                    value={retriever.name}
                    disabled={!retriever.is_configured}
                  >
                    {retriever.display_name}
                    {!retriever.is_configured && ' (not configured)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Max Iterations */}
            <Box>
              <Typography gutterBottom>
                Max Iterations: {maxIterations}
              </Typography>
              <Slider
                value={maxIterations}
                onChange={(_, value) => setMaxIterations(value as number)}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            {/* Search Depth */}
            <Box>
              <Typography gutterBottom>
                Search Depth: {searchDepth}
              </Typography>
              <Slider
                value={searchDepth}
                onChange={(_, value) => setSearchDepth(value as number)}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            {/* Submit Button */}
            <Box display="flex" gap={2}>
              <StandardButton
                variant="contained"
                onClick={handleSubmit}
                disabled={!query || createResearch.isPending}
                fullWidth
              >
                {createResearch.isPending ? 'Creating...' : 'Start Research'}
              </StandardButton>

              <StandardButton
                variant="outlined"
                onClick={() => navigate('/dashboard/deep-researcher')}
              >
                Cancel
              </StandardButton>
            </Box>
          </Box>
        </ModernCard>
      </PageLayout>
    </DashboardLayout>
  );
};

export default CreateResearch;
```

### 5.5 Add Routes

#### File: `frontend/src/App.tsx`

Add imports:
```typescript
import DeepResearchList from "./pages/DeepResearch/DeepResearchList";
import CreateResearch from "./pages/DeepResearch/CreateResearch";
import ResearchDetail from "./pages/DeepResearch/ResearchDetail";
```

Add routes inside `ProtectedRoute`:
```typescript
<Route path="dashboard/deep-researcher" element={<DeepResearchList />} />
<Route path="dashboard/deep-researcher/new" element={<CreateResearch />} />
<Route path="dashboard/deep-researcher/:researchId" element={<ResearchDetail />} />
```

### 5.6 Add to Sidebar

#### File: `frontend/src/components/ui/DashboardLayout.tsx`

Add import:
```typescript
import { Search } from '@mui/icons-material';
```

Add menu item in `getMenuItems` function:
```typescript
{
  label: 'Deep Researcher',
  icon: <Search />,
  path: '/dashboard/deep-researcher',
  description: 'AI-powered research tool',
  available: true,
},
```

---

## 6. Permission & Plan Gating (Optional)

### 6.1 Add Feature Permission

#### File: `app/permissions.py`

```python
class FeaturePermission(enum.Enum):
    # ... existing permissions ...
    DEEP_RESEARCH = "deep_research"
```

### 6.2 Update Plan Features

```python
PLAN_FEATURES: Dict[PlanType, List[FeaturePermission]] = {
    PlanType.FREE: [
        # ... existing permissions ...
        # No deep research for free tier
    ],
    PlanType.STARTER: [
        # ... existing permissions ...
        FeaturePermission.DEEP_RESEARCH,  # Limited
    ],
    PlanType.PRO: [
        # ... all permissions including deep research ...
    ],
}
```

### 6.3 Frontend Permission Guard

Wrap components that should be gated:

```typescript
import { PermissionGuard } from '@/components/PermissionGuard';

<PermissionGuard feature="deep_research">
  <DeepResearchList />
</PermissionGuard>
```

---

## 7. Implementation Steps & Timeline

### Phase 1: Backend Foundation (Day 1-2)
1. ✅ Install GPT Researcher dependencies
2. ✅ Create database models (ResearchRequest, ResearchSource, ResearchChatMessage)
3. ✅ Create and run migrations
4. ✅ Add configuration to `app/config/base.py` and `local.env`
5. ✅ Create basic service layer (`research_service.py`, `gpt_researcher_wrapper.py`)

### Phase 2: Core API (Day 2-3)
6. ✅ Implement CRUD operations in `research_service.py`
7. ✅ Implement research execution logic in `gpt_researcher_wrapper.py`
8. ✅ Create controller endpoints in `app/controllers/research.py`
9. ✅ Register router in `main.py`
10. ✅ Test API endpoints with Postman/curl

### Phase 3: WebSocket Streaming (Day 3-4)
11. ✅ Implement WebSocket manager
12. ✅ Add WebSocket endpoint for research progress
13. ✅ Test streaming with WebSocket client

### Phase 4: Frontend Foundation (Day 4-5)
14. ✅ Generate TypeScript API client
15. ✅ Create API hooks (`useDeepResearch.ts`)
16. ✅ Create WebSocket hook (`useResearchWebSocket.ts`)
17. ✅ Build main list page (`DeepResearchList.tsx`)
18. ✅ Build create research form (`CreateResearch.tsx`)

### Phase 5: Advanced Frontend (Day 5-6)
19. ✅ Build research detail page (`ResearchDetail.tsx`)
20. ✅ Implement real-time progress component
21. ✅ Add chat interface for research results
22. ✅ Build reusable components (cards, selectors, etc.)

### Phase 6: Polish & Testing (Day 6-7)
23. ✅ Add to sidebar navigation
24. ✅ Implement permission gating (if needed)
25. ✅ Test all features end-to-end
26. ✅ Test all retrievers
27. ✅ Error handling and edge cases
28. ✅ UI/UX polish and responsive design

### Phase 7: Advanced Features (Day 7+)
29. ✅ Implement multi-agent research option
30. ✅ Add export functionality (PDF, DOCX)
31. ✅ Implement research history/favorites
32. ✅ Add cost tracking dashboard
33. ✅ Optimize performance and caching

---

## 8. Testing Plan

### Backend Testing
- [ ] Unit tests for service layer
- [ ] Integration tests for API endpoints
- [ ] WebSocket connection tests
- [ ] Research execution tests with mock retrievers
- [ ] Database operations tests

### Frontend Testing
- [ ] Component rendering tests
- [ ] Form validation tests
- [ ] API hook tests with mock data
- [ ] WebSocket connection tests
- [ ] E2E tests for complete research flow

### Manual Testing Checklist
- [ ] Create research request
- [ ] Monitor real-time progress
- [ ] View completed research results
- [ ] Chat with research results
- [ ] Cancel in-progress research
- [ ] Delete research request
- [ ] Test with different retrievers
- [ ] Test with different report types
- [ ] Test permission gating
- [ ] Test error scenarios

---

## 9. Deployment Considerations

### Environment Variables
Ensure all API keys are set in production:
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- Optional: `GOOGLE_API_KEY`, `BING_API_KEY`, etc.

### Database Migration
```bash
# Production migration
ENV_FILE=prod.env task db:migrate-up
```

### Performance Optimization
- Implement background task queue for long-running research
- Add caching for retriever results
- Rate limiting for research requests
- Optimize database queries with indexes

### Monitoring
- Track research execution times
- Monitor API costs
- Log errors and failures
- WebSocket connection metrics

---

## 10. Future Enhancements

### Short-term
- Research templates for common queries
- Collaborative research (share with team)
- Scheduled/recurring research
- Email notifications on completion

### Medium-term
- Advanced multi-agent workflows
- Custom retriever integration
- Research comparison tool
- API access for programmatic research

### Long-term
- Research knowledge base/RAG
- Custom LLM fine-tuning
- Research marketplace/sharing
- Advanced analytics dashboard

---

## 11. Cost Estimation

### Per Research Request (Estimated)
- **Basic Report**: $0.05 - $0.15
- **Detailed Report**: $0.15 - $0.40
- **Deep Research**: $0.30 - $0.60

### Monthly Costs (Example)
- 100 basic reports: ~$10
- 50 detailed reports: ~$15
- 20 deep research: ~$10
- **Total**: ~$35/month

### Optimization Strategies
- Cache retriever results
- Reuse embeddings
- Use cheaper models for summarization
- Implement request limits per plan tier

---

## 12. Support & Documentation

### User Documentation Needed
- Getting started guide
- Report types explained
- Retriever comparison
- Best practices for queries
- Chat interface usage
- Export options guide

### Developer Documentation
- API endpoint reference
- WebSocket message format
- Adding custom retrievers
- Extending report types
- Testing guide

---

## Appendix A: API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/research` | Create research request |
| GET | `/api/research` | List user's research |
| GET | `/api/research/{id}` | Get research detail |
| POST | `/api/research/{id}/cancel` | Cancel research |
| DELETE | `/api/research/{id}` | Delete research |
| POST | `/api/research/{id}/chat` | Chat with results |
| GET | `/api/research/retrievers` | List retrievers |
| WS | `/ws/research/{id}` | Real-time progress |

---

## Appendix B: Retriever Comparison

| Retriever | Type | Pros | Cons | API Key Required |
|-----------|------|------|------|------------------|
| Tavily | Web | Fast, AI-optimized | Paid | Yes |
| DuckDuckGo | Web | Free, privacy | Rate limits | No |
| Google | Web | Best quality | Expensive | Yes |
| Bing | Web | Good quality | Paid | Yes |
| arXiv | Academic | Free, scholarly | Limited domains | No |
| Semantic Scholar | Academic | Research papers | Academic only | No |
| PubMed | Medical | Medical research | Medical only | No |

---

## Conclusion

This integration plan provides a complete roadmap for adding GPT Researcher to Velocity as a fully-featured utility app. The hybrid approach ensures seamless integration with existing authentication, permissions, and UI patterns while leveraging the full power of GPT Researcher's capabilities.

**Estimated Timeline**: 7-10 days for full implementation
**Complexity**: Medium-High
**Value**: High (unique differentiation feature)

Next step: Begin Phase 1 implementation with backend foundation.
