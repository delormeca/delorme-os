import asyncio
from app.db import AsyncSessionLocal
from sqlmodel import select
from app.models import User

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        print(f'\nTotal users: {len(users)}')
        for user in users:
            print(f'\nEmail: {user.email}')
            print(f'Full Name: {user.full_name}')
            print(f'Is Superuser: {user.is_superuser}')
            print(f'Is Active: {user.is_active}')

asyncio.run(check())
