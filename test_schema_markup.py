"""
Test schema markup extraction on real pages with JSON-LD schema.
Tests both static and JavaScript-heavy websites.
"""
import asyncio
import json
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
from app.services.html_parser_service import HTMLParserService

# Test URLs with known schema markup
TEST_URLS = [
    # E-commerce site (typically has Product schema)
    "https://www.amazon.com/dp/B0BSHF7WHW",
    # News article (typically has Article schema)
    "https://www.bbc.com/news",
    # Recipe site (typically has Recipe schema)
    "https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/",
    # Local business (may have LocalBusiness schema)
    "https://www.starbucks.com/store-locator/store/19773/",
]


async def test_schema_extraction(url: str, js_heavy: bool = False):
    """
    Test schema markup extraction.

    Args:
        url: URL to test
        js_heavy: If True, use config optimized for JavaScript-heavy sites
    """
    print(f"\n{'='*80}")
    print(f"Testing: {url}")
    print(f"JS-Heavy Mode: {js_heavy}")
    print(f"{'='*80}\n")

    # Configure browser
    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
    )

    # Configure crawler with JS-heavy site support
    if js_heavy:
        crawler_config = CrawlerRunConfig(
            page_timeout=60000,
            wait_until="networkidle",  # Wait for network to be idle (JS execution complete)
            delay_before_return_html=2.0,  # Extra delay for JS execution
            word_count_threshold=1,
            verbose=False,
        )
    else:
        crawler_config = CrawlerRunConfig(
            page_timeout=60000,
            wait_until="domcontentloaded",
            word_count_threshold=1,
            verbose=False,
        )

    try:
        async with AsyncWebCrawler(config=browser_config) as crawler:
            import logging
            logging.getLogger('crawl4ai').setLevel(logging.CRITICAL)

            result = await crawler.arun(url=url, config=crawler_config)

            if result.success and result.html:
                print(f"[SUCCESS] Page loaded")
                print(f"[INFO] HTML size: {len(result.html):,} characters")

                # Parse HTML and extract schema
                parser = HTMLParserService(result.html)
                schema_markup = parser.get_schema_markup()

                if schema_markup:
                    print(f"\n[FOUND] {len(schema_markup)} schema(s) extracted!")
                    print("-" * 80)

                    for i, schema in enumerate(schema_markup, 1):
                        print(f"\n[SCHEMA {i}]")

                        # Get schema type
                        schema_type = schema.get('@type', 'Unknown')
                        if isinstance(schema_type, list):
                            schema_type = ', '.join(schema_type)

                        print(f"  Type: {schema_type}")

                        # Get context
                        context = schema.get('@context', 'N/A')
                        print(f"  Context: {context}")

                        # Show key fields
                        print(f"  Keys: {list(schema.keys())[:10]}")

                        # Pretty print first 30 lines of schema
                        schema_json = json.dumps(schema, indent=2)
                        schema_lines = schema_json.split('\n')[:30]
                        print(f"\n  Preview:")
                        for line in schema_lines:
                            print(f"    {line}")

                        if len(schema_json.split('\n')) > 30:
                            print(f"    ... ({len(schema_json.split('\n')) - 30} more lines)")

                else:
                    print("[NOT FOUND] No schema markup on this page")

                    # Debug: Check if there are any script tags
                    print("\n[DEBUG] Checking for script tags...")
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(result.html, 'html.parser')
                    all_scripts = soup.find_all('script')
                    ld_json_scripts = soup.find_all('script', type='application/ld+json')

                    print(f"  Total <script> tags: {len(all_scripts)}")
                    print(f"  <script type='application/ld+json'> tags: {len(ld_json_scripts)}")

                    if ld_json_scripts:
                        print("\n  Found JSON-LD scripts but couldn't parse them:")
                        for i, script in enumerate(ld_json_scripts[:3], 1):
                            print(f"\n  Script {i} content (first 200 chars):")
                            content = script.string if script.string else str(script)[:200]
                            print(f"    {content[:200]}")

            else:
                print(f"[ERROR] Failed to load page")
                print(f"  Success: {result.success}")
                if hasattr(result, 'error_message'):
                    print(f"  Error: {result.error_message}")

    except Exception as e:
        print(f"[ERROR] Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()


async def run_tests():
    """Run schema extraction tests on multiple URLs."""
    print("\n" + "=" * 80)
    print("SCHEMA MARKUP EXTRACTION TESTS")
    print("=" * 80)

    # Test a simple URL first
    print("\n[TEST 1] Testing with standard config...")
    await test_schema_extraction(
        "https://www.bbc.com/news",
        js_heavy=False
    )

    # Test with JS-heavy config
    print("\n[TEST 2] Testing with JS-heavy config (networkidle + delay)...")
    await test_schema_extraction(
        "https://www.bbc.com/news",
        js_heavy=True
    )

    # Test on recipe site (typically has rich schema)
    print("\n[TEST 3] Testing recipe site (known to have schema)...")
    await test_schema_extraction(
        "https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/",
        js_heavy=True
    )

    print("\n" + "=" * 80)
    print("TESTS COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_tests())
