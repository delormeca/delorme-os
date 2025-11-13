"""
Test sitemap import with the enhanced browser headers.
This script navigates to the Cleio Test client and attempts to import the sitemap.
"""
import asyncio
from playwright.async_api import async_playwright, expect

async def test_sitemap_import():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        try:
            # Navigate to login page
            await page.goto("http://localhost:5173/login")

            # Login with superuser credentials
            await page.fill('input[type="email"]', "tommy@delorme.ca")
            await page.fill('input[type="password"]', "Hockey999!!!")
            await page.click('button[type="submit"]')

            # Wait for navigation to dashboard
            await page.wait_for_url("**/dashboard", timeout=10000)
            print("✅ Logged in successfully")

            # Navigate to clients page
            await page.goto("http://localhost:5173/clients")
            await page.wait_for_load_state("networkidle")
            print("✅ Navigated to clients page")

            # Find and click on "Cleio Test" client
            await page.click('text="Cleio Test"')
            await page.wait_for_load_state("networkidle")
            print("✅ Opened Cleio Test client")

            # Click "Setup Website Engine" button
            setup_button = page.locator('button:has-text("Setup Website Engine")')
            await setup_button.click()
            print("✅ Clicked Setup Website Engine button")

            # Wait for dialog to open
            await page.wait_for_selector('[role="dialog"]', state="visible")
            print("✅ Setup dialog opened")

            # Wait a moment for the dialog to be fully rendered
            await asyncio.sleep(1)

            # The sitemap URL should already be filled in
            sitemap_input = page.locator('input[name="sitemapUrl"]')
            sitemap_value = await sitemap_input.input_value()
            print(f"📝 Sitemap URL: {sitemap_value}")

            # Click "Start Sitemap Import" button
            start_button = page.locator('button:has-text("Start Sitemap Import")')
            await start_button.click()
            print("🚀 Started sitemap import process...")

            # Wait for the import to complete (watch for status changes)
            # Look for success or error messages
            await asyncio.sleep(5)

            # Check for any error messages
            error_alert = page.locator('div[role="alert"]')
            if await error_alert.count() > 0:
                error_text = await error_alert.text_content()
                print(f"⚠️ Alert message: {error_text}")

            # Check for progress indicator
            progress = page.locator('text=/Importing.*pages/')
            if await progress.count() > 0:
                progress_text = await progress.text_content()
                print(f"📊 Progress: {progress_text}")

            # Wait longer to see the final result
            await asyncio.sleep(10)

            # Take a screenshot for verification
            await page.screenshot(path="sitemap_import_test.png")
            print("📸 Screenshot saved as sitemap_import_test.png")

            # Check backend logs for sitemap fetch results
            print("\n✅ Test completed - check backend logs for sitemap fetch results")

        except Exception as e:
            print(f"❌ Error during test: {str(e)}")
            await page.screenshot(path="sitemap_import_error.png")
            raise
        finally:
            # Keep browser open for a moment to see results
            await asyncio.sleep(3)
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_sitemap_import())
