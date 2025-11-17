# Render.com API Keys Checklist for Staging

**Last Updated**: November 17, 2025

This checklist covers all API keys and environment variables required for the Delorme OS staging environment on Render.com.

---

## ✅ Required for Core Functionality

### 1. Database
- **Variable**: `DATABASE_URL`
- **Required**: ✅ YES - Critical
- **Status**: ✅ Auto-configured by Render PostgreSQL service
- **Description**: Connection string for PostgreSQL database
- **Example**: `postgresql://user:password@host:5432/database`

### 2. Security
- **Variable**: `SECRET_KEY`
- **Required**: ✅ YES - Critical
- **Status**: ⚠️ CHECK ON RENDER
- **Description**: JWT signing key for authentication
- **Generate**: `python -c 'import secrets; print(secrets.token_urlsafe(32))'`
- **⚠️ NEVER use "example-key" in production!**

### 3. Domain & URLs
- **Variable**: `DOMAIN`
- **Required**: ✅ YES
- **Status**: ⚠️ CHECK ON RENDER
- **Value**: `https://delorme-os-staging-frontend.onrender.com`

- **Variable**: `REDIRECT_AFTER_LOGIN`
- **Required**: ✅ YES
- **Status**: ⚠️ CHECK ON RENDER
- **Value**: `https://delorme-os-staging-frontend.onrender.com/dashboard`

---

## 🤖 Required for AI Features

### 4. OpenAI (for embeddings & Deep Researcher)
- **Variable**: `OPENAI_API_KEY`
- **Required**: ✅ YES - For embeddings, Deep Researcher
- **Status**: ⚠️ CHECK ON RENDER
- **Get it from**: https://platform.openai.com/api-keys
- **Used for**:
  - Generating page embeddings (3072-dimensional vectors)
  - Deep Researcher GPT-powered research
  - Similarity calculations

---

## 🕷️ Required for Web Crawling

### 5. Apify (for website crawling)
- **Variable**: `APIFY_API_TOKEN`
- **Required**: ✅ YES - For Apify crawler
- **Status**: ❌ NEEDS TO BE ADDED TO RENDER
- **Get it from**: https://console.apify.com/account/integrations
- **Used for**:
  - Apify Website Content Crawler
  - Crawling client websites
  - Extracting HTML, markdown, screenshots
  - 83 data points per page

**🔧 Action Required**: Add this to Render environment variables!

---

## 🔍 Optional for Deep Researcher

### 6. Tavily API (web search)
- **Variable**: `TAVILY_API_KEY`
- **Required**: ❌ Optional
- **Status**: ⚠️ CHECK ON RENDER (recommended)
- **Get it from**: https://tavily.com
- **Used for**: Deep Researcher web search capabilities

### 7. Google Custom Search
- **Variable**: `GOOGLE_API_KEY`
- **Variable**: `GOOGLE_CX`
- **Required**: ❌ Optional
- **Status**: ⚠️ CHECK ON RENDER
- **Get from**: https://console.cloud.google.com/apis/credentials
- **Used for**: Deep Researcher alternative search

### 8. Bing Search API
- **Variable**: `BING_API_KEY`
- **Required**: ❌ Optional
- **Status**: ⚠️ CHECK ON RENDER
- **Get from**: https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
- **Used for**: Deep Researcher alternative search

### 9. Serper API
- **Variable**: `SERPER_API_KEY`
- **Required**: ❌ Optional
- **Status**: ⚠️ CHECK ON RENDER
- **Get from**: https://serper.dev
- **Used for**: Deep Researcher alternative search

### 10. SerpAPI
- **Variable**: `SERPAPI_API_KEY`
- **Required**: ❌ Optional
- **Status**: ⚠️ CHECK ON RENDER
- **Get from**: https://serpapi.com
- **Used for**: Deep Researcher alternative search

---

## 📧 Optional for Email

### 11. Mailchimp Transactional (Mandrill)
- **Variable**: `MAILCHIMP_API_KEY`
- **Required**: ❌ Optional
- **Status**: ⚠️ CHECK ON RENDER
- **Get from**: https://mailchimp.com/developer/transactional/
- **Used for**: Sending emails (password resets, notifications)

