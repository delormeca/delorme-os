"""Manually run a crawl without APScheduler to test extraction."""
import asyncio
import uuid
from app.db import get_async_db_session
from app.services.page_crawl_service import PageCrawlService
from app.services.crawl4ai_service import Crawl4AIService
from app.models import CrawlRun, ClientPage
from sqlmodel import select

async def manual_crawl():
    """Manually run a crawl for MCA Resources client."""
    client_id = uuid.UUID("1b93caae-45f7-42aa-a369-17fb964f659e")

    print(f"\nManual Crawl for client {client_id}\n")
    print("=" * 80)

    async for db in get_async_db_session():
        try:
            # Create crawl service
            crawl_service = PageCrawlService(db)

            # Get all pages for this client
            statement = select(ClientPage).where(ClientPage.client_id == client_id)
            result = await db.execute(statement)
            pages = result.scalars().all()

            # Extract URLs before committing (avoid detached instance issues)
            page_data = [(page.id, page.url) for page in pages]

            print(f"Found {len(page_data)} pages to crawl")
            print()

            # Create a new crawl run
            crawl_run = CrawlRun(
                client_id=client_id,
                run_type="manual",
                status="in_progress",
                total_pages=len(page_data),
                successful_pages=0,
                failed_pages=0,
                progress_percentage=0,
            )
            db.add(crawl_run)
            await db.commit()
            await db.refresh(crawl_run)

            print(f"Created crawl run: {crawl_run.id}")
            print()

            # Initialize Crawl4AI
            print("Initializing Crawl4AI...")
            async with Crawl4AIService() as crawler:
                print("Crawl4AI ready")
                print()

                successful = 0
                failed = 0

                # Crawl each page
                for i, (page_id, page_url) in enumerate(page_data, 1):
                    print(f"[{i}/{len(page_data)}] Crawling: {page_url}")

                    # Fetch page from database
                    page = await db.get(ClientPage, page_id)
                    if not page:
                        print(f"  ✗ Page not found")
                        failed += 1
                        continue

                    success = await crawl_service.crawl_and_extract_page(
                        page, crawl_run, crawler
                    )

                    if success:
                        successful += 1
                        print(f"  ✓ Success")
                    else:
                        failed += 1
                        print(f"  ✗ Failed")

                    # Update counts
                    crawl_run.successful_pages = successful
                    crawl_run.failed_pages = failed
                    crawl_run.progress_percentage = int((i / len(page_data)) * 100)
                    await db.commit()

                    print()

                # Complete the crawl
                crawl_run.status = "completed"
                await db.commit()

                print("=" * 80)
                print(f"Crawl completed!")
                print(f"  Successful: {successful}/{len(page_data)}")
                print(f"  Failed: {failed}/{len(page_data)}")
                print(f"  Crawl Run ID: {crawl_run.id}")
                print()

        except Exception as e:
            print(f"\nERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
        break

if __name__ == "__main__":
    asyncio.run(manual_crawl())
