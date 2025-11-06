# Deploy Staging in 5 Minutes 🚀

Your staging environment is **ready to deploy**! Follow this simple guide.

## Option 1: One-Click Deploy (EASIEST - 5 minutes)

### Step 1: Click Deploy Button

**Click this link to deploy with Render Blueprint:**

👉 **[Deploy to Render](https://dashboard.render.com/select-repo?type=blueprint)**

### Step 2: Connect GitHub

1. If prompted, **authorize Render** to access your GitHub account
2. Select repository: **`delormeca/velocity-app`**
3. Select branch: **`staging`**
4. Click **"Connect"**

### Step 3: Configure Services

Render will automatically detect your `render.yaml` and create:
- ✅ PostgreSQL Database
- ✅ Backend API Service
- ✅ Frontend Static Site

**You need to set these secrets** (click "Add Environment Variable" for backend service):

#### Required Secrets:
```bash
secret_key = [Click "Generate" button]
google_oauth2_client_id = [Get from Google Cloud Console]
google_oauth2_secret = [Get from Google Cloud Console]
```

#### Optional (Recommended):
```bash
STRIPE_SECRET_KEY = [Test key from Stripe Dashboard]
STRIPE_PUBLISHABLE_KEY = [Test key from Stripe Dashboard]
openai_api_key = [From OpenAI]
tavily_api_key = [From Tavily]
mailchimp_api_key = [From Mailchimp]
```

### Step 4: Deploy!

1. Review configuration
2. Click **"Apply"**
3. Wait 10-15 minutes for initial deployment
4. ✅ **Done!** Your staging environment is live

---

## Option 2: Manual Deploy (10 minutes)

If you prefer manual setup, follow `QUICK_START_RENDER.md`

---

## Option 3: Render CLI (For Power Users)

### Install Render CLI:
```bash
npm install -g @render-com/cli
```

### Login:
```bash
render login
```

### Deploy from YAML:
```bash
cd C:\Users\Admin\Documents\GitHub\delorme-os\velocity-v2.0.1\velocity-boilerplate
render blueprint launch
```

---

## After Deployment

### 1. Get Your URLs:

You'll get these URLs after deployment:
- **Frontend:** `https://delorme-os-staging-frontend.onrender.com`
- **Backend:** `https://delorme-os-staging-backend.onrender.com`
- **Database:** Internal URL (auto-connected)

### 2. Update OAuth Redirect URI:

Go to **Google Cloud Console** → Your Project → Credentials:
- Add authorized redirect URI: `https://delorme-os-staging-backend.onrender.com/api/auth/google_callback`

### 3. Create Admin User:

In Render Dashboard → Backend Service → Shell:
```bash
poetry run python -c "
from app.commands.create_superuser import create_superuser
import asyncio
asyncio.run(create_superuser(
    email='admin@yourcompany.com',
    password='YourSecurePassword123!',
    full_name='Admin User'
))
"
```

### 4. Test Your App:

Visit your frontend URL and try:
- ✅ Sign up with email/password
- ✅ Log in
- ✅ Google OAuth login
- ✅ Create an article
- ✅ Check analytics

---

## Continuous Deployment (Already Set Up!)

Every time you push to `staging` branch, Render **automatically redeploys**:

```bash
# Make changes
git add .
git commit -m "Add new feature"

# Push to staging
git push origin staging

# Render auto-deploys in 5-10 minutes ✨
```

---

## Cost Breakdown

### Free Tier (Good for testing):
- Database: Free for 90 days
- Backend: Free (sleeps after inactivity)
- Frontend: Free
- **Total: $0/month**

### Starter Tier (Recommended for staging):
- Database: $7/month (always on)
- Backend: $7/month (always on, no sleep)
- Frontend: Free
- **Total: $14/month**

---

## Troubleshooting

### Backend won't start?
- Check logs: Backend Service → Logs tab
- Verify all required environment variables are set
- Check database connection

### Frontend shows API errors?
- Verify `VITE_API_URL` is set correctly
- Check backend is running
- Check CORS settings

### Database connection fails?
- Free tier databases pause after inactivity
- Click "Resume" in Database dashboard
- Upgrade to Starter plan for always-on

---

## Quick Commands Reference

```bash
# View backend logs
render logs -s delorme-os-staging-backend

# View frontend logs
render logs -s delorme-os-staging-frontend

# Open backend shell
render shell delorme-os-staging-backend

# Redeploy backend
render deploy -s delorme-os-staging-backend

# Check service status
render services list
```

---

## Next Steps

1. ✅ Deploy staging (you're here!)
2. ✅ Test all features
3. ✅ Set up monitoring/alerts in Render Dashboard
4. ✅ Deploy production (same process, use `production` branch)
5. ✅ Set up custom domain

---

## Support Resources

- **Render Docs:** https://render.com/docs
- **Project README:** `README.md`
- **Full Guide:** `QUICK_START_RENDER.md`
- **Render Dashboard:** https://dashboard.render.com

---

**Ready to deploy? Click the [Deploy to Render](https://dashboard.render.com/select-repo?type=blueprint) button above!** 🚀
