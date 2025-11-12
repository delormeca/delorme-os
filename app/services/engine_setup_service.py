"""
Engine Setup service for orchestrating page discovery and setup workflows.
"""
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
import datetime
import logging

from app.models import EngineSetupRun, Client, ClientPage
from app.schemas.engine_setup import (
    EngineSetupRequest,
    EngineSetupRunRead,
    EngineSetupProgressResponse,
    EngineSetupStartResponse,
    EngineSetupStatsResponse
)
from app.services.robust_sitemap_parser import RobustSitemapParserService, SitemapParseError, SitemapParseResult
from app.utils.url_validator import URLValidator, URLValidationError
from app.services.client_page_service import ClientPageService
from app.core.exceptions import NotFoundException, ValidationException

logger = logging.getLogger(__name__)


class EngineSetupService:
    """Service for engine setup operations."""

    def __init__(self, db: AsyncSession):
        """
        Initialize service.

        Args:
            db: Database session
        """
        self.db = db
        self.sitemap_parser = RobustSitemapParserService()
        self.url_validator = URLValidator()
        self.page_service = ClientPageService(db)

    async def start_setup(
        self,
        setup_request: EngineSetupRequest
    ) -> EngineSetupStartResponse:
        """
        Start an engine setup run.

        Args:
            setup_request: Setup request data

        Returns:
            Setup start response with run ID

        Raises:
            ValidationException: If validation fails
        """
        # Verify client exists and get client name
        result = await self.db.execute(select(Client).where(Client.id == setup_request.client_id))
        client = result.scalar_one_or_none()
        if not client:
            raise NotFoundException(f"Client {setup_request.client_id} not found")

        # Store client name before transaction completes
        client_name = client.name

        # Create setup run
        setup_run = EngineSetupRun(
            client_id=setup_request.client_id,
            setup_type=setup_request.setup_type,
            status="pending",
            total_pages=0,
            successful_pages=0,
            failed_pages=0,
            skipped_pages=0,
            progress_percentage=0,
            created_at=datetime.datetime.utcnow()
        )

        self.db.add(setup_run)
        await self.db.commit()
        await self.db.refresh(setup_run)

        logger.info(
            f"Created engine setup run {setup_run.id} for client {setup_request.client_id} "
            f"(type: {setup_request.setup_type})"
        )

        return EngineSetupStartResponse(
            run_id=setup_run.id,
            message=f"Engine setup started for client {client_name}",
            status="pending"
        )

    async def execute_sitemap_setup(
        self,
        run_id: uuid.UUID,
        sitemap_url: str
    ) -> None:
        """
        Execute sitemap-based setup (called by background task).

        Args:
            run_id: Setup run ID
            sitemap_url: URL of sitemap to parse

        Raises:
            NotFoundException: If run not found
            ValidationException: If setup fails
        """
        # Get setup run
        setup_run = await self.db.get(EngineSetupRun, run_id)
        if not setup_run:
            raise NotFoundException(f"Setup run {run_id} not found")

        try:
            # Update status to in_progress
            setup_run.status = "in_progress"
            setup_run.started_at = datetime.datetime.utcnow()
            await self.db.commit()

            logger.info(f"Starting sitemap parsing for run {run_id}: {sitemap_url}")

            # Parse sitemap
            result = await self.sitemap_parser.parse_sitemap(sitemap_url)
            if not result.success:
                raise SitemapParseError(
                    error_type=result.error_type,
                    message=result.error_message,
                    url=sitemap_url,
                    http_status=None,
                    suggestion=result.suggestion
                )
            urls = result.urls
            logger.info(f"Found {len(urls)} URLs in sitemap")

            setup_run.total_pages = len(urls)
            await self.db.commit()

            # Validate and normalize URLs
            valid_urls = []
            for url in urls:
                try:
                    normalized_url = self.url_validator.validate_and_normalize(url)
                    valid_urls.append(normalized_url)
                except URLValidationError as e:
                    logger.warning(f"Invalid URL skipped: {url} - {str(e)}")
                    setup_run.failed_pages += 1

            logger.info(f"Validated {len(valid_urls)} URLs out of {len(urls)}")

            # Import pages in bulk
            await self._import_pages_bulk(setup_run, valid_urls)

            # Mark as completed
            setup_run.status = "completed"
            setup_run.completed_at = datetime.datetime.utcnow()
            setup_run.progress_percentage = 100
            setup_run.current_url = None

            # Update client engine_setup_completed and page_count
            client = await self.db.get(Client, setup_run.client_id)
            if client:
                client.engine_setup_completed = True
                client.last_setup_run_id = setup_run.id
                client.page_count = setup_run.successful_pages

            await self.db.commit()

            logger.info(
                f"Completed setup run {run_id}: "
                f"{setup_run.successful_pages} successful, "
                f"{setup_run.skipped_pages} skipped, "
                f"{setup_run.failed_pages} failed"
            )

        except SitemapParseError as e:
            await self._mark_run_failed(setup_run, f"Sitemap parsing error: {str(e)}")
            logger.error(f"Sitemap parsing failed for run {run_id}: {str(e)}")
            raise

        except Exception as e:
            await self._mark_run_failed(setup_run, f"Unexpected error: {str(e)}")
            logger.error(f"Setup run {run_id} failed with error: {str(e)}", exc_info=True)
            raise

    async def execute_manual_setup(
        self,
        run_id: uuid.UUID,
        manual_urls: List[str]
    ) -> None:
        """
        Execute manual URL import setup (called by background task).

        Args:
            run_id: Setup run ID
            manual_urls: List of manually entered URLs

        Raises:
            NotFoundException: If run not found
        """
        # Get setup run
        setup_run = await self.db.get(EngineSetupRun, run_id)
        if not setup_run:
            raise NotFoundException(f"Setup run {run_id} not found")

        try:
            # Update status to in_progress
            setup_run.status = "in_progress"
            setup_run.started_at = datetime.datetime.utcnow()
            setup_run.total_pages = len(manual_urls)
            await self.db.commit()

            logger.info(f"Starting manual URL import for run {run_id}: {len(manual_urls)} URLs")

            # Validate and normalize URLs
            valid_urls = self.url_validator.validate_batch(manual_urls, skip_invalid=True)
            logger.info(f"Validated {len(valid_urls)} URLs out of {len(manual_urls)}")

            setup_run.failed_pages = len(manual_urls) - len(valid_urls)
            await self.db.commit()

            # Import pages in bulk
            await self._import_pages_bulk(setup_run, valid_urls)

            # Mark as completed
            setup_run.status = "completed"
            setup_run.completed_at = datetime.datetime.utcnow()
            setup_run.progress_percentage = 100
            setup_run.current_url = None

            # Update client engine_setup_completed and page_count
            client = await self.db.get(Client, setup_run.client_id)
            if client:
                client.engine_setup_completed = True
                client.last_setup_run_id = setup_run.id
                client.page_count = setup_run.successful_pages

            await self.db.commit()

            logger.info(
                f"Completed manual setup run {run_id}: "
                f"{setup_run.successful_pages} successful, "
                f"{setup_run.skipped_pages} skipped, "
                f"{setup_run.failed_pages} failed"
            )

        except Exception as e:
            await self._mark_run_failed(setup_run, f"Unexpected error: {str(e)}")
            logger.error(f"Manual setup run {run_id} failed with error: {str(e)}", exc_info=True)
            raise

    async def _import_pages_bulk(
        self,
        setup_run: EngineSetupRun,
        urls: List[str]
    ) -> None:
        """
        Import pages in bulk and update progress.

        Args:
            setup_run: Setup run instance
            urls: List of URLs to import
        """
        # Process in batches for better progress tracking
        batch_size = 50
        total_urls = len(urls)

        for i in range(0, total_urls, batch_size):
            batch = urls[i:i + batch_size]

            # Import batch
            created, skipped, failed = await self.page_service.create_pages_bulk(
                client_id=setup_run.client_id,
                urls=batch,
                skip_duplicates=True
            )

            # Update counts
            setup_run.successful_pages += len(created)
            setup_run.skipped_pages += len(skipped)
            setup_run.failed_pages += len(failed)

            # Update progress
            processed = min(i + batch_size, total_urls)
            setup_run.progress_percentage = int((processed / total_urls) * 100)

            if batch:
                setup_run.current_url = batch[-1]

            await self.db.commit()

            logger.debug(
                f"Batch progress for run {setup_run.id}: "
                f"{processed}/{total_urls} URLs processed"
            )

    async def _mark_run_failed(
        self,
        setup_run: EngineSetupRun,
        error_message: str
    ) -> None:
        """
        Mark a setup run as failed.

        Args:
            setup_run: Setup run instance
            error_message: Error message
        """
        setup_run.status = "failed"
        setup_run.error_message = error_message
        setup_run.completed_at = datetime.datetime.utcnow()
        await self.db.commit()

    async def get_setup_run(self, run_id: uuid.UUID) -> EngineSetupRunRead:
        """
        Get a setup run by ID.

        Args:
            run_id: Setup run ID

        Returns:
            Setup run data

        Raises:
            NotFoundException: If run not found
        """
        setup_run = await self.db.get(EngineSetupRun, run_id)
        if not setup_run:
            raise NotFoundException(f"Setup run {run_id} not found")

        return EngineSetupRunRead.model_validate(setup_run)

    async def get_progress(self, run_id: uuid.UUID) -> EngineSetupProgressResponse:
        """
        Get progress of a setup run.

        Args:
            run_id: Setup run ID

        Returns:
            Progress response

        Raises:
            NotFoundException: If run not found
        """
        setup_run = await self.db.get(EngineSetupRun, run_id)
        if not setup_run:
            raise NotFoundException(f"Setup run {run_id} not found")

        return EngineSetupProgressResponse(
            run_id=setup_run.id,
            status=setup_run.status,
            progress_percentage=setup_run.progress_percentage,
            current_url=setup_run.current_url,
            total_pages=setup_run.total_pages,
            successful_pages=setup_run.successful_pages,
            failed_pages=setup_run.failed_pages,
            skipped_pages=setup_run.skipped_pages,
            error_message=setup_run.error_message,
            started_at=setup_run.started_at,
            completed_at=setup_run.completed_at
        )

    async def list_client_runs(
        self,
        client_id: uuid.UUID,
        limit: int = 10
    ) -> List[EngineSetupRunRead]:
        """
        List setup runs for a client.

        Args:
            client_id: Client ID
            limit: Maximum number of runs to return

        Returns:
            List of setup runs
        """
        result = await self.db.execute(
            select(EngineSetupRun)
            .where(EngineSetupRun.client_id == client_id)
            .order_by(EngineSetupRun.created_at.desc())
            .limit(limit)
        )
        runs = result.scalars().all()

        return [EngineSetupRunRead.model_validate(run) for run in runs]

    async def get_client_stats(
        self,
        client_id: uuid.UUID
    ) -> EngineSetupStatsResponse:
        """
        Get setup statistics for a client.

        Args:
            client_id: Client ID

        Returns:
            Setup statistics

        Raises:
            NotFoundException: If client not found
        """
        client = await self.db.get(Client, client_id)
        if not client:
            raise NotFoundException(f"Client {client_id} not found")

        # Get total runs
        runs_result = await self.db.execute(
            select(func.count())
            .where(EngineSetupRun.client_id == client_id)
        )
        total_runs = runs_result.scalar_one()

        # Get total pages
        pages_result = await self.db.execute(
            select(func.count())
            .where(ClientPage.client_id == client_id)
        )
        total_pages = pages_result.scalar_one()

        # Get last run time
        last_run_result = await self.db.execute(
            select(EngineSetupRun.created_at)
            .where(EngineSetupRun.client_id == client_id)
            .order_by(EngineSetupRun.created_at.desc())
            .limit(1)
        )
        last_run_at = last_run_result.scalar_one_or_none()

        return EngineSetupStatsResponse(
            client_id=client_id,
            total_runs=total_runs,
            total_pages_discovered=total_pages,
            last_run_at=last_run_at,
            engine_setup_completed=client.engine_setup_completed
        )

    async def cancel_setup(self, run_id: uuid.UUID) -> EngineSetupRunRead:
        """
        Cancel a running setup.

        Args:
            run_id: Setup run ID

        Returns:
            Updated setup run

        Raises:
            NotFoundException: If run not found
            ValidationException: If run cannot be cancelled
        """
        setup_run = await self.db.get(EngineSetupRun, run_id)
        if not setup_run:
            raise NotFoundException(f"Setup run {run_id} not found")

        if setup_run.status not in ["pending", "in_progress"]:
            raise ValidationException(
                f"Cannot cancel setup run with status '{setup_run.status}'"
            )

        setup_run.status = "failed"
        setup_run.error_message = "Cancelled by user"
        setup_run.completed_at = datetime.datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(setup_run)

        logger.info(f"Cancelled setup run {run_id}")

        return EngineSetupRunRead.model_validate(setup_run)
