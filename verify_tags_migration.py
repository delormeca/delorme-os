"""Verify tags column and GIN index were created successfully."""
import asyncio
from sqlalchemy import text
from app.db import AsyncSessionLocal


async def verify_migration():
    """Check if tags column and index exist."""
    async with AsyncSessionLocal() as db:
        # Check column
        result = await db.execute(
            text(
                "SELECT column_name, data_type, is_nullable "
                "FROM information_schema.columns "
                "WHERE table_name='client_page' AND column_name='tags'"
            )
        )
        column = result.fetchone()
        print(f"Tags Column: {column}")

        # Check index
        result = await db.execute(
            text(
                "SELECT indexname, indexdef "
                "FROM pg_indexes "
                "WHERE tablename='client_page' AND indexname='ix_client_page_tags_gin'"
            )
        )
        index = result.fetchone()
        print(f"GIN Index: {index}")

        if column and index:
            print("\n✅ Migration verified successfully!")
            print(f"   - Column: {column[0]} ({column[1]}, nullable={column[2]})")
            print(f"   - Index: {index[0]} (GIN index)")
        else:
            print("\n❌ Migration verification failed")
            if not column:
                print("   - Tags column not found")
            if not index:
                print("   - GIN index not found")


if __name__ == "__main__":
    asyncio.run(verify_migration())
