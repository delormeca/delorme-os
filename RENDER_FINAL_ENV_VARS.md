# Final Environment Variables for Render.com
## Backend Configuration (Using Render PostgreSQL)

---

## 🎯 Copy-Paste Ready Configuration

Go to **Render Dashboard → delorme-os-staging-backend → Environment**

---

## ✅ STEP 1: Add These 2 Critical Variables

### Variable 1: DATABASE_URL (CRITICAL!)

**Click "Add Environment Variable"**

**Key:**
```
DATABASE_URL
```

**Value:**
```
postgresql+asyncpg://delorme_os:Kv4mmbW3nwmThfItv5pDAooMIgXZc34m@dpg-d46b9fgdl3ps738tufog-a.onrender.com:5432/delorme_os?sslmode=require
```

---

### Variable 2: CORS_ORIGINS (CRITICAL!)

**Click "Add Environment Variable"**

**Key:**
```
CORS_ORIGINS
```

**Value:**
```
https://delorme-os-staging-frontend.onrender.com,http://localhost:5173
```

---

## ❌ STEP 2: Delete These 6 Variables

**Click the trash icon next to each one:**

1. ❌ Delete `db_database`
2. ❌ Delete `db_host`
3. ❌ Delete `db_password`
4. ❌ Delete `db_port`
5. ❌ Delete `db_sslmode`
6. ❌ Delete `db_username`

These are now combined into `DATABASE_URL` above.

---

## 🔧 STEP 3: Fix secret_key (Remove Quotes)

**Find this variable:**
```
secret_key="XPwdv3DHVF1KCXviTC/nJCdDkMbqacmBFsgoR/66pf8="
```

**Click Edit → Change to (NO QUOTES):**
```
XPwdv3DHVF1KCXviTC/nJCdDkMbqacmBFsgoR/66pf8=
```

---

## ✅ STEP 4: Verify These Stay the Same

Keep all these variables as-is:

```bash
access_token_expire_minutes=10080
algorithm=HS256
domain=https://delorme-os-staging-frontend.onrender.com
env=staging
from_email=noreply@delorme.com
from_name="Delorme OS Staging"
redirect_after_login=https://delorme-os-staging-frontend.onrender.com/dashboard
support_email=support@delorme.com
```

Keep these (even if they're placeholders for now):
```bash
STRIPE_PRICE_ENTERPRISE_SUB=4d4a9c045a7395b79de34599f029158e
STRIPE_PRICE_PREMIUM_SUB=fcb934032d10cc7136040ec3025bc020
STRIPE_PRICE_PRO=f629a85594503739293640c7170be8ce
STRIPE_PRICE_STARTER=647dfd63dedc2aa846c12e74367b1a2e
STRIPE_PUBLISHABLE_KEY=cf5da1b61f67801e38ecd346a735f592
STRIPE_SECRET_KEY=c057caf02b64243b67337379843dc9a0
STRIPE_WEBHOOK_SECRET=7eb4a06573ccceb4c9b964edb347a357
google_oauth2_client_id=655486ee52d0203b7611af4389e0d2b9
google_oauth2_redirect_uri=https://delorme-os-staging-backend.onrender.com/api/auth/google_callback
google_oauth2_secret=b55ad38877fb6e956d7ec45d109fe5b9
mailchimp_api_key=22fa660fd523113d77b0513ab3210a27
```

Keep these (AI features):
```bash
openai_api_key=b098e4e29fef52fbe8b66d15308ca17b
research_default_retriever=tavily
research_max_iterations=5
tavily_api_key=0bcc32e5ee8e4eee6d656f0af5ec3f35
```

---

## 💾 STEP 5: Save Changes

**Click "Save Changes"**

Render will automatically redeploy your backend (2-3 minutes)

---

## 📊 Summary of Changes

| Action | Variable | Why |
|--------|----------|-----|
| ✅ **ADD** | `DATABASE_URL` | FastAPI needs this single URL |
| ✅ **ADD** | `CORS_ORIGINS` | Frontend must be allowed to call backend |
| ❌ **DELETE** | `db_database` | Replaced by DATABASE_URL |
| ❌ **DELETE** | `db_host` | Replaced by DATABASE_URL |
| ❌ **DELETE** | `db_password` | Replaced by DATABASE_URL |
| ❌ **DELETE** | `db_port` | Replaced by DATABASE_URL |
| ❌ **DELETE** | `db_sslmode` | Replaced by DATABASE_URL |
| ❌ **DELETE** | `db_username` | Replaced by DATABASE_URL |
| 🔧 **EDIT** | `secret_key` | Remove quotes |

---

## 🎯 After Deployment (2-3 minutes)

### Test Login:

1. Go to: https://delorme-os-staging-frontend.onrender.com
2. Click **Sign In**
3. Create a test account or login

### Expected Result:
✅ Login should work!
✅ No CORS errors
✅ Backend connects to Render PostgreSQL

---

## 🔍 If Login Still Fails

Check backend logs:

1. Go to Render Dashboard → delorme-os-staging-backend
2. Click **Logs** tab
3. Look for errors like:
   - `"CORS"` errors → CORS_ORIGINS not set correctly
   - `"database"` errors → DATABASE_URL format wrong
   - `"401"` errors → This is OK (means auth is working, just need valid credentials)

---

## 📝 Final Backend Environment Variables List

After changes, you should have **exactly these**:

```bash
DATABASE_URL=postgresql+asyncpg://delorme_os:Kv4mmbW3nwmThfItv5pDAooMIgXZc34m@dpg-d46b9fgdl3ps738tufog-a.onrender.com:5432/delorme_os?sslmode=require
CORS_ORIGINS=https://delorme-os-staging-frontend.onrender.com,http://localhost:5173
secret_key=XPwdv3DHVF1KCXviTC/nJCdDkMbqacmBFsgoR/66pf8=
access_token_expire_minutes=10080
algorithm=HS256
domain=https://delorme-os-staging-frontend.onrender.com
env=staging
from_email=noreply@delorme.com
from_name="Delorme OS Staging"
redirect_after_login=https://delorme-os-staging-frontend.onrender.com/dashboard
support_email=support@delorme.com
openai_api_key=b098e4e29fef52fbe8b66d15308ca17b
research_default_retriever=tavily
research_max_iterations=5
tavily_api_key=0bcc32e5ee8e4eee6d656f0af5ec3f35
STRIPE_PRICE_ENTERPRISE_SUB=4d4a9c045a7395b79de34599f029158e
STRIPE_PRICE_PREMIUM_SUB=fcb934032d10cc7136040ec3025bc020
STRIPE_PRICE_PRO=f629a85594503739293640c7170be8ce
STRIPE_PRICE_STARTER=647dfd63dedc2aa846c12e74367b1a2e
STRIPE_PUBLISHABLE_KEY=cf5da1b61f67801e38ecd346a735f592
STRIPE_SECRET_KEY=c057caf02b64243b67337379843dc9a0
STRIPE_WEBHOOK_SECRET=7eb4a06573ccceb4c9b964edb347a357
google_oauth2_client_id=655486ee52d0203b7611af4389e0d2b9
google_oauth2_redirect_uri=https://delorme-os-staging-backend.onrender.com/api/auth/google_callback
google_oauth2_secret=b55ad38877fb6e956d7ec45d109fe5b9
mailchimp_api_key=22fa660fd523113d77b0513ab3210a27
```

**Total: 24 environment variables**

---

## ✅ You're Ready!

Once you make these changes and backend redeploys, login will work! 🚀
