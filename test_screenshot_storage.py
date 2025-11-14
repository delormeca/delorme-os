"""
Test screenshot storage to filesystem.
Demonstrates that screenshots are now saved as PNG files instead of base64 in database.
"""
import asyncio
import sys
import io
import uuid
from datetime import datetime
from pathlib import Path

# Fix for Windows console encoding
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


async def test_screenshot_storage():
    """Test that screenshots are saved as files."""
    from app.services.robust_page_crawler import RobustPageCrawler
    from app.db import get_async_db_session
    from app.models import Client
    from sqlmodel import select

    url = "https://mcaressources.ca/formation-equipements-a-nacelle/"

    print(f"🕷️  Testing Screenshot Storage - Client-Based Organization")
    print("=" * 80)
    print(f"URL: {url}")
    print(f"Expected screenshot location: static/screenshots/{{client_id}}/")
    print()

    # Get database session
    async for db in get_async_db_session():
        try:
            # Get or create a test client
            result = await db.execute(select(Client).limit(1))
            client = result.scalars().first()

            if not client:
                print("❌ No client found in database. Please create a client first.")
                print("   You need to create a client in the database first.")
                return

            client_id = client.id
            print(f"✅ Using client: {client.name} (ID: {client_id})")
            print()

            # Crawl and store with screenshot
            print(f"🔍 Crawling page and saving screenshot to filesystem...")
            async with RobustPageCrawler(db) as crawler:
                page = await crawler.extract_and_store_page(
                    client_id=client_id,
                    url=url,
                )

            await db.commit()
            await db.refresh(page)

            print()
            print("=" * 80)
            print("✅ Screenshot Storage Test Results:")
            print("=" * 80)
            print()

            # Check if screenshot was saved
            if page.screenshot_url:
                print(f"✅ Screenshot URL in database: {page.screenshot_url}")
                print(f"   (Organized by client: {client_id})")
                print()

                # Check if file exists
                if page.screenshot_url.startswith('/screenshots/'):
                    # Remove /screenshots/ prefix and construct path
                    relative_path = page.screenshot_url.replace('/screenshots/', '')
                    filepath = Path('static/screenshots') / relative_path

                    if filepath.exists():
                        file_size = filepath.stat().st_size
                        print(f"✅ Screenshot file exists: {filepath}")
                        print(f"✅ File size: {file_size:,} bytes ({file_size / 1024:.1f} KB)")
                        print()
                        print("🎉 SUCCESS! Screenshot is organized by client folder!")
                        print()
                        print(f"File structure:")
                        print(f"  static/screenshots/")
                        print(f"  └── {client_id}/")
                        print(f"      └── {page.id}_thumbnail.png")
                        print()
                        print(f"You can view the screenshot at:")
                        print(f"  - File path: {filepath.absolute()}")
                        print(f"  - Web URL: http://localhost:8020{page.screenshot_url}")
                    else:
                        print(f"⚠️ Screenshot file not found: {filepath}")
                else:
                    print(f"⚠️ Screenshot URL doesn't point to /screenshots/: {page.screenshot_url}")
            else:
                print("❌ No screenshot URL in database")
                print("   This might mean screenshot capture failed during crawl")

            print()
            print("=" * 80)
            print("Database Storage Info:")
            print("=" * 80)
            print(f"Page ID: {page.id}")
            print(f"Page Title: {page.page_title}")
            print(f"Screenshot URL: {page.screenshot_url}")
            print(f"Screenshot stored as: FILE PATH (not base64)")
            print()

            # Check full screenshot if exists
            if page.screenshot_full_url:
                print(f"Full Screenshot URL: {page.screenshot_full_url}")
                if page.screenshot_full_url.startswith('/screenshots/'):
                    filename = page.screenshot_full_url.replace('/screenshots/', '')
                    filepath = Path('static/screenshots') / filename
                    if filepath.exists():
                        file_size = filepath.stat().st_size
                        print(f"✅ Full screenshot file exists: {filepath}")
                        print(f"✅ File size: {file_size:,} bytes ({file_size / 1024:.1f} KB)")

        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            break


if __name__ == "__main__":
    asyncio.run(test_screenshot_storage())
