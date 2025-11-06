import asyncio
from app.db import AsyncSessionLocal
from sqlmodel import select
from app.models import Client

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Client).where(Client.name == 'Frank Agence'))
        client = result.scalar_one_or_none()
        if client:
            print(f'Client ID: {client.id}')
            print(f'Name: {client.name}')
            print(f'Engine Setup Completed: {client.engine_setup_completed}')
            print(f'Last Setup Run ID: {client.last_setup_run_id}')
        else:
            print('Frank Agence client not found')

asyncio.run(check())
