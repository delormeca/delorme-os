import asyncio
from app.db import AsyncSessionLocal
from sqlmodel import select, func
from app.models import ClientPage

async def check():
    async with AsyncSessionLocal() as session:
        # Get total count
        result = await session.execute(select(func.count(ClientPage.id)))
        count = result.scalar()
        print(f'\nTotal pages in database: {count}')

        # Get first 5 pages
        result = await session.execute(select(ClientPage).limit(5))
        pages = result.scalars().all()
        print('\nFirst 5 pages:')
        for page in pages:
            print(f'  - {page.url}')

asyncio.run(check())
