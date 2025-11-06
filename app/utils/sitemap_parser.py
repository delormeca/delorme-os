"""
Sitemap parser utility for extracting URLs from XML sitemaps.
"""
from typing import List, Optional
import asyncio
import httpx
from lxml import etree


class SitemapParseError(Exception):
    """Custom exception for sitemap parsing errors."""
    pass


class SitemapParser:
    """Parser for XML sitemaps with support for nested sitemaps."""

    def __init__(self, timeout: int = 30, max_redirects: int = 5):
        """
        Initialize sitemap parser.

        Args:
            timeout: HTTP request timeout in seconds
            max_redirects: Maximum number of redirects to follow
        """
        self.timeout = timeout
        self.max_redirects = max_redirects

    async def fetch_sitemap(self, url: str) -> bytes:
        """
        Fetch sitemap content from URL.

        Args:
            url: Sitemap URL

        Returns:
            Raw sitemap content as bytes

        Raises:
            SitemapParseError: If fetch fails
        """
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True,
                max_redirects=self.max_redirects
            ) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.content
        except httpx.HTTPStatusError as e:
            # Detect bot protection / security checkpoints
            if e.response.status_code in [403, 429]:
                raise SitemapParseError(
                    f"BOT_PROTECTION: The sitemap is protected by security measures "
                    f"(Status {e.response.status_code}). This is common for sites using "
                    f"Vercel, Cloudflare, or similar protection. Please use Manual URL Entry instead."
                )
            raise SitemapParseError(f"Failed to fetch sitemap from {url}: {str(e)}")
        except httpx.HTTPError as e:
            raise SitemapParseError(f"Failed to fetch sitemap from {url}: {str(e)}")
        except Exception as e:
            raise SitemapParseError(f"Unexpected error fetching sitemap: {str(e)}")

    def parse_sitemap_content(self, content: bytes) -> List[str]:
        """
        Parse XML sitemap content and extract URLs.

        Args:
            content: Raw XML content

        Returns:
            List of URLs found in sitemap

        Raises:
            SitemapParseError: If parsing fails
        """
        try:
            root = etree.fromstring(content)

            # Handle different sitemap formats
            urls = []

            # Standard sitemap namespace
            ns = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}

            # Check if it's a sitemap index (contains <sitemap> elements)
            sitemap_locs = root.xpath("//ns:sitemap/ns:loc/text()", namespaces=ns)
            if sitemap_locs:
                # It's a sitemap index - return nested sitemap URLs (strip whitespace)
                return [url.strip() for url in sitemap_locs]

            # Otherwise, extract URL locations
            url_locs = root.xpath("//ns:url/ns:loc/text()", namespaces=ns)
            if url_locs:
                return [url.strip() for url in url_locs]

            # Try without namespace (some sitemaps don't use it)
            url_locs_no_ns = root.xpath("//url/loc/text()")
            if url_locs_no_ns:
                return [url.strip() for url in url_locs_no_ns]

            sitemap_locs_no_ns = root.xpath("//sitemap/loc/text()")
            if sitemap_locs_no_ns:
                return [url.strip() for url in sitemap_locs_no_ns]

            # No URLs found
            raise SitemapParseError("No URLs found in sitemap")

        except etree.XMLSyntaxError as e:
            raise SitemapParseError(f"Invalid XML syntax: {str(e)}")
        except Exception as e:
            raise SitemapParseError(f"Failed to parse sitemap: {str(e)}")

    async def parse_sitemap(
        self,
        url: str,
        recursive: bool = True,
        max_depth: int = 3,
        _depth: int = 0
    ) -> List[str]:
        """
        Parse sitemap and extract all URLs, optionally following nested sitemaps.

        Args:
            url: Sitemap URL to parse
            recursive: Whether to recursively parse nested sitemap indexes
            max_depth: Maximum recursion depth for nested sitemaps
            _depth: Current recursion depth (internal)

        Returns:
            List of all URLs found

        Raises:
            SitemapParseError: If parsing fails
        """
        if _depth > max_depth:
            raise SitemapParseError(f"Maximum recursion depth ({max_depth}) exceeded")

        # Fetch sitemap content
        content = await self.fetch_sitemap(url)

        # Parse content
        urls = self.parse_sitemap_content(content)

        # Check if any URLs are sitemap indexes
        if recursive and _depth < max_depth:
            final_urls = []
            nested_sitemaps = []

            for found_url in urls:
                # Check if it looks like a sitemap (ends with .xml or contains 'sitemap')
                if found_url.endswith('.xml') or 'sitemap' in found_url.lower():
                    nested_sitemaps.append(found_url)
                else:
                    final_urls.append(found_url)

            # If we found nested sitemaps, parse them recursively
            if nested_sitemaps:
                tasks = [
                    self.parse_sitemap(nested_url, recursive=True, max_depth=max_depth, _depth=_depth + 1)
                    for nested_url in nested_sitemaps
                ]
                nested_results = await asyncio.gather(*tasks, return_exceptions=True)

                # Collect results, skipping any that failed
                for result in nested_results:
                    if isinstance(result, list):
                        final_urls.extend(result)
                    # If it's an exception, we just skip it and continue

            return final_urls

        return urls

    async def parse_multiple_sitemaps(self, urls: List[str]) -> List[str]:
        """
        Parse multiple sitemaps concurrently.

        Args:
            urls: List of sitemap URLs to parse

        Returns:
            Combined list of all URLs from all sitemaps

        Raises:
            SitemapParseError: If all sitemaps fail to parse
        """
        tasks = [self.parse_sitemap(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_urls = []
        errors = []

        for result in results:
            if isinstance(result, list):
                all_urls.extend(result)
            elif isinstance(result, Exception):
                errors.append(str(result))

        # If all failed, raise an error
        if not all_urls and errors:
            raise SitemapParseError(f"All sitemaps failed to parse. Errors: {'; '.join(errors)}")

        return all_urls
