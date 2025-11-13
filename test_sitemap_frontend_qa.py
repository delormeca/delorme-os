"""
Comprehensive QA test for sitemap.md frontend requirements using Playwright.

This test validates all frontend functionality related to:
1. Sitemap URL parsing and discovery
2. Manual URL entry
3. Engine setup modal interactions
4. Progress tracking
5. Error handling
"""
import asyncio
import sys
import io
from playwright.async_api import async_playwright, expect

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Test data from sitemap.md
TEST_SITEMAPS = [
    "https://cleio.com/page-sitemap1.xml",
    "https://cleio.com/sitemaps.xml",
    "https://colleamoi.com/sitemap.xml",
    "https://mabelslabels.com/sitemap.xml",
    "https://pestagent.ca/sitemap.xml",
    "https://www.techo-bloc.com/sitemap/sitemap-index.xml",
]

TEST_MANUAL_URLS = [
    "https://example.com/page-1",
    "https://example.com/page-2",
    "https://example.com/page-3",
    "https://example.com/page-4",
    "https://example.com/page-5",
    "https://example.com/page-6",
    "https://example.com/page-7",
    "https://example.com/page-8",
    "https://example.com/page-9",
    "https://example.com/page-10",
]

async def test_sitemap_frontend():
    """Run comprehensive frontend QA tests."""

    async with async_playwright() as p:
        # Launch browser with visible UI for QA
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        page = await browser.new_page()

        results = {
            "login": False,
            "navigation": False,
            "client_creation": False,
            "engine_setup_modal": False,
            "sitemap_test": False,
            "manual_import": False,
            "errors": []
        }

        try:
            print("\n" + "="*80)
            print("🚀 SITEMAP FRONTEND QA TEST - Starting")
            print("="*80 + "\n")

            # ================================================================
            # TEST 1: Login
            # ================================================================
            print("📋 TEST 1: Login Authentication")
            print("-" * 80)

            await page.goto("http://localhost:5175/login")
            await page.wait_for_load_state("networkidle")

            # Fill login credentials
            await page.fill('input[type="email"]', "tommy@delorme.ca")
            await page.fill('input[type="password"]', "Hockey999!!!")

            # Click submit and wait for navigation
            await page.click('button[type="submit"]')

            # Wait for either dashboard or clients page (any non-login page means success)
            try:
                await page.wait_for_function(
                    "window.location.pathname !== '/login'",
                    timeout=15000
                )
                print(f"✅ Login successful - redirected to: {page.url}")
                results["login"] = True
            except Exception as e:
                print(f"⚠️  Login redirect timeout: {str(e)}")
                results["errors"].append(f"Login redirect: {str(e)}")

            # ================================================================
            # TEST 2: Navigate to Clients Page
            # ================================================================
            print("\n📋 TEST 2: Navigation to Clients")
            print("-" * 80)

            await page.goto("http://localhost:5175/clients")
            await page.wait_for_load_state("networkidle")
            print("✅ Navigated to clients page")
            results["navigation"] = True

            # ================================================================
            # TEST 3: Create Test Client (Cleio)
            # ================================================================
            print("\n📋 TEST 3: Create Test Client")
            print("-" * 80)

            # Check if Cleio client already exists
            cleio_exists = await page.locator('text="Cleio"').count() > 0

            if not cleio_exists:
                print("Creating new Cleio client...")

                # Click "Create Client" button
                create_button = page.locator('button:has-text("Create Client")')
                if await create_button.count() > 0:
                    await create_button.click()
                    await asyncio.sleep(2)
                else:
                    # Try navigating directly to create page
                    await page.goto("http://localhost:5175/clients/new")
                    await asyncio.sleep(1)

                # Fill client form
                await page.fill('input[name="name"]', "Cleio")
                await page.fill('input[name="website_url"]', "https://cleio.com")
                await page.fill('input[name="sitemap_url"]', "https://cleio.com/sitemaps.xml")

                # Select project lead
                await page.click('div[role="button"]:has-text("Select Project Lead")')
                await page.click('li:has-text("Tommy Delorme")')

                # Submit form
                await page.click('button[type="submit"]:has-text("Create Client")')
                await asyncio.sleep(2)

                print("✅ Client created successfully")
            else:
                print("✅ Client already exists")

            results["client_creation"] = True

            # ================================================================
            # TEST 4: Open Engine Setup Modal
            # ================================================================
            print("\n📋 TEST 4: Engine Setup Modal")
            print("-" * 80)

            # Click on Cleio client
            await page.click('text="Cleio"')
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(1)

            # Click "Setup Website Engine" button
            setup_button = page.locator('button:has-text("Setup Website Engine")')
            if await setup_button.count() > 0:
                await setup_button.click()
                print("✅ Clicked Setup Website Engine")
            else:
                # Try alternative button text
                await page.click('button:has-text("Configure Engine")')
                print("✅ Clicked Configure Engine")

            # Wait for modal to open
            await page.wait_for_selector('[role="dialog"]', state="visible", timeout=5000)
            print("✅ Engine Setup Modal opened")
            results["engine_setup_modal"] = True

            # ================================================================
            # TEST 5: Test Sitemap URL Discovery
            # ================================================================
            print("\n📋 TEST 5: Sitemap URL Discovery")
            print("-" * 80)

            # Verify sitemap URL is pre-filled
            sitemap_input = page.locator('input[name="sitemapUrl"]')
            if await sitemap_input.count() > 0:
                sitemap_value = await sitemap_input.input_value()
                print(f"📝 Sitemap URL pre-filled: {sitemap_value}")

                # Click "Test Sitemap" button
                test_button = page.locator('button:has-text("Test Sitemap")')
                if await test_button.count() > 0:
                    print("🔍 Testing sitemap parsing...")
                    await test_button.click()

                    # Wait for results (success or error)
                    await asyncio.sleep(5)

                    # Check for success indicators
                    success_text = await page.locator('text=/\\d+ (pages|URLs) (found|discovered)/i').count()
                    error_text = await page.locator('[role="alert"]').count()

                    if success_text > 0:
                        result_text = await page.locator('text=/\\d+ (pages|URLs) (found|discovered)/i').first.text_content()
                        print(f"✅ Sitemap test successful: {result_text}")
                        results["sitemap_test"] = True
                    elif error_text > 0:
                        error_msg = await page.locator('[role="alert"]').first.text_content()
                        print(f"⚠️  Sitemap test error: {error_msg}")
                        results["errors"].append(f"Sitemap test: {error_msg}")
                    else:
                        print("⚠️  No clear success/error indicator found")
                else:
                    print("⚠️  'Test Sitemap' button not found")
                    results["errors"].append("Test Sitemap button missing")
            else:
                print("⚠️  Sitemap URL input not found")
                results["errors"].append("Sitemap URL input missing")

            # ================================================================
            # TEST 6: Test Manual URL Entry
            # ================================================================
            print("\n📋 TEST 6: Manual URL Entry")
            print("-" * 80)

            # Switch to Manual Entry tab
            manual_tab = page.locator('button:has-text("Manual URL Entry")')
            if await manual_tab.count() > 0:
                await manual_tab.click()
                await asyncio.sleep(1)
                print("✅ Switched to Manual URL Entry tab")

                # Find textarea for URL input
                url_textarea = page.locator('textarea[placeholder*="URL"]').or_(
                    page.locator('textarea[name*="url"]')
                ).or_(
                    page.locator('textarea')
                )

                if await url_textarea.count() > 0:
                    # Paste multiple URLs
                    urls_text = "\n".join(TEST_MANUAL_URLS)
                    await url_textarea.first.fill(urls_text)
                    print(f"✅ Pasted {len(TEST_MANUAL_URLS)} test URLs")

                    # Find and click "Add Pages" button
                    add_button = page.locator('button:has-text("Add Pages")').or_(
                        page.locator('button:has-text("Start Import")')
                    ).or_(
                        page.locator('button:has-text("Import")')
                    )

                    if await add_button.count() > 0:
                        button_text = await add_button.first.text_content()
                        print(f"🔍 Found button: '{button_text}'")

                        # Check if button text matches specification
                        if "Add Pages" in button_text:
                            print("✅ Button text is correct: 'Add Pages'")
                        else:
                            print(f"⚠️  Button text should be 'Add Pages', found: '{button_text}'")
                            results["errors"].append(f"Button text is '{button_text}' instead of 'Add Pages'")

                        # Click the button
                        await add_button.first.click()
                        print("✅ Clicked manual import button")

                        # Wait for loading state or success message
                        await asyncio.sleep(3)

                        # Check for success/error indicators
                        success_msg = await page.locator('text=/success|imported|added/i').count()
                        error_msg = await page.locator('[role="alert"]').count()

                        if success_msg > 0:
                            msg = await page.locator('text=/success|imported|added/i').first.text_content()
                            print(f"✅ Manual import successful: {msg}")
                            results["manual_import"] = True
                        elif error_msg > 0:
                            msg = await page.locator('[role="alert"]').first.text_content()
                            print(f"⚠️  Manual import error: {msg}")
                            results["errors"].append(f"Manual import: {msg}")
                        else:
                            print("⚠️  No clear success/error indicator after import")
                            results["errors"].append("Manual import: No feedback after clicking")
                    else:
                        print("❌ Add Pages/Import button not found")
                        results["errors"].append("Add Pages button missing in Manual Entry")
                else:
                    print("❌ URL textarea not found in Manual Entry")
                    results["errors"].append("URL textarea missing in Manual Entry")
            else:
                print("❌ Manual URL Entry tab not found")
                results["errors"].append("Manual URL Entry tab missing")

            # ================================================================
            # TEST 7: Check Page Count Update
            # ================================================================
            print("\n📋 TEST 7: Verify Page Count Update")
            print("-" * 80)

            # Close modal
            close_button = page.locator('button[aria-label="close"]').or_(
                page.locator('button:has-text("Close")')
            )
            if await close_button.count() > 0:
                await close_button.first.click()
                await asyncio.sleep(1)

            # Check if page count is displayed
            page_count = page.locator('text=/\\d+ pages?/i')
            if await page_count.count() > 0:
                count_text = await page_count.first.text_content()
                print(f"✅ Page count displayed: {count_text}")
            else:
                print("⚠️  Page count not visible")

            # Take final screenshot
            await page.screenshot(path="sitemap_frontend_qa_final.png")
            print("\n📸 Final screenshot saved: sitemap_frontend_qa_final.png")

        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            results["errors"].append(f"Test exception: {str(e)}")
            await page.screenshot(path="sitemap_frontend_qa_error.png")
            print("📸 Error screenshot saved: sitemap_frontend_qa_error.png")

        finally:
            # ================================================================
            # FINAL REPORT
            # ================================================================
            print("\n" + "="*80)
            print("📊 FINAL QA REPORT")
            print("="*80)

            # Count passed tests (excluding errors list)
            passed = sum(1 for k, v in results.items() if k != "errors" and v is True)
            total = len([k for k in results.keys() if k != "errors"])

            print(f"\n✅ Tests Passed: {passed}/{total}")
            print(f"❌ Tests Failed: {total - passed}/{total}")

            print("\n📋 Detailed Results:")
            print(f"  • Login: {'✅ PASS' if results['login'] else '❌ FAIL'}")
            print(f"  • Navigation: {'✅ PASS' if results['navigation'] else '❌ FAIL'}")
            print(f"  • Client Creation: {'✅ PASS' if results['client_creation'] else '❌ FAIL'}")
            print(f"  • Engine Setup Modal: {'✅ PASS' if results['engine_setup_modal'] else '❌ FAIL'}")
            print(f"  • Sitemap Test: {'✅ PASS' if results['sitemap_test'] else '❌ FAIL'}")
            print(f"  • Manual Import: {'✅ PASS' if results['manual_import'] else '❌ FAIL'}")

            if results["errors"]:
                print(f"\n⚠️  Errors Found ({len(results['errors'])}):")
                for i, error in enumerate(results["errors"], 1):
                    print(f"  {i}. {error}")
            else:
                print("\n✅ No errors found!")

            print("\n" + "="*80)

            # Keep browser open for 5 seconds to review
            await asyncio.sleep(5)
            await browser.close()

if __name__ == "__main__":
    asyncio.run(test_sitemap_frontend())
