"""
Page crawl orchestration service for Phase 4.

Manages the complete lifecycle of crawling pages and extracting data.
"""
import asyncio
import logging
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import update

from app.models import Client, ClientPage, CrawlRun, DataPoint
from app.services.crawl4ai_service import Crawl4AIService, PageCrawlResult, CrawlConfig
from app.services.extractors.pipeline import ExtractionPipeline
from app.services.embeddings_service import get_embeddings_service
from app.services.google_nlp_service import get_google_nlp_service
from app.services.page_extraction_service import PageExtractionService
from app.services.crawl_error_classifier import ErrorClassifier, ErrorCategory
from app.services.screenshot_storage import ScreenshotStorage
from app.config.base import config

logger = logging.getLogger(__name__)


class PageCrawlService:
    """
    Service for orchestrating page crawls and data extraction.

    Handles:
    - Starting new crawl runs
    - Crawling pages with Crawl4AI
    - Extracting data with extraction pipeline
    - Updating database with results
    - Real-time progress tracking
    - Error handling and retries
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize the page crawl service.

        Args:
            db: Database session
        """
        self.db = db
        self.extraction_pipeline = ExtractionPipeline()
        self.embeddings_service = get_embeddings_service()
        self.google_nlp_service = get_google_nlp_service()
        self.screenshot_storage = ScreenshotStorage()  # Initialize screenshot storage

    async def start_crawl_run(
        self,
        client_id: uuid.UUID,
        run_type: str = "full",
        selected_pages: Optional[List[uuid.UUID]] = None,
    ) -> CrawlRun:
        """
        Start a new crawl run for a client.

        Args:
            client_id: Client ID to crawl
            run_type: Type of run ('full', 'selective', 'manual')
            selected_pages: Optional list of specific page IDs to crawl

        Returns:
            Created CrawlRun instance

        Raises:
            ValueError: If client not found or no pages to crawl
        """
        logger.info(f"Starting {run_type} crawl run for client {client_id}")

        # Verify client exists
        client = await self.db.get(Client, client_id)
        if not client:
            raise ValueError(f"Client {client_id} not found")

        # Get pages to crawl
        if run_type == "selective" and selected_pages:
            # Crawl only selected pages
            query = select(ClientPage).where(
                ClientPage.client_id == client_id,
                ClientPage.id.in_(selected_pages)
            )
        else:
            # Crawl all pages (full run)
            query = select(ClientPage).where(ClientPage.client_id == client_id)

        result = await self.db.execute(query)
        pages_to_crawl = result.scalars().all()

        if not pages_to_crawl:
            raise ValueError(f"No pages found to crawl for client {client_id}")

        # Create crawl run
        crawl_run = CrawlRun(
            client_id=client_id,
            run_type=run_type,
            status="pending",
            total_pages=len(pages_to_crawl),
            successful_pages=0,
            failed_pages=0,
            started_at=datetime.utcnow(),
            progress_percentage=0,
            current_status_message="Initializing crawl run...",
            error_log={"errors": []},
            performance_metrics={},
            api_costs={
                "openai_embeddings": {"requests": 0, "tokens": 0, "cost_usd": 0.0},
                "google_nlp": {"requests": 0, "cost_usd": 0.0},
            },
        )

        self.db.add(crawl_run)
        await self.db.commit()
        await self.db.refresh(crawl_run)

        logger.info(
            f"✅ Created crawl run {crawl_run.id} for {len(pages_to_crawl)} pages"
        )

        return crawl_run

    async def crawl_and_extract_page(
        self,
        page: ClientPage,
        crawl_run: CrawlRun,
        crawler: Crawl4AIService,
    ) -> bool:
        """
        Crawl a single page with automatic retry, error classification, and historical tracking.

        NEW FEATURES:
        - Automatic retry with exponential backoff (up to 3 attempts)
        - Error classification (network, timeout, bot detection, etc.)
        - Smart timeout adaptation based on error type
        - Stealth mode activation for bot detection errors
        - Screenshot filesystem storage (not base64 truncation!)
        - Historical data versioning using DataPoint model
        - Better error reporting and logging

        Args:
            page: ClientPage to crawl
            crawl_run: Associated CrawlRun
            crawler: Initialized Crawl4AI crawler instance (unused, kept for compatibility)

        Returns:
            True if successful, False if failed after all retries
        """
        import json
        logger.info(f"Crawling page: {page.url}")

        # Update progress
        await self.update_progress(
            crawl_run,
            current_page_url=page.url,
            status_message=f"Crawling: {page.url}",
        )

        extraction_service = PageExtractionService(self.db)
        max_retries = config.crawl_retry_attempts
        last_error_message = None
        last_error_category = None

        # RETRY LOOP with exponential backoff
        for attempt in range(max_retries):
            try:
                # Determine if we should use stealth mode (after bot detection)
                use_stealth = (
                    last_error_category == ErrorCategory.BOT_DETECTION
                    if attempt > 0
                    else False
                )

                # Determine custom timeout (increase if previous timeout)
                custom_timeout = None
                if attempt > 0 and ErrorClassifier.should_increase_timeout(last_error_category):
                    from app.services.adaptive_timeout import AdaptiveTimeout
                    custom_timeout = AdaptiveTimeout.get_timeout(page.url, attempt=attempt)

                # Log retry attempt
                if attempt > 0:
                    retry_delay = ErrorClassifier.get_retry_delay(attempt - 1, last_error_category)
                    logger.info(
                        f"Retry {attempt}/{max_retries} for {page.url} "
                        f"(error: {last_error_category}, delay: {retry_delay}s, stealth: {use_stealth})"
                    )
                    await asyncio.sleep(retry_delay)

                # Update progress
                status_msg = f"Crawling: {page.url}" + (f" (retry {attempt}/{max_retries})" if attempt > 0 else "")
                await self.update_progress(crawl_run, status_message=status_msg)

                # Extract data with enhanced parameters
                # CRITICAL FIX: Pass the crawler to reuse browser instance!
                # crawler is a Crawl4AIService wrapper, extract the inner AsyncWebCrawler
                reuse_crawler = crawler.crawler if crawler and hasattr(crawler, 'crawler') else None

                extraction_result = await extraction_service.extract_page_data(
                    url=page.url,
                    use_stealth=use_stealth,
                    custom_timeout=custom_timeout,
                    retry_attempt=attempt,
                    reuse_crawler=reuse_crawler  # CRITICAL: Reuse browser for massive performance boost!
                )

                # Check if extraction was successful
                if not extraction_result.get('success', False):
                    error_message = extraction_result.get('error_message', 'Unknown extraction error')
                    status_code = extraction_result.get('status_code')

                    # Classify the error
                    error_category, should_retry = ErrorClassifier.classify_error(
                        error_message, status_code
                    )

                    last_error_message = error_message
                    last_error_category = error_category

                    logger.warning(
                        f"Extraction failed for {page.url}: {error_message} "
                        f"(category: {error_category}, should_retry: {should_retry})"
                    )

                    # If this is the last attempt OR error shouldn't be retried, fail permanently
                    if attempt == max_retries - 1 or not should_retry:
                        human_error = ErrorClassifier.get_human_readable_message(
                            error_category, error_message
                        )

                        page.is_failed = True
                        page.failure_reason = human_error
                        page.retry_count = attempt + 1
                        page.last_checked_at = datetime.utcnow()

                        await self.log_error(
                            crawl_run,
                            url=page.url,
                            error=f"[{error_category}] {human_error}"
                        )
                        await self.db.commit()
                        return False

                    # Otherwise, continue to next retry attempt
                    continue

                # SUCCESS! Now store all extracted data

                # 1. Update ClientPage with latest values
                page.status_code = extraction_result.get('status_code')
                page.page_title = extraction_result.get('page_title')
                page.meta_title = extraction_result.get('meta_title')
                page.meta_description = extraction_result.get('meta_description')
                page.h1 = extraction_result.get('h1')
                page.canonical_url = extraction_result.get('canonical_url')
                page.meta_robots = extraction_result.get('meta_robots')
                page.word_count = extraction_result.get('word_count')
                page.body_content = extraction_result.get('body_content')

                # Hreflang - convert to JSON string if needed
                hreflang = extraction_result.get('hreflang')
                if hreflang:
                    page.hreflang = json.dumps(hreflang) if isinstance(hreflang, list) else hreflang

                # Structure and markup
                page.webpage_structure = extraction_result.get('webpage_structure')
                page.schema_markup = extraction_result.get('schema_markup')

                # Links
                page.internal_links = extraction_result.get('internal_links')
                page.external_links = extraction_result.get('external_links')
                page.image_count = extraction_result.get('image_count')

                # 2. Store screenshots to filesystem (not base64 truncation!)
                screenshot_base64 = extraction_result.get('screenshot_url')
                if screenshot_base64:
                    thumbnail_url = self.screenshot_storage.save_screenshot(
                        screenshot_base64, page.id, screenshot_type="thumbnail"
                    )
                    if thumbnail_url:
                        page.screenshot_url = thumbnail_url
                        logger.debug(f"Saved thumbnail screenshot: {thumbnail_url}")

                screenshot_full_base64 = extraction_result.get('screenshot_full_url')
                if screenshot_full_base64:
                    full_url = self.screenshot_storage.save_screenshot(
                        screenshot_full_base64, page.id, screenshot_type="full"
                    )
                    if full_url:
                        page.screenshot_full_url = full_url
                        logger.debug(f"Saved full screenshot: {full_url}")

                # 3. Store historical data points for versioning
                await self._store_historical_data_points(page, crawl_run, extraction_result)

                # 4. Generate embeddings from body content (optional - requires OpenAI API key)
                if page.body_content and self.embeddings_service:
                    try:
                        logger.info(f"Generating embedding for {page.url}...")
                        embedding_result = await self.embeddings_service.generate_embedding(
                            page.body_content, truncate=True
                        )

                        if embedding_result:
                            embedding_vector, tokens_used, cost_usd = embedding_result
                            page.body_content_embedding = self.embeddings_service.embedding_to_json(
                                embedding_vector
                            )

                            # Track API costs
                            if not crawl_run.api_costs:
                                crawl_run.api_costs = {
                                    "openai_embeddings": {"requests": 0, "tokens": 0, "cost_usd": 0.0},
                                    "google_nlp": {"requests": 0, "cost_usd": 0.0},
                                }

                            crawl_run.api_costs["openai_embeddings"]["requests"] += 1
                            crawl_run.api_costs["openai_embeddings"]["tokens"] += tokens_used
                            crawl_run.api_costs["openai_embeddings"]["cost_usd"] += cost_usd

                            logger.info(f"Embedding generated: {tokens_used} tokens, ${cost_usd:.6f}")
                    except Exception as e:
                        logger.warning(f"Failed to generate embedding for {page.url}: {e}")

                # 5. Extract entities using Google NLP (optional - requires Google NLP API key)
                if page.body_content and self.google_nlp_service:
                    try:
                        logger.info(f"Extracting entities for {page.url}...")
                        entities_result = await self.google_nlp_service.analyze_entities(
                            page.body_content
                        )

                        if entities_result:
                            entities_list, cost_usd = entities_result
                            page.salient_entities = {"entities": entities_list}

                            # Track API costs
                            if not crawl_run.api_costs:
                                crawl_run.api_costs = {
                                    "openai_embeddings": {"requests": 0, "tokens": 0, "cost_usd": 0.0},
                                    "google_nlp": {"requests": 0, "cost_usd": 0.0},
                                }

                            crawl_run.api_costs["google_nlp"]["requests"] += 1
                            crawl_run.api_costs["google_nlp"]["cost_usd"] += cost_usd

                            logger.info(f"Extracted {len(entities_list)} entities, ${cost_usd:.6f}")
                    except Exception as e:
                        logger.warning(f"Failed to extract entities for {page.url}: {e}")

                # Mark page as successfully crawled
                page.is_failed = False
                page.failure_reason = None
                page.retry_count = attempt + 1 if attempt > 0 else 0
                page.updated_at = datetime.utcnow()
                page.last_crawled_at = datetime.utcnow()
                page.last_checked_at = datetime.utcnow()

                await self.db.commit()

                logger.info(
                    f"Successfully crawled {page.url} "
                    f"(attempt {attempt + 1}, {len(extraction_result)} data points)"
                )
                return True

            except Exception as e:
                # Unexpected exception - log and retry
                logger.error(f"Unexpected error crawling {page.url}: {str(e)}", exc_info=True)

                last_error_message = str(e)
                last_error_category = ErrorCategory.UNKNOWN

                # If this is the last attempt, fail permanently
                if attempt == max_retries - 1:
                    page.is_failed = True
                    page.failure_reason = f"Error after {max_retries} attempts: {str(e)}"
                    page.retry_count = max_retries
                    page.last_checked_at = datetime.utcnow()

                    await self.log_error(crawl_run, url=page.url, error=str(e))
                    await self.db.commit()

                    return False

                # Otherwise, continue to next retry
                continue

        # Should never reach here, but just in case
        return False

    async def update_progress(
        self,
        crawl_run: CrawlRun,
        current_page_url: Optional[str] = None,
        status_message: Optional[str] = None,
        progress_percentage: Optional[int] = None,
    ) -> None:
        """
        Update crawl run progress in database.

        Args:
            crawl_run: CrawlRun to update
            current_page_url: Current page being crawled
            status_message: Status message
            progress_percentage: Progress percentage (0-100)
        """
        if current_page_url:
            crawl_run.current_page_url = current_page_url

        if status_message:
            crawl_run.current_status_message = status_message

        if progress_percentage is not None:
            crawl_run.progress_percentage = min(100, max(0, progress_percentage))

        await self.db.commit()
        await self.db.refresh(crawl_run)

    async def log_error(
        self, crawl_run: CrawlRun, url: str, error: str
    ) -> None:
        """
        Log an error to the crawl run error log.

        Args:
            crawl_run: CrawlRun to log error to
            url: URL where error occurred
            error: Error message
        """
        if not crawl_run.error_log:
            crawl_run.error_log = {"errors": []}

        crawl_run.error_log["errors"].append({
            "url": url,
            "error": error,
            "timestamp": datetime.utcnow().isoformat(),
        })

        await self.db.commit()

    async def complete_crawl_run(
        self, crawl_run: CrawlRun, performance_metrics: Dict[str, Any]
    ) -> None:
        """
        Mark a crawl run as complete.

        Args:
            crawl_run: CrawlRun to complete
            performance_metrics: Performance metrics to save
        """
        crawl_run.status = "completed"
        crawl_run.completed_at = datetime.utcnow()
        crawl_run.current_status_message = "Crawl complete"
        crawl_run.progress_percentage = 100
        crawl_run.performance_metrics = performance_metrics

        await self.db.commit()
        await self.db.refresh(crawl_run)

        logger.info(
            f"✅ Crawl run {crawl_run.id} completed: "
            f"{crawl_run.successful_pages}/{crawl_run.total_pages} successful"
        )

    async def fail_crawl_run(self, crawl_run: CrawlRun, error: str) -> None:
        """
        Mark a crawl run as failed.

        Args:
            crawl_run: CrawlRun to fail
            error: Error message
        """
        crawl_run.status = "failed"
        crawl_run.completed_at = datetime.utcnow()
        crawl_run.current_status_message = f"Failed: {error}"

        await self.log_error(crawl_run, url="N/A", error=error)

        await self.db.commit()
        await self.db.refresh(crawl_run)

        logger.error(f"❌ Crawl run {crawl_run.id} failed: {error}")

    async def get_crawl_run_status(self, crawl_run_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Get the current status of a crawl run.

        Args:
            crawl_run_id: ID of the crawl run

        Returns:
            Status dictionary with progress information
        """
        crawl_run = await self.db.get(CrawlRun, crawl_run_id)

        if not crawl_run:
            return None

        return {
            "id": str(crawl_run.id),
            "status": crawl_run.status,
            "progress_percentage": crawl_run.progress_percentage,
            "current_page_url": crawl_run.current_page_url,
            "current_status_message": crawl_run.current_status_message,
            "total_pages": crawl_run.total_pages,
            "successful_pages": crawl_run.successful_pages,
            "failed_pages": crawl_run.failed_pages,
            "started_at": crawl_run.started_at.isoformat() if crawl_run.started_at else None,
            "completed_at": crawl_run.completed_at.isoformat() if crawl_run.completed_at else None,
            "performance_metrics": crawl_run.performance_metrics,
            "api_costs": crawl_run.api_costs,
            "errors": crawl_run.error_log.get("errors", []) if crawl_run.error_log else [],
        }

    async def _store_historical_data_points(
        self,
        page: ClientPage,
        crawl_run: CrawlRun,
        extraction_result: Dict[str, Any]
    ) -> None:
        """
        Store extracted data as historical data points for versioning.

        This enables tracking changes over time:
        - Query: "How has page_title changed over the last 10 crawls?"
        - Query: "When did meta_description last change?"
        - Query: "Show me word_count trends over time"

        Args:
            page: The ClientPage
            crawl_run: The current CrawlRun
            extraction_result: Extracted data dictionary
        """
        # Fields to track historically
        TRACKED_FIELDS = [
            'page_title',
            'meta_description',
            'h1',
            'word_count',
            'canonical_url',
            'meta_robots',
            'image_count',
            'status_code',
        ]

        try:
            for field_name in TRACKED_FIELDS:
                value = extraction_result.get(field_name)

                # Only store if value exists
                if value is not None:
                    data_point = DataPoint(
                        page_id=page.id,
                        data_type=field_name,
                        value={
                            'data': value,
                            'crawl_run_id': str(crawl_run.id),
                            'extracted_at': datetime.utcnow().isoformat(),
                        },
                        crawl_run_id=crawl_run.id
                    )

                    self.db.add(data_point)

            # Note: We commit these together with the main page update in the calling method
            logger.debug(f"Created historical data points for {page.url}")

        except Exception as e:
            logger.warning(f"Failed to store historical data points for {page.url}: {e}")
            # Non-critical error - don't fail the crawl
