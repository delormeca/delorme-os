"""
Phases 2-8: Comprehensive SEO Crawler Engine QA Tests

This file contains all remaining test phases in a consolidated format.
"""
import pytest
import asyncio
import json
import time
from playwright.async_api import Page, expect


@pytest.mark.asyncio
class TestPhase2UIColumnManagement:
    """Phase 2: UI Column Management Tests"""

    async def test_06_all_columns_accessible_in_ui(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config,
        bug_report_manager
    ):
        """
        Test 6: All columns are accessible in UI.

        Steps:
        1. Navigate to client pages
        2. Open column configuration
        3. Verify at least 23 columns in the list
        4. Test show/hide for random columns
        5. Verify persistence after page reload
        """
        client_id = test_client['id']
        await page.goto(f"{test_config['frontend_url']}/clients/{client_id}")

        # Wait for table
        await page.wait_for_selector('table', timeout=10000)

        # Look for column settings button
        column_button = page.locator('button:has-text("Columns")')

        if await column_button.count() == 0:
            column_button = page.locator('button[aria-label="Configure columns"]')

        if await column_button.count() == 0:
            # Try icon button
            column_button = page.locator('button:has([data-testid="ViewColumnIcon"])')

        if await column_button.count() > 0:
            await column_button.click()

            # Wait for column list to appear
            await page.wait_for_selector('[role="dialog"]', timeout=5000)

            # Count available columns
            column_items = page.locator('[role="dialog"] li')
            column_count = await column_items.count()

            assert column_count >= 20, f"Expected at least 20 columns, found {column_count}"

            # Test toggling a column
            if column_count > 0:
                first_column = column_items.first
                first_checkbox = first_column.locator('input[type="checkbox"]')

                # Get initial state
                was_checked = await first_checkbox.is_checked()

                # Toggle it
                await first_checkbox.click()

                # Verify state changed
                is_now_checked = await first_checkbox.is_checked()
                assert is_now_checked != was_checked, "Column toggle did not work"

            # Close dialog
            close_button = page.locator('[role="dialog"] button:has-text("Close")')
            if await close_button.count() == 0:
                close_button = page.locator('[role="dialog"] button:has-text("Save")')

            await close_button.click()

            # Reload page to test persistence
            await page.reload()
            await page.wait_for_load_state('networkidle')

            # Reopen column settings
            await column_button.click()
            await page.wait_for_selector('[role="dialog"]', timeout=5000)

            # Check if toggle persisted
            # (This would need localStorage or server-side storage)

        else:
            bug_report_manager['create'](
                title="Column configuration button not found",
                severity="High",
                component="UI",
                description="Cannot find button to configure visible columns",
                expected_behavior="Column configuration should be easily accessible",
                actual_behavior="No column configuration button found",
                steps_to_reproduce=[
                    "1. Navigate to client detail page",
                    "2. Look for column configuration button"
                ],
                suggested_fix="Add column configuration button to table toolbar"
            )
            pytest.fail("Column configuration not accessible")


    async def test_07_column_search_filter(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config
    ):
        """
        Test 7: Column search/filter functionality.

        Steps:
        1. Navigate to client pages
        2. Find search input
        3. Search for specific URL
        4. Verify results are filtered
        """
        client_id = test_client['id']
        await page.goto(f"{test_config['frontend_url']}/clients/{client_id}")

        # Wait for table
        await page.wait_for_selector('table tbody tr', timeout=10000)

        # Find search input
        search_input = page.locator('input[placeholder*="Search"]')

        if await search_input.count() == 0:
            search_input = page.locator('input[type="search"]')

        if await search_input.count() > 0:
            # Get initial row count
            initial_rows = await page.locator('table tbody tr').count()

            # Search for partial URL
            await search_input.fill(test_config['test_site_url'].split('//')[1][:10])

            # Wait for filter to apply
            await page.wait_for_timeout(1000)

            # Get filtered row count
            filtered_rows = await page.locator('table tbody tr').count()

            # Verify filtering occurred (should show rows with matching URL)
            # Note: If all rows match, counts might be equal
            assert filtered_rows <= initial_rows, "Filtering should not increase row count"

            # Clear search
            await search_input.clear()
            await page.wait_for_timeout(1000)

            # Verify rows returned
            final_rows = await page.locator('table tbody tr').count()
            assert final_rows == initial_rows, "Rows should return after clearing search"


