import logging
from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Client, ProjectLead
from app.schemas.project_lead import ProjectLeadCreate, ProjectLeadRead, ProjectLeadUpdate

logger = logging.getLogger(__name__)


async def get_all_project_leads(session: AsyncSession) -> List[ProjectLeadRead]:
    """
    Get all project leads with client counts.
    """
    # Query to get project leads with client count
    query = (
        select(
            ProjectLead,
            func.count(Client.id).label("client_count")
        )
        .outerjoin(Client, Client.project_lead_id == ProjectLead.id)
        .group_by(ProjectLead.id)
    )

    result = await session.execute(query)
    leads_with_counts = result.all()

    project_leads = []
    for lead, client_count in leads_with_counts:
        lead_dict = lead.model_dump()
        lead_dict["client_count"] = client_count
        project_leads.append(ProjectLeadRead.model_validate(lead_dict))

    logger.info("Fetched %d project leads", len(project_leads))
    return project_leads


async def get_project_lead_by_id(session: AsyncSession, lead_id: UUID) -> ProjectLeadRead:
    """
    Get a project lead by ID with client count.
    """
    lead = await session.get(ProjectLead, lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project lead not found",
        )

    # Get client count
    count_query = select(func.count(Client.id)).where(Client.project_lead_id == lead_id)
    result = await session.execute(count_query)
    client_count = result.scalar() or 0

    lead_dict = lead.model_dump()
    lead_dict["client_count"] = client_count

    return ProjectLeadRead.model_validate(lead_dict)


async def create_project_lead(session: AsyncSession, lead_data: ProjectLeadCreate) -> ProjectLeadRead:
    """
    Create a new project lead.
    """
    # Check for duplicate email
    query = select(ProjectLead).where(ProjectLead.email == lead_data.email)
    result = await session.execute(query)
    existing_lead = result.scalar_one_or_none()

    if existing_lead:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A project lead with this email already exists",
        )

    lead = ProjectLead(
        name=lead_data.name,
        email=lead_data.email,
    )

    session.add(lead)
    await session.commit()
    await session.refresh(lead)

    logger.info("Project lead created: %s", lead_data.name)

    lead_dict = lead.model_dump()
    lead_dict["client_count"] = 0
    return ProjectLeadRead.model_validate(lead_dict)


async def update_project_lead(
    session: AsyncSession,
    lead_id: UUID,
    lead_data: ProjectLeadUpdate
) -> ProjectLeadRead:
    """
    Update a project lead.
    """
    lead = await session.get(ProjectLead, lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project lead not found",
        )

    # Check for duplicate email if email is being updated
    if lead_data.email and lead_data.email != lead.email:
        query = select(ProjectLead).where(ProjectLead.email == lead_data.email)
        result = await session.execute(query)
        existing_lead = result.scalar_one_or_none()

        if existing_lead:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A project lead with this email already exists",
            )

    # Update fields
    if lead_data.name is not None:
        lead.name = lead_data.name
    if lead_data.email is not None:
        lead.email = lead_data.email

    # Update the updated_at timestamp
    from app.utils.helpers import get_utcnow
    lead.updated_at = get_utcnow()

    session.add(lead)
    await session.commit()
    await session.refresh(lead)

    logger.info("Project lead updated: %s", lead_id)

    # Get client count
    count_query = select(func.count(Client.id)).where(Client.project_lead_id == lead_id)
    result = await session.execute(count_query)
    client_count = result.scalar() or 0

    lead_dict = lead.model_dump()
    lead_dict["client_count"] = client_count

    return ProjectLeadRead.model_validate(lead_dict)


async def delete_project_lead(session: AsyncSession, lead_id: UUID) -> None:
    """
    Delete a project lead. Sets affected clients' project_lead_id to NULL.
    """
    lead = await session.get(ProjectLead, lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project lead not found",
        )

    # The foreign key is set to ON DELETE SET NULL, so clients will be automatically updated
    await session.delete(lead)
    await session.commit()

    logger.info("Project lead deleted: %s", lead_id)


async def seed_default_leads(session: AsyncSession) -> None:
    """
    Seed default project leads if none exist.
    """
    # Check if any leads exist
    query = select(func.count(ProjectLead.id))
    result = await session.execute(query)
    count = result.scalar()

    if count > 0:
        logger.info("Project leads already exist, skipping seed")
        return

    # Create default leads
    default_leads = [
        ProjectLead(name="Tommy Delorme", email="tommy@company.com"),
        ProjectLead(name="Ismael Girard", email="ismael@company.com"),
        ProjectLead(name="OP", email="op@company.com"),
    ]

    for lead in default_leads:
        session.add(lead)

    await session.commit()
    logger.info("Seeded %d default project leads", len(default_leads))
