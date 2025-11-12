"""One-time setup endpoints for initial deployment."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_async_db_session
from app.models import User
from app.services.users_service import UserService, get_user_service

setup_router = APIRouter()


@setup_router.post("/create-superuser")
async def create_superuser(
    db: AsyncSession = Depends(get_async_db_session),
    user_service: UserService = Depends(get_user_service),
) -> dict:
    """
    Create the default superuser account.
    This endpoint can be called once to initialize the superuser.
    """
    email = "tommy@delorme.ca"
    password = "Hockey999!!!"
    full_name = "Tommy Delorme"

    # Check if user already exists
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        return {
            "success": False,
            "message": f"Superuser {email} already exists",
            "user_id": str(existing_user.id),
        }

    # Create superuser
    try:
        hashed_password = user_service.get_password_hash(password)

        user = User(
            email=email,
            password_hash=hashed_password,
            full_name=full_name,
            is_superuser=True,
            verified=True,
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        return {
            "success": True,
            "message": f"Superuser {email} created successfully",
            "user_id": str(user.id),
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating superuser: {str(e)}")
