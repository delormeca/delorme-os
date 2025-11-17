"""
Apify Website Content Crawler service.

Handles interaction with Apify API for website crawling with full control:
- Start crawls (manual trigger)
- Stop/abort running crawls
- Pause crawls (implemented as graceful stop)
- Check crawl status
- Fetch results and screenshots
"""
import logging
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
import httpx

from app.config.base import config

logger = logging.getLogger(__name__)


class ApifyService:
    """
    Service for managing Apify Website Content Crawler runs.

    Provides full control over crawl lifecycle: start, stop, pause, and status monitoring.
    """

    ACTOR_ID = "apify/website-content-crawler"
    BASE_URL = "https://api.apify.com/v2"

    def __init__(self):
        """Initialize Apify service."""
        if not config.apify_api_token:
            logger.warning("⚠️  Apify API token not configured. Crawler disabled.")
            self.api_token = None
        else:
            self.api_token = config.apify_api_token
            logger.info("✅ Apify service initialized")

    def _get_headers(self) -> Dict[str, str]:
        """Get API request headers."""
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

    async def start_crawl(
        self,
        urls: List[str],
        client_name: str,
        max_depth: int = 0,
        save_html: bool = True,
        save_markdown: bool = True,
        save_screenshots: bool = True,
        timeout_secs: int = 300
    ) -> Optional[Dict[str, Any]]:
        """
        Start a new Apify crawl run.

        Args:
            urls: List of URLs to crawl
            client_name: Client name for labeling
            max_depth: Maximum crawl depth (0 = exact URLs only)
            save_html: Whether to save HTML
            save_markdown: Whether to save markdown
            save_screenshots: Whether to capture screenshots
            timeout_secs: Run timeout in seconds

        Returns:
            Run info dict with run_id, status, etc. or None on error
        """
        if not self.api_token:
            logger.error("Apify API token not configured")
            return None

        # Build run input
        run_input = {
            "startUrls": [{"url": url} for url in urls],
            "useSitemaps": False,
            "crawlerType": "playwright:adaptive",
            "maxCrawlDepth": max_depth,
            "maxCrawlPages": len(urls) if max_depth == 0 else 1000,
            "saveHtml": save_html,
            "saveMarkdown": save_markdown,
            "saveScreenshots": save_screenshots,
            "saveFiles": False,
            "blockMedia": False,  # Keep for accurate page weight
            "removeCookieWarnings": True,
            "debugMode": False,
            "proxyConfiguration": {"useApifyProxy": True},
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Start the actor run
                url = f"{self.BASE_URL}/acts/{self.ACTOR_ID}/runs"
                params = {"timeout": timeout_secs}

                logger.info(f"🚀 Starting Apify crawl for {len(urls)} URLs (client: {client_name})...")

                response = await client.post(
                    url,
                    headers=self._get_headers(),
                    json=run_input,
                    params=params
                )

                response.raise_for_status()
                data = response.json()["data"]

                run_id = data["id"]
                status = data["status"]

                logger.info(f"✅ Crawl started: run_id={run_id}, status={status}")

                return {
                    "run_id": run_id,
                    "status": status,
                    "started_at": data.get("startedAt"),
                    "default_dataset_id": data.get("defaultDatasetId"),
                    "default_key_value_store_id": data.get("defaultKeyValueStoreId"),
                }

        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Apify API error: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"❌ Error starting Apify crawl: {str(e)}", exc_info=True)
            return None

    async def stop_crawl(self, run_id: str) -> bool:
        """
        Stop/abort a running crawl immediately.

        Args:
            run_id: Apify run ID

        Returns:
            True if stopped successfully, False otherwise
        """
        if not self.api_token:
            logger.error("Apify API token not configured")
            return False

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"{self.BASE_URL}/actor-runs/{run_id}/abort"

                logger.info(f"🛑 Stopping crawl: run_id={run_id}")

                response = await client.post(
                    url,
                    headers=self._get_headers()
                )

                response.raise_for_status()
                data = response.json()["data"]

                logger.info(f"✅ Crawl stopped: run_id={run_id}, status={data['status']}")
                return True

        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Apify API error stopping crawl: {e.response.status_code} - {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"❌ Error stopping crawl: {str(e)}", exc_info=True)
            return False

    async def pause_crawl(self, run_id: str) -> bool:
        """
        Pause a running crawl gracefully.

        Note: Apify doesn't support true pause/resume. This performs a graceful abort.
        To resume, you would need to start a new crawl with remaining URLs.

        Args:
            run_id: Apify run ID

        Returns:
            True if paused successfully, False otherwise
        """
        # Apify doesn't have native pause - we implement as graceful stop
        logger.info(f"⏸️  Pausing crawl (graceful stop): run_id={run_id}")
        return await self.stop_crawl(run_id)

    async def get_run_status(self, run_id: str) -> Optional[Dict[str, Any]]:
        """
        Get current status of a crawl run.

        Args:
            run_id: Apify run ID

        Returns:
            Run status dict or None on error
        """
        if not self.api_token:
            logger.error("Apify API token not configured")
            return None

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"{self.BASE_URL}/actor-runs/{run_id}"

                response = await client.get(
                    url,
                    headers=self._get_headers()
                )

                response.raise_for_status()
                data = response.json()["data"]

                return {
                    "run_id": data["id"],
                    "status": data["status"],  # READY, RUNNING, SUCCEEDED, FAILED, ABORTED
                    "started_at": data.get("startedAt"),
                    "finished_at": data.get("finishedAt"),
                    "stats": data.get("stats", {}),
                    "default_dataset_id": data.get("defaultDatasetId"),
                    "default_key_value_store_id": data.get("defaultKeyValueStoreId"),
                    "exit_code": data.get("exitCode"),
                    "meta": data.get("meta", {}),
                }

        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Apify API error getting status: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"❌ Error getting run status: {str(e)}", exc_info=True)
            return None

    async def wait_for_completion(
        self,
        run_id: str,
        check_interval: int = 5,
        max_wait: int = 600
    ) -> Optional[Dict[str, Any]]:
        """
        Wait for a crawl run to complete.

        Args:
            run_id: Apify run ID
            check_interval: Seconds between status checks
            max_wait: Maximum seconds to wait

        Returns:
            Final run status dict or None on timeout/error
        """
        logger.info(f"⏳ Waiting for crawl completion: run_id={run_id}")

        elapsed = 0
        while elapsed < max_wait:
            status = await self.get_run_status(run_id)

            if not status:
                logger.error("Failed to get run status")
                return None

            run_status = status["status"]

            # Check if completed
            if run_status in ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]:
                logger.info(f"✅ Crawl completed: run_id={run_id}, status={run_status}")
                return status

            # Still running
            logger.info(f"⏳ Crawl in progress: run_id={run_id}, status={run_status}, elapsed={elapsed}s")
            await asyncio.sleep(check_interval)
            elapsed += check_interval

        logger.warning(f"⚠️  Crawl wait timeout after {max_wait}s: run_id={run_id}")
        return None

    async def get_dataset_items(
        self,
        dataset_id: str,
        limit: Optional[int] = None
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Fetch crawl results from dataset.

        Args:
            dataset_id: Apify dataset ID
            limit: Maximum number of items to fetch

        Returns:
            List of result items or None on error
        """
        if not self.api_token:
            logger.error("Apify API token not configured")
            return None

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                url = f"{self.BASE_URL}/datasets/{dataset_id}/items"
                params = {"format": "json"}
                if limit:
                    params["limit"] = limit

                logger.info(f"📥 Fetching dataset items: dataset_id={dataset_id}")

                response = await client.get(
                    url,
                    headers=self._get_headers(),
                    params=params
                )

                response.raise_for_status()
                items = response.json()

                logger.info(f"✅ Fetched {len(items)} items from dataset")
                return items

        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Apify API error fetching dataset: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"❌ Error fetching dataset: {str(e)}", exc_info=True)
            return None

    async def download_screenshot(
        self,
        key_value_store_id: str,
        screenshot_key: str
    ) -> Optional[bytes]:
        """
        Download screenshot from key-value store.

        Args:
            key_value_store_id: Apify key-value store ID
            screenshot_key: Screenshot key/filename

        Returns:
            Screenshot bytes or None on error
        """
        if not self.api_token:
            logger.error("Apify API token not configured")
            return None

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                url = f"{self.BASE_URL}/key-value-stores/{key_value_store_id}/records/{screenshot_key}"

                logger.info(f"📸 Downloading screenshot: {screenshot_key}")

                response = await client.get(
                    url,
                    headers=self._get_headers()
                )

                response.raise_for_status()

                logger.info(f"✅ Downloaded screenshot: {len(response.content)} bytes")
                return response.content

        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Apify API error downloading screenshot: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"❌ Error downloading screenshot: {str(e)}", exc_info=True)
            return None


# Singleton instance
_apify_service: Optional[ApifyService] = None


def get_apify_service() -> ApifyService:
    """
    Get singleton Apify service instance.

    Returns:
        ApifyService instance
    """
    global _apify_service

    if _apify_service is None:
        _apify_service = ApifyService()

    return _apify_service
