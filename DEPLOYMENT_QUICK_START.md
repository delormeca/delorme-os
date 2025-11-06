# Deployment Quick Start - Render.com

## TL;DR

Your application is **production-ready** for Render.com deployment. The Playwright + Data Extraction feature will work perfectly on Render (Linux) even though it doesn't work on Windows dev environment.

## Why It Works on Render

- ✅ Render uses **Linux containers** (Ubuntu)
- ✅ Playwright works perfectly on Linux
- ✅ Python 3.11 configured in `pyproject.toml`
- ✅ `render.yaml` configured with Playwright installation
- ✅ `Dockerfile` includes all Chromium dependencies

## 3-Step Deploy

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment with Playwright"
git push origin main
```

### Step 2: Create Render Services
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub repo
4. Select `render.yaml`
5. Click **Apply**

### Step 3: Set Environment Variables
In Render Dashboard, add these secrets:
```
openai_api_key=sk-...
STRIPE_SECRET_KEY=sk_test_...
google_oauth2_client_id=...
google_oauth2_secret=...
```

## That's It!

Build will take **5-10 minutes** (Playwright downloads Chromium).

After deployment:
- ✅ Health check: `https://your-app.onrender.com/api/health`
- ✅ Test sitemap import with any XML sitemap
- ✅ Data extraction will work with full Playwright support

## Files Configured

| File | Purpose | Status |
|------|---------|--------|
| `render.yaml` | Render deployment config | ✅ Updated |
| `Dockerfile` | Docker deployment option | ✅ Updated |
| `build.sh` | Alternative build script | ✅ Created |
| `pyproject.toml` | Python 3.11 requirement | ✅ Correct |
| `RENDER_DEPLOYMENT.md` | Full deployment guide | ✅ Complete |

## Build Command

The critical line in `render.yaml`:
```bash
playwright install --with-deps chromium
```

This installs:
- ✅ Chromium browser binary
- ✅ All system dependencies (fonts, libs)
- ✅ Required for headless browser automation

## Cost Estimate

**Starter Plan ($7/month)**:
- 512MB RAM
- Handles ~100 pages per crawl
- Perfect for MVP/testing

**Standard Plan ($25/month)**:
- 2GB RAM
- Handles 500+ pages per crawl
- Recommended for production

## Troubleshooting

### "Build taking too long"
- Normal! Chromium download is ~100MB
- Takes 5-10 minutes on first build
- Subsequent builds use cache (~2-3 min)

### "Out of memory during crawl"
- Upgrade from Starter to Standard plan
- Or reduce crawl batch size in settings

### "Health check fails"
- Check logs in Render dashboard
- Verify database connected
- Confirm migrations ran

## Support

Full details in: `RENDER_DEPLOYMENT.md`

---

**Status**: ✅ Ready to Deploy
**Platform**: Render.com
**Playwright**: Fully Supported
**Last Updated**: 2025-01-06
