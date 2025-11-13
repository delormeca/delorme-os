# Complete Vercel Deployment Guide
## Both Backend + Frontend on Vercel

Perfect choice! This guide will help you deploy BOTH your FastAPI backend and React frontend to Vercel (ditching Render completely).

---

## Prerequisites

1. ✅ GitHub repo with your code on `main` branch
2. ✅ Supabase account (we'll set this up first)
3. ✅ Vercel account (free to start)

---

## Step 1: Setup Supabase (10 minutes)

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Fill in:
   - **Name**: `delorme-os-prod`
   - **Database Password**: Generate strong password (SAVE IT!)
   - **Region**: Choose closest to you (e.g., `us-east-1`)
   - **Plan**: **Free** (start here, upgrade later)
4. Click **Create new project**
5. Wait ~2 minutes for provisioning

### 1.2 Get Database Connection String

1. Go to **Project Settings** (⚙️ icon) → **Database**
2. Scroll to **Connection Pooling** section
3. Copy the **Connection string**
4. It looks like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
5. **Modify it** for FastAPI:
   ```
   postgresql+asyncpg://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   - Change `postgresql://` → `postgresql+asyncpg://`
   - Add `?pgbouncer=true` at the end

### 1.3 Get Supabase API Keys

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx` (for frontend)
   - **service_role** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx` (for backend)

### 1.4 Create Storage Bucket

1. In Supabase dashboard, click **Storage** in left sidebar
2. Click **New bucket**
3. Fill in:
   - **Name**: `client-data`
   - **Public bucket**: ❌ No (keep private)
   - **File size limit**: 50 MB
4. Click **Create bucket**

---

## Step 2: Deploy Backend to Vercel (10 minutes)

### 2.1 Import Backend Project

1. Go to https://vercel.com/new
2. Click **Import Project**
3. Select your GitHub repository
4. **Important Configuration:**
   - **Project Name**: `delorme-os-backend` (or your choice)
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty

### 2.2 Add Backend Environment Variables

Click **Environment Variables** and add these:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase Storage
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx.xxxxx

# Security (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=your-generated-secret-key-at-least-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENV=production

# CORS - IMPORTANT: Update after frontend is deployed!
CORS_ORIGINS=http://localhost:5173

# Stripe (optional - add if you use payments)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Email (optional - add if you use email)
MAILCHIMP_API_KEY=your_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Delorme OS

# Google OAuth (optional)
GOOGLE_OAUTH2_CLIENT_ID=your_client_id
GOOGLE_OAUTH2_SECRET=your_secret
```

**For each variable:**
- Check **Production** ✅
- Check **Preview** ✅
- Check **Development** ✅

### 2.3 Deploy Backend

1. Click **Deploy**
2. Wait 3-5 minutes for first deployment
3. You'll get a URL like: `https://delorme-os-backend.vercel.app`
4. **SAVE THIS URL** - you'll need it for the frontend!

### 2.4 Test Backend

Visit: `https://delorme-os-backend.vercel.app/docs`

You should see the FastAPI Swagger documentation.

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Import Frontend Project (Separate Deployment)

1. Go to https://vercel.com/new again
2. Select **SAME** GitHub repository
3. **Important Configuration:**
   - **Project Name**: `delorme-os-frontend` (or your choice)
   - **Framework Preset**: Vite ✅ (auto-detected)
   - **Root Directory**: `frontend/` ⚠️ **CRITICAL!**
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)

### 3.2 Add Frontend Environment Variables

Click **Environment Variables** and add:

```bash
# Backend API URL (use the URL from Step 2.3)
VITE_API_URL=https://delorme-os-backend.vercel.app

# Supabase Public Keys (for frontend features if needed)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx.xxxxx
```

Check all 3 boxes (Production, Preview, Development)

### 3.3 Deploy Frontend

1. Click **Deploy**
2. Wait 2-3 minutes
3. You'll get a URL like: `https://delorme-os-frontend.vercel.app`
4. Visit it to see your app!

---

## Step 4: Update Backend CORS (CRITICAL!)

Now that you have your frontend URL, update backend CORS:

1. Go to **Vercel Dashboard** → Your Backend Project
2. Click **Settings** → **Environment Variables**
3. Find `CORS_ORIGINS` variable
4. Click **Edit**
5. Update value to:
   ```
   https://delorme-os-frontend.vercel.app,https://delorme-os-frontend-*.vercel.app,http://localhost:5173
   ```
6. Click **Save**
7. Go to **Deployments** tab
8. Click **⋯** (three dots) → **Redeploy**
9. Wait 2-3 minutes

---

## Step 5: Migrate Database from Render (If Applicable)

If you have existing data on Render:

```bash
# 1. Export from Render
pg_dump "your-render-database-url" > render_backup.sql

# 2. Import to Supabase (use DIRECT connection, not pooling)
# Get direct connection from Supabase: Project Settings → Database → Connection String (Direct)
psql "postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" < render_backup.sql

# 3. Verify
psql "postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -c "\dt"
```

---

## Step 6: Test Everything

