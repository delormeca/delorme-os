"""Test script to identify the 500 error root cause"""
import asyncio
import sys
from contextlib import asynccontextmanager
from app.db import get_async_db_session
from app.models import ClientPage
from sqlmodel import select, func
from app.schemas.client_page import ClientPageRead

async def test_serialization():
    """Test if ClientPage can be serialized to ClientPageRead"""
    try:
        db = await anext(get_async_db_session())
        try:
            # Count pages
            count_result = await db.execute(
                select(func.count()).where(
                    ClientPage.client_id == '1b93caae-45f7-42aa-a369-17fb964f659e'
                )
            )
            count = count_result.scalar_one()
            print(f'✅ Total pages in DB: {count}')

            # Get one page
            result = await db.execute(
                select(ClientPage).where(
                    ClientPage.client_id == '1b93caae-45f7-42aa-a369-17fb964f659e'
                ).limit(1)
            )
            page = result.scalar_one_or_none()

            if not page:
                print('❌ No pages found')
                return

            print(f'\n📄 Sample page found:')
            print(f'   URL: {page.url}')
            print(f'   Status code: {page.status_code}')
            print(f'   Page title: {page.page_title}')
            print(f'   Has internal_links: {page.internal_links is not None}')
            print(f'   internal_links type: {type(page.internal_links).__name__}')

            # Try to serialize
            print(f'\n🔄 Attempting serialization to ClientPageRead...')
            try:
                read_model = ClientPageRead.model_validate(page)
                print(f'✅ Serialization SUCCESS!')
                print(f'   Serialized URL: {read_model.url}')
                return True

            except Exception as e:
                print(f'\n❌ Serialization FAILED!')
                print(f'   Error type: {type(e).__name__}')
                print(f'   Error message: {str(e)}')
                print(f'\n📋 Stack trace:')
                import traceback
                traceback.print_exc()
                return False
        finally:
            await db.close()

    except Exception as e:
        print(f'\n❌ Database query failed!')
        print(f'   Error: {type(e).__name__}: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_serialization())
    sys.exit(0 if success else 1)
