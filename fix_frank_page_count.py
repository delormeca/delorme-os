import asyncio
from app.db import AsyncSessionLocal
from sqlmodel import select
from app.models import Client

async def fix():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Client).where(Client.name == 'Frank Agence'))
        client = result.scalar_one_or_none()

        if client:
            print(f'Before: page_count = {client.page_count}, engine_setup_completed = {client.engine_setup_completed}')
            client.page_count = 52
            await session.commit()
            print(f'After: page_count = {client.page_count}, engine_setup_completed = {client.engine_setup_completed}')
            print('Client updated successfully!')
        else:
            print('Client not found')

asyncio.run(fix())
