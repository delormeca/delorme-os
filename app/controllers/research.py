"""
Research controller for Deep Researcher feature.
Handles REST API endpoints and WebSocket connections.
"""

import uuid
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, WebSocket, WebSocketDisconnect
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.schemas.auth import CurrentUserResponse
from app.schemas.research import (
    ChatMessageCreate,
    ChatMessageResponse,
    ResearchRequestCreate,
    ResearchRequestDetail,
    ResearchRequestRead,
    RetrieverListResponse,
)
from app.services import users_service
from app.services.research_service import ResearchService
from app.services.retriever_factory import RetrieverFactory

router = APIRouter()


# ==================== Create Research ====================


@router.post("/research", response_model=ResearchRequestRead, tags=["research"])
async def create_research(
    research_data: ResearchRequestCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(users_service.get_current_user),
):
    """
    Create a new research request and optionally start execution in background.

    Args:
        research_data: Research request parameters
        background_tasks: FastAPI background tasks
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created research request
    """
    research = await ResearchService.create_research_request(
        db, current_user.user_id, research_data
    )

    # Execute in background if requested
    if research_data.auto_start:
        background_tasks.add_task(
            ResearchService.execute_research,
            db,
            research.id,
        )

    return research


# ==================== List Research ====================


@router.get("/research", response_model=List[ResearchRequestRead], tags=["research"])
async def list_research(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(users_service.get_current_user),
):
    """
    Get all research requests for the current user.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of research requests
    """
    return await ResearchService.get_user_research_requests(
        db, current_user.user_id, skip, limit
    )


# ==================== Get Research Detail ====================


@router.get("/research/{research_id}", response_model=ResearchRequestDetail, tags=["research"])
async def get_research_detail(
    research_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(users_service.get_current_user),
):
    """
    Get detailed information about a specific research request.

    Args:
        research_id: UUID of the research request
        db: Database session
        current_user: Current authenticated user

    Returns:
        Detailed research request with sources and report
    """
    return await ResearchService.get_research_request_detail(
        db, research_id, current_user.user_id
    )


# ==================== WebSocket for Real-time Progress ====================


@router.websocket("/ws/research/{research_id}")
async def research_websocket(
    websocket: WebSocket,
    research_id: uuid.UUID,
):
    """
    WebSocket endpoint for real-time research progress updates.

    Args:
        websocket: WebSocket connection
        research_id: UUID of the research request

    Note:
        This endpoint connects and streams progress updates in real-time.
        The connection is closed when research completes or fails.
    """
    await websocket.accept()

    try:
        # Get database session
        async for db in get_async_db_session():
            # TODO: Add authentication check for websocket
            # Verify user has access to this research

            # Execute research with websocket updates
            await ResearchService.execute_research(
                db, research_id, websocket=websocket
            )

    except WebSocketDisconnect:
        print(f"WebSocket disconnected for research {research_id}")
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e),
        })
    finally:
        await websocket.close()


# ==================== Cancel Research ====================


@router.post("/research/{research_id}/cancel", response_model=ResearchRequestRead, tags=["research"])
async def cancel_research(
    research_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(users_service.get_current_user),
):
    """
    Cancel a running research request.

    Args:
        research_id: UUID of the research request
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated research request with cancelled status
    """
    return await ResearchService.cancel_research(
        db, research_id, current_user.user_id
    )


# ==================== Delete Research ====================


@router.delete("/research/{research_id}", tags=["research"])
async def delete_research(
    research_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(users_service.get_current_user),
):
    """
    Delete a research request and all associated data.

    Args:
        research_id: UUID of the research request
        db: Database session
        current_user: Current authenticated user

    Returns:
        Success message
    """
    await ResearchService.delete_research(
        db, research_id, current_user.user_id
    )
    return {"message": "Research deleted successfully"}


# ==================== Chat with Research ====================


@router.post("/research/{research_id}/chat", response_model=ChatMessageResponse, tags=["research"])
async def chat_with_research(
    research_id: uuid.UUID,
    message: ChatMessageCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(users_service.get_current_user),
):
    """
    Chat with AI about research results.

    Args:
        research_id: UUID of the research request
        message: User's chat message
        db: Database session
        current_user: Current authenticated user

    Returns:
        Chat response containing both user message and AI response
    """
    return await ResearchService.chat_with_research(
        db, research_id, current_user.user_id, message.content
    )


# ==================== Get Available Retrievers ====================


@router.get("/research/retrievers/list", response_model=RetrieverListResponse, tags=["research"])
async def get_available_retrievers():
    """
    Get list of available search retrievers with their configuration status.

    Returns:
        List of retrievers with configuration information
    """
    retrievers = RetrieverFactory.get_available_retrievers()
    return RetrieverListResponse(retrievers=retrievers)
