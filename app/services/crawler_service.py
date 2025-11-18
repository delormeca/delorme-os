"""
Crawler Service - Orchestrates Apify crawling with embeddings and similarity.

High-level service that combines:
- ApifyService for crawl execution and control
- EmbeddingsService for OpenAI embeddings
- Database persistence for results and versioning
- Similarity calculations for "similar to" feature
"""
import logging
import uuid
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.apify_service import get_apify_service
from app.services.embeddings_service import get_embeddings_service
from app.models import (
    Client,
    ClientPage,
    ClientPageVersion,
    ApifyCrawlRun,
)

logger = logging.getLogger(__name__)


class CrawlerService:
    """
    Orchestrates the complete crawl workflow with manual control.

    Provides:
    - Manual start/stop/pause controls for crawls
    - Automatic embedding generation for all pages
    - Similarity calculations for recommendations
    - Complete versioning and historical tracking
    """

    def __init__(self, db: AsyncSession):
        """Initialize crawler service with database session."""
        self.db = db
        self.apify_service = get_apify_service()
        self.embeddings_service = get_embeddings_service()

    async def start_crawl(
        self,
        client_id: uuid.UUID,
        urls: Optional[List[str]] = None,
        max_depth: int = 0,
        save_html: bool = True,
        save_markdown: bool = True,
        save_screenshots: bool = True,
    ) -> Optional[ApifyCrawlRun]:
        """
        Start a new crawl for a client (MANUAL TRIGGER).

        Args:
            client_id: Client UUID
            urls: Optional list of URLs to crawl (if None, uses client's base_url)
            max_depth: Maximum crawl depth (0 = exact URLs only)
            save_html: Whether to save HTML
            save_markdown: Whether to save markdown
            save_screenshots: Whether to capture screenshots

        Returns:
            ApifyCrawlRun instance or None on error
        """
        # Get client
        result = await self.db.execute(
            select(Client).where(Client.id == client_id)
        )
        client = result.scalar_one_or_none()

        if not client:
            logger.error(f"Client not found: {client_id}")
            return None

        # Store client attributes before session operations to avoid lazy loading issues
        client_name = client.name
        client_base_url = client.base_url

        # Use client base_url if no URLs provided
        if not urls:
            if not client_base_url:
                logger.error(f"No URLs provided and client has no base_url: {client_id}")
                return None
            urls = [client_base_url]

        # Create database record for crawl run
        crawl_run = ApifyCrawlRun(
            client_id=client_id,
            status="starting",
            total_pages=len(urls) if max_depth == 0 else 0,
        )
        self.db.add(crawl_run)
        await self.db.commit()
        await self.db.refresh(crawl_run)

        logger.info(f"🚀 Starting crawl for client: {client_name} (ID: {client_id})")

        # Start Apify crawl
        apify_result = await self.apify_service.start_crawl(
            urls=urls,
            client_name=client_name,
            max_depth=max_depth,
            save_html=save_html,
            save_markdown=save_markdown,
            save_screenshots=save_screenshots,
        )

        if not apify_result:
            # Update status to failed
            crawl_run.status = "failed"
            await self.db.commit()
            logger.error(f"Failed to start Apify crawl for client: {client.name}")
            return None

        # Update crawl run with Apify details
        crawl_run.apify_run_id = apify_result["run_id"]
        crawl_run.status = apify_result["status"]
        crawl_run.started_at = datetime.fromisoformat(apify_result["started_at"].replace("Z", "+00:00")) if apify_result.get("started_at") else None

        await self.db.commit()
        await self.db.refresh(crawl_run)

        logger.info(f"✅ Crawl started: run_id={crawl_run.apify_run_id}, status={crawl_run.status}")

        return crawl_run

    async def stop_crawl(self, crawl_run_id: uuid.UUID) -> bool:
        """
        Stop/abort a running crawl immediately.

        Args:
            crawl_run_id: ApifyCrawlRun UUID

        Returns:
            True if stopped successfully, False otherwise
        """
        # Get crawl run
        result = await self.db.execute(
            select(ApifyCrawlRun).where(ApifyCrawlRun.id == crawl_run_id)
        )
        crawl_run = result.scalar_one_or_none()

        if not crawl_run:
            logger.error(f"Crawl run not found: {crawl_run_id}")
            return False

        if not crawl_run.apify_run_id:
            logger.error(f"Crawl run has no Apify run ID: {crawl_run_id}")
            return False

        logger.info(f"🛑 Stopping crawl: {crawl_run.apify_run_id}")

        # Stop via Apify
        success = await self.apify_service.stop_crawl(crawl_run.apify_run_id)

        if success:
            # Update local status
            crawl_run.status = "ABORTED"
            crawl_run.completed_at = datetime.utcnow()
            await self.db.commit()
            logger.info(f"✅ Crawl stopped: {crawl_run.apify_run_id}")

        return success

    async def pause_crawl(self, crawl_run_id: uuid.UUID) -> bool:
        """
        Pause a running crawl gracefully.

        Note: Apify doesn't support native pause/resume. This performs graceful stop.

        Args:
            crawl_run_id: ApifyCrawlRun UUID

        Returns:
            True if paused successfully, False otherwise
        """
        logger.info(f"⏸️  Pausing crawl (graceful stop): {crawl_run_id}")
        return await self.stop_crawl(crawl_run_id)

    async def get_crawl_status(self, crawl_run_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """
        Get current status of a crawl run.

        Args:
            crawl_run_id: ApifyCrawlRun UUID

        Returns:
            Status dict with local and Apify data or None on error
        """
        # Get crawl run from database
        result = await self.db.execute(
            select(ApifyCrawlRun).where(ApifyCrawlRun.id == crawl_run_id)
        )
        crawl_run = result.scalar_one_or_none()

        if not crawl_run:
            logger.error(f"Crawl run not found: {crawl_run_id}")
            return None

        # Get live status from Apify if available
        apify_status = None
        if crawl_run.apify_run_id:
            apify_status = await self.apify_service.get_run_status(crawl_run.apify_run_id)

            # Update local database with latest status
            if apify_status:
                crawl_run.status = apify_status["status"]
                crawl_run.pages_crawled = apify_status.get("stats", {}).get("requestsFinished", 0)
                crawl_run.pages_failed = apify_status.get("stats", {}).get("requestsFailed", 0)

                if apify_status.get("finished_at"):
                    crawl_run.completed_at = datetime.fromisoformat(apify_status["finished_at"].replace("Z", "+00:00"))

                await self.db.commit()

        return {
            "id": str(crawl_run.id),
            "client_id": str(crawl_run.client_id),
            "apify_run_id": crawl_run.apify_run_id,
            "status": crawl_run.status,
            "total_pages": crawl_run.total_pages,
            "pages_crawled": crawl_run.pages_crawled,
            "pages_failed": crawl_run.pages_failed,
            "started_at": crawl_run.started_at.isoformat() if crawl_run.started_at else None,
            "completed_at": crawl_run.completed_at.isoformat() if crawl_run.completed_at else None,
            "apify_status": apify_status,
        }

    async def process_crawl_results(
        self,
        crawl_run_id: uuid.UUID,
        generate_embeddings: bool = True,
        calculate_similarity: bool = True,
    ) -> Dict[str, Any]:
        """
        Process completed crawl results: fetch data, generate embeddings, calculate similarity.

        This is called after a crawl completes (either manually or automatically).

        Args:
            crawl_run_id: ApifyCrawlRun UUID
            generate_embeddings: Whether to generate OpenAI embeddings
            calculate_similarity: Whether to calculate "similar to" recommendations

        Returns:
            Processing summary with counts and statistics
        """
        # Get crawl run
        result = await self.db.execute(
            select(ApifyCrawlRun).where(ApifyCrawlRun.id == crawl_run_id)
        )
        crawl_run = result.scalar_one_or_none()

        if not crawl_run:
            logger.error(f"Crawl run not found: {crawl_run_id}")
            return {"error": "Crawl run not found"}

        if not crawl_run.apify_run_id:
            logger.error(f"Crawl run has no Apify run ID: {crawl_run_id}")
            return {"error": "No Apify run ID"}

        logger.info(f"📥 Processing crawl results: {crawl_run.apify_run_id}")

        # Get Apify run status to get dataset ID
        apify_status = await self.apify_service.get_run_status(crawl_run.apify_run_id)

        if not apify_status:
            logger.error(f"Failed to get Apify status: {crawl_run.apify_run_id}")
            return {"error": "Failed to get Apify status"}

        dataset_id = apify_status.get("default_dataset_id")
        if not dataset_id:
            logger.error(f"No dataset ID in Apify status: {crawl_run.apify_run_id}")
            return {"error": "No dataset ID"}

        # Fetch dataset items
        items = await self.apify_service.get_dataset_items(dataset_id)

        if not items:
            logger.warning(f"No items in dataset: {dataset_id}")
            return {"pages_processed": 0, "embeddings_generated": 0}

        logger.info(f"✅ Fetched {len(items)} items from Apify dataset")

        # Process each item
        pages_processed = 0
        embeddings_generated = 0
        embedding_errors = 0

        for item in items:
            try:
                # Create or get ClientPage
                client_page = await self._get_or_create_client_page(
                    client_id=crawl_run.client_id,
                    url=item.get("url", ""),
                )

                if not client_page:
                    logger.warning(f"Failed to create ClientPage for URL: {item.get('url')}")
                    continue

                # Calculate version number (incremental)
                version = await self._get_next_version_number(client_page.id)

                # Create ClientPageVersion with all 83 columns
                page_version = await self._create_page_version(
                    client_page_id=client_page.id,
                    crawl_run_id=crawl_run.id,
                    version=version,
                    item=item,
                )

                pages_processed += 1

                # Generate embeddings if requested
                if generate_embeddings and page_version:
                    success = await self._generate_embeddings_for_page(page_version)
                    if success:
                        embeddings_generated += 1
                    else:
                        embedding_errors += 1

            except Exception as e:
                logger.error(f"Error processing item: {str(e)}", exc_info=True)

        # Calculate similarity if requested
        similarity_calculated = 0
        if calculate_similarity and embeddings_generated > 0:
            similarity_calculated = await self._calculate_similarity_for_crawl(crawl_run.id)

        # Update crawl run statistics
        crawl_run.pages_crawled = pages_processed
        crawl_run.status = "SUCCEEDED" if pages_processed > 0 else "FAILED"
        crawl_run.completed_at = datetime.utcnow()

        await self.db.commit()

        logger.info(
            f"✅ Crawl processing complete: {pages_processed} pages, "
            f"{embeddings_generated} embeddings, {similarity_calculated} similarities"
        )

        return {
            "pages_processed": pages_processed,
            "embeddings_generated": embeddings_generated,
            "embedding_errors": embedding_errors,
            "similarity_calculated": similarity_calculated,
        }

    async def _get_or_create_client_page(
        self,
        client_id: uuid.UUID,
        url: str,
    ) -> Optional[ClientPage]:
        """Get existing or create new ClientPage."""
        # Check if page exists
        result = await self.db.execute(
            select(ClientPage).where(
                ClientPage.client_id == client_id,
                ClientPage.url == url,
            )
        )
        page = result.scalar_one_or_none()

        if page:
            return page

        # Create new page
        page = ClientPage(
            client_id=client_id,
            url=url,
        )
        self.db.add(page)
        await self.db.commit()
        await self.db.refresh(page)

        return page

    async def _get_next_version_number(self, client_page_id: uuid.UUID) -> int:
        """Get next version number for a client page."""
        result = await self.db.execute(
            select(ClientPageVersion)
            .where(ClientPageVersion.client_page_id == client_page_id)
            .order_by(ClientPageVersion.version.desc())
        )
        latest = result.first()

        if latest:
            return latest[0].version + 1

        return 1

    async def _create_page_version(
        self,
        client_page_id: uuid.UUID,
        crawl_run_id: uuid.UUID,
        version: int,
        item: Dict[str, Any],
    ) -> Optional[ClientPageVersion]:
        """Create ClientPageVersion from Apify item data (all 83 columns)."""
        try:
            # Map all 83 Apify fields to ClientPageVersion model
            page_version = ClientPageVersion(
                client_page_id=client_page_id,
                crawl_run_id=crawl_run_id,
                version=version,

                # Core Metadata
                url=item.get("url"),
                slug=item.get("slug"),
                crawled_at=datetime.fromisoformat(item["crawledAt"].replace("Z", "+00:00")) if item.get("crawledAt") else None,
                load_time_ms=item.get("loadedTime"),
                http_status_code=item.get("httpStatusCode"),

                # Page Content
                page_title=item.get("metadata", {}).get("title"),
                meta_description=item.get("metadata", {}).get("description"),
                h1=item.get("metadata", {}).get("h1"),
                h2=item.get("metadata", {}).get("h2"),
                h3=item.get("metadata", {}).get("h3"),
                raw_text=item.get("text"),
                markdown=item.get("markdown"),
                html=item.get("html"),

                # SEO & Social
                canonical_url=item.get("metadata", {}).get("canonicalUrl"),
                og_title=item.get("metadata", {}).get("openGraph", {}).get("title"),
                og_description=item.get("metadata", {}).get("openGraph", {}).get("description"),
                og_image=item.get("metadata", {}).get("openGraph", {}).get("image"),
                twitter_title=item.get("metadata", {}).get("twitter", {}).get("title"),
                twitter_description=item.get("metadata", {}).get("twitter", {}).get("description"),
                twitter_image=item.get("metadata", {}).get("twitter", {}).get("image"),

                # Language & Locale
                language=item.get("metadata", {}).get("languageCode"),

                # Links
                internal_links=item.get("metadata", {}).get("jsonLd"),  # Simplified
                external_links=item.get("metadata", {}).get("jsonLd"),  # Simplified

                # Images
                screenshot_url=item.get("screenshotUrl"),

                # Metrics
                word_count=len(item.get("text", "").split()) if item.get("text") else 0,

                # Schema & Structured Data
                schema_types=item.get("metadata", {}).get("jsonLd"),

                # Author & Date
                author=item.get("metadata", {}).get("author"),
                published_date=item.get("metadata", {}).get("date"),
                modified_date=item.get("metadata", {}).get("modifiedTime"),
            )

            self.db.add(page_version)
            await self.db.commit()
            await self.db.refresh(page_version)

            return page_version

        except Exception as e:
            logger.error(f"Error creating page version: {str(e)}", exc_info=True)
            await self.db.rollback()
            return None

    async def _generate_embeddings_for_page(
        self,
        page_version: ClientPageVersion,
    ) -> bool:
        """Generate 3 embeddings for a page: raw_text, page_title, slug."""
        try:
            # Generate embedding for raw_text
            if page_version.raw_text:
                result = await self.embeddings_service.generate_embedding(
                    page_version.raw_text,
                    truncate=True,
                )
                if result:
                    embedding, tokens, cost = result
                    page_version.embedding_raw_text = embedding

            # Generate embedding for page_title
            if page_version.page_title:
                result = await self.embeddings_service.generate_embedding(
                    page_version.page_title,
                    truncate=True,
                )
                if result:
                    embedding, tokens, cost = result
                    page_version.embedding_page_title = embedding

            # Generate embedding for slug
            if page_version.slug:
                result = await self.embeddings_service.generate_embedding(
                    page_version.slug,
                    truncate=True,
                )
                if result:
                    embedding, tokens, cost = result
                    page_version.embedding_slug = embedding

            await self.db.commit()
            return True

        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}", exc_info=True)
            await self.db.rollback()
            return False

    async def _calculate_similarity_for_crawl(
        self,
        crawl_run_id: uuid.UUID,
    ) -> int:
        """Calculate 'similar to' for all pages in a crawl run."""
        # Get all page versions from this crawl
        result = await self.db.execute(
            select(ClientPageVersion).where(
                ClientPageVersion.crawl_run_id == crawl_run_id,
                ClientPageVersion.embedding_raw_text.isnot(None),
            )
        )
        pages = result.scalars().all()

        if not pages or len(pages) < 2:
            logger.info("Not enough pages with embeddings for similarity calculation")
            return 0

        similarity_count = 0

        # Calculate similarity for each page
        for page in pages:
            similar_pages = []

            # Compare with all other pages
            for other_page in pages:
                if page.id == other_page.id:
                    continue

                if not other_page.embedding_raw_text:
                    continue

                # Calculate cosine similarity
                similarity = self.embeddings_service.calculate_cosine_similarity(
                    page.embedding_raw_text,
                    other_page.embedding_raw_text,
                )

                similar_pages.append({
                    "page_id": str(other_page.id),
                    "url": other_page.url,
                    "title": other_page.page_title,
                    "similarity": float(similarity),
                })

            # Sort by similarity and keep top 10
            similar_pages.sort(key=lambda x: x["similarity"], reverse=True)
            page.similar_to = similar_pages[:10]

            similarity_count += 1

        await self.db.commit()

        logger.info(f"✅ Calculated similarity for {similarity_count} pages")

        return similarity_count


# Singleton instance
_crawler_service: Optional[CrawlerService] = None


def get_crawler_service(db: AsyncSession) -> CrawlerService:
    """
    Get CrawlerService instance.

    Args:
        db: Database session

    Returns:
        CrawlerService instance
    """
    return CrawlerService(db)
