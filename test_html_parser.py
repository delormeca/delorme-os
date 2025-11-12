"""
Test HTML parser to see what metadata is available.
"""
import asyncio
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from app.services.html_parser_service import HTMLParserService

TEST_URL = "https://lasallecollegevancouver.lcieducation.com/en/programs-and-courses/diploma-accounting-and-bookkeeping"


async def test_html_parser():
    """Test HTML parser on real page."""
    print(f"\n[TEST] Parsing HTML from: {TEST_URL}")
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

            # Parse HTML
            parser = HTMLParserService(result.html)
            extracted = parser.extract_all()

            # Show all extracted fields
            print("[EXTRACTED FIELDS]")
            print("-" * 80)

            for field, value in extracted.items():
                if value is not None:
                    # Format value for display
                    if isinstance(value, str):
                        value_str = value[:80] + "..." if len(value) > 80 else value
                    elif isinstance(value, list):
                        value_str = f"List with {len(value)} items"
                    elif isinstance(value, dict):
                        value_str = f"Dict with {len(value)} keys"
                    else:
                        value_str = str(value)

                    print(f"  + {field}: {value_str}")

            # Show missing fields
            print("\n[MISSING FIELDS]")
            print("-" * 80)
            for field, value in extracted.items():
                if value is None:
                    print(f"  - {field}")

            # Debug: Show all meta tags
            print("\n[DEBUG] All meta tags on page:")
            print("-" * 80)
            meta_tags = parser.get_all_meta_tags()
            for tag in meta_tags[:20]:  # First 20
                if any(tag.values()):
                    print(f"  {tag}")

            # Debug: Show all link tags
            print("\n[DEBUG] All link tags on page:")
            print("-" * 80)
            link_tags = parser.get_all_link_tags()
            for tag in link_tags[:20]:  # First 20
                if any(tag.values()):
                    print(f"  {tag}")

        else:
            print(f"[ERROR] Failed to fetch HTML")


if __name__ == "__main__":
    asyncio.run(test_html_parser())
