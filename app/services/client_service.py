import logging
from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Client, User
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate

logger = logging.getLogger(__name__)


async def get_clients(session: AsyncSession, user_id: UUID) -> List[ClientRead]:
    """
    Get all clients created by the user.
    """
    query = select(Client).where(Client.created_by == user_id)
    result = await session.execute(query)
    clients = result.scalars().all()

    logger.info("Fetched %d clients for user %s", len(clients), user_id)
    return [ClientRead.model_validate(client) for client in clients]


async def get_client_by_id(session: AsyncSession, client_id: UUID, user_id: UUID) -> ClientRead:
    """
    Get a client by ID. Verify user owns the client.
    """
    client = await session.get(Client, client_id)
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

    return ClientRead.model_validate(client)


async def create_client(session: AsyncSession, client_data: ClientCreate, user_id: UUID) -> ClientRead:
    """
    Create a new client.
    """
    client = Client(
        name=client_data.name,
        industry=client_data.industry,
        created_by=user_id,
    )

    session.add(client)
    await session.commit()
    await session.refresh(client)

    logger.info("Client created: %s by user %s", client_data.name, user_id)
    return ClientRead.model_validate(client)


async def update_client(
    session: AsyncSession,
    client_id: UUID,
    client_data: ClientUpdate,
    user_id: UUID
) -> ClientRead:
    """
    Update a client. Verify user owns the client.
    """
    client = await session.get(Client, client_id)
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

    # Update fields
    if client_data.name is not None:
        client.name = client_data.name
    if client_data.industry is not None:
        client.industry = client_data.industry

    session.add(client)
    await session.commit()
    await session.refresh(client)

    logger.info("Client updated: %s", client_id)
    return ClientRead.model_validate(client)


async def delete_client(session: AsyncSession, client_id: UUID, user_id: UUID, password: str) -> None:
    """
    Delete a client. Verify user owns the client and password is correct.
    """
    from app.services.users_service import UserService
    from passlib.context import CryptContext

    client = await session.get(Client, client_id)
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

    logger.info("Client deleted: %s", client_id)
