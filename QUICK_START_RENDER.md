# Quick Start: Deploy to Render.com

This is a quick reference guide to get your staging environment up and running on Render.com in under 30 minutes.

## Prerequisites

- GitHub account
- Render.com account (sign up at https://render.com)
- Your code pushed to GitHub

## Step 1: Push to GitHub (5 minutes)

```bash
# Navigate to your project
cd velocity-boilerplate

# Initialize git if not done
git init

# Create and switch to staging branch
git checkout -b staging

# Add all files
git add .

# Commit
git commit -m "Initial commit for staging deployment"

# Create GitHub repository (do this in GitHub UI or use gh CLI)
# Then add remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/velocity-app.git

# Push
git push -u origin staging
```

## Step 2: Create PostgreSQL Database (3 minutes)

1. Log in to Render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `velocity-staging-db`
   - **Database:** `craftyourstartup`
   - **User:** `craftyourstartup`
   - **Region:** Oregon (or closest to you)
   - **Plan:** Free or Starter ($7/month)
4. Click **"Create Database"**
5. Wait for creation (1-2 minutes)
6. **Copy** the Internal Database URL for next step

## Step 3: Deploy Backend (10 minutes)

1. Click **"New +"** → **"Web Service"**
2. **Connect GitHub repository** (authorize if needed)
3. **Select repository** and **branch: staging**
4. Configure:
   - **Name:** `velocity-staging-backend`
   - **Region:** Same as database (Oregon)
   - **Branch:** `staging`
   - **Root Directory:** Leave empty
   - **Environment:** Python 3
   - **Build Command:**
     ```bash
     chmod +x render-build.sh && ./render-build.sh
     ```
   - **Start Command:**
     ```bash
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan:** Free or Starter

5. **Set Environment Variables:**
   - Click **"Add Environment Variable"**
   - Add these REQUIRED variables:

   ```bash
   # Link database (use "Add from Database" button)
   db_username = [Link from database]
   db_password = [Link from database]
   db_host = [Link from database]
   db_port = [Link from database]
   db_database = craftyourstartup
   db_sslmode = require

   # Security
   secret_key = [Click "Generate" for random value]
   algorithm = HS256
   access_token_expire_minutes = 10080

   # Environment
   env = staging

   # Application URLs (update after frontend is deployed)
   domain = https://velocity-staging-frontend.onrender.com
   redirect_after_login = https://velocity-staging-frontend.onrender.com/dashboard

   # Email (basic config)
   from_email = noreply@yourdomain.com
   from_name = Velocity Staging
   support_email = support@yourdomain.com
   ```

6. **Optional but recommended:**
   - Stripe keys (use test keys)
   - Google OAuth credentials
   - OpenAI/Tavily API keys

7. Click **"Create Web Service"**
8. Wait for deployment (5-8 minutes first time)
9. **Copy your backend URL** (e.g., `https://velocity-staging-backend.onrender.com`)

## Step 4: Deploy Frontend (5 minutes)

1. Click **"New +"** → **"Static Site"**
2. **Connect GitHub repository**
3. **Select repository** and **branch: staging**
4. Configure:
   - **Name:** `velocity-staging-frontend`
   - **Branch:** `staging`
   - **Root Directory:** `frontend`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory:** `dist`

5. **Add Environment Variable:**
   ```bash
   VITE_API_URL = https://velocity-staging-backend.onrender.com
   ```
   *(Use the backend URL from Step 3)*

6. **Add Redirect Rule:**
   - Go to "Redirects/Rewrites" tab
   - Click "Add Rule"
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** Rewrite

7. Click **"Create Static Site"**
8. Wait for deployment (3-5 minutes)

## Step 5: Update Backend URLs (2 minutes)

Now that frontend is deployed, update backend environment variables:

1. Go to backend service in Render Dashboard
2. Go to "Environment" tab
3. Update these variables with your actual frontend URL:
   - `domain`: `https://velocity-staging-frontend.onrender.com`
   - `redirect_after_login`: `https://velocity-staging-frontend.onrender.com/dashboard`
4. Click "Save Changes"
5. Backend will automatically redeploy

## Step 6: Test Your App (5 minutes)

1. Visit your frontend URL: `https://velocity-staging-frontend.onrender.com`
2. Try to sign up with email/password
3. Check if you can log in
4. Test basic functionality

**If things don't work:**
- Check backend logs: Backend service → Logs tab
- Check frontend build: Frontend service → Logs tab
- Verify environment variables are set correctly

## Optional: Set Up Additional Services

### Google OAuth
1. Go to Google Cloud Console
2. Create OAuth credentials
3. Add authorized redirect URI: `https://velocity-staging-backend.onrender.com/api/auth/google_callback`
4. Add to backend environment variables:
   - `google_oauth2_client_id`
   - `google_oauth2_secret`
   - `google_oauth2_redirect_uri`

### Stripe Payments
1. Get test API keys from Stripe Dashboard
2. Add to backend environment variables:
   - `STRIPE_SECRET_KEY` (sk_test_...)
   - `STRIPE_PUBLISHABLE_KEY` (pk_test_...)
   - `STRIPE_WEBHOOK_SECRET` (whsec_...)
3. Set up webhook endpoint in Stripe:
   - URL: `https://velocity-staging-backend.onrender.com/api/payments/webhook`
   - Events: Select all payment events

### Create Admin User
1. Go to backend service → Shell tab
2. Run:
   ```bash
   poetry run python -m app.commands.create_superuser
   ```
3. Follow prompts to create admin user

## Continuous Deployment

Every time you push to the `staging` branch, Render automatically deploys:

```bash
# Make changes locally
git add .
git commit -m "Add new feature"

# Push to staging
git push origin staging

# Render automatically deploys (takes 5-10 minutes)
```

## Cost Summary

**Free Tier:**
- Database: Free (expires after 90 days)
- Backend: Free
- Frontend: Free
- **Total: $0/month**

**Paid Tier (Recommended for staging):**
- Database: Starter $7/month
- Backend: Starter $7/month
- Frontend: Free
- **Total: $14/month**

## Next Steps

1. ✅ Test all features thoroughly
2. ✅ Set up Google OAuth
3. ✅ Set up Stripe payments
4. ✅ Create admin user
5. ✅ Set up production environment (same steps, use `production` branch)
6. ✅ Point custom domain (in Render Dashboard → Settings)

## Troubleshooting

**Backend won't start:**
- Check environment variables are set
- Check database connection in logs
- Verify build command succeeded

**Frontend shows 404:**
- Check redirect rule is configured
- Verify VITE_API_URL is set correctly

**Database connection fails:**
- Check database is not paused (free tier pauses after inactivity)
- Verify db_sslmode=require is set
- Check backend and database are in same region

## Support

For detailed documentation, see:
- `RENDER_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `README.md` - Project documentation
- Render Docs: https://render.com/docs

---

Happy deploying! 🚀
