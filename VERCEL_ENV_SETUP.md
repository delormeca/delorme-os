# Vercel Environment Variables Setup

## Frontend Environment Variables (Vercel)

After importing your project to Vercel, add these environment variables:

---

## Method 1: During Initial Import (Recommended)

When you import your GitHub repo to Vercel, you'll see **Environment Variables** section:

### Add This Variable:

```bash
VITE_API_URL=https://your-backend.onrender.com
```

**Replace** `your-backend.onrender.com` with your actual Render backend URL.

---

## Method 2: After Import (If You Skipped It)

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** tab
3. Click **Environment Variables** in left sidebar
4. Add the variable below

---

## Environment Variable to Add

### Production, Preview, and Development

| Name | Value | Environments |
|------|-------|-------------|
| `VITE_API_URL` | `https://your-backend.onrender.com` | ✅ Production<br>✅ Preview<br>✅ Development |

**Important:** Check ALL three boxes (Production, Preview, Development) so it works everywhere.

---

## Complete Setup Steps

### Step 1: Get Your Backend URL

Find your Render backend URL:
- Go to Render.com Dashboard
- Click on your backend service
- Copy the URL (e.g., `https://delorme-os-backend.onrender.com`)

### Step 2: Add to Vercel

1. In Vercel project → **Settings** → **Environment Variables**
2. Click **Add New**
3. Fill in:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend.onrender.com` (your actual URL)
   - **Environments**: Check all 3 boxes
4. Click **Save**

### Step 3: Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes

---

## Project Configuration

### Root Directory (CRITICAL!)

When importing, set these correctly:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite ✅ (auto-detected) |
| **Root Directory** | `frontend/` ⚠️ **CHANGE THIS!** |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `dist` (default) |
| **Install Command** | `npm install` (default) |

**⚠️ MOST IMPORTANT**: Set **Root Directory** to `frontend/` - don't leave it as `./`

---

## Example Vercel Configuration

### If Using Custom Domain

```bash
# Production
VITE_API_URL=https://api.yourdomain.com

# Or keep using Render
VITE_API_URL=https://your-backend.onrender.com
```

### If Using Vercel Subdomain (Default)

```bash
# Your Vercel URL will be like:
# https://delorme-os.vercel.app

VITE_API_URL=https://your-backend.onrender.com
```

---

## Vercel Hosting Options

### Free (Hobby) Plan - START HERE

**Price:** $0/month

**Limits:**
- 100 GB bandwidth/month
- 6,000 build minutes/month
- Unlimited previews
- Automatic HTTPS
- Global CDN

**Good for:**
- ✅ Testing and development
- ✅ First 5-10 clients
- ✅ Low traffic apps

**Start with this**, upgrade later when needed.

---

### Pro Plan - UPGRADE WHEN SCALING

**Price:** $20/month per user

**Limits:**
- 1 TB bandwidth/month
- 24,000 build minutes/month
- Password protection
- Team collaboration
- Analytics
- Priority support

**Upgrade when:**
- You have 10+ paying clients
- You need team members
- You want password-protected previews
- You need analytics

---

## How to Verify Setup

### Step 1: Visit Your Vercel URL

After deployment completes:
```
https://your-project.vercel.app
```

### Step 2: Check API Connection

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to login or load dashboard
4. Check API calls - should go to your Render backend

### Step 3: Test Full Flow

- ✅ Login works
- ✅ Dashboard loads
- ✅ Can create a client
- ✅ API calls succeed (check Network tab)

---

## Common Issues & Fixes

### Issue: "CORS Error" in Console

**Problem:** Backend not allowing Vercel URL

**Fix:** Update backend CORS on Render:
```bash
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app,http://localhost:5173
```

### Issue: "Failed to fetch" Errors

**Problem:** Wrong `VITE_API_URL`

**Fix:**
1. Check backend URL is correct
2. Redeploy frontend after changing env var

### Issue: Build Fails

**Problem:** Wrong root directory

**Fix:**
1. Settings → General → Root Directory
2. Change to `frontend/`
3. Redeploy

---

## Preview Deployments (Bonus Feature!)

Vercel automatically creates preview deployments for every GitHub PR:

**Example:**
- Main branch → `https://delorme-os.vercel.app` (production)
- PR #5 → `https://delorme-os-git-feature-xyz.vercel.app` (preview)

Preview URLs work automatically because we set `VITE_API_URL` for all environments!

---

## Custom Domain Setup (Optional)

### If You Have a Domain

1. Go to Vercel → **Settings** → **Domains**
2. Add your domain: `app.yourdomain.com`
3. Add DNS records (Vercel shows you which ones)
4. Wait for DNS propagation (5-60 minutes)

### Update Backend CORS

After adding custom domain, update Render backend:
```bash
CORS_ORIGINS=https://app.yourdomain.com,https://your-app.vercel.app,https://your-app-*.vercel.app,http://localhost:5173
```

---

## Summary Checklist

Before deploying:
- ✅ Root directory set to `frontend/`
- ✅ Added `VITE_API_URL` environment variable
- ✅ Checked all 3 environment boxes (Production, Preview, Development)
- ✅ Backend CORS includes Vercel URL
- ✅ Started with Free (Hobby) plan

After deploying:
- ✅ Visit Vercel URL
- ✅ Test login
- ✅ Check API calls in Network tab
- ✅ Verify no CORS errors
- ✅ Test full user flow

---

## Next Steps

1. **Test thoroughly** on Free plan
2. **Get 5-10 clients** before upgrading
3. **Upgrade to Pro** ($20/month) when you need:
   - More bandwidth
   - Team access
   - Analytics
4. **Add custom domain** when you're ready to brand your app

---

## Need Help?

**Vercel Dashboard:** https://vercel.com/dashboard
**Vercel Docs:** https://vercel.com/docs
**Support:** https://vercel.com/support

**Backend on Render:** Keep your FastAPI backend on Render.com - it's perfect for Python APIs.
**Frontend on Vercel:** Much faster builds and better CDN than Render for React apps.
