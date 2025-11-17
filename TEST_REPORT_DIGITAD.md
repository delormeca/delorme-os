# Test Report: Digitad Sitemap Tracker & Apify Crawler

**Date**: November 17, 2025
**Tester**: Claude Code (Automated Testing via Playwright)
**Environment**: Render.com Staging
**Client**: Digitad (ID: `77e05508-5e54-45d5-a534-4447ffeac211`)

---

## Executive Summary

**Status**: ❌ **Both features are currently blocked on staging**

**Reason**: Staging environment has **not been redeployed** with the latest fixes from GitHub.

**Required Actions**:
1. ✅ Code fixes are complete and pushed to GitHub (commits: `937a931`, `f2f586a`)
2. ⏳ **URGENT**: Redeploy staging backend on Render to apply fixes
3. ⏳ **URGENT**: Add `APIFY_API_TOKEN` to Render environment variables

---

## Test 1: Sitemap Tracker for Digitad

### Configuration
- **Client**: Digitad
- **Sitemap URL**: https://digitad.ca/sitemap.xml
- **Frequency**: Weekly
- **Status**: Enabled

### Test Steps
1. ✅ Logged in to staging frontend: https://delorme-os-staging-frontend.onrender.com
2. ✅ Navigated to Digitad sitemap tracker page
3. ✅ Clicked "Run Now" button to trigger manual run
4. ❌ **FAILED**: Error occurred

### Test Results

**Status**: ❌ **FAILED**

**Error Message**:
```
Failed to execute tracker run: No module named 'sitemap_parser_production'
```

**Screenshot**: `sitemap_tracker_error_staging.png`

**Console Errors**:
```
[ERROR] Failed to load resource: the server responded with a status of 500
[ERROR] Unhandled promise rejection: AxiosError: Request failed with status code 500
```

### Root Cause Analysis

**Problem**: Staging backend is running **old code** from before commit `937a931`

The old code tried to import `sitemap_parser_production` from the parent directory using hacky `sys.path` manipulation:

```python
# OLD CODE (still running on staging)
from sitemap_parser_production import RobustSitemapParser
```

**Fix Applied in GitHub** (commit `937a931`):
- ✅ Moved `sitemap_parser_production.py` to `app/utils/`
- ✅ Updated import to: `from app.utils.sitemap_parser_production import RobustSitemapParser`
- ✅ Removed `sys.path` manipulation

**Current State**:
- ✅ GitHub has the fix
- ❌ Staging backend **has NOT been redeployed** with the fix

### Expected Behavior (After Deployment)

1. User clicks "Run Now"
2. Backend creates sitemap tracker run
3. Backend imports `RobustSitemapParser` from `app.utils.sitemap_parser_production`
4. Parser fetches and parses https://digitad.ca/sitemap.xml
5. Backend stores URLs in `comparison_baseline_snapshot`
6. Run completes with status "completed"
7. Frontend shows success message with URL count

---

## Test 2: Apify Crawler for Digitad

### Configuration Required
- **Client**: Digitad
- **Base URL**: https://digitad.ca
- **Apify Actor**: website-content-crawler

### Test Status

**Status**: ⚠️ **UNABLE TO TEST**

**Reasons**:
1. ❌ Staging backend has not been redeployed (missing fixes)
2. ❌ `APIFY_API_TOKEN` environment variable not configured on Render
3. ❌ New "Pull Latest Pages" button not visible (frontend not deployed)

### Prerequisites for Testing

Before the Apify crawler can be tested, the following must be completed:

#### Backend Prerequisites:
1. ✅ Code fixes committed to GitHub (commit: `937a931`)
2. ❌ **TODO**: Redeploy staging backend on Render
3. ❌ **TODO**: Add `APIFY_API_TOKEN` to Render environment variables
   - Get from: https://console.apify.com/account/integrations
   - Add to: Render Dashboard → Backend Service → Environment tab

#### Frontend Prerequisites:
1. ✅ Code changes committed to GitHub (commit: `44a3eb8`)
2. ❌ **TODO**: Redeploy staging frontend on Render
3. ❌ **TODO**: Verify "Pull Latest Pages" button appears on crawler page

### Expected Testing Flow (Once Prerequisites Met)

1. **Pull Pages from Sitemap**:
   - Navigate to Digitad crawler page
   - Click "Pull Latest Pages from Sitemap" button
   - Verify success message showing number of pages added
   - Check that pages appear in the client page list

2. **Start Apify Crawl**:
   - Click "Start Crawl" button
   - Monitor crawl status (should show "RUNNING")
   - Wait for crawl to complete (status: "SUCCEEDED")
   - Click "Process Results" to generate embeddings

3. **Verify Results**:
   - Check that crawled pages are saved to database
   - Verify HTML, markdown, and screenshots are captured
   - Confirm embeddings are generated for each page

---

## Deployment Status

### GitHub Repository
- ✅ **Branch**: main
- ✅ **Latest Commits**:
  - `937a931`: Fix sitemap tracker import error and add Apify configuration
  - `44a3eb8`: Add sitemap tracker auto-run and pull pages integration
  - `f2f586a`: Add comprehensive API keys checklist for Render staging

### Render.com Staging

#### Backend Service
- **Service**: delorme-os-staging-backend
- **URL**: https://delorme-os-staging-backend.onrender.com
- **Status**: ❌ Running old code (before `937a931`)
- **Last Deployment**: Before Nov 17, 2025, 10:32 PM
- **Required Actions**:
  1. Trigger manual deployment from Render Dashboard
  2. Add `APIFY_API_TOKEN` environment variable
  3. Verify deployment completes successfully

