"""
Robust Page Crawler Service - Production-ready Crawl4AI implementation.

Features:
- Retry logic with intelligent error classification
- Dynamic rate limiting with random delays
- Comprehensive validation of extracted data
- Stealth mode auto-activation on bot detection
- 429/503 handling with exponential backoff
- Response header capture
- DOM extraction optimized for JS-heavy sites

Based on PDF recommendations + existing codebase patterns.
"""
import asyncio
import random
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import ClientPage
from app.services.html_parser_service import HTMLParserService
from app.services.adaptive_timeout import AdaptiveTimeout
from app.services.crawl_error_classifier import ErrorClassifier, ErrorCategory
from app.services.screenshot_storage import ScreenshotStorage
from app.config.base import config

logger = logging.getLogger(__name__)


class ExtractionValidation:
    """Validates extracted data completeness and quality."""

    @staticmethod
    def validate_extraction(extracted: Dict[str, Any], url: str) -> Dict[str, Any]:
        """
        Validate extracted data and add warnings/metrics.

        Args:
            extracted: Extraction result dictionary
            url: URL being validated

        Returns:
            Updated extraction dictionary with validation results
        """
        validation_issues = []
        validation_warnings = []

        # Critical field checks
        if not extracted.get('page_title') and not extracted.get('meta_title'):
            validation_issues.append("missing_title")
            logger.warning(f"⚠️ No title found for {url}")

        if not extracted.get('meta_description'):
            validation_warnings.append("missing_meta_description")
            logger.info(f"ℹ️ No meta description for {url}")

        if not extracted.get('h1'):
            validation_warnings.append("missing_h1")

        # Content quality checks
        word_count = extracted.get('word_count', 0)
        if word_count < 50:
            validation_warnings.append("thin_content")
            logger.warning(f"⚠️ Thin content on {url}: {word_count} words")

        # Canonical check
        canonical = extracted.get('canonical_url')
        if canonical and canonical != url:
            validation_warnings.append("canonical_differs")
            logger.info(f"ℹ️ Canonical URL differs: {canonical} vs {url}")

        # Add validation metadata
        extracted['validation'] = {
            'has_issues': len(validation_issues) > 0,
            'issues': validation_issues,
            'warnings': validation_warnings,
            'validated_at': datetime.utcnow().isoformat(),
        }

        # Quality score (0-100)
        quality_score = 100
        quality_score -= len(validation_issues) * 20  # Major issues
        quality_score -= len(validation_warnings) * 5  # Minor issues
        extracted['validation']['quality_score'] = max(0, quality_score)

        return extracted

    @staticmethod
    def check_dom_rendered(html: str) -> bool:
        """
        Check if page appears to be fully rendered (not just skeleton).

        Args:
            html: HTML content

        Returns:
            True if DOM appears complete
        """
        # Check for common signs of incomplete rendering
        if not html or len(html) < 100:
            return False

        # Check for React/Vue root elements with no content
        if '<div id="root"></div>' in html or '<div id="app"></div>' in html:
            logger.warning("⚠️ Detected empty root element - JS may not have rendered")
            return False

        return True


class RateLimiter:
    """Dynamic rate limiter with 429/503 detection and exponential backoff."""

    def __init__(self):
        self.base_delay = (1.0, 3.0)  # Random delay range
        self.rate_limit_delay = 2.0  # Additional delay after rate limit
        self.consecutive_rate_limits = 0

    async def wait(self, status_code: Optional[int] = None):
        """
        Wait before next request with intelligent delay.

        Args:
            status_code: HTTP status code from last request
        """
        # Check for rate limiting
        if status_code in [429, 503]:
            self.consecutive_rate_limits += 1
            # Exponential backoff for rate limits
            backoff_delay = min(self.rate_limit_delay * (2 ** self.consecutive_rate_limits), 60)
            logger.warning(f"⚠️ Rate limit detected (429/503), waiting {backoff_delay:.1f}s")
            await asyncio.sleep(backoff_delay)
        else:
            # Reset rate limit counter on success
            self.consecutive_rate_limits = 0
            # Random delay to appear human
            delay = random.uniform(*self.base_delay)
            await asyncio.sleep(delay)


