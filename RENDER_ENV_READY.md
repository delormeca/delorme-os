# Ready-to-Copy Render Environment Variables
## Backend + Frontend on Render.com with Neon Database

---

## Backend Environment Variables (Render Web Service)

### Copy these ONE BY ONE into Render:

**1. DATABASE_URL**
```
postgresql+asyncpg://neondb_owner:npg_jceSZqfNx3C0@ep-morning-smoke-adg9491a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**2. SECRET_KEY** (Generate first - see below!)
```
GENERATE_WITH_PYTHON_COMMAND_BELOW
```

**3. ALGORITHM**
```
HS256
```

**4. ACCESS_TOKEN_EXPIRE_MINUTES**
```
30
```

**5. ENV**
```
production
```

**6. CORS_ORIGINS** (Update after frontend deploys!)
```
http://localhost:5173
```

**7. PYTHONUNBUFFERED**
```
1
```

**8. PYTHONIOENCODING**
```
utf-8
```

---

## Frontend Environment Variable (Render Static Site)

**VITE_API_URL** (Replace with your actual backend URL!)
```
https://delorme-os-backend.onrender.com
```

---

## Step-by-Step: Backend Deployment

### Step 1: Generate SECRET_KEY

**On Windows PowerShell:**
```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**On Mac/Linux:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Example output: `a7fK3mN9pQ2rS5tU8vW1xY4zA6bC9dE2fG5hJ8kL1mN4`

**SAVE THIS!** You'll need it in Step 3.

---

### Step 2: Create Backend Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect GitHub (if not already)
4. Select repository: `delormeca/delorme-os`
5. Click **Connect**

---

### Step 3: Configure Backend

| Field | Value |
|-------|-------|
| **Name** | `delorme-os-backend` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | *(leave empty)* |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt && playwright install chromium` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Starter ($7/month) |

---

### Step 4: Add Backend Environment Variables

Click **Advanced** → Scroll to **Environment Variables**

Add each variable below by clicking **Add Environment Variable**:

**Variable 1:**
- Key: `DATABASE_URL`
- Value: `postgresql+asyncpg://neondb_owner:npg_jceSZqfNx3C0@ep-morning-smoke-adg9491a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`

**Variable 2:**
- Key: `SECRET_KEY`
- Value: *(paste the value from Step 1)*

**Variable 3:**
- Key: `ALGORITHM`
- Value: `HS256`

**Variable 4:**
- Key: `ACCESS_TOKEN_EXPIRE_MINUTES`
- Value: `30`

**Variable 5:**
- Key: `ENV`
- Value: `production`

**Variable 6:**
- Key: `CORS_ORIGINS`
- Value: `http://localhost:5173`

**Variable 7:**
- Key: `PYTHONUNBUFFERED`
- Value: `1`

**Variable 8:**
- Key: `PYTHONIOENCODING`
- Value: `utf-8`

---

### Step 5: Deploy Backend

1. Click **Create Web Service**
2. Wait 5-8 minutes (first build downloads Chromium)
3. **COPY YOUR BACKEND URL** when it's ready
   - Example: `https://delorme-os-backend.onrender.com`

---

### Step 6: Test Backend

Visit: `https://YOUR-BACKEND-URL.onrender.com/docs`

You should see FastAPI Swagger documentation! ✅

---

## Step-by-Step: Frontend Deployment

### Step 1: Create Static Site

1. Go to https://dashboard.render.com
2. Click **New +** → **Static Site**
3. Select repository: `delormeca/delorme-os` *(same repo)*
4. Click **Connect**

---

### Step 2: Configure Frontend

| Field | Value |
|-------|-------|
| **Name** | `delorme-os-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` ⚠️ **IMPORTANT!** |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |

---

### Step 3: Add Frontend Environment Variable

Click **Advanced** → **Environment Variables**

**Variable 1:**
- Key: `VITE_API_URL`
- Value: `https://YOUR-BACKEND-URL.onrender.com` *(from Backend Step 5)*

Example: `https://delorme-os-backend.onrender.com`

---

### Step 4: Deploy Frontend

1. Click **Create Static Site**
2. Wait 3-5 minutes
3. **COPY YOUR FRONTEND URL** when ready
   - Example: `https://delorme-os-frontend.onrender.com`

---

## Final Step: Update Backend CORS

### Update CORS to Allow Frontend

