"""
Error classification system for web crawling.

Classifies errors into categories to enable smart retry logic and better error reporting.
"""
from enum import Enum
from typing import Tuple, Optional
import re


class ErrorCategory(str, Enum):
    """Categories of crawl errors."""

    NETWORK = "network"  # DNS, connection, SSL errors - worth retrying
    TIMEOUT = "timeout"  # Request timeout - worth retrying with longer timeout
    CLIENT_ERROR = "client_error"  # 4xx errors - usually not worth retrying
    SERVER_ERROR = "server_error"  # 5xx errors - worth retrying
    BOT_DETECTION = "bot_detection"  # Anti-bot protection - needs stealth mode
    PARSING = "parsing"  # HTML/JS parsing errors - might work with different config
    UNKNOWN = "unknown"  # Unclassified errors


class ErrorClassifier:
    """Classifies crawl errors into actionable categories."""

    # Patterns for error classification
    NETWORK_PATTERNS = [
        r"dns",
        r"connection.*refused",
        r"connection.*reset",
        r"connection.*timeout",
        r"ssl.*error",
        r"certificate",
        r"handshake",
        r"network.*unreachable",
    ]

    TIMEOUT_PATTERNS = [
        r"timeout",
        r"timed out",
        r"deadline exceeded",
        r"took too long",
    ]

    BOT_DETECTION_PATTERNS = [
        r"cloudflare",
        r"access denied",
        r"forbidden",
        r"captcha",
        r"blocked",
        r"robot",
        r"automation.*detected",
    ]

    PARSING_PATTERNS = [
        r"parse.*error",
        r"invalid.*html",
        r"javascript.*error",
        r"script.*error",
    ]

    @classmethod
    def classify_error(
        cls,
        error_message: str,
        status_code: Optional[int] = None
    ) -> Tuple[ErrorCategory, bool]:
        """
        Classify an error into a category and determine if retry is worth it.

        Args:
            error_message: The error message
            status_code: HTTP status code if available

        Returns:
            Tuple of (ErrorCategory, should_retry)
        """
        error_lower = error_message.lower()

        # Check status code first
        if status_code:
            if status_code == 404:
                return ErrorCategory.CLIENT_ERROR, False  # Page not found - don't retry
            elif status_code == 403:
                return ErrorCategory.BOT_DETECTION, True  # Might work with stealth mode
            elif 400 <= status_code < 500:
                return ErrorCategory.CLIENT_ERROR, False  # Client errors - don't retry
            elif 500 <= status_code < 600:
                return ErrorCategory.SERVER_ERROR, True  # Server errors - retry

        # Check error message patterns
        for pattern in cls.NETWORK_PATTERNS:
            if re.search(pattern, error_lower):
                return ErrorCategory.NETWORK, True  # Network issues - retry

        for pattern in cls.TIMEOUT_PATTERNS:
            if re.search(pattern, error_lower):
                return ErrorCategory.TIMEOUT, True  # Timeout - retry with longer timeout

        for pattern in cls.BOT_DETECTION_PATTERNS:
            if re.search(pattern, error_lower):
                return ErrorCategory.BOT_DETECTION, True  # Bot detection - retry with stealth

        for pattern in cls.PARSING_PATTERNS:
            if re.search(pattern, error_lower):
                return ErrorCategory.PARSING, True  # Parsing error - might work differently

        return ErrorCategory.UNKNOWN, True  # Unknown - give it a retry

    @classmethod
    def get_retry_delay(
        cls,
        attempt: int,
        error_category: ErrorCategory
    ) -> int:
        """
        Get the delay before retry based on attempt number and error category.

        Uses exponential backoff with category-specific adjustments.

        Args:
            attempt: Retry attempt number (0-indexed)
            error_category: Category of the error

        Returns:
            Delay in seconds
        """
        # Base exponential backoff: 2^attempt
        base_delay = 2 ** attempt

        # Adjust based on error category
        if error_category == ErrorCategory.NETWORK:
            # Network issues - use standard backoff
            return min(base_delay, 16)  # Cap at 16 seconds

        elif error_category == ErrorCategory.TIMEOUT:
            # Timeouts - longer delays
            return min(base_delay * 2, 30)  # Cap at 30 seconds

        elif error_category == ErrorCategory.SERVER_ERROR:
            # Server errors - give server time to recover
            return min(base_delay * 3, 45)  # Cap at 45 seconds

        elif error_category == ErrorCategory.BOT_DETECTION:
            # Bot detection - longer delays to seem more human
            return min(base_delay * 4, 60)  # Cap at 60 seconds

        else:
            # Default backoff
            return min(base_delay, 16)

    @classmethod
    def should_increase_timeout(cls, error_category: ErrorCategory) -> bool:
        """
        Determine if timeout should be increased for retry.

        Args:
            error_category: Category of the error

        Returns:
            True if timeout should be increased
        """
        return error_category in [
            ErrorCategory.TIMEOUT,
            ErrorCategory.PARSING,
        ]

    @classmethod
    def should_use_stealth_mode(cls, error_category: ErrorCategory) -> bool:
        """
        Determine if stealth mode should be used for retry.

        Args:
            error_category: Category of the error

        Returns:
            True if stealth mode should be enabled
        """
        return error_category == ErrorCategory.BOT_DETECTION

    @classmethod
    def get_human_readable_message(
        cls,
        error_category: ErrorCategory,
        original_message: str
    ) -> str:
        """
        Get a user-friendly error message.

        Args:
            error_category: Category of the error
            original_message: Original error message

        Returns:
            Human-readable error description
        """
        messages = {
            ErrorCategory.NETWORK: "Network error - Unable to connect to website",
            ErrorCategory.TIMEOUT: "Request timed out - Website took too long to respond",
            ErrorCategory.CLIENT_ERROR: "Page not found or access denied",
            ErrorCategory.SERVER_ERROR: "Website server error - Try again later",
            ErrorCategory.BOT_DETECTION: "Bot detection - Website blocked automated access",
            ErrorCategory.PARSING: "Content parsing error - Unable to extract data",
            ErrorCategory.UNKNOWN: f"Error: {original_message[:100]}",
        }

        return messages.get(error_category, original_message)
