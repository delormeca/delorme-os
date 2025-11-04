"""
Research service for managing deep research requests.
Handles CRUD operations and orchestrates research execution.
"""

import datetime
import time
import uuid
from typing import List, Optional

from fastapi import HTTPException, WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import ResearchChatMessage, ResearchRequest, ResearchSource, User
from app.schemas.research import (
    ChatMessageCreate,
    ChatMessageRead,
    ChatMessageResponse,
    ResearchRequestCreate,
    ResearchRequestDetail,
    ResearchRequestRead,
    ResearchSourceRead,
)
from app.services.gpt_researcher_wrapper import GPTResearcherWrapper, WebSocketManager
from app.services.retriever_factory import RetrieverFactory
from app.utils.helpers import get_utcnow


class ResearchService:
    """Service for managing research requests."""

    @staticmethod
    async def create_research_request(
        db: AsyncSession,
        user_id: uuid.UUID,
        research_data: ResearchRequestCreate,
    ) -> ResearchRequestRead:
        """
        Create a new research request.

        Args:
            db: Database session
            user_id: ID of the user creating the research
            research_data: Research request data

        Returns:
            Created research request
        """
        # Validate retrievers
        all_valid, invalid = RetrieverFactory.validate_retrievers_list(research_data.retrievers)
        if not all_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid or unconfigured retrievers: {', '.join(invalid)}",
            )

        # Create research request
        research_request = ResearchRequest(
            user_id=user_id,
            query=research_data.query,
            report_type=research_data.report_type,
            tone=research_data.tone,
            max_iterations=research_data.max_iterations,
            search_depth=research_data.search_depth,
            retrievers={"retrievers": research_data.retrievers},
            status="pending",
            progress=0.0,
        )

        db.add(research_request)
        await db.commit()
        await db.refresh(research_request)

        return ResearchRequestRead.model_validate(research_request)

    @staticmethod
    async def get_user_research_requests(
        db: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ResearchRequestRead]:
        """
        Get all research requests for a user.

        Args:
            db: Database session
            user_id: ID of the user
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of research requests
        """
        statement = (
            select(ResearchRequest)
            .where(ResearchRequest.user_id == user_id)
            .order_by(ResearchRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(statement)
        research_requests = result.scalars().all()

        return [ResearchRequestRead.model_validate(r) for r in research_requests]

    @staticmethod
    async def get_research_request_detail(
        db: AsyncSession,
        research_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> ResearchRequestDetail:
        """
        Get detailed information about a research request.

        Args:
            db: Database session
            research_id: ID of the research request
            user_id: ID of the user (for authorization)

        Returns:
            Detailed research request

        Raises:
            HTTPException: If research not found or unauthorized
        """
        statement = select(ResearchRequest).where(ResearchRequest.id == research_id)
        result = await db.execute(statement)
        research = result.scalar_one_or_none()

        if not research:
            raise HTTPException(status_code=404, detail="Research not found")

        if research.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this research")

        # Get sources
        sources_statement = select(ResearchSource).where(
            ResearchSource.research_request_id == research_id
        )
        sources_result = await db.execute(sources_statement)
        sources = sources_result.scalars().all()

        # Build response
        research_dict = research.model_dump()
        research_dict["sources"] = [ResearchSourceRead.model_validate(s) for s in sources]

        return ResearchRequestDetail.model_validate(research_dict)

    @staticmethod
    async def execute_research(
        db: AsyncSession,
        research_id: uuid.UUID,
        websocket: Optional[WebSocket] = None,
    ) -> ResearchRequestRead:
        """
        Execute a research request.

        Args:
            db: Database session
            research_id: ID of the research request
            websocket: Optional WebSocket for progress updates

        Returns:
            Updated research request

        Raises:
            HTTPException: If research not found or already completed
        """
        # Get research request
        statement = select(ResearchRequest).where(ResearchRequest.id == research_id)
        result = await db.execute(statement)
        research = result.scalar_one_or_none()

        if not research:
            raise HTTPException(status_code=404, detail="Research not found")

        if research.status in ("completed", "processing"):
            raise HTTPException(
                status_code=400,
                detail=f"Research is already {research.status}",
            )

        # Update status to processing
        research.status = "processing"
        research.started_at = get_utcnow()
        research.progress = 0.0
        await db.commit()

        start_time = time.time()

        try:
            # Create websocket manager
            ws_manager = WebSocketManager(websocket)

            # Extract retrievers from JSON field
            retrievers_list = research.retrievers.get("retrievers", ["tavily"])

            # Initialize GPT Researcher wrapper
            wrapper = GPTResearcherWrapper(
                query=research.query,
                report_type=research.report_type,
                tone=research.tone,
                retrievers=retrievers_list,
                websocket_manager=ws_manager,
                max_iterations=research.max_iterations,
            )

            # Conduct research
            result = await wrapper.conduct_research()

            # Save results
            research.report_content = result.report
            research.report_markdown = result.report_markdown
            research.report_html = result.report_html
            research.cost_usd = result.cost
            research.status = "completed"
            research.progress = 100.0
            research.completed_at = get_utcnow()
            research.duration_seconds = time.time() - start_time

            # Save sources
            for source_data in result.sources:
                source = ResearchSource(
                    research_request_id=research_id,
                    url=source_data["url"],
                    title=source_data.get("title"),
                    summary=source_data.get("summary"),
                    retriever=source_data.get("retriever", "unknown"),
                    relevance_score=source_data.get("relevance_score"),
                )
                db.add(source)

            research.total_sources = len(result.sources)

            await db.commit()
            await db.refresh(research)

            return ResearchRequestRead.model_validate(research)

        except Exception as e:
            # Update status to failed
            research.status = "failed"
            research.error_message = str(e)
            research.completed_at = get_utcnow()
            research.duration_seconds = time.time() - start_time

            await db.commit()

            raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")

    @staticmethod
    async def cancel_research(
        db: AsyncSession,
        research_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> ResearchRequestRead:
        """
        Cancel a running research request.

        Args:
            db: Database session
            research_id: ID of the research request
            user_id: ID of the user (for authorization)

        Returns:
            Updated research request
        """
        statement = select(ResearchRequest).where(ResearchRequest.id == research_id)
        result = await db.execute(statement)
        research = result.scalar_one_or_none()

        if not research:
            raise HTTPException(status_code=404, detail="Research not found")

        if research.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        if research.status != "processing":
            raise HTTPException(status_code=400, detail="Research is not currently running")

        research.status = "cancelled"
        research.completed_at = get_utcnow()

        await db.commit()
        await db.refresh(research)

        return ResearchRequestRead.model_validate(research)

    @staticmethod
    async def delete_research(
        db: AsyncSession,
        research_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> bool:
        """
        Delete a research request and all associated data.

        Args:
            db: Database session
            research_id: ID of the research request
            user_id: ID of the user (for authorization)

        Returns:
            True if deleted successfully
        """
        statement = select(ResearchRequest).where(ResearchRequest.id == research_id)
        result = await db.execute(statement)
        research = result.scalar_one_or_none()

        if not research:
            raise HTTPException(status_code=404, detail="Research not found")

        if research.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        await db.delete(research)
        await db.commit()

        return True

    @staticmethod
    async def chat_with_research(
        db: AsyncSession,
        research_id: uuid.UUID,
        user_id: uuid.UUID,
        message: str,
    ) -> ChatMessageResponse:
        """
        Chat with AI about research results.

        Args:
            db: Database session
            research_id: ID of the research request
            user_id: ID of the user (for authorization)
            message: User's message

        Returns:
            Chat response with both user message and AI response
        """
        # Get research request
        statement = select(ResearchRequest).where(ResearchRequest.id == research_id)
        result = await db.execute(statement)
        research = result.scalar_one_or_none()

        if not research:
            raise HTTPException(status_code=404, detail="Research not found")

        if research.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        if research.status != "completed":
            raise HTTPException(status_code=400, detail="Research is not completed yet")

        # Create user message record
        user_message_record = ResearchChatMessage(
            research_request_id=research_id,
            role="user",
            content=message,
        )
        db.add(user_message_record)
        await db.flush()

        # Generate AI response
        wrapper = GPTResearcherWrapper(query=research.query)
        ai_response = await wrapper.chat_with_research(
            report=research.report_content or research.report_markdown or "",
            question=message,
        )

        # Create AI message record
        ai_message_record = ResearchChatMessage(
            research_request_id=research_id,
            role="assistant",
            content=ai_response,
        )
        db.add(ai_message_record)

        await db.commit()
        await db.refresh(user_message_record)
        await db.refresh(ai_message_record)

        return ChatMessageResponse(
            message=ChatMessageRead.model_validate(user_message_record),
            response=ChatMessageRead.model_validate(ai_message_record),
        )
