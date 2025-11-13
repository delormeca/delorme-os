"""Test single page extraction and database storage."""
import asyncio
import uuid
from app.db import get_async_db_session
from app.services.page_extraction_service import PageExtractionService
from sqlmodel import select
from app.models import ClientPage

async def test_extraction_and_storage():
    """Test extracting and storing data for a single page."""
    test_url = "https://mcaressources.ca/"
    client_id = uuid.UUID("1b93caae-45f7-42aa-a369-17fb964f659e")

    print(f"\nTest: Extract and store data for {test_url}\n")
    print("=" * 80)

    async for db in get_async_db_session():
        try:
            # Find the page in database
            statement = select(ClientPage).where(
                ClientPage.client_id == client_id,
                ClientPage.url == test_url
            )
            result = await db.execute(statement)
            page = result.scalar_one_or_none()

            if not page:
                print(f"ERROR: Page {test_url} not found in database")
                break

            print(f"Found page in database:")
            print(f"  ID: {page.id}")
            print(f"  URL: {page.url}")
            print(f"  Current Page Title: {page.page_title}")
            print(f"  Current Meta Description: {page.meta_description}")
            print()

            # Extract data
            print("Extracting data...")
            extraction_service = PageExtractionService(db)
            extraction_result = await extraction_service.extract_page_data(test_url)

            if not extraction_result.get('success'):
                print(f"ERROR: Extraction failed: {extraction_result.get('error_message')}")
                break

            print("\nExtraction successful!")
            print(f"  Page Title: {extraction_result.get('page_title')}")
            print(f"  Meta Title: {extraction_result.get('meta_title')}")
            print(f"  Meta Description: {extraction_result.get('meta_description')[:100]}...")
            print()

            # Update page
            print("Updating page in database...")
            page.page_title = extraction_result.get('page_title')
            page.meta_title = extraction_result.get('meta_title')
            page.meta_description = extraction_result.get('meta_description')
            page.h1 = extraction_result.get('h1')
            page.word_count = extraction_result.get('word_count')

            await db.commit()
            await db.refresh(page)

            print("\nDatabase updated!")
            print(f"  Page Title: {page.page_title}")
            print(f"  Meta Title: {page.meta_title}")
            print(f"  Meta Description: {page.meta_description[:100] if page.meta_description else 'None'}...")
            print()

            # Verify by reading back
            statement = select(ClientPage).where(ClientPage.id == page.id)
            result = await db.execute(statement)
            verified_page = result.scalar_one()

            print("Verification (read from DB again):")
            print(f"  Page Title: {verified_page.page_title}")
            print(f"  Meta Title: {verified_page.meta_title}")
            print(f"  Meta Description: {verified_page.meta_description[:100] if verified_page.meta_description else 'None'}...")
            print()

            if verified_page.page_title and verified_page.meta_description:
                print("SUCCESS: Meta tags extracted and stored correctly!")
            else:
                print("WARNING: Some fields are still None")

        except Exception as e:
            print(f"\nERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
        break

if __name__ == "__main__":
    asyncio.run(test_extraction_and_storage())
