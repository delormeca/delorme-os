from typing import List
from uuid import UUID

from fastapi import APIRouter, Body, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.schemas.auth import CurrentUserResponse
from app.schemas.client import ClientCreate, ClientDelete, ClientRead, ClientUpdate
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
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get all clients for the current user."""
    return await client_service.get_clients(db, current_user.user_id)


@router.get("/clients/{client_id}", response_model=ClientRead)
async def get_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get a client by ID."""
    return await client_service.get_client_by_id(db, client_id, current_user.user_id)


@router.put("/clients/{client_id}", response_model=ClientRead)
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Update a client."""
    return await client_service.update_client(db, client_id, client_data, current_user.user_id)


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
