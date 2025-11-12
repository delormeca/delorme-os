"""
Background tasks for crawling jobs using APScheduler.
"""
import asyncio
import logging
import uuid
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.page_crawl_service import PageCrawlService

logger = logging.getLogger(__name__)


# Global scheduler instance
scheduler: Optional[AsyncIOScheduler] = None


def get_scheduler() -> AsyncIOScheduler:
    """
    Get or create the global scheduler instance.

    Returns:
        The AsyncIOScheduler instance
    """
    global scheduler

    if scheduler is None:
        scheduler = AsyncIOScheduler()
        scheduler.start()

    return scheduler


async def run_crawl_job_task(project_id: str) -> None:
    """
    Background task to run a complete crawl job.

    Args:
        project_id: The project ID to crawl (as string)
    """
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from app.config.base import config

    logger.info(f"🚀 Starting crawl job for project {project_id}")

    # Create async engine and session directly (not using FastAPI dependency)
    engine = create_async_engine(config.database_url, echo=False)
    async_session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session_factory() as session:
        try:
            crawling_service = PageCrawlService(session)

            # Convert project_id string to UUID
            project_uuid = uuid.UUID(project_id)

            # Run ONLY discovery (Smart Crawl = just find URLs from sitemap)
            crawl_job = await crawling_service.run_discovery_only(project_uuid)

            logger.info(
                f"✅ Smart Crawl completed for project {project_id}. "
                f"Found {crawl_job.urls_discovered} pages from sitemap. "
                f"Job ID: {crawl_job.id}, Status: {crawl_job.status}"
            )

        except Exception as e:
            logger.error(f"❌ Error running smart crawl for project {project_id}: {e}", exc_info=True)
        finally:
            await engine.dispose()


def schedule_crawl_job(project_id: uuid.UUID) -> str:
    """
    Schedule a crawl job to run in the background immediately.

    Args:
        project_id: The project ID to crawl

    Returns:
        The job ID from APScheduler
    """
    scheduler_instance = get_scheduler()

    # Schedule the job to run immediately
    job = scheduler_instance.add_job(
        run_crawl_job_task,
        trigger=DateTrigger(),
        args=[str(project_id)],
        id=f"crawl_job_{project_id}",
        replace_existing=True,
    )

    return job.id


def get_scheduled_jobs() -> list:
    """
    Get all scheduled jobs.

    Returns:
        List of scheduled jobs
    """
    scheduler_instance = get_scheduler()
    return scheduler_instance.get_jobs()


def cancel_crawl_job(job_id: str) -> bool:
    """
    Cancel a scheduled crawl job.

    Args:
        job_id: The job ID to cancel

    Returns:
        True if job was cancelled, False otherwise
    """
    scheduler_instance = get_scheduler()

    try:
        scheduler_instance.remove_job(job_id)
        return True
    except Exception:
        return False


def shutdown_scheduler() -> None:
    """
    Shutdown the scheduler gracefully.
    """
    global scheduler

    if scheduler is not None:
        scheduler.shutdown()
        scheduler = None
