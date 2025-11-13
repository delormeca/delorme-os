"""
Adaptive timeout configuration based on website characteristics.

Adjusts crawl timeout based on URL patterns and previous crawl history.
"""
from typing import Optional
from app.config.base import config


class AdaptiveTimeout:
    """
    Provides adaptive timeout values based on website type and context.
    """

    # URL patterns that indicate slower websites
    SLOW_SITE_PATTERNS = {
        'shopify': 60,  # E-commerce platforms with heavy JS
        'woocommerce': 60,
        'magento': 75,
        'bigcommerce': 60,
        '.app': 60,  # Modern JS-heavy apps
        'react': 60,
        'angular': 60,
        'vue': 60,
    }

    MEDIUM_SITE_PATTERNS = {
        'wordpress': 45,  # CMS platforms
        'drupal': 45,
        'joomla': 45,
        'wix': 45,
        'squarespace': 45,
        'weebly': 45,
    }

    @classmethod
    def get_timeout(
        cls,
        url: str,
        base_timeout: Optional[int] = None,
        attempt: int = 0
    ) -> int:
        """
        Get adaptive timeout for a URL.

        Args:
            url: The URL to crawl
            base_timeout: Override base timeout (default from config)
            attempt: Retry attempt number (increases timeout)

        Returns:
            Timeout in seconds
        """
        if base_timeout is None:
            base_timeout = config.crawl_timeout_seconds

        url_lower = url.lower()

        # Check for slow site patterns
        for pattern, timeout in cls.SLOW_SITE_PATTERNS.items():
            if pattern in url_lower:
                timeout_value = timeout
                break
        else:
            # Check for medium site patterns
            for pattern, timeout in cls.MEDIUM_SITE_PATTERNS.items():
                if pattern in url_lower:
                    timeout_value = timeout
                    break
            else:
                # Default timeout
                timeout_value = base_timeout

        # Increase timeout on retry attempts
        if attempt > 0:
            timeout_value = int(timeout_value * (1 + (attempt * 0.5)))  # +50% per retry

        # Cap maximum timeout at 120 seconds
        return min(timeout_value, 120)

    @classmethod
    def get_wait_time(cls, url: str) -> float:
        """
        Get wait time after page load based on URL.

        Args:
            url: The URL to crawl

        Returns:
            Wait time in seconds
        """
        url_lower = url.lower()

        # Heavy JS sites need more wait time
        if any(pattern in url_lower for pattern in cls.SLOW_SITE_PATTERNS.keys()):
            return 3.0  # 3 seconds for heavy JS sites

        if any(pattern in url_lower for pattern in cls.MEDIUM_SITE_PATTERNS.keys()):
            return 2.0  # 2 seconds for medium sites

        return 1.5  # Default wait time
