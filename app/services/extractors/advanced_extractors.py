"""
Advanced extractors for schema markup and slug.
"""
from typing import Optional
from urllib.parse import urlparse
import json

from .base import BaseExtractor


class SchemaMarkupExtractor(BaseExtractor):
    """Extract structured data (JSON-LD, microdata) as JSON."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract schema markup."""
        soup = self.parse_html(html)

        schema_objects = []

        # Extract JSON-LD scripts
        json_ld_scripts = soup.find_all("script", type="application/ld+json")

        for script in json_ld_scripts:
            if script.string:
                try:
                    # Parse JSON
                    schema_data = json.loads(script.string)
                    schema_objects.append(schema_data)
                except json.JSONDecodeError as e:
                    # Invalid JSON, skip
                    continue

        if schema_objects:
            # Return as JSON string
            return json.dumps(schema_objects)

        return None


class SlugExtractor(BaseExtractor):
    """Extract URL slug (path component)."""

    def extract(self, html: str, url: str) -> Optional[str]:
        """Extract slug from URL."""
        parsed_url = urlparse(url)

        # Get path component
        path = parsed_url.path

        # Remove leading/trailing slashes
        path = path.strip("/")

        if path:
            return f"/{path}"

        # Root path
        return "/"

    def sanitize(self, value: str) -> str:
        """Don't sanitize slug."""
        return value
