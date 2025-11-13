"""
Create all 6 test clients from sitemap.md and test their sitemaps.
"""
import asyncio
import sys
import io
from playwright.async_api import async_playwright

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Test clients from sitemap.md
TEST_CLIENTS = [
    {
        "name": "Cleio",
        "website": "https://cleio.com",
        "sitemap": "https://cleio.com/sitemaps.xml"
    },
    {
        "name": "Collé à Moi",
        "website": "https://colleamoi.com",
        "sitemap": "https://colleamoi.com/sitemap.xml"
    },
    {
        "name": "Mabel's Labels",
        "website": "https://mabelslabels.com",
        "sitemap": "https://mabelslabels.com/sitemap.xml"
    },
    {
        "name": "Pest Agent",
        "website": "https://pestagent.ca",
        "sitemap": "https://pestagent.ca/sitemap.xml"
    },
    {
        "name": "Techo-Bloc",
        "website": "https://www.techo-bloc.com",
        "sitemap": "https://www.techo-bloc.com/sitemap/sitemap-index.xml"
    },
]

async def create_and_test_clients():
    """Create all test clients and test their sitemaps."""

    async with async_playwright() as p:
        print("\n🎬 CREATING ALL 6 TEST CLIENTS FROM SITEMAP.MD")
        print("=" * 80)

        browser = await p.chromium.launch(headless=False, slow_mo=800)
        page = await browser.new_page()

        try:
            # Login
            print("\n🔐 Logging in...")
            await page.goto("http://localhost:5175/login")
            await page.fill('input[type="email"]', "tommy@delorme.ca")
            await page.fill('input[type="password"]', "Hockey999!!!")
            await page.click('button[type="submit"]')
            await page.wait_for_function("window.location.pathname !== '/login'", timeout=15000)
            print("✅ Logged in")
            await asyncio.sleep(1)

            # Create each client
            for i, client in enumerate(TEST_CLIENTS, 1):
                print(f"\n{'=' * 80}")
                print(f"📋 CLIENT {i}/5: {client['name']}")
                print(f"{'=' * 80}")

                # Navigate to create page
                await page.goto("http://localhost:5175/clients/new")
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(1)

                # Fill form
                print(f"📝 Filling form for {client['name']}...")
                await page.fill('input[name="name"]', client["name"])
                await page.fill('input[name="website_url"]', client["website"])
                await page.fill('input[name="sitemap_url"]', client["sitemap"])

                # Submit
                print(f"💾 Creating client...")
                await page.click('button[type="submit"]:has-text("Create Client")')
                await asyncio.sleep(3)

                # Verify creation
                await page.goto("http://localhost:5175/clients")
                await page.wait_for_load_state("networkidle")

                if await page.locator(f'text="{client["name"]}"').count() > 0:
                    print(f"✅ Client '{client['name']}' created successfully")
                else:
                    print(f"⚠️  Client '{client['name']}' may not have been created")

                await asyncio.sleep(1)

            # Now test sitemaps for each client
            print(f"\n\n{'=' * 80}")
            print("🧪 TESTING SITEMAPS FOR ALL CLIENTS")
            print(f"{'=' * 80}\n")

            await page.goto("http://localhost:5175/clients")
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(2)

            for i, client in enumerate(TEST_CLIENTS, 1):
                print(f"\n{'-' * 80}")
                print(f"🔍 TESTING: {client['name']}")
                print(f"{'-' * 80}")

                # Click client
                client_link = page.locator(f'text="{client["name"]}"').first
                if await client_link.count() == 0:
                    print(f"❌ Could not find client '{client['name']}'")
                    continue

                await client_link.click()
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)

                # Click Setup Engine
                setup_button = page.locator('button:has-text("Setup Website Engine")').or_(
                    page.locator('button:has-text("Configure Engine")')
                )

                if await setup_button.count() == 0:
                    print(f"⚠️  Setup button not found for {client['name']}")
                    await page.goto("http://localhost:5175/clients")
                    continue

                await setup_button.first.click()
                await asyncio.sleep(2)

                # Wait for modal
                try:
                    await page.wait_for_selector('[role="dialog"]', state="visible", timeout=5000)
                    print(f"✅ Modal opened for {client['name']}")
                except:
                    print(f"⚠️  Modal did not open for {client['name']}")
                    await page.goto("http://localhost:5175/clients")
                    continue

                # Test sitemap
                print(f"🔍 Testing sitemap: {client['sitemap']}")

                test_button = page.locator('button:has-text("Test Sitemap")')
                if await test_button.count() > 0:
                    await test_button.click()
                    print(f"⏳ Testing sitemap...")
                    await asyncio.sleep(5)

                    # Check results
                    success = page.locator('text=/\\d+ (pages|URLs)/i')
                    error = page.locator('[role="alert"]')

                    if await success.count() > 0:
                        result = await success.first.text_content()
                        print(f"✅ SUCCESS: {result}")
                    elif await error.count() > 0:
                        error_msg = await error.first.text_content()
                        print(f"⚠️  RESULT: {error_msg}")
                    else:
                        print(f"⚠️  No clear result")

                await asyncio.sleep(2)

                # Close modal and go back
                close_btn = page.locator('button[aria-label="close"]').or_(
                    page.keyboard.press("Escape")
                )
                try:
                    if await close_btn.count() > 0:
                        await close_btn.first.click()
                except:
                    pass

                await page.goto("http://localhost:5175/clients")
                await asyncio.sleep(1)

            print(f"\n\n{'=' * 80}")
            print("✅ ALL CLIENTS CREATED AND TESTED")
            print(f"{'=' * 80}\n")

            await page.screenshot(path="all_clients_complete.png", full_page=True)
            print("📸 Screenshot saved: all_clients_complete.png")

            print("\n⏱️  Keeping browser open for 15 seconds...")
            await asyncio.sleep(15)

        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            await page.screenshot(path="all_clients_error.png")
            await asyncio.sleep(5)
        finally:
            await browser.close()
            print("\n👋 Demo complete!")

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("🚀 CREATING ALL TEST CLIENTS")
    print("=" * 80)
    print("\nThis will create and test sitemaps for:")
    for i, client in enumerate(TEST_CLIENTS, 1):
        print(f"  {i}. {client['name']} - {client['sitemap']}")
    print("\n⏳ Starting in 3 seconds...")
    print("=" * 80)

    import time
    time.sleep(3)

    asyncio.run(create_and_test_clients())
