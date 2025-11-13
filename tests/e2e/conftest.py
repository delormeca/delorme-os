"""
Playwright E2E Test Configuration for SEO Crawler Engine QA
"""
import pytest
import json
import os
from typing import Dict, Any
from datetime import datetime

# Test configuration
TEST_SITE_URL = "https://mcaressources.ca/"
TEST_SITE_SITEMAP = "https://mcaressources.ca/sitemap_index.xml"
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8020")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Test user credentials (should be created in setup)
TEST_USER_EMAIL = os.getenv("TEST_USER_EMAIL", "playwright_test@example.com")
TEST_USER_PASSWORD = os.getenv("TEST_USER_PASSWORD", "PlaywrightTest123!")

# Expected data points (23 extracted, 44 total)
EXPECTED_DATAPOINTS = [
    # ONPAGE (13/17)
    'page_title', 'meta_description', 'h1', 'canonical_url', 'hreflang',
    'meta_robots', 'og_title', 'og_description', 'og_image',
    'twitter_card', 'twitter_title', 'twitter_description', 'twitter_image',

    # CONTENT (3/6)
    'body_content', 'word_count', 'webpage_structure',

    # LINKS (3/3)
    'internal_links', 'external_links', 'image_count',

    # MEDIA (2/2)
    'screenshot_url', 'screenshot_full_url',

    # TECHNICAL (4/16)
    'url', 'status_code', 'success', 'error_message',
]

# Column presets for UI testing
COLUMN_PRESETS = {
    'Quick Health Check': ['url', 'status_code', 'page_title', 'screenshot_url', 'meta_robots', 'last_crawled_at'],
    'SEO Audit': ['url', 'status_code', 'page_title', 'meta_title', 'meta_description', 'h1', 'word_count', 'canonical_url', 'internal_links'],
    'Content Analysis': ['url', 'page_title', 'h1', 'word_count', 'webpage_structure', 'body_content', 'salient_entities'],
    'Technical SEO': ['url', 'status_code', 'slug', 'meta_robots', 'canonical_url', 'hreflang', 'schema_markup', 'internal_links', 'external_links', 'image_count'],
}


class TestDataManager:
    """Manages test data creation and cleanup."""

    def __init__(self):
        self.created_clients = []
        self.created_pages = []
        self.created_crawl_runs = []

    def add_client(self, client_id: str):
        """Track created client for cleanup."""
        self.created_clients.append(client_id)

    def add_page(self, page_id: str):
        """Track created page for cleanup."""
        self.created_pages.append(page_id)

    def add_crawl_run(self, run_id: str):
        """Track created crawl run for cleanup."""
        self.created_crawl_runs.append(run_id)

    async def cleanup_all(self, api_client):
        """Clean up all test data."""
        # Clean up in reverse order (pages -> clients)
        for page_id in self.created_pages:
            try:
                await api_client.delete(f"/api/client-pages/{page_id}")
            except:
                pass

        for client_id in self.created_clients:
            try:
                await api_client.delete(f"/api/clients/{client_id}")
            except:
                pass


@pytest.fixture(scope="session")
def test_config() -> Dict[str, Any]:
    """Provide test configuration."""
    return {
        "test_site_url": TEST_SITE_URL,
        "test_site_sitemap": TEST_SITE_SITEMAP,
        "backend_url": BACKEND_URL,
        "frontend_url": FRONTEND_URL,
        "test_user_email": TEST_USER_EMAIL,
        "test_user_password": TEST_USER_PASSWORD,
        "expected_datapoints": EXPECTED_DATAPOINTS,
        "column_presets": COLUMN_PRESETS,
    }


@pytest.fixture(scope="function")
def test_data_manager():
    """Provide test data manager for tracking created resources."""
    return TestDataManager()


@pytest.fixture(scope="function")
async def authenticated_page(page, test_config):
    """Provide authenticated browser page."""
    # Navigate to login page
    await page.goto(f"{test_config['frontend_url']}/login")

    # Fill login form
    await page.fill('input[name="email"]', test_config['test_user_email'])
    await page.fill('input[name="password"]', test_config['test_user_password'])

    # Submit login
    await page.click('button[type="submit"]')

    # Wait for redirect to dashboard
    await page.wait_for_url(f"{test_config['frontend_url']}/dashboard", timeout=5000)

    yield page


@pytest.fixture(scope="function")
def bug_report_manager():
    """Manage bug reports generated during tests."""
    reports = []

    def create_bug_report(
        title: str,
        severity: str,
        component: str,
        description: str,
        expected_behavior: str,
        actual_behavior: str,
        steps_to_reproduce: list,
        evidence: dict = None,
        suggested_fix: str = None
    ):
        """Create a structured bug report."""
        report = {
            "title": title,
            "severity": severity,  # Critical, High, Medium, Low
            "component": component,  # Engine, UI, Database, Export
            "detected": datetime.now().isoformat(),
            "description": description,
            "expected_behavior": expected_behavior,
            "actual_behavior": actual_behavior,
            "steps_to_reproduce": steps_to_reproduce,
            "evidence": evidence or {},
            "suggested_fix": suggested_fix,
        }
        reports.append(report)
        return report

    def get_reports():
        """Get all bug reports."""
        return reports

    def save_reports(filepath: str):
        """Save bug reports to JSON file."""
        with open(filepath, 'w') as f:
            json.dump(reports, f, indent=2)

    # Return helper functions as a dict
    return {
        "create": create_bug_report,
        "get_all": get_reports,
        "save": save_reports,
    }


@pytest.fixture(scope="function")
async def test_client(page, authenticated_page, test_config, test_data_manager):
    """Create a test client for crawler testing."""
    # Navigate to create client page
    await page.goto(f"{test_config['frontend_url']}/clients/create")

    # Fill client form
    client_name = f"Playwright Test Client {datetime.now().strftime('%Y%m%d_%H%M%S')}"
    await page.fill('input[name="name"]', client_name)
    await page.fill('input[name="website_url"]', test_config['test_site_url'])
    await page.fill('input[name="sitemap_url"]', test_config['test_site_sitemap'])
    await page.fill('textarea[name="description"]', "Test client created by Playwright E2E tests")

    # Submit form
    await page.click('button[type="submit"]')

    # Wait for redirect to client detail page
    await page.wait_for_url('**/clients/*', timeout=10000)

    # Extract client ID from URL
    url = page.url
    client_id = url.split('/clients/')[-1]

    # Track for cleanup
    test_data_manager.add_client(client_id)

    yield {
        "id": client_id,
        "name": client_name,
        "url": test_config['test_site_url'],
        "sitemap": test_config['test_site_sitemap'],
    }

    # Cleanup is handled by test_data_manager


@pytest.fixture(autouse=True)
async def screenshot_on_failure(request, page):
    """Take screenshot on test failure."""
    yield

    if request.node.rep_call.failed:
        # Create screenshots directory if it doesn't exist
        os.makedirs("test_reports/screenshots", exist_ok=True)

        # Generate screenshot filename
        test_name = request.node.name
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        screenshot_path = f"test_reports/screenshots/{test_name}_{timestamp}.png"

        # Take screenshot
        await page.screenshot(path=screenshot_path, full_page=True)

        print(f"\n📸 Screenshot saved: {screenshot_path}")


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook to capture test results for screenshot fixture."""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)