### 6.1 Test Backend API
- Visit: `https://delorme-os-backend.vercel.app/docs`
- ✅ Swagger docs load
- ✅ Try a health check endpoint

### 6.2 Test Frontend
- Visit: `https://delorme-os-frontend.vercel.app`
- ✅ App loads
- ✅ Try to login
- ✅ Check browser console (F12) for errors
- ✅ Verify API calls go to backend URL

### 6.3 Check CORS
Open browser console and verify no CORS errors:
- ❌ Bad: `Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy`
- ✅ Good: API calls succeed with 200 status codes

---

## Pricing Summary

| Service | Plan | Cost | When to Upgrade |
|---------|------|------|----------------|
| **Supabase** | Free | $0 | At 500MB database |
| **Supabase** | Pro | $25/mo | When you hit limits |
| **Vercel Backend** | Hobby | $0 | At 100GB bandwidth |
| **Vercel Backend** | Pro | $20/mo | When scaling |
| **Vercel Frontend** | Hobby | $0 | At 100GB bandwidth |
| **Vercel Frontend** | Pro | $20/mo | When scaling |

**Initial Total:** $0/month (all free tiers)
**Production Total:** $65/month (Supabase Pro + 2× Vercel Pro)

**Alternative:** Combine frontend + backend into one Vercel project to save $20/month (only one Vercel Pro plan needed)

---

## Advanced: Combine Backend + Frontend (Optional)

If you want to save money by having one Vercel project:

### Option A: Monorepo Deployment

Create a single Vercel project that builds both:

1. Update `vercel.json`:
```json
{
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "main.py"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ]
}
```

**Pros:** Single deployment, single domain, $20/month savings
**Cons:** More complex, harder to scale separately

**Recommendation:** Start with 2 separate projects (easier), combine later if needed.

---

## Troubleshooting

### Backend Issues

**Problem:** Build fails with Playwright error
**Fix:** Vercel has Playwright already installed. If it fails, remove `playwright install` from `build.sh`

**Problem:** Database connection timeout
**Fix:**
1. Verify DATABASE_URL is correct (with `pgbouncer=true`)
2. Check Supabase isn't paused (free tier pauses after 7 days inactivity)
3. Use connection pooling URL (port 6543), not direct (port 5432)

**Problem:** Import errors
**Fix:** Make sure `requirements.txt` is up to date. Run locally: `poetry export -f requirements.txt --output requirements.txt --without-hashes`

### Frontend Issues

**Problem:** CORS errors
**Fix:** Update backend `CORS_ORIGINS` with your exact frontend URL

**Problem:** API calls fail with 404
**Fix:** Verify `VITE_API_URL` is correct and includes `https://`

**Problem:** Build fails
**Fix:** Check Root Directory is set to `frontend/` in Vercel settings

---

## Custom Domains (Optional)

### For Backend API
1. Go to Vercel → Backend Project → Settings → Domains
2. Add: `api.yourdomain.com`
3. Add DNS records (Vercel will show you which ones)
4. Update frontend `VITE_API_URL=https://api.yourdomain.com`

### For Frontend
1. Go to Vercel → Frontend Project → Settings → Domains
2. Add: `app.yourdomain.com` or `yourdomain.com`
3. Add DNS records
4. Update backend CORS to include your custom domain

---

## Environment Variables Reference

### Backend (Complete List)

```bash
# Required
DATABASE_URL=postgresql+asyncpg://...?pgbouncer=true
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SECRET_KEY=your-secret-32-chars-min
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENV=production
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-frontend-*.vercel.app,http://localhost:5173

# Optional (Payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional (Email)
MAILCHIMP_API_KEY=...
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Delorme OS

# Optional (OAuth)
GOOGLE_OAUTH2_CLIENT_ID=...
GOOGLE_OAUTH2_SECRET=...
GOOGLE_OAUTH2_REDIRECT_URI=https://your-frontend.vercel.app/api/auth/google_callback
```

### Frontend (Complete List)

```bash
# Required
VITE_API_URL=https://your-backend.vercel.app

# Optional (if using Supabase features in frontend)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Quick Deployment Checklist

**Supabase Setup:**
- ✅ Created Supabase project
- ✅ Got DATABASE_URL (with `postgresql+asyncpg` and `?pgbouncer=true`)
- ✅ Got SUPABASE_URL and SUPABASE_SERVICE_KEY
- ✅ Created `client-data` storage bucket

**Backend Deployment:**
- ✅ Imported to Vercel (root directory = `./`)
- ✅ Added all environment variables
- ✅ Deployed successfully
- ✅ Tested at `/docs` endpoint
- ✅ Saved backend URL

**Frontend Deployment:**
- ✅ Imported to Vercel (root directory = `frontend/`)
- ✅ Added VITE_API_URL pointing to backend
- ✅ Deployed successfully
- ✅ Saved frontend URL

**Final Configuration:**
- ✅ Updated backend CORS_ORIGINS with frontend URL
- ✅ Redeployed backend
- ✅ Tested full login flow
- ✅ Verified no CORS errors

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **FastAPI on Vercel:** https://vercel.com/guides/deploying-fastapi-with-vercel

**You're all set! 🚀**
