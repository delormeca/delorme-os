# SEO Crawler Engine - Comprehensive QA Testing Suite

This directory contains end-to-end (E2E) tests for the SEO Crawler Engine using Playwright.

## 📋 Test Coverage

The test suite validates **24 critical datapoints** across **8 testing phases**:

### Phase 1: Data Collection Integrity (5 tests)
- ✅ All 23 datapoints captured and stored
- ✅ Screenshot capture functionality
- ✅ Link extraction accuracy (internal/external)
- ✅ Word count calculation
- ✅ Meta robots extraction

### Phase 2: UI Column Management (2 tests)
- ✅ Column visibility configuration
- ✅ Column search and filtering

### Phase 3: Historical Crawl Storage (1 test)
- ✅ Multiple crawl runs stored and retrievable

### Phase 4: Data Quality & Accuracy (2 tests)
- ✅ HTTP status codes match actual responses
- ✅ Meta tag extraction accuracy

### Phase 5: UI/UX Excellence (2 tests)
- ✅ Sticky columns on horizontal scroll
- ✅ Status code color coding

### Phase 6: Performance & Scalability (2 tests)
- ✅ Table renders in < 5 seconds
- ✅ Search/filter responds in < 2 seconds

### Phase 7: Export & Data Portability (1 test)
- ✅ Export functionality accessible

### Phase 8: Edge Cases & Resilience (4 tests)
- ✅ Handles slow pages gracefully
- ✅ Handles 404 pages correctly
- ✅ Follows redirects properly
- ✅ Crawl cancellation works

**Total Tests**: 19

---

## 🚀 Quick Start

### Prerequisites

1. **Backend Running**:
   ```bash
   poetry run uvicorn main:app --reload --port 8020
   ```

2. **Frontend Running**:
   ```bash
   cd frontend && npm run dev
   ```

3. **Database Ready**:
   ```bash
   docker-compose up -d
   poetry run alembic upgrade head
   ```

4. **Test User Created**:
   ```bash
   poetry run python -c "from app.commands.create_test_user import create_test_user; create_test_user()"
   ```

   Or manually create a test user with:
   - Email: `playwright_test@example.com`
   - Password: `PlaywrightTest123!`

### Run All Tests

```bash
# From velocity-boilerplate directory
python run_qa_tests.py
```

This will:
1. Run all 19 tests across 8 phases
2. Generate HTML report (`test_reports/html/test_report.html`)
3. Generate JSON report (`test_reports/test_results.json`)
4. Generate markdown summary (`test_reports/QA_REPORT.md`)
5. Capture screenshots on failures (`test_reports/screenshots/`)
6. Create bug reports if issues found (`test_reports/bug_reports/bugs.json`)

### Run Specific Phase

```bash
# Phase 1 only
poetry run pytest tests/e2e/test_phase1_data_collection.py -v

# Phase 2-8
poetry run pytest tests/e2e/test_phase_2_to_8_complete.py::TestPhase2UIColumnManagement -v
```

### Run with Headed Browser (Debug Mode)

```bash
poetry run pytest tests/e2e/ --headed --slowmo 1000
```

---

## 📊 Understanding Test Results

### Test Report Files

| File | Description |
|------|-------------|
| `test_reports/QA_REPORT.md` | Executive summary with health score |
| `test_reports/html/test_report.html` | Detailed HTML report with screenshots |
| `test_reports/test_results.json` | Machine-readable test results |
| `test_reports/screenshots/` | Screenshots from test execution |
| `test_reports/bug_reports/bugs.json` | Discovered bugs with severity levels |

### Health Score Calculation

```
Health Score = (Passed Tests / Total Tests) × 100
```

**Interpretation**:
- 95-100: Excellent - Production ready
- 85-94: Good - Minor fixes needed
- 70-84: Fair - Several issues to address
- < 70: Poor - Major issues, not production ready

---

## 🐛 Bug Report Format

When tests discover issues, they create structured bug reports:

```json
{
  "title": "Missing data points in crawl results",
  "severity": "High",
  "component": "Engine",
  "detected": "2025-01-11T14:30:00",
  "description": "Crawl did not extract 3 critical data points",
  "expected_behavior": "All 23 data points should be extracted",
  "actual_behavior": "Missing fields: schema_markup, salient_entities, body_content_embedding",
  "steps_to_reproduce": [
    "1. Create client for https://mcaressources.ca/",
    "2. Import sitemap",
    "3. Select pages and start crawl",
    "4. Check extracted data"
  ],
  "evidence": {
    "page_data": {...},
    "missing_fields": [...]
  },
  "suggested_fix": "Check Crawl4AI configuration and HTML parser service"
}
```

