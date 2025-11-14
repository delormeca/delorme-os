"""
Test script for RobustPageCrawler - demonstrates all features.

Run with: poetry run python test_robust_crawler.py
"""
import asyncio
import logging
from typing import List

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


async def test_single_url():
    """Test 1: Single URL extraction."""
    print("\n" + "="*60)
    print("TEST 1: Single URL Extraction")
    print("="*60)

    from app.services.robust_page_crawler import RobustPageCrawler

    async with RobustPageCrawler() as crawler:
        # Test with a real URL (change to your site)
        url = "https://example.com"

        result = await crawler.extract_page_data(url)

        print(f"\n📋 Result for {url}:")
        print(f"  Success: {result['success']}")

        if result['success']:
            print(f"  Title: {result.get('page_title')}")
            print(f"  Meta Description: {result.get('meta_description', 'N/A')[:100]}")
            print(f"  H1: {result.get('h1')}")
            print(f"  Word Count: {result.get('word_count')}")
            print(f"  Status Code: {result.get('status_code')}")

            # Validation results
            validation = result['validation']
            print(f"\n  ✅ Quality Score: {validation['quality_score']}/100")
            print(f"  Issues: {validation['issues']}")
            print(f"  Warnings: {validation['warnings']}")
        else:
            print(f"  ❌ Error: {result.get('error_message')}")


async def test_batch_crawl():
    """Test 2: Batch crawling multiple URLs."""
    print("\n" + "="*60)
    print("TEST 2: Batch Crawling")
    print("="*60)

    from app.services.robust_page_crawler import RobustPageCrawler

    # Test URLs (replace with your sitemap URLs)
    urls = [
        "https://example.com",
        "https://example.com/about",
        "https://example.com/contact",
        "https://httpstat.us/404",  # Will fail (404)
        "https://httpstat.us/500",  # Will retry (server error)
    ]

    async with RobustPageCrawler() as crawler:
        print(f"\n🚀 Crawling {len(urls)} URLs...")

        results = await crawler.crawl_batch(
            urls=urls,
            max_concurrent=3,
            max_retries=2,
        )

        # Analyze results
        print(f"\n📊 Batch Results:")
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]

        print(f"  ✅ Successful: {len(successful)}/{len(urls)}")
        print(f"  ❌ Failed: {len(failed)}/{len(urls)}")

        if successful:
            avg_quality = sum(r['validation']['quality_score'] for r in successful) / len(successful)
            print(f"  📈 Average Quality: {avg_quality:.1f}/100")

        # Show failed URLs
        if failed:
            print(f"\n  Failed URLs:")
            for r in failed:
                retry_info = r.get('retry_info', {})
                print(f"    - {r['url']}: {r['error_message'][:80]}")
                print(f"      Category: {retry_info.get('error_category', 'unknown')}")


async def test_retry_logic():
    """Test 3: Retry logic with error classification."""
    print("\n" + "="*60)
    print("TEST 3: Retry Logic & Error Classification")
    print("="*60)

    from app.services.robust_page_crawler import RobustPageCrawler

    test_cases = [
        ("https://httpstat.us/404", "Client Error (should NOT retry)"),
        ("https://httpstat.us/500", "Server Error (should retry)"),
        ("https://httpstat.us/503", "Service Unavailable (should retry)"),
    ]

    async with RobustPageCrawler() as crawler:
        for url, description in test_cases:
            print(f"\n🧪 Testing: {description}")
            print(f"   URL: {url}")

            result = await crawler.extract_page_data(url, max_retries=3)

            retry_info = result.get('retry_info', {})
            print(f"   Result: {'✅ Success' if result['success'] else '❌ Failed'}")
            print(f"   Attempts: {retry_info.get('attempts', 1)}")
            print(f"   Category: {retry_info.get('error_category', 'N/A')}")
            print(f"   Retryable: {retry_info.get('retryable', 'N/A')}")


