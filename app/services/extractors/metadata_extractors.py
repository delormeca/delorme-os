"""
Metadata extractors for basic SEO data points.
"""
from typing import Optional
from urllib.parse import urljoin, urlparse

from .base import BaseExtractor


class PageTitleExtractor(BaseExtractor):
    """Extract page title from <title> tag."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract page title."""
        soup = self.parse_html(html)

        # Try <title> tag first
        title_tag = soup.find("title")
        if title_tag and title_tag.string:
            title = title_tag.string.strip()
            if title:
                return title[:200]  # Max 200 characters

        # Fallback: og:title
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title["content"][:200]

        # Fallback: First H1
        h1 = soup.find("h1")
        if h1:
            return h1.get_text().strip()[:200]

        return None


class MetaTitleExtractor(BaseExtractor):
    """Extract meta title (og:title, twitter:title)."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract meta title."""
        soup = self.parse_html(html)

        # Try og:title
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title["content"][:200]

        # Try twitter:title
        twitter_title = soup.find("meta", attrs={"name": "twitter:title"})
        if twitter_title and twitter_title.get("content"):
            return twitter_title["content"][:200]

        # Fallback to <title>
        title_tag = soup.find("title")
        if title_tag and title_tag.string:
            return title_tag.string.strip()[:200]

        return None


class MetaDescriptionExtractor(BaseExtractor):
    """Extract meta description."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract meta description."""
        soup = self.parse_html(html)

        # Try meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            return meta_desc["content"][:500]

        # Try og:description
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            return og_desc["content"][:500]

        # Fallback: First paragraph
        first_p = soup.find("p")
        if first_p:
            text = first_p.get_text().strip()
            if len(text) > 50:  # Only if substantial
                return text[:500]

        return None


class H1Extractor(BaseExtractor):
    """Extract first H1 tag."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract H1."""
        soup = self.parse_html(html)

        h1 = soup.find("h1")
        if h1:
            # Get text and strip HTML
            text = h1.get_text().strip()
            if text:
                return text[:200]

        return None


class CanonicalExtractor(BaseExtractor):
    """Extract canonical URL."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract canonical URL."""
        soup = self.parse_html(html)

        canonical_tag = soup.find("link", rel="canonical")
        if canonical_tag and canonical_tag.get("href"):
            canonical_url = canonical_tag["href"]

            # Convert relative URLs to absolute
            canonical_url = urljoin(url, canonical_url)

            return canonical_url

        return None


class HreflangExtractor(BaseExtractor):
    """Extract hreflang alternate links."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract hreflang as JSON string."""
        soup = self.parse_html(html)

        hreflang_tags = soup.find_all("link", rel="alternate", hreflang=True)

        if not hreflang_tags:
            return None

        # Build JSON array of {hreflang, url} objects
        hreflang_data = []
        for tag in hreflang_tags:
            hreflang = tag.get("hreflang")
            href = tag.get("href")

            if hreflang and href:
                # Convert relative URLs to absolute
                href = urljoin(url, href)
                hreflang_data.append({"hreflang": hreflang, "url": href})

        if hreflang_data:
            import json
            return json.dumps(hreflang_data)

        return None


class MetaRobotsExtractor(BaseExtractor):
    """Extract meta robots directives."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract meta robots."""
        soup = self.parse_html(html)

        directives = []

        # Check meta robots
        meta_robots = soup.find("meta", attrs={"name": "robots"})
        if meta_robots and meta_robots.get("content"):
            directives.append(meta_robots["content"])

        # Check meta googlebot
        meta_googlebot = soup.find("meta", attrs={"name": "googlebot"})
        if meta_googlebot and meta_googlebot.get("content"):
            directives.append(f"googlebot: {meta_googlebot['content']}")

        if directives:
            return ", ".join(directives)

        return None
