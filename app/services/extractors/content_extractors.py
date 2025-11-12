"""
Content extractors for body content, structure, and word count.
"""
from typing import Optional
import json
import re

from .base import BaseExtractor


class BodyContentExtractor(BaseExtractor):
    """Extract main body content as clean text."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract body content."""
        soup = self.parse_html(html)

        # Remove script, style, nav, footer, header elements
        for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
            element.decompose()

        # Get body tag
        body = soup.find("body")
        if not body:
            # Fallback to whole document
            body = soup

        # Extract text
        text = body.get_text(separator=" ", strip=True)

        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()

        if len(text) > 50:  # Only if substantial content
            return text

        return None


class WebpageStructureExtractor(BaseExtractor):
    """Extract heading structure (H1-H6) as JSON."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract webpage structure."""
        soup = self.parse_html(html)

        headings = []
        position = 0

        # Find all heading tags
        for heading in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
            level = int(heading.name[1])  # Extract number from h1, h2, etc.
            text = heading.get_text().strip()

            if text:  # Only include non-empty headings
                headings.append({
                    "level": level,
                    "text": text[:200],  # Limit text length
                    "position": position
                })
                position += 1

        if headings:
            return json.dumps({"headings": headings})

        return None


class WordCountExtractor(BaseExtractor):
    """Extract word count from body content."""

    def extract(self, html: str, url: str) -> Optional[int]:
        """Extract word count."""
        # Use BodyContentExtractor to get clean text
        body_extractor = BodyContentExtractor()
        body_text = body_extractor.extract_safe(html, url)

        if not body_text:
            return None

        # Count words by splitting on whitespace
        words = body_text.split()
        word_count = len(words)

        return word_count if word_count > 0 else None

    def sanitize(self, value: int) -> int:
        """Don't sanitize integers."""
        return value
