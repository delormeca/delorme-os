"""
Robust Sitemap Parser Service for handling protected and complex sitemaps.

This service provides enterprise-grade sitemap parsing with:
- HTTP/2 support
- Browser-like headers to bypass bot protection
- Exponential backoff retry logic
- Gzip decompression
- Recursive sitemap index parsing
- Concurrent multi-sitemap parsing
- Detailed error categorization and suggestions
"""
import httpx
import gzip
import asyncio
import logging
from lxml import etree
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from time import time

logger = logging.getLogger(__name__)


class SitemapParseError(Exception):
    """Custom exception for sitemap parsing errors with detailed context."""

    def __init__(
        self,
        error_type: str,
        message: str,
        url: Optional[str] = None,
        http_status: Optional[int] = None,
        suggestion: Optional[str] = None,
    ):
        """
        Initialize sitemap parse error.

        Args:
            error_type: Category of error (NOT_FOUND, BOT_PROTECTION, etc.)
            message: Detailed error message
            url: URL that failed to parse
            http_status: HTTP status code if applicable
            suggestion: User-friendly suggestion for resolution
        """
        self.error_type = error_type
        self.message = message
        self.url = url
        self.http_status = http_status
        self.suggestion = suggestion
        super().__init__(message)

    def __str__(self) -> str:
        """Return formatted error string."""
        parts = [f"[{self.error_type}] {self.message}"]
        if self.url:
            parts.append(f"URL: {self.url}")
        if self.http_status:
            parts.append(f"Status: {self.http_status}")
        if self.suggestion:
            parts.append(f"Suggestion: {self.suggestion}")
        return " | ".join(parts)


# Error type constants
ERROR_NOT_FOUND = "NOT_FOUND"
ERROR_BOT_PROTECTION = "BOT_PROTECTION"
ERROR_NETWORK_ERROR = "NETWORK_ERROR"
ERROR_PARSE_ERROR = "PARSE_ERROR"
ERROR_TIMEOUT = "TIMEOUT"
ERROR_RATE_LIMIT = "RATE_LIMIT"
ERROR_SERVER_ERROR = "SERVER_ERROR"


@dataclass
class SitemapParserConfig:
    """Configuration for sitemap parsing operations."""

    timeout: int = 10
    max_redirects: int = 5
    max_retries: int = 3
    retry_backoff: float = 1.0
    max_recursion_depth: int = 3
    http2_enabled: bool = True
    user_agent: str = "chrome"
    log_progress: bool = True


