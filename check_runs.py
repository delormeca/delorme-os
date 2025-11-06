import asyncio
from app.db import async_engine, AsyncSessionLocal
from sqlmodel import select
from app.models import EngineSetupRun

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(EngineSetupRun).order_by(EngineSetupRun.created_at.desc()).limit(3)
        )
        runs = result.scalars().all()
        print(f'\nFound {len(runs)} recent setup runs:')
        for run in runs:
            print(f'  - ID: {run.id}')
            print(f'    Client: {run.client_id}')
            print(f'    Status: {run.status}')
            print(f'    Type: {run.setup_type}')
            print()

asyncio.run(check())
