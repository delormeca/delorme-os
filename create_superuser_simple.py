#!/usr/bin/env python3
"""Simple superuser creation script for Render.com"""
import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from passlib.context import CryptContext

async def create_superuser():
    """Create superuser in database"""
    try:
        # Password hasher
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        # Get database credentials from environment
        db_user = os.getenv('db_username', 'delorme_os')
        db_pass = os.getenv('db_password')
        db_host = os.getenv('db_host')
        db_port = os.getenv('db_port', '5432')
        db_name = os.getenv('db_database', 'delorme_os')

        # Also try DATABASE_URL if individual vars not set
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            db_url = f"postgresql+asyncpg://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
        elif db_url.startswith('postgresql://'):
            db_url = db_url.replace('postgresql://', 'postgresql+asyncpg://', 1)

        print(f"Connecting to database...")
        engine = create_async_engine(db_url, echo=False)

        async with engine.begin() as conn:
            # Check if user already exists
            result = await conn.execute(
                text("SELECT email FROM \"user\" WHERE email = 'tommy@delorme.ca'")
            )
            existing_user = result.fetchone()

            if existing_user:
                print("✅ Superuser already exists: tommy@delorme.ca")
            else:
                # Create superuser
                hashed_password = pwd_context.hash("Hockey999!!!")

                await conn.execute(
                    text("""
                        INSERT INTO "user" (email, password_hash, full_name, is_superuser, verified)
                        VALUES ('tommy@delorme.ca', :password, 'Tommy Delorme', true, true)
                    """),
                    {"password": hashed_password}
                )
                print("✅ Superuser created successfully: tommy@delorme.ca")

        await engine.dispose()
        return 0

    except Exception as e:
        print(f"❌ Error creating superuser: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(create_superuser()))