**Severity Levels**:
- **Critical**: Data loss, crawl failure, app crash
- **High**: Missing datapoints, incorrect data, UI broken
- **Medium**: UX issues, performance problems
- **Low**: Cosmetic issues, minor inconveniences

---

## 🔧 Test Configuration

Environment variables (set in `.env` or shell):

```bash
# Backend URL
BACKEND_URL=http://localhost:8020

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Test user credentials
TEST_USER_EMAIL=playwright_test@example.com
TEST_USER_PASSWORD=PlaywrightTest123!
```

---

## 📝 Test Data Management

Tests automatically:
- ✅ Create test clients with unique names
- ✅ Import sitemaps from https://mcaressources.ca/
- ✅ Run crawls on selected pages
- ✅ Clean up test data after execution (if cleanup fixture runs)

**Test Site**: `https://mcaressources.ca/`
- Small site (fast tests)
- Predictable content
- WordPress with good SEO practices
- Sitemap: `https://mcaressources.ca/sitemap_index.xml`

---

## 🎯 Expected Data Points (23 Extracted)

### ONPAGE Category (13/17)
1. ✅ `page_title` - Page title from `<title>` tag
2. ✅ `meta_description` - Meta description tag
3. ✅ `h1` - First H1 heading
4. ✅ `canonical_url` - Canonical URL
5. ✅ `hreflang` - Alternate language versions
6. ✅ `meta_robots` - Robot directives
7. ✅ `og_title` - Open Graph title
8. ✅ `og_description` - Open Graph description
9. ✅ `og_image` - Open Graph image
10. ✅ `twitter_card` - Twitter Card type
11. ✅ `twitter_title` - Twitter Card title
12. ✅ `twitter_description` - Twitter Card description
13. ✅ `twitter_image` - Twitter Card image

### CONTENT Category (3/6)
1. ✅ `body_content` - Full page content (markdown)
2. ✅ `word_count` - Word count
3. ✅ `webpage_structure` - HTML structure analysis

### LINKS Category (3/3)
1. ✅ `internal_links` - Internal links array
2. ✅ `external_links` - External links array
3. ✅ `image_count` - Number of images

### MEDIA Category (2/2)
1. ✅ `screenshot_url` - Thumbnail screenshot
2. ✅ `screenshot_full_url` - Full page screenshot

### TECHNICAL Category (4/16)
1. ✅ `url` - Page URL
2. ✅ `status_code` - HTTP status code
3. ✅ `success` - Whether crawl succeeded
4. ✅ `error_message` - Error message if failed

---

## 🔍 Troubleshooting

### Tests Fail with "Cannot connect to backend"

**Solution**:
```bash
# Ensure backend is running
poetry run uvicorn main:app --reload --port 8020
```

### Tests Fail with "Login failed"

**Solution**:
```bash
# Create test user
poetry run python -c "
from app.db import get_db_session
from app.services.auth_service import create_user
import asyncio

async def create_test_user():
    async with get_db_session() as db:
        await create_user(
            email='playwright_test@example.com',
            password='PlaywrightTest123!',
            full_name='Playwright Test User',
            db=db
        )

asyncio.run(create_test_user())
"
```

### Playwright Browser Not Installed

**Solution**:
```bash
poetry run playwright install chromium
```

### Tests Are Slow

**Solution**:
```bash
# Run specific phases instead of all tests
poetry run pytest tests/e2e/test_phase1_data_collection.py -v

# Or run with less verbose output
poetry run pytest tests/e2e/ -q
```

---

## 📚 Additional Resources

- **Playwright Docs**: https://playwright.dev/python/
- **Pytest Docs**: https://docs.pytest.org/
- **Project README**: `../../README.md`
- **Data Points Reference**: `../../DATA_POINTS_REFERENCE.md`

---

## 🤝 Contributing

To add new tests:

1. **Create test file**: `test_phase{N}_{description}.py`
2. **Use fixtures**: Import from `conftest.py`
3. **Follow naming**: `async def test_{number}_{description}(...)`
4. **Add markers**: `@pytest.mark.phase{N}`
5. **Create bug reports**: Use `bug_report_manager` fixture
6. **Update this README**: Add test to coverage section

---

## 📞 Support

For issues with the test suite:
1. Check `test_reports/QA_REPORT.md` for known issues
2. Review screenshots in `test_reports/screenshots/`
3. Check Playwright logs
4. File issue with bug report JSON attached

---

**Last Updated**: 2025-01-11
**Version**: 1.0.0
**Maintained By**: Claude Code QA Team
