import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.db import async_engine
from app.models import User


async def get_user():
    async with AsyncSession(async_engine) as session:
        result = await session.exec(select(User).limit(1))
        user = result.first()
        if user:
            print(f"Email: {user.email}")
        else:
            print("No users found")


if __name__ == "__main__":
    asyncio.run(get_user())
