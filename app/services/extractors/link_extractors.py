"""
Link extractors for internal/external links and images.
"""
from typing import Optional
from urllib.parse import urljoin, urlparse
import json

from .base import BaseExtractor


class InternalLinksExtractor(BaseExtractor):
    """Extract internal links as JSON array."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract internal links."""
        soup = self.parse_html(html)
        parsed_url = urlparse(url)
        base_domain = parsed_url.netloc

        internal_links = []
        seen_urls = set()  # For deduplication
        position = 0

        # Find all anchor tags
        for link in soup.find_all("a", href=True):
            href = link["href"]

            # Convert relative URLs to absolute
            absolute_url = urljoin(url, href)
            parsed_link = urlparse(absolute_url)

            # Check if internal (same domain)
            if parsed_link.netloc == base_domain:
                # Remove fragment
                clean_url = absolute_url.split("#")[0]

                # Deduplicate
                if clean_url not in seen_urls:
                    seen_urls.add(clean_url)

                    # Get anchor text
                    anchor_text = link.get_text().strip()

                    internal_links.append({
                        "url": clean_url,
                        "anchor_text": anchor_text[:200] if anchor_text else "",
                        "position": position
                    })
                    position += 1

        if internal_links:
            return json.dumps(internal_links)

        return None


class ExternalLinksExtractor(BaseExtractor):
    """Extract external links as JSON array."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract external links."""
        soup = self.parse_html(html)
        parsed_url = urlparse(url)
        base_domain = parsed_url.netloc

        external_links = []
        seen_urls = set()  # For deduplication
        position = 0

        # Find all anchor tags
        for link in soup.find_all("a", href=True):
            href = link["href"]

            # Skip mailto, tel, javascript links
            if href.startswith(("mailto:", "tel:", "javascript:")):
                continue

            # Convert relative URLs to absolute
            absolute_url = urljoin(url, href)
            parsed_link = urlparse(absolute_url)

            # Check if external (different domain)
            if parsed_link.netloc and parsed_link.netloc != base_domain:
                # Remove fragment
                clean_url = absolute_url.split("#")[0]

                # Deduplicate
                if clean_url not in seen_urls:
                    seen_urls.add(clean_url)

                    # Get anchor text
                    anchor_text = link.get_text().strip()

                    # Check if nofollow
                    rel = link.get("rel", [])
                    is_nofollow = "nofollow" in rel if isinstance(rel, list) else "nofollow" in str(rel)

                    external_links.append({
                        "url": clean_url,
                        "anchor_text": anchor_text[:200] if anchor_text else "",
                        "nofollow": is_nofollow,
                        "position": position
                    })
                    position += 1

        if external_links:
            return json.dumps(external_links)

        return None


class ImageCountExtractor(BaseExtractor):
    """Extract count of images on page."""

    def extract(self, html: str, url: str) -> Optional[int]:
        """Extract image count."""
        soup = self.parse_html(html)

        # Find all img tags
        images = soup.find_all("img", src=True)

        # Filter out tracking pixels and tiny images
        valid_images = []
        for img in images:
            src = img.get("src", "")

            # Skip data URIs (embedded images)
            if src.startswith("data:"):
                continue

            # Try to filter out 1x1 tracking pixels
            width = img.get("width")
            height = img.get("height")

            if width and height:
                try:
                    w = int(width.replace("px", ""))
                    h = int(height.replace("px", ""))
                    if w <= 1 and h <= 1:
                        continue  # Skip tracking pixels
                except (ValueError, AttributeError):
                    pass

            valid_images.append(img)

        count = len(valid_images)
        return count if count > 0 else None

    def sanitize(self, value: int) -> int:
        """Don't sanitize integers."""
        return value
