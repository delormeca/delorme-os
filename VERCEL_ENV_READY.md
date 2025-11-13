# Ready-to-Copy Vercel Environment Variables
## Using Neon Database

---

## Backend Environment Variables (Vercel)
### Copy-paste these to your **backend** Vercel project

```bash
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_jceSZqfNx3C0@ep-morning-smoke-adg9491a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

```bash
SECRET_KEY=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING_USE_COMMAND_BELOW
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
CORS_ORIGINS=http://localhost:5173
```

### Optional (Add if you use Stripe):

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
```

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Optional (Add if you use Email):

```bash
MAILCHIMP_API_KEY=your_mailchimp_key
```

```bash
FROM_EMAIL=noreply@yourdomain.com
```

```bash
FROM_NAME=Delorme OS
```

### Optional (Add if you use Google OAuth):

```bash
GOOGLE_OAUTH2_CLIENT_ID=your_client_id
```

```bash
GOOGLE_OAUTH2_SECRET=your_secret
```

```bash
GOOGLE_OAUTH2_REDIRECT_URI=https://your-frontend.vercel.app/api/auth/google_callback
```

---

## Frontend Environment Variables (Vercel)
### Copy-paste these to your **frontend** Vercel project

```bash
VITE_API_URL=https://your-backend.vercel.app
```

**⚠️ IMPORTANT:** Replace `your-backend` with your actual backend Vercel URL after backend is deployed!

---

## Step-by-Step Instructions

### Step 1: Generate SECRET_KEY

Run this command on your computer:

**Windows PowerShell:**
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Mac/Linux:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output (e.g., `a7fK3mN9pQ2rS5tU8vW1xY4zA6bC9dE2fG5hJ8kL1mN4`)

Replace `CHANGE_THIS_TO_RANDOM_32_CHAR_STRING_USE_COMMAND_BELOW` with this value.

---

### Step 2: Deploy Backend

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. **Project Name**: `delorme-os-backend` (or your choice)
4. **Root Directory**: `./` (leave as root - DON'T change)
5. Click **Environment Variables**
6. Add each variable above **ONE BY ONE**:
   - Name: `DATABASE_URL`
   - Value: `postgresql+asyncpg://neondb_owner:npg_jceSZqfNx3C0@ep-morning-smoke-adg9491a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - Check: ✅ Production ✅ Preview ✅ Development
   - Click **Add**

   Repeat for all variables above.

7. Click **Deploy**
8. Wait 3-5 minutes
9. **COPY YOUR BACKEND URL** (e.g., `https://delorme-os-backend.vercel.app`)

---

### Step 3: Update Backend CORS

After backend deploys, you need to update CORS to allow your frontend URL:

1. Go to Vercel Dashboard → Your Backend Project
2. **Settings** → **Environment Variables**
3. Find `CORS_ORIGINS`
4. Click **Edit**
5. Update to (replace with your actual frontend URL):
   ```
   https://delorme-os-frontend.vercel.app,https://delorme-os-frontend-*.vercel.app,http://localhost:5173
   ```
6. **Save**
7. Go to **Deployments** tab
8. Click **⋯** → **Redeploy**

---

### Step 4: Deploy Frontend

1. Go to https://vercel.com/new **AGAIN**
2. Select **SAME** GitHub repo
3. **Project Name**: `delorme-os-frontend` (or your choice)
4. **Framework**: Vite ✅ (auto-detected)
5. **Root Directory**: `frontend/` ⚠️ **MUST CHANGE THIS!**
6. Click **Environment Variables**
7. Add:
   - Name: `VITE_API_URL`
   - Value: `https://YOUR-BACKEND-URL.vercel.app` (from Step 2)
   - Check: ✅ Production ✅ Preview ✅ Development
8. Click **Deploy**
9. Wait 2-3 minutes

---

### Step 5: Test

1. Visit your frontend URL: `https://delorme-os-frontend.vercel.app`
2. Try to login
3. Open browser console (F12) → Network tab
4. Check API calls go to your backend
5. ✅ No CORS errors
6. ✅ Login works

---

## Quick Copy Template

### For Backend (All-in-One):

Copy this entire block and paste into a text editor, then add to Vercel one by one:

```
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_jceSZqfNx3C0@ep-morning-smoke-adg9491a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
SECRET_KEY=GENERATE_WITH_PYTHON_COMMAND_ABOVE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENV=production
CORS_ORIGINS=http://localhost:5173
```

---

## Troubleshooting

### Build fails with "playwright install" error?

Vercel has Playwright pre-installed. If build fails:

1. Go to backend project → **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. **Build Command**: Leave empty
4. **Install Command**: `pip install -r requirements.txt`

### Database connection timeout?

Your Neon database might be in sleep mode (free tier). First request will wake it up (takes ~5 seconds).

To prevent sleep:
1. Upgrade to Neon Pro (starts at $19/month)
2. Or accept 5-second delay on first request after inactivity

### CORS errors?

Make sure you updated CORS_ORIGINS with your exact frontend URL (no trailing slash):
```
https://delorme-os-frontend.vercel.app,https://delorme-os-frontend-*.vercel.app,http://localhost:5173
```

---

## Files Created for Deployment

I've created these files in your repo:

1. ✅ `requirements.txt` - Python dependencies for Vercel
2. ✅ `vercel.json` - Vercel configuration for backend
3. ✅ `build.sh` - Build script for Playwright setup
4. ✅ `.vercelignore` - Files to exclude from deployment

**Commit these to GitHub before deploying!**

```bash
git add requirements.txt vercel.json build.sh .vercelignore
git commit -m "Add Vercel deployment configuration"
git push origin main
```

---

## Cost Summary (Neon + Vercel)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Neon Database** | Free | $0 | 512 MB storage, auto-suspend |
| **Neon Database** | Pro | $19/mo | 10 GB, no auto-suspend |
| **Vercel Backend** | Hobby | $0 | 100 GB bandwidth/mo |
| **Vercel Backend** | Pro | $20/mo | 1 TB bandwidth/mo |
| **Vercel Frontend** | Hobby | $0 | 100 GB bandwidth/mo |
| **Vercel Frontend** | Pro | $20/mo | 1 TB bandwidth/mo |

**Start with:** $0/month (all free tiers)
**Scale to:** $59/month (Neon Pro + 2× Vercel Pro when you have 10+ clients)

---

## Ready to Deploy!

1. ✅ Commit new files to GitHub
2. ✅ Generate SECRET_KEY
3. ✅ Deploy backend with env vars above
4. ✅ Deploy frontend with VITE_API_URL
5. ✅ Update backend CORS with frontend URL
6. ✅ Test!

Your backend will be at: `https://YOUR-NAME-backend.vercel.app`
Your frontend will be at: `https://YOUR-NAME-frontend.vercel.app`

🚀 Let's go!
