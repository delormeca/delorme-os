"""
Crawl4AI service for page crawling and content extraction.

This service provides a high-level interface for using Crawl4AI to fetch pages,
render JavaScript, and extract content.
"""
import asyncio
import logging
import os
import sys
import io
from typing import Optional, Dict, Any
from dataclasses import dataclass

# Fix for Windows asyncio event loop policy (Python 3.13 compatibility)
# MUST be before any async operations or imports that use asyncio
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Fix for Windows console encoding issues with Crawl4AI
# MUST be before importing crawl4ai
if sys.platform == 'win32':
    # Reconfigure stdout/stderr to use UTF-8 encoding
    # This prevents UnicodeEncodeError when rich/Crawl4AI outputs Unicode characters
    try:
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except (AttributeError, ValueError):
        # Already wrapped or unable to wrap, continue
        pass

    os.environ['PYTHONIOENCODING'] = 'utf-8'
    os.environ['CRAWL4AI_VERBOSE'] = 'false'

# Disable Crawl4AI logger before import to prevent Unicode errors
import logging as std_logging
std_logging.getLogger('crawl4ai').setLevel(std_logging.CRITICAL)
std_logging.getLogger('crawl4ai').disabled = True

from crawl4ai import AsyncWebCrawler
from crawl4ai.models import CrawlResult

from app.config.base import config

logger = logging.getLogger(__name__)


@dataclass
class CrawlConfig:
    """Configuration for a single crawl operation."""

    timeout: int = config.crawl_timeout_seconds
    wait_for_network_idle: bool = True
    wait_time: float = 2.0  # Wait after page load
    remove_overlay: bool = True  # Remove popups and overlays
    simulate_user: bool = True  # Simulate human-like behavior
    bypass_cache: bool = False
    headless: bool = True
    user_agent: Optional[str] = None


