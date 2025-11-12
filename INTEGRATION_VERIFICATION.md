# 🔍 ENGINE/CRAWLING INTEGRATION VERIFICATION PLAN

**Purpose:** Ensure 100% frontend-backend integration for the engine/crawling process after UI overhaul changes.

**Critical Requirement:** The engine setup → crawling workflow MUST work flawlessly.

---

## 📋 INTEGRATION CHECKLIST

### ✅ Phase A: Database Changes (Client Model)
- [x] Backend: Client model has `slug` and `team_lead` fields
- [x] Backend: Slugs auto-generated on client creation
- [x] Backend: GET /api/clients/slug/{slug} endpoint works
- [ ] **FRONTEND VERIFICATION NEEDED:**
  - [ ] Client creation form accepts team_lead
  - [ ] Client list displays slug and team_lead
  - [ ] Client detail page shows slug and team_lead
  - [ ] No TypeScript errors in client-related components

### ✅ Phase B: Sitemap Validation
- [x] Backend: POST /api/engine-setup/validate-sitemap endpoint created
- [x] Backend: Uses RobustSitemapParserService
- [x] Frontend: useValidateSitemap hook created
- [x] Frontend: "Test Sitemap" button added to EngineSetupModal
- [ ] **INTEGRATION VERIFICATION NEEDED:**
  - [ ] Button appears in modal
  - [ ] Button validates sitemap successfully
  - [ ] Success snackbar shows URL count
  - [ ] Error snackbar shows helpful messages
  - [ ] **CRITICAL:** "Add Pages" button still works after testing sitemap

### 🔴 CRITICAL: Engine Setup → Crawling Process
- [ ] **End-to-End Workflow:**
  1. [ ] Create new client with sitemap URL
  2. [ ] Click "Test Sitemap" → See success with URL count
  3. [ ] Click "Add Pages" → Engine setup starts
  4. [ ] Setup run creates ClientPage records
  5. [ ] Crawling process starts automatically
  6. [ ] Pages show in client detail page
  7. [ ] On-page factors are extracted
  8. [ ] No errors in console or backend logs

---

## 🧪 INTEGRATION TESTS TO RUN

### Test 1: Verify Existing Engine Setup Still Works

**Goal:** Ensure our changes didn't break the core engine/crawling process.

**Steps:**
1. Start backend: `task run-backend`
2. Start frontend: `cd frontend && npm run dev`
3. Login to application
4. Navigate to Clients page
5. Click "Create Client" button
6. Fill in client details:
   - Name: "Integration Test Client"
   - Website URL: "https://cleio.com"
   - Sitemap URL: "https://cleio.com/page-sitemap1.xml"
   - Team Lead: "Tommy Delorme" (test new field)
7. **WITHOUT clicking "Test Sitemap"**, click "Add Pages"
8. **Expected Result:**
   - Modal closes
   - Setup run starts
   - Pages are imported
   - Crawling begins
   - Client detail page shows pages list

**Pass Criteria:** ✅ Engine setup completes successfully, pages appear in list

---

### Test 2: Verify New "Test Sitemap" Button Works

**Goal:** Ensure sitemap validation works and doesn't interfere with engine setup.

**Steps:**
1. Navigate to Clients page
2. Click "Create Client"
3. Fill in sitemap URL: "https://cleio.com/page-sitemap1.xml"
4. Click "Test Sitemap" button
5. **Expected Result:**
   - Button shows "Validating..." with spinner
   - After 2-5 seconds, success snackbar appears
   - Snackbar shows: "Sitemap validated successfully! Found X URLs (sitemap_index)"
   - Button returns to normal state
6. **Now click "Add Pages"**
7. **Expected Result:**
   - Engine setup proceeds normally
   - Pages are imported successfully
   - Crawling works

**Pass Criteria:** ✅ Validation works AND engine setup still works after validation

---

### Test 3: Verify Error Handling

**Goal:** Ensure validation errors don't break the workflow.

**Steps:**
1. Navigate to Clients page
2. Click "Create Client"
3. Enter invalid sitemap: "https://example.com/nonexistent.xml"
4. Click "Test Sitemap"
5. **Expected Result:**
   - Error snackbar appears with suggestion
   - Snackbar does NOT auto-hide
   - User can dismiss snackbar
6. Fix URL to valid sitemap: "https://cleio.com/page-sitemap1.xml"
7. Click "Test Sitemap" again
8. **Expected Result:**
   - Success snackbar appears
9. Click "Add Pages"
10. **Expected Result:**
    - Engine setup works normally

**Pass Criteria:** ✅ Error validation doesn't prevent subsequent successful setup

---

### Test 4: Verify Manual URL Entry Mode

**Goal:** Ensure manual URL entry (non-sitemap mode) still works.

**Steps:**
1. Navigate to Clients page
2. Click "Create Client"
3. Switch to "Manual URL Entry" mode
4. Enter base URL: "https://cleio.com"
5. Click "Add Pages"
6. **Expected Result:**
   - Manual URL crawling starts
   - Pages are discovered and imported
   - Crawling proceeds normally

**Pass Criteria:** ✅ Manual mode unaffected by sitemap validation changes

---

### Test 5: Full End-to-End Workflow

**Goal:** Complete integration test of all components.

**Steps:**
1. **Create Client:**
   - Name: "E2E Test Client"
   - Website: "https://pestagent.ca"
   - Sitemap: "https://pestagent.ca/sitemap.xml"
   - Team Lead: "Ismael Girard"

