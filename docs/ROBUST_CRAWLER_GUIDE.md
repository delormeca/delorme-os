# Robust Page Crawler - Complete Guide

## Overview

The `RobustPageCrawler` is a production-ready Crawl4AI implementation with:

✅ **Intelligent Retry Logic** with error classification
✅ **Dynamic Rate Limiting** with 429/503 detection
✅ **Comprehensive Validation** of extracted SEO data
✅ **Stealth Mode** auto-activation on bot detection
✅ **DOM Extraction** optimized for JavaScript-heavy sites
✅ **Response Headers** capture (X-Robots-Tag, etc.)
✅ **Quality Scoring** for each extraction

---

## Quick Start

### Basic Usage (Single URL)

```python
from app.services.robust_page_crawler import RobustPageCrawler

async def crawl_single_page():
    async with RobustPageCrawler() as crawler:
        result = await crawler.extract_page_data("https://example.com")

        if result['success']:
            print(f"✅ Title: {result.get('page_title')}")
            print(f"✅ Quality: {result['validation']['quality_score']}/100")
        else:
            print(f"❌ Failed: {result.get('error_message')}")
```

### Batch Crawling (Multiple URLs from Sitemap)

```python
async def crawl_sitemap_urls():
    urls = [
        "https://example.com/page1",
        "https://example.com/page2",
        "https://example.com/page3",
        # ... up to thousands of URLs
    ]

    async with RobustPageCrawler() as crawler:
        results = await crawler.crawl_batch(
            urls=urls,
            max_concurrent=5,  # Crawl 5 pages at a time
            max_retries=3,     # Retry up to 3 times per page
        )

    # Analyze results
    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]

    print(f"✅ Success: {len(successful)}/{len(urls)}")
    print(f"❌ Failed: {len(failed)}")
```

### With Database Storage

```python
from sqlmodel.ext.asyncio.session import AsyncSession
from app.services.robust_page_crawler import RobustPageCrawler
import uuid

async def crawl_and_store(db: AsyncSession, client_id: uuid.UUID):
    async with RobustPageCrawler(db) as crawler:
        page = await crawler.extract_and_store_page(
            client_id=client_id,
            url="https://example.com",
            crawl_run_id=None,  # Optional
        )

        print(f"✅ Stored page: {page.url}")
        print(f"   Title: {page.page_title}")
        print(f"   Status: {page.status_code}")
```

---

## Features Deep Dive

### 1. Retry Logic with Error Classification

The crawler automatically classifies errors and decides retry strategy:

```python
# Example: Network error
result = await crawler.extract_page_data("https://unreachable-site.com")
# Retries 3 times with exponential backoff: 2s, 4s, 8s

# Example: 404 Not Found
result = await crawler.extract_page_data("https://example.com/missing")
# Does NOT retry (client error - not retryable)

# Example: Bot detection (403)
result = await crawler.extract_page_data("https://protected-site.com")
# Retries with STEALTH MODE automatically enabled
```

**Error Categories:**
- `NETWORK` - DNS, SSL, connection errors → Retry with standard backoff
- `TIMEOUT` - Request timeout → Retry with increased timeout
- `CLIENT_ERROR` - 4xx errors → Usually no retry (except 403)
- `SERVER_ERROR` - 5xx errors → Retry with longer delays
- `BOT_DETECTION` - Cloudflare, CAPTCHA → Retry with stealth mode
- `PARSING` - HTML/JS errors → Retry with different config

### 2. Dynamic Rate Limiting

**Random Delays (Human-like behavior):**
```python
# Each request has random delay: 1-3 seconds
await crawler.crawl_batch(urls)
# Timeline: [crawl] → [1.7s] → [crawl] → [2.4s] → [crawl] → [1.2s] ...
```

**429/503 Detection with Exponential Backoff:**
```python
# If server returns 429 (Too Many Requests):
# 1st 429: Wait 2s
# 2nd 429: Wait 4s
# 3rd 429: Wait 8s
# ... up to 60s max

# Automatically resets on success
```

### 3. Comprehensive Validation

Every extraction is validated with quality scoring:

