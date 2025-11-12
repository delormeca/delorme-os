# Render.com Deployment Guide

## Overview

This guide covers deploying the Velocity v2.0 application to Render.com with full Playwright + Crawl4AI support for data extraction.

## Prerequisites

1. Render.com account
2. GitHub repository connected to Render
3. Required API keys:
   - OpenAI API key (for embeddings)
   - Tavily API key (for research)
   - Stripe keys (for payments)
   - Google OAuth credentials
   - Google Cloud credentials (optional, for entity extraction)

## Why Render.com Works (But Windows Dev Doesn't)

**The Issue**: Playwright doesn't work on Windows with Python 3.13 due to asyncio subprocess limitations.

**The Solution**: Render.com uses **Linux containers**, so Playwright works perfectly without any Python version issues.

**Development Workaround**: Use Python 3.11 on Windows, or use WSL2/Docker for local development.

## Deployment Configuration

### Option 1: Using render.yaml (Recommended)

The `render.yaml` file is already configured with:
- ✅ Python 3.11 environment
- ✅ Playwright browser installation (`playwright install --with-deps chromium`)
- ✅ PostgreSQL database
- ✅ Backend API service
- ✅ Frontend static site
- ✅ Environment variables template

**Deploy Steps**:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Configure Playwright for Render deployment"
   git push origin main
   ```

2. **Create New Web Service in Render**:
   - Go to Render Dashboard → New → Blueprint
   - Connect your GitHub repository
   - Select the `render.yaml` file
   - Render will automatically create all services

3. **Set Environment Variables** (in Render Dashboard):
   ```
   Required:
   - openai_api_key=sk-...
   - STRIPE_SECRET_KEY=sk_test_...
   - STRIPE_PUBLISHABLE_KEY=pk_test_...
   - google_oauth2_client_id=...
   - google_oauth2_secret=...

   Optional (for entity extraction):
   - GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
   - GOOGLE_CLOUD_PROJECT=your-project-id
   ```

4. **Update Callback URLs**:
   - After first deploy, update these in render.yaml:
     - `domain`: Your backend URL
     - `redirect_after_login`: Your frontend URL
     - `google_oauth2_redirect_uri`: Backend + `/api/auth/google_callback`
   - Also update in Google OAuth Console and Stripe Dashboard

5. **Deploy**:
   - Click "Apply" in Render dashboard
   - Wait 5-10 minutes for build (Playwright installation takes time)
   - Check logs for any errors

### Option 2: Using Dockerfile

If you prefer Docker deployment:

1. **Build and Test Locally** (requires Docker):
   ```bash
   docker build -t velocity-backend .
   docker run -p 8080:8080 velocity-backend
   ```

2. **Deploy to Render**:
   - Go to Render Dashboard → New → Web Service
   - Connect repository
   - Environment: Docker
   - Use Dockerfile at root
   - Set environment variables (same as above)

## Build Process Explained

### What Happens During Build

```bash
# 1. Install Poetry
pip install poetry

# 2. Install Python dependencies
poetry config virtualenvs.create false
poetry install --no-dev

# 3. Install Playwright + Chromium (THE CRITICAL STEP)
playwright install --with-deps chromium
```

**Why `--with-deps`?**
- Installs Chromium browser binary
- Installs system dependencies (fonts, libs)
- Required for headless browser automation

**Build Time**: ~5-10 minutes (Chromium download is ~100MB)

## Verification Steps

Once deployed, verify everything works:

### 1. Health Check
```bash
curl https://your-backend.onrender.com/api/health
# Should return: {"status": "ok"}
```

### 2. Test Sitemap Import
- Login to your deployed frontend
- Create a test client
- Click "Setup Website Engine"
- Import sitemap: `https://arvikabikerack.com/sitemap.xml`
- Should import 378 URLs successfully

### 3. Test Data Extraction
- After sitemap import, click "Start Data Extraction"
- Should see progress bar advancing
- Should complete with 100% success rate
- Check database for extracted data

### 4. Check Logs
```bash
# In Render Dashboard → Your Service → Logs
# Look for:
✅ APScheduler started
✅ OpenAI embeddings service initialized
🕷️ Initializing Crawl4AI browser...
✅ Crawl4AI initialized successfully
```

## Troubleshooting

### Build Fails: "playwright: command not found"

**Cause**: Playwright not in PATH after poetry install

**Fix**: Add to render.yaml buildCommand:
```yaml
buildCommand: |
  pip install poetry
  poetry config virtualenvs.create false
  poetry install --no-dev
  python -m playwright install --with-deps chromium
```

### Build Timeout

**Cause**: Playwright installation taking too long

