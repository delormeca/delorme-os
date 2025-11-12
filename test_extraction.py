"""
Test data extraction from a real page using Crawl4AI.
Validates the complete pipeline: crawl -> extract -> map to DataPointDefinition catalog.
"""
import asyncio
import json
from datetime import datetime

# Crawl4AI imports
try:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
    CRAWL4AI_AVAILABLE = True
except ImportError:
    CRAWL4AI_AVAILABLE = False
    print("[ERROR] Crawl4AI not installed. Run: poetry add crawl4ai")

from app.db import AsyncSessionLocal
from app.models import DataPointDefinition
from sqlalchemy import select


# Test URL
TEST_URL = "https://lasallecollegevancouver.lcieducation.com/en/programs-and-courses/diploma-accounting-and-bookkeeping"


async def get_data_point_mappings():
    """Retrieve all data point definitions from database."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(DataPointDefinition)
            .where(DataPointDefinition.is_active == True)
            .order_by(DataPointDefinition.category, DataPointDefinition.display_order)
        )
        data_points = result.scalars().all()

        # Create mapping dict: crawl4ai_field -> DataPointDefinition
        mappings = {}
        for dp in data_points:
            mappings[dp.crawl4ai_field] = {
                "id": dp.id,
                "name": dp.name,
                "category": str(dp.category).split('.')[-1],
                "data_type": str(dp.data_type).split('.')[-1],
                "description": dp.description
            }

        return mappings, data_points


async def extract_page_data(url: str):
    """Extract data from a page using Crawl4AI."""
    if not CRAWL4AI_AVAILABLE:
        return None

    print(f"\n[CRAWL] Starting extraction from: {url}")
    print("=" * 80)

    try:
        # Configure browser
        browser_config = BrowserConfig(
            headless=True,
            verbose=False,
            extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
        )

        # Configure crawler - disable verbose to avoid Windows encoding issues
        crawler_config = CrawlerRunConfig(
            word_count_threshold=10,
            page_timeout=60000,
            wait_until="domcontentloaded",
            verbose=False,
        )

        # Create crawler and extract
        async with AsyncWebCrawler(config=browser_config) as crawler:
            # Disable logger temporarily to avoid Windows Unicode issues
            import logging
            logging.getLogger('crawl4ai').setLevel(logging.CRITICAL)

            result = await crawler.arun(
                url=url,
                config=crawler_config
            )

            return result
    except Exception as e:
        print(f"[ERROR] Crawl failed: {str(e)}")
        # Return a mock result object for testing
        class MockResult:
            def __init__(self):
                self.url = url
                self.success = False
                self.html = None
                self.cleaned_html = None
                self.markdown = None
                self.error_message = str(e)
        return MockResult()


def extract_data_points(crawl_result, mappings):
    """Extract and map data points from crawl result."""
    extracted = {}
    missing = []
    errors = []

    # Direct field mappings (available without config)
    direct_fields = {
        'url': crawl_result.url,
        'success': crawl_result.success,
        'status_code': getattr(crawl_result, 'status_code', None),
        'html': crawl_result.html if crawl_result.html else None,
        'cleaned_html': crawl_result.cleaned_html if crawl_result.cleaned_html else None,
        'markdown': crawl_result.markdown if crawl_result.markdown else None,
        'error_message': getattr(crawl_result, 'error_message', None),
    }

    # Try to extract metadata fields
    try:
        if hasattr(crawl_result, 'metadata'):
            metadata = crawl_result.metadata or {}
            direct_fields['page_title'] = metadata.get('title')
            direct_fields['meta_description'] = metadata.get('description')

        # Check for links
        if hasattr(crawl_result, 'links'):
            links = crawl_result.links or {}
            direct_fields['internal_links'] = links.get('internal', [])
            direct_fields['external_links'] = links.get('external', [])

        # Check for media
        if hasattr(crawl_result, 'media'):
            media = crawl_result.media or {}
            direct_fields['image_count'] = len(media.get('images', []))

    except Exception as e:
        errors.append(f"Metadata extraction error: {str(e)}")

    # Map extracted fields to our catalog
    for crawl_field, value in direct_fields.items():
        if crawl_field in mappings:
            dp_info = mappings[crawl_field]
            if value is not None:
                extracted[dp_info['id']] = {
                    'name': dp_info['name'],
                    'category': dp_info['category'],
                    'value': value,
                    'crawl4ai_field': crawl_field
                }

    # Check what's missing (requires config)
    for crawl_field, dp_info in mappings.items():
        if crawl_field not in direct_fields or direct_fields[crawl_field] is None:
            # Check if it's a field that requires special config
            if 'head_data' in crawl_field or 'ssl_certificate' in crawl_field:
                missing.append({
                    'id': dp_info['id'],
                    'name': dp_info['name'],
                    'crawl4ai_field': crawl_field,
                    'reason': 'Requires extract_head=True or fetch_ssl_certificate=True'
                })

    return extracted, missing, errors


async def run_test():
    """Main test function."""
    print("\n" + "=" * 80)
    print("CRAWL4AI DATA EXTRACTION TEST")
    print("=" * 80)

    # Step 1: Get data point mappings
    print("\n[STEP 1] Loading DataPointDefinition catalog...")
    mappings, all_data_points = await get_data_point_mappings()
    print(f"[SUCCESS] Loaded {len(all_data_points)} data point definitions")
    print(f"[INFO] {len(mappings)} fields mapped to Crawl4AI")

    # Step 2: Extract page data
    print("\n[STEP 2] Extracting data from page...")
    crawl_result = await extract_page_data(TEST_URL)

    if crawl_result is None:
        print("[ERROR] Crawl4AI not available or extraction failed")
        return

    print(f"[SUCCESS] Page crawled: {crawl_result.success}")
    print(f"[INFO] URL: {crawl_result.url}")

    # Step 3: Map extracted data to catalog
    print("\n[STEP 3] Mapping extracted data to catalog...")
    extracted, missing, errors = extract_data_points(crawl_result, mappings)

    # Display results
    print("\n" + "=" * 80)
    print("EXTRACTION RESULTS")
    print("=" * 80)

    print(f"\n[EXTRACTED] {len(extracted)} data points successfully extracted:")
    print("-" * 80)

    # Group by category
    by_category = {}
    for dp_id, data in extracted.items():
        category = data['category']
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(data)

    for category in sorted(by_category.keys()):
        print(f"\n  [{category}]")
        for data in by_category[category]:
            value_preview = str(data['value'])[:60]
            if len(str(data['value'])) > 60:
                value_preview += "..."
            print(f"    + {data['name']}")
            print(f"      Value: {value_preview}")

    # Show missing (require config)
    if missing:
        print(f"\n[MISSING] {len(missing)} data points require additional config:")
        print("-" * 80)
        config_groups = {}
        for item in missing:
            reason = item['reason']
            if reason not in config_groups:
                config_groups[reason] = []
            config_groups[reason].append(item['name'])

        for reason, names in config_groups.items():
            print(f"\n  {reason}:")
            for name in names[:5]:  # Show first 5
                print(f"    - {name}")
            if len(names) > 5:
                print(f"    ... and {len(names) - 5} more")

    # Show errors
    if errors:
        print(f"\n[ERRORS] {len(errors)} errors occurred:")
        for error in errors:
            print(f"    ! {error}")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total data points in catalog: {len(all_data_points)}")
    print(f"Successfully extracted:        {len(extracted)}")
    print(f"Require additional config:     {len(missing)}")
    print(f"Errors:                        {len(errors)}")
    print(f"Coverage:                      {len(extracted)/len(all_data_points)*100:.1f}%")

    # Show what config is needed
    print("\n[NEXT STEPS] To extract missing data points, configure:")
    print("  1. SeedingConfig(extract_head=True) - for Open Graph, Twitter Cards, language")
    print("  2. CrawlerRunConfig(fetch_ssl_certificate=True) - for SSL data")
    print("  3. CrawlerRunConfig(capture_network_requests=True) - for performance data")

    print("\n[TEST COMPLETE]")


if __name__ == "__main__":
    if not CRAWL4AI_AVAILABLE:
        print("\n[ERROR] Crawl4AI is not installed!")
        print("Install with: poetry add crawl4ai")
        print("Then run: crawl4ai-setup")
        exit(1)

    asyncio.run(run_test())
