"""
Apify Crawler Service

Handles crawl operations using Apify's Website Content Crawler.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging
from pathlib import Path

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Client, ApifyCrawlRun, ClientPage, ClientPageVersion, PageSource
from app.services.apify_service import ApifyService
from app.services.crawl_storage_service import CrawlStorageService
from app.utils.helpers import get_utcnow

logger = logging.getLogger(__name__)


class CrawlerService:
    """Service for managing Apify crawls."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.apify_service = ApifyService()
        self.storage_service = CrawlStorageService()

    async def start_crawl(
        self,
        client_id: UUID,
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
        client_website_url = client.website_url

        # If no URLs provided (None or empty list), fetch all URLs from ClientPage table
        if not urls:  # This handles both None and empty list []
            logger.info(f"📋 No URLs provided, fetching from ClientPage table for client: {client_id}")

            # Fetch all pages for this client
            pages_result = await self.db.execute(
                select(ClientPage).where(ClientPage.client_id == client_id)
            )
            client_pages = pages_result.scalars().all()

            if not client_pages:
                # Fall back to client website_url if no pages in database
                if not client_website_url:
                    logger.error(f"No URLs in ClientPage and client has no website_url: {client_id}")
                    return None
                logger.info(f"No pages in ClientPage, using website_url: {client_website_url}")
                urls = [client_website_url]
            else:
                # Extract URLs from ClientPage records
                urls = [page.url for page in client_pages]
                logger.info(f"✅ Found {len(urls)} URLs in ClientPage table for client: {client_id}")
        else:
            logger.info(f"📝 Using {len(urls)} custom URLs provided by user")

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

        # Calculate timeout based on number of URLs
        # Estimate: 5 seconds per page + 50% safety margin + 300 second base
        estimated_time_per_page = 5  # seconds
        safety_margin = 1.5  # 50% extra time
        base_timeout = 300  # 5 minutes minimum
        calculated_timeout = int((len(urls) * estimated_time_per_page * safety_margin) + base_timeout)

        # Cap at 2 hours (7200 seconds) to avoid excessive waits
        max_timeout = 7200
        timeout_secs = min(calculated_timeout, max_timeout)

        logger.info(f"⏱️  Calculated timeout: {timeout_secs}s for {len(urls)} URLs (max: {max_timeout}s)")

        # Start Apify crawl
        apify_result = await self.apify_service.start_crawl(
            urls=urls,
            client_name=client_name,
            max_depth=max_depth,
            save_html=save_html,
            save_markdown=save_markdown,
            save_screenshots=save_screenshots,
            timeout_secs=timeout_secs,  # Pass calculated timeout
        )

        if not apify_result:
            # Update status to failed
            crawl_run.status = "failed"
            crawl_run.completed_at = get_utcnow()
            await self.db.commit()
            logger.error(f"Failed to start Apify crawl for client: {client_id}")
            return None

        # Update crawl run with Apify run ID
        crawl_run.apify_run_id = apify_result["run_id"]
        crawl_run.apify_dataset_id = apify_result.get("default_dataset_id")
        crawl_run.status = "running"
        crawl_run.started_at = get_utcnow()
        await self.db.commit()
        await self.db.refresh(crawl_run)

        logger.info(f"✓ Apify crawl started: {crawl_run.apify_run_id}")

        return crawl_run

    async def stop_crawl(self, crawl_run_id: UUID) -> bool:
        """Stop a running crawl."""
        # Get crawl run
        result = await self.db.execute(
            select(ApifyCrawlRun).where(ApifyCrawlRun.id == crawl_run_id)
        )
        crawl_run = result.scalar_one_or_none()

        if not crawl_run or not crawl_run.apify_run_id:
            return False

        # Stop in Apify
        success = await self.apify_service.stop_crawl(crawl_run.apify_run_id)

        if success:
            crawl_run.status = "aborted"
            crawl_run.completed_at = get_utcnow()
            await self.db.commit()

        return success

    async def pause_crawl(self, crawl_run_id: UUID) -> bool:
        """Pause a running crawl (graceful stop)."""
        # Apify doesn't support native pause, so we just do a graceful stop
        return await self.stop_crawl(crawl_run_id)

    async def get_crawl_status(self, crawl_run_id: UUID) -> Optional[Dict[str, Any]]:
        """Get current status of a crawl run."""
        # Get crawl run from database
        result = await self.db.execute(
            select(ApifyCrawlRun).where(ApifyCrawlRun.id == crawl_run_id)
        )
        crawl_run = result.scalar_one_or_none()

        if not crawl_run:
            return None

        # If crawl is running, get latest status from Apify
        apify_status = None
        if crawl_run.apify_run_id and crawl_run.status in ["starting", "running"]:
            apify_status = await self.apify_service.get_run_status(crawl_run.apify_run_id)

            if apify_status:
                # Update database with latest info
                crawl_run.status = apify_status["status"].lower()

                # Store dataset ID if available
                if "default_dataset_id" in apify_status and apify_status["default_dataset_id"]:
                    crawl_run.apify_dataset_id = apify_status["default_dataset_id"]

                if apify_status["status"] in ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]:
                    crawl_run.completed_at = get_utcnow()

                # Update progress
                if "stats" in apify_status:
                    crawl_run.pages_crawled = apify_status["stats"].get("requestsFinished", 0)
                    crawl_run.pages_failed = apify_status["stats"].get("requestsFailed", 0)

                await self.db.commit()
                await self.db.refresh(crawl_run)

        # AUTO-DOWNLOAD: Automatically download JSON when crawl completes
        # This happens on status polling, so user doesn't need to click "Download"
        terminal_statuses = ["succeeded", "failed", "aborted", "timed-out"]
        if (crawl_run.status in terminal_statuses and
            crawl_run.pages_crawled > 0 and
            not crawl_run.json_storage_path and
            crawl_run.apify_dataset_id):

            logger.info(f"📋 Auto-downloading JSON for completed crawl: run_id={crawl_run_id}, status={crawl_run.status}")
            try:
                # Trigger automatic download
                download_result = await self.download_to_json(crawl_run_id)

                # Refresh crawl_run to get updated json_storage_path
                await self.db.refresh(crawl_run)

                if "error" not in download_result:
                    logger.info(f"✅ Auto-download complete: {download_result.get('items_downloaded', 0)} pages")
                else:
                    logger.error(f"❌ Auto-download failed: {download_result.get('error')}")
            except Exception as e:
                logger.error(f"❌ Error during auto-download: {str(e)}", exc_info=True)

        return {
            "id": str(crawl_run.id),
            "client_id": str(crawl_run.client_id),
            "apify_run_id": crawl_run.apify_run_id,
            "status": crawl_run.status.upper(),
            "total_pages": crawl_run.total_pages,
            "pages_crawled": crawl_run.pages_crawled,
            "pages_failed": crawl_run.pages_failed,
            "started_at": crawl_run.started_at.isoformat() if crawl_run.started_at else None,
            "completed_at": crawl_run.completed_at.isoformat() if crawl_run.completed_at else None,
            "json_storage_path": crawl_run.json_storage_path,  # Include for frontend
            "apify_status": apify_status,
        }

    async def download_to_json(
        self,
        crawl_run_id: UUID
    ) -> Dict[str, Any]:
        """
        Phase 1: Download crawl results from Apify and save to JSON file.

        Fetches dataset items from Apify and stores them in storage/crawls/
        with metadata header for future processing.
        """
        # Get crawl run
        result = await self.db.execute(
            select(ApifyCrawlRun).where(ApifyCrawlRun.id == crawl_run_id)
        )
        crawl_run = result.scalar_one_or_none()

        if not crawl_run:
            return {
                "error": "Crawl run not found",
                "crawl_run_id": str(crawl_run_id)
            }

        # Allow download for any crawl that has pages (including partial crawls)
        # This supports SUCCEEDED, ABORTED, TIMED-OUT, FAILED statuses
        if crawl_run.pages_crawled <= 0:
            return {
                "error": f"No pages were crawled. Cannot download empty dataset. Status: {crawl_run.status}",
                "crawl_run_id": str(crawl_run_id),
                "status": crawl_run.status,
                "pages_crawled": crawl_run.pages_crawled
            }

        # Check dataset_id is present
        if not crawl_run.apify_dataset_id:
            return {
                "error": "Dataset ID not available. Crawl may not have completed properly.",
                "crawl_run_id": str(crawl_run_id)
            }

        # Fetch dataset items from Apify
        logger.info(f"Fetching dataset items from Apify: dataset_id={crawl_run.apify_dataset_id}")
        items = await self.apify_service.get_dataset_items(crawl_run.apify_dataset_id)

        if not items:
            return {
                "error": "No items found in Apify dataset",
                "crawl_run_id": str(crawl_run_id),
                "dataset_id": crawl_run.apify_dataset_id
            }

        # Get client for metadata
        client_result = await self.db.execute(
            select(Client).where(Client.id == crawl_run.client_id)
        )
        client = client_result.scalar_one_or_none()

        # Save to JSON using storage service
        json_path = await self.storage_service.save_crawl_json(
            crawl_run_id=str(crawl_run_id),
            client_id=crawl_run.client_id,
            dataset_items=items,
            apify_dataset_id=crawl_run.apify_dataset_id,
            client_name=client.name if client else None
        )

        # Update crawl_run with json_storage_path
        crawl_run.json_storage_path = json_path
        await self.db.commit()

        # Calculate file size
        file_size_bytes = Path(json_path).stat().st_size
        file_size_mb = file_size_bytes / (1024 * 1024)

        logger.info(
            f"Downloaded crawl to JSON: run_id={crawl_run_id}, "
            f"items={len(items)}, size={file_size_mb:.2f}MB"
        )

        return {
            "crawl_run_id": str(crawl_run_id),
            "json_storage_path": json_path,
            "total_items": len(items),
            "file_size_mb": round(file_size_mb, 2),
            "message": f"Successfully downloaded {len(items)} items to JSON"
        }

    async def _process_items_to_database(
        self,
        items: List[Dict[str, Any]],
        crawl_run: ApifyCrawlRun,
        generate_embeddings: bool,
        calculate_similarity: bool
    ) -> Dict[str, Any]:
        """
        Process crawl items and insert into database.

        This method is used by both the old process_crawl_results endpoint
        and the new import_from_json endpoint to avoid code duplication.
        """
        pages_processed = 0
        embeddings_generated = 0
        embedding_errors = 0

        for item in items:
            url = item.get("url")
            if not url:
                continue

            # Get or create ClientPage
            page_result = await self.db.execute(
                select(ClientPage).where(
                    ClientPage.client_id == crawl_run.client_id,
                    ClientPage.url == url
                )
            )
            page = page_result.scalar_one_or_none()

            if not page:
                # Create new page
                url_parts = url.rstrip('/').split('/')
                slug = url_parts[-1] if len(url_parts) > 3 else ''

                page = ClientPage(
                    client_id=crawl_run.client_id,
                    url=url,
                    slug=slug,
                    source=PageSource.CRAWLER_AUTO,
                    created_at=get_utcnow(),
                    updated_at=get_utcnow()
                )
                self.db.add(page)
                await self.db.commit()
                await self.db.refresh(page)

            # Create ClientPageVersion with all 83 datapoints from Apify
            version = ClientPageVersion(
                page_id=page.id,
                crawl_run_id=crawl_run.id,
                url=url,
                slug=page.slug,
                # Map all Apify fields to our schema
                page_title=item.get("pageTitle"),
                meta_title=item.get("metaTitle"),
                meta_description=item.get("metaDescription"),
                h1=item.get("h1"),
                canonical_url=item.get("canonicalUrl"),
                meta_robots=item.get("metaRobots"),
                word_count=item.get("wordCount"),
                status_code=item.get("httpStatusCode"),
                publishing_date=item.get("publishingDate"),
                last_modified=item.get("lastModified"),
                h1_count=item.get("h1Count"),
                h2_count=item.get("h2Count"),
                h3_count=item.get("h3Count"),
                h4_count=item.get("h4Count"),
                h5_count=item.get("h5Count"),
                h6_count=item.get("h6Count"),
                h1_list=item.get("h1List"),
                webpage_structure=item.get("webpageStructure"),
                raw_text=item.get("text"),
                markdown_text=item.get("markdown"),
                character_count=item.get("characterCount"),
                readability_score=item.get("readabilityScore"),
                page_weight_kb=item.get("pageWeightKb"),
                page_weight_mb=item.get("pageWeightMb"),
                load_time_ms=item.get("loadTimeMs"),
                meta_keywords=item.get("metaKeywords"),
                meta_viewport=item.get("metaViewport"),
                meta_generator=item.get("metaGenerator"),
                schema_markup=item.get("schemaMarkup"),
                schema_types=item.get("schemaTypes"),
                hreflang=item.get("hreflang"),
                internal_links=item.get("internalLinks"),
                internal_link_count=item.get("internalLinkCount"),
                external_links=item.get("externalLinks"),
                external_link_count=item.get("externalLinkCount"),
                total_link_count=item.get("totalLinkCount"),
                image_count=item.get("imageCount"),
                image_alt_texts=item.get("imageAltTexts"),
                video_count=item.get("videoCount"),
                iframe_count=item.get("iframeCount"),
                og_title=item.get("ogTitle"),
                og_description=item.get("ogDescription"),
                og_image=item.get("ogImage"),
                og_type=item.get("ogType"),
                og_url=item.get("ogUrl"),
                og_site_name=item.get("ogSiteName"),
                og_locale=item.get("ogLocale"),
                twitter_card=item.get("twitterCard"),
                twitter_title=item.get("twitterTitle"),
                twitter_description=item.get("twitterDescription"),
                twitter_image=item.get("twitterImage"),
                twitter_site=item.get("twitterSite"),
                twitter_creator=item.get("twitterCreator"),
                fb_app_id=item.get("fbAppId"),
                fb_admins=item.get("fbAdmins"),
                http_status_code=item.get("httpStatusCode"),
                apify_loaded_url=item.get("loadedUrl"),
                apify_loaded_time=item.get("loadedTime"),
                apify_referrer_url=item.get("referrerUrl"),
                apify_crawl_depth=item.get("crawlDepth"),
                apify_request_handler_mode=item.get("requestHandlerMode"),
                apify_has_html=item.get("hasHtml"),
                apify_has_markdown=item.get("hasMarkdown"),
                apify_has_screenshot=item.get("hasScreenshot"),
                screenshot_url=item.get("screenshotUrl"),
                screenshot_file=item.get("screenshotFile"),
                html_lang=item.get("htmlLang"),
                html_dir=item.get("htmlDir"),
                charset=item.get("charset"),
                favicon=item.get("favicon"),
                form_count=item.get("formCount"),
                input_count=item.get("inputCount"),
                button_count=item.get("buttonCount"),
                script_count=item.get("scriptCount"),
                style_count=item.get("styleCount"),
                external_scripts=item.get("externalScripts"),
                external_stylesheets=item.get("externalStylesheets"),
                language=item.get("language"),
                author=item.get("author"),
                crawled_at=get_utcnow(),
            )
            self.db.add(version)
            pages_processed += 1

        await self.db.commit()

        logger.info(f"✓ Processed {pages_processed} pages from crawl run")

        # TODO: Generate embeddings (if enabled)
        # TODO: Calculate similarity (if enabled)

        return {
            "pages_processed": pages_processed,
            "embeddings_generated": embeddings_generated,
            "embedding_errors": embedding_errors,
            "similarity_calculated": 0,
        }

    async def process_crawl_results(
        self,
        crawl_run_id: UUID,
        generate_embeddings: bool = True,
        calculate_similarity: bool = True,
    ) -> Dict[str, Any]:
        """Process completed crawl results (legacy endpoint - fetches from Apify)."""
        # Get crawl run
        result = await self.db.execute(
            select(ApifyCrawlRun).where(ApifyCrawlRun.id == crawl_run_id)
        )
        crawl_run = result.scalar_one_or_none()

        if not crawl_run:
            return {"error": "Crawl run not found"}

        if crawl_run.status not in ["succeeded", "completed"]:
            return {"error": f"Crawl not complete. Status: {crawl_run.status}"}

        # Check dataset_id is available
        if not crawl_run.apify_dataset_id:
            return {
                "error": "Dataset ID not available. Run may not have completed yet.",
                "pages_processed": 0,
                "embeddings_generated": 0,
                "embedding_errors": 0,
                "similarity_calculated": 0
            }

        # Fetch results from Apify dataset using dataset_id (not run_id)
        logger.info(f"Fetching results for crawl run: {crawl_run_id}, dataset_id: {crawl_run.apify_dataset_id}")
        items = await self.apify_service.get_dataset_items(crawl_run.apify_dataset_id)

        if not items:
            return {"error": "No results found in Apify dataset"}

        # Use refactored processing method
        return await self._process_items_to_database(
            items=items,
            crawl_run=crawl_run,
            generate_embeddings=generate_embeddings,
            calculate_similarity=calculate_similarity
        )

    async def import_from_json(
        self,
        crawl_run_id: UUID,
        generate_embeddings: bool = True,
        calculate_similarity: bool = True,
    ) -> Dict[str, Any]:
        """
        Phase 2: Import crawl results from JSON file into database.

        This endpoint loads the JSON file created by download_to_json()
        and processes all items into the database. Can be run multiple times.
        """
        # Get crawl run
        result = await self.db.execute(
            select(ApifyCrawlRun).where(ApifyCrawlRun.id == crawl_run_id)
        )
        crawl_run = result.scalar_one_or_none()

        if not crawl_run:
            return {"error": "Crawl run not found"}

        # Check JSON file exists
        if not crawl_run.json_storage_path:
            return {
                "error": "No JSON file available. Run download-json first.",
                "crawl_run_id": str(crawl_run_id)
            }

        # Load JSON file
        logger.info(f"Loading crawl data from JSON: {crawl_run.json_storage_path}")
        data = await self.storage_service.load_crawl_json(str(crawl_run_id))

        if not data:
            return {
                "error": f"Failed to load JSON file: {crawl_run.json_storage_path}",
                "crawl_run_id": str(crawl_run_id)
            }

        # Extract items from JSON
        items = data.get("items", [])

        if not items:
            return {
                "error": "No items found in JSON file",
                "crawl_run_id": str(crawl_run_id)
            }

        logger.info(f"Loaded {len(items)} items from JSON")

        # Use refactored processing method
        return await self._process_items_to_database(
            items=items,
            crawl_run=crawl_run,
            generate_embeddings=generate_embeddings,
            calculate_similarity=calculate_similarity
        )


def get_crawler_service(db: AsyncSession) -> CrawlerService:
    """Get crawler service instance."""
    return CrawlerService(db)
