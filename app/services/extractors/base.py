"""
Base extractor class for data extraction.
"""
from abc import ABC, abstractmethod
from typing import Any, Optional
import logging

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class BaseExtractor(ABC):
    """
    Base class for all data extractors.

    Extractors are responsible for extracting specific data points from HTML.
    """

    def __init__(self):
        """Initialize the extractor."""
        self.name = self.__class__.__name__

    @abstractmethod
    def extract(self, html: str, url: str) -> Any:
        """
        Extract data from HTML.

        Args:
            html: The HTML content to extract from
            url: The URL of the page

        Returns:
            The extracted data (type depends on extractor)
        """
        pass

    def validate(self, value: Any) -> bool:
        """
        Validate the extracted value.

        Args:
            value: The value to validate

        Returns:
            True if valid, False otherwise
        """
        return value is not None

    def sanitize(self, value: Any) -> Any:
        """
        Sanitize the extracted value.

        Args:
            value: The value to sanitize

        Returns:
            The sanitized value
        """
        if isinstance(value, str):
            # Remove extra whitespace
            value = " ".join(value.split())
            # Trim
            value = value.strip()
        return value

    def handle_error(self, error: Exception) -> Optional[Any]:
        """
        Handle extraction errors.

        Args:
            error: The exception that occurred

        Returns:
            Default value or None
        """
        logger.warning(f"{self.name} extraction error: {str(error)}")
        return None

    def parse_html(self, html: str) -> BeautifulSoup:
        """
        Parse HTML into BeautifulSoup object.

        Args:
            html: The HTML string to parse

        Returns:
            BeautifulSoup object
        """
        return BeautifulSoup(html, "lxml")

    def extract_safe(self, html: str, url: str) -> Optional[Any]:
        """
        Safely extract data with error handling.

        Args:
            html: The HTML content
            url: The URL of the page

        Returns:
            Extracted data or None on error
        """
        try:
            result = self.extract(html, url)

            if not self.validate(result):
                return None

            result = self.sanitize(result)
            return result

        except Exception as e:
            return self.handle_error(e)
