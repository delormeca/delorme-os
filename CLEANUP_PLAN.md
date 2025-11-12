# DELORME OS CLEANUP PLAN
**Generated:** 2025-11-10
**Estimated Code Removal:** ~24% of codebase (revised)

---

## 🔒 CRITICAL: DO NOT TOUCH - PROTECTED SYSTEMS

**These systems are ESSENTIAL and must NOT be modified during cleanup:**

### 🔐 OAuth / Google Authentication (PROTECTED)
- **Backend:** `app/services/oauth_service.py`, OAuth endpoints in `app/controllers/auth.py`
- **Frontend:** Google OAuth buttons in Login.tsx and SignUp.tsx
- **Config:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` in config
- **Dependencies:** `requests-oauthlib`
- **Routes:** `/api/auth/google/authorize`, `/api/auth/google_callback`

### 💳 Stripe / Payments (PROTECTED)
- **Backend:** `app/config/payments.py`, `app/services/payment_manager.py`, `app/services/webhook_handler.py`, `app/controllers/payments.py`
- **Models:** `Purchase`, `Subscription`, `SubscriptionStatus`, User payment fields
- **Frontend:** All in `/pages/Billing.tsx`, `/pages/Pricing.tsx`, `/components/Pricing/`, payment hooks
- **Dependencies:** `stripe==11.1.1`
- **Routes:** All `/api/payments/*` endpoints, `/pricing`, `/dashboard/billing`
- **Webhooks:** Webhook handler and signature verification

### 🔑 Authentication System (PROTECTED)
- **Backend:** `app/controllers/auth.py`, `app/services/users_service.py`, `app/auth_backend.py`
- **Frontend:** All auth pages (Login, SignUp, ForgotPassword, ResetPassword, etc.)
- **JWT:** Token management, HttpOnly cookies
- **Dependencies:** `python-jose`, `libpass[bcrypt]`

### 👥 Client Management (PROTECTED)
- **Backend:** Client models, `app/controllers/clients.py`, `app/services/client_service.py`
- **Frontend:** All `/clients/*` pages and components
- **Database:** `client`, `client_page`, `engine_setup_run`, `crawl_run`, `data_point` tables

### 🕷️ Web Crawling & Data Extraction (PROTECTED)
- **Backend:** `app/services/page_crawl_service.py`, `app/services/crawl4ai_service.py`, all extractors
- **Services:** Embeddings, Google NLP, entity extraction
- **Dependencies:** `crawl4ai`, `beautifulsoup4`, `google-cloud-language`, `openai`
- **Background Tasks:** APScheduler, crawl tasks

### 🔬 Deep Research (PROTECTED)
- **Backend:** Research models, `app/controllers/research.py`, `app/services/research_service.py`
- **Frontend:** All `/dashboard/deep-researcher/*` pages
- **Dependencies:** `gpt-researcher`, `tavily-python`, `langchain`, `duckduckgo-search`
- **WebSocket:** Real-time research progress streaming

### 🔌 Integrations (PROTECTED)
- **Backend:** `app/controllers/integrations.py`, `app/services/integrations_service.py`
- **Frontend:** `/dashboard/integrations` page

### 🛡️ Permissions & RBAC (PROTECTED)
- **Backend:** `app/permissions.py`, `app/core/access_control.py`
- **Frontend:** `PermissionGuard.tsx` component
- **System:** Plan-based feature gating

### 👨‍💼 Admin Panel (PROTECTED)
- **Backend:** `app/admin.py`, SQLAdmin setup
- **Route:** `/admin`
- **Dependencies:** `sqladmin`

---

## Executive Summary

This document outlines the complete cleanup plan to remove unnecessary boilerplate features from Delorme OS, focusing on:
- Article/Blog system (not needed)
- Legacy Project system (replaced by Client system)
- Analytics dashboards (not needed)
- Simplify public landing page (remove marketing fluff, keep simple hero + features)
- Unused files and scripts

**What We're Keeping:**
- ✅ OAuth (Google Authentication) - **PROTECTED**
- ✅ Stripe (Payments & Subscriptions) - **PROTECTED**
- ✅ Authentication & User Management - **PROTECTED**
- ✅ Client Management System - **PROTECTED**
- ✅ Engine Setup (sitemap/manual import) - **PROTECTED**
- ✅ Client Pages with 22 SEO Data Points - **PROTECTED**
- ✅ Web Crawling (Crawl4AI) - **PROTECTED**
- ✅ Deep Research Feature - **PROTECTED**
- ✅ Integrations (webhooks/APIs) - **PROTECTED**
- ✅ Admin Panel - **PROTECTED**
- ✅ Entity Extraction & Embeddings - **PROTECTED**
- ✅ Permissions & RBAC - **PROTECTED**
- ✅ Simple Landing Page (simplified, not removed)

---

## 1. ARTICLE SYSTEM REMOVAL (~8% of codebase)

### Backend Files to Remove

**Models:**
- `app/models.py` - Remove `Article` class (lines to identify and remove)

**Controllers:**
- `app/controllers/article.py` - DELETE ENTIRE FILE

**Services:**
- `app/services/article_service.py` - DELETE ENTIRE FILE

**Schemas:**
- `app/schemas/article_schemas.py` - DELETE ENTIRE FILE

**Router Registration:**
- `main.py` - Remove article router import and registration

### Frontend Files to Remove

**Pages:**
- `frontend/src/pages/Article/MyArticles.tsx` - DELETE
- `frontend/src/pages/Article/CreateArticle.tsx` - DELETE
- `frontend/src/pages/Article/EditArticle.tsx` - DELETE
- `frontend/src/pages/Article/ViewArticle.tsx` - DELETE
- `frontend/src/pages/Article/` - DELETE ENTIRE DIRECTORY

**Components:**
- `frontend/src/components/Articles/ArticlesList.tsx` - DELETE
- `frontend/src/components/Articles/CreateArticleForm.tsx` - DELETE
- `frontend/src/components/Articles/EditArticleForm.tsx` - DELETE
- `frontend/src/components/Articles/` - DELETE ENTIRE DIRECTORY

**API Hooks:**
- `frontend/src/hooks/api/useArticles.ts` - DELETE
- `frontend/src/hooks/api/useArticleDetail.ts` - DELETE
- `frontend/src/hooks/api/useCreateArticle.ts` - DELETE
- `frontend/src/hooks/api/useUpdateArticle.ts` - DELETE
- `frontend/src/hooks/api/useDeleteArticle.ts` - DELETE

**Routing:**
- `frontend/src/App.tsx` - Remove article routes

**Navigation:**
- `frontend/src/components/ui/DashboardLayout.tsx` - Remove "My Articles" menu item

### Database Migration

Create migration to drop `article` table:
```sql
DROP TABLE IF EXISTS article CASCADE;
```

---

## 2. LEGACY PROJECT SYSTEM REMOVAL (~12% of codebase)

### Backend Files to Remove

**Models (in app/models.py):**
- `Project` class
- `Page` class
- `PageData` class
- `Keyword` class
- `Entity` class (legacy - different from client entity extraction)
- `BusinessFile` class
- `CrawlJob` class
- `ChatMessage` class

**Controllers:**
- `app/controllers/projects.py` - DELETE ENTIRE FILE (keep client-related endpoints)

**Services:**
- `app/services/project_service.py` - DELETE ENTIRE FILE
- `app/services/page_service.py` - DELETE ENTIRE FILE (conflicts with client_page_service)
- `app/services/crawling_service.py` - DELETE (replaced by page_crawl_service.py)

**Router Registration:**
- `main.py` - Remove project router import and registration

### Frontend Files to Remove

**Pages:**
- `frontend/src/pages/Projects/CreateProject.tsx` - DELETE
- `frontend/src/pages/Projects/EditProject.tsx` - DELETE
- `frontend/src/pages/Projects/ProjectDetail.tsx` - DELETE
- `frontend/src/pages/Projects/ProjectCrawling.tsx` - DELETE
- `frontend/src/pages/Projects/` - DELETE ENTIRE DIRECTORY

**Components:**
- `frontend/src/components/Projects/ProjectsList.tsx` - DELETE
- `frontend/src/components/Projects/ProjectCard.tsx` - DELETE
- `frontend/src/components/Projects/CreateProjectForm.tsx` - DELETE
- `frontend/src/components/Projects/` - DELETE ENTIRE DIRECTORY
- `frontend/src/components/crawling/` - DELETE ENTIRE DIRECTORY (replaced by client-based crawling)

**API Hooks:**
- `frontend/src/hooks/api/useProjects.ts` - DELETE
- `frontend/src/hooks/api/usePages.ts` - DELETE
- `frontend/src/hooks/api/useCrawling.ts` - DELETE

**Routing:**
- `frontend/src/App.tsx` - Remove project routes

**Navigation:**
- Remove project-related menu items (if any)

### Database Migration

Create migration to drop legacy project tables:
```sql
DROP TABLE IF EXISTS chatmessage CASCADE;
DROP TABLE IF EXISTS crawljob CASCADE;
DROP TABLE IF EXISTS businessfile CASCADE;
DROP TABLE IF EXISTS entity CASCADE;
DROP TABLE IF EXISTS keyword CASCADE;
DROP TABLE IF EXISTS pagedata CASCADE;
DROP TABLE IF EXISTS page CASCADE;
DROP TABLE IF EXISTS project CASCADE;
```

---

## 3. ANALYTICS SYSTEM REMOVAL (~5% of codebase)

### Backend Files to Remove

**Controllers:**
- `app/controllers/analytics.py` - DELETE ENTIRE FILE

**Services:**
- `app/services/analytics_service.py` - DELETE ENTIRE FILE

**Router Registration:**
- `main.py` - Remove analytics router import and registration

### Frontend Files to Remove

**Pages:**
- `frontend/src/pages/Analytics.tsx` - DELETE

**API Hooks:**
- `frontend/src/hooks/api/useAnalytics.ts` - DELETE

**Routing:**
- `frontend/src/App.tsx` - Remove `/dashboard/analytics` route

**Navigation:**
- `frontend/src/components/ui/DashboardLayout.tsx` - Remove "Analytics" menu item

### Permissions Cleanup

**Backend:**
- `app/permissions.py` - Remove analytics-related permissions from `FeaturePermission` enum:
  - `BASIC_ANALYTICS`
  - `ADVANCED_ANALYTICS`
  - `PREMIUM_ANALYTICS`
  - `TEAM_ANALYTICS`
- Update `PLAN_FEATURES` mapping to remove analytics permissions

**Frontend:**
- No additional cleanup needed

---

## 4. SIMPLIFY PUBLIC LANDING PAGE (~8% of frontend)

**Goal:** Keep a simple, clean landing page at `/` with essential elements only. Remove marketing bloat.

### Frontend Files to Remove (Marketing Fluff)

**Components to DELETE:**
- `frontend/src/components/Home/TestimonialsSection.tsx` - DELETE
- `frontend/src/components/Home/FAQ.tsx` - DELETE
- `frontend/src/components/Home/CTASection.tsx` - DELETE (redundant with hero buttons)
- `frontend/src/components/Home/AboutSection.tsx` - DELETE
- `frontend/src/components/Home/StatsSection.tsx` - DELETE
- `frontend/src/components/Home/ClientsUsing.tsx` - DELETE
- `frontend/src/components/Home/ContactSection.tsx` - DELETE

### Frontend Files to KEEP & SIMPLIFY

**Keep these components (may need simplification):**
- ✅ `frontend/src/pages/Home.tsx` - KEEP, but simplify to only render hero + features + footer
- ✅ `frontend/src/components/Home/HeroSection.tsx` - KEEP (logo, tagline, Login/Sign Up buttons)
- ✅ `frontend/src/components/Home/FeaturesSection.tsx` - KEEP, but simplify to 3-4 key features
- ⚠️ `frontend/src/components/Home/PricingPreviewSection.tsx` - OPTIONAL: Keep or replace with "View Pricing" button

**Simplification Tasks:**
1. Update `Home.tsx` to only render:
   - Header with logo + Login/Sign Up buttons
   - HeroSection (value prop + CTA buttons)
   - FeaturesSection (3-4 key features only)
   - Optional: Pricing preview or link to `/pricing`
   - Footer

2. Simplify `FeaturesSection.tsx`:
   - Remove fancy animations
   - Show 3-4 bullet points with icons
   - Keep it minimal and fast

3. Simplify `HeroSection.tsx`:
   - Clean tagline
   - Two clear CTAs: "Get Started" (→ /signup) and "Login" (→ /login)
   - Remove animations/videos if present

**Final Landing Page Structure:**
```
┌─────────────────────────────────────────┐
│  [Logo]              [Login] [Sign Up]  │
├─────────────────────────────────────────┤
│                                         │
│    Delorme OS                           │
│    AI-Powered SEO Data Extraction       │
│                                         │
│    ✓ Automated sitemap import           │
│    ✓ 22 SEO data points per page        │
│    ✓ AI-powered entity extraction       │
│    ✓ Deep research capabilities         │
│                                         │
│    [Get Started] [View Pricing]         │
│                                         │
├─────────────────────────────────────────┤
│  Footer: Terms | Privacy | © 2025      │
└─────────────────────────────────────────┘
```

**Routing:**
- ✅ Keep `/` route pointing to simplified Home.tsx
- ✅ Keep `/pricing` route for plan details

**Note:** Keep Footer.tsx - it's used for Terms/Privacy links.

---

## 5. UNUSED FILES & SCRIPTS REMOVAL (~1% of codebase)

### Root Directory Cleanup

**Empty/Legacy Files:**
- `appauth_backend.py` - DELETE (1 byte empty file)
- `cookies.txt` - DELETE
- `nul` - DELETE

**Test Scripts (move to tests/ or delete):**
- `check_client_status.py` - DELETE (or move to scripts/)
- `check_pages.py` - DELETE
- `check_runs.py` - DELETE
- `check_users.py` - DELETE
- `validate_task_2c.py` - DELETE
- `verify_frank_complete_status.py` - DELETE
- `fix_frank_page_count.py` - DELETE
- `test_bot_protection.py` - DELETE
- `test_count_api.py` - DELETE
- `test_research_api.py` - DELETE
- `test_shopify_sitemap.py` - DELETE
- `test_sitemap_parse.py` - DELETE
- `test_url_validation.py` - DELETE

**Deployment Documentation (consolidate):**
- Keep: `README.md`, `RENDER_DEPLOYMENT.md`
- Consider removing/consolidating:
  - `DEPLOYMENT_QUICK_START.md`
  - `DEPLOYMENT_SETUP_SUMMARY.md`
  - `RENDER_DEPLOYMENT_FIX.md`
  - `RENDER_DEPLOYMENT_GUIDE.md`
  - `RENDER_DEPLOYMENT_SUMMARY.md`
  - `QUICK_START_RENDER.md`
  - `NETWORK_FIX.md`

**Phase Documentation (archive or remove):**
- `PHASE_3_COMPLETE_SUMMARY.md` - Archive or DELETE
- `PHASE_3_IMPLEMENTATION_STATUS.md` - Archive or DELETE
- `PHASE_3_INTEGRATION_GUIDE.md` - Archive or DELETE
- `PHASE_4_COMPLETE.md` - Archive or DELETE
- `PHASE_4_FRONTEND_COMPLETE.md` - Archive or DELETE
- `PHASE_4_IMPLEMENTATION_SUMMARY.md` - Archive or DELETE
- `PHASE_4_STATUS.md` - Archive or DELETE
- `PHASE_4_TESTING_GUIDE.md` - Archive or DELETE

**Other Docs:**
- `BOT_PROTECTION_FEATURE.md` - Keep (relevant feature)
- `DEEP_RESEARCHER_INTEGRATION_PLAN.md` - Keep (core feature)
- `VALIDATION_REPORT_TASKS_2C_2D_2E.md` - Archive or DELETE

---

## 6. DEPENDENCY CLEANUP

### Backend Dependencies to Remove (pyproject.toml)

After removing article/project/analytics systems, these packages MAY be removable (verify first):
- None directly tied to removed features (most are shared infrastructure)

**Note:** Most backend dependencies are used by remaining features (crawling, research, embeddings, etc.)

### Frontend Dependencies to Remove (package.json)

After cleanup, audit these packages:
- `react-markdown` - Only if not used elsewhere (Deep Research may use it)
- Check if all `@tanstack/react-table` usage is for client pages
- Verify `material-ui-confirm` is still used for confirmations

**Note:** Most frontend dependencies are shared across features, so removal opportunities are limited.

---

## 7. CONFIGURATION UPDATES

### Environment Variables

**Remove from .env examples (if not used elsewhere):**
- Check if any analytics-specific env vars exist

**Keep all:**
- Database, JWT, OAuth, Stripe, OpenAI, Google NLP, Tavily, email configs

### Permissions System

**app/permissions.py:**
- Remove `FeaturePermission` enum values:
  - `BASIC_ANALYTICS`
  - `ADVANCED_ANALYTICS`
  - `PREMIUM_ANALYTICS`
  - `TEAM_ANALYTICS`
  - Any article-related permissions (if they exist)

- Update `PLAN_FEATURES` dict to remove deleted permissions

**Keep:**
- All client, crawling, research, integration permissions

---

## 8. ROUTING & NAVIGATION UPDATES

### Backend Routing (main.py)

**Remove these router imports:**
```python
from app.controllers.article import router as article_router
from app.controllers.projects import router as projects_router
from app.controllers.analytics import router as analytics_router
```

**Remove these router registrations:**
```python
app.include_router(article_router, prefix="/api/articles", tags=["Articles"])
app.include_router(projects_router, prefix="/api/projects", tags=["Projects"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
```

### Frontend Routing (App.tsx)

**Remove these routes:**
- `/` (Home) - Replace with redirect to `/login`
- `/dashboard/my-articles`
- `/dashboard/analytics`
- `/projects/:projectId`
- `/projects/:projectId/edit`
- `/projects/:projectId/crawling`
- `/clients/:clientId/projects/new` (if creating projects under clients)

**Keep these routes:**
- `/login`, `/signup`, `/forgot-password`, etc. (auth)
- `/dashboard` (main dashboard)
- `/dashboard/profile`
- `/dashboard/billing`
- `/dashboard/integrations`
- `/dashboard/deep-researcher/*` (research)
- `/clients/*` (client management)
- `/pricing` (for upgrades)

### Navigation Updates (DashboardLayout.tsx)

**Remove menu items:**
- "My Articles"
- "Analytics"

**Keep menu items:**
- Dashboard
- Clients
- Deep Researcher
- Integrations
- Billing
- Settings/Profile

---

## 9. DATABASE MIGRATION PLAN

### Migration Steps

**Step 1: Create new migration**
```bash
cd velocity-boilerplate
task db:migrate-create -- "cleanup_unused_features"
```

**Step 2: Edit migration file**

Add to upgrade():
```python
def upgrade() -> None:
    # Drop analytics (no tables, just endpoints)

    # Drop article system
    op.drop_table('article')

    # Drop legacy project system
    op.drop_table('chatmessage')
    op.drop_table('crawljob')
    op.drop_table('businessfile')
    op.drop_table('entity')  # Legacy entity table, NOT client entity extraction
    op.drop_table('keyword')
    op.drop_table('pagedata')
    op.drop_table('page')
    op.drop_table('project')
```

Add to downgrade():
```python
def downgrade() -> None:
    # Recreate tables if needed (copy from old migrations)
    # OR just pass (one-way migration)
    pass
```

**Step 3: Test migration**
```bash
# Dry run (review SQL)
task db:migrate-up --dry-run

# Apply migration
task db:migrate-up
```

### Pre-Migration Backup

**IMPORTANT:** Backup database before migration!

```bash
# Docker PostgreSQL backup
docker exec -t delorme-os-db pg_dump -U delorme_user delorme_db > backup_before_cleanup_$(date +%Y%m%d).sql

# Or use pg_dump directly
pg_dump -h localhost -p 54323 -U delorme_user delorme_db > backup_before_cleanup.sql
```

---

## 10. TESTING PLAN

### After Cleanup Testing

**Backend Tests:**
1. Run full test suite: `poetry run pytest`
2. Verify no import errors
3. Check OpenAPI docs: http://localhost:8020/docs
4. Verify all remaining endpoints work

**Frontend Tests:**
1. Run test suite: `cd frontend && npm run test`
2. Build check: `npm run build`
3. Manual testing:
   - Login flow
   - Client CRUD
   - Engine setup
   - Page crawling
   - Deep Research
   - Billing/Stripe
   - Integrations
   - Admin panel

**Integration Tests:**
1. Create new user
2. Create new client
3. Run engine setup (sitemap)
4. Run page crawl
5. Create research request
6. Test payment flow
7. Test admin panel

### Regression Testing Checklist

- [ ] Authentication (login, signup, logout, password reset)
- [ ] User profile management
- [ ] Client CRUD operations
- [ ] Engine setup (sitemap + manual)
- [ ] Client pages listing & export
- [ ] Page crawling (full, selective, manual)
- [ ] Deep Research (create, view, chat)
- [ ] Stripe payments (checkout, portal, webhook)
- [ ] Integrations page
- [ ] Admin panel (users, clients, payments)
- [ ] Project leads management
- [ ] Navigation & routing
- [ ] Permissions & RBAC
- [ ] API client generation

---

## 11. DOCUMENTATION UPDATES

### Files to Update

**README.md:**
- Remove mentions of articles, projects (legacy), analytics
- Update feature list to reflect actual Delorme OS capabilities
- Update screenshots if they show removed features

**CLAUDE.md:**
- Remove article/project/analytics sections
- Update common commands
- Update file structure
- Remove references to removed features in examples

**docs/ directory:**
- Review and update any guides that mention removed features

### Create New Documentation

**ARCHITECTURE.md:**
- Document the client-centric architecture
- Explain engine setup → crawling → data extraction flow
- Document the 22 SEO data points
- Explain Deep Research integration

**API.md:**
- Document remaining API endpoints
- Remove article/project/analytics endpoints

---

## 12. IMPLEMENTATION ORDER

### Phase 1: Preparation (No Code Changes)
1. ✅ Create this cleanup plan
2. ✅ Backup database
3. ✅ Create git branch: `git checkout -b cleanup/remove-unused-features`
4. ✅ Commit current state

### Phase 2: Backend Cleanup
1. Remove article controller, service, schemas
2. Remove legacy project controllers, services
3. Remove analytics controller, service
4. Update app/models.py (remove model classes)
5. Update main.py (remove router registrations)
6. Update permissions.py (remove unused permissions)
7. Create database migration
8. Test backend: `poetry run pytest`

### Phase 3: Frontend Cleanup
1. Remove article pages, components, hooks
2. Remove legacy project pages, components, hooks
3. Remove analytics pages, hooks
4. Remove home page components
5. Update App.tsx (remove routes)
6. Update DashboardLayout.tsx (remove nav items)
7. Test frontend: `npm run test && npm run build`

### Phase 4: Infrastructure Cleanup
1. Remove unused files (test scripts, legacy docs)
2. Consolidate deployment docs
3. Clean up dependencies (audit and remove)
4. Update documentation

### Phase 5: Migration & Testing
1. Run database migration
2. Full integration testing
3. Manual testing of all features
4. Fix any issues discovered

### Phase 6: Finalization
1. Update README.md and CLAUDE.md
2. Create ARCHITECTURE.md
3. Commit all changes
4. Create pull request
5. Deploy to staging for final testing

---

## 13. ROLLBACK PLAN

If cleanup causes issues:

### Quick Rollback
```bash
# Revert git branch
git checkout main

# Rollback database migration
task db:migrate-down
```

### Partial Rollback
```bash
# Restore specific files
git checkout main -- path/to/file

# Revert specific commits
git revert <commit-hash>
```

### Full Restore
```bash
# Restore database from backup
psql -h localhost -p 54323 -U delorme_user delorme_db < backup_before_cleanup.sql

# Restore code
git reset --hard main
```

---

## 14. ESTIMATED IMPACT

### Code Reduction
- **Backend:** ~20-25% reduction
  - Models: -8 classes
  - Controllers: -3 files
  - Services: -5 files
  - Schemas: -1 file

- **Frontend:** ~35-40% reduction
  - Pages: -15 files
  - Components: -30+ files
  - Hooks: -10 files

- **Database:** -9 tables

### Performance Impact
- Faster builds (fewer files to compile)
- Smaller bundle size (frontend)
- Simpler migrations (fewer tables)
- Clearer codebase (less confusion)

### Maintenance Impact
- Reduced complexity
- Clearer purpose
- Easier onboarding
- Less technical debt

---

## 15. POST-CLEANUP RECOMMENDATIONS

### Code Organization
1. **Split models.py** into modules:
   - `models/auth.py`
   - `models/clients.py`
   - `models/research.py`
   - `models/payments.py`

2. **Organize services** by domain:
   - `services/client/` (client-related services)
   - `services/research/` (research services)
   - `services/extraction/` (data extraction)

3. **Create feature modules**:
   - `features/engine_setup/`
   - `features/page_crawl/`
   - `features/research/`

### Security Enhancements
1. Add rate limiting middleware
2. Review CORS settings
3. Add security headers
4. Audit environment variables

### Performance Optimizations
1. Add Redis caching for client lists
2. Optimize database queries
3. Add pagination to all list endpoints
4. Consider CDN for static assets

### Monitoring & Observability
1. Add application performance monitoring (APM)
2. Add error tracking (Sentry)
3. Add usage analytics
4. Add cost tracking dashboard

---

## CONCLUSION

This cleanup will remove approximately **28% of the codebase** while maintaining all core Delorme OS functionality:

**Keeping:**
- Client management
- Engine setup (sitemap/manual)
- 22 SEO data points extraction
- Web crawling (Crawl4AI)
- Deep Research (GPT Researcher)
- Payments (Stripe)
- Integrations
- Authentication
- Admin panel

**Removing:**
- Article/blog system
- Legacy project system
- Analytics dashboards
- Public landing page
- Unused files & scripts

**Benefits:**
- Cleaner, more focused codebase
- Easier maintenance
- Faster builds
- Less confusion
- Better performance

**Next Step:** Review this plan, then proceed with Phase 1 (Preparation).