class RobustPageCrawler:
    """
    Production-ready page crawler with retry logic, validation, and rate limiting.

    Usage:
        async with RobustPageCrawler(db) as crawler:
            result = await crawler.extract_page_data(url)

            # Or batch crawl
            results = await crawler.crawl_batch(urls)
    """

    def __init__(self, db: Optional[AsyncSession] = None):
        """
        Initialize robust crawler.

        Args:
            db: Optional database session for storage
        """
        self.db = db
        self.rate_limiter = RateLimiter()
        self.screenshot_storage = ScreenshotStorage()
        self._crawler = None

    async def __aenter__(self):
        """Context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - cleanup."""
        if self._crawler:
            await self._crawler.__aexit__(None, None, None)
            self._crawler = None

    async def extract_page_data(
        self,
        url: str,
        max_retries: Optional[int] = None,
        use_stealth: bool = False,
        custom_timeout: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Extract all data from a page with intelligent retry logic.

        Args:
            url: URL to extract from
            max_retries: Maximum retry attempts (defaults to config)
            use_stealth: Force stealth mode (auto-enabled on bot detection)
            custom_timeout: Override timeout

        Returns:
            Dictionary with extracted data and metadata
        """
        if max_retries is None:
            max_retries = config.crawl_retry_attempts

        last_error_category = None
        last_error_message = ""

        for attempt in range(max_retries):
            try:
                # Determine if stealth mode should be enabled
                enable_stealth = use_stealth or (
                    last_error_category == ErrorCategory.BOT_DETECTION
                )

                # Increase timeout on retry if needed
                timeout = custom_timeout
                if timeout is None:
                    timeout = AdaptiveTimeout.get_timeout(url, attempt=attempt)
                    if last_error_category and ErrorClassifier.should_increase_timeout(last_error_category):
                        timeout = int(timeout * 1.5)

                logger.info(
                    f"🕷️  Attempt {attempt + 1}/{max_retries} for {url} "
                    f"(timeout={timeout}s, stealth={enable_stealth})"
                )

                # Attempt extraction
                result = await self._extract_once(
                    url=url,
                    timeout=timeout,
                    use_stealth=enable_stealth,
                    retry_attempt=attempt,
                )

                # Check success
                if result.get('success'):
                    # Validate extraction
                    result = ExtractionValidation.validate_extraction(result, url)

                    logger.info(
                        f"✅ Successfully extracted {url} "
                        f"(quality={result['validation']['quality_score']})"
                    )
                    return result

                # Extraction failed - classify error
                error_message = result.get('error_message', 'Unknown error')
                status_code = result.get('status_code')

                error_category, should_retry = ErrorClassifier.classify_error(
                    error_message,
                    status_code
                )

                last_error_category = error_category
                last_error_message = error_message

                logger.warning(
                    f"⚠️ Attempt {attempt + 1} failed: {error_category.value} - {error_message[:100]}"
                )

                # Check if we should retry
                if not should_retry:
                    logger.error(f"❌ Error not retryable: {error_category.value}")
                    result['retry_info'] = {
                        'attempts': attempt + 1,
                        'error_category': error_category.value,
                        'retryable': False,
                    }
                    return result

                # Last attempt - don't delay
                if attempt == max_retries - 1:
                    result['retry_info'] = {
                        'attempts': max_retries,
                        'error_category': error_category.value,
                        'retryable': True,
                    }
                    return result

                # Calculate retry delay
                retry_delay = ErrorClassifier.get_retry_delay(attempt, error_category)
                logger.info(f"🔄 Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)

            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error(f"❌ Unexpected error on attempt {attempt + 1}: {e}", exc_info=True)
                last_error_message = str(e)

                if attempt == max_retries - 1:
                    return {
                        'success': False,
                        'url': url,
                        'error_message': f"Failed after {max_retries} attempts: {last_error_message}",
                        'retry_info': {
                            'attempts': max_retries,
                            'error_category': 'exception',
                            'retryable': True,
                        }
                    }

                await asyncio.sleep(2 ** attempt)

        # Should not reach here, but fallback
        return {
            'success': False,
            'url': url,
            'error_message': f"Failed after {max_retries} attempts: {last_error_message}",
        }

    async def _extract_once(
        self,
        url: str,
        timeout: int,
        use_stealth: bool,
        retry_attempt: int,
    ) -> Dict[str, Any]:
        """
        Single extraction attempt without retry logic.

        Args:
            url: URL to extract
            timeout: Timeout in seconds
            use_stealth: Enable stealth mode
            retry_attempt: Current retry attempt number

        Returns:
            Extraction result
        """
        # Configure browser with stealth if needed
        extra_args = [
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--window-size=1920,1080",  # Consistent viewport
        ]

        if use_stealth:
            # Stealth mode arguments
            extra_args.extend([
                "--disable-blink-features=AutomationControlled",
                "--disable-features=IsolateOrigins,site-per-process",
                "--disable-site-isolation-trials",
            ])
            logger.info(f"🥷 Stealth mode enabled for {url}")

        # Realistic user agent
        user_agent = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )

        browser_config = BrowserConfig(
            headless=True,
            verbose=False,
            extra_args=extra_args,
            user_agent=user_agent,
        )

        # Get adaptive wait time
        wait_time = AdaptiveTimeout.get_wait_time(url)

        # Configure crawler - CRITICAL: wait_until="networkidle" for JS rendering
        crawler_config = CrawlerRunConfig(
            # Timing
            page_timeout=timeout * 1000,  # Convert to milliseconds
            wait_until="networkidle",  # ✅ CRITICAL: Wait for AJAX/JS completion
            delay_before_return_html=wait_time,  # Additional wait for JS execution

            # Content extraction
            word_count_threshold=1,  # Accept any content
            remove_overlay_elements=True,  # Remove popups/modals

            # Bot detection prevention
            simulate_user=True,  # Human-like behavior
            override_navigator=True,  # Hide automation

            # Screenshots
            screenshot=True,
            screenshot_wait_for=1.0,

            # Security & compliance
            fetch_ssl_certificate=True,
            check_robots_txt=True,  # ✅ Respect robots.txt

            # Caching
            cache_mode=CacheMode.BYPASS,  # Always fresh data

            # Misc
            verbose=False,
        )

        try:
            # Create or reuse crawler
            if self._crawler is None:
                self._crawler = AsyncWebCrawler(config=browser_config)
                await self._crawler.__aenter__()

                # Suppress Crawl4AI logger
                import logging as std_logging
                std_logging.getLogger('crawl4ai').setLevel(std_logging.CRITICAL)

            # Perform crawl
            result = await self._crawler.arun(url=url, config=crawler_config)

            if not result.success:
                return {
                    'success': False,
                    'url': url,
                    'error_message': getattr(result, 'error_message', 'Unknown crawl error'),
                    'status_code': getattr(result, 'status_code', None),
                }

            # Initialize extraction result
            extracted = {
                'success': True,
                'url': result.url,  # Final URL after redirects
                'status_code': getattr(result, 'status_code', None),
                'crawl_metadata': {
                    'timeout_used': timeout,
                    'stealth_enabled': use_stealth,
                    'retry_attempt': retry_attempt,
                    'wait_until': 'networkidle',
                }
            }

            # Capture response headers
            if hasattr(result, 'response_headers'):
                headers = result.response_headers or {}
                extracted['response_headers'] = dict(headers)

                # Check X-Robots-Tag
                x_robots = headers.get('X-Robots-Tag', '')
                if x_robots:
                    logger.info(f"ℹ️ X-Robots-Tag found: {x_robots}")
                    # Merge with meta_robots if present
                    extracted['x_robots_tag'] = x_robots

            # Check DOM rendering quality
            if result.html:
                dom_complete = ExtractionValidation.check_dom_rendered(result.html)
                if not dom_complete:
                    logger.warning(f"⚠️ DOM may be incomplete for {url}")
                extracted['dom_rendered_completely'] = dom_complete

            # Extract basic content from Crawl4AI
            if result.markdown:
                extracted['body_content'] = result.markdown
                extracted['word_count'] = len(result.markdown.split())

            # Extract screenshots (with error handling)
            try:
                if hasattr(result, 'screenshot') and result.screenshot:
                    extracted['screenshot_url'] = result.screenshot
                    extracted['screenshot_full_url'] = result.screenshot
            except Exception as e:
                logger.warning(f"⚠️ Screenshot extraction failed: {e}")
                extracted['screenshot_url'] = None

            # Extract links and media from Crawl4AI
            if hasattr(result, 'links') and result.links:
                extracted['internal_links'] = result.links.get('internal', [])
                extracted['external_links'] = result.links.get('external', [])

            if hasattr(result, 'media') and result.media:
                media = result.media
                extracted['image_count'] = len(media.get('images', []))

            # Parse HTML for SEO metadata
            if result.html:
                parser = HTMLParserService(result.html)
                html_data = parser.extract_all()

                # Merge HTML-parsed data
                extracted.update(html_data)
            else:
                logger.warning(f"⚠️ No HTML content returned for {url}")
                extracted['error_message'] = "No HTML content returned"

            return extracted

        except asyncio.TimeoutError:
            return {
                'success': False,
                'url': url,
                'error_message': f"Timeout after {timeout} seconds",
                'status_code': None,
            }
        except Exception as e:
            logger.error(f"❌ Exception during extraction: {e}", exc_info=True)
            return {
                'success': False,
                'url': url,
                'error_message': str(e),
                'status_code': None,
            }

    async def crawl_batch(
        self,
        urls: List[str],
        max_concurrent: Optional[int] = None,
        max_retries: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Crawl multiple URLs with concurrency control and rate limiting.

        Args:
            urls: List of URLs to crawl
            max_concurrent: Max concurrent crawls (defaults to config)
            max_retries: Max retry attempts per URL (defaults to config)

        Returns:
            List of extraction results
        """
        if not urls:
            return []

        if max_concurrent is None:
            max_concurrent = config.crawl_max_workers

        logger.info(f"📦 Crawling batch of {len(urls)} URLs (max {max_concurrent} concurrent)")

        # Create semaphore for concurrency control
        semaphore = asyncio.Semaphore(max_concurrent)

        async def crawl_with_rate_limit(url: str) -> Dict[str, Any]:
            """Crawl single URL with semaphore and rate limiting."""
            async with semaphore:
                result = await self.extract_page_data(
                    url=url,
                    max_retries=max_retries,
                )

                # Rate limit with dynamic delays
                status_code = result.get('status_code')
                await self.rate_limiter.wait(status_code)

                return result

        # Crawl all URLs concurrently (with semaphore limiting)
        results = await asyncio.gather(
            *[crawl_with_rate_limit(url) for url in urls],
            return_exceptions=False,
        )

        # Calculate stats
        successful = sum(1 for r in results if r.get('success'))
        failed = len(results) - successful
        avg_quality = sum(
            r.get('validation', {}).get('quality_score', 0)
            for r in results if r.get('success')
        ) / max(successful, 1)

        logger.info(
            f"✅ Batch complete: {successful}/{len(urls)} successful, "
            f"{failed} failed, avg quality: {avg_quality:.1f}"
        )

        return results

    async def extract_and_store_page(
        self,
        client_id,
        url: str,
        crawl_run_id: Optional[Any] = None,
    ) -> 'ClientPage':
        """
        Extract data from URL and store in database.

        Args:
            client_id: Client UUID
            url: URL to extract
            crawl_run_id: Optional crawl run UUID

        Returns:
            ClientPage with extracted data

        Raises:
            ValueError: If database session not provided
        """
        if self.db is None:
            raise ValueError("Database session required for extract_and_store_page")

        # Extract data
        extraction_result = await self.extract_page_data(url)

        # Store in database
        page = await self._store_extraction_result(
            client_id=client_id,
            url=url,
            crawl_run_id=crawl_run_id,
            extraction_result=extraction_result,
        )

        return page

    async def _store_extraction_result(
        self,
        client_id,
        url: str,
        crawl_run_id,
        extraction_result: Dict[str, Any],
    ) -> 'ClientPage':
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

        # Check if page exists
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

        # Update from extraction
        success = extraction_result.get('success', False)

        if not success:
            page.is_failed = True
            page.failure_reason = extraction_result.get('error_message', 'Extraction failed')

            # Store retry info if available
            retry_info = extraction_result.get('retry_info')
            if retry_info:
                page.failure_reason += f" (attempts: {retry_info['attempts']}, category: {retry_info['error_category']})"
        else:
            page.is_failed = False
            page.failure_reason = None

            # Core fields
            page.status_code = extraction_result.get('status_code')
            page.last_crawled_at = datetime.utcnow()

            # SEO fields
            page.page_title = extraction_result.get('page_title')
            page.meta_title = extraction_result.get('meta_title')
            page.meta_description = extraction_result.get('meta_description')
            page.h1 = extraction_result.get('h1')
            page.canonical_url = extraction_result.get('canonical_url')
            page.word_count = extraction_result.get('word_count')

            # Hreflang
            hreflang = extraction_result.get('hreflang')
            if hreflang:
                import json
                page.hreflang = json.dumps(hreflang) if isinstance(hreflang, list) else hreflang

            # Meta robots (merge X-Robots-Tag if present)
            meta_robots = extraction_result.get('meta_robots', '')
            x_robots = extraction_result.get('x_robots_tag', '')
            if x_robots:
                meta_robots = f"{meta_robots}, X-Robots-Tag: {x_robots}".strip(', ')
            page.meta_robots = meta_robots if meta_robots else None

            # Content
            page.body_content = extraction_result.get('body_content')

            # Structure
            webpage_structure = extraction_result.get('webpage_structure')
            if webpage_structure:
                page.webpage_structure = webpage_structure

            heading_structure = extraction_result.get('heading_structure')
            if heading_structure:
                if page.webpage_structure:
                    page.webpage_structure['heading_structure'] = heading_structure
                else:
                    page.webpage_structure = {'heading_structure': heading_structure}

            # Schema markup
            schema_markup = extraction_result.get('schema_markup')
            if schema_markup:
                page.schema_markup = schema_markup

            # Links
            internal_links = extraction_result.get('internal_links')
            if internal_links:
                page.internal_links = internal_links

            external_links = extraction_result.get('external_links')
            if external_links:
                page.external_links = external_links

            page.image_count = extraction_result.get('image_count')

            # Screenshots - Save to filesystem organized by client
            screenshot = extraction_result.get('screenshot_url')
            if screenshot:
                try:
                    # Extract base64 data from data URL if needed
                    screenshot_base64 = screenshot
                    if screenshot.startswith('data:image'):
                        # Extract base64 from data URL (format: data:image/png;base64,xxxxx)
                        screenshot_base64 = screenshot.split(',', 1)[1]

                    # Save screenshot to file and get URL path
                    screenshot_path = self.screenshot_storage.save_screenshot(
                        screenshot_base64=screenshot_base64,
                        page_id=page.id,
                        client_id=page.client_id,
                        screenshot_type="thumbnail"
                    )

                    if screenshot_path:
                        page.screenshot_url = screenshot_path
                        logger.info(f"✅ Screenshot saved: {screenshot_path}")
                    else:
                        logger.warning(f"⚠️ Failed to save screenshot for page {page.id}")

                except Exception as e:
                    logger.error(f"❌ Error saving screenshot: {e}")

            # Full screenshot (if different from thumbnail)
            screenshot_full = extraction_result.get('screenshot_full_url')
            if screenshot_full and screenshot_full != screenshot:
                try:
                    screenshot_full_base64 = screenshot_full
                    if screenshot_full.startswith('data:image'):
                        screenshot_full_base64 = screenshot_full.split(',', 1)[1]

                    screenshot_full_path = self.screenshot_storage.save_screenshot(
                        screenshot_base64=screenshot_full_base64,
                        page_id=page.id,
                        client_id=page.client_id,
                        screenshot_type="full"
                    )

                    if screenshot_full_path:
                        page.screenshot_full_url = screenshot_full_path
                        logger.info(f"✅ Full screenshot saved: {screenshot_full_path}")

                except Exception as e:
                    logger.error(f"❌ Error saving full screenshot: {e}")

            # Store validation results in webpage_structure
            validation = extraction_result.get('validation')
            if validation and page.webpage_structure:
                page.webpage_structure['validation'] = validation
            elif validation:
                page.webpage_structure = {'validation': validation}

        page.last_checked_at = datetime.utcnow()
        page.updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(page)

        return page
