# Supabase Environment Variables Setup

## Backend Environment Variables (Render.com)

After setting up your Supabase project, add these environment variables to your backend on Render.com:

### 1. Go to Render.com Dashboard
- Navigate to your backend service (FastAPI app)
- Click **Environment** tab
- Add/update these variables:

---

### Core Database Connection (Required)

```bash
# SUPABASE DATABASE CONNECTION (use connection pooling for production)
# Get from: Supabase Dashboard → Project Settings → Database → Connection Pooling
DATABASE_URL=postgresql+asyncpg://postgres.xxxxx:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Note: Replace the placeholders:
# - xxxxx = your project reference ID (from Supabase)
# - [YOUR_PASSWORD] = the database password you created
# - aws-0-us-east-1 = your region (might differ)
```

---

### Supabase Storage (Required for file uploads)

```bash
# SUPABASE STORAGE
# Get from: Supabase Dashboard → Project Settings → API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx.xxxxx

# Note: Use the SERVICE_ROLE key (not anon key) for backend
# This gives full access to bypass Row Level Security
```

---

### CORS Origins (Required - Add Vercel URL)

```bash
# CORS CONFIGURATION
# Add your Vercel frontend URL here
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app,http://localhost:5173

# Replace 'your-app' with your actual Vercel project name
# The wildcard (*) allows preview deployments to work
```

---

### Security (Keep Existing)

```bash
# JWT SECRET (keep your existing one or generate new)
SECRET_KEY=your-existing-secret-key-or-generate-new-one
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

### Application URLs (Update with Vercel)

```bash
# DOMAIN
DOMAIN=https://your-app.vercel.app
REDIRECT_AFTER_LOGIN=https://your-app.vercel.app/dashboard

# Replace with your actual Vercel URL
```

---

### Stripe (Keep Existing)

```bash
# STRIPE PAYMENTS (keep your existing values)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_STARTER=price_test_placeholder
STRIPE_PRICE_PRO=price_test_placeholder
```

---

### Email (Keep Existing if you have it)

```bash
# EMAIL (optional - keep if you use it)
MAILCHIMP_API_KEY=your_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Delorme OS
SUPPORT_EMAIL=support@yourdomain.com
```

---

### Google OAuth (Keep Existing if you use it)

```bash
# GOOGLE OAUTH (optional - update redirect URI with Vercel URL)
GOOGLE_OAUTH2_CLIENT_ID=your_client_id
GOOGLE_OAUTH2_SECRET=your_secret
GOOGLE_OAUTH2_REDIRECT_URI=https://your-app.vercel.app/api/auth/google_callback
```

---

## Complete Example (Copy-Paste Template)

Replace all `xxxxx` and `your-app` placeholders with your actual values:

```bash
# Environment
ENV=production

# Database (Supabase Connection Pooling)
DATABASE_URL=postgresql+asyncpg://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase Storage
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx.xxxxx

# CORS
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app,http://localhost:5173

# Security
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
DOMAIN=https://your-app.vercel.app
REDIRECT_AFTER_LOGIN=https://your-app.vercel.app/dashboard

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_STARTER=price_test_placeholder
STRIPE_PRICE_PRO=price_test_placeholder

# Email (optional)
MAILCHIMP_API_KEY=
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Delorme OS

# Google OAuth (optional)
GOOGLE_OAUTH2_CLIENT_ID=
GOOGLE_OAUTH2_SECRET=
GOOGLE_OAUTH2_REDIRECT_URI=https://your-app.vercel.app/api/auth/google_callback
```

---

## How to Get Supabase Values

### DATABASE_URL
1. Go to Supabase Dashboard → **Project Settings** → **Database**
2. Scroll to **Connection Pooling** section
3. Copy the **Connection string**
4. Change `postgresql://` to `postgresql+asyncpg://`
5. Add `?pgbouncer=true` at the end

### SUPABASE_URL
1. Go to Supabase Dashboard → **Project Settings** → **API**
2. Copy **Project URL** (e.g., `https://xxxxx.supabase.co`)

### SUPABASE_SERVICE_KEY
1. Go to Supabase Dashboard → **Project Settings** → **API**
2. Under **Project API keys**, copy the **service_role** key (the long one)
3. ⚠️ **IMPORTANT**: Use `service_role`, NOT `anon` key for backend

---

## After Setting Variables on Render

1. Click **Save Changes** on Render
2. Render will automatically redeploy your backend
3. Wait 2-3 minutes for deployment to complete
4. Check logs for any errors
5. Test API: `https://your-backend.onrender.com/docs`

---

## Testing Database Connection

After deployment, test your Supabase connection:

```bash
# Visit your backend API docs
https://your-backend.onrender.com/docs

# Try the health check endpoint
GET /api/health

# Should return: {"status": "healthy", "database": "connected"}
```

If you see database connection errors, double-check:
- Password is correct in DATABASE_URL
- Using connection pooling URL (port 6543, not 5432)
- Added `?pgbouncer=true` at the end
- Changed `postgresql://` to `postgresql+asyncpg://`
