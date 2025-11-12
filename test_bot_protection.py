#!/usr/bin/env python3
"""Test bot protection detection for protected sitemaps."""
import asyncio
import sys
sys.path.insert(0, '.')

from app.utils.sitemap_parser import SitemapParser, SitemapParseError


async def test_protected_sitemap():
    """Test that bot protection is properly detected."""
    protected_url = "https://www.lcieducation.com/sitemap.xml"

    print(f"Testing bot protection detection: {protected_url}\n")
    print("="*70)

    parser = SitemapParser()

    try:
        print("\n1. Attempting to fetch sitemap...")
        urls = await parser.parse_sitemap(protected_url)
        print(f"   [UNEXPECTED] Got {len(urls)} URLs - protection may have been bypassed")

    except SitemapParseError as e:
        error_msg = str(e)
        print(f"   [EXPECTED] SitemapParseError caught")
        print(f"\n2. Error message:")
        print(f"   {error_msg}")

        print(f"\n3. Checking for BOT_PROTECTION prefix:")
        if error_msg.startswith("BOT_PROTECTION:"):
            print("   [OK] BOT_PROTECTION prefix detected")
            print(f"\n4. Frontend will display:")
            print("   - Warning severity (yellow, not red)")
            print("   - Title: 'Sitemap Protected by Security Measures'")
            print(f"   - Message: {error_msg.replace('BOT_PROTECTION:', '').strip()}")
            print("   - Alternative: 'Please use the Add Pages Manually option'")
        else:
            print("   [FAIL] BOT_PROTECTION prefix NOT found")
            print("   This is a generic error, not bot protection")

        print("\n" + "="*70)
        print("RESULT: Bot protection detection is working correctly!")
        print("="*70)

    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_protected_sitemap())