**Fix**:
1. Upgrade Render plan (free tier has 5min build limit)
2. Or use Dockerfile with multi-stage build

### Crawl Fails: "Browser not found"

**Cause**: Playwright browsers not installed

**Fix**: Ensure `playwright install chromium` runs in build

### Crawl Fails: "Missing dependencies"

**Cause**: System libraries missing

**Fix**: Use `--with-deps` flag:
```bash
playwright install --with-deps chromium
```

### Out of Memory During Crawl

**Cause**: Chromium + data extraction uses significant RAM

**Fix**:
1. Upgrade Render plan to 1GB+ RAM
2. Adjust crawl rate limit in settings
3. Process smaller batches

## Performance Optimization

### Build Time
- **Current**: ~5-10 minutes
- **Optimize**: Use Docker with cached layers
- **Alternative**: Pre-build image and push to Docker Hub

### Crawl Performance
- **Concurrent Pages**: Default 1 (safe)
- **Rate Limit**: 2 second delay between pages
- **Memory Usage**: ~500MB per Chromium instance

### Cost Estimation (Render.com)

**Starter Plan** ($7/month):
- 512MB RAM
- Can handle ~50-100 pages per crawl
- Sufficient for most use cases

**Standard Plan** ($25/month):
- 2GB RAM
- Can handle 500+ pages per crawl
- Recommended for production

## Environment Variables Reference

### Required
```env
# Database (auto-configured by Render)
db_username=...
db_password=...
db_host=...
db_port=5432
db_database=delorme_os
db_sslmode=require

# Security
secret_key=<generate-secure-key>
algorithm=HS256
access_token_expire_minutes=10080

# Application URLs
domain=https://your-backend.onrender.com
redirect_after_login=https://your-frontend.onrender.com/dashboard

# OpenAI (for embeddings)
openai_api_key=sk-...

# Google OAuth
google_oauth2_client_id=...
google_oauth2_secret=...
google_oauth2_redirect_uri=https://your-backend.onrender.com/api/auth/google_callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Optional
```env
# Google Cloud (for entity extraction)
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/google-credentials.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Research APIs
tavily_api_key=tvly-...
research_max_iterations=5
research_default_retriever=tavily

# Email
mailchimp_api_key=...
from_email=noreply@yourdomain.com
```

## Post-Deployment Checklist

- [ ] Health check endpoint returns 200
- [ ] Database migrations applied
- [ ] Sitemap import works
- [ ] Data extraction works
- [ ] Bot protection warning displays correctly
- [ ] Google OAuth callback configured
- [ ] Stripe webhooks configured
- [ ] Frontend can communicate with backend
- [ ] CORS configured correctly
- [ ] SSL certificate active
- [ ] Logs show no critical errors
- [ ] Create superuser account
- [ ] Test payment flow

## Monitoring

### Key Metrics to Watch
1. **Crawl Success Rate**: Should be >95%
2. **Memory Usage**: Should stay <80% of allocated
3. **API Response Time**: Should be <500ms
4. **Build Time**: Should complete in <10 minutes

### Render Dashboard
- Monitor: Metrics → CPU/Memory usage
- Alerts: Set up for downtime/errors
- Logs: Check for Playwright/Crawl4AI errors

## Scaling

### Horizontal Scaling
- Render auto-scales on Standard+ plans
- APScheduler handles job distribution
- PostgreSQL connection pooling enabled

### Vertical Scaling
- Start: Starter (512MB)
- Production: Standard (2GB)
- Enterprise: Pro (4GB+)

## Backup & Recovery

### Database Backups
- Render PostgreSQL: Automatic daily backups
- Retention: 7 days (Starter), 30 days (Standard+)
- Restore: Via Render dashboard

### Code Backups
- GitHub repository is source of truth
- Tag releases for easy rollback
- Use Git branches for staging/production

## Security Considerations

1. **API Keys**: Store in Render Environment Variables (encrypted)
2. **Google Credentials**: Use Render Secrets for JSON file
3. **Database**: SSL required (configured in render.yaml)
4. **CORS**: Restrict to your frontend domain
5. **Rate Limiting**: Configure per your plan limits

## Additional Resources

- [Render Python Docs](https://render.com/docs/deploy-python)
- [Playwright on Linux](https://playwright.dev/docs/intro#linux)
- [Crawl4AI Documentation](https://crawl4ai.readthedocs.io/)
- [APScheduler Guide](https://apscheduler.readthedocs.io/)

---

**Last Updated**: 2025-01-06
**Status**: ✅ Production Ready
**Playwright Version**: Compatible with Python 3.11
**Render Compatibility**: Tested and working
