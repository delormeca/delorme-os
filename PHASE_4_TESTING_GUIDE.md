# Phase 4: Data Extraction & Crawling - Testing Guide

**Version**: 1.0
**Date**: November 6, 2025

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Testing Workflow](#testing-workflow)
4. [API Testing](#api-testing)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Performance Testing](#performance-testing)

---

## Prerequisites

### Required API Keys

1. **OpenAI API Key** (for embeddings)
   - Get from: https://platform.openai.com/api-keys
   - Add to `local.env`: `openai_api_key=sk-...`

2. **Google Cloud Credentials** (for NLP entity extraction)
   - Create service account: https://console.cloud.google.com/
   - Enable Natural Language API
   - Download JSON credentials file
   - Add to `local.env`: `google_cloud_credentials_path=./google-credentials.json`

### Infrastructure

1. **PostgreSQL Database**
   ```bash
   docker-compose up -d
   ```

2. **Redis** (optional, for future caching)
   ```bash
   # Install Redis or use Docker
   docker run -d -p 6379:6379 redis:latest
   ```

3. **Playwright Browsers**
   ```bash
   poetry run playwright install chromium
   ```

---

## Setup

### 1. Configure Environment

Edit `local.env`:

```bash
# OpenAI (required for embeddings)
openai_api_key=sk-proj-YOUR_OPENAI_KEY

# Google Cloud (optional, for entity extraction)
google_cloud_credentials_path=./google-credentials.json

# Database
db_host=localhost
db_port=54323
db_database=delorme_os
db_username=delorme_os
db_password=delorme_os

# Crawling settings
crawl_rate_limit_delay=2
crawl_timeout_seconds=30
crawl_max_workers=5
```

### 2. Apply Database Migrations

```bash
cd velocity-boilerplate
poetry run alembic upgrade head
```

Verify migration applied:
```bash
poetry run alembic current
# Should show: 2c62e60d1a55 (head)
```

### 3. Create Test Data

Create a test client and add pages:

```bash
# Start backend
task run-backend

# In another terminal, use SQL or API to create test data
```

Or use the **Engine Setup** flow to import pages from a sitemap.

---

## Testing Workflow

### End-to-End Test

1. **Prepare Test Client**
   - Create a client via API
   - Use Engine Setup to import pages from sitemap
   - Or manually add a few test URLs

2. **Start Crawl Job**

```bash
curl -X POST http://localhost:8020/api/crawl/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "CLIENT_UUID_HERE",
    "run_type": "full"
  }'
```

Expected response:
```json
{
  "job_id": "page_crawl_CLIENT_UUID_full",
  "message": "Crawl job scheduled successfully. Job ID: ..."
}
```

3. **Monitor Progress**

Poll the status endpoint every 2 seconds:

```bash
# Get crawl_run_id from database or status response
curl http://localhost:8020/api/crawl/status/CRAWL_RUN_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
```

Expected response:
```json
{
  "id": "uuid",
  "status": "in_progress",
  "progress_percentage": 45,
  "current_page_url": "https://example.com/page3",
  "current_status_message": "Crawling page 5/10",
  "total_pages": 10,
  "successful_pages": 4,
  "failed_pages": 1,
  "performance_metrics": {
    "avg_time_per_page": 5.2,
    "pages_per_minute": 11.5
  },
  "api_costs": {
    "openai_embeddings": {
      "requests": 4,
      "tokens": 12450,
      "cost_usd": 0.001619
    },
    "google_nlp": {
      "requests": 4,
      "cost_usd": 0.004
    }
  },
  "errors": []
}
```

4. **Wait for Completion**

Status will change to `"completed"` when done:

```json
{
  "status": "completed",
  "progress_percentage": 100,
  "successful_pages": 9,
  "failed_pages": 1,
  "completed_at": "2025-11-06T12:34:56.789Z"
}
```

---

## API Testing

### All Endpoints

#### 1. Start Crawl
```bash
POST /api/crawl/start
Content-Type: application/json
Authorization: Bearer YOUR_JWT

{
  "client_id": "uuid",
  "run_type": "full"  # or "selective", "manual"
}
```

#### 2. Get Status
```bash
GET /api/crawl/status/{crawl_run_id}
Authorization: Bearer YOUR_JWT
```

#### 3. Cancel Job
```bash
POST /api/crawl/cancel/{job_id}
Authorization: Bearer YOUR_JWT
```

#### 4. List Active Jobs
```bash
GET /api/crawl/jobs
Authorization: Bearer YOUR_JWT
```

#### 5. List Client Crawl History
```bash
GET /api/crawl/client/{client_id}/runs?limit=10
Authorization: Bearer YOUR_JWT
```

---

## Verification

### Check Extracted Data

After crawl completes, verify data was extracted:

```sql
-- Connect to PostgreSQL
psql -h localhost -p 54323 -U delorme_os -d delorme_os

-- Check a crawled page
SELECT
    url,
    page_title,
    meta_description,
    word_count,
    body_content_embedding IS NOT NULL as has_embedding,
    salient_entities IS NOT NULL as has_entities,
    is_failed,
    last_crawled_at
FROM client_page
WHERE client_id = 'YOUR_CLIENT_ID'
LIMIT 5;
```

### Expected Data Points

Each successfully crawled page should have:

**Basic Metadata** (15 points):
- ✅ `page_title`
- ✅ `meta_title`
- ✅ `meta_description`
- ✅ `h1`
- ✅ `canonical_url`
- ✅ `hreflang`
- ✅ `meta_robots`
- ✅ `word_count`
- ✅ `body_content`
- ✅ `webpage_structure` (JSON)
- ✅ `internal_links` (JSON)
- ✅ `external_links` (JSON)
- ✅ `image_count`
- ✅ `schema_markup` (JSON)
- ✅ `slug`

**AI-Enhanced** (2 points):
- ✅ `body_content_embedding` (JSON array of 3072 floats)
- ✅ `salient_entities` (JSON with entities array)

### Sample Embedding Check

```sql
SELECT
    url,
    LENGTH(body_content_embedding) as embedding_length,
    body_content_embedding::jsonb -> 0 as first_value
FROM client_page
WHERE body_content_embedding IS NOT NULL
LIMIT 1;
```

Expected: `embedding_length` should be ~50KB+ (3072 floats in JSON)

### Sample Entities Check

```sql
SELECT
    url,
    salient_entities::jsonb -> 'entities' -> 0 as top_entity
FROM client_page
WHERE salient_entities IS NOT NULL
LIMIT 1;
```

Expected:
```json
{
  "name": "Google",
  "type": "ORGANIZATION",
  "salience": 0.8523,
  "mentions": 5
}
```

---

## Troubleshooting

### Common Issues

#### 1. "OpenAI client not initialized"

**Problem**: OpenAI API key not configured

**Solution**:
```bash
# Add to local.env
openai_api_key=sk-proj-YOUR_KEY

# Restart backend
```

#### 2. "Google NLP client not initialized"

**Problem**: Google Cloud credentials missing

**Options**:
- **Option A**: Add credentials file
  ```bash
  # Download from Google Cloud Console
  # Add to local.env
  google_cloud_credentials_path=./google-credentials.json
  ```

- **Option B**: Disable entity extraction
  ```bash
  # Leave google_cloud_credentials_path empty
  # Crawl will skip entity extraction
  ```

#### 3. "Playwright browser not found"

**Problem**: Chromium not installed

**Solution**:
```bash
poetry run playwright install chromium
```

#### 4. Crawl gets stuck at 0%

**Check**:
```bash
# View backend logs
tail -f logs/backend.log

# Check APScheduler jobs
GET /api/crawl/jobs
```

**Common causes**:
- Database connection lost
- Playwright browser crashed
- Pages timing out

**Solution**: Cancel and restart
```bash
POST /api/crawl/cancel/{job_id}
POST /api/crawl/start
```

#### 5. High API Costs

**Monitor costs**:
```bash
GET /api/crawl/status/{run_id}
# Check api_costs section
```

**Cost breakdown**:
- OpenAI embeddings: ~$0.13 per 1M tokens (~$0.001-0.01 per page)
- Google NLP: ~$1.00 per 1000 text records (~$0.001-0.01 per page)
- **Total**: ~$0.002-0.02 per page

**To reduce costs**:
- Crawl fewer pages (use selective mode)
- Skip embeddings/NLP for testing
- Use shorter body_content

---

## Performance Testing

### Test Scenarios

#### 1. Small Batch (10 pages)
```bash
# Expected time: ~20-50 seconds
# Rate: 10 pages / 20s = 30 pages/min
```

#### 2. Medium Batch (100 pages)
```bash
# Expected time: ~3-8 minutes
# Rate: 100 pages / 5min = 20 pages/min
```

#### 3. Large Batch (1000 pages)
```bash
# Expected time: ~30-60 minutes
# Rate: 1000 pages / 45min = 22 pages/min
```

### Performance Metrics

Monitor via status API:

```json
{
  "performance_metrics": {
    "total_time_seconds": 45.23,
    "avg_time_per_page": 4.52,
    "pages_per_minute": 13.27
  }
}
```

### Bottlenecks

**Slowest operations**:
1. **Page crawling**: 2-5s per page (Crawl4AI + network)
2. **Embedding generation**: 0.5-1s per page (OpenAI API)
3. **Entity extraction**: 0.2-0.5s per page (Google NLP)
4. **Data extraction**: 0.1-0.2s per page (local)

**Optimization**:
- Reduce `crawl_rate_limit_delay` (risk: rate limiting)
- Increase `crawl_max_workers` (future: parallel crawling)
- Skip embeddings/NLP for non-critical pages

---

## Test Checklist

### Pre-Test
- [ ] Database running (PostgreSQL)
- [ ] Migrations applied (`2c62e60d1a55`)
- [ ] OpenAI API key configured
- [ ] Google Cloud credentials configured (optional)
- [ ] Playwright browsers installed
- [ ] Test client created with pages

### During Test
- [ ] Crawl job starts successfully
- [ ] Progress updates in real-time
- [ ] No errors in backend logs
- [ ] API costs tracking works
- [ ] Pages marked as successful

### Post-Test
- [ ] All data points extracted
- [ ] Embeddings generated (JSON arrays)
- [ ] Entities extracted (JSON with salience)
- [ ] Performance metrics calculated
- [ ] Costs tracked accurately
- [ ] Failed pages logged with reasons

---

## Sample Test Script

```bash
#!/bin/bash

# Phase 4 Test Script

# 1. Setup
echo "Starting Phase 4 test..."
JWT="YOUR_JWT_TOKEN"
BASE_URL="http://localhost:8020"
CLIENT_ID="YOUR_CLIENT_UUID"

# 2. Start crawl
echo "Starting crawl..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/crawl/start \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"client_id\": \"$CLIENT_ID\", \"run_type\": \"full\"}")

echo "Response: $RESPONSE"
JOB_ID=$(echo $RESPONSE | jq -r '.job_id')
echo "Job ID: $JOB_ID"

# 3. Monitor progress
echo "Monitoring progress..."
while true; do
  STATUS=$(curl -s $BASE_URL/api/crawl/client/$CLIENT_ID/runs?limit=1 \
    -H "Authorization: Bearer $JWT" | jq '.[0]')

  echo "Status: $(echo $STATUS | jq -r '.status')"
  echo "Progress: $(echo $STATUS | jq -r '.progress_percentage')%"
  echo "Success: $(echo $STATUS | jq -r '.successful_pages')/$(echo $STATUS | jq -r '.total_pages')"

  if [ "$(echo $STATUS | jq -r '.status')" == "completed" ]; then
    echo "✅ Crawl completed!"
    break
  fi

  sleep 2
done

# 4. Verify results
echo "Verifying results..."
# Add verification queries here

echo "✅ Test complete!"
```

---

## Next Steps

After successful testing:

1. **Frontend Integration**
   - Build UI components for crawl control
   - Add progress visualization
   - Show extracted data

2. **Production Deployment**
   - Configure production API keys
   - Set up monitoring
   - Enable error alerting

3. **Optimization**
   - Fine-tune rate limits
   - Add caching layer
   - Implement retry logic

---

**Questions?** Check the main implementation summary: `PHASE_4_IMPLEMENTATION_SUMMARY.md`
