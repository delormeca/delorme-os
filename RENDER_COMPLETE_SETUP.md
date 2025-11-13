# Complete Render.com Deployment Guide
## Backend + Frontend on Render.com with Neon Database

Perfect! Render.com is the best choice for your FastAPI + Crawl4AI backend. This guide will set up both your backend and frontend on Render.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Render.com (All-in-One)                    │
├─────────────────────────────────────────────┤
│  Backend (Web Service)                      │
│  - FastAPI + Crawl4AI                       │
│  - Python 3.11                              │
│  - $7/month (Starter)                       │
├─────────────────────────────────────────────┤
│  Frontend (Static Site)                     │
│  - React + Vite                             │
│  - Global CDN                               │
│  - $0/month (Free)                          │
└─────────────────────────────────────────────┘
         ↓ connects to
┌─────────────────────────────────────────────┐
│  Neon Database (PostgreSQL)                 │
│  - $0/month (Free tier)                     │
│  - Auto-scaling                             │
└─────────────────────────────────────────────┘
```

**Total Cost:** $7/month (Render backend) + $0 (Render frontend) + $0 (Neon DB) = **$7/month**

---

## Prerequisites

1. ✅ GitHub account with your code
2. ✅ Render.com account (free to sign up)
3. ✅ Neon database URL (you already have this)

---

## Step 1: Deploy Backend to Render (10 minutes)

### 1.1 Create Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub account (if not already)
4. Select repository: `delormeca/delorme-os`
5. Click **Connect**

### 1.2 Configure Backend Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `delorme-os-backend` (or your choice) |
| **Region** | Oregon (US West) - closest to Neon |
| **Branch** | `main` |
| **Root Directory** | Leave empty (uses root) |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt && playwright install chromium` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Starter ($7/month) |

### 1.3 Add Environment Variables

Click **Advanced** → **Add Environment Variable** and add these:

```bash
# Database (your Neon database)
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_jceSZqfNx3C0@ep-morning-smoke-adg9491a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

```bash
# Security (generate new secret key)
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_urlsafe(32))">
```

```bash
ALGORITHM=HS256
```

```bash
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

```bash
ENV=production
```

```bash
# CORS - Update after frontend deploys!
CORS_ORIGINS=http://localhost:5173
```

```bash
# Python Environment
PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8
```

**Optional - Add if you use Stripe:**
```bash
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

**Optional - Add if you use Email:**
```bash
MAILCHIMP_API_KEY=your_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Delorme OS
```

**Optional - Add if you use Google OAuth:**
```bash
GOOGLE_OAUTH2_CLIENT_ID=your_client_id
GOOGLE_OAUTH2_SECRET=your_secret
GOOGLE_OAUTH2_REDIRECT_URI=https://your-frontend.onrender.com/api/auth/google_callback
```

### 1.4 Deploy Backend

1. Click **Create Web Service**
2. Wait 5-8 minutes for first deployment
3. **SAVE YOUR BACKEND URL** - looks like: `https://delorme-os-backend.onrender.com`

### 1.5 Test Backend

Visit: `https://delorme-os-backend.onrender.com/docs`

You should see the FastAPI Swagger documentation! ✅

---

## Step 2: Deploy Frontend to Render (5 minutes)

### 2.1 Create Static Site

1. Go to https://dashboard.render.com
2. Click **New +** → **Static Site**
3. Select repository: `delormeca/delorme-os` (same repo)
4. Click **Connect**

### 2.2 Configure Frontend Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `delorme-os-frontend` (or your choice) |
| **Branch** | `main` |
| **Root Directory** | `frontend` ⚠️ **IMPORTANT!** |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |

### 2.3 Add Frontend Environment Variable

Click **Advanced** → **Add Environment Variable**:

```bash
# Backend API URL (use URL from Step 1.4)
VITE_API_URL=https://delorme-os-backend.onrender.com
```

Replace with your actual backend URL!

### 2.4 Deploy Frontend

1. Click **Create Static Site**
2. Wait 3-5 minutes for deployment
3. **SAVE YOUR FRONTEND URL** - looks like: `https://delorme-os-frontend.onrender.com`

---

## Step 3: Update Backend CORS (CRITICAL!)

Now that you have your frontend URL, update backend CORS:

1. Go to Render Dashboard → **delorme-os-backend**
2. Click **Environment** in left sidebar
3. Find `CORS_ORIGINS` variable
4. Click **Edit** (pencil icon)
5. Update value to:
   ```
   https://delorme-os-frontend.onrender.com,http://localhost:5173
   ```
6. Click **Save Changes**
7. Backend will automatically redeploy (2-3 minutes)

---

## Step 4: Test Everything

### 4.1 Test Backend
- Visit: `https://delorme-os-backend.onrender.com/docs`
- ✅ Swagger docs load
- ✅ Database connection works

### 4.2 Test Frontend
- Visit: `https://delorme-os-frontend.onrender.com`
- ✅ App loads
- ✅ Try to login
- ✅ Open browser console (F12) - no CORS errors
- ✅ API calls succeed

### 4.3 Test Full Flow
- ✅ Create a client
- ✅ Add a sitemap
- ✅ Run extraction
- ✅ View extracted pages

---

## Pricing Breakdown

| Service | Plan | Cost | What You Get |
|---------|------|------|--------------|
| **Render Backend** | Starter | $7/mo | 512 MB RAM, always on |
| **Render Frontend** | Free | $0 | Global CDN, auto-deploy |
| **Neon Database** | Free | $0 | 512 MB storage |

**Total:** $7/month

### When to Upgrade

**Backend to Standard ($25/mo):**
- When you need more RAM (2 GB vs 512 MB)
- When you have 10+ clients with frequent crawls

