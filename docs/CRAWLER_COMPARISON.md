# Crawler Service Comparison

## Before vs. After - What Changed?

### Old Implementation (`page_extraction_service.py`)

**Strengths:**
- ✅ Adaptive timeout system
- ✅ Stealth mode support
- ✅ HTML parser integration
- ✅ Database storage

**Weaknesses:**
- ❌ No retry logic
- ❌ No error classification
- ❌ Fixed rate limiting (2s delay)
- ❌ No validation of extracted data
- ❌ No quality scoring
- ❌ `wait_until="domcontentloaded"` (too early for JS)
- ❌ No 429/503 handling
- ❌ No response header capture
- ❌ Manual stealth mode activation

---

### New Implementation (`robust_page_crawler.py`)

**Added Features:**

#### 1. ✅ Intelligent Retry Logic
```python
# OLD: Single attempt, fails immediately
result = await service.extract_page_data(url)

# NEW: Automatic retry with smart backoff
result = await crawler.extract_page_data(url, max_retries=3)
# - Retries network errors with exponential backoff
# - Skips non-retryable errors (404)
# - Auto-enables stealth on bot detection
# - Increases timeout on timeout errors
```

#### 2. ✅ Error Classification
```python
# Classifies errors into categories:
- NETWORK: DNS, SSL → Retry with 2^n backoff
- TIMEOUT: Slow page → Retry with increased timeout
- CLIENT_ERROR: 404, 403 → Don't retry (or stealth for 403)
- SERVER_ERROR: 500, 503 → Retry with longer delays
- BOT_DETECTION: Cloudflare → Auto-enable stealth mode
- PARSING: JS error → Retry with different config

# Logged for each attempt:
INFO: ⚠️ Attempt 1 failed: timeout - Request timed out
INFO: 🔄 Retrying in 2s...
INFO: ⚠️ Attempt 2 failed: timeout - Request timed out
INFO: 🔄 Retrying in 4s...
INFO: ✅ Successfully extracted (quality=95)
```

#### 3. ✅ Dynamic Rate Limiting
```python
# OLD: Fixed delay
await asyncio.sleep(2)  # Always 2 seconds

# NEW: Dynamic delays
- Random delay (1-3s) for human-like behavior
- Exponential backoff on 429/503:
  * 1st 429: Wait 2s
  * 2nd 429: Wait 4s
  * 3rd 429: Wait 8s
  * ... up to 60s
- Auto-resets on success
```

#### 4. ✅ Comprehensive Validation
```python
# NEW: Every extraction is validated
result = await crawler.extract_page_data(url)

validation = result['validation']
{
    'has_issues': False,
    'issues': [],  # Critical: missing title, etc.
    'warnings': ['missing_meta_description'],
    'quality_score': 90,  # 0-100 score
    'validated_at': '2025-01-14T12:00:00'
}

# Quality Score Calculation:
100 points
- 20 per critical issue (missing title)
- 5 per warning (missing meta description, thin content)
= Final score
```

#### 5. ✅ Better JavaScript Handling
```python
# OLD
wait_until="domcontentloaded"  # ❌ Too early - JS not executed

# NEW
wait_until="networkidle"  # ✅ Waits for ALL AJAX/JS to complete
delay_before_return_html=2.0  # ✅ Extra wait for late-loading content

# Plus DOM rendering check:
if not result['dom_rendered_completely']:
    logger.warning("⚠️ Empty root element - JS may not have rendered")
```

#### 6. ✅ Response Headers Capture
```python
# NEW: Captures all response headers
headers = result['response_headers']

# Specifically checks X-Robots-Tag
x_robots = headers.get('X-Robots-Tag')
# → Automatically merged with meta_robots field

# Stored in database for analysis
```

#### 7. ✅ Auto-Stealth Mode
```python
# OLD: Manual flag
result = await service.extract_page_data(url, use_stealth=True)

# NEW: Automatic activation on bot detection
result = await crawler.extract_page_data(url)
# 1st attempt: Normal mode → Gets 403
# 2nd attempt: Stealth mode auto-enabled → Success!
```

#### 8. ✅ Robots.txt Compliance
```python
# NEW: Enabled by default
check_robots_txt=True

# Respects robots.txt directives
# Logs if URL was blocked by robots.txt
```

