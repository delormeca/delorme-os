import logging
from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Client, Page, PageData, Project
from app.schemas.page import PageCreate, PageDataRead, PageRead

logger = logging.getLogger(__name__)


async def get_pages(session: AsyncSession, project_id: UUID, user_id: UUID) -> List[PageRead]:
    """
    Get all pages for a project. Verify user owns the client.
    """
    # Verify user owns the project's client
    project = await session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    client = await session.get(Client, project.client_id)
    if not client or client.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this project",
        )

    query = select(Page).where(Page.project_id == project_id)
    result = await session.execute(query)
    pages = result.scalars().all()

    logger.info("Fetched %d pages for project %s", len(pages), project_id)
    return [PageRead.model_validate(page) for page in pages]


async def get_page_by_id(session: AsyncSession, page_id: UUID, user_id: UUID) -> PageRead:
    """
    Get a page by ID. Verify user owns the client.
    """
    page = await session.get(Page, page_id)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )

    # Verify user owns the project's client
    project = await session.get(Project, page.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    client = await session.get(Client, project.client_id)
    if not client or client.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this page",
        )

    return PageRead.model_validate(page)


async def create_page(session: AsyncSession, page_data: PageCreate, user_id: UUID) -> PageRead:
    """
    Create a new page. Verify user owns the project's client.
    """
    # Verify user owns the project's client
    project = await session.get(Project, page_data.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    client = await session.get(Client, project.client_id)
    if not client or client.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this project",
        )

    page = Page(
        project_id=page_data.project_id,
        url=page_data.url,
        slug=page_data.slug,
        status=page_data.status,
        update_frequency=page_data.update_frequency,
    )

    session.add(page)
    await session.commit()
    await session.refresh(page)

    logger.info("Page created: %s for project %s", page_data.url, page_data.project_id)
    return PageRead.model_validate(page)


async def get_page_data(session: AsyncSession, page_id: UUID, user_id: UUID) -> List[PageDataRead]:
    """
    Get all page data for a page. Verify user owns the client.
    """
    # Verify user owns the page
    page = await session.get(Page, page_id)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )

    # Verify user owns the project's client
    project = await session.get(Project, page.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    client = await session.get(Client, project.client_id)
    if not client or client.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this page",
        )

    query = select(PageData).where(PageData.page_id == page_id)
    result = await session.execute(query)
    page_data_list = result.scalars().all()

    logger.info("Fetched %d page data entries for page %s", len(page_data_list), page_id)
    return [PageDataRead.model_validate(pd) for pd in page_data_list]