1. Go to Render Dashboard → **delorme-os-backend**
2. Click **Environment** in left sidebar
3. Find `CORS_ORIGINS`
4. Click **pencil icon** to edit
5. Replace value with:
   ```
   https://delorme-os-frontend.onrender.com,http://localhost:5173
   ```
   *(Replace with YOUR actual frontend URL!)*
6. Click **Save**
7. Backend will auto-redeploy (2-3 minutes)

---

## Testing Checklist

### Backend Tests
- ✅ Visit `https://your-backend.onrender.com/docs`
- ✅ Swagger UI loads
- ✅ No errors in Render logs

### Frontend Tests
- ✅ Visit `https://your-frontend.onrender.com`
- ✅ App loads
- ✅ Try to login
- ✅ Open browser console (F12)
- ✅ No CORS errors
- ✅ API calls succeed (Network tab)

### Full Integration Test
- ✅ Login works
- ✅ Create a client
- ✅ Add sitemap URL
- ✅ Run extraction
- ✅ View extracted pages

---

## Optional: Add Stripe (If You Use Payments)

Go to Backend → **Environment** → **Add Environment Variable**

```
STRIPE_SECRET_KEY=sk_test_your_key_here
```
```
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```
```
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

---

## Optional: Add Email (If You Use Email Features)

```
MAILCHIMP_API_KEY=your_mailchimp_key
```
```
FROM_EMAIL=noreply@yourdomain.com
```
```
FROM_NAME=Delorme OS
```

---

## Optional: Add Google OAuth

```
GOOGLE_OAUTH2_CLIENT_ID=your_client_id.apps.googleusercontent.com
```
```
GOOGLE_OAUTH2_SECRET=your_secret
```
```
GOOGLE_OAUTH2_REDIRECT_URI=https://your-frontend.onrender.com/api/auth/google_callback
```

---

## Troubleshooting

### ❌ Backend build fails with "playwright install" error

**This is normal on first deploy.** Render is downloading Chromium (~170 MB).

If it fails, click **Manual Deploy** → **Deploy latest commit** to retry.

---

### ❌ CORS errors in browser console

**Error:** `Access to fetch at 'https://...' has been blocked by CORS policy`

**Fix:**
1. Go to Backend → **Environment**
2. Check `CORS_ORIGINS` includes your exact frontend URL
3. No trailing slash: ✅ `https://app.onrender.com` | ❌ `https://app.onrender.com/`
4. Click **Save** → Backend redeploys

---

### ❌ Database connection timeout

**Fix:**
1. Check `DATABASE_URL` starts with `postgresql+asyncpg://`
2. Ends with `?sslmode=require`
3. Uses Neon pooler URL (has `pooler` in hostname)

---

### ❌ Frontend shows blank page

**Fix:**
1. Check browser console (F12) for errors
2. Verify `VITE_API_URL` is correct
3. Make sure it starts with `https://` (not `http://`)

---

## Quick Reference

### Your URLs
- **Backend API:** `https://delorme-os-backend.onrender.com`
- **Frontend App:** `https://delorme-os-frontend.onrender.com`
- **API Docs:** `https://delorme-os-backend.onrender.com/docs`

### Monthly Cost
- Backend: $7/month (Starter)
- Frontend: $0/month (Free)
- Database: $0/month (Neon Free)
- **Total: $7/month**

### Deployment Time
- Backend first deploy: 5-8 minutes
- Frontend first deploy: 3-5 minutes
- Subsequent deploys: 2-3 minutes each

---

## All-in-One Copy Block (Backend)

Copy this for reference, then add to Render one by one:

```env
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_jceSZqfNx3C0@ep-morning-smoke-adg9491a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
SECRET_KEY=<generate-with-python-command>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENV=production
CORS_ORIGINS=http://localhost:5173
PYTHONUNBUFFERED=1
PYTHONIOENCODING=utf-8
```

---

## All-in-One Copy Block (Frontend)

```env
VITE_API_URL=https://delorme-os-backend.onrender.com
```

---

## You're All Set! 🚀

**Both services deployed on Render.com:**
- ✅ Backend handles all your Crawl4AI processing
- ✅ Frontend serves your React app via global CDN
- ✅ Neon provides serverless PostgreSQL
- ✅ Auto-deploy on git push
- ✅ Total cost: $7/month

**Next:** Push code to GitHub → Both services auto-deploy!