#### 9. ✅ Better Error Messages
```python
# OLD
error_message: "Unknown error"

# NEW
error_message: "Failed after 3 attempts: Request timed out"
retry_info: {
    'attempts': 3,
    'error_category': 'timeout',
    'retryable': True
}
```

---

## Performance Comparison

### Scenario: Crawling 100 URLs from sitemap

#### Old Service
```
100 URLs × single attempt each
- 70 succeed immediately
- 30 fail (10 timeouts, 10 network errors, 5 bot detection, 5 real errors)
= 70% success rate
Time: ~350 seconds (100 × 2s delay + 150s crawl time)
```

#### New Service
```
100 URLs × up to 3 attempts with intelligent retry
- 70 succeed on first attempt
- 20 succeed on retry (timeouts, network errors)
- 5 succeed with stealth mode (bot detection)
- 5 fail (404s, real errors)
= 95% success rate
Time: ~450 seconds (includes retry overhead)
Extra 100s for 5% more success = Worth it!
```

**Trade-off:** Slightly slower, but 25% improvement in success rate.

---

## Feature Matrix

| Feature | Old Service | New Service |
|---------|-------------|-------------|
| Basic extraction | ✅ | ✅ |
| Adaptive timeout | ✅ | ✅ |
| Stealth mode | ✅ Manual | ✅ Auto |
| Retry logic | ❌ | ✅ 3 attempts |
| Error classification | ❌ | ✅ 7 categories |
| Rate limiting | ✅ Fixed 2s | ✅ Dynamic 1-3s |
| 429/503 handling | ❌ | ✅ Exponential backoff |
| Validation | ❌ | ✅ Quality score |
| DOM check | ❌ | ✅ Rendering detection |
| Response headers | ❌ | ✅ Full capture |
| JS rendering | ⚠️ domcontentloaded | ✅ networkidle |
| Robots.txt | ❌ | ✅ Enabled |
| Batch crawling | ✅ Basic | ✅ Enhanced |
| Progress tracking | ❌ | ✅ Metadata |
| Quality metrics | ❌ | ✅ 0-100 score |

---

## Migration Guide

### Step 1: Update Imports

**Before:**
```python
from app.services.page_extraction_service import PageExtractionService

service = PageExtractionService(db)
result = await service.extract_page_data(url)
```

**After:**
```python
from app.services.robust_page_crawler import RobustPageCrawler

async with RobustPageCrawler(db) as crawler:
    result = await crawler.extract_page_data(url)
```

### Step 2: Update Configuration

**Before:**
```python
# In local.env
CRAWL_RATE_LIMIT_DELAY=2
CRAWL_TIMEOUT_SECONDS=30
```

**After:**
```python
# Same config, but now:
# - CRAWL_RATE_LIMIT_DELAY is used as base for random delays
# - CRAWL_TIMEOUT_SECONDS is enhanced with adaptive timeout
# - CRAWL_RETRY_ATTEMPTS=3 is respected
```

### Step 3: Update Batch Crawling

**Before:**
```python
# Manual iteration
for url in urls:
    result = await service.extract_page_data(url)
    # ... process result
    await asyncio.sleep(2)  # Manual delay
```

**After:**
```python
# Built-in batch processing
async with RobustPageCrawler(db) as crawler:
    results = await crawler.crawl_batch(
        urls=urls,
        max_concurrent=5,  # Concurrency control
        max_retries=3,     # Automatic retries
    )
    # Rate limiting handled automatically
```

### Step 4: Handle Validation Results

**NEW - Check quality scores:**
```python
result = await crawler.extract_page_data(url)

if result['success']:
    quality = result['validation']['quality_score']

    if quality < 50:
        logger.warning(f"Low quality page: {url} (score: {quality})")
        # Maybe re-crawl with different settings

    if result['validation']['has_issues']:
        print(f"Issues: {result['validation']['issues']}")
```

### Step 5: Update Error Handling

**Before:**
```python
result = await service.extract_page_data(url)
if not result['success']:
    logger.error(f"Failed: {result['error_message']}")
    # No retry, just fail
```

