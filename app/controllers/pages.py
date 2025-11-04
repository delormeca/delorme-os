from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.schemas.auth import CurrentUserResponse
from app.schemas.page import PageCreate, PageDataRead, PageRead
from app.services import page_service
from app.services.users_service import get_current_user

router = APIRouter()


@router.get("/projects/{project_id}/pages", response_model=List[PageRead])
async def get_project_pages(
    project_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get all pages for a project."""
    return await page_service.get_pages(db, project_id, current_user.user_id)


@router.get("/pages/{page_id}", response_model=PageRead)
async def get_page(
    page_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get a page by ID."""
    return await page_service.get_page_by_id(db, page_id, current_user.user_id)


@router.post("/pages", response_model=PageRead)
async def create_page(
    page_data: PageCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Create a new page."""
    return await page_service.create_page(db, page_data, current_user.user_id)


@router.get("/pages/{page_id}/data", response_model=List[PageDataRead])
async def get_page_data(
    page_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get all data for a page."""
    return await page_service.get_page_data(db, page_id, current_user.user_id)