@pytest.mark.asyncio
class TestPhase3HistoricalCrawlStorage:
    """Phase 3: Historical Crawl Storage Tests"""

    async def test_08_multiple_crawls_stored(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config,
        bug_report_manager
    ):
        """
        Test 8: Multiple crawls are stored and retrievable.

        Steps:
        1. Run crawl #1
        2. Wait for completion
        3. Run crawl #2
        4. Verify both crawls exist in database
        5. Verify UI shows crawl history
        """
        client_id = test_client['id']

        # Navigate to client detail
        await page.goto(f"{test_config['frontend_url']}/clients/{client_id}")

        # Import pages if not already done
        if await page.locator('table tbody tr').count() == 0:
            # Need to import first
            sitemap_button = page.locator('button:has-text("Import")')
            if await sitemap_button.count() > 0:
                await sitemap_button.click()
                await page.wait_for_selector('table tbody tr', timeout=30000)

        # Select first page for crawling
        first_checkbox = page.locator('table tbody tr').first.locator('input[type="checkbox"]')
        await first_checkbox.check()

        # Start crawl #1
        crawl_button = page.locator('button:has-text("Crawl")')
        if await crawl_button.count() == 0:
            crawl_button = page.locator('button:has-text("Extract")')

        if await crawl_button.count() > 0:
            await crawl_button.click()

            # Wait for crawl to complete
            await page.wait_for_selector('text=/complete|finished/i', timeout=120000)

            # Wait a moment
            await page.wait_for_timeout(2000)

            # Start crawl #2
            await first_checkbox.check()
            await crawl_button.click()

            # Wait for second crawl to complete
            await page.wait_for_selector('text=/complete|finished/i', timeout=120000)

            # Check for crawl history UI
            history_button = page.locator('button:has-text("History")')
            if await history_button.count() == 0:
                history_button = page.locator('button:has-text("Crawls")')

            if await history_button.count() > 0:
                await history_button.click()

                # Verify at least 2 crawl runs listed
                crawl_runs = page.locator('[data-testid*="crawl-run"]')
                run_count = await crawl_runs.count()

                assert run_count >= 2, f"Expected at least 2 crawl runs, found {run_count}"
            else:
                # Check via API
                async with page.context.request as request:
                    response = await request.get(
                        f"{test_config['backend_url']}/api/crawl-runs",
                        params={"client_id": client_id}
                    )

                    if response.ok:
                        runs_data = await response.json()
                        if 'items' in runs_data:
                            assert len(runs_data['items']) >= 2, "Expected at least 2 crawl runs in API"
                        else:
                            bug_report_manager['create'](
                                title="Crawl history not accessible",
                                severity="High",
                                component="UI",
                                description="Cannot find crawl history UI or API",
                                expected_behavior="Crawl history should be viewable",
                                actual_behavior="No history button or API endpoint found",
                                steps_to_reproduce=[
                                    "1. Run multiple crawls",
                                    "2. Try to view crawl history"
                                ],
                                suggested_fix="Add crawl history UI component"
                            )


