"""
Test heading structure extraction on a real page.
"""
import asyncio
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from app.services.html_parser_service import HTMLParserService

TEST_URL = "https://lasallecollegevancouver.lcieducation.com/en/programs-and-courses/diploma-accounting-and-bookkeeping"


async def test_heading_structure():
    """Test heading structure extraction."""
    print(f"\n[TEST] Extracting heading structure from: {TEST_URL}")
    print("=" * 80)

    # Fetch page
    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
    )

    crawler_config = CrawlerRunConfig(
        page_timeout=60000,
        wait_until="domcontentloaded",
        verbose=False,
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        import logging
        logging.getLogger('crawl4ai').setLevel(logging.CRITICAL)

        result = await crawler.arun(url=TEST_URL, config=crawler_config)

        if result.success and result.html:
            print(f"[SUCCESS] HTML fetched: {len(result.html):,} characters\n")

            # Parse HTML and extract heading structure
            parser = HTMLParserService(result.html)
            heading_structure = parser.get_heading_structure()

            # Display heading structure
            print("[HEADING STRUCTURE]")
            print("-" * 80)
            print(f"Total headings found: {len(heading_structure)}\n")

            for i, heading in enumerate(heading_structure, 1):
                level = heading['level']
                tag = heading['tag']
                text = heading['text']

                # Add indentation based on level
                indent = "  " * (level - 1)

                print(f"{i:3}. {indent}<{tag}> {text}")

            # Summary by level
            print("\n" + "-" * 80)
            print("[SUMMARY BY LEVEL]")
            print("-" * 80)

            level_counts = {}
            for heading in heading_structure:
                level = heading['level']
                level_counts[level] = level_counts.get(level, 0) + 1

            for level in sorted(level_counts.keys()):
                print(f"  H{level}: {level_counts[level]} headings")

            print(f"\n  Total: {len(heading_structure)} headings")

        else:
            print(f"[ERROR] Failed to fetch HTML")


if __name__ == "__main__":
    asyncio.run(test_heading_structure())
