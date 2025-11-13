from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.schemas.auth import CurrentUserResponse
from app.schemas.client import (
    ClientBulkDelete,
    ClientCreate,
    ClientDelete,
    ClientRead,
    ClientSitemapTest,
    ClientSitemapTestResult,
    ClientUpdate,
)
from app.services import client_service
from app.services.users_service import get_current_user

router = APIRouter()


@router.post("/clients", response_model=ClientRead)
async def create_client(
    client_data: ClientCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Create a new client."""
    return await client_service.create_client(db, client_data, current_user.user_id)


@router.get("/clients", response_model=List[ClientRead])
async def get_clients(
    search: Optional[str] = Query(None, description="Search by name or website URL"),
    project_lead_id: Optional[UUID] = Query(None, description="Filter by project lead"),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get all clients (shared across platform). Supports search and filtering."""
    return await client_service.get_clients(db, search=search, project_lead_id=project_lead_id)


@router.get("/clients/slug/{slug}", response_model=ClientRead)
async def get_client_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get a client by slug (URL-friendly identifier)."""
    return await client_service.get_client_by_slug(db, slug)


@router.get("/clients/{client_identifier}", response_model=ClientRead)
async def get_client(
    client_identifier: str,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get a client by ID or slug."""
    # Try to parse as UUID first
    try:
        client_uuid = UUID(client_identifier)
        return await client_service.get_client_by_id(db, client_uuid)
    except ValueError:
        # If not a UUID, treat as slug
        return await client_service.get_client_by_slug(db, client_identifier)


@router.put("/clients/{client_id}", response_model=ClientRead)
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Update a client."""
    return await client_service.update_client(db, client_id, client_data)


@router.delete("/clients/{client_id}")
async def delete_client(
    client_id: UUID,
    delete_data: ClientDelete = Body(...),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Delete a client. Requires password confirmation."""
    await client_service.delete_client(db, client_id, current_user.user_id, delete_data.password)
    return {"message": "Client deleted successfully"}


@router.post("/clients/test-sitemap", response_model=ClientSitemapTestResult)
async def test_sitemap(
    sitemap_data: ClientSitemapTest,
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Test a sitemap URL to validate it and count URLs."""
    return await client_service.test_sitemap(sitemap_data.sitemap_url)


@router.post("/clients/bulk-delete")
async def bulk_delete_clients(
    bulk_delete_data: ClientBulkDelete,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Delete multiple clients. Optionally creates a backup .zip file.
    Returns the backup file if create_backup=True.
    """
    backup_data = await client_service.bulk_delete_clients(
        db,
        bulk_delete_data.client_ids,
        current_user.user_id,
        bulk_delete_data.create_backup,
    )

    if backup_data:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"clients_backup_{timestamp}.zip"

        return StreamingResponse(
            iter([backup_data]),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    return {"message": f"Successfully deleted {len(bulk_delete_data.client_ids)} clients"}


@router.post("/clients/backup")
async def generate_backup(
    client_ids: List[UUID] = Body(..., embed=True),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Generate a backup .zip file for specific clients."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    from app.models import Client

    # Fetch clients
    query = select(Client).options(selectinload(Client.project_lead)).where(Client.id.in_(client_ids))
    result = await db.execute(query)
    clients = result.scalars().all()

    if not clients:
        return Response(status_code=404, content="No clients found")

    backup_data = await client_service.generate_backup(clients)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"clients_backup_{timestamp}.zip"

    return StreamingResponse(
        iter([backup_data]),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
