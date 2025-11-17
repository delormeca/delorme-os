"""
PRODUCTION-READY SITEMAP PARSER
Robust sitemap parsing with support for:
- Standard XML sitemaps
- Compressed sitemaps (.gz)
- Sitemap indexes (nested sitemaps)
- Cloudflare/Vercel protected sites
- WordPress sitemap formats
- Proper User-Agent headers to avoid 403 errors
- Retry strategies for transient failures
"""

import gzip
import time
from io import BytesIO
from typing import Dict, List, Optional, Set, Tuple
from xml.etree import ElementTree as ET
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass
from enum import Enum

import httpx
from httpx import Response


class SitemapType(Enum):
    """Types of sitemap content"""
    SITEMAP_INDEX = "sitemap_index"  # Contains references to other sitemaps
    URL_SET = "url_set"              # Contains actual page URLs
    RSS = "rss"                       # RSS feed format
    UNKNOWN = "unknown"


@dataclass
class SitemapURL:
    """Represents a URL found in a sitemap"""
    loc: str
    lastmod: Optional[str] = None
    changefreq: Optional[str] = None
    priority: Optional[float] = None


@dataclass
class SitemapParseResult:
    """Result of parsing a sitemap"""
    sitemap_url: str
    sitemap_type: SitemapType
    urls: List[SitemapURL]
    child_sitemaps: List[str]
    error: Optional[str] = None


