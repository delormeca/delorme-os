"""
Screenshot storage service for saving and retrieving page screenshots.

Supports filesystem storage with automatic directory management.
"""
import os
import base64
import logging
from pathlib import Path
from typing import Optional
import uuid

logger = logging.getLogger(__name__)


class ScreenshotStorage:
    """Service for storing and retrieving screenshots."""

    def __init__(self, storage_dir: str = "static/screenshots"):
        """
        Initialize screenshot storage.

        Args:
            storage_dir: Directory to store screenshots
        """
        self.storage_dir = Path(storage_dir)
        self._ensure_directory_exists()

    def _ensure_directory_exists(self) -> None:
        """Create storage directory if it doesn't exist."""
        try:
            self.storage_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Screenshot storage directory ready: {self.storage_dir}")
        except Exception as e:
            logger.error(f"Failed to create screenshot directory: {e}")
            raise

    def save_screenshot(
        self,
        screenshot_base64: str,
        page_id: uuid.UUID,
        screenshot_type: str = "thumbnail"
    ) -> Optional[str]:
        """
        Save a base64-encoded screenshot to disk.

        Args:
            screenshot_base64: Base64-encoded PNG image
            page_id: Page UUID for filename
            screenshot_type: 'thumbnail' or 'full'

        Returns:
            Relative URL path to the screenshot, or None if failed
        """
        if not screenshot_base64:
            return None

        try:
            # Generate filename
            filename = f"{page_id}_{screenshot_type}.png"
            filepath = self.storage_dir / filename

            # Decode base64 and save
            screenshot_data = base64.b64decode(screenshot_base64)

            with open(filepath, "wb") as f:
                f.write(screenshot_data)

            # Return relative URL path
            url_path = f"/screenshots/{filename}"
            logger.debug(f"Saved screenshot: {url_path} ({len(screenshot_data)} bytes)")

            return url_path

        except Exception as e:
            logger.error(f"Failed to save screenshot for page {page_id}: {e}")
            return None

    def delete_screenshot(self, page_id: uuid.UUID, screenshot_type: str = "thumbnail") -> bool:
        """
        Delete a screenshot from disk.

        Args:
            page_id: Page UUID
            screenshot_type: 'thumbnail' or 'full'

        Returns:
            True if deleted successfully
        """
        try:
            filename = f"{page_id}_{screenshot_type}.png"
            filepath = self.storage_dir / filename

            if filepath.exists():
                filepath.unlink()
                logger.debug(f"Deleted screenshot: {filename}")
                return True

            return False

        except Exception as e:
            logger.error(f"Failed to delete screenshot for page {page_id}: {e}")
            return False

    def get_screenshot_path(
        self,
        page_id: uuid.UUID,
        screenshot_type: str = "thumbnail"
    ) -> Optional[str]:
        """
        Get the URL path for a screenshot.

        Args:
            page_id: Page UUID
            screenshot_type: 'thumbnail' or 'full'

        Returns:
            URL path if screenshot exists, None otherwise
        """
        filename = f"{page_id}_{screenshot_type}.png"
        filepath = self.storage_dir / filename

        if filepath.exists():
            return f"/screenshots/{filename}"

        return None

    def cleanup_orphaned_screenshots(self, valid_page_ids: list[uuid.UUID]) -> int:
        """
        Remove screenshots for pages that no longer exist.

        Args:
            valid_page_ids: List of page IDs that should have screenshots

        Returns:
            Number of screenshots deleted
        """
        if not self.storage_dir.exists():
            return 0

        deleted_count = 0
        valid_ids_str = {str(pid) for pid in valid_page_ids}

        try:
            for filepath in self.storage_dir.glob("*.png"):
                # Extract page ID from filename (format: {uuid}_{type}.png)
                page_id_str = filepath.stem.split("_")[0]

                if page_id_str not in valid_ids_str:
                    filepath.unlink()
                    deleted_count += 1
                    logger.debug(f"Deleted orphaned screenshot: {filepath.name}")

            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} orphaned screenshots")

            return deleted_count

        except Exception as e:
            logger.error(f"Error during screenshot cleanup: {e}")
            return deleted_count
