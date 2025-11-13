"""
Background tasks for page crawling and data extraction using APScheduler.
"""
import asyncio
import logging
import uuid
import time
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.page_crawl_service import PageCrawlService
from app.services.crawl4ai_service import Crawl4AIService
from app.models import Client, ClientPage, CrawlRun
from app.config.base import config

logger = logging.getLogger(__name__)


# Global scheduler instance
page_crawl_scheduler: Optional[AsyncIOScheduler] = None


def get_page_crawl_scheduler() -> AsyncIOScheduler:
    """
    Get or create the global page crawl scheduler instance.

    Returns:
        The AsyncIOScheduler instance
    """
    global page_crawl_scheduler

    if page_crawl_scheduler is None:
        # CRITICAL: On Windows, ensure APScheduler uses ProactorEventLoop for subprocess support
        import sys
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
            logger.info("✅ Set WindowsProactorEventLoopPolicy for APScheduler")

        page_crawl_scheduler = AsyncIOScheduler()
        page_crawl_scheduler.start()
        logger.info("✅ Page crawl scheduler started")

    return page_crawl_scheduler


async def run_page_crawl_task(
    client_id: str,
    run_type: str = "full",
    selected_page_ids: Optional[list] = None,
    crawl_run_id: Optional[str] = None,
) -> None:
    """
    Background task to run a complete page crawl with data extraction.

    Args:
        client_id: The client ID to crawl (as string)
        run_type: Type of run ('full', 'selective', 'manual')
        selected_page_ids: Optional list of specific page IDs to crawl (as strings)
        crawl_run_id: Optional existing CrawlRun ID (if already created)
    """
    import sys

    # CRITICAL: APScheduler jobs run in their own async context
    # On Windows, we MUST ensure the running loop supports subprocesses (for Playwright)
    if sys.platform == 'win32':
        try:
            # Get the currently running loop
            loop = asyncio.get_running_loop()

            # Check if it's a ProactorEventLoop
            if not isinstance(loop, asyncio.ProactorEventLoop):
                # If not, we're stuck - we can't replace a running loop
                logger.error("❌ Current event loop is not ProactorEventLoop - Playwright will fail!")
                logger.error(f"   Loop type: {type(loop).__name__}")
                logger.error("   This should have been set in start.py before uvicorn started")
            else:
                logger.info("✅ Confirmed ProactorEventLoop is active in background task")
        except RuntimeError:
            # No event loop running - this shouldn't happen in APScheduler jobs
            logger.warning("⚠️  No event loop running in background task")

    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

    logger.info(f"🚀 Starting {run_type} page crawl for client {client_id}")

    # Create async engine and session
    engine = create_async_engine(config.database_url, echo=False)
    async_session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session_factory() as session:
        try:
            client_uuid = uuid.UUID(client_id)
            selected_uuids = (
                [uuid.UUID(pid) for pid in selected_page_ids]
                if selected_page_ids
                else None
            )

            page_crawl_service = PageCrawlService(session)

            # Get or create crawl run
            if crawl_run_id:
                # Use existing CrawlRun
                crawl_run = await session.get(CrawlRun, uuid.UUID(crawl_run_id))
                if not crawl_run:
                    logger.error(f"❌ CrawlRun {crawl_run_id} not found")
                    return
                logger.info(f"📋 Using existing crawl run {crawl_run.id}")
            else:
                # Create new crawl run (backward compatibility)
                crawl_run = await page_crawl_service.start_crawl_run(
                    client_id=client_uuid,
                    run_type=run_type,
                    selected_pages=selected_uuids,
                )
                logger.info(
                    f"📋 Crawl run {crawl_run.id} started with {crawl_run.total_pages} pages"
                )

            # Update status
            crawl_run.status = "in_progress"
            await session.commit()

            # Get pages to crawl
            if selected_uuids:
                query = select(ClientPage).where(
                    ClientPage.client_id == client_uuid,
                    ClientPage.id.in_(selected_uuids),
                )
            else:
                query = select(ClientPage).where(ClientPage.client_id == client_uuid)

            result = await session.execute(query)
            pages_to_crawl = result.scalars().all()

            # Initialize Crawl4AI
            logger.info("🕷️  Initializing Crawl4AI browser...")
            async with Crawl4AIService() as crawler:
                logger.info("✅ Crawl4AI browser ready")

                start_time = time.time()
                successful_count = 0
                failed_count = 0

                # Crawl each page
                for index, page in enumerate(pages_to_crawl, start=1):
                    logger.info(f"📄 Crawling page {index}/{len(pages_to_crawl)}: {page.url}")

                    # Update progress percentage
                    progress = int((index / len(pages_to_crawl)) * 100)
                    await page_crawl_service.update_progress(
                        crawl_run,
                        current_page_url=page.url,
                        status_message=f"Crawling page {index}/{len(pages_to_crawl)}",
                        progress_percentage=progress,
                    )

                    # Crawl and extract page
                    success = await page_crawl_service.crawl_and_extract_page(
                        page, crawl_run, crawler
                    )

                    if success:
                        successful_count += 1
                    else:
                        failed_count += 1

                    # Update counts
                    crawl_run.successful_pages = successful_count
                    crawl_run.failed_pages = failed_count
                    await session.commit()

                    # Rate limiting delay
                    if index < len(pages_to_crawl):  # Don't delay after last page
                        logger.debug(f"⏱️  Rate limit delay: {config.crawl_rate_limit_delay}s")
                        await asyncio.sleep(config.crawl_rate_limit_delay)

                # Calculate performance metrics
                total_time = time.time() - start_time
                avg_time_per_page = total_time / len(pages_to_crawl) if pages_to_crawl else 0
                pages_per_minute = (len(pages_to_crawl) / total_time * 60) if total_time > 0 else 0

                performance_metrics = {
                    "total_time_seconds": round(total_time, 2),
                    "avg_time_per_page": round(avg_time_per_page, 2),
                    "pages_per_minute": round(pages_per_minute, 2),
                    "total_pages_crawled": len(pages_to_crawl),
                }

                # Complete the crawl run
                await page_crawl_service.complete_crawl_run(crawl_run, performance_metrics)

                logger.info(
                    f"✅ Page crawl completed for client {client_id}. "
                    f"Successful: {successful_count}/{len(pages_to_crawl)}. "
                    f"Time: {total_time:.2f}s. "
                    f"Run ID: {crawl_run.id}"
                )

        except Exception as e:
            # Use print for debugging Windows encoding issues
            print(f"\\n\\n=== CRAWL ERROR ===")
            print(f"Error type: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            import traceback
            print(f"Traceback:\\n{traceback.format_exc()}")
            print(f"===================\\n\\n")

            logger.error(
                f"❌ Error running page crawl for client {client_id}: {e}",
                exc_info=True,
            )

            # Try to mark crawl run as failed
            try:
                if "crawl_run" in locals():
                    await page_crawl_service.fail_crawl_run(
                        crawl_run, f"Fatal error: {str(e)}"
                    )
            except Exception as nested_error:
                logger.error(f"Failed to mark crawl run as failed: {nested_error}")

        finally:
            await engine.dispose()


def schedule_page_crawl(
    client_id: uuid.UUID,
    run_type: str = "full",
    selected_page_ids: Optional[list[uuid.UUID]] = None,
    crawl_run_id: Optional[uuid.UUID] = None,
) -> str:
    """
    Schedule a page crawl job to run in the background immediately.

    Args:
        client_id: The client ID to crawl
        run_type: Type of run ('full', 'selective', 'manual')
        selected_page_ids: Optional list of specific page IDs to crawl
        crawl_run_id: Optional existing CrawlRun ID

    Returns:
        The job ID from APScheduler
    """
    scheduler_instance = get_page_crawl_scheduler()

    # Convert UUIDs to strings for task args
    page_ids_str = (
        [str(pid) for pid in selected_page_ids] if selected_page_ids else None
    )
    crawl_run_id_str = str(crawl_run_id) if crawl_run_id else None

    # Schedule the job to run immediately
    job = scheduler_instance.add_job(
        run_page_crawl_task,
        trigger=DateTrigger(),
        args=[str(client_id), run_type, page_ids_str, crawl_run_id_str],
        id=f"page_crawl_{client_id}_{run_type}",
        replace_existing=True,
    )

    logger.info(f"📅 Scheduled page crawl job: {job.id}")
    return job.id


def get_page_crawl_jobs() -> list:
    """
    Get all scheduled page crawl jobs.

    Returns:
        List of scheduled jobs
    """
    scheduler_instance = get_page_crawl_scheduler()
    return scheduler_instance.get_jobs()


def cancel_page_crawl_job(job_id: str) -> bool:
    """
    Cancel a scheduled page crawl job.

    Args:
        job_id: The job ID to cancel

    Returns:
        True if job was cancelled, False otherwise
    """
    scheduler_instance = get_page_crawl_scheduler()

    try:
        scheduler_instance.remove_job(job_id)
        logger.info(f"🛑 Cancelled page crawl job: {job_id}")
        return True
    except Exception as e:
        logger.warning(f"Failed to cancel job {job_id}: {e}")
        return False


def shutdown_page_crawl_scheduler() -> None:
    """
    Shutdown the page crawl scheduler gracefully.
    """
    global page_crawl_scheduler

    if page_crawl_scheduler is not None:
        page_crawl_scheduler.shutdown()
        page_crawl_scheduler = None
        logger.info("🛑 Page crawl scheduler shutdown")
