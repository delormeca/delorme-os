import io
import json
import logging
import zipfile
from datetime import datetime
from typing import List, Optional
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Client, ProjectLead, User
from app.schemas.client import ClientCreate, ClientRead, ClientSitemapTestResult, ClientUpdate
from app.utils.helpers import get_utcnow

logger = logging.getLogger(__name__)
# Updated client service with all new fields and features


async def get_clients(
    session: AsyncSession,
    search: Optional[str] = None,
    project_lead_id: Optional[UUID] = None,
) -> List[ClientRead]:
    """
    Get all clients (shared across platform). Supports search and filtering.

    Args:
        session: Database session
        search: Optional search term for name or website URL
        project_lead_id: Optional filter by project lead
    """
    query = select(Client).options(selectinload(Client.project_lead))

    # Apply filters
    filters = []
    if search:
        search_term = f"%{search}%"
        filters.append(
            or_(
                Client.name.ilike(search_term),
                Client.website_url.ilike(search_term),
            )
        )

    if project_lead_id:
        filters.append(Client.project_lead_id == project_lead_id)

    if filters:
        query = query.where(*filters)

    result = await session.execute(query)
    clients = result.scalars().all()

    logger.info("Fetched %d clients (search=%s, lead=%s)", len(clients), search, project_lead_id)
    return [ClientRead.model_validate(client) for client in clients]


async def get_client_by_id(session: AsyncSession, client_id: UUID) -> ClientRead:
    """
    Get a client by ID (no ownership check - clients are shared).
    """
    query = select(Client).options(selectinload(Client.project_lead)).where(Client.id == client_id)
    result = await session.execute(query)
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    return ClientRead.model_validate(client)


async def create_client(session: AsyncSession, client_data: ClientCreate, user_id: UUID) -> ClientRead:
    """
    Create a new client with all fields.
    """
    # Check for duplicate name
    query = select(Client).where(Client.name == client_data.name)
    result = await session.execute(query)
    existing_client = result.scalar_one_or_none()

    if existing_client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A client with this name already exists",
        )

    # Verify project lead exists if provided
    if client_data.project_lead_id:
        lead = await session.get(ProjectLead, client_data.project_lead_id)
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project lead not found",
            )

    client = Client(
        name=client_data.name,
        description=client_data.description,
        website_url=client_data.website_url,
        sitemap_url=client_data.sitemap_url,
        industry=client_data.industry,
        logo_url=client_data.logo_url,
        crawl_frequency=client_data.crawl_frequency,
        status=client_data.status,
        project_lead_id=client_data.project_lead_id,
        created_by=user_id,
    )

    session.add(client)
    await session.commit()
    await session.refresh(client)

    # Load the project_lead relationship
    query = select(Client).options(selectinload(Client.project_lead)).where(Client.id == client.id)
    result = await session.execute(query)
    client = result.scalar_one()

    logger.info("Client created: %s by user %s", client_data.name, user_id)
    return ClientRead.model_validate(client)


async def update_client(
    session: AsyncSession,
    client_id: UUID,
    client_data: ClientUpdate,
) -> ClientRead:
    """
    Update a client (no ownership check - clients are shared).
    """
    client = await session.get(Client, client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    # Check for duplicate name if name is being updated
    if client_data.name and client_data.name != client.name:
        query = select(Client).where(Client.name == client_data.name)
        result = await session.execute(query)
        existing_client = result.scalar_one_or_none()

        if existing_client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A client with this name already exists",
            )

    # Verify project lead exists if provided
    if client_data.project_lead_id is not None:
        if client_data.project_lead_id:  # Not None and not empty
            lead = await session.get(ProjectLead, client_data.project_lead_id)
            if not lead:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Project lead not found",
                )

    # Update fields
    if client_data.name is not None:
        client.name = client_data.name
    if client_data.description is not None:
        client.description = client_data.description
    if client_data.website_url is not None:
        client.website_url = client_data.website_url
    if client_data.sitemap_url is not None:
        client.sitemap_url = client_data.sitemap_url
    if client_data.industry is not None:
        client.industry = client_data.industry
    if client_data.logo_url is not None:
        client.logo_url = client_data.logo_url
    if client_data.crawl_frequency is not None:
        client.crawl_frequency = client_data.crawl_frequency
    if client_data.status is not None:
        client.status = client_data.status
    if client_data.project_lead_id is not None:
        client.project_lead_id = client_data.project_lead_id

    # Update the updated_at timestamp
    client.updated_at = get_utcnow()

    session.add(client)
    await session.commit()
    await session.refresh(client)

    # Load the project_lead relationship
    query = select(Client).options(selectinload(Client.project_lead)).where(Client.id == client.id)
    result = await session.execute(query)
    client = result.scalar_one()

    logger.info("Client updated: %s", client_id)
    return ClientRead.model_validate(client)


