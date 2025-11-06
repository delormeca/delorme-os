#!/usr/bin/env python3
"""Test Shopify sitemap parsing for arvikabikerack.com."""
import asyncio
import sys
sys.path.insert(0, '.')

from app.utils.sitemap_parser import SitemapParser
from app.utils.url_validator import URLValidator, URLValidationError


async def test_shopify_sitemap():
    sitemap_url = "https://arvikabikerack.com/sitemap.xml"

    print(f"Testing Shopify sitemap: {sitemap_url}\n")
    print("="*70)

    # Parse sitemap
    parser = SitemapParser()

    try:
        print("\n1. Fetching and parsing sitemap...")
        urls = await parser.parse_sitemap(sitemap_url)
        print(f"   [OK] Found {len(urls)} URLs")

        # Show first 5 URLs
        print("\n2. First 5 URLs:")
        for i, url in enumerate(urls[:5], 1):
            print(f"   {i}. {url}")

        # Validate URLs
        print("\n3. Validating all URLs...")
        validator = URLValidator()

        valid_count = 0
        invalid_count = 0
        invalid_examples = []

        for url in urls:
            try:
                validator.validate_and_normalize(url)
                valid_count += 1
            except URLValidationError as e:
                invalid_count += 1
                if len(invalid_examples) < 3:
                    invalid_examples.append((url, str(e)))

        print(f"   [OK] Valid: {valid_count}")
        print(f"   [FAIL] Invalid: {invalid_count}")

        if invalid_examples:
            print("\n4. Invalid URL Examples:")
            for url, error in invalid_examples:
                print(f"   - {url}")
                print(f"     Error: {error}")

        # Summary
        print("\n" + "="*70)
        print(f"SUMMARY:")
        print(f"  Total URLs: {len(urls)}")
        print(f"  Valid: {valid_count} ({valid_count/len(urls)*100:.1f}%)")
        print(f"  Invalid: {invalid_count} ({invalid_count/len(urls)*100:.1f}%)")
        print("="*70)

        if invalid_count == 0:
            print("\n[SUCCESS] All URLs are valid! Ready to import.")
        else:
            print(f"\n[WARNING] {invalid_count} URLs will be skipped during import.")

    except Exception as e:
        print(f"\n[ERROR] Failed to parse sitemap: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_shopify_sitemap())