```python
result = await crawler.extract_page_data(url)

validation = result['validation']
print(validation)
# {
#     'has_issues': False,
#     'issues': [],  # Critical problems (missing title, etc.)
#     'warnings': ['missing_meta_description', 'thin_content'],
#     'quality_score': 90,  # 0-100 score
#     'validated_at': '2025-01-14T12:00:00'
# }
```

**Validation Checks:**
- ✅ **Title presence** (page_title or meta_title)
- ✅ **Meta description** presence
- ✅ **H1 tag** presence
- ✅ **Content quality** (word count >= 50)
- ✅ **Canonical URL** differs from actual URL
- ✅ **DOM rendering** completeness (not just skeleton)

**Quality Score Calculation:**
```
100 points
- 20 per critical issue (e.g., missing title)
- 5 per warning (e.g., missing meta description)
= Final score (0-100)
```

### 4. JavaScript & DOM Extraction

**Optimized for JS-heavy sites:**

```python
# crawler_config uses:
wait_until="networkidle"  # ✅ Waits for ALL AJAX/JS to complete
delay_before_return_html=2.0  # ✅ Extra wait for late-loading content

# This ensures React/Vue/Angular apps are fully rendered before extraction
```

**DOM Rendering Check:**
```python
# Detects incomplete rendering
if result['dom_rendered_completely'] == False:
    print("⚠️ Page may have empty root element - JS not fully executed")
```

### 5. Stealth Mode (Auto-Activation)

```python
# Manual stealth mode
result = await crawler.extract_page_data(url, use_stealth=True)

# Auto-activation on bot detection
# If crawler gets 403 or detects Cloudflare/CAPTCHA:
# → Automatically enables stealth mode on retry
# → Uses anti-detection browser args
# → Hides automation signals
```

**Stealth Features:**
- Disables `AutomationControlled` flag
- Realistic viewport (1920x1080)
- Real user agent string
- Human-like behavior simulation

### 6. Response Headers Capture

```python
result = await crawler.extract_page_data(url)

# Check X-Robots-Tag header
if result.get('x_robots_tag'):
    print(f"X-Robots-Tag: {result['x_robots_tag']}")
    # Automatically merged with meta_robots field

# All headers available
headers = result.get('response_headers', {})
```

---

## Configuration

### Environment Variables (config/base.py)

```bash
# Crawling settings
CRAWL_RATE_LIMIT_DELAY=2  # Base delay between requests (seconds)
CRAWL_TIMEOUT_SECONDS=30   # Default timeout per page
CRAWL_MAX_WORKERS=5        # Max concurrent crawls
CRAWL_RETRY_ATTEMPTS=3     # Max retry attempts per page
```

### Override at Runtime

```python
# Custom timeout
result = await crawler.extract_page_data(
    url,
    custom_timeout=60,  # 60 second timeout
)

# Custom retries
result = await crawler.extract_page_data(
    url,
    max_retries=5,  # Try up to 5 times
)

# Custom concurrency
results = await crawler.crawl_batch(
    urls,
    max_concurrent=10,  # 10 parallel crawls
)
```

---

## Migration from Old Service

### Before (page_extraction_service.py)

```python
from app.services.page_extraction_service import PageExtractionService

service = PageExtractionService(db)
result = await service.extract_page_data(url)
```

### After (robust_page_crawler.py)

```python
from app.services.robust_page_crawler import RobustPageCrawler

async with RobustPageCrawler(db) as crawler:
    result = await crawler.extract_page_data(url)
```

**Benefits:**
- ✅ Automatic retry logic (vs. manual in old service)
- ✅ Dynamic rate limiting (vs. fixed delay)
- ✅ Validation & quality scoring (new)
- ✅ Stealth mode auto-activation (vs. manual flag)
- ✅ Better error handling & classification

---

## Real-World Examples

### Example 1: Sitemap Crawl with Progress Tracking

