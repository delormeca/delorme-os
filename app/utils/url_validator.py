"""
URL validation and normalization utilities.
"""
from typing import Optional
from urllib.parse import urlparse, urlunparse, urljoin
import re


class URLValidationError(Exception):
    """Custom exception for URL validation errors."""
    pass


class URLValidator:
    """Validator and normalizer for URLs."""

    # Common file extensions to exclude
    EXCLUDED_EXTENSIONS = {
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.rar', '.tar', '.gz', '.7z',
        '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
        '.mp4', '.avi', '.mov', '.wmv', '.flv',
        '.mp3', '.wav', '.ogg', '.flac',
        '.exe', '.dmg', '.pkg', '.deb', '.rpm',
        '.css', '.js', '.json', '.xml'
    }

    # Protocols to allow
    ALLOWED_PROTOCOLS = {'http', 'https'}

    def __init__(
        self,
        max_length: int = 2048,
        allow_fragments: bool = False,
        normalize: bool = True,
        excluded_extensions: Optional[set] = None
    ):
        """
        Initialize URL validator.

        Args:
            max_length: Maximum allowed URL length
            allow_fragments: Whether to keep URL fragments (#section)
            normalize: Whether to normalize URLs
            excluded_extensions: Set of file extensions to exclude (uses defaults if None)
        """
        self.max_length = max_length
        self.allow_fragments = allow_fragments
        self.normalize = normalize
        self.excluded_extensions = excluded_extensions or self.EXCLUDED_EXTENSIONS

    def is_valid_url(self, url: str, raise_exception: bool = False) -> bool:
        """
        Check if URL is valid.

        Args:
            url: URL to validate
            raise_exception: Whether to raise exception on invalid URL

        Returns:
            True if valid, False otherwise

        Raises:
            URLValidationError: If raise_exception=True and URL is invalid
        """
        try:
            # Check length
            if len(url) > self.max_length:
                if raise_exception:
                    raise URLValidationError(f"URL exceeds maximum length of {self.max_length}")
                return False

            # Parse URL
            parsed = urlparse(url)

            # Check protocol
            if parsed.scheme not in self.ALLOWED_PROTOCOLS:
                if raise_exception:
                    raise URLValidationError(f"Invalid protocol: {parsed.scheme}. Must be http or https")
                return False

            # Check domain exists
            if not parsed.netloc:
                if raise_exception:
                    raise URLValidationError("URL must have a domain")
                return False

            # Check for valid domain format
            domain_pattern = re.compile(
                r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*'
                r'[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$'
            )
            if not domain_pattern.match(parsed.netloc.split(':')[0]):
                if raise_exception:
                    raise URLValidationError(f"Invalid domain format: {parsed.netloc}")
                return False

            # Check for excluded file extensions
            path = parsed.path.lower()
            for ext in self.excluded_extensions:
                if path.endswith(ext):
                    if raise_exception:
                        raise URLValidationError(f"File extension {ext} is not allowed")
                    return False

            return True

        except Exception as e:
            if raise_exception:
                if isinstance(e, URLValidationError):
                    raise
                raise URLValidationError(f"URL validation error: {str(e)}")
            return False

    def normalize_url(self, url: str) -> str:
        """
        Normalize URL to a consistent format.

        Normalization includes:
        - Converting domain to lowercase
        - Adding https:// if no protocol specified
        - Removing fragments unless allow_fragments=True
        - Removing trailing slashes from paths
        - Removing default ports (80 for http, 443 for https)

        Args:
            url: URL to normalize

        Returns:
            Normalized URL

        Raises:
            URLValidationError: If URL is invalid
        """
        # Add https:// if no protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # Parse URL
        parsed = urlparse(url)

        # Normalize components
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()

        # Remove default ports
        if ':80' in netloc and scheme == 'http':
            netloc = netloc.replace(':80', '')
        if ':443' in netloc and scheme == 'https':
            netloc = netloc.replace(':443', '')

        # Normalize path (remove trailing slash unless it's root)
        path = parsed.path
        if path and path != '/' and path.endswith('/'):
            path = path.rstrip('/')

        # Remove fragment unless allowed
        fragment = parsed.fragment if self.allow_fragments else ''

        # Reconstruct URL
        normalized = urlunparse((
            scheme,
            netloc,
            path,
            parsed.params,
            parsed.query,
            fragment
        ))

        return normalized

    def validate_and_normalize(self, url: str) -> str:
        """
        Validate and normalize URL in one step.

        Args:
            url: URL to validate and normalize

        Returns:
            Normalized URL

        Raises:
            URLValidationError: If URL is invalid
        """
        if self.normalize:
            url = self.normalize_url(url)

        self.is_valid_url(url, raise_exception=True)

        return url

    def validate_batch(self, urls: list[str], skip_invalid: bool = True) -> list[str]:
        """
        Validate and normalize a batch of URLs.

        Args:
            urls: List of URLs to validate
            skip_invalid: Whether to skip invalid URLs (True) or raise exception (False)

        Returns:
            List of valid, normalized URLs

        Raises:
            URLValidationError: If skip_invalid=False and any URL is invalid
        """
        valid_urls = []
        errors = []

        for url in urls:
            try:
                normalized = self.validate_and_normalize(url)
                valid_urls.append(normalized)
            except URLValidationError as e:
                if not skip_invalid:
                    raise
                errors.append((url, str(e)))

        return valid_urls

    def extract_domain(self, url: str) -> str:
        """
        Extract domain from URL.

        Args:
            url: URL to extract domain from

        Returns:
            Domain (e.g., 'example.com')

        Raises:
            URLValidationError: If URL is invalid
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()

            # Remove port if present
            if ':' in domain:
                domain = domain.split(':')[0]

            return domain
        except Exception as e:
            raise URLValidationError(f"Failed to extract domain: {str(e)}")

    def is_same_domain(self, url1: str, url2: str) -> bool:
        """
        Check if two URLs belong to the same domain.

        Args:
            url1: First URL
            url2: Second URL

        Returns:
            True if same domain, False otherwise
        """
        try:
            domain1 = self.extract_domain(url1)
            domain2 = self.extract_domain(url2)
            return domain1 == domain2
        except URLValidationError:
            return False

    def make_absolute_url(self, base_url: str, relative_url: str) -> str:
        """
        Convert relative URL to absolute using base URL.

        Args:
            base_url: Base URL
            relative_url: Relative URL to convert

        Returns:
            Absolute URL
        """
        return urljoin(base_url, relative_url)
