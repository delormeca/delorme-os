import logging
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Client, Project
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate

logger = logging.getLogger(__name__)


async def get_projects(
    session: AsyncSession,
    user_id: UUID,
    client_id: Optional[UUID] = None
) -> List[ProjectRead]:
    """
    Get all projects for the user, optionally filtered by client_id.
    """
    # Build query to get projects where the user owns the client
    query = (
        select(Project)
        .join(Client, Project.client_id == Client.id)
        .where(Client.created_by == user_id)
    )

    if client_id:
        query = query.where(Project.client_id == client_id)

    result = await session.execute(query)
    projects = result.scalars().all()

    logger.info("Fetched %d projects for user %s", len(projects), user_id)
    return [ProjectRead.model_validate(project) for project in projects]


async def get_project_by_id(session: AsyncSession, project_id: UUID, user_id: UUID) -> ProjectRead:
    """
    Get a project by ID. Verify user owns the client.
    """
    project = await session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Verify user owns the client
    client = await session.get(Client, project.client_id)
    if not client or str(client.created_by) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this project",
        )

    return ProjectRead.model_validate(project)


async def create_project(session: AsyncSession, project_data: ProjectCreate, user_id: UUID) -> ProjectRead:
    """
    Create a new project.
    """
    # Verify user owns the client
    client = await session.get(Client, project_data.client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    # Verify ownership - compare string representations to handle type mismatches
    if str(client.created_by) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this client",
        )

    project = Project(
        client_id=project_data.client_id,
        name=project_data.name,
        url=project_data.url,
        description=project_data.description,
        sitemap_url=project_data.sitemap_url,
    )

    session.add(project)
    await session.commit()
    await session.refresh(project)

    logger.info("Project created: %s by user %s", project_data.name, user_id)
    return ProjectRead.model_validate(project)


async def update_project(
    session: AsyncSession,
    project_id: UUID,
    project_data: ProjectUpdate,
    user_id: UUID
) -> ProjectRead:
    """
    Update a project. Verify user owns the client.
    """
    project = await session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Verify user owns the client
    client = await session.get(Client, project.client_id)
    if not client or str(client.created_by) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this project",
        )

    # Update fields
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.url is not None:
        project.url = project_data.url
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.sitemap_url is not None:
        project.sitemap_url = project_data.sitemap_url

    session.add(project)
    await session.commit()
    await session.refresh(project)

    logger.info("Project updated: %s", project_id)
    return ProjectRead.model_validate(project)


async def delete_project(session: AsyncSession, project_id: UUID, user_id: UUID, password: str) -> None:
    """
    Delete a project. Verify user owns the client and password is correct.
    """
    from app.models import User
    from passlib.context import CryptContext

    project = await session.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Verify user owns the client
    client = await session.get(Client, project.client_id)
    if not client or str(client.created_by) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this project",
        )

    # Verify password
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    if not pwd_context.verify(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )

    await session.delete(project)
    await session.commit()

    logger.info("Project deleted: %s", project_id)
