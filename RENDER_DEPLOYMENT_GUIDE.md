# Render.com Staging & Production Deployment Guide

This guide will help you deploy your Velocity application to Render.com with separate staging and production environments.

## Table of Contents
1. [GitHub Setup](#github-setup)
2. [Render.com Account Setup](#rendercom-account-setup)
3. [Deploy Staging Environment](#deploy-staging-environment)
4. [Deploy Production Environment](#deploy-production-environment)
5. [Environment Variables](#environment-variables)
6. [Database Migrations](#database-migrations)
7. [Continuous Deployment](#continuous-deployment)
8. [Troubleshooting](#troubleshooting)

---

## 1. GitHub Setup

### Option A: Single Repository with Multiple Branches (Recommended)

This approach uses one repository with different branches for different environments.

```bash
# Initialize git (if not already done)
cd velocity-boilerplate
git init

# Create .gitignore if not exists
echo "local.env
staging.env
prod.env
.env
__pycache__/
*.pyc
node_modules/
frontend/dist/
frontend/node_modules/
.venv/
*.log" > .gitignore

# Create main branch
git add .
git commit -m "Initial commit"
git branch -M main

# Create staging branch
git checkout -b staging
git push -u origin staging

# Create production branch
git checkout -b production
git push -u origin production

# Go back to main
git checkout main
```

**Create GitHub repository:**
1. Go to https://github.com/new
2. Create repository named `velocity-app` (or your preferred name)
3. Do NOT initialize with README (we already have code)
4. Click "Create repository"

**Push to GitHub:**
```bash
# Add GitHub remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/velocity-app.git

# Push all branches
git push -u origin main
git push -u origin staging
git push -u origin production
```

### Option B: Separate Repositories

Create two separate repositories:
- `velocity-staging` - for staging environment
- `velocity-production` - for production environment

```bash
# For staging repo
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/velocity-staging.git
git push -u origin main

# For production repo (in separate folder)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/velocity-production.git
git push -u origin main
```

---

## 2. Render.com Account Setup

1. **Sign up for Render.com**
   - Go to https://render.com
   - Sign up with your GitHub account (recommended for auto-deployment)
   - This allows Render to access your repositories

2. **Connect GitHub**
   - Go to Account Settings > Connected Accounts
   - Connect your GitHub account
   - Authorize Render to access your repositories

---

## 3. Deploy Staging Environment

### Step 1: Create PostgreSQL Database

1. **From Render Dashboard:**
   - Click "New +" → "PostgreSQL"
   - **Name:** `velocity-staging-db`
   - **Database:** `craftyourstartup`
   - **User:** `craftyourstartup`
   - **Region:** Choose closest to your users (e.g., Oregon)
   - **Plan:** Free (for testing) or Starter ($7/month)
   - Click "Create Database"

2. **Note the connection details** (you'll need these):
   - Internal Database URL (for backend connection)
   - External Database URL (for migrations from local)

### Step 2: Deploy Backend

1. **From Render Dashboard:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **Branch:** `staging` (if using Option A) or `main` (if using Option B)
   - **Name:** `velocity-staging-backend`
   - **Region:** Same as database
   - **Root Directory:** Leave empty (or use `velocity-boilerplate` if nested)
   - **Environment:** `Python 3`
   - **Build Command:**
     ```bash
     pip install poetry && poetry config virtualenvs.create false && poetry install --no-dev
     ```
   - **Start Command:**
     ```bash
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan:** Free or Starter ($7/month)

2. **Set Environment Variables** (see section below for complete list)

3. **Deploy!**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes first time)

### Step 3: Run Database Migrations

After backend is deployed, you need to run migrations:

**Option A: From your local machine**
```bash
# Set the DATABASE_URL from Render (External Database URL)
export DATABASE_URL="postgresql://user:pass@host:port/dbname"

# Run migrations
poetry run alembic upgrade head
```

**Option B: From Render Shell**
1. Go to your backend service in Render Dashboard
2. Click "Shell" tab
3. Run:
   ```bash
   alembic upgrade head
   ```

### Step 4: Deploy Frontend

1. **From Render Dashboard:**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - **Branch:** `staging`
   - **Name:** `velocity-staging-frontend`
   - **Root Directory:** `frontend` (or `velocity-boilerplate/frontend` if nested)
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory:** `dist`

2. **Set Environment Variables:**
   - `VITE_API_URL`: Your backend URL (e.g., `https://velocity-staging-backend.onrender.com`)

3. **Configure Redirects for SPA:**
   - Go to "Redirects/Rewrites" tab
   - Add rule: `/*` → `/index.html` (200 rewrite)

4. **Deploy!**

### Step 5: Update Backend Environment Variables

Now that you have your frontend URL, update backend environment variables:
- `domain`: `https://velocity-staging-frontend.onrender.com`
- `redirect_after_login`: `https://velocity-staging-frontend.onrender.com/dashboard`

### Step 6: Test Your Staging Environment

1. Visit your frontend URL
2. Try to sign up / log in
3. Test all major features
4. Check backend logs in Render Dashboard

---

## 4. Deploy Production Environment

Repeat the same steps as staging, but:
- Use `production` branch instead of `staging`
- Name services: `velocity-production-*` instead of `velocity-staging-*`
- Use **PRODUCTION** Stripe keys (live mode)
- Use **PRODUCTION** database plan (at least Starter, not Free)
- Update Google OAuth redirect URI in Google Cloud Console
- Consider using a custom domain

---

## 5. Environment Variables

### Required Backend Environment Variables

Add these in Render Dashboard → Your Backend Service → Environment:

```bash
# Environment
env=staging  # or 'production'

# Database (Auto-linked if using Render PostgreSQL)
db_username=<from Render DB>
db_password=<from Render DB>
db_host=<from Render DB>
db_port=<from Render DB>
db_database=craftyourstartup
db_sslmode=require

# Security (IMPORTANT: Generate secure random strings)
secret_key=<generate random 64 char string>
algorithm=HS256
access_token_expire_minutes=10080

# Application URLs
domain=https://your-frontend.onrender.com
redirect_after_login=https://your-frontend.onrender.com/dashboard

# Google OAuth
google_oauth2_client_id=<from Google Cloud Console>
google_oauth2_secret=<from Google Cloud Console>
google_oauth2_redirect_uri=https://your-backend.onrender.com/api/auth/google_callback

# Stripe (use TEST keys for staging, LIVE keys for production)
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_PREMIUM_SUB=price_...
STRIPE_PRICE_ENTERPRISE_SUB=price_...

# Email
mailchimp_api_key=<your key>
from_email=noreply@yourdomain.com
from_name=Your App Name
support_email=support@yourdomain.com

# AI APIs
openai_api_key=sk-proj-...
tavily_api_key=tvly-...
research_max_iterations=5
research_default_retriever=tavily
```

**To link Database automatically:**
1. Go to Backend Service → Environment
2. Add environment variable
3. Choose "Add from Database"
4. Select your database
5. Select the property (e.g., `Host`, `Password`, etc.)

### Required Frontend Environment Variables

```bash
VITE_API_URL=https://your-backend.onrender.com
```

---

## 6. Database Migrations

### Initial Setup
Run migrations after first deployment (see Step 3 above)

### Subsequent Migrations

**When you create new migrations locally:**

1. **Create migration:**
   ```bash
   poetry run alembic revision --autogenerate -m "description"
   ```

2. **Commit and push:**
   ```bash
   git add migrations/
   git commit -m "Add migration: description"
   git push origin staging  # or production
   ```

3. **Render auto-deploys, then run migration:**
   - Go to Backend Service → Shell
   - Run: `alembic upgrade head`

**OR automate with a build script** (see below)

---

## 7. Continuous Deployment

### Automatic Deployments

Render automatically deploys when you push to the connected branch:

```bash
# For staging
git checkout staging
git merge main  # or make changes directly
git push origin staging
# Render automatically deploys staging environment

# For production
git checkout production
git merge staging  # after testing staging
git push origin production
# Render automatically deploys production environment
```

### Deployment Workflow

1. **Develop on main/feature branches locally**
2. **Merge to staging branch** → Auto-deploy to staging
3. **Test on staging environment**
4. **Merge staging to production** → Auto-deploy to production

### Auto-run Migrations (Advanced)

Create a build script:

**File: `render-build.sh`**
```bash
#!/bin/bash
set -e

# Install dependencies
pip install poetry
poetry config virtualenvs.create false
poetry install --no-dev

# Run migrations
poetry run alembic upgrade head
```

Make it executable:
```bash
chmod +x render-build.sh
```

Update Render Build Command:
```bash
./render-build.sh
```

---

## 8. Troubleshooting

### Backend won't start
- Check logs in Render Dashboard
- Verify all environment variables are set
- Check database connection settings

### Frontend shows 404 on refresh
- Make sure you added the redirect rule: `/*` → `/index.html`

### Database connection fails
- Ensure `db_sslmode=require` is set
- Verify database is in same region as backend
- Check database is not paused (Free tier pauses after inactivity)

### Migrations fail
- Check database credentials
- Ensure Alembic is installed: `poetry add alembic`
- Run locally first to test: `poetry run alembic upgrade head`

### OAuth doesn't work
- Update redirect URI in Google Cloud Console
- Match exactly: `https://your-backend.onrender.com/api/auth/google_callback`
- Check `domain` and `redirect_after_login` environment variables

### Stripe webhooks not working
- Update webhook endpoint in Stripe Dashboard
- Use URL: `https://your-backend.onrender.com/api/payments/webhook`
- Get new webhook secret and update environment variable

---

## Quick Reference Commands

```bash
# Generate secure secret key
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Test backend connection
curl https://your-backend.onrender.com/api/health

# View logs
# Go to Render Dashboard → Service → Logs

# Run shell on backend
# Go to Render Dashboard → Backend Service → Shell

# Manual deploy
# Go to Render Dashboard → Service → Manual Deploy → Deploy latest commit
```

---

## Cost Estimate

**Staging Environment (Minimal):**
- Database: Free (500 MB, expires after 90 days) or Starter $7/mo
- Backend: Free or Starter $7/mo
- Frontend: Free
- **Total: $0-14/month**

**Production Environment (Recommended):**
- Database: Starter $7/mo (1 GB) or Standard $20/mo (10 GB)
- Backend: Starter $7/mo or Standard $15/mo
- Frontend: Free or custom domain $1/mo
- **Total: $14-36/month**

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Create Render account
3. ✅ Deploy staging environment
4. ✅ Test thoroughly on staging
5. ✅ Deploy production environment
6. ✅ Set up custom domain (optional)
7. ✅ Set up monitoring and alerts
8. ✅ Configure Stripe webhooks for both environments

Good luck with your deployment! 🚀