2. **Validate Sitemap:**
   - Click "Test Sitemap"
   - Verify success message

3. **Start Engine Setup:**
   - Click "Add Pages"
   - Verify setup run starts

4. **Monitor Progress:**
   - Watch setup run progress
   - Verify pages appear in list

5. **Check Client Detail:**
   - Navigate to client detail page
   - Verify slug is visible in URL or UI
   - Verify team_lead displays
   - Verify pages list shows imported pages

6. **Verify Crawling:**
   - Check that pages have status_code populated
   - Check that on-page factors are extracted (title, meta, h1)
   - Verify no errors in console

**Pass Criteria:** ✅ Complete workflow from client creation to crawled pages with data

---

## 🔧 BACKEND VERIFICATION

### Endpoint Availability

**Run these curl commands to verify all endpoints work:**

```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"password"}' \
  -c cookies.txt

# 2. Test new slug endpoint
curl -X GET http://localhost:8000/api/clients/slug/pest-agent2 \
  -b cookies.txt

# 3. Test sitemap validation endpoint
curl -X POST http://localhost:8000/api/engine-setup/validate-sitemap \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"sitemap_url":"https://cleio.com/page-sitemap1.xml"}'

# 4. Test existing engine setup endpoint (CRITICAL)
curl -X POST http://localhost:8000/api/engine-setup/start \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "client_id":"<UUID>",
    "setup_type":"sitemap",
    "sitemap_url":"https://cleio.com/page-sitemap1.xml",
    "base_url":"https://cleio.com"
  }'
```

**Expected Results:**
- Slug endpoint: 200 OK with client data
- Validation endpoint: 200 OK with validation result
- Engine setup endpoint: 200 OK with setup_run_id

---

## 🎯 CRITICAL SUCCESS CRITERIA

For the integration to be considered 100% functional:

1. ✅ **Existing engine setup process is UNBROKEN**
   - Client creation works
   - Engine setup modal opens
   - "Add Pages" button starts setup
   - Setup run completes successfully
   - Pages are imported
   - Crawling extracts on-page factors

2. ✅ **New sitemap validation works independently**
   - "Test Sitemap" button appears
   - Validation returns results
   - Success/error feedback is clear
   - Validation doesn't interfere with setup

3. ✅ **New client fields work end-to-end**
   - team_lead can be set during creation
   - slug is auto-generated
   - Both fields are stored in database
   - Both fields display in frontend
   - Slug endpoint works for routing

4. ✅ **No regressions in existing features**
   - Client list/detail pages work
   - Page list displays correctly
   - Filtering/sorting works
   - All buttons are functional
   - No console errors
   - No backend errors

---

## 🚨 KNOWN ISSUES TO CHECK

### Frontend TypeScript
- Check for any new TypeScript errors in:
  - `frontend/src/components/Clients/EngineSetupModal.tsx`
  - `frontend/src/hooks/api/useEngineSetup.ts`
  - `frontend/src/pages/Clients/`

### Backend Dependencies
- Verify RobustSitemapParserService is imported correctly
- Check for any circular import issues
- Verify all schemas are properly registered

### Integration Points
- Check that EngineSetupModal renders without errors
- Verify StandardButton component is available
- Ensure snackbar context is working
- Confirm axios config includes auth headers

---

## 📝 TEST EXECUTION LOG

### Date: ___________
### Tester: ___________

| Test | Status | Notes | Issues Found |
|------|--------|-------|--------------|
| Test 1: Existing Engine Setup | ⬜ Pass / ⬜ Fail | | |
| Test 2: Test Sitemap Button | ⬜ Pass / ⬜ Fail | | |
| Test 3: Error Handling | ⬜ Pass / ⬜ Fail | | |
| Test 4: Manual URL Entry | ⬜ Pass / ⬜ Fail | | |
| Test 5: Full E2E Workflow | ⬜ Pass / ⬜ Fail | | |

### Overall Result: ⬜ PASS / ⬜ FAIL

---

## 🔄 ROLLBACK PLAN

If integration tests fail:

1. **Identify Breaking Change:**
   - Check console errors
   - Check backend logs
   - Review recent commits

2. **Isolate Issue:**
   - Test backend endpoints independently
   - Test frontend components in isolation
   - Check database schema integrity

3. **Quick Fixes:**
   - Regenerate frontend API client: `task frontend:generate-client`
   - Restart backend server: `task run-backend`
   - Clear browser cache and reload frontend

4. **Rollback if Necessary:**
   - Revert migration: `poetry run alembic downgrade -1`
   - Revert code changes via git
   - Restore from backup

---

## ✅ SIGN-OFF

**I certify that all integration tests have passed and the engine/crawling process works 100% with the frontend:**

- [ ] All 5 integration tests passed
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] Engine setup completes successfully
- [ ] Crawling process extracts data correctly
- [ ] New features work as specified
- [ ] No regressions in existing features

**Approved by:** ___________
**Date:** ___________

---

## 📚 NEXT STEPS AFTER VERIFICATION

Once all tests pass:

1. **Generate Frontend API Client:**
   ```bash
   task frontend:generate-client
   ```

2. **Commit Changes:**
   ```bash
   git add .
   git commit -m "feat: engine UI overhaul - Phase A & B complete"
   ```

3. **Proceed to Phase C:** Page filtering implementation

4. **Update Documentation:** Note any configuration changes needed
