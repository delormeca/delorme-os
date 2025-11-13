# 🚀 Quick Start - SEO Crawler QA Testing

Get up and running with the comprehensive QA test suite in 5 minutes.

---

## Prerequisites Checklist

Before running tests, ensure you have:

- [ ] **Backend running** on http://localhost:8020
- [ ] **Frontend running** on http://localhost:5173
- [ ] **PostgreSQL database** running (Docker or local)
- [ ] **Database migrations** applied
- [ ] **Test user created** (or use existing user)
- [ ] **Playwright installed** (browsers)

---

## Step 1: Start Backend

```bash
# Terminal 1
cd velocity-boilerplate
poetry run uvicorn main:app --reload --port 8020
```

**Verify**: Open http://localhost:8020/docs - You should see FastAPI Swagger UI

---

## Step 2: Start Frontend

```bash
# Terminal 2
cd velocity-boilerplate/frontend
npm run dev
```

**Verify**: Open http://localhost:5173 - You should see the login page

---

## Step 3: Ensure Database is Ready

```bash
# Terminal 3
cd velocity-boilerplate

# Start PostgreSQL (if using Docker)
docker-compose up -d

# Run migrations
poetry run alembic upgrade head

# Verify database is accessible
poetry run python -c "from app.db import get_db_session; print('✅ Database OK')"
```

---

## Step 4: Create Test User (One-Time Setup)

### Option A: Manual Creation via UI

1. Go to http://localhost:5173/signup
2. Create account with:
   - Email: `playwright_test@example.com`
   - Password: `PlaywrightTest123!`
   - Name: `Playwright Test User`

### Option B: Create via API

```bash
poetry run python -c "
import asyncio
from app.db import get_db_session
from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate

async def create_test_user():
    async with get_db_session() as db:
        auth_service = AuthService(db)
        try:
            user = await auth_service.create_user(
                UserCreate(
                    email='playwright_test@example.com',
                    password='PlaywrightTest123!',
                    full_name='Playwright Test User'
                )
            )
            print(f'✅ Test user created: {user.email}')
        except Exception as e:
            print(f'⚠️  User might already exist: {e}')

asyncio.run(create_test_user())
"
```

### Option C: Use Existing Superuser

If you already have a superuser, update the environment variables:

```bash
export TEST_USER_EMAIL="your_email@example.com"
export TEST_USER_PASSWORD="your_password"
```

---

## Step 5: Run QA Tests

### Option A: Run All Tests (Full Suite)

```bash
# Terminal 4
cd velocity-boilerplate
python run_qa_tests.py
```

**Expected Duration**: 5-15 minutes (depends on test site responsiveness)

### Option B: Run Specific Phase

```bash
# Phase 1 only (fastest)
poetry run pytest tests/e2e/test_phase1_data_collection.py -v

# Phase 2 only
poetry run pytest tests/e2e/test_phase_2_to_8_complete.py::TestPhase2UIColumnManagement -v

# All phases with detailed output
poetry run pytest tests/e2e/ -v -s
```

### Option C: Debug Mode (Headed Browser)

```bash
# Watch tests execute in real browser
poetry run pytest tests/e2e/ --headed --slowmo 1000 -v
```

---

## Step 6: Review Results

### 1. Console Output

Watch for:
- ✅ Green checkmarks = Passed
- ❌ Red X = Failed
- ⏭️ Yellow skip = Skipped
- 💥 Error = Test error

### 2. HTML Report

```bash
# Open in browser (Windows)
start test_reports/html/test_report.html

# Or (Mac/Linux)
open test_reports/html/test_report.html
```

### 3. Markdown Summary

```bash
# Read in terminal
cat test_reports/QA_REPORT.md

# Or open in VS Code
code test_reports/QA_REPORT.md
```

### 4. Screenshots

```bash
# View screenshots from failed tests
ls -la test_reports/screenshots/
```

### 5. Bug Reports

```bash
# If bugs were found
cat test_reports/bug_reports/bugs.json
```

---

## Expected Results (First Run)

Based on code analysis, you should see approximately:

```
==================== TEST EXECUTION SUMMARY ====================
Total Tests:   19
✅ Passed:     14-17
❌ Failed:     2-5
⏭️ Skipped:    0-2
💥 Errors:     0

🎯 Health Score: 74-89/100
================================================================
```

