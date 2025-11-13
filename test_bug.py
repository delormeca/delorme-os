"""Test script to identify the 500 error root cause"""
import asyncio
from app.services.client_page_service import ClientPageService
from app.schemas.client_page import ClientPageSearchParams
from app.db import get_async_db_session
import uuid

async def test():
    """Test the exact code path that's failing"""
    client_id = uuid.UUID('1b93caae-45f7-42aa-a369-17fb964f659e')

    async for db in get_async_db_session():
        try:
            print(f"Testing ClientPageService.list_pages for client {client_id}")

            service = ClientPageService(db)
            params = ClientPageSearchParams(
                client_id=client_id,
                page=1,
                page_size=50,
                sort_by="created_at",
                sort_order="desc"
            )

            print("Calling list_pages...")
            result = await service.list_pages(params)

            print(f"SUCCESS! Retrieved {len(result.pages)} pages")
            print(f"Total: {result.total}")
            if result.pages:
                print(f"First page URL: {result.pages[0].url}")

        except Exception as e:
            print(f"FAILED: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
        break

asyncio.run(test())