---

## 🔐 Optional for OAuth

### 12. Google OAuth2
- **Variable**: `GOOGLE_OAUTH2_CLIENT_ID`
- **Variable**: `GOOGLE_OAUTH2_SECRET`
- **Variable**: `GOOGLE_OAUTH2_REDIRECT_URI`
- **Required**: ❌ Optional
- **Status**: ⚠️ CHECK ON RENDER
- **Get from**: https://console.cloud.google.com/apis/credentials
- **Redirect URI**: `https://delorme-os-staging-backend.onrender.com/api/auth/google_callback`
- **⚠️ Must match EXACTLY in Google Cloud Console**

---

## 📋 How to Add Environment Variables on Render

1. Go to https://dashboard.render.com/
2. Select your **backend web service** (delorme-os-staging-backend)
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Enter **Key** (variable name) and **Value** (API key)
6. Click **Save Changes**
7. Render will automatically redeploy with new variables

---

## 🧪 How to Test if Keys are Working

### Test OpenAI API Key
```python
# In Render shell or logs, check:
from app.config.base import config
print(f"OpenAI: {'✅ Configured' if config.openai_api_key else '❌ Missing'}")
```

### Test Apify API Token
```python
from app.config.base import config
print(f"Apify: {'✅ Configured' if config.apify_api_token else '❌ Missing'}")
```

### Check All Keys via Backend
Navigate to: https://delorme-os-staging-backend.onrender.com/docs

Try creating a client and running:
1. **Sitemap Tracker** - Should work without external APIs
2. **Apify Crawler** - Requires `APIFY_API_TOKEN`
3. **Deep Researcher** - Requires `OPENAI_API_KEY` + at least one search API

---

## 🚨 Critical Issues Found

### Issue 1: Apify API Token Missing ❌
**Error**: Crawler will fail to start crawls
**Fix**: Add `APIFY_API_TOKEN` to Render environment variables
**Priority**: HIGH

### Issue 2: OpenAI API Key Status Unknown ⚠️
**Impact**: Embeddings and Deep Researcher won't work
**Check**: Verify key is set on Render
**Priority**: HIGH

---

## 📝 Recommended Render Environment Variable List

Here's the complete list to add on Render:

```bash
# Critical
SECRET_KEY=<generate-with-python-secrets>
DOMAIN=https://delorme-os-staging-frontend.onrender.com
REDIRECT_AFTER_LOGIN=https://delorme-os-staging-frontend.onrender.com/dashboard
DATABASE_URL=<auto-configured-by-render>

# AI & Crawling (HIGH PRIORITY)
OPENAI_API_KEY=sk-proj-...
APIFY_API_TOKEN=apify_api_...

# Deep Researcher Search (RECOMMENDED)
TAVILY_API_KEY=tvly-...

# Optional but useful
GOOGLE_OAUTH2_CLIENT_ID=...
GOOGLE_OAUTH2_SECRET=...
GOOGLE_OAUTH2_REDIRECT_URI=https://delorme-os-staging-backend.onrender.com/api/auth/google_callback
MAILCHIMP_API_KEY=...
```

---

## 🎯 Action Items for User

1. **URGENT**: Add `APIFY_API_TOKEN` to Render staging environment
2. **CHECK**: Verify `OPENAI_API_KEY` is configured on Render
3. **VERIFY**: Confirm `SECRET_KEY` is NOT "example-key" on Render
4. **OPTIONAL**: Add Tavily API key for better Deep Researcher results
5. **TEST**: After adding keys, test both sitemap tracker and Apify crawler

---

## 📞 Where to Get Help

- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **Apify API Token**: https://console.apify.com/account/integrations
- **Tavily API**: https://tavily.com
- **Render Dashboard**: https://dashboard.render.com/

---

**Status Legend**:
- ✅ Configured / Working
- ⚠️ Unknown / Needs verification
- ❌ Missing / Not configured
