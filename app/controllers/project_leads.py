from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.schemas.auth import CurrentUserResponse
from app.schemas.project_lead import ProjectLeadCreate, ProjectLeadRead, ProjectLeadUpdate
from app.services import project_lead_service
from app.services.users_service import get_current_user

router = APIRouter()


@router.post("/project-leads", response_model=ProjectLeadRead)
async def create_project_lead(
    lead_data: ProjectLeadCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Create a new project lead."""
    return await project_lead_service.create_project_lead(db, lead_data)


@router.get("/project-leads", response_model=List[ProjectLeadRead])
async def get_project_leads(
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get all project leads."""
    return await project_lead_service.get_all_project_leads(db)


@router.get("/project-leads/{lead_id}", response_model=ProjectLeadRead)
async def get_project_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get a project lead by ID."""
    return await project_lead_service.get_project_lead_by_id(db, lead_id)


@router.put("/project-leads/{lead_id}", response_model=ProjectLeadRead)
async def update_project_lead(
    lead_id: UUID,
    lead_data: ProjectLeadUpdate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Update a project lead."""
    return await project_lead_service.update_project_lead(db, lead_id, lead_data)


@router.delete("/project-leads/{lead_id}")
async def delete_project_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Delete a project lead. Clients assigned to this lead will have their project_lead_id set to NULL."""
    await project_lead_service.delete_project_lead(db, lead_id)
    return {"message": "Project lead deleted successfully"}