```python
async def crawl_sitemap_with_progress(
    db: AsyncSession,
    client_id: uuid.UUID,
    sitemap_urls: List[str]
):
    """Crawl all URLs from sitemap with progress tracking."""

    async with RobustPageCrawler(db) as crawler:
        total = len(sitemap_urls)

        for i, url in enumerate(sitemap_urls, 1):
            print(f"[{i}/{total}] Crawling {url}...")

            result = await crawler.extract_page_data(url)

            if result['success']:
                # Store to database
                await crawler.extract_and_store_page(
                    client_id=client_id,
                    url=url,
                )

                quality = result['validation']['quality_score']
                print(f"  ✅ Success (quality: {quality})")
            else:
                error = result.get('error_message', 'Unknown')
                print(f"  ❌ Failed: {error}")

            # Rate limiting handled automatically
```

### Example 2: Retry-Only Failed Pages

```python
async def retry_failed_pages(db: AsyncSession):
    """Re-crawl only pages that previously failed."""

    from sqlmodel import select
    from app.models import ClientPage

    # Get failed pages
    statement = select(ClientPage).where(ClientPage.is_failed == True)
    result = await db.execute(statement)
    failed_pages = result.scalars().all()

    print(f"Found {len(failed_pages)} failed pages to retry")

    async with RobustPageCrawler(db) as crawler:
        for page in failed_pages:
            print(f"Retrying: {page.url}")

            # Extract with forced stealth mode
            result = await crawler.extract_page_data(
                url=page.url,
                use_stealth=True,  # Force stealth in case it was bot detection
                max_retries=5,     # Extra retries
            )

            if result['success']:
                # Update page
                page.is_failed = False
                page.page_title = result.get('page_title')
                page.meta_description = result.get('meta_description')
                # ... update other fields
                await db.commit()
                print(f"  ✅ Fixed!")
            else:
                print(f"  ❌ Still failing: {result.get('error_message')}")
```

### Example 3: Validate Existing Pages

```python
async def validate_all_pages(db: AsyncSession, client_id: uuid.UUID):
    """Validate quality of all existing pages."""

    from sqlmodel import select
    from app.models import ClientPage

    statement = select(ClientPage).where(
        ClientPage.client_id == client_id,
        ClientPage.is_failed == False
    )
    result = await db.execute(statement)
    pages = result.scalars().all()

    print(f"Validating {len(pages)} pages...")

    issues_by_type = {}

    for page in pages:
        # Simulate validation
        from app.services.robust_page_crawler import ExtractionValidation

        extracted = {
            'page_title': page.page_title,
            'meta_title': page.meta_title,
            'meta_description': page.meta_description,
            'h1': page.h1,
            'word_count': page.word_count,
            'canonical_url': page.canonical_url,
        }

        validated = ExtractionValidation.validate_extraction(extracted, page.url)

        # Track issues
        for issue in validated['validation']['issues']:
            issues_by_type[issue] = issues_by_type.get(issue, 0) + 1

        for warning in validated['validation']['warnings']:
            issues_by_type[warning] = issues_by_type.get(warning, 0) + 1

    # Report
    print("\n📊 Validation Summary:")
    for issue_type, count in sorted(issues_by_type.items(), key=lambda x: -x[1]):
        print(f"  {issue_type}: {count} pages")
```

---

## Performance Tips

### 1. Batch Size Optimization

```python
# For large sitemaps (10,000+ URLs), process in batches
async def crawl_large_sitemap(urls: List[str]):
    batch_size = 100

    for i in range(0, len(urls), batch_size):
        batch = urls[i:i + batch_size]

        async with RobustPageCrawler() as crawler:
            results = await crawler.crawl_batch(batch, max_concurrent=5)

        print(f"Completed batch {i//batch_size + 1}")

        # Small delay between batches to be extra polite
        await asyncio.sleep(10)
```

### 2. Memory Management

```python
# For very large crawls, don't store all results in memory
async def crawl_and_stream_to_db(db: AsyncSession, urls: List[str]):
    async with RobustPageCrawler(db) as crawler:
        for url in urls:
            result = await crawler.extract_page_data(url)

            if result['success']:
                # Store immediately, then discard
                await crawler.extract_and_store_page(
                    client_id=client_id,
                    url=url,
                )

            # Rate limiting handled automatically
```

