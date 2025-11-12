#!/usr/bin/env python3
"""Test URL validation for pestag agent URLs."""
import asyncio
from lxml import etree
import httpx
import sys
sys.path.insert(0, '.')

from app.utils.url_validator import URLValidator, URLValidationError


async def test_validation():
    # Fetch sitemap
    async with httpx.AsyncClient() as client:
        response = await client.get("https://pestagent.ca/sitemap.xml")
        content = response.content

    # Parse
    root = etree.fromstring(content)
    ns = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    url_locs = root.xpath("//ns:url/ns:loc/text()", namespaces=ns)

    # Strip
    stripped = [url.strip() for url in url_locs]

    print(f"Found {len(stripped)} URLs after stripping")

    # Test validation
    validator = URLValidator()

    valid_count = 0
    invalid_count = 0

    print("\nTesting first 5 URLs:")
    for i, url in enumerate(stripped[:5], 1):
        print(f"\n{i}. Testing: {repr(url)}")
        try:
            normalized = validator.validate_and_normalize(url)
            print(f"   [OK] VALID: {normalized}")
            valid_count += 1
        except URLValidationError as e:
            print(f"   [FAIL] INVALID: {e}")
            invalid_count += 1

    # Test all
    print(f"\n\nTesting ALL {len(stripped)} URLs...")
    for url in stripped:
        try:
            validator.validate_and_normalize(url)
            valid_count += 1
        except URLValidationError as e:
            invalid_count += 1
            if invalid_count <= 3:
                print(f"Error on {repr(url)}: {e}")

    print(f"\n[OK] Valid: {valid_count}")
    print(f"[FAIL] Invalid: {invalid_count}")


if __name__ == "__main__":
    asyncio.run(test_validation())
