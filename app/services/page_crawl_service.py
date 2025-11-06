"""
Page crawl orchestration service for Phase 4.

Manages the complete lifecycle of crawling pages and extracting data.
"""
import logging
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import update

from app.models import Client, ClientPage, CrawlRun
from app.services.crawl4ai_service import Crawl4AIService, PageCrawlResult, CrawlConfig
from app.services.extractors.pipeline import ExtractionPipeline
from app.services.embeddings_service import get_embeddings_service
from app.services.google_nlp_service import get_google_nlp_service
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
        Crawl a single page and extract all data points.

        Args:
            page: ClientPage to crawl
            crawl_run: Associated CrawlRun
            crawler: Initialized Crawl4AI crawler instance

        Returns:
            True if successful, False if failed
        """
        logger.info(f"Crawling page: {page.url}")

        # Update progress
        await self.update_progress(
            crawl_run,
            current_page_url=page.url,
            status_message=f"Crawling: {page.url}",
        )

        try:
            # Crawl page with Crawl4AI
            crawl_config = CrawlConfig(
                timeout=config.crawl_timeout_seconds,
                wait_for_network_idle=True,
                wait_time=2.0,
            )

            crawl_result: PageCrawlResult = await crawler.crawl_page(
                page.url, crawl_config
            )

            # Update page with crawl results
            page.status_code = crawl_result.status_code
            page.last_checked_at = datetime.utcnow()

            if not crawl_result.success:
                # Crawl failed
                page.is_failed = True
                page.failure_reason = crawl_result.error_message
                page.retry_count += 1

                await self.log_error(
                    crawl_run,
                    url=page.url,
                    error=crawl_result.error_message or "Unknown crawl error",
                )

                await self.db.commit()
                return False

            # Crawl succeeded - extract data
            html = crawl_result.html

            if not html:
                logger.warning(f"No HTML content for {page.url}")
                page.is_failed = True
                page.failure_reason = "No HTML content"
                await self.db.commit()
                return False

            # Run extraction pipeline
            extracted_data = self.extraction_pipeline.extract_all(html, page.url)

            # Update page with extracted data
            page.page_title = extracted_data.get("page_title")
            page.meta_title = extracted_data.get("meta_title")
            page.meta_description = extracted_data.get("meta_description")
            page.h1 = extracted_data.get("h1")
            page.canonical_url = extracted_data.get("canonical_url")
            page.hreflang = extracted_data.get("hreflang")
            page.meta_robots = extracted_data.get("meta_robots")
            page.word_count = extracted_data.get("word_count")
            page.body_content = extracted_data.get("body_content")
            page.webpage_structure = extracted_data.get("webpage_structure")
            page.internal_links = extracted_data.get("internal_links")
            page.external_links = extracted_data.get("external_links")
            page.image_count = extracted_data.get("image_count")
            page.schema_markup = extracted_data.get("schema_markup")
            page.slug = extracted_data.get("slug")

            # Generate embeddings from body content
            if page.body_content:
                logger.info(f"Generating embedding for {page.url}...")
                embedding_result = await self.embeddings_service.generate_embedding(
                    page.body_content, truncate=True
                )

                if embedding_result:
                    embedding_vector, tokens_used, cost_usd = embedding_result

                    # Store embedding as JSON
                    page.body_content_embedding = self.embeddings_service.embedding_to_json(
                        embedding_vector
                    )

                    # Track API costs in crawl run
                    if not crawl_run.api_costs:
                        crawl_run.api_costs = {
                            "openai_embeddings": {"requests": 0, "tokens": 0, "cost_usd": 0.0},
                            "google_nlp": {"requests": 0, "cost_usd": 0.0},
                        }

                    crawl_run.api_costs["openai_embeddings"]["requests"] += 1
                    crawl_run.api_costs["openai_embeddings"]["tokens"] += tokens_used
                    crawl_run.api_costs["openai_embeddings"]["cost_usd"] += cost_usd

                    logger.info(
                        f"✅ Embedding generated: {tokens_used} tokens, ${cost_usd:.6f}"
                    )
                else:
                    logger.warning(f"Failed to generate embedding for {page.url}")
            else:
                logger.debug(f"No body content to generate embedding for {page.url}")

            # Extract entities using Google NLP
            if page.body_content:
                logger.info(f"Extracting entities for {page.url}...")
                entities_result = await self.google_nlp_service.analyze_entities(
                    page.body_content
                )

                if entities_result:
                    entities_list, cost_usd = entities_result

                    # Store entities as JSON
                    page.salient_entities = {"entities": entities_list}

                    # Track API costs in crawl run
                    if not crawl_run.api_costs:
                        crawl_run.api_costs = {
                            "openai_embeddings": {"requests": 0, "tokens": 0, "cost_usd": 0.0},
                            "google_nlp": {"requests": 0, "cost_usd": 0.0},
                        }

                    crawl_run.api_costs["google_nlp"]["requests"] += 1
                    crawl_run.api_costs["google_nlp"]["cost_usd"] += cost_usd

                    logger.info(
                        f"✅ Extracted {len(entities_list)} entities, ${cost_usd:.6f}"
                    )
                else:
                    logger.warning(f"Failed to extract entities for {page.url}")
            else:
                logger.debug(f"No body content to extract entities from for {page.url}")

            page.is_failed = False
            page.failure_reason = None
            page.updated_at = datetime.utcnow()
            page.last_crawled_at = datetime.utcnow()

            await self.db.commit()

            logger.info(f"✅ Successfully crawled and extracted: {page.url}")
            return True

        except Exception as e:
            logger.error(f"❌ Error crawling {page.url}: {str(e)}", exc_info=True)

            page.is_failed = True
            page.failure_reason = str(e)
            page.retry_count += 1

            await self.log_error(crawl_run, url=page.url, error=str(e))
            await self.db.commit()

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
