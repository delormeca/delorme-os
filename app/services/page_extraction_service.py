"""
Page Extraction Service - Integrates Crawl4AI + HTML Parser with ClientPage storage.
Extracts all 24 data points from pages and stores in database.
"""
from typing import Optional, Dict, Any
import uuid
from datetime import datetime

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import ClientPage
from app.services.html_parser_service import HTMLParserService
from app.services.adaptive_timeout import AdaptiveTimeout


class PageExtractionService:
    """Service for extracting data from web pages and storing in database."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def extract_and_store_page(
        self,
        client_id: uuid.UUID,
        url: str,
        crawl_run_id: Optional[uuid.UUID] = None
    ) -> ClientPage:
        """
        Extract data from a URL and store in ClientPage.

        Args:
            client_id: Client UUID
            url: URL to extract data from
            crawl_run_id: Optional crawl run UUID

        Returns:
            ClientPage with extracted data
        """
        # Extract data from page
        extraction_result = await self.extract_page_data(url)

        # Create or update ClientPage
        page = await self._store_extraction_result(
            client_id=client_id,
            url=url,
            crawl_run_id=crawl_run_id,
            extraction_result=extraction_result
        )

        return page

    async def extract_page_data(
        self,
        url: str,
        use_stealth: bool = False,
        custom_timeout: Optional[int] = None,
        retry_attempt: int = 0,
        reuse_crawler: Optional[AsyncWebCrawler] = None
    ) -> Dict[str, Any]:
        """
        Extract all data points from a page using Crawl4AI + HTML Parser.

        Args:
            url: URL to extract data from
            use_stealth: Enable stealth mode to avoid bot detection
            custom_timeout: Override timeout (otherwise uses adaptive timeout)
            retry_attempt: Current retry attempt number (0 = first try)
            reuse_crawler: Optional pre-initialized crawler to reuse (CRITICAL for performance!)

        Returns:
            Dictionary with all extracted fields
        """
        # Get adaptive timeout and wait time
        timeout_seconds = custom_timeout or AdaptiveTimeout.get_timeout(url, attempt=retry_attempt)
        wait_time = AdaptiveTimeout.get_wait_time(url)

        # Configure crawler with JS support and adaptive settings
        crawler_config = CrawlerRunConfig(
            page_timeout=timeout_seconds * 1000,  # Convert to milliseconds
            wait_until="domcontentloaded",
            word_count_threshold=1,
            delay_before_return_html=wait_time,  # Adaptive wait for JS execution
            screenshot=True,
            screenshot_wait_for=1.0,
            fetch_ssl_certificate=True,
            cache_mode=CacheMode.BYPASS,  # CRITICAL: Avoid cached empty results for meta tags
            verbose=False,
        )

        try:
            # CRITICAL FIX: Reuse existing crawler instead of creating new one for each page
            if reuse_crawler:
                # Use the provided crawler (MUCH faster - no browser launch overhead!)
                # Disable logger to avoid Windows Unicode issues
                import logging
                logging.getLogger('crawl4ai').setLevel(logging.CRITICAL)

                # Crawl the page
                result = await reuse_crawler.arun(url=url, config=crawler_config)
            else:
                # Fallback: Create new crawler only if none provided (slower, for standalone use)
                # Configure browser with optional stealth mode
                extra_args = ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]

                if use_stealth:
                    # Add stealth arguments to avoid bot detection
                    extra_args.extend([
                        "--disable-blink-features=AutomationControlled",  # Hide automation
                        "--disable-features=IsolateOrigins,site-per-process",
                        "--disable-site-isolation-trials",
                    ])

                browser_config = BrowserConfig(
                    headless=True,
                    verbose=False,
                    extra_args=extra_args
                )

                async with AsyncWebCrawler(config=browser_config) as crawler:
                    # Disable logger to avoid Windows Unicode issues
                    import logging
                    logging.getLogger('crawl4ai').setLevel(logging.CRITICAL)

                    # Crawl the page
                    result = await crawler.arun(url=url, config=crawler_config)

            # Process result (same for both reused and new crawler)
            if not result.success:
                return {
                    'success': False,
                    'error_message': getattr(result, 'error_message', 'Unknown error'),
                    'url': url,
                }

            # Initialize extraction result
            extracted = {
                'success': True,
                'url': result.url,
                'status_code': getattr(result, 'status_code', None),
            }

            # Extract basic content
            if result.markdown:
                extracted['body_content'] = result.markdown
                extracted['word_count'] = len(result.markdown.split())

            # Extract screenshots (base64)
            if hasattr(result, 'screenshot') and result.screenshot:
                extracted['screenshot_url'] = result.screenshot
                extracted['screenshot_full_url'] = result.screenshot

            # Extract links and media from Crawl4AI
            if hasattr(result, 'links') and result.links:
                extracted['internal_links'] = result.links.get('internal', [])
                extracted['external_links'] = result.links.get('external', [])

            if hasattr(result, 'media') and result.media:
                media = result.media
                extracted['image_count'] = len(media.get('images', []))

            # Parse HTML for metadata
            if result.html:
                parser = HTMLParserService(result.html)
                html_data = parser.extract_all()

                # Merge HTML-parsed data
                extracted.update(html_data)

            return extracted

        except Exception as e:
            return {
                'success': False,
                'error_message': str(e),
                'url': url,
            }

    async def _store_extraction_result(
        self,
        client_id: uuid.UUID,
        url: str,
        crawl_run_id: Optional[uuid.UUID],
        extraction_result: Dict[str, Any]
    ) -> ClientPage:
        """
        Store extraction result in ClientPage model.

        Args:
            client_id: Client UUID
            url: Page URL
            crawl_run_id: Optional crawl run UUID
            extraction_result: Extracted data

        Returns:
            Created or updated ClientPage
        """
        from sqlmodel import select

        # Check if page already exists
        statement = select(ClientPage).where(
            ClientPage.client_id == client_id,
            ClientPage.url == url
        )
        result = await self.db.execute(statement)
        existing_page = result.scalar_one_or_none()

        if existing_page:
            page = existing_page
        else:
            page = ClientPage(
                client_id=client_id,
                url=url,
                crawl_run_id=crawl_run_id,
                created_at=datetime.utcnow()
            )
            self.db.add(page)

        # Update fields from extraction
        success = extraction_result.get('success', False)

        if not success:
            page.is_failed = True
            page.failure_reason = extraction_result.get('error_message', 'Extraction failed')
        else:
            page.is_failed = False
            page.failure_reason = None

            # Core fields
            page.status_code = extraction_result.get('status_code')
            page.last_crawled_at = datetime.utcnow()

            # SEO Data Points
            page.page_title = extraction_result.get('page_title')
            page.meta_title = extraction_result.get('meta_title')
            page.meta_description = extraction_result.get('meta_description')
            page.h1 = extraction_result.get('h1')
            page.canonical_url = extraction_result.get('canonical_url')
            page.word_count = extraction_result.get('word_count')

            # Hreflang - convert to JSON string if it's a list
            hreflang = extraction_result.get('hreflang')
            if hreflang:
                import json
                page.hreflang = json.dumps(hreflang) if isinstance(hreflang, list) else hreflang

            page.meta_robots = extraction_result.get('meta_robots')

            # Content
            page.body_content = extraction_result.get('body_content')

            # Webpage structure - store as JSON
            webpage_structure = extraction_result.get('webpage_structure')
            if webpage_structure:
                page.webpage_structure = webpage_structure

            # Heading structure - store as JSON
            heading_structure = extraction_result.get('heading_structure')
            if heading_structure:
                # Store in webpage_structure under 'heading_structure' key
                if page.webpage_structure:
                    page.webpage_structure['heading_structure'] = heading_structure
                else:
                    page.webpage_structure = {'heading_structure': heading_structure}

            # Schema markup - store as JSON
            schema_markup = extraction_result.get('schema_markup')
            if schema_markup:
                page.schema_markup = schema_markup

            # Links - store as JSON
            internal_links = extraction_result.get('internal_links')
            if internal_links:
                page.internal_links = internal_links

            external_links = extraction_result.get('external_links')
            if external_links:
                page.external_links = external_links

            page.image_count = extraction_result.get('image_count')

            # Screenshots (base64 strings - store as data URLs for browser display)
            screenshot = extraction_result.get('screenshot_url')
            if screenshot:
                # Store screenshot as base64 data URL for browser display
                if screenshot.startswith('data:image'):
                    page.screenshot_url = screenshot
                elif screenshot.startswith('iVBOR') or screenshot.startswith('/9j/'):
                    # Raw base64 - add data URL prefix (PNG or JPEG)
                    image_type = 'png' if screenshot.startswith('iVBOR') else 'jpeg'
                    page.screenshot_url = f"data:image/{image_type};base64,{screenshot}"
                else:
                    page.screenshot_url = screenshot

            screenshot_full = extraction_result.get('screenshot_full_url')
            if screenshot_full:
                # Store full screenshot as base64 data URL
                if screenshot_full.startswith('data:image'):
                    page.screenshot_full_url = screenshot_full
                elif screenshot_full.startswith('iVBOR') or screenshot_full.startswith('/9j/'):
                    image_type = 'png' if screenshot_full.startswith('iVBOR') else 'jpeg'
                    page.screenshot_full_url = f"data:image/{image_type};base64,{screenshot_full}"
                else:
                    page.screenshot_full_url = screenshot_full

        page.last_checked_at = datetime.utcnow()
        page.updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(page)

        return page
