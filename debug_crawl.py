"""
Debug script to manually trigger a crawl and see what happens.
"""
import asyncio
import sys
import uuid

# CRITICAL: Set event loop policy BEFORE any async operations
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    print("[OK] Set WindowsProactorEventLoopPolicy")

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config.base import config
from app.tasks.page_crawl_tasks import run_page_crawl_task

async def main():
    """Run a test crawl for the stuck crawl run."""

    # The stuck crawl run from Playwright testing
    crawl_run_id = "4bfc6926-dd19-4d5b-8102-8a802fd27df7"
    client_id = "1b93caae-45f7-42aa-a369-17fb964f659e"

    print(f"\n{'='*60}")
    print(f"DEBUG: Manual Crawl Trigger Test")
    print(f"{'='*60}\n")
    print(f"Crawl Run ID: {crawl_run_id}")
    print(f"Client ID: {client_id}")
    print()

    # Connect to database to check crawl run state
    engine = create_async_engine(config.get_database_url(), echo=False)
    async_session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session_factory() as session:
        from app.models import CrawlRun

        crawl_run = await session.get(CrawlRun, uuid.UUID(crawl_run_id))

        if not crawl_run:
            print(f"[ERROR] Crawl run {crawl_run_id} not found in database!")
            return

        print(f"Crawl Run State:")
        print(f"  Status: {crawl_run.status}")
        print(f"  Progress: {crawl_run.progress_percentage}%")
        print(f"  Total Pages: {crawl_run.total_pages}")
        print(f"  Successful: {crawl_run.successful_pages}")
        print(f"  Failed: {crawl_run.failed_pages}")
        print(f"  Started At: {crawl_run.started_at}")
        print(f"  Completed At: {crawl_run.completed_at}")
        print()

    await engine.dispose()

    # Now try to run the crawl task directly
    print("[START] Attempting to run crawl task directly...")
    print()

    try:
        await run_page_crawl_task(
            client_id=client_id,
            run_type="full",
            selected_page_ids=None,
            crawl_run_id=crawl_run_id,
        )

        print()
        print("[SUCCESS] Crawl task completed successfully!")

    except Exception as e:
        print()
        print(f"[ERROR] ERROR during crawl task:")
        print(f"   Type: {type(e).__name__}")
        print(f"   Message: {str(e)}")
        print()
        import traceback
        print("Full traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