**Common Issues**:
1. ❌ Screenshot storage warning (expected - base64 in DB)
2. ❌ Export functionality may not be fully implemented
3. ⏭️ Some edge case tests may be skipped

---

## Troubleshooting

### ❌ "Cannot connect to backend"

**Fix**:
```bash
# Check backend is running
curl http://localhost:8020/docs

# If not, restart:
poetry run uvicorn main:app --reload --port 8020
```

### ❌ "Login failed"

**Fix**:
```bash
# Verify test user exists
poetry run python -c "
import asyncio
from app.db import get_db_session
from app.models import User
from sqlmodel import select

async def check_user():
    async with get_db_session() as db:
        result = await db.execute(select(User).where(User.email == 'playwright_test@example.com'))
        user = result.scalar_one_or_none()
        if user:
            print(f'✅ User exists: {user.email}')
        else:
            print('❌ User not found')

asyncio.run(check_user())
"
```

### ❌ "Playwright not installed"

**Fix**:
```bash
poetry run playwright install chromium
```

### ❌ "Table not found" errors

**Fix**:
```bash
# Run migrations
poetry run alembic upgrade head

# Or reset database
docker-compose down -v
docker-compose up -d
poetry run alembic upgrade head
```

---

## Understanding Test Results

### Health Score Interpretation

| Score | Status | Action |
|-------|--------|--------|
| 95-100 | ✅ Excellent | Production ready |
| 85-94 | 🟢 Good | Minor fixes needed |
| 70-84 | 🟡 Fair | Several issues to address |
| < 70 | 🔴 Poor | Major issues, not production ready |

### Bug Severity Levels

| Level | Icon | Meaning | Action Required |
|-------|------|---------|-----------------|
| Critical | 🔴 | Data loss, crashes, blockers | Fix immediately |
| High | 🟠 | Missing features, broken UI | Fix before release |
| Medium | 🟡 | UX issues, performance | Fix in next sprint |
| Low | 🟢 | Cosmetic, minor | Fix when convenient |

---

## What's Next?

### If Tests Pass (Health Score > 90%)

1. ✅ Review any minor bugs in `bug_reports/bugs.json`
2. ✅ Fix screenshot storage issue (move to S3)
3. ✅ Implement missing features (export, schema markup, etc.)
4. ✅ Deploy to staging for manual QA

### If Tests Fail (Health Score < 70%)

1. 🔍 Review `test_reports/QA_REPORT.md` for details
2. 🐛 Check `bug_reports/bugs.json` for discovered issues
3. 📸 Look at screenshots in `test_reports/screenshots/`
4. 🛠️ Fix critical bugs first
5. 🔄 Re-run tests until passing

---

## Advanced Usage

### Run Tests with Different Test Site

```bash
# Edit tests/e2e/conftest.py and change:
TEST_SITE_URL = "https://yoursite.com/"
TEST_SITE_SITEMAP = "https://yoursite.com/sitemap.xml"

# Then run tests
python run_qa_tests.py
```

### Generate Custom Report

```bash
poetry run pytest tests/e2e/ \
  --html=custom_report.html \
  --json-report --json-report-file=custom_results.json
```

### Run Specific Test

```bash
poetry run pytest tests/e2e/test_phase1_data_collection.py::TestPhase1DataCollectionIntegrity::test_01_complete_crawl_captures_all_23_datapoints -v
```

### Run with Coverage

```bash
poetry run pytest tests/e2e/ --cov=app --cov-report=html
open htmlcov/index.html
```

---

## Need Help?

1. **Read the full QA documentation**: `tests/e2e/README.md`
2. **Check findings**: `QA_FINDINGS_AND_RECOMMENDATIONS.md`
3. **Review data points**: `DATA_POINTS_REFERENCE.md`
4. **Check test output**: `test_reports/QA_REPORT.md`

---

## Quick Reference Commands

```bash
# Full test suite
python run_qa_tests.py

# Single phase
poetry run pytest tests/e2e/test_phase1_data_collection.py -v

# Debug mode (watch browser)
poetry run pytest tests/e2e/ --headed --slowmo 1000

# Generate report only (after running tests)
python run_qa_tests.py --report-only

# Clean test reports
rm -rf test_reports/*
```

---

**Estimated Time**: 5-15 minutes for full suite
**Test Site**: https://mcaressources.ca/
**Total Tests**: 19 across 8 phases
**Expected Pass Rate**: 74-89% (first run)

---

Good luck with testing! 🎯
