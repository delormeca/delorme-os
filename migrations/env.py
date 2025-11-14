from logging.config import fileConfig
import os
from typing import Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings
from sqlmodel import SQLModel
from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
from app.models import *  # noqa: F403

import asyncio

class AlembicSettings(BaseSettings):
    # Support both DATABASE_URL and individual components
    database_url: Optional[str] = None
    db_username: Optional[str] = None
    db_password: Optional[str] = None
    db_host: Optional[str] = None
    db_port: Optional[str] = None
    db_database: Optional[str] = None

    class Config:
        env_file = os.getenv("ENV_FILE", "local.env")
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields in env file

    @field_validator('database_url', 'db_username', mode='after')
    @classmethod
    def validate_database_config(cls, v, info):
        """Ensure either DATABASE_URL or individual components are provided"""
        # This runs after all fields are set, so we can access other fields
        return v

    def model_post_init(self, __context) -> None:
        """Validate that we have enough information to connect to database"""
        if not self.database_url and not all([
            self.db_username,
            self.db_password,
            self.db_host,
            self.db_port,
            self.db_database
        ]):
            raise ValueError(
                "Must provide either DATABASE_URL or all of: "
                "db_username, db_password, db_host, db_port, db_database"
            )

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

def get_driver_url():
    alembic_settings = AlembicSettings()

    # If DATABASE_URL is provided, use it directly (convert to asyncpg driver)
    if alembic_settings.database_url:
        url = alembic_settings.database_url
        # Replace postgresql:// with postgresql+asyncpg://
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    # Otherwise, construct from individual components
    return f"postgresql+asyncpg://{alembic_settings.db_username}:{alembic_settings.db_password}@{alembic_settings.db_host}:{alembic_settings.db_port}/{alembic_settings.db_database}"

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """

    url = get_driver_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = create_async_engine(get_driver_url(), echo=True, future=True)


    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
