"""
Setup Tommy as the permanent superuser account.
Email: tommy@delorme.ca
This account has full access forever.
"""
import asyncio
import logging

from passlib.context import CryptContext
from sqlalchemy import select, delete

from app.db import AsyncSessionLocal
from app.models import User

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SUPERUSER_EMAIL = "tommy@delorme.ca"
SUPERUSER_PASSWORD = "Hockey999!!!"
SUPERUSER_FULL_NAME = "Tommy Delorme (Superadmin)"


async def setup_tommy_superuser():
    """
    Setup Tommy as the permanent superuser.
    Updates existing user if present, or creates new.
    """
    async with AsyncSessionLocal() as db_session:
        try:
            # Check if user already exists
            stmt = select(User).where(User.email == SUPERUSER_EMAIL)
            result = await db_session.execute(stmt)
            existing_user = result.scalar_one_or_none()

            if existing_user:
                logger.info(f"User {SUPERUSER_EMAIL} already exists. Updating password and superuser status...")

                # Update password and ensure superuser status
                hashed_password = pwd_context.hash(SUPERUSER_PASSWORD)
                existing_user.password_hash = hashed_password
                existing_user.full_name = SUPERUSER_FULL_NAME
                existing_user.is_superuser = True

                await db_session.commit()
                await db_session.refresh(existing_user)

                logger.info("=" * 80)
                logger.info("SUPERUSER UPDATED SUCCESSFULLY!")
                logger.info("=" * 80)
                logger.info(f"Email: {SUPERUSER_EMAIL}")
                logger.info(f"Password: {SUPERUSER_PASSWORD}")
                logger.info(f"Full Name: {SUPERUSER_FULL_NAME}")
                logger.info(f"Is Superuser: True")
                logger.info(f"User ID: {existing_user.id}")
                logger.info("=" * 80)
                logger.info("This account has FULL ACCESS FOREVER.")
                logger.info("=" * 80)

            else:
                # Create fresh superuser
                logger.info(f"Creating new superuser: {SUPERUSER_EMAIL}")
                hashed_password = pwd_context.hash(SUPERUSER_PASSWORD)

                new_user = User(
                    email=SUPERUSER_EMAIL,
                    password_hash=hashed_password,
                    full_name=SUPERUSER_FULL_NAME,
                    is_superuser=True,
                )

                db_session.add(new_user)
                await db_session.commit()
                await db_session.refresh(new_user)

                logger.info("=" * 80)
                logger.info("SUPERUSER CREATED SUCCESSFULLY!")
                logger.info("=" * 80)
                logger.info(f"Email: {SUPERUSER_EMAIL}")
                logger.info(f"Password: {SUPERUSER_PASSWORD}")
                logger.info(f"Full Name: {SUPERUSER_FULL_NAME}")
                logger.info(f"Is Superuser: True")
                logger.info(f"User ID: {new_user.id}")
                logger.info("=" * 80)
                logger.info("This account has FULL ACCESS FOREVER.")
                logger.info("=" * 80)

        except Exception as e:
            await db_session.rollback()
            logger.error(f"Failed to setup superuser: {e}")
            raise


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("SETTING UP TOMMY SUPERUSER ACCOUNT")
    print("=" * 80)
    print(f"Email: {SUPERUSER_EMAIL}")
    print(f"Password: {SUPERUSER_PASSWORD}")
    print(f"This account will have FULL ACCESS FOREVER.")
    print("=" * 80 + "\n")

    asyncio.run(setup_tommy_superuser())
