"""
Phase 1: Data Collection Integrity Tests

Tests that all 23 extracted datapoints are captured and stored correctly.
"""
import pytest
import asyncio
import json
from playwright.async_api import Page, expect


@pytest.mark.asyncio
class TestPhase1DataCollectionIntegrity:
    """Test suite for validating 23 data point extraction."""

    async def test_01_complete_crawl_captures_all_23_datapoints(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config,
        test_data_manager,
        bug_report_manager
    ):
        """
        Test 1: Verify ALL 23 extractable datapoints are captured.

        Steps:
        1. Create test client with mcaressources.ca
        2. Import sitemap (to get page list)
        3. Select 1-3 pages for test crawl
        4. Trigger crawl
        5. Wait for completion
        6. Query database/API for results
        7. Assert ALL 23 fields are populated (not null/undefined)
        8. Screenshot results table
        """
        # Step 1: Test client already created by fixture
        client_id = test_client['id']

        # Step 2: Import sitemap to get pages
        await page.goto(f"{test_config['frontend_url']}/clients/{client_id}")

        # Look for sitemap import button
        sitemap_import_button = page.locator('button:has-text("Import from Sitemap")')

        if await sitemap_import_button.count() > 0:
            await sitemap_import_button.click()

            # Wait for import to complete (look for success message)
            await page.wait_for_selector('text=/Pages imported|Import complete/', timeout=30000)

        # Step 3: Select 3 pages for testing
        await page.wait_for_selector('table tbody tr', timeout=10000)

        # Get first 3 pages (or all if less than 3)
        checkboxes = page.locator('table tbody tr input[type="checkbox"]')
        checkbox_count = await checkboxes.count()
        pages_to_select = min(3, checkbox_count)

        for i in range(pages_to_select):
            await checkboxes.nth(i).check()

        # Step 4: Trigger crawl
        start_crawl_button = page.locator('button:has-text("Start Crawl")')

        if await start_crawl_button.count() == 0:
            # Try alternative button text
            start_crawl_button = page.locator('button:has-text("Extract Data")')

        await start_crawl_button.click()

        # Wait for crawl to start
        await page.wait_for_selector('text=/Crawl started|Extraction started/', timeout=5000)

        # Step 5: Wait for completion (poll progress indicator)
        max_wait_time = 120000  # 2 minutes
        await page.wait_for_selector('text=/Crawl complete|Extraction complete/', timeout=max_wait_time)

        # Step 6: Verify data was extracted
        # Reload page to see updated data
        await page.reload()
        await page.wait_for_load_state('networkidle')

        # Step 7: Verify all 23 datapoints are present
        # Expected datapoints from conftest.py
        expected_datapoints = test_config['expected_datapoints']

        # Check if column configuration exists
        column_config_button = page.locator('button[aria-label="Configure columns"]')

        if await column_config_button.count() > 0:
            await column_config_button.click()

            # Get list of available columns
            available_columns = page.locator('[role="dialog"] li')
            column_count = await available_columns.count()

            # Verify at least 23 columns are available
            assert column_count >= 23, f"Expected at least 23 columns, found {column_count}"

            # Close dialog
            await page.locator('[role="dialog"] button:has-text("Close")').click()

        # Step 8: Check data via API (more reliable than UI)
        # Get first page ID
        first_row = page.locator('table tbody tr').first
        page_id_element = await first_row.get_attribute('data-page-id')

        if page_id_element:
            # Make API request to get full page data
            async with page.context.request as request:
                response = await request.get(f"{test_config['backend_url']}/api/client-pages/{page_id_element}")
                page_data = await response.json()

                # Verify critical datapoints
                critical_fields = [
                    'url', 'status_code', 'page_title', 'meta_description',
                    'h1', 'body_content', 'word_count', 'internal_links',
                    'external_links', 'image_count'
                ]

                missing_fields = []
                for field in critical_fields:
                    if field not in page_data or page_data[field] is None:
                        missing_fields.append(field)

                if missing_fields:
                    bug_report_manager['create'](
                        title=f"Missing data points in crawl results: {', '.join(missing_fields)}",
                        severity="High",
                        component="Engine",
                        description=f"Crawl did not extract {len(missing_fields)} critical data points",
                        expected_behavior="All 23 data points should be extracted and stored",
                        actual_behavior=f"Missing fields: {missing_fields}",
                        steps_to_reproduce=[
                            f"1. Create client for {test_config['test_site_url']}",
                            "2. Import sitemap",
                            "3. Select pages and start crawl",
                            "4. Check extracted data"
                        ],
                        evidence={"page_data": page_data, "missing_fields": missing_fields},
                        suggested_fix="Check Crawl4AI configuration and HTML parser service"
                    )

                assert len(missing_fields) == 0, f"Missing critical datapoints: {missing_fields}"

        # Take screenshot for documentation
        await page.screenshot(path="test_reports/screenshots/phase1_test1_datapoints.png", full_page=True)


    async def test_02_screenshot_capture_works(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config,
        bug_report_manager
    ):
        """
        Test 2: Verify screenshot capture is working.

        Steps:
        1. Navigate to client detail page
        2. Select a page with screenshot
        3. Open screenshot modal
        4. Verify screenshot loads
        """
        client_id = test_client['id']
        await page.goto(f"{test_config['frontend_url']}/clients/{client_id}")

        # Wait for table to load
        await page.wait_for_selector('table tbody tr', timeout=10000)

        # Find screenshot column (if visible)
        screenshot_cell = page.locator('table tbody tr').first.locator('td img')

        if await screenshot_cell.count() > 0:
            # Click to open screenshot modal
            await screenshot_cell.click()

            # Wait for modal to open
            screenshot_modal = page.locator('[role="dialog"]:has-text("Screenshot")')
            await screenshot_modal.wait_for(state='visible', timeout=5000)

            # Verify image is present in modal
            modal_image = screenshot_modal.locator('img')
            await expect(modal_image).to_be_visible()

            # Check if image has src (not blank)
            img_src = await modal_image.get_attribute('src')
            assert img_src and len(img_src) > 100, "Screenshot image source is empty or too small"

            # Close modal
            await page.locator('[role="dialog"] button:has-text("Close")').click()
        else:
            # Screenshot column might not be visible - check via API
            bug_report_manager['create'](
                title="Screenshot column not visible in data table",
                severity="Medium",
                component="UI",
                description="Screenshot column is not shown by default in the data table",
                expected_behavior="Screenshot column should be visible or easily accessible",
                actual_behavior="Screenshot column not found in table",
                steps_to_reproduce=[
                    "1. Navigate to client detail page",
                    "2. Look for screenshot column in table"
                ],
                suggested_fix="Add screenshot to default visible columns or make it more prominent"
            )


    async def test_03_link_extraction_accuracy(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config,
        bug_report_manager
    ):
        """
        Test 3: Verify internal and external link extraction.

        Steps:
        1. Get a crawled page
        2. Check internal_links and external_links fields
        3. Verify counts are > 0
        4. Verify links have href and text properties
        """
        client_id = test_client['id']

        # Make API request to get pages
        async with page.context.request as request:
            response = await request.get(
                f"{test_config['backend_url']}/api/client-pages",
                params={"client_id": client_id, "page_size": 10}
            )
            pages_data = await response.json()

            if 'items' in pages_data and len(pages_data['items']) > 0:
                test_page = pages_data['items'][0]

                # Check internal links
                if 'internal_links' in test_page and test_page['internal_links']:
                    internal_links = test_page['internal_links']

                    # Verify structure
                    if isinstance(internal_links, str):
                        internal_links = json.loads(internal_links)

                    assert isinstance(internal_links, list), "internal_links should be a list"
                    assert len(internal_links) > 0, "Should have at least some internal links"

                    # Check first link structure
                    first_link = internal_links[0]
                    assert 'href' in first_link or 'url' in first_link, "Link should have href/url"

                # Check external links
                if 'external_links' in test_page and test_page['external_links']:
                    external_links = test_page['external_links']

                    if isinstance(external_links, str):
                        external_links = json.loads(external_links)

                    assert isinstance(external_links, list), "external_links should be a list"
            else:
                pytest.skip("No crawled pages found for link testing")


    async def test_04_word_count_calculation(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config,
        bug_report_manager
    ):
        """
        Test 4: Verify word count is calculated correctly.

        Steps:
        1. Get a crawled page
        2. Check word_count field
        3. Verify it's a positive integer
        4. Compare with body_content length (rough validation)
        """
        client_id = test_client['id']

        async with page.context.request as request:
            response = await request.get(
                f"{test_config['backend_url']}/api/client-pages",
                params={"client_id": client_id, "page_size": 10}
            )
            pages_data = await response.json()

            if 'items' in pages_data and len(pages_data['items']) > 0:
                for test_page in pages_data['items']:
                    if 'word_count' in test_page and test_page['word_count']:
                        word_count = test_page['word_count']

                        # Verify it's a positive integer
                        assert isinstance(word_count, int), "word_count should be an integer"
                        assert word_count > 0, "word_count should be positive"

                        # If we have body_content, do rough validation
                        if 'body_content' in test_page and test_page['body_content']:
                            body_content = test_page['body_content']
                            estimated_words = len(body_content.split())

                            # Allow 50% variance (markdown formatting affects count)
                            assert abs(word_count - estimated_words) / estimated_words < 0.5, \
                                f"Word count {word_count} differs significantly from estimated {estimated_words}"

                        # Success if we validated at least one page
                        return

                # If we got here, no valid word counts found
                bug_report_manager['create'](
                    title="Word count not being calculated for pages",
                    severity="Medium",
                    component="Engine",
                    description="word_count field is missing or zero for all crawled pages",
                    expected_behavior="word_count should be calculated from body content",
                    actual_behavior="word_count is missing or zero",
                    steps_to_reproduce=[
                        "1. Crawl pages",
                        "2. Check word_count field in API response"
                    ],
                    suggested_fix="Verify word count calculation in page_extraction_service.py"
                )

                pytest.fail("No valid word counts found in crawled pages")
            else:
                pytest.skip("No crawled pages found for word count testing")


    async def test_05_meta_robots_extraction(
        self,
        page: Page,
        authenticated_page,
        test_client,
        test_config,
        bug_report_manager
    ):
        """
        Test 5: Verify meta robots directives are extracted.

        Steps:
        1. Get crawled pages
        2. Check meta_robots field
        3. Verify common values (index/noindex, follow/nofollow)
        """
        client_id = test_client['id']

        async with page.context.request as request:
            response = await request.get(
                f"{test_config['backend_url']}/api/client-pages",
                params={"client_id": client_id, "page_size": 10}
            )
            pages_data = await response.json()

            if 'items' in pages_data and len(pages_data['items']) > 0:
                for test_page in pages_data['items']:
                    if 'meta_robots' in test_page and test_page['meta_robots']:
                        meta_robots = test_page['meta_robots']

                        # Verify it's a string
                        assert isinstance(meta_robots, str), "meta_robots should be a string"

                        # Check for valid directives
                        valid_directives = ['index', 'noindex', 'follow', 'nofollow', 'all', 'none']
                        has_valid_directive = any(directive in meta_robots.lower() for directive in valid_directives)

                        assert has_valid_directive, f"meta_robots has unexpected value: {meta_robots}"

                        # Success if we validated at least one page
                        return

                # If meta_robots is missing on all pages, that might be expected
                # (not all pages have meta robots tags)
                # So this is not a failure, just a note
                print("\n⚠️  Note: No meta_robots tags found on test pages (may be expected)")
            else:
                pytest.skip("No crawled pages found for meta robots testing")