async def test_validation():
    """Test 4: Data validation and quality scoring."""
    print("\n" + "="*60)
    print("TEST 4: Validation & Quality Scoring")
    print("="*60)

    from app.services.robust_page_crawler import ExtractionValidation

    # Test cases
    test_data = [
        {
            'name': 'Perfect Page',
            'data': {
                'page_title': 'Test Page',
                'meta_description': 'This is a test page with good content',
                'h1': 'Main Heading',
                'word_count': 500,
                'canonical_url': 'https://example.com',
            }
        },
        {
            'name': 'Missing Title',
            'data': {
                'meta_description': 'Page without title',
                'h1': 'Heading',
                'word_count': 200,
            }
        },
        {
            'name': 'Thin Content',
            'data': {
                'page_title': 'Short Page',
                'word_count': 20,  # Too low
            }
        }
    ]

    for test in test_data:
        print(f"\n📝 Testing: {test['name']}")

        validated = ExtractionValidation.validate_extraction(
            test['data'],
            'https://example.com'
        )

        validation = validated['validation']
        print(f"   Quality Score: {validation['quality_score']}/100")
        print(f"   Issues: {validation['issues']}")
        print(f"   Warnings: {validation['warnings']}")


async def test_rate_limiting():
    """Test 5: Rate limiting and delays."""
    print("\n" + "="*60)
    print("TEST 5: Rate Limiting")
    print("="*60)

    from app.services.robust_page_crawler import RateLimiter

    rate_limiter = RateLimiter()

    print("\n⏱️  Testing normal delays (random 1-3s):")
    for i in range(3):
        start = asyncio.get_event_loop().time()
        await rate_limiter.wait(status_code=200)
        duration = asyncio.get_event_loop().time() - start
        print(f"   Delay {i+1}: {duration:.2f}s")

    print("\n⚠️  Testing rate limit delays (exponential backoff):")
    for i in range(3):
        start = asyncio.get_event_loop().time()
        await rate_limiter.wait(status_code=429)  # Rate limited
        duration = asyncio.get_event_loop().time() - start
        print(f"   Rate limit {i+1}: {duration:.2f}s")

    print("\n✅ Reset after success:")
    await rate_limiter.wait(status_code=200)
    print(f"   Consecutive rate limits reset: {rate_limiter.consecutive_rate_limits}")


async def test_stealth_mode():
    """Test 6: Stealth mode configuration."""
    print("\n" + "="*60)
    print("TEST 6: Stealth Mode")
    print("="*60)

    from app.services.robust_page_crawler import RobustPageCrawler

    async with RobustPageCrawler() as crawler:
        # Normal mode
        print("\n🌐 Normal mode crawl:")
        result1 = await crawler.extract_page_data(
            "https://example.com",
            use_stealth=False
        )
        print(f"   Success: {result1['success']}")
        print(f"   Stealth enabled: {result1.get('crawl_metadata', {}).get('stealth_enabled')}")

        # Stealth mode
        print("\n🥷 Stealth mode crawl:")
        result2 = await crawler.extract_page_data(
            "https://example.com",
            use_stealth=True
        )
        print(f"   Success: {result2['success']}")
        print(f"   Stealth enabled: {result2.get('crawl_metadata', {}).get('stealth_enabled')}")


async def test_dom_rendering_check():
    """Test 7: DOM rendering detection."""
    print("\n" + "="*60)
    print("TEST 7: DOM Rendering Detection")
    print("="*60)

    from app.services.robust_page_crawler import ExtractionValidation

    test_cases = [
        ("Complete HTML", "<html><head><title>Test</title></head><body><p>Content</p></body></html>", True),
        ("Empty Root", '<html><body><div id="root"></div></body></html>', False),
        ("Empty App", '<html><body><div id="app"></div></body></html>', False),
        ("Minimal", "<html></html>", False),
    ]

    for name, html, expected in test_cases:
        result = ExtractionValidation.check_dom_rendered(html)
        status = "✅" if result == expected else "❌"
        print(f"   {status} {name}: {result} (expected: {expected})")


async def run_all_tests():
    """Run all tests."""
    print("\n" + "="*60)
    print("🧪 ROBUST PAGE CRAWLER - TEST SUITE")
    print("="*60)

    tests = [
        ("Single URL Extraction", test_single_url),
        ("Batch Crawling", test_batch_crawl),
        ("Retry Logic", test_retry_logic),
        ("Validation", test_validation),
        ("Rate Limiting", test_rate_limiting),
        ("Stealth Mode", test_stealth_mode),
        ("DOM Rendering Check", test_dom_rendering_check),
    ]

    for name, test_func in tests:
        try:
            await test_func()
        except Exception as e:
            print(f"\n❌ Test '{name}' failed: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "="*60)
    print("✅ ALL TESTS COMPLETE")
    print("="*60)


if __name__ == "__main__":
    # Set up event loop policy for Windows
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    # Run tests
    asyncio.run(run_all_tests())
