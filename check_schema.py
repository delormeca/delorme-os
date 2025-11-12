import asyncio
from app.db import get_async_db_session
from sqlalchemy import inspect

async def check_schema():
    async for session in get_async_db_session():
        engine = session.get_bind()
        inspector = inspect(engine)

        cols = inspector.get_columns('client')
        print('Client table columns:')
        for col in cols:
            print(f"  - {col['name']}: {col['type']} (nullable={col['nullable']})")

        indices = inspector.get_indexes('client')
        print('\nClient table indexes:')
        for idx in indices:
            print(f"  - {idx['name']}: {idx['column_names']} (unique={idx['unique']})")

        break

asyncio.run(check_schema())
