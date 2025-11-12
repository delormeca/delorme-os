"""
Quick test to save a screenshot from the latest extraction.
"""
import asyncio
from base64 import b64decode

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

TEST_URL = "https://lasallecollegevancouver.lcieducation.com/en/programs-and-courses/diploma-accounting-and-bookkeeping"


async def save_screenshot():
    """Extract and save screenshot from a page."""
    print(f"\n[CRAWL] Capturing screenshot from: {TEST_URL}")
    print("=" * 80)

    try:
        # Configure browser
        browser_config = BrowserConfig(
            headless=True,
            verbose=False,
            extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
        )

        # Configure crawler with screenshot enabled
        crawler_config = CrawlerRunConfig(
            page_timeout=60000,
            wait_until="domcontentloaded",
            screenshot=True,
            screenshot_wait_for=1.0,
            verbose=False,
        )

        # Create crawler and extract
        async with AsyncWebCrawler(config=browser_config) as crawler:
            import logging
            logging.getLogger('crawl4ai').setLevel(logging.CRITICAL)

            result = await crawler.arun(url=TEST_URL, config=crawler_config)

            if result.success and result.screenshot:
                # Decode base64 and save to file
                screenshot_bytes = b64decode(result.screenshot)

                output_file = "lasalle_screenshot.png"
                with open(output_file, "wb") as f:
                    f.write(screenshot_bytes)

                print(f"[SUCCESS] Screenshot saved to: {output_file}")
                print(f"[INFO] Screenshot size: {len(screenshot_bytes):,} bytes")
                print(f"[INFO] Base64 length: {len(result.screenshot):,} characters")

                # Also show content stats
                if result.markdown:
                    word_count = len(result.markdown.split())
                    print(f"[INFO] Content word count: {word_count:,} words")
                    print(f"[INFO] Markdown length: {len(result.markdown):,} characters")
            else:
                print(f"[ERROR] Screenshot capture failed or page crawl unsuccessful")
                print(f"[ERROR] Success: {result.success}")
                print(f"[ERROR] Screenshot available: {result.screenshot is not None}")

    except Exception as e:
        print(f"[ERROR] Failed to capture screenshot: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(save_screenshot())
