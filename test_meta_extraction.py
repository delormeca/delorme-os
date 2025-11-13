"""Test script for meta tag extraction from HTMLParserService."""
import asyncio
from app.services.page_extraction_service import PageExtractionService
from app.db import get_async_db_session

async def test_meta_extraction():
    """Test meta tag extraction for MCA Resources homepage."""
    test_url = "https://mcaressources.ca/"

    print(f"\nTesting meta tag extraction for: {test_url}\n")
    print("=" * 80)

    async for db in get_async_db_session():
        try:
            # Create extraction service
            extraction_service = PageExtractionService(db)

            # Extract data
            print("Extracting data...")
            result = await extraction_service.extract_page_data(test_url)

            if not result.get('success'):
                print(f"ERROR: {result.get('error_message')}")
                break

            # Display extracted meta tags
            print("\nSUCCESS: EXTRACTION SUCCESSFUL!")
            print("=" * 80)

            print("\nCORE SEO META TAGS:")
            print(f"  Page Title:      {result.get('page_title', 'N/A')}")
            print(f"  Meta Title:      {result.get('meta_title', 'N/A')}")
            print(f"  Meta Description: {result.get('meta_description', 'N/A')[:100] if result.get('meta_description') else 'N/A'}...")

            print("\nONPAGE FACTORS:")
            print(f"  H1:              {result.get('h1', 'N/A')}")
            print(f"  Canonical URL:   {result.get('canonical_url', 'N/A')}")
            print(f"  Meta Robots:     {result.get('meta_robots', 'N/A')}")
            print(f"  Word Count:      {result.get('word_count', 'N/A')}")

            print("\nLINKS:")
            internal_links = result.get('internal_links', [])
            external_links = result.get('external_links', [])
            print(f"  Internal Links:  {len(internal_links) if internal_links else 0}")
            print(f"  External Links:  {len(external_links) if external_links else 0}")
            print(f"  Image Count:     {result.get('image_count', 'N/A')}")

            print("\nSTRUCTURED DATA:")
            schema_markup = result.get('schema_markup')
            print(f"  Schema Markup:   {len(schema_markup) if schema_markup else 0} objects")

            print("\n" + "=" * 80)

            # Check for missing fields
            missing_fields = []
            for field in ['page_title', 'meta_description', 'h1', 'word_count']:
                if not result.get(field):
                    missing_fields.append(field)

            if missing_fields:
                print(f"\nWARNING: Missing fields: {', '.join(missing_fields)}")
            else:
                print("\nSUCCESS: All core fields extracted successfully!")

        except Exception as e:
            print(f"\nERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
        break

if __name__ == "__main__":
    asyncio.run(test_meta_extraction())