@dataclass
class PageCrawlResult:
    """Result of crawling a single page."""

    success: bool
    url: str
    final_url: str  # After redirects
    status_code: Optional[int]
    html: Optional[str]
    markdown: Optional[str]  # Clean markdown version
    cleaned_text: Optional[str]  # Text without HTML
    screenshot_base64: Optional[str]
    load_time: float
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class Crawl4AIService:
    """Service for crawling web pages using Crawl4AI."""

    def __init__(self):
        """Initialize the Crawl4AI service."""
        self.crawler: Optional[AsyncWebCrawler] = None

    async def __aenter__(self):
        """Context manager entry - initialize crawler."""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - cleanup crawler."""
        await self.cleanup()

    async def initialize(self) -> None:
        """
        Initialize the AsyncWebCrawler instance.

        Should be called before using the service.
        """
        if self.crawler is None:
            logger.info("Initializing Crawl4AI AsyncWebCrawler...")

            # Suppress Crawl4AI's internal rich console logger
            import logging as std_logging
            std_logging.getLogger('crawl4ai').setLevel(std_logging.CRITICAL)

            self.crawler = AsyncWebCrawler(
                headless=True,
                verbose=False,
            )
            await self.crawler.__aenter__()
            logger.info("Crawl4AI initialized successfully")

    async def cleanup(self) -> None:
        """
        Cleanup the crawler instance.

        Should be called when done using the service.
        """
        if self.crawler is not None:
            logger.info("Cleaning up Crawl4AI crawler...")
            await self.crawler.__aexit__(None, None, None)
            self.crawler = None
            logger.info("✅ Crawl4AI cleanup complete")

    async def crawl_page(
        self,
        url: str,
        crawl_config: Optional[CrawlConfig] = None,
    ) -> PageCrawlResult:
        """
        Crawl a single page and extract content.

        Args:
            url: The URL to crawl
            crawl_config: Optional crawl configuration

        Returns:
            PageCrawlResult with extracted content

        Raises:
            RuntimeError: If crawler not initialized
        """
        if self.crawler is None:
            raise RuntimeError("Crawler not initialized. Call initialize() first.")

        config = crawl_config or CrawlConfig()

        logger.info(f"🕷️  Crawling: {url}")
        start_time = asyncio.get_event_loop().time()

        try:
            # Perform the crawl
            result: CrawlResult = await self.crawler.arun(
                url=url,
                bypass_cache=config.bypass_cache,
                word_count_threshold=10,  # Minimum words to consider valid content
                remove_overlay_elements=config.remove_overlay,
                simulate_user=config.simulate_user,
                override_navigator=True,  # Prevent bot detection
            )

            load_time = asyncio.get_event_loop().time() - start_time

            # Check if crawl was successful
            if not result.success:
                logger.warning(f"❌ Crawl failed for {url}: {result.error_message}")
                return PageCrawlResult(
                    success=False,
                    url=url,
                    final_url=url,
                    status_code=result.status_code,
                    html=None,
                    markdown=None,
                    cleaned_text=None,
                    screenshot_base64=None,
                    load_time=load_time,
                    error_message=result.error_message or "Unknown error",
                )

            # Extract content
            logger.info(f"✅ Crawl successful: {url} ({load_time:.2f}s)")

            return PageCrawlResult(
                success=True,
                url=url,
                final_url=result.url,  # Final URL after redirects
                status_code=result.status_code,
                html=result.html,
                markdown=result.markdown,
                cleaned_text=result.cleaned_html or result.markdown,
                screenshot_base64=result.screenshot,
                load_time=load_time,
                metadata={
                    "links_count": len(result.links.get("internal", [])) if result.links else 0,
                    "media_count": len(result.media.get("images", [])) if result.media else 0,
                },
            )

        except asyncio.TimeoutError:
            load_time = asyncio.get_event_loop().time() - start_time
            logger.error(f"⏱️  Timeout crawling {url} after {config.timeout}s")
            return PageCrawlResult(
                success=False,
                url=url,
                final_url=url,
                status_code=None,
                html=None,
                markdown=None,
                cleaned_text=None,
                screenshot_base64=None,
                load_time=load_time,
                error_message=f"Timeout after {config.timeout} seconds",
            )

        except Exception as e:
            load_time = asyncio.get_event_loop().time() - start_time
            logger.error(f"❌ Error crawling {url}: {str(e)}", exc_info=True)
            return PageCrawlResult(
                success=False,
                url=url,
                final_url=url,
                status_code=None,
                html=None,
                markdown=None,
                cleaned_text=None,
                screenshot_base64=None,
                load_time=load_time,
                error_message=str(e),
            )

    async def crawl_pages_batch(
        self,
        urls: list[str],
        crawl_config: Optional[CrawlConfig] = None,
        max_concurrent: int = 5,
    ) -> list[PageCrawlResult]:
        """
        Crawl multiple pages concurrently with rate limiting.

        Args:
            urls: List of URLs to crawl
            crawl_config: Optional crawl configuration
            max_concurrent: Maximum concurrent crawls

        Returns:
            List of PageCrawlResult objects
        """
        if not urls:
            return []

        logger.info(f"📦 Crawling batch of {len(urls)} pages (max {max_concurrent} concurrent)")

        # Create semaphore for rate limiting
        semaphore = asyncio.Semaphore(max_concurrent)

        async def crawl_with_semaphore(url: str) -> PageCrawlResult:
            async with semaphore:
                result = await self.crawl_page(url, crawl_config)
                # Add delay between requests
                await asyncio.sleep(config.crawl_rate_limit_delay)
                return result

        # Crawl all pages concurrently (with semaphore limiting)
        results = await asyncio.gather(
            *[crawl_with_semaphore(url) for url in urls],
            return_exceptions=False,
        )

        successful = sum(1 for r in results if r.success)
        logger.info(f"✅ Batch complete: {successful}/{len(urls)} successful")

        return results


# Convenience function for single-use crawls
async def crawl_url(url: str, config: Optional[CrawlConfig] = None) -> PageCrawlResult:
    """
    Convenience function to crawl a single URL.

    Automatically handles crawler initialization and cleanup.

    Args:
        url: The URL to crawl
        config: Optional crawl configuration

    Returns:
        PageCrawlResult with extracted content
    """
    async with Crawl4AIService() as crawler:
        return await crawler.crawl_page(url, config)