@dataclass
class SitemapParseResult:
    """Result of parsing a sitemap with detailed metadata."""

    success: bool
    urls: List[str] = field(default_factory=list)
    total_count: int = 0
    sitemap_type: Optional[str] = None
    nested_sitemaps: List[str] = field(default_factory=list)
    error_message: Optional[str] = None
    error_type: Optional[str] = None
    suggestion: Optional[str] = None
    parse_time: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Ensure total_count matches urls length if not explicitly set."""
        if self.success and self.total_count == 0:
            self.total_count = len(self.urls)


class RobustSitemapParserService:
    """Service for parsing sitemaps with enterprise-grade error handling."""

    def __init__(self, config: Optional[SitemapParserConfig] = None):
        """
        Initialize the sitemap parser service.

        Args:
            config: Optional configuration, defaults to SitemapParserConfig()
        """
        self.config = config or SitemapParserConfig()

    def _get_browser_headers(self, user_agent_type: str = "chrome") -> Dict[str, str]:
        """
        Generate browser-like headers to bypass bot protection.

        Args:
            user_agent_type: Type of user agent ("chrome" or "googlebot")

        Returns:
            Dictionary of HTTP headers
        """
        user_agents = {
            "chrome": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "googlebot": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        }

        return {
            "User-Agent": user_agents.get(user_agent_type, user_agents["chrome"]),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
        }

    async def _fetch_with_retry(self, url: str) -> bytes:
        """
        Fetch URL content with exponential backoff retry logic.

        Args:
            url: URL to fetch

        Returns:
            Raw content as bytes

        Raises:
            SitemapParseError: If fetch fails after all retries
        """
        headers = self._get_browser_headers(self.config.user_agent)
        last_exception = None

        for attempt in range(self.config.max_retries):
            try:
                async with httpx.AsyncClient(
                    timeout=self.config.timeout,
                    follow_redirects=True,
                    max_redirects=self.config.max_redirects,
                    http2=self.config.http2_enabled,
                ) as client:
                    if self.config.log_progress:
                        logger.info(
                            f"Fetching {url} (attempt {attempt + 1}/{self.config.max_retries})"
                        )

                    response = await client.get(url, headers=headers)
                    response.raise_for_status()

                    if self.config.log_progress:
                        logger.info(f"Successfully fetched {url} ({response.status_code})")

                    return response.content

            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code

                # Categorize HTTP errors
                if status_code == 404:
                    raise SitemapParseError(
                        error_type=ERROR_NOT_FOUND,
                        message=f"Sitemap not found at {url}",
                        url=url,
                        http_status=status_code,
                        suggestion="Check if the sitemap URL is correct. Try /sitemap.xml or /sitemap_index.xml",
                    )
                elif status_code == 403:
                    raise SitemapParseError(
                        error_type=ERROR_BOT_PROTECTION,
                        message=f"Access forbidden - bot protection detected",
                        url=url,
                        http_status=status_code,
                        suggestion="The site is using bot protection (Cloudflare, Vercel, etc.). Try using Manual URL Entry instead.",
                    )
                elif status_code == 429:
                    if attempt < self.config.max_retries - 1:
                        if self.config.log_progress:
                            logger.warning(
                                f"Rate limited on {url}, retrying with backoff..."
                            )
                        await asyncio.sleep(self.config.retry_backoff ** (attempt + 1))
                        last_exception = e
                        continue
                    else:
                        raise SitemapParseError(
                            error_type=ERROR_RATE_LIMIT,
                            message=f"Rate limited after {self.config.max_retries} attempts",
                            url=url,
                            http_status=status_code,
                            suggestion="Wait a few minutes and try again. Consider reducing request frequency.",
                        )
                elif 500 <= status_code < 600:
                    if attempt < self.config.max_retries - 1:
                        if self.config.log_progress:
                            logger.warning(
                                f"Server error {status_code} on {url}, retrying..."
                            )
                        await asyncio.sleep(self.config.retry_backoff ** (attempt + 1))
                        last_exception = e
                        continue
                    else:
                        raise SitemapParseError(
                            error_type=ERROR_SERVER_ERROR,
                            message=f"Server error {status_code} after {self.config.max_retries} attempts",
                            url=url,
                            http_status=status_code,
                            suggestion="The server is experiencing issues. Try again later.",
                        )
                else:
                    raise SitemapParseError(
                        error_type=ERROR_NETWORK_ERROR,
                        message=f"HTTP error {status_code}: {str(e)}",
                        url=url,
                        http_status=status_code,
                        suggestion="Check the URL and try again.",
                    )

            except httpx.TimeoutException:
                if attempt < self.config.max_retries - 1:
                    if self.config.log_progress:
                        logger.warning(f"Timeout on {url}, retrying with backoff...")
                    await asyncio.sleep(self.config.retry_backoff ** (attempt + 1))
                    continue
                else:
                    raise SitemapParseError(
                        error_type=ERROR_TIMEOUT,
                        message=f"Request timed out after {self.config.timeout}s ({self.config.max_retries} attempts)",
                        url=url,
                        suggestion="The server is slow to respond. Try increasing timeout or check network connection.",
                    )

            except httpx.NetworkError as e:
                if attempt < self.config.max_retries - 1:
                    if self.config.log_progress:
                        logger.warning(f"Network error on {url}, retrying...")
                    await asyncio.sleep(self.config.retry_backoff ** (attempt + 1))
                    last_exception = e
                    continue
                else:
                    raise SitemapParseError(
                        error_type=ERROR_NETWORK_ERROR,
                        message=f"Network error after {self.config.max_retries} attempts: {str(e)}",
                        url=url,
                        suggestion="Check your internet connection and firewall settings.",
                    )

            except Exception as e:
                last_exception = e
                if attempt < self.config.max_retries - 1:
                    if self.config.log_progress:
                        logger.warning(f"Unexpected error on {url}, retrying: {str(e)}")
                    await asyncio.sleep(self.config.retry_backoff ** (attempt + 1))
                    continue

        # If we exhausted all retries
        raise SitemapParseError(
            error_type=ERROR_NETWORK_ERROR,
            message=f"Failed after {self.config.max_retries} attempts: {str(last_exception)}",
            url=url,
            suggestion="Check the URL and your network connection.",
        )

    def _decompress_if_needed(
        self, content: bytes, url: str, content_encoding: Optional[str] = None
    ) -> bytes:
        """
        Decompress gzipped content if needed.

        Args:
            content: Raw content bytes
            url: URL for logging purposes
            content_encoding: Content-Encoding header value

        Returns:
            Decompressed content

        Raises:
            SitemapParseError: If decompression fails
        """
        is_gzipped = url.endswith(".gz") or (
            content_encoding and "gzip" in content_encoding.lower()
        )

        if is_gzipped:
            try:
                if self.config.log_progress:
                    logger.info(f"Decompressing gzipped content from {url}")
                return gzip.decompress(content)
            except Exception as e:
                raise SitemapParseError(
                    error_type=ERROR_PARSE_ERROR,
                    message=f"Failed to decompress gzipped sitemap: {str(e)}",
                    url=url,
                    suggestion="The gzip file may be corrupted. Try accessing the non-gzipped version.",
                )

        return content

    def _parse_xml_content(self, content: bytes, url: str) -> Dict[str, Any]:
        """
        Parse XML content and extract URLs with sitemap type detection.

        Args:
            content: XML content as bytes
            url: URL for logging purposes

        Returns:
            Dictionary with 'urls', 'sitemap_type', and 'nested_sitemaps' keys

        Raises:
            SitemapParseError: If XML parsing fails
        """
        try:
            root = etree.fromstring(content)
            namespace = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}

            urls = []
            sitemap_type = None
            nested_sitemaps = []

            # Check if it's a sitemap index (contains <sitemap> elements)
            sitemap_locs = root.xpath("//ns:sitemap/ns:loc/text()", namespaces=namespace)
            if sitemap_locs:
                sitemap_type = "sitemap_index"
                nested_sitemaps = [loc.strip() for loc in sitemap_locs]
                if self.config.log_progress:
                    logger.info(
                        f"Detected sitemap index with {len(nested_sitemaps)} nested sitemaps"
                    )
                return {
                    "urls": [],
                    "sitemap_type": sitemap_type,
                    "nested_sitemaps": nested_sitemaps,
                }

            # Check for standard urlset
            url_locs = root.xpath("//ns:url/ns:loc/text()", namespaces=namespace)
            if url_locs:
                sitemap_type = "urlset"
                urls = [loc.strip() for loc in url_locs]
                if self.config.log_progress:
                    logger.info(f"Detected standard urlset with {len(urls)} URLs")
                return {
                    "urls": urls,
                    "sitemap_type": sitemap_type,
                    "nested_sitemaps": [],
                }

            # Try RSS format (no namespace)
            rss_links = root.xpath("//item/link/text()")
            if rss_links:
                sitemap_type = "rss"
                urls = [link.strip() for link in rss_links]
                if self.config.log_progress:
                    logger.info(f"Detected RSS feed with {len(urls)} items")
                return {
                    "urls": urls,
                    "sitemap_type": sitemap_type,
                    "nested_sitemaps": [],
                }

            # Try without namespace as fallback
            url_locs_no_ns = root.xpath("//url/loc/text()")
            if url_locs_no_ns:
                sitemap_type = "urlset_no_ns"
                urls = [loc.strip() for loc in url_locs_no_ns]
                if self.config.log_progress:
                    logger.info(
                        f"Detected urlset without namespace with {len(urls)} URLs"
                    )
                return {
                    "urls": urls,
                    "sitemap_type": sitemap_type,
                    "nested_sitemaps": [],
                }

            sitemap_locs_no_ns = root.xpath("//sitemap/loc/text()")
            if sitemap_locs_no_ns:
                sitemap_type = "sitemap_index_no_ns"
                nested_sitemaps = [loc.strip() for loc in sitemap_locs_no_ns]
                if self.config.log_progress:
                    logger.info(
                        f"Detected sitemap index without namespace with {len(nested_sitemaps)} nested sitemaps"
                    )
                return {
                    "urls": [],
                    "sitemap_type": sitemap_type,
                    "nested_sitemaps": nested_sitemaps,
                }

            # No URLs found
            raise SitemapParseError(
                error_type=ERROR_PARSE_ERROR,
                message="No URLs found in sitemap - may be empty or invalid format",
                url=url,
                suggestion="Check if the sitemap contains valid <url><loc> or <sitemap><loc> elements.",
            )

        except etree.XMLSyntaxError as e:
            raise SitemapParseError(
                error_type=ERROR_PARSE_ERROR,
                message=f"Invalid XML syntax: {str(e)}",
                url=url,
                suggestion="The sitemap XML is malformed. Contact the site administrator.",
            )
        except SitemapParseError:
            raise
        except Exception as e:
            raise SitemapParseError(
                error_type=ERROR_PARSE_ERROR,
                message=f"Failed to parse sitemap XML: {str(e)}",
                url=url,
                suggestion="The sitemap format may be unsupported or corrupted.",
            )

    async def parse_sitemap(
        self,
        url: str,
        recursive: bool = True,
        _depth: int = 0,
    ) -> SitemapParseResult:
        """
        Parse a sitemap and extract all URLs, optionally following nested sitemaps.

        Args:
            url: Sitemap URL to parse
            recursive: Whether to recursively parse nested sitemap indexes
            _depth: Current recursion depth (internal use)

        Returns:
            SitemapParseResult with extracted URLs and metadata
        """
        start_time = time()

        try:
            # Check recursion depth
            if _depth > self.config.max_recursion_depth:
                if self.config.log_progress:
                    logger.warning(
                        f"Maximum recursion depth {self.config.max_recursion_depth} exceeded at {url}"
                    )
                return SitemapParseResult(
                    success=False,
                    error_type=ERROR_PARSE_ERROR,
                    error_message=f"Maximum recursion depth ({self.config.max_recursion_depth}) exceeded",
                    suggestion="Try increasing max_recursion_depth or disable recursive parsing.",
                    parse_time=time() - start_time,
                )

            # Fetch sitemap content
            content = await self._fetch_with_retry(url)

            # Decompress if needed
            content = self._decompress_if_needed(content, url)

            # Parse XML content
            parse_result = self._parse_xml_content(content, url)

            urls = parse_result["urls"]
            sitemap_type = parse_result["sitemap_type"]
            nested_sitemaps = parse_result["nested_sitemaps"]

            # If recursive and we found nested sitemaps, parse them
            if recursive and nested_sitemaps and _depth < self.config.max_recursion_depth:
                if self.config.log_progress:
                    logger.info(
                        f"Recursively parsing {len(nested_sitemaps)} nested sitemaps from {url}"
                    )

                tasks = [
                    self.parse_sitemap(nested_url, recursive=True, _depth=_depth + 1)
                    for nested_url in nested_sitemaps
                ]
                nested_results = await asyncio.gather(*tasks, return_exceptions=True)

                # Collect URLs from successful parses
                for result in nested_results:
                    if isinstance(result, SitemapParseResult) and result.success:
                        urls.extend(result.urls)
                    elif isinstance(result, Exception):
                        if self.config.log_progress:
                            logger.warning(f"Failed to parse nested sitemap: {str(result)}")

            parse_time = time() - start_time

            if self.config.log_progress:
                logger.info(
                    f"Successfully parsed {url}: {len(urls)} URLs in {parse_time:.2f}s"
                )

            return SitemapParseResult(
                success=True,
                urls=urls,
                total_count=len(urls),
                sitemap_type=sitemap_type,
                nested_sitemaps=nested_sitemaps,
                parse_time=parse_time,
                metadata={
                    "url": url,
                    "depth": _depth,
                    "recursive": recursive,
                },
            )

        except SitemapParseError as e:
            parse_time = time() - start_time
            if self.config.log_progress:
                logger.error(f"Failed to parse {url}: {str(e)}")

            return SitemapParseResult(
                success=False,
                error_message=e.message,
                error_type=e.error_type,
                suggestion=e.suggestion,
                parse_time=parse_time,
                metadata={
                    "url": url,
                    "http_status": e.http_status,
                    "depth": _depth,
                },
            )

        except Exception as e:
            parse_time = time() - start_time
            if self.config.log_progress:
                logger.error(f"Unexpected error parsing {url}: {str(e)}", exc_info=True)

            return SitemapParseResult(
                success=False,
                error_message=f"Unexpected error: {str(e)}",
                error_type=ERROR_PARSE_ERROR,
                suggestion="An unexpected error occurred. Check logs for details.",
                parse_time=parse_time,
                metadata={"url": url, "depth": _depth},
            )

    async def parse_multiple_sitemaps(self, urls: List[str]) -> List[SitemapParseResult]:
        """
        Parse multiple sitemaps concurrently.

        Args:
            urls: List of sitemap URLs to parse

        Returns:
            List of SitemapParseResult objects (one per URL)
        """
        if not urls:
            return []

        if self.config.log_progress:
            logger.info(f"Parsing {len(urls)} sitemaps concurrently")

        tasks = [self.parse_sitemap(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=False)

        successful = sum(1 for r in results if r.success)
        if self.config.log_progress:
            logger.info(f"Completed parsing: {successful}/{len(urls)} successful")

        return results