async def delete_client(session: AsyncSession, client_id: UUID, user_id: UUID, password: str) -> None:
    """
    Delete a client. Requires password confirmation.
    """
    from passlib.context import CryptContext

    client = await session.get(Client, client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
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

    await session.delete(client)
    await session.commit()

    logger.info("Client deleted: %s by user %s", client_id, user_id)


async def test_sitemap(sitemap_url: str) -> ClientSitemapTestResult:
    """
    Test a sitemap URL to validate it and count URLs.

    Args:
        sitemap_url: The sitemap URL to test

    Returns:
        ClientSitemapTestResult with validation results
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(sitemap_url)
            response.raise_for_status()

            content = response.text

            # Basic validation - check if it's XML
            if not content.strip().startswith("<?xml") and not content.strip().startswith("<"):
                return ClientSitemapTestResult(
                    is_valid=False,
                    url_count=0,
                    error="Invalid sitemap format - not XML",
                )

            # Count URLs (simple count of <loc> tags)
            import re
            url_pattern = r"<loc>(.*?)</loc>"
            urls = re.findall(url_pattern, content)

            # Get sample URLs (first 5)
            sample_urls = urls[:5] if urls else []

            return ClientSitemapTestResult(
                is_valid=True,
                url_count=len(urls),
                sample_urls=sample_urls,
            )

    except httpx.HTTPStatusError as e:
        return ClientSitemapTestResult(
            is_valid=False,
            url_count=0,
            error=f"HTTP {e.response.status_code}: {e.response.reason_phrase}",
        )
    except httpx.RequestError as e:
        return ClientSitemapTestResult(
            is_valid=False,
            url_count=0,
            error=f"Connection error: {str(e)}",
        )
    except Exception as e:
        return ClientSitemapTestResult(
            is_valid=False,
            url_count=0,
            error=f"Error: {str(e)}",
        )


async def bulk_delete_clients(
    session: AsyncSession,
    client_ids: List[UUID],
    user_id: UUID,
    create_backup: bool = True,
) -> Optional[bytes]:
    """
    Delete multiple clients. Optionally create a backup before deletion.

    Args:
        session: Database session
        client_ids: List of client IDs to delete
        user_id: User performing the deletion
        create_backup: Whether to create a backup .zip file

    Returns:
        Backup zip file bytes if create_backup=True, otherwise None
    """
    # Fetch all clients
    query = select(Client).options(selectinload(Client.project_lead)).where(Client.id.in_(client_ids))
    result = await session.execute(query)
    clients = result.scalars().all()

    if not clients:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No clients found with provided IDs",
        )

    backup_data = None
    if create_backup:
        backup_data = await generate_backup(clients)

    # Delete all clients
    for client in clients:
        await session.delete(client)

    await session.commit()

    logger.info("Bulk deleted %d clients by user %s", len(clients), user_id)

    return backup_data


async def generate_backup(clients: List[Client]) -> bytes:
    """
    Generate a .zip backup file containing client metadata.

    Args:
        clients: List of Client objects to backup

    Returns:
        Zip file bytes
    """
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # Create metadata JSON for each client
        for client in clients:
            client_data = {
                "id": str(client.id),
                "name": client.name,
                "description": client.description,
                "website_url": client.website_url,
                "sitemap_url": client.sitemap_url,
                "industry": client.industry,
                "logo_url": client.logo_url,
                "crawl_frequency": client.crawl_frequency,
                "status": client.status,
                "page_count": client.page_count,
                "project_lead_id": str(client.project_lead_id) if client.project_lead_id else None,
                "project_lead_name": client.project_lead.name if client.project_lead else None,
                "created_at": client.created_at.isoformat(),
                "updated_at": client.updated_at.isoformat(),
            }

            # Add JSON file for this client
            filename = f"{client.name.replace(' ', '_')}.json"
            zip_file.writestr(filename, json.dumps(client_data, indent=2))

        # Create summary file
        summary = {
            "backup_date": get_utcnow().isoformat(),
            "total_clients": len(clients),
            "client_names": [c.name for c in clients],
        }
        zip_file.writestr("_backup_summary.json", json.dumps(summary, indent=2))

    zip_buffer.seek(0)
    return zip_buffer.read()
