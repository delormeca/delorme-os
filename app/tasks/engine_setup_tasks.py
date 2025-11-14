"""
Background tasks for engine setup jobs using APScheduler.
"""
import asyncio
import logging
import uuid
from typing import Optional, List

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.engine_setup_service import EngineSetupService

logger = logging.getLogger(__name__)


async def run_sitemap_setup_task(run_id: str, sitemap_url: str) -> None:
    """
    Background task to run sitemap-based engine setup.

    Args:
        run_id: The setup run ID (as string)
        sitemap_url: URL of sitemap to parse
    """
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from app.config.base import config

    logger.info(f"🚀 Starting sitemap setup task for run {run_id}: {sitemap_url}")

    # Create async engine and session directly (not using FastAPI dependency)
    engine = create_async_engine(config.get_database_url(), echo=False)
    async_session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session_factory() as session:
        try:
            engine_setup_service = EngineSetupService(session)

            # Convert run_id string to UUID
            run_uuid = uuid.UUID(run_id)

            # Execute sitemap setup
            await engine_setup_service.execute_sitemap_setup(run_uuid, sitemap_url)

            logger.info(f"✅ Sitemap setup completed for run {run_id}")

        except Exception as e:
            logger.error(f"❌ Error running sitemap setup for run {run_id}: {e}", exc_info=True)
        finally:
            await engine.dispose()


async def run_manual_setup_task(run_id: str, manual_urls_str: str) -> None:
    """
    Background task to run manual URL import setup.

    Args:
        run_id: The setup run ID (as string)
        manual_urls_str: Comma-separated list of URLs
    """
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from app.config.base import config

    logger.info(f"🚀 Starting manual setup task for run {run_id}")

    # Create async engine and session directly (not using FastAPI dependency)
    engine = create_async_engine(config.get_database_url(), echo=False)
    async_session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session_factory() as session:
        try:
            engine_setup_service = EngineSetupService(session)

            # Convert run_id string to UUID
            run_uuid = uuid.UUID(run_id)

            # Parse URLs from comma-separated string
            manual_urls = [url.strip() for url in manual_urls_str.split(",") if url.strip()]

            # Execute manual setup
            await engine_setup_service.execute_manual_setup(run_uuid, manual_urls)

            logger.info(f"✅ Manual setup completed for run {run_id}")

        except Exception as e:
            logger.error(f"❌ Error running manual setup for run {run_id}: {e}", exc_info=True)
        finally:
            await engine.dispose()


def schedule_sitemap_setup(run_id: uuid.UUID, sitemap_url: str) -> str:
    """
    Schedule a sitemap setup job to run in the background immediately.

    Args:
        run_id: The setup run ID
        sitemap_url: URL of sitemap to parse

    Returns:
        The job ID from APScheduler
    """
    from app.tasks.crawl_tasks import get_scheduler

    scheduler_instance = get_scheduler()

    # Schedule the job to run immediately
    job = scheduler_instance.add_job(
        run_sitemap_setup_task,
        trigger=DateTrigger(),
        args=[str(run_id), sitemap_url],
        id=f"sitemap_setup_{run_id}",
        replace_existing=True,
    )

    logger.info(f"📅 Scheduled sitemap setup job {job.id} for run {run_id}")

    return job.id


def schedule_manual_setup(run_id: uuid.UUID, manual_urls: List[str]) -> str:
    """
    Schedule a manual URL import setup job to run in the background immediately.

    Args:
        run_id: The setup run ID
        manual_urls: List of URLs to import

    Returns:
        The job ID from APScheduler
    """
    from app.tasks.crawl_tasks import get_scheduler

    scheduler_instance = get_scheduler()

    # Convert list to comma-separated string for passing to background task
    manual_urls_str = ",".join(manual_urls)

    # Schedule the job to run immediately
    job = scheduler_instance.add_job(
        run_manual_setup_task,
        trigger=DateTrigger(),
        args=[str(run_id), manual_urls_str],
        id=f"manual_setup_{run_id}",
        replace_existing=True,
    )

    logger.info(f"📅 Scheduled manual setup job {job.id} for run {run_id}")

    return job.id


def cancel_setup_job(run_id: uuid.UUID, setup_type: str) -> bool:
    """
    Cancel a scheduled setup job.

    Args:
        run_id: The run ID
        setup_type: 'sitemap' or 'manual'

    Returns:
        True if job was cancelled, False otherwise
    """
    from app.tasks.crawl_tasks import get_scheduler

    scheduler_instance = get_scheduler()
    job_id = f"{setup_type}_setup_{run_id}"

    try:
        scheduler_instance.remove_job(job_id)
        logger.info(f"🛑 Cancelled setup job {job_id}")
        return True
    except Exception as e:
        logger.warning(f"Failed to cancel job {job_id}: {e}")
        return False


def get_setup_job_status(run_id: uuid.UUID, setup_type: str) -> Optional[dict]:
    """
    Get status of a scheduled setup job.

    Args:
        run_id: The run ID
        setup_type: 'sitemap' or 'manual'

    Returns:
        Job details if found, None otherwise
    """
    from app.tasks.crawl_tasks import get_scheduler

    scheduler_instance = get_scheduler()
    job_id = f"{setup_type}_setup_{run_id}"

    try:
        job = scheduler_instance.get_job(job_id)
        if job:
            return {
                "job_id": job.id,
                "next_run_time": job.next_run_time,
                "pending": job.pending
            }
    except Exception as e:
        logger.warning(f"Failed to get job {job_id}: {e}")

    return None
