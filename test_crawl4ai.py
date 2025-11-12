"""Test Crawl4AI basic functionality."""
import asyncio
import sys
import os
import io

# Fix Windows encoding issue - MUST be before importing crawl4ai
if sys.platform == 'win32':
    # Reconfigure stdout/stderr to use UTF-8
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

    os.environ['PYTHONIOENCODING'] = 'utf-8'
    os.environ['CRAWL4AI_VERBOSE'] = 'false'

    # Disable Crawl4AI's logger completely
    import logging
    logging.getLogger('crawl4ai').setLevel(logging.CRITICAL)
    logging.getLogger('crawl4ai').disabled = True

async def test_crawl():
    print("Testing Crawl4AI...")

    try:
        from crawl4ai import AsyncWebCrawler
        print("[OK] Crawl4AI imported successfully")

        # Test crawling a simple page
        async with AsyncWebCrawler(headless=True, verbose=False) as crawler:
            print("[OK] AsyncWebCrawler initialized")

            print("[...] Crawling example.com...")
            result = await crawler.arun(url="https://example.com")

            if result.success:
                print("[OK] Crawl successful!")
                print(f"     Status code: {result.status_code}")
                print(f"     HTML length: {len(result.html) if result.html else 0}")
                print(f"     Markdown length: {len(result.markdown) if result.markdown else 0}")
                return True
            else:
                print(f"[ERROR] Crawl failed: {result.error_message}")
                return False

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_crawl())
    sys.exit(0 if success else 1)
