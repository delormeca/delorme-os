import argparse
import asyncio
import logging

from passlib.context import CryptContext
from sqlalchemy import insert
from sqlalchemy.exc import IntegrityError

from app.db import AsyncSessionLocal
from app.models import User

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_superuser(email: str, password: str, full_name: str):
    async with AsyncSessionLocal() as db_session:
        hashed_password = pwd_context.hash(password)

        stmt = insert(User).values(
            email=email,
            password_hash=hashed_password,
            full_name=full_name,
            is_superuser=True,
        )
        try:

            await db_session.execute(stmt)
            await db_session.commit()
            logger.info(f"Superuser {email} created.")
        except IntegrityError:
            await db_session.rollback()
            logger.error(f"Superuser {email} already exists.")
        except Exception as e:
            await db_session.rollback()
            logger.error(f"Failed to create superuser: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create superuser script")
    parser.add_argument("--email", required=True, help="Superuser email")
    parser.add_argument("--password", required=True, help="Superuser password")
    parser.add_argument("--full_name", required=True, help="Superuser full name")
    args = parser.parse_args()

    asyncio.run(create_superuser(args.email, args.password, args.full_name))
