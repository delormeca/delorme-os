from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.schemas.auth import CurrentUserResponse
from app.schemas.project import ProjectCreate, ProjectDelete, ProjectRead, ProjectUpdate
from app.services import project_service
from app.services.users_service import get_current_user

router = APIRouter()


@router.post("/projects", response_model=ProjectRead)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Create a new project."""
    return await project_service.create_project(db, project_data, current_user.user_id)


@router.get("/projects", response_model=List[ProjectRead])
async def get_projects(
    client_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get all projects for the current user, optionally filtered by client_id."""
    return await project_service.get_projects(db, current_user.user_id, client_id)


@router.get("/projects/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get a project by ID."""
    return await project_service.get_project_by_id(db, project_id, current_user.user_id)


@router.put("/projects/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Update a project."""
    return await project_service.update_project(db, project_id, project_data, current_user.user_id)


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: UUID,
    delete_data: ProjectDelete = Body(...),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Delete a project. Requires password confirmation."""
    await project_service.delete_project(db, project_id, current_user.user_id, delete_data.password)
    return {"message": "Project deleted successfully"}
