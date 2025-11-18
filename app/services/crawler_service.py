""" 
Apify Crawler Service

Handles crawl operations using Apify's Website Content Crawler.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Client, ApifyCrawlRun, ClientPage, ClientPageVersion, PageSource
from app.services.apify_service import ApifyService
from app.utils.helpers import get_utcnow

logger = logging.getLogger(__name__)


class CrawlerService:
    """Service for managing Apify crawls."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.apify_service = ApifyService()

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
            crawl_run.completed_at = get_utcnow()
            await self.db.commit()
            logger.error(f"Failed to start Apify crawl for client: {client_id}")
            return None

        # Update crawl run with Apify run ID
        crawl_run.apify_run_id = apify_result["run_id"]
        crawl_run.status = "running"
        crawl_run.started_at = get_utcnow()
        await self.db.commit()

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
        success = await self.apify_service.abort_run(crawl_run.apify_run_id)

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

                if apify_status["status"] in ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]:
                    crawl_run.completed_at = get_utcnow()

                # Update progress
                if "stats" in apify_status:
                    crawl_run.pages_crawled = apify_status["stats"].get("requestsFinished", 0)
                    crawl_run.pages_failed = apify_status["stats"].get("requestsFailed", 0)

                await self.db.commit()

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
            "apify_status": apify_status,
        }

    async def process_crawl_results(
        self,
        crawl_run_id: UUID,
        generate_embeddings: bool = True,
        calculate_similarity: bool = True,
    ) -> Dict[str, Any]:
        """Process completed crawl results."""
        # Get crawl run
        result = await self.db.execute(
            select(ApifyCrawlRun).where(ApifyCrawlRun.id == crawl_run_id)
        )
        crawl_run = result.scalar_one_or_none()

        if not crawl_run or not crawl_run.apify_run_id:
            return {"error": "Crawl run not found"}

        if crawl_run.status not in ["succeeded", "completed"]:
            return {"error": f"Crawl not complete. Status: {crawl_run.status}"}

        # Fetch results from Apify dataset
        logger.info(f"Fetching results for crawl run: {crawl_run_id}")
        items = await self.apify_service.get_dataset_items(crawl_run.apify_run_id)

        if not items:
            return {"error": "No results found in Apify dataset"}

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

        logger.info(f"✓ Processed {pages_processed} pages from crawl: {crawl_run_id}")

        # TODO: Generate embeddings (if enabled)
        # TODO: Calculate similarity (if enabled)

        return {
            "pages_processed": pages_processed,
            "embeddings_generated": embeddings_generated,
            "embedding_errors": embedding_errors,
            "similarity_calculated": 0,
        }


def get_crawler_service(db: AsyncSession) -> CrawlerService:
    """Get crawler service instance."""
    return CrawlerService(db)