### 3. Timeout Tuning

```python
# Fast sites
results = await crawler.crawl_batch(urls, custom_timeout=15)

# Slow sites (news, heavy JS)
results = await crawler.crawl_batch(urls, custom_timeout=60)

# Let adaptive timeout decide (recommended)
results = await crawler.crawl_batch(urls)  # Uses AdaptiveTimeout
```

---

## Troubleshooting

### Issue: "No title found" for JS-heavy site

**Solution:** The `wait_until="networkidle"` should handle this, but if still failing:

```python
# Increase wait time in adaptive_timeout.py
# Or force longer timeout
result = await crawler.extract_page_data(url, custom_timeout=60)
```

### Issue: Getting rate limited (429 errors)

**Solution:** Reduce concurrency and increase delays:

```python
# Update config
CRAWL_MAX_WORKERS=2  # Lower concurrency
CRAWL_RATE_LIMIT_DELAY=5  # Longer delay

# Or at runtime
results = await crawler.crawl_batch(
    urls,
    max_concurrent=2,  # Only 2 at a time
)
```

### Issue: Bot detection / Cloudflare blocks

**Solution:** Use stealth mode:

```python
result = await crawler.extract_page_data(url, use_stealth=True)

# Or it will auto-activate after first 403
```

### Issue: Timeouts on very slow pages

**Solution:** Increase timeout and check adaptive timeout logic:

```python
# Increase global timeout
CRAWL_TIMEOUT_SECONDS=90

# Or per-page
result = await crawler.extract_page_data(url, custom_timeout=120)
```

---

## Monitoring & Logging

### Enable Detailed Logging

```python
import logging

# Set crawler logger to DEBUG
logging.getLogger('app.services.robust_page_crawler').setLevel(logging.DEBUG)

# Example output:
# INFO: 🕷️  Attempt 1/3 for https://example.com (timeout=30s, stealth=False)
# INFO: ✅ Successfully extracted https://example.com (quality=95)
# WARNING: ⚠️ No meta description for https://example.com/page2
```

### Track Metrics

```python
async def crawl_with_metrics(urls: List[str]):
    start = asyncio.get_event_loop().time()

    async with RobustPageCrawler() as crawler:
        results = await crawler.crawl_batch(urls)

    duration = asyncio.get_event_loop().time() - start

    # Calculate metrics
    total = len(results)
    successful = sum(1 for r in results if r['success'])
    avg_quality = sum(
        r.get('validation', {}).get('quality_score', 0)
        for r in results if r['success']
    ) / max(successful, 1)

    print(f"""
    📊 Crawl Metrics:
    - Total URLs: {total}
    - Successful: {successful} ({successful/total*100:.1f}%)
    - Failed: {total - successful}
    - Avg Quality: {avg_quality:.1f}/100
    - Duration: {duration:.1f}s
    - Avg per page: {duration/total:.2f}s
    """)
```

---

## Best Practices

✅ **Use context manager** (`async with`) for automatic cleanup
✅ **Batch crawl** for sitemaps (more efficient than one-by-one)
✅ **Check quality scores** - re-crawl pages with low scores
✅ **Handle failures gracefully** - log and retry later
✅ **Respect rate limits** - use default delays or increase if needed
✅ **Enable stealth mode** for protected sites
✅ **Monitor validation warnings** - fix SEO issues

❌ **Don't** set `max_concurrent` too high (respect target server)
❌ **Don't** bypass `check_robots_txt` (enabled by default)
❌ **Don't** ignore validation warnings (indicates SEO issues)
❌ **Don't** retry 404s (client errors - not retryable)

---

## API Reference

### RobustPageCrawler

**Constructor:**
```python
RobustPageCrawler(db: Optional[AsyncSession] = None)
```

**Methods:**

#### `extract_page_data(url, max_retries=None, use_stealth=False, custom_timeout=None)`
Extract data from single URL with retry logic.

**Returns:** `Dict[str, Any]` with:
- `success: bool`
- `url: str` (final URL after redirects)
- `status_code: int`
- `page_title: str`
- `meta_description: str`
- `validation: dict` (quality score, issues, warnings)
- ... all SEO fields

