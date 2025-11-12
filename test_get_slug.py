import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.db import async_engine
from app.models import Client


async def get_slug():
    async with AsyncSession(async_engine) as session:
        result = await session.execute(select(Client).limit(1))
        client = result.scalar_one_or_none()
        if client:
            print(client.slug)
        else:
            print("No clients found")


if __name__ == "__main__":
    asyncio.run(get_slug())