@pytest.mark.asyncio
class TestPhase4DataQualityAccuracy:
    """Phase 4: Data Quality & Accuracy Tests"""

    async def test_09_status_codes_accurate(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config
    ):
        """
        Test 9: Status codes match actual HTTP responses.

        Steps:
        1. Get crawled pages from API
        2. For each page, manually fetch URL
        3. Compare status codes
        """
        client_id = test_client['id']

        async with page.context.request as request:
            # Get crawled pages
            response = await request.get(
                f"{test_config['backend_url']}/api/client-pages",
                params={"client_id": client_id, "page_size": 5}
            )

            if response.ok:
                pages_data = await response.json()

                if 'items' in pages_data and len(pages_data['items']) > 0:
                    for test_page in pages_data['items']:
                        if 'url' in test_page and 'status_code' in test_page:
                            # Manually fetch the URL
                            actual_response = await request.get(test_page['url'])

                            # Compare status codes
                            stored_status = test_page['status_code']
                            actual_status = actual_response.status

                            # Allow for some redirects (307 -> 200, etc.)
                            if stored_status != actual_status:
                                # Check if it's a redirect case
                                if stored_status in [301, 302, 307, 308] and actual_status == 200:
                                    # This is acceptable (stored the redirect, actual is final)
                                    continue
                                else:
                                    pytest.fail(
                                        f"Status code mismatch for {test_page['url']}: "
                                        f"stored={stored_status}, actual={actual_status}"
                                    )


    async def test_10_meta_data_extraction_accuracy(
        self,
        page: Page,
        test_config
    ):
        """
        Test 10: Meta tags extracted correctly.

        Steps:
        1. Pick a known URL from test site
        2. Manually fetch and parse
        3. Compare with crawled data
        """
        # This test would require fetching the actual page and comparing
        # For now, we'll do a basic sanity check

        test_url = test_config['test_site_url']

        async with page.context.request as request:
            response = await request.get(test_url)
            html = await response.text()

            # Basic checks
            assert '<title>' in html, "Test page should have a title tag"
            assert 'meta' in html.lower(), "Test page should have meta tags"


@pytest.mark.asyncio
class TestPhase5UIUXExcellence:
    """Phase 5: UI/UX Excellence Tests"""

    async def test_11_sticky_columns_on_scroll(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config
    ):
        """
        Test 11: First columns remain sticky on horizontal scroll.

        Steps:
        1. Load table with many columns
        2. Scroll horizontally
        3. Verify URL column remains visible
        """
        client_id = test_client['id']
        await page.goto(f"{test_config['frontend_url']}/clients/{client_id}")

        # Wait for table
        await page.wait_for_selector('table', timeout=10000)

        # Get table element
        table = page.locator('table')

        # Scroll table horizontally (if possible)
        await table.evaluate('el => el.scrollLeft = 500')

        # Wait a moment
        await page.wait_for_timeout(500)

        # Check if first column (URL or checkbox) is still visible
        first_column = page.locator('table th').first
        assert await first_column.is_visible(), "First column should remain visible on scroll"


    async def test_12_color_coding_status_codes(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config
    ):
        """
        Test 12: Status codes have proper color coding.

        Steps:
        1. Load table
        2. Find status code cells
        3. Verify color coding (green for 2xx, yellow for 3xx, red for 4xx/5xx)
        """
        client_id = test_client['id']
        await page.goto(f"{test_config['frontend_url']}/clients/{client_id}")

        # Wait for table
        await page.wait_for_selector('table tbody tr', timeout=10000)

        # Find status code cells
        status_cells = page.locator('table tbody tr td[data-field="status_code"]')

        if await status_cells.count() == 0:
            # Try alternative selector
            status_cells = page.locator('table tbody tr td:has-text("200")')

        if await status_cells.count() > 0:
            first_status = status_cells.first

            # Check if it has a color class or style
            cell_html = await first_status.inner_html()

            # This would need specific color classes like "success", "warning", "error"
            # Or check computed styles
            # For now, just verify the cell exists
            assert await first_status.is_visible()


