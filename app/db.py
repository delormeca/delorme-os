"""
Database configuration with automatic environment loading.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config.base import config

# Use the automatic environment loading from config
ASYNC_DATABASE_URL = config.database_url

# Creating asynchronous engine
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    future=True,
    connect_args={"server_settings": {"jit": "off"}},
)
AsyncSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=True, bind=async_engine, class_=AsyncSession
)


async def get_async_db_session():
    """Get asynchronous database session."""
    async with AsyncSessionLocal() as session:
        yield session
