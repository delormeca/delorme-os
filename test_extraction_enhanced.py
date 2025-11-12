"""
Enhanced data extraction test with full Crawl4AI configuration.
Includes extract_head=True and fetch_ssl_certificate=True to capture all data points.
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
from app.services.html_parser_service import HTMLParserService
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


async def extract_page_data_enhanced(url: str):
    """Extract data from a page using Crawl4AI with full configuration."""
    if not CRAWL4AI_AVAILABLE:
        return None

    print(f"\n[CRAWL] Starting enhanced extraction from: {url}")
    print("=" * 80)

    try:
        # Configure browser
        browser_config = BrowserConfig(
            headless=True,
            verbose=False,
            extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
        )

        # Enhanced crawler configuration
        crawler_config = CrawlerRunConfig(
            # Page handling
            page_timeout=60000,
            wait_until="domcontentloaded",
            word_count_threshold=1,  # Lower threshold to get more content

            # JavaScript execution support
            delay_before_return_html=1.5,  # Wait for JS to execute (including schema markup injection)

            # Enhanced data extraction
            fetch_ssl_certificate=True,  # Enable SSL certificate data

            # Screenshot capture
            screenshot=True,  # Capture full page screenshot (returns base64 PNG)
            screenshot_wait_for=1.0,  # Wait 1 second before capturing for dynamic content

            # Disable verbose to avoid Windows encoding issues
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
        import traceback
        traceback.print_exc()
        # Return a mock result object for testing
        class MockResult:
            def __init__(self):
                self.url = url
                self.success = False
                self.html = None
                self.cleaned_html = None
                self.markdown = None
                self.metadata = {}
                self.ssl_certificate = None
                self.error_message = str(e)
        return MockResult()


def extract_data_points_enhanced(crawl_result, mappings):
    """Extract and map data points from crawl result with enhanced extraction."""
    extracted = {}
    missing = []
    errors = []

    # Direct field mappings
    direct_fields = {
        'url': crawl_result.url,
        'success': crawl_result.success,
        'status_code': getattr(crawl_result, 'status_code', None),
        'html': crawl_result.html if crawl_result.html else None,
        'cleaned_html': crawl_result.cleaned_html if crawl_result.cleaned_html else None,
        'markdown': crawl_result.markdown if crawl_result.markdown else None,
        'error_message': getattr(crawl_result, 'error_message', None),

        # Content fields
        'body_content': crawl_result.markdown if crawl_result.markdown else None,

        # Screenshot fields (base64-encoded PNG)
        'screenshot_url': getattr(crawl_result, 'screenshot', None),
        'screenshot_full_url': getattr(crawl_result, 'screenshot', None),  # Same as screenshot_url in v0.7.6
    }

    # Calculate word count from markdown if available
    if direct_fields['body_content']:
        word_count = len(direct_fields['body_content'].split())
        direct_fields['word_count'] = word_count

    # Parse HTML for additional metadata
    html_data = {}
    if crawl_result.html:
        try:
            parser = HTMLParserService(crawl_result.html)
            html_data = parser.extract_all()
            print(f"[HTML PARSER] Extracted {len([v for v in html_data.values() if v is not None])} fields from HTML")
        except Exception as e:
            errors.append(f"HTML parsing error: {str(e)}")

    # Merge HTML-parsed data into direct fields
    direct_fields.update(html_data)

    # Extract metadata fields
    try:
        if hasattr(crawl_result, 'metadata') and crawl_result.metadata:
            metadata = crawl_result.metadata

            # Basic metadata
            direct_fields['page_title'] = metadata.get('title')
            direct_fields['meta_description'] = metadata.get('description')
            direct_fields['lang'] = metadata.get('language')
            direct_fields['charset'] = metadata.get('encoding')

            # Open Graph data
            if 'ogTitle' in metadata:
                direct_fields['head_data.og_title'] = metadata.get('ogTitle')
            if 'ogDescription' in metadata:
                direct_fields['head_data.og_description'] = metadata.get('ogDescription')
            if 'ogImage' in metadata:
                direct_fields['head_data.og_image'] = metadata.get('ogImage')
            if 'ogType' in metadata:
                direct_fields['head_data.og_type'] = metadata.get('ogType')
            if 'ogUrl' in metadata:
                direct_fields['head_data.og_url'] = metadata.get('ogUrl')
            if 'ogSiteName' in metadata:
                direct_fields['head_data.og_site_name'] = metadata.get('ogSiteName')

            # Twitter Card data
            if 'twitterCard' in metadata:
                direct_fields['head_data.twitter_card'] = metadata.get('twitterCard')
            if 'twitterTitle' in metadata:
                direct_fields['head_data.twitter_title'] = metadata.get('twitterTitle')
            if 'twitterDescription' in metadata:
                direct_fields['head_data.twitter_description'] = metadata.get('twitterDescription')
            if 'twitterImage' in metadata:
                direct_fields['head_data.twitter_image'] = metadata.get('twitterImage')
            if 'twitterSite' in metadata:
                direct_fields['head_data.twitter_site'] = metadata.get('twitterSite')
            if 'twitterCreator' in metadata:
                direct_fields['head_data.twitter_creator'] = metadata.get('twitterCreator')

            # Viewport
            if 'viewport' in metadata:
                direct_fields['meta_viewport'] = metadata.get('viewport')

        # Check for links
        if hasattr(crawl_result, 'links') and crawl_result.links:
            links = crawl_result.links
            direct_fields['internal_links'] = links.get('internal', [])
            direct_fields['external_links'] = links.get('external', [])

        # Check for media
        if hasattr(crawl_result, 'media') and crawl_result.media:
            media = crawl_result.media
            direct_fields['image_count'] = len(media.get('images', []))

        # SSL Certificate data
        if hasattr(crawl_result, 'ssl_certificate') and crawl_result.ssl_certificate:
            ssl_cert = crawl_result.ssl_certificate
            if isinstance(ssl_cert, dict):
                direct_fields['ssl_certificate.valid_until'] = ssl_cert.get('valid_until')
                direct_fields['ssl_certificate.days_until_expiry'] = ssl_cert.get('days_until_expiry')
                direct_fields['has_ssl_certificate'] = True
            else:
                direct_fields['has_ssl_certificate'] = True

    except Exception as e:
        errors.append(f"Metadata extraction error: {str(e)}")
        import traceback
        errors.append(traceback.format_exc())

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

    # Check what's still missing
    for crawl_field, dp_info in mappings.items():
        if crawl_field not in direct_fields or direct_fields.get(crawl_field) is None:
            # Check if it's a field that requires custom application logic
            if any(x in crawl_field for x in ['salient_entities', 'embedding',
                                               'last_crawled', 'last_checked']):
                missing.append({
                    'id': dp_info['id'],
                    'name': dp_info['name'],
                    'crawl4ai_field': crawl_field,
                    'reason': 'Requires NLP/embeddings or application timestamp'
                })

    return extracted, missing, errors


async def run_enhanced_test():
    """Main test function with enhanced extraction."""
    print("\n" + "=" * 80)
    print("CRAWL4AI ENHANCED DATA EXTRACTION TEST")
    print("=" * 80)

    # Step 1: Get data point mappings
    print("\n[STEP 1] Loading DataPointDefinition catalog...")
    mappings, all_data_points = await get_data_point_mappings()
    print(f"[SUCCESS] Loaded {len(all_data_points)} data point definitions")
    print(f"[INFO] {len(mappings)} fields mapped to Crawl4AI")

    # Step 2: Extract page data with enhanced config
    print("\n[STEP 2] Extracting data with ENHANCED configuration...")
    print("[CONFIG] fetch_ssl_certificate=True")
    print("[CONFIG] Enhanced metadata extraction enabled")
    crawl_result = await extract_page_data_enhanced(TEST_URL)

    if crawl_result is None:
        print("[ERROR] Crawl4AI not available or extraction failed")
        return

    print(f"[SUCCESS] Page crawled: {crawl_result.success}")
    print(f"[INFO] URL: {crawl_result.url}")

    # Debug: Show available attributes
    print("\n[DEBUG] Available crawl result attributes:")
    available_attrs = [attr for attr in dir(crawl_result) if not attr.startswith('_')]
    for attr in sorted(available_attrs):
        try:
            value = getattr(crawl_result, attr, None)
            if not callable(value):
                value_type = type(value).__name__
                if isinstance(value, (str, int, bool, float, type(None))):
                    if isinstance(value, str) and len(value) > 50:
                        print(f"  - {attr}: {value_type} = {str(value)[:50]}... (len={len(value)})")
                    else:
                        print(f"  - {attr}: {value_type} = {value}")
                elif isinstance(value, dict):
                    print(f"  - {attr}: dict with {len(value)} keys = {list(value.keys())[:5]}")
                elif isinstance(value, list):
                    print(f"  - {attr}: list with {len(value)} items")
                else:
                    print(f"  - {attr}: {value_type}")
        except Exception as e:
            print(f"  - {attr}: Error reading attribute: {str(e)[:30]}")

    # Step 3: Map extracted data to catalog
    print("\n[STEP 3] Mapping extracted data to catalog...")
    extracted, missing, errors = extract_data_points_enhanced(crawl_result, mappings)

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

    # Show missing
    if missing:
        print(f"\n[MISSING] {len(missing)} data points still require custom logic:")
        print("-" * 80)
        for item in missing[:10]:  # Show first 10
            print(f"    - {item['name']} ({item['crawl4ai_field']})")
        if len(missing) > 10:
            print(f"    ... and {len(missing) - 10} more")

    # Show errors
    if errors:
        print(f"\n[ERRORS] {len(errors)} errors occurred:")
        for error in errors[:3]:  # Show first 3
            print(f"    ! {error}")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total data points in catalog: {len(all_data_points)}")
    print(f"Successfully extracted:        {len(extracted)}")
    print(f"Still require custom logic:    {len(missing)}")
    print(f"Errors:                        {len(errors)}")
    print(f"Coverage:                      {len(extracted)/len(all_data_points)*100:.1f}%")

    # Improvement comparison
    basic_coverage = 7  # From previous test
    improvement = len(extracted) - basic_coverage
    if improvement > 0:
        print(f"\n[IMPROVEMENT] +{improvement} data points with enhanced config!")
        print(f"              ({basic_coverage} -> {len(extracted)} = +{improvement/basic_coverage*100:.0f}% increase)")

    print("\n[TEST COMPLETE]")


if __name__ == "__main__":
    if not CRAWL4AI_AVAILABLE:
        print("\n[ERROR] Crawl4AI is not installed!")
        print("Install with: poetry add crawl4ai")
        print("Then run: crawl4ai-setup")
        exit(1)

    asyncio.run(run_enhanced_test())
