#!/usr/bin/env python3
"""Test sitemap parsing for pest agent."""
import asyncio
from lxml import etree
import httpx


async def test_parse():
    # Fetch sitemap
    async with httpx.AsyncClient() as client:
        response = await client.get("https://pestagent.ca/sitemap.xml")
        content = response.content

    # Parse
    root = etree.fromstring(content)
    ns = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    # Get URLs
    url_locs = root.xpath("//ns:url/ns:loc/text()", namespaces=ns)

    print(f"Found {len(url_locs)} URLs")
    print("\nFirst 3 URLs (RAW):")
    for i, url in enumerate(url_locs[:3], 1):
        print(f"\n{i}. RAW: {repr(url)}")
        print(f"   STRIPPED: {repr(url.strip())}")
        print(f"   LENGTH: {len(url)} -> {len(url.strip())}")

    # Test stripped
    stripped = [url.strip() for url in url_locs]
    print(f"\nAfter strip: {len(stripped)} URLs")
    print(f"First URL after strip: {stripped[0]}")


if __name__ == "__main__":
    asyncio.run(test_parse())