#### `crawl_batch(urls, max_concurrent=None, max_retries=None)`
Crawl multiple URLs with concurrency control.

**Returns:** `List[Dict[str, Any]]` - list of extraction results

#### `extract_and_store_page(client_id, url, crawl_run_id=None)`
Extract and save to database.

**Returns:** `ClientPage` model instance

---

## Complete Example: Production Sitemap Crawler

```python
import asyncio
from typing import List
from sqlmodel.ext.asyncio.session import AsyncSession
from app.services.robust_page_crawler import RobustPageCrawler
import uuid

async def production_sitemap_crawler(
    db: AsyncSession,
    client_id: uuid.UUID,
    sitemap_urls: List[str],
    crawl_run_id: uuid.UUID,
):
    """
    Production-ready sitemap crawler with:
    - Progress tracking
    - Error handling
    - Metrics reporting
    - Quality validation
    """

    print(f"🚀 Starting crawl of {len(sitemap_urls)} URLs...")

    # Track metrics
    start_time = asyncio.get_event_loop().time()
    stats = {
        'total': len(sitemap_urls),
        'success': 0,
        'failed': 0,
        'quality_scores': [],
        'errors_by_type': {},
    }

    # Crawl in batches for memory efficiency
    batch_size = 50

    for batch_num, i in enumerate(range(0, len(sitemap_urls), batch_size), 1):
        batch_urls = sitemap_urls[i:i + batch_size]

        print(f"\n📦 Batch {batch_num}/{(len(sitemap_urls)-1)//batch_size + 1}")
        print(f"   URLs: {len(batch_urls)}")

        async with RobustPageCrawler(db) as crawler:
            # Crawl batch
            results = await crawler.crawl_batch(
                urls=batch_urls,
                max_concurrent=5,
                max_retries=3,
            )

            # Store successful results
            for result in results:
                url = result.get('url')

                if result['success']:
                    # Store to database
                    page = await crawler.extract_and_store_page(
                        client_id=client_id,
                        url=url,
                        crawl_run_id=crawl_run_id,
                    )

                    stats['success'] += 1
                    quality = result['validation']['quality_score']
                    stats['quality_scores'].append(quality)

                    print(f"  ✅ {url} (quality: {quality})")
                else:
                    stats['failed'] += 1
                    error = result.get('error_message', 'Unknown')

                    # Track error types
                    retry_info = result.get('retry_info', {})
                    error_cat = retry_info.get('error_category', 'unknown')
                    stats['errors_by_type'][error_cat] = stats['errors_by_type'].get(error_cat, 0) + 1

                    print(f"  ❌ {url}: {error}")

        # Small delay between batches
        if i + batch_size < len(sitemap_urls):
            await asyncio.sleep(5)

    # Calculate final metrics
    duration = asyncio.get_event_loop().time() - start_time
    avg_quality = sum(stats['quality_scores']) / max(len(stats['quality_scores']), 1)

    # Report
    print(f"""

    ✅ Crawl Complete!

    📊 Statistics:
    - Total URLs: {stats['total']}
    - Successful: {stats['success']} ({stats['success']/stats['total']*100:.1f}%)
    - Failed: {stats['failed']} ({stats['failed']/stats['total']*100:.1f}%)
    - Average Quality: {avg_quality:.1f}/100
    - Total Duration: {duration/60:.1f} minutes
    - Avg per page: {duration/stats['total']:.2f}s

    ❌ Errors by Type:
    {chr(10).join(f'    {k}: {v}' for k, v in sorted(stats['errors_by_type'].items(), key=lambda x: -x[1]))}
    """)

    return stats

# Usage:
# stats = await production_sitemap_crawler(db, client_id, urls, crawl_run_id)
```

---

## Support

For issues or questions, check:
1. This documentation
2. `app/services/crawl_error_classifier.py` for error details
3. Logs (set DEBUG level for detailed output)
4. PDF: "Building an SEO Audit Crawler with Crawl4AI and Flask"