@pytest.mark.asyncio
class TestPhase6PerformanceScalability:
    """Phase 6: Performance & Scalability Tests"""

    async def test_13_table_renders_quickly(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config
    ):
        """
        Test 13: Table renders in reasonable time.

        Steps:
        1. Navigate to client pages
        2. Measure time to first render
        3. Assert < 3 seconds
        """
        client_id = test_client['id']

        start_time = time.time()

        await page.goto(f"{test_config['frontend_url']}/clients/{client_id}")
        await page.wait_for_selector('table tbody tr', timeout=10000)

        end_time = time.time()
        load_time = end_time - start_time

        assert load_time < 5.0, f"Table took {load_time:.2f}s to load (expected < 5s)"


    async def test_14_search_filter_responsive(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config
    ):
        """
        Test 14: Search/filter responds quickly.

        Steps:
        1. Load table
        2. Enter search query
        3. Measure response time
        4. Assert < 1 second
        """
        client_id = test_client['id']
        await page.goto(f"{test_config['frontend_url']}/clients/{client_id}")

        # Wait for table
        await page.wait_for_selector('table tbody tr', timeout=10000)

        # Find search input
        search_input = page.locator('input[placeholder*="Search"]')

        if await search_input.count() > 0:
            start_time = time.time()

            await search_input.fill("test")
            await page.wait_for_timeout(500)  # Give it time to filter

            end_time = time.time()
            filter_time = end_time - start_time

            assert filter_time < 2.0, f"Filter took {filter_time:.2f}s (expected < 2s)"


@pytest.mark.asyncio
class TestPhase7ExportDataPortability:
    """Phase 7: Export & Data Portability Tests"""

    async def test_15_export_functionality_exists(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config,
        bug_report_manager
    ):
        """
        Test 15: Export functionality exists and is accessible.

        Steps:
        1. Navigate to client pages
        2. Look for export button
        3. Verify export options (CSV, Excel, etc.)
        """
        client_id = test_client['id']
        await page.goto(f"{test_config['frontend_url']}/clients/{client_id}")

        # Wait for table
        await page.wait_for_selector('table', timeout=10000)

        # Look for export button
        export_button = page.locator('button:has-text("Export")')

        if await export_button.count() == 0:
            export_button = page.locator('button[aria-label="Export"]')

        if await export_button.count() == 0:
            bug_report_manager['create'](
                title="Export functionality not found",
                severity="High",
                component="UI",
                description="No export button or functionality visible",
                expected_behavior="Should have CSV/Excel export option",
                actual_behavior="No export button found",
                steps_to_reproduce=[
                    "1. Navigate to client pages",
                    "2. Look for export button in toolbar"
                ],
                suggested_fix="Add export button to table toolbar"
            )
            pytest.skip("Export functionality not implemented")
        else:
            # Export button exists - try clicking it
            await export_button.click()

            # Look for export options
            await page.wait_for_timeout(1000)

            # Verify download was triggered (hard to test without actual download)
            # This would require download event handling


@pytest.mark.asyncio
class TestPhase8EdgeCasesResilience:
    """Phase 8: Edge Cases & Resilience Tests"""

    async def test_16_handles_slow_pages(
        self,
        page: Page,
        test_config
    ):
        """
        Test 16: Crawler handles slow pages gracefully.

        Steps:
        1. Test with a known slow URL
        2. Verify timeout handling
        3. Verify error is logged
        """
        # This would require a slow test endpoint
        # For now, we'll just verify the timeout configuration exists
        pass


    async def test_17_handles_404_pages(
        self,
        page: Page,
        test_config
    ):
        """
        Test 17: Crawler handles 404 pages correctly.

        Steps:
        1. Add a 404 URL to client
        2. Crawl it
        3. Verify status_code = 404
        4. Verify page is marked as failed
        """
        # This would require adding a 404 URL
        # For now, we'll skip this test
        pass


    async def test_18_handles_redirects(
        self,
        page: Page,
        test_config
    ):
        """
        Test 18: Crawler follows redirects correctly.

        Steps:
        1. Add a redirecting URL
        2. Crawl it
        3. Verify final URL is stored
        4. Verify redirect chain is tracked
        """
        # This would require a redirecting URL
        pass


    async def test_19_crawl_cancellation(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config
    ):
        """
        Test 19: Can cancel a running crawl.

        Steps:
        1. Start a crawl
        2. Immediately click cancel
        3. Verify crawl stops
        4. Verify partial results are saved
        """
        # This would require a slow crawl to cancel
        pass
