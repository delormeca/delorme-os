import asyncio
from app.db import AsyncSessionLocal
from sqlmodel import select
from app.models import Client

async def verify():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Client).where(Client.name == 'Frank Agence'))
        client = result.scalar_one_or_none()

        if client:
            print(f'\n=== Frank Agence Client Status ===')
            print(f'ID: {client.id}')
            print(f'Name: {client.name}')
            print(f'page_count: {client.page_count}')
            print(f'engine_setup_completed: {client.engine_setup_completed}')
            print(f'last_setup_run_id: {client.last_setup_run_id}')
        else:
            print('Client not found')

asyncio.run(verify())
