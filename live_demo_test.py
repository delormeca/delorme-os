"""
Live demo test - Watch the browser as it tests the sitemap functionality.
"""
import asyncio
import sys
import io
from playwright.async_api import async_playwright

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

async def live_demo():
    """Live demo of sitemap testing and page import."""

    async with async_playwright() as p:
        # Launch browser in VISIBLE mode with slower actions
        print("\n🚀 Starting live demo - Browser will open...")
        print("=" * 80)

        browser = await p.chromium.launch(
            headless=False,
            slow_mo=1000  # 1 second delay between actions
        )
        page = await browser.new_page()

        try:
            # Step 1: Login
            print("\n📋 STEP 1: Logging in...")
            await page.goto("http://localhost:5175/login")
            await page.fill('input[type="email"]', "tommy@delorme.ca")
            await page.fill('input[type="password"]', "Hockey999!!!")
            await page.click('button[type="submit"]')
            await page.wait_for_function("window.location.pathname !== '/login'", timeout=15000)
            print("✅ Logged in successfully")
            await asyncio.sleep(2)

            # Step 2: Navigate to clients
            print("\n📋 STEP 2: Navigating to clients page...")
            await page.goto("http://localhost:5175/clients")
            await page.wait_for_load_state("networkidle")
            print("✅ On clients page")
            await asyncio.sleep(2)

            # Step 3: Check if Cleio exists, if not create it
            print("\n📋 STEP 3: Looking for Cleio client...")
            await asyncio.sleep(2)

            cleio_client = page.locator('text="Cleio"').first

            if await cleio_client.count() > 0:
                print("✅ Found Cleio client - clicking it...")
                await cleio_client.click()
            else:
                print("📝 Cleio not found - creating it...")

                # Navigate to create client page
                await page.goto("http://localhost:5175/clients/new")
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)

                # Fill form
                print("📝 Filling client form...")
                await page.fill('input[name="name"]', "Cleio")
                await page.fill('input[name="website_url"]', "https://cleio.com")
                await page.fill('input[name="sitemap_url"]', "https://cleio.com/sitemaps.xml")

                # Select project lead if available
                try:
                    # Try clicking the autocomplete
                    await page.click('input[placeholder*="Project Lead"]', timeout=2000)
                    await asyncio.sleep(1)
                    # Select first option
                    await page.click('li[role="option"]', timeout=2000)
                except:
                    print("⚠️  Skipping project lead selection")

                # Submit
                await page.click('button[type="submit"]:has-text("Create Client")')
                await asyncio.sleep(3)

                print("✅ Client created - navigating to client page...")
                # Click on the newly created client
                await page.goto("http://localhost:5175/clients")
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(1)

                cleio_client = page.locator('text="Cleio"').first
                await cleio_client.click()

            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(2)

            # Step 4: Click Setup Website Engine
            print("\n📋 STEP 4: Opening Engine Setup Modal...")
            setup_buttons = [
                'button:has-text("Setup Website Engine")',
                'button:has-text("Configure Engine")',
                'button:has-text("Engine Setup")'
            ]

            setup_clicked = False
            for button_selector in setup_buttons:
                button = page.locator(button_selector)
                if await button.count() > 0:
                    print(f"✅ Found button: {button_selector}")
                    await button.click()
                    setup_clicked = True
                    break

            if not setup_clicked:
                print("❌ Could not find Setup Engine button")
                await page.screenshot(path="live_demo_error.png")
                await browser.close()
                return

            # Wait for modal
            await page.wait_for_selector('[role="dialog"]', state="visible", timeout=10000)
            print("✅ Engine Setup Modal opened")
            await asyncio.sleep(3)

            # Step 5: Test Sitemap
            print("\n📋 STEP 5: Testing sitemap...")
            sitemap_input = page.locator('input[name="sitemapUrl"]')

            if await sitemap_input.count() > 0:
                current_value = await sitemap_input.input_value()
                print(f"📝 Current sitemap URL: {current_value}")

                # If empty, fill it
                if not current_value:
                    print("📝 Filling sitemap URL: https://cleio.com/sitemaps.xml")
                    await sitemap_input.fill("https://cleio.com/sitemaps.xml")
                    await asyncio.sleep(1)

                # Click Test Sitemap button
                test_button = page.locator('button:has-text("Test Sitemap")')
                if await test_button.count() > 0:
                    print("🔍 Clicking 'Test Sitemap' button...")
                    await test_button.click()
                    await asyncio.sleep(5)

                    # Check for results
                    success_indicator = page.locator('text=/\\d+ (pages|URLs)/i')
                    error_indicator = page.locator('[role="alert"]')

                    if await success_indicator.count() > 0:
                        result_text = await success_indicator.first.text_content()
                        print(f"✅ Sitemap test SUCCESS: {result_text}")
                    elif await error_indicator.count() > 0:
                        error_text = await error_indicator.first.text_content()
                        print(f"⚠️  Sitemap test result: {error_text}")
                    else:
                        print("⚠️  No clear result indicator found")

                    await asyncio.sleep(3)
                else:
                    print("⚠️  'Test Sitemap' button not found")
            else:
                print("⚠️  Sitemap URL input not found")

            # Step 6: Click Start Import to add pages
            print("\n📋 STEP 6: Starting sitemap import to add pages...")
            start_import_button = page.locator('button:has-text("Start Sitemap Import")')

            if await start_import_button.count() > 0:
                print("🚀 Clicking 'Start Sitemap Import' button...")
                await start_import_button.click()
                print("✅ Import started - watch the progress in the UI...")
                await asyncio.sleep(10)

                # Check for completion
                success_msg = page.locator('text=/success|complete|imported/i')
                if await success_msg.count() > 0:
                    msg = await success_msg.first.text_content()
                    print(f"✅ Import completed: {msg}")

            else:
                print("⚠️  'Start Sitemap Import' button not found")

            # Step 7: Check Manual URL Entry
            print("\n📋 STEP 7: Checking Manual URL Entry tab...")
            manual_tab = page.locator('button:has-text("Manual URL Entry")')

            if await manual_tab.count() > 0:
                await manual_tab.click()
                await asyncio.sleep(2)
                print("✅ Switched to Manual URL Entry tab")

                # Check button text
                add_button = page.locator('button:has-text("Add Pages")')
                if await add_button.count() > 0:
                    print("✅ VERIFIED: Button text is 'Add Pages' (matches specification)")
                else:
                    import_button = page.locator('button:has-text("Start Import")')
                    if await import_button.count() > 0:
                        print("⚠️  WARNING: Button says 'Start Import' instead of 'Add Pages'")

                await asyncio.sleep(3)

            # Final screenshot
            await page.screenshot(path="live_demo_complete.png", full_page=True)
            print("\n📸 Screenshot saved: live_demo_complete.png")

            print("\n" + "=" * 80)
            print("✅ LIVE DEMO COMPLETE")
            print("=" * 80)
            print("\nKeeping browser open for 10 seconds so you can see the final state...")
            await asyncio.sleep(10)

        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            await page.screenshot(path="live_demo_error.png")
            print("📸 Error screenshot saved")
            await asyncio.sleep(5)
        finally:
            await browser.close()
            print("\n👋 Browser closed. Demo finished.")

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("🎬 LIVE SITEMAP DEMO")
    print("=" * 80)
    print("\nThis will:")
    print("  1. Login to the application")
    print("  2. Navigate to a client")
    print("  3. Open Engine Setup Modal")
    print("  4. Test the sitemap")
    print("  5. Import pages from sitemap")
    print("  6. Verify 'Add Pages' button text")
    print("\n⏳ Starting in 3 seconds...")
    print("=" * 80)

    import time
    time.sleep(3)

    asyncio.run(live_demo())