class RobustSitemapParser:
    """
    Production-ready sitemap parser with retry logic and proper headers.

    Usage:
        parser = RobustSitemapParser()
        result = parser.parse_sitemap("https://example.com/sitemap.xml")

        # For recursive parsing of sitemap indexes:
        all_urls = parser.parse_sitemap_recursive("https://example.com/sitemap.xml")
    """

    # Common User-Agent strings that work with most sites
    USER_AGENTS = {
        "chrome": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "googlebot": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "firefox": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
    }

    # Sitemap XML namespaces
    NAMESPACES = {
        'sitemap': 'http://www.sitemaps.org/schemas/sitemap/0.9',
        'image': 'http://www.google.com/schemas/sitemap-image/1.1',
        'video': 'http://www.google.com/schemas/sitemap-video/1.1',
        'news': 'http://www.google.com/schemas/sitemap-news/0.9',
    }

    def __init__(
        self,
        user_agent: str = "chrome",
        timeout: float = 15.0,
        max_retries: int = 3,
        retry_delay: float = 1.0,
    ):
        """
        Initialize the sitemap parser.

        Args:
            user_agent: User agent to use (chrome, googlebot, firefox, or custom string)
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
            retry_delay: Base delay between retries (uses exponential backoff)
        """
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay

        # Set user agent
        if user_agent in self.USER_AGENTS:
            self.user_agent = self.USER_AGENTS[user_agent]
        else:
            self.user_agent = user_agent

        # Create HTTP client with retry transport
        transport = httpx.HTTPTransport(retries=max_retries)
        self.client = httpx.Client(
            transport=transport,
            timeout=timeout,
            follow_redirects=True,
            http2=True,  # Enable HTTP/2 for better compatibility
        )

    def _get_headers(self) -> Dict[str, str]:
        """Generate robust HTTP headers that avoid 403 errors."""
        return {
            "User-Agent": self.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "max-age=0",
        }

    def _fetch_with_retry(self, url: str) -> Tuple[Optional[bytes], Optional[str]]:
        """
        Fetch URL with retry logic and exponential backoff.

        Returns:
            Tuple of (content, error_message)
        """
        last_error = None

        for attempt in range(self.max_retries):
            try:
                response = self.client.get(url, headers=self._get_headers())

                if response.status_code == 200:
                    return response.content, None
                elif response.status_code == 403:
                    # Try with different user agent on 403
                    if attempt == 0:
                        # Try Googlebot
                        headers = self._get_headers()
                        headers["User-Agent"] = self.USER_AGENTS["googlebot"]
                        response = self.client.get(url, headers=headers)
                        if response.status_code == 200:
                            return response.content, None

                    last_error = f"HTTP {response.status_code}: Access forbidden"
                elif response.status_code == 404:
                    return None, f"HTTP 404: Sitemap not found"
                else:
                    last_error = f"HTTP {response.status_code}"

            except httpx.TimeoutException:
                last_error = "Request timeout"
            except httpx.ConnectError:
                last_error = "Connection error"
            except Exception as e:
                last_error = f"Request error: {str(e)}"

            # Exponential backoff
            if attempt < self.max_retries - 1:
                delay = self.retry_delay * (2 ** attempt)
                time.sleep(delay)

        return None, last_error

    def _decompress_if_needed(self, content: bytes, url: str) -> bytes:
        """Decompress gzipped content if necessary."""
        if url.endswith('.gz'):
            try:
                return gzip.decompress(content)
            except Exception:
                # Maybe it's not actually gzipped
                return content
        return content

    def _detect_sitemap_type(self, root: ET.Element) -> SitemapType:
        """Detect the type of sitemap from the root element."""
        tag = root.tag.lower()

        if 'sitemapindex' in tag:
            return SitemapType.SITEMAP_INDEX
        elif 'urlset' in tag:
            return SitemapType.URL_SET
        elif 'rss' in tag:
            return SitemapType.RSS
        else:
            return SitemapType.UNKNOWN

    def _parse_url_element(self, url_elem: ET.Element, namespace: str) -> SitemapURL:
        """Parse a <url> element into a SitemapURL object."""
        ns = {'ns': namespace} if namespace else {}

        loc = url_elem.find('.//ns:loc', ns) if namespace else url_elem.find('.//loc')
        lastmod = url_elem.find('.//ns:lastmod', ns) if namespace else url_elem.find('.//lastmod')
        changefreq = url_elem.find('.//ns:changefreq', ns) if namespace else url_elem.find('.//changefreq')
        priority = url_elem.find('.//ns:priority', ns) if namespace else url_elem.find('.//priority')

        return SitemapURL(
            loc=loc.text if loc is not None else "",
            lastmod=lastmod.text if lastmod is not None else None,
            changefreq=changefreq.text if changefreq is not None else None,
            priority=float(priority.text) if priority is not None and priority.text else None,
        )

    def parse_sitemap(self, sitemap_url: str) -> SitemapParseResult:
        """
        Parse a single sitemap (does not recursively follow sitemap indexes).

        Args:
            sitemap_url: URL of the sitemap to parse

        Returns:
            SitemapParseResult with URLs and/or child sitemaps
        """
        # Fetch content
        content, error = self._fetch_with_retry(sitemap_url)

        if error:
            return SitemapParseResult(
                sitemap_url=sitemap_url,
                sitemap_type=SitemapType.UNKNOWN,
                urls=[],
                child_sitemaps=[],
                error=error,
            )

        # Decompress if needed
        content = self._decompress_if_needed(content, sitemap_url)

        # Parse XML
        try:
            root = ET.fromstring(content)
        except ET.ParseError as e:
            return SitemapParseResult(
                sitemap_url=sitemap_url,
                sitemap_type=SitemapType.UNKNOWN,
                urls=[],
                child_sitemaps=[],
                error=f"XML parse error: {str(e)}",
            )

        # Detect sitemap type
        sitemap_type = self._detect_sitemap_type(root)

        # Extract namespace
        namespace = root.tag.split('}')[0].strip('{') if '}' in root.tag else ''
        ns = {'ns': namespace} if namespace else {}

        urls: List[SitemapURL] = []
        child_sitemaps: List[str] = []

        if sitemap_type == SitemapType.SITEMAP_INDEX:
            # This is a sitemap index - extract child sitemap URLs
            sitemap_elements = root.findall('.//ns:sitemap', ns) if namespace else root.findall('.//sitemap')

            for sitemap_elem in sitemap_elements:
                loc = sitemap_elem.find('.//ns:loc', ns) if namespace else sitemap_elem.find('.//loc')
                if loc is not None and loc.text:
                    child_sitemaps.append(loc.text)

        elif sitemap_type == SitemapType.URL_SET:
            # This is a regular sitemap - extract URLs
            url_elements = root.findall('.//ns:url', ns) if namespace else root.findall('.//url')

            for url_elem in url_elements:
                url_obj = self._parse_url_element(url_elem, namespace)
                if url_obj.loc:
                    urls.append(url_obj)

        elif sitemap_type == SitemapType.RSS:
            # Parse as RSS feed
            items = root.findall('.//item')
            for item in items:
                link = item.find('link')
                pubDate = item.find('pubDate')

                if link is not None and link.text:
                    urls.append(SitemapURL(
                        loc=link.text,
                        lastmod=pubDate.text if pubDate is not None else None,
                    ))

        return SitemapParseResult(
            sitemap_url=sitemap_url,
            sitemap_type=sitemap_type,
            urls=urls,
            child_sitemaps=child_sitemaps,
            error=None,
        )

    def parse_sitemap_recursive(
        self,
        sitemap_url: str,
        max_depth: int = 10,
        visited: Optional[Set[str]] = None,
    ) -> List[SitemapURL]:
        """
        Recursively parse sitemap and all child sitemaps.

        Args:
            sitemap_url: URL of the sitemap to start parsing
            max_depth: Maximum depth of recursion (prevents infinite loops)
            visited: Set of already visited sitemap URLs (used internally)

        Returns:
            List of all SitemapURL objects found
        """
        if visited is None:
            visited = set()

        if sitemap_url in visited or max_depth <= 0:
            return []

        visited.add(sitemap_url)

        # Parse this sitemap
        result = self.parse_sitemap(sitemap_url)

        if result.error:
            print(f"Warning: Failed to parse {sitemap_url}: {result.error}")
            return []

        all_urls = result.urls.copy()

        # Recursively parse child sitemaps
        for child_sitemap in result.child_sitemaps:
            child_urls = self.parse_sitemap_recursive(
                child_sitemap,
                max_depth=max_depth - 1,
                visited=visited,
            )
            all_urls.extend(child_urls)

        return all_urls

    def discover_sitemap(self, base_url: str) -> Optional[str]:
        """
        Try to discover sitemap URL for a website.
        Checks common locations like /sitemap.xml, /sitemap_index.xml, etc.

        Args:
            base_url: Base URL of the website (e.g., https://example.com)

        Returns:
            URL of discovered sitemap, or None
        """
        # Common sitemap locations
        common_paths = [
            '/sitemap.xml',
            '/sitemap_index.xml',
            '/sitemap-index.xml',
            '/sitemap.xml.gz',
            '/sitemaps.xml',
            '/sitemap/sitemap-index.xml',
            '/wp-sitemap.xml',  # WordPress
        ]

        for path in common_paths:
            sitemap_url = urljoin(base_url, path)
            content, error = self._fetch_with_retry(sitemap_url)

            if content and not error:
                # Verify it's actually XML
                try:
                    content = self._decompress_if_needed(content, sitemap_url)
                    ET.fromstring(content)
                    return sitemap_url
                except ET.ParseError:
                    continue

        return None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()


