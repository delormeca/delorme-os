"""Simple direct extraction for all pages."""
import asyncio
import uuid
from app.db import get_async_db_session
from app.services.page_extraction_service import PageExtractionService
from app.models import ClientPage
from sqlmodel import select

async def simple_extraction():
    """Extract meta tags for all pages."""
    client_id = uuid.UUID("1b93caae-45f7-42aa-a369-17fb964f659e")

    print(f"\nSimple Extraction for client {client_id}\n")
    print("=" * 80)

    async for db in get_async_db_session():
        try:
            # Get all pages
            statement = select(ClientPage).where(ClientPage.client_id == client_id)
            result = await db.execute(statement)
            pages = result.scalars().all()

            # Extract all IDs and URLs upfront to avoid detached instance issues
            page_data = [(page.id, page.url) for page in pages]

            print(f"Found {len(page_data)} pages")
            print()

            extraction_service = PageExtractionService(db)

            successful = 0
            failed = 0

            for i, (page_id, url) in enumerate(page_data, 1):

                print(f"[{i}/{len(page_data)}] Extracting: {url}")

                try:
                    # Extract data
                    extraction_result = await extraction_service.extract_page_data(url)

                    if not extraction_result.get('success'):
                        print(f"  FAILED: {extraction_result.get('error_message')}")
                        failed += 1
                        continue

                    # Re-fetch page from database to avoid detached instance issues
                    page_obj = await db.get(ClientPage, page_id)
                    if not page_obj:
                        print(f"  FAILED: Page not found in database")
                        failed += 1
                        continue

                    # Update fields
                    page_title = extraction_result.get('page_title')
                    page_obj.page_title = page_title
                    page_obj.meta_title = extraction_result.get('meta_title')
                    page_obj.meta_description = extraction_result.get('meta_description')
                    page_obj.h1 = extraction_result.get('h1')
                    page_obj.word_count = extraction_result.get('word_count')
                    page_obj.canonical_url = extraction_result.get('canonical_url')
                    page_obj.meta_robots = extraction_result.get('meta_robots')

                    await db.commit()

                    print(f"  SUCCESS - Page Title: {page_title}")
                    successful += 1

                except Exception as e:
                    print(f"  FAILED - Error: {type(e).__name__}: {e}")
                    failed += 1
                    await db.rollback()

                print()

            print("=" * 80)
            print(f"Extraction completed!")
            print(f"  Successful: {successful}/{len(page_data)}")
            print(f"  Failed: {failed}/{len(page_data)}")
            print()

        except Exception as e:
            print(f"\nERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
        break

if __name__ == "__main__":
    asyncio.run(simple_extraction())
