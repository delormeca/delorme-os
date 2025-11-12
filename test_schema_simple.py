"""
Simple schema markup extraction test.
"""
import asyncio
import json
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from app.services.html_parser_service import HTMLParserService

# Test URLs
TEST_URLS = [
    ("BBC News", "https://www.bbc.com/news"),
    ("AllRecipes", "https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/"),
]


async def test_schema(name: str, url: str):
    """Test schema extraction on a URL."""
    print(f"\n{'='*80}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print(f"{'='*80}")

    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
    )

    # Config optimized for JS-heavy sites
    crawler_config = CrawlerRunConfig(
        page_timeout=60000,
        wait_until="domcontentloaded",
        delay_before_return_html=1.5,  # Wait for JS execution
        word_count_threshold=1,
        verbose=False,
    )

    try:
        async with AsyncWebCrawler(config=browser_config) as crawler:
            import logging
            logging.getLogger('crawl4ai').setLevel(logging.CRITICAL)

            result = await crawler.arun(url=url, config=crawler_config)

            if result.success and result.html:
                print(f"\n[SUCCESS] Page loaded ({len(result.html):,} chars)")

                # Extract schema
                parser = HTMLParserService(result.html)
                schema_markup = parser.get_schema_markup()

                if schema_markup:
                    print(f"\n[FOUND] {len(schema_markup)} schema(s)!")
                    for i, schema in enumerate(schema_markup, 1):
                        if isinstance(schema, dict):
                            schema_type = schema.get('@type', 'Unknown')
                            if isinstance(schema_type, list):
                                schema_type = ', '.join(schema_type)
                            print(f"  {i}. Type: {schema_type}")
                            print(f"     Keys: {len(schema.keys())} fields")
                        else:
                            print(f"  {i}. Type: {type(schema).__name__}")
                else:
                    print("\n[NOT FOUND] No schema markup")
            else:
                print(f"\n[ERROR] Failed to load page")
                print(f"  Success: {result.success}")

    except Exception as e:
        print(f"\n[ERROR] {str(e)[:100]}")


async def main():
    """Run tests."""
    print("\nSCHEMA MARKUP EXTRACTION TEST")
    print("=" * 80)

    for name, url in TEST_URLS:
        await test_schema(name, url)

    print("\n" + "=" * 80)
    print("TEST COMPLETE")


if __name__ == "__main__":
    asyncio.run(main())