# ============================================================================
# EXAMPLE USAGE
# ============================================================================
if __name__ == "__main__":
    print("PRODUCTION SITEMAP PARSER - EXAMPLES\n")

    # Test sitemaps
    test_urls = [
        "https://cleio.com/page-sitemap1.xml",
        "https://cleio.com/sitemaps.xml",  # Sitemap index
        "https://mabelslabels.com/sitemap.xml",
        "https://pestagent.ca/sitemap.xml",
    ]

    # Example 1: Parse a single sitemap
    print("="*80)
    print("EXAMPLE 1: Parse single sitemap")
    print("="*80)

    with RobustSitemapParser() as parser:
        result = parser.parse_sitemap("https://cleio.com/page-sitemap1.xml")

        print(f"Sitemap URL: {result.sitemap_url}")
        print(f"Type: {result.sitemap_type.value}")
        print(f"URLs found: {len(result.urls)}")
        print(f"Child sitemaps: {len(result.child_sitemaps)}")

        if result.error:
            print(f"Error: {result.error}")
        else:
            print("\nSample URLs:")
            for url in result.urls[:5]:
                print(f"  - {url.loc}")
                if url.lastmod:
                    print(f"    Last modified: {url.lastmod}")

    # Example 2: Parse sitemap index recursively
    print("\n" + "="*80)
    print("EXAMPLE 2: Parse sitemap index recursively")
    print("="*80)

    with RobustSitemapParser() as parser:
        all_urls = parser.parse_sitemap_recursive("https://cleio.com/sitemaps.xml")

        print(f"Total URLs found: {len(all_urls)}")
        print("\nSample URLs:")
        for url in all_urls[:5]:
            print(f"  - {url.loc}")

    # Example 3: Discover sitemap automatically
    print("\n" + "="*80)
    print("EXAMPLE 3: Auto-discover sitemap")
    print("="*80)

    with RobustSitemapParser() as parser:
        discovered = parser.discover_sitemap("https://mabelslabels.com")

        if discovered:
            print(f"Discovered sitemap: {discovered}")

            # Parse it
            result = parser.parse_sitemap(discovered)
            print(f"URLs found: {len(result.urls)}")
        else:
            print("Could not discover sitemap")

    # Example 4: Test all sitemaps with error handling
    print("\n" + "="*80)
    print("EXAMPLE 4: Test multiple sitemaps")
    print("="*80)

    with RobustSitemapParser() as parser:
        for url in test_urls:
            print(f"\nTesting: {url}")
            result = parser.parse_sitemap(url)

            if result.error:
                print(f"  [FAIL] {result.error}")
            else:
                print(f"  [OK] Type: {result.sitemap_type.value}")
                print(f"  [OK] URLs: {len(result.urls)}, Child sitemaps: {len(result.child_sitemaps)}")