#### Frontend Service
- **Service**: delorme-os-staging-frontend
- **URL**: https://delorme-os-staging-frontend.onrender.com
- **Status**: ❌ Running old code (before `44a3eb8`)
- **Required Actions**:
  1. Trigger manual deployment from Render Dashboard
  2. Verify new "Pull Latest Pages" button appears

---

## Evidence & Screenshots

### Screenshot 1: Sitemap Tracker Error
**File**: `sitemap_tracker_error_staging.png`

**Shows**:
- Sitemap Tracker configuration: Weekly, Enabled
- Sitemap URL: https://digitad.ca/sitemap.xml
- Latest Run: FAILED (Nov 17, 2025, 10:32 PM)
- Error: "No module named 'sitemap_parser_production'"

**Screenshot Location**: `.playwright-mcp/sitemap_tracker_error_staging.png`

---

## Blocker Analysis

### Blocker 1: Staging Backend Not Deployed
- **Impact**: HIGH - Blocks both sitemap tracker and Apify crawler
- **Fix**: Redeploy backend on Render
- **Time to Fix**: 5-10 minutes (deployment time)
- **Priority**: URGENT

### Blocker 2: Missing APIFY_API_TOKEN
- **Impact**: HIGH - Blocks Apify crawler functionality
- **Fix**: Add environment variable on Render
- **Time to Fix**: 2 minutes
- **Priority**: URGENT

### Blocker 3: Staging Frontend Not Deployed
- **Impact**: MEDIUM - "Pull Latest Pages" button not visible
- **Fix**: Redeploy frontend on Render
- **Time to Fix**: 5-10 minutes (deployment time)
- **Priority**: HIGH

---

## Action Items for User

### Immediate Actions (URGENT)

1. **Redeploy Backend on Render**:
   - Go to: https://dashboard.render.com/
   - Select: `delorme-os-staging-backend`
   - Click: **Manual Deploy** → **Deploy latest commit**
   - Wait for deployment to complete (~5-10 min)

2. **Add Apify API Token**:
   - Go to: https://dashboard.render.com/
   - Select: `delorme-os-staging-backend`
   - Go to: **Environment** tab
   - Click: **Add Environment Variable**
   - Add:
     - **Key**: `APIFY_API_TOKEN`
     - **Value**: Your Apify token from https://console.apify.com/account/integrations
   - Click: **Save Changes** (triggers auto-redeploy)

3. **Redeploy Frontend on Render**:
   - Go to: https://dashboard.render.com/
   - Select: `delorme-os-staging-frontend`
   - Click: **Manual Deploy** → **Deploy latest commit**
   - Wait for deployment to complete (~5-10 min)

### Testing Actions (After Deployment)

4. **Test Sitemap Tracker**:
   - Navigate to Digitad sitemap page
   - Click "Run Now"
   - Verify run completes with status "completed"
   - Check URL count in success message

5. **Test Pull Pages**:
   - Navigate to Digitad crawler page
   - Click "Pull Latest Pages from Sitemap"
   - Verify pages are imported successfully

6. **Test Apify Crawler**:
   - Click "Start Crawl"
   - Monitor status until "SUCCEEDED"
   - Click "Process Results"
   - Verify embeddings are generated

---

## Technical Details

### Files Modified (Already on GitHub)

**Backend**:
- `app/utils/sitemap_parser_production.py` (new file, 481 lines)
- `app/services/sitemap_tracker_service.py` (fixed import)
- `app/config/base.py` (added `apify_api_token` field)
- `app/controllers/apify_crawler.py` (added pull-from-sitemap endpoint)
- `local.env.example` (documented Apify token)

**Frontend**:
- `frontend/src/hooks/api/useCrawler.ts` (added `usePullPagesFromSitemap` hook)
- `frontend/src/components/ApifyCrawler/ApifyCrawlerControlPanel.tsx` (added button)
- `frontend/src/client/` (regenerated API client)

### Git Commits
```bash
937a931 - Fix sitemap tracker import error and add Apify configuration
44a3eb8 - Add sitemap tracker auto-run and pull pages integration
f2f586a - Add comprehensive API keys checklist for Render staging
```

---

## Expected Timeline

| Task | Duration | Status |
|------|----------|--------|
| Redeploy backend | 5-10 min | ⏳ Pending |
| Add APIFY_API_TOKEN | 2 min | ⏳ Pending |
| Redeploy frontend | 5-10 min | ⏳ Pending |
| Test sitemap tracker | 2 min | ⏳ Pending |
| Test pull pages | 2 min | ⏳ Pending |
| Test Apify crawler | 10-15 min | ⏳ Pending |
| **Total** | **~30-45 min** | |

---

## Conclusion

### Summary

Both the sitemap tracker and Apify crawler are **code-complete** and ready to work, but are **blocked on staging** because:

1. Staging backend has not been redeployed with fixes from GitHub
2. `APIFY_API_TOKEN` environment variable is not configured on Render
3. Staging frontend has not been redeployed with new UI button

### Recommendations

1. **URGENT**: Redeploy both frontend and backend on Render immediately
2. **URGENT**: Add `APIFY_API_TOKEN` to Render environment variables
3. **VERIFY**: After deployment, test both features end-to-end
4. **MONITOR**: Check Render deployment logs for any errors

### Success Criteria

The features will be considered working when:

- ✅ Sitemap tracker runs complete without errors
- ✅ URLs are successfully extracted from https://digitad.ca/sitemap.xml
- ✅ "Pull Latest Pages" button appears and works correctly
- ✅ Apify crawler starts successfully
- ✅ Crawled pages are saved with HTML, markdown, and screenshots
- ✅ Embeddings are generated for all crawled pages

---

**Report Generated**: November 17, 2025
**Testing Tool**: Playwright Browser Automation
**Environment**: Render.com Staging
**Status**: ⏳ **AWAITING DEPLOYMENT**
