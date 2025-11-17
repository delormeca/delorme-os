"""
Service for Sitemap Tracker feature.

Provides business logic for sitemap tracking including:
- Configuration management
- Run creation and execution
- Change detection and comparison
- Dashboard data aggregation
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import and_, desc, func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Client, SitemapChange, SitemapTrackerRun, ChangeType
from app.schemas.client import ClientRead
from app.schemas.sitemap_tracker import (
    RunComparisonResponse,
    SitemapChangeList,
    SitemapChangeRead,
    SitemapTrackerConfigUpdate,
    SitemapTrackerDashboard,
    SitemapTrackerRunCreate,
    SitemapTrackerRunList,
    SitemapTrackerRunRead,
)
from app.core.exceptions import NotFoundException, ValidationException
from app.utils.helpers import get_utcnow

logger = logging.getLogger(__name__)


class SitemapTrackerService:
    """Service for managing sitemap tracking operations."""

    def __init__(self, db: AsyncSession):
        """
        Initialize the sitemap tracker service.

        Args:
            db: Async database session
        """
        self.db = db

    async def update_tracker_config(
        self,
        client_id: UUID,
        config: SitemapTrackerConfigUpdate,
    ) -> ClientRead:
        """
        Update sitemap tracker configuration for a client.

        Args:
            client_id: ID of the client to configure
            config: Configuration update data

        Returns:
            Updated client data

        Raises:
            NotFoundException: If client not found
            ValidationException: If configuration is invalid
        """
        # Fetch client
        query = select(Client).where(Client.id == client_id)
        result = await self.db.execute(query)
        client = result.scalar_one_or_none()

        if not client:
            raise NotFoundException(f"Client with ID {client_id} not found")

        # Validate sitemap URL if provided
        if config.sitemap_url is not None:
            if not config.sitemap_url.strip():
                raise ValidationException("Sitemap URL cannot be empty")

            # Basic URL validation
            if not (config.sitemap_url.startswith("http://") or config.sitemap_url.startswith("https://")):
                raise ValidationException("Sitemap URL must start with http:// or https://")

        # Validate tracking frequency if provided
        valid_frequencies = ["daily", "weekly", "bi_monthly", "monthly", "manual_only"]
        if config.tracking_frequency is not None:
            if config.tracking_frequency not in valid_frequencies:
                raise ValidationException(
                    f"Tracking frequency must be one of: {', '.join(valid_frequencies)}"
                )

        # Check if this is the first time configuration (client was not configured before)
        is_first_time_config = not client.sitemap_tracker_configured

        # Update client configuration
        if config.sitemap_url is not None:
            client.sitemap_url = config.sitemap_url

        if config.tracking_frequency is not None:
            client.sitemap_tracking_frequency = config.tracking_frequency

        if config.enabled is not None:
            client.sitemap_tracker_enabled = config.enabled

        # Mark as configured if sitemap URL is set
        if client.sitemap_url and client.sitemap_tracking_frequency:
            client.sitemap_tracker_configured = True

        # Commit changes
        await self.db.commit()
        await self.db.refresh(client)

        logger.info(
            f"Updated sitemap tracker config for client {client_id}: "
            f"url={config.sitemap_url}, frequency={config.tracking_frequency}, enabled={config.enabled}"
        )

        # If this is the first time configuration and tracker is now configured and enabled,
        # automatically create and execute a run to pull pages immediately
        if is_first_time_config and client.sitemap_tracker_configured and client.sitemap_tracker_enabled:
            logger.info(f"First time configuration for client {client_id}, creating and executing initial run")

            # Create a new run
            new_run = SitemapTrackerRun(
                client_id=client_id,
                schedule_frequency=client.sitemap_tracking_frequency or "manual_only",
                sitemap_url=client.sitemap_url,
                status="pending",
                progress_percentage=0,
                previous_run_id=None,  # No previous run for first setup
            )

            self.db.add(new_run)
            await self.db.commit()
            await self.db.refresh(new_run)

            logger.info(f"Created initial run {new_run.id}, now executing...")

            # Execute the run immediately
            try:
                await self.execute_tracker_run(new_run.id)
                logger.info(f"Successfully executed initial run {new_run.id}")
            except Exception as e:
                logger.error(f"Failed to execute initial run {new_run.id}: {str(e)}")
                # Don't raise - configuration was successful even if run failed

        return ClientRead.model_validate(client)

    async def create_tracker_run(
        self,
        client_id: UUID,
        run_data: SitemapTrackerRunCreate,
    ) -> SitemapTrackerRunRead:
        """
        Create a new sitemap tracker run.

        Args:
            client_id: ID of the client to create run for
            run_data: Run creation data

        Returns:
            Created run data

        Raises:
            NotFoundException: If client not found
            ValidationException: If client is not configured for tracking
        """
        # Fetch client
        query = select(Client).where(Client.id == client_id)
        result = await self.db.execute(query)
        client = result.scalar_one_or_none()

        if not client:
            raise NotFoundException(f"Client with ID {client_id} not found")

        # Validate client is configured
        if not client.sitemap_tracker_configured or not client.sitemap_url:
            raise ValidationException(
                "Client must be configured with a sitemap URL before creating a run"
            )

        # Validate run type
        valid_run_types = ["manual", "scheduled"]
        if run_data.run_type not in valid_run_types:
            raise ValidationException(
                f"Run type must be one of: {', '.join(valid_run_types)}"
            )

        # Get previous run for comparison
        previous_run_query = (
            select(SitemapTrackerRun)
            .where(
                and_(
                    SitemapTrackerRun.client_id == client_id,
                    SitemapTrackerRun.status == "completed"
                )
            )
            .order_by(desc(SitemapTrackerRun.completed_at))
            .limit(1)
        )
        previous_run_result = await self.db.execute(previous_run_query)
        previous_run = previous_run_result.scalar_one_or_none()

        # Create new run
        new_run = SitemapTrackerRun(
            client_id=client_id,
            schedule_frequency=client.sitemap_tracking_frequency or "manual_only",
            sitemap_url=client.sitemap_url,
            status="pending",
            progress_percentage=0,
            previous_run_id=previous_run.id if previous_run else None,
        )

        self.db.add(new_run)
        await self.db.commit()
        await self.db.refresh(new_run)

        logger.info(
            f"Created new tracker run {new_run.id} for client {client_id} "
            f"(type={run_data.run_type})"
        )

        return SitemapTrackerRunRead.model_validate(new_run)

    async def execute_tracker_run(
        self,
        run_id: UUID,
    ) -> SitemapTrackerRunRead:
        """
        Execute a pending sitemap tracker run.

        This method:
        1. Fetches and parses the sitemap
        2. Compares with previous run (if exists)
        3. Detects changes (new, removed, status code changes)
        4. Records all changes to the database
        5. Updates run statistics

        Args:
            run_id: ID of the run to execute

        Returns:
            Updated run data with results

        Raises:
            NotFoundException: If run not found
            ValidationException: If run is not in pending status
        """
        # Fetch run
        query = select(SitemapTrackerRun).where(SitemapTrackerRun.id == run_id)
        result = await self.db.execute(query)
        run = result.scalar_one_or_none()

        if not run:
            raise NotFoundException(f"Tracker run with ID {run_id} not found")

        # Validate run status
        if run.status != "pending":
            raise ValidationException(
                f"Run must be in 'pending' status to execute (current: {run.status})"
            )

        # Store sitemap URL before committing (to avoid lazy-load issues)
        sitemap_url = run.sitemap_url
        previous_run_id = run.previous_run_id

        # Update status to in_progress
        run.status = "in_progress"
        run.started_at = get_utcnow()
        run.current_status_message = "Fetching sitemap..."
        await self.db.commit()
        await self.db.refresh(run)  # Refresh to keep run attached to session

        try:
            # Import sitemap parser from local utils
            from app.utils.sitemap_parser_production import RobustSitemapParser

            # Parse sitemap (synchronous operation - no database commits inside)
            run.current_status_message = f"Parsing sitemap from {sitemap_url}..."

            # Parse sitemap synchronously
            with RobustSitemapParser() as parser:
                # Use recursive parsing to handle sitemap indexes
                all_urls = parser.parse_sitemap_recursive(sitemap_url)

                if not all_urls:
                    # Check if there was an error
                    result = parser.parse_sitemap(sitemap_url)
                    if result.error:
                        raise Exception(f"Sitemap parsing failed: {result.error}")

            # Store current sitemap data
            current_sitemap_data = {
                url_obj.loc: {
                    "lastmod": url_obj.lastmod,
                    "changefreq": url_obj.changefreq,
                    "priority": url_obj.priority,
                }
                for url_obj in all_urls
            }

            # Update run with results (async operations now that parser is closed)
            run.total_urls_in_sitemap = len(current_sitemap_data)
            run.current_status_message = f"Found {len(current_sitemap_data)} URLs in sitemap"
            await self.db.commit()
            await self.db.refresh(run)  # Refresh to keep run attached

            # Get previous run data for comparison
            previous_urls = {}
            if previous_run_id:
                previous_query = select(SitemapTrackerRun).where(
                    SitemapTrackerRun.id == previous_run_id
                )
                previous_result = await self.db.execute(previous_query)
                previous_run = previous_result.scalar_one_or_none()

                if previous_run and previous_run.comparison_baseline_snapshot:
                    previous_urls = previous_run.comparison_baseline_snapshot

            # Detect changes
            run.current_status_message = "Detecting changes..."
            await self.db.commit()
            await self.db.refresh(run)  # Refresh to keep run attached

            current_urls_set = set(current_sitemap_data.keys())
            previous_urls_set = set(previous_urls.keys())

            # New URLs
            new_urls = current_urls_set - previous_urls_set
            run.new_urls_count = len(new_urls)

            # Removed URLs
            removed_urls = previous_urls_set - current_urls_set
            run.removed_urls_count = len(removed_urls)

            # Changed URLs (for now, just lastmod changes)
            changed_urls = []
            for url in current_urls_set.intersection(previous_urls_set):
                current_lastmod = current_sitemap_data[url].get("lastmod")
                previous_lastmod = previous_urls[url].get("lastmod")

                if current_lastmod != previous_lastmod:
                    changed_urls.append(url)

            run.status_code_changes_count = len(changed_urls)
            run.unchanged_urls_count = len(current_urls_set.intersection(previous_urls_set)) - len(changed_urls)

            # Record changes in database
            changes_to_add = []

            # New URLs
            for url in new_urls:
                change = SitemapChange(
                    client_id=run.client_id,
                    sitemap_tracker_run_id=run.id,
                    url=url,
                    change_type=ChangeType.ADDED,
                    new_status_code=200,  # Assume 200 for sitemap URLs
                    detected_at=get_utcnow(),
                    pushed_to_crawler=False,
                )
                changes_to_add.append(change)

            # Removed URLs
            for url in removed_urls:
                change = SitemapChange(
                    client_id=run.client_id,
                    sitemap_tracker_run_id=run.id,
                    url=url,
                    change_type=ChangeType.REMOVED,
                    old_status_code=200,
                    detected_at=get_utcnow(),
                    last_seen_at=previous_urls[url].get("lastmod"),
                    pushed_to_crawler=False,
                )
                changes_to_add.append(change)

            # Changed URLs (lastmod changes)
            for url in changed_urls:
                change = SitemapChange(
                    client_id=run.client_id,
                    sitemap_tracker_run_id=run.id,
                    url=url,
                    change_type=ChangeType.STATUS_CHANGED,
                    old_status_code=200,
                    new_status_code=200,
                    detected_at=get_utcnow(),
                    pushed_to_crawler=False,
                    notes=f"lastmod changed from {previous_urls[url].get('lastmod')} to {current_sitemap_data[url].get('lastmod')}",
                )
                changes_to_add.append(change)

            # Bulk insert changes
            if changes_to_add:
                self.db.add_all(changes_to_add)

            # Update run status
            run.status = "completed"
            run.completed_at = get_utcnow()
            run.progress_percentage = 100
            run.current_status_message = "Completed successfully"
            run.total_urls_checked = run.total_urls_in_sitemap
            run.comparison_baseline_snapshot = current_sitemap_data

            # Calculate execution time
            if run.started_at:
                execution_time = (run.completed_at - run.started_at).total_seconds()
                run.execution_time_seconds = execution_time

            # Update client's last run
            client_query = select(Client).where(Client.id == run.client_id)
            client_result = await self.db.execute(client_query)
            client = client_result.scalar_one_or_none()
            if client:
                client.last_sitemap_tracker_run_id = run.id

            await self.db.commit()
            await self.db.refresh(run)

            logger.info(
                f"Completed tracker run {run_id}: "
                f"total={run.total_urls_in_sitemap}, new={run.new_urls_count}, "
                f"removed={run.removed_urls_count}, changed={run.status_code_changes_count}"
            )

        except Exception as e:
            # Handle execution errors
            run.status = "failed"
            run.completed_at = get_utcnow()
            run.error_message = str(e)
            run.error_log = {"error": str(e), "type": type(e).__name__}
            await self.db.commit()

            logger.error(f"Tracker run {run_id} failed: {str(e)}")

            raise

        return SitemapTrackerRunRead.model_validate(run)

    async def get_tracker_run(
        self,
        run_id: UUID,
    ) -> SitemapTrackerRunRead:
        """
        Get details of a specific tracker run.

        Args:
            run_id: ID of the run to retrieve

        Returns:
            Run data (changes are fetched separately via list_run_changes)

        Raises:
            NotFoundException: If run not found
        """
        # Fetch run (changes loaded separately via list_run_changes endpoint)
        query = select(SitemapTrackerRun).where(SitemapTrackerRun.id == run_id)
        result = await self.db.execute(query)
        run = result.scalar_one_or_none()

        if not run:
            raise NotFoundException(f"Tracker run with ID {run_id} not found")

        return SitemapTrackerRunRead.model_validate(run)

    async def list_client_runs(
        self,
        client_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> SitemapTrackerRunList:
        """
        List all tracker runs for a client (paginated).

        Args:
            client_id: ID of the client
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Paginated list of runs

        Raises:
            NotFoundException: If client not found
        """
        # Verify client exists
        client_query = select(Client).where(Client.id == client_id)
        client_result = await self.db.execute(client_query)
        client = client_result.scalar_one_or_none()

        if not client:
            raise NotFoundException(f"Client with ID {client_id} not found")

        # Count total runs
        count_query = select(func.count()).select_from(SitemapTrackerRun).where(
            SitemapTrackerRun.client_id == client_id
        )
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        # Fetch paginated runs
        offset = (page - 1) * page_size
        query = (
            select(SitemapTrackerRun)
            .where(SitemapTrackerRun.client_id == client_id)
            .order_by(desc(SitemapTrackerRun.created_at))
            .limit(page_size)
            .offset(offset)
        )
        result = await self.db.execute(query)
        runs = result.scalars().all()

        logger.info(
            f"Listed {len(runs)} tracker runs for client {client_id} "
            f"(page={page}, total={total})"
        )

        return SitemapTrackerRunList(
            items=[SitemapTrackerRunRead.model_validate(run) for run in runs],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def list_run_changes(
        self,
        run_id: UUID,
        change_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> SitemapChangeList:
        """
        List all changes detected in a specific run (paginated).

        Args:
            run_id: ID of the run
            change_type: Optional filter by change type ('new', 'removed', 'status_code_change')
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Paginated list of changes

        Raises:
            NotFoundException: If run not found
            ValidationException: If change_type is invalid
        """
        # Verify run exists
        run_query = select(SitemapTrackerRun).where(SitemapTrackerRun.id == run_id)
        run_result = await self.db.execute(run_query)
        run = run_result.scalar_one_or_none()

        if not run:
            raise NotFoundException(f"Tracker run with ID {run_id} not found")

        # Validate change_type if provided
        if change_type is not None:
            valid_change_types = ["added", "removed", "status_changed"]
            if change_type not in valid_change_types:
                raise ValidationException(
                    f"Change type must be one of: {', '.join(valid_change_types)}"
                )

        # Build query with optional filter
        base_query = select(SitemapChange).where(
            SitemapChange.sitemap_tracker_run_id == run_id
        )

        if change_type:
            # Convert to ChangeType enum
            change_type_enum = ChangeType(change_type)
            base_query = base_query.where(SitemapChange.change_type == change_type_enum)

        # Count total changes
        count_query = select(func.count()).select_from(base_query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        # Fetch paginated changes
        offset = (page - 1) * page_size
        query = (
            base_query
            .order_by(desc(SitemapChange.detected_at))
            .limit(page_size)
            .offset(offset)
        )
        result = await self.db.execute(query)
        changes = result.scalars().all()

        logger.info(
            f"Listed {len(changes)} changes for run {run_id} "
            f"(type={change_type}, page={page}, total={total})"
        )

        return SitemapChangeList(
            items=[SitemapChangeRead.model_validate(change) for change in changes],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def compare_runs(
        self,
        run_id_1: UUID,
        run_id_2: UUID,
    ) -> RunComparisonResponse:
        """
        Compare two sitemap tracker runs.

        Args:
            run_id_1: ID of the first run
            run_id_2: ID of the second run

        Returns:
            Comparison data with differences and statistics

        Raises:
            NotFoundException: If either run not found
            ValidationException: If runs are for different clients
        """
        # Fetch both runs
        query = select(SitemapTrackerRun).where(
            SitemapTrackerRun.id.in_([run_id_1, run_id_2])
        )
        result = await self.db.execute(query)
        runs = result.scalars().all()

        if len(runs) != 2:
            raise NotFoundException("One or both tracker runs not found")

        run_1 = next((r for r in runs if r.id == run_id_1), None)
        run_2 = next((r for r in runs if r.id == run_id_2), None)

        if not run_1:
            raise NotFoundException(f"Tracker run with ID {run_id_1} not found")
        if not run_2:
            raise NotFoundException(f"Tracker run with ID {run_id_2} not found")

        # Validate runs are for same client
        if run_1.client_id != run_2.client_id:
            raise ValidationException("Cannot compare runs from different clients")

        # Validate runs are completed
        if run_1.status != "completed" or run_2.status != "completed":
            raise ValidationException("Can only compare completed runs")

        # Get sitemap data from both runs
        run_1_urls = set(run_1.comparison_baseline_snapshot.keys()) if run_1.comparison_baseline_snapshot else set()
        run_2_urls = set(run_2.comparison_baseline_snapshot.keys()) if run_2.comparison_baseline_snapshot else set()

        # Calculate differences
        added_urls = list(run_2_urls - run_1_urls)
        removed_urls = list(run_1_urls - run_2_urls)

        # Find status code changes (for now, just URLs that changed lastmod)
        status_code_changes = []
        common_urls = run_1_urls.intersection(run_2_urls)

        for url in common_urls:
            run_1_data = run_1.comparison_baseline_snapshot.get(url, {})
            run_2_data = run_2.comparison_baseline_snapshot.get(url, {})

            if run_1_data.get("lastmod") != run_2_data.get("lastmod"):
                status_code_changes.append({
                    "url": url,
                    "old_lastmod": run_1_data.get("lastmod"),
                    "new_lastmod": run_2_data.get("lastmod"),
                })

        # Build summary
        summary = {
            "run_1_total_urls": len(run_1_urls),
            "run_2_total_urls": len(run_2_urls),
            "added_urls_count": len(added_urls),
            "removed_urls_count": len(removed_urls),
            "changed_urls_count": len(status_code_changes),
            "unchanged_urls_count": len(common_urls) - len(status_code_changes),
            "time_between_runs": str(run_2.created_at - run_1.created_at) if run_1.created_at and run_2.created_at else None,
        }

        logger.info(
            f"Compared runs {run_id_1} and {run_id_2}: "
            f"added={len(added_urls)}, removed={len(removed_urls)}, changed={len(status_code_changes)}"
        )

        return RunComparisonResponse(
            run_1=SitemapTrackerRunRead.model_validate(run_1),
            run_2=SitemapTrackerRunRead.model_validate(run_2),
            added_urls=added_urls,
            removed_urls=removed_urls,
            status_code_changes=status_code_changes,
            summary=summary,
        )

    async def get_dashboard(
        self,
        client_id: UUID,
    ) -> SitemapTrackerDashboard:
        """
        Get dashboard overview for a client's sitemap tracker.

        Args:
            client_id: ID of the client

        Returns:
            Dashboard data with overview and statistics

        Raises:
            NotFoundException: If client not found
        """
        # Verify client exists
        client_query = select(Client).where(Client.id == client_id)
        client_result = await self.db.execute(client_query)
        client = client_result.scalar_one_or_none()

        if not client:
            raise NotFoundException(f"Client with ID {client_id} not found")

        # Get latest run
        latest_run_query = (
            select(SitemapTrackerRun)
            .where(SitemapTrackerRun.client_id == client_id)
            .order_by(desc(SitemapTrackerRun.created_at))
            .limit(1)
        )
        latest_run_result = await self.db.execute(latest_run_query)
        latest_run = latest_run_result.scalar_one_or_none()

        # Count total runs
        total_runs_query = select(func.count()).select_from(SitemapTrackerRun).where(
            SitemapTrackerRun.client_id == client_id
        )
        total_runs_result = await self.db.execute(total_runs_query)
        total_runs = total_runs_result.scalar_one()

        # Get total unique URLs being tracked (from latest run)
        total_urls_tracked = latest_run.total_urls_in_sitemap if latest_run else 0

        # Get recent changes (last 50)
        recent_changes_query = (
            select(SitemapChange)
            .where(SitemapChange.client_id == client_id)
            .order_by(desc(SitemapChange.detected_at))
            .limit(50)
        )
        recent_changes_result = await self.db.execute(recent_changes_query)
        recent_changes = recent_changes_result.scalars().all()

        # Calculate status code breakdown (from latest run)
        status_code_breakdown = latest_run.status_code_summary if latest_run and latest_run.status_code_summary else {}

        logger.info(
            f"Generated dashboard for client {client_id}: "
            f"runs={total_runs}, urls={total_urls_tracked}, recent_changes={len(recent_changes)}"
        )

        return SitemapTrackerDashboard(
            latest_run=SitemapTrackerRunRead.model_validate(latest_run) if latest_run else None,
            total_runs=total_runs,
            total_urls_tracked=total_urls_tracked,
            recent_changes=[SitemapChangeRead.model_validate(change) for change in recent_changes],
            status_code_breakdown=status_code_breakdown,
        )