**Neon to Pro ($19/mo):**
- When database hits 512 MB limit
- When you need faster performance
- Around 10-15 clients

**Estimated cost at 50 clients:** ~$50/month

---

## Environment Variables Reference

### Backend (Complete List)

**Required:**
```bash
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_jceSZqfNx3C0@ep-morning-smoke-adg9491a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
SECRET_KEY=<generate-with-python-command>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENV=production
CORS_ORIGINS=https://delorme-os-frontend.onrender.com,http://localhost:5173
PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8
```

**Optional (Stripe):**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Optional (Email):**
```bash
MAILCHIMP_API_KEY=...
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Delorme OS
```

**Optional (Google OAuth):**
```bash
GOOGLE_OAUTH2_CLIENT_ID=...
GOOGLE_OAUTH2_SECRET=...
GOOGLE_OAUTH2_REDIRECT_URI=https://delorme-os-frontend.onrender.com/api/auth/google_callback
```

### Frontend (Simple!)

```bash
VITE_API_URL=https://delorme-os-backend.onrender.com
```

---

## Custom Domains (Optional)

### Backend API Domain

1. Go to Render → **delorme-os-backend** → **Settings**
2. Scroll to **Custom Domains**
3. Click **Add Custom Domain**
4. Enter: `api.yourdomain.com`
5. Add DNS records (Render shows you which ones)
6. Update frontend `VITE_API_URL=https://api.yourdomain.com`

### Frontend Domain

1. Go to Render → **delorme-os-frontend** → **Settings**
2. Scroll to **Custom Domains**
3. Click **Add Custom Domain**
4. Enter: `app.yourdomain.com` or just `yourdomain.com`
5. Add DNS records
6. Update backend CORS to include your custom domain

---

## Troubleshooting

### Backend Issues

**Problem:** Build fails with "playwright install" error
**Fix:** This is normal on first deploy. It will succeed on retry. Render has to download Chromium (~170 MB).

**Problem:** Database connection timeout
**Fix:**
1. Check DATABASE_URL starts with `postgresql+asyncpg://`
2. Has `?sslmode=require` at the end
3. Uses Neon pooler URL (pooler.c-2.us-east-1...)

**Problem:** Service keeps sleeping
**Fix:** Render Free tier sleeps after 15 min inactivity. Upgrade to Starter ($7/mo) for "always on".

### Frontend Issues

**Problem:** CORS errors in browser console
**Fix:**
1. Check backend `CORS_ORIGINS` includes exact frontend URL
2. No trailing slash in URL
3. Backend has redeployed after CORS change

**Problem:** API calls return 404
**Fix:** Check `VITE_API_URL` in frontend environment variables is correct

**Problem:** Build fails
**Fix:**
1. Verify Root Directory = `frontend`
2. Verify Publish Directory = `frontend/dist`
3. Check `npm run build` works locally

---

## Auto-Deploy from GitHub

Both services auto-deploy when you push to `main`:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

- Backend redeploys automatically (3-5 minutes)
- Frontend redeploys automatically (2-3 minutes)

---

## Monitoring & Logs

### View Backend Logs
1. Render Dashboard → **delorme-os-backend**
2. Click **Logs** tab
3. See real-time logs

### View Frontend Build Logs
1. Render Dashboard → **delorme-os-frontend**
2. Click **Events** tab
3. See build history

---

## Database Management

### Connect to Neon Database

```bash
# Using psql
psql "postgresql://neondb_owner:npg_jceSZqfNx3C0@ep-morning-smoke-adg9491a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Run migrations
psql "<DATABASE_URL>" < backup.sql

# Check tables
psql "<DATABASE_URL>" -c "\dt"
```

### Backup Database

```bash
# Export
pg_dump "<DATABASE_URL>" > backup.sql

# Import
psql "<DATABASE_URL>" < backup.sql
```

---

## Performance Tips

### Backend Performance

1. **Use connection pooling** - Already enabled with Neon pooler URL ✅
2. **Enable caching** - Add Redis if needed (Render Redis $10/mo)
3. **Optimize queries** - Use database indexes
4. **Monitor RAM usage** - Upgrade if > 80%

### Frontend Performance

1. **Static site CDN** - Already enabled ✅
2. **Code splitting** - Already done by Vite ✅
3. **Image optimization** - Use WebP format
4. **Lazy loading** - For large lists

---

## Quick Deployment Checklist

**Backend:**
- ✅ Created Web Service on Render
- ✅ Set build command: `pip install -r requirements.txt && playwright install chromium`
- ✅ Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- ✅ Added all environment variables
- ✅ Selected Starter ($7/mo) plan
- ✅ Deployed successfully
- ✅ Tested `/docs` endpoint
- ✅ Saved backend URL

**Frontend:**
- ✅ Created Static Site on Render
- ✅ Set root directory: `frontend`
- ✅ Set publish directory: `frontend/dist`
- ✅ Added `VITE_API_URL` environment variable
- ✅ Deployed successfully
- ✅ Saved frontend URL

**Final Steps:**
- ✅ Updated backend CORS with frontend URL
- ✅ Backend redeployed
- ✅ Tested full login flow
- ✅ No CORS errors in console

---

## Support Resources

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Neon Docs:** https://neon.tech/docs

---

## Summary

**Your URLs:**
- Backend: `https://delorme-os-backend.onrender.com`
- Frontend: `https://delorme-os-frontend.onrender.com`
- Database: Neon (serverless PostgreSQL)

**Total Monthly Cost:** $7

**Next Steps:**
1. Test thoroughly with all 50 clients
2. Monitor performance
3. Upgrade when you hit resource limits (probably around 15-20 clients)

**You're all set on Render.com! 🚀**