**After:**
```python
result = await crawler.extract_page_data(url, max_retries=3)
if not result['success']:
    retry_info = result.get('retry_info', {})
    logger.error(
        f"Failed after {retry_info['attempts']} attempts: "
        f"{result['error_message']} "
        f"(category: {retry_info['error_category']})"
    )
    # Already retried 3 times with smart backoff
```

---

## When to Use Which Service?

### Use Old Service (`page_extraction_service.py`) If:
- ❌ Not recommended anymore
- Consider migrating to new service

### Use New Service (`robust_page_crawler.py`) If:
- ✅ Crawling from sitemaps (most use cases)
- ✅ Need reliable extraction (retry logic)
- ✅ Crawling protected sites (auto-stealth)
- ✅ Need quality metrics (validation)
- ✅ Batch processing (multiple URLs)
- ✅ Production deployment (robust error handling)

**Recommendation:** Migrate all code to `robust_page_crawler.py`.

---

## Code Examples

### Example 1: Simple Migration

**Before:**
```python
async def crawl_client_pages(db: AsyncSession, client_id: uuid.UUID, urls: List[str]):
    service = PageExtractionService(db)

    for url in urls:
        try:
            result = await service.extract_page_data(url)
            if result['success']:
                await service.extract_and_store_page(client_id, url)
        except Exception as e:
            logger.error(f"Error: {e}")

        await asyncio.sleep(2)  # Rate limiting
```

**After:**
```python
async def crawl_client_pages(db: AsyncSession, client_id: uuid.UUID, urls: List[str]):
    async with RobustPageCrawler(db) as crawler:
        results = await crawler.crawl_batch(urls, max_concurrent=5)

        for result in results:
            if result['success']:
                await crawler.extract_and_store_page(
                    client_id=client_id,
                    url=result['url']
                )
            else:
                logger.error(f"Failed {result['url']}: {result['error_message']}")

    # No manual rate limiting needed - handled automatically
```

### Example 2: With Progress Tracking

**New Features:**
```python
async def crawl_with_progress(db: AsyncSession, urls: List[str]):
    async with RobustPageCrawler(db) as crawler:
        total = len(urls)

        for i, url in enumerate(urls, 1):
            result = await crawler.extract_page_data(url)

            # Rich logging
            if result['success']:
                quality = result['validation']['quality_score']
                print(f"[{i}/{total}] ✅ {url} (quality: {quality}/100)")

                # Check for issues
                validation = result['validation']
                if validation['has_issues']:
                    print(f"  ⚠️  Issues: {validation['issues']}")
            else:
                retry_info = result.get('retry_info', {})
                print(
                    f"[{i}/{total}] ❌ {url} - {result['error_message']} "
                    f"(attempts: {retry_info.get('attempts', 1)})"
                )
```

---

## Performance Tips

### Old Service Performance
```python
# Sequential with fixed delays
for url in urls:
    await extract(url)
    await asyncio.sleep(2)  # 2s × 100 URLs = 200s overhead
```

### New Service Performance
```python
# Concurrent with dynamic delays
await crawler.crawl_batch(
    urls,
    max_concurrent=5  # Process 5 at a time
)
# Random delays (1-3s avg) × 100/5 batches = ~200s overhead
# BUT: Successful on first try vs. retry overhead balances out
```

**Optimization:** Adjust `max_concurrent` based on target server:
- Fast server + good connection: `max_concurrent=10`
- Slow server or rate limits: `max_concurrent=2`
- Default (safe): `max_concurrent=5`

---

## Recommendation

**Migrate to `robust_page_crawler.py` for:**
1. ✅ Higher success rates (retry logic)
2. ✅ Better error handling (classification)
3. ✅ Quality insights (validation scores)
4. ✅ Production reliability (proven patterns from PDF)
5. ✅ Future maintenance (best practices)

**Timeline:**
- **Immediate:** Use for new features
- **Short-term:** Migrate existing crawl jobs
- **Long-term:** Deprecate old service

---

## Questions?

See:
- `docs/ROBUST_CRAWLER_GUIDE.md` - Full documentation
- `test_robust_crawler.py` - Test examples
- PDF: "Building an SEO Audit Crawler with Crawl4AI and Flask"
