# Data Points Reference - Complete Catalog

**Version**: 1.0.0
**Last Updated**: 2025-01-11
**Total Data Points**: 44
**Extraction Coverage**: 52.3% (23 extracted)

---

## Quick Stats

| Category | Total | Extracted | Coverage |
|----------|-------|-----------|----------|
| ONPAGE | 17 | 13 | 76.5% |
| CONTENT | 6 | 3 | 50.0% |
| LINKS | 3 | 3 | 100.0% |
| MEDIA | 2 | 2 | 100.0% |
| TECHNICAL | 16 | 4 | 25.0% |

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ EXTRACTED | 23 | 52.3% |
| ⚠️ NOT_ON_PAGE | 6 | 13.6% |
| 🔧 REQUIRES_CUSTOM_LOGIC | 5 | 11.4% |
| ❌ NOT_WORKING | 3 | 6.8% |

---

## ONPAGE Category (17 data points)

### ✅ dp_page_title - Page Title
- **Crawl4AI Field**: `page_title`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: Crawl4AI metadata
- **Example**: `"Accounting and Bookkeeping | Diploma | LaSalle College Vancouver"`
- **Description**: Title of the page from `<title>` tag or metadata

### ⚠️ dp_meta_title - Meta Title
- **Crawl4AI Field**: `meta_title`
- **Data Type**: STRING
- **Status**: NOT_ON_PAGE
- **Method**: HTML parser - `<meta name='title'>`
- **Example**: `null`
- **Description**: SEO meta title tag content

### ✅ dp_meta_description - Meta Description
- **Crawl4AI Field**: `meta_description`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: Crawl4AI metadata + HTML parser
- **Example**: `"Join our Accounting and Bookkeeping program and turn your passion into a profession..."`
- **Description**: SEO meta description tag content

### ✅ dp_h1 - H1 Heading
- **Crawl4AI Field**: `h1`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - first `<h1>` tag
- **Example**: `"Accounting and Bookkeeping"`
- **Description**: First H1 heading on the page

### ✅ dp_canonical_url - Canonical URL
- **Crawl4AI Field**: `canonical_url`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<link rel='canonical'>`
- **Example**: `"https://lasallecollegevancouver.lcieducation.com/en/programs-and-courses/diploma-accounting-and-bookkeeping"`
- **Description**: Canonical URL from `<link rel='canonical'>`

### ✅ dp_hreflang - Hreflang
- **Crawl4AI Field**: `hreflang`
- **Data Type**: JSON
- **Status**: EXTRACTED
- **Method**: HTML parser - `<link rel='alternate' hreflang>`
- **Example**: `[{'hreflang': 'en', 'href': 'https://lasallecollegevancouver.lcieducation.com/en/...'}]`
- **Description**: Alternate language versions from `<link rel='alternate'>`

### ✅ dp_meta_robots - Meta Robots
- **Crawl4AI Field**: `meta_robots`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<meta name='robots'>`
- **Example**: `"index, follow"`
- **Description**: Robots meta tag directives

### ✅ dp_og_title - Open Graph Title
- **Crawl4AI Field**: `head_data.og:title`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<meta property='og:title'>`
- **Example**: `"Accounting and Bookkeeping | Diploma | LaSalle College Vancouver"`
- **Description**: Open Graph title for social media sharing

### ✅ dp_og_description - Open Graph Description
- **Crawl4AI Field**: `head_data.og:description`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<meta property='og:description'>`
- **Example**: `"Join our Accounting and Bookkeeping program..."`
- **Description**: Open Graph description for social media

### ✅ dp_og_image - Open Graph Image
- **Crawl4AI Field**: `head_data.og:image`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<meta property='og:image'>`
- **Example**: `"https://dam.lcieducation.com/LCI-Education/Brand-management/..."`
- **Description**: Open Graph image URL for social media

### ⚠️ dp_og_type - Open Graph Type
- **Crawl4AI Field**: `head_data.og:type`
- **Data Type**: STRING
- **Status**: NOT_ON_PAGE
- **Method**: HTML parser - `<meta property='og:type'>`
- **Example**: `null`
- **Description**: Open Graph content type (website, article, etc.)

### ⚠️ dp_og_url - Open Graph URL
- **Crawl4AI Field**: `head_data.og:url`
- **Data Type**: STRING
- **Status**: NOT_ON_PAGE
- **Method**: HTML parser - `<meta property='og:url'>`
- **Example**: `null`
- **Description**: Open Graph canonical URL

### ⚠️ dp_og_site_name - Open Graph Site Name
- **Crawl4AI Field**: `head_data.og:site_name`
- **Data Type**: STRING
- **Status**: NOT_ON_PAGE
- **Method**: HTML parser - `<meta property='og:site_name'>`
- **Example**: `null`
- **Description**: Open Graph site name

### ✅ dp_twitter_card - Twitter Card Type
- **Crawl4AI Field**: `head_data.twitter:card`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<meta name='twitter:card'>`
- **Example**: `"summary_large_image"`
- **Description**: Twitter Card type (summary, summary_large_image, etc.)

### ✅ dp_twitter_title - Twitter Card Title
- **Crawl4AI Field**: `head_data.twitter:title`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<meta name='twitter:title'>`
- **Example**: `"Accounting and Bookkeeping | Diploma | LaSalle College Vancouver"`
- **Description**: Twitter Card title

### ✅ dp_twitter_description - Twitter Card Description
- **Crawl4AI Field**: `head_data.twitter:description`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<meta name='twitter:description'>`
- **Example**: `"Join our Accounting and Bookkeeping program..."`
- **Description**: Twitter Card description

### ✅ dp_twitter_image - Twitter Card Image
- **Crawl4AI Field**: `head_data.twitter:image`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<meta name='twitter:image'>`
- **Example**: `"https://dam.lcieducation.com/LCI-Education/Brand-management/..."`
- **Description**: Twitter Card image URL

### ⚠️ dp_twitter_site - Twitter Site Handle
- **Crawl4AI Field**: `head_data.twitter:site`
- **Data Type**: STRING
- **Status**: NOT_ON_PAGE
- **Method**: HTML parser - `<meta name='twitter:site'>`
- **Example**: `null`
- **Description**: Twitter site handle (@username)

### ⚠️ dp_twitter_creator - Twitter Creator Handle
- **Crawl4AI Field**: `head_data.twitter:creator`
- **Data Type**: STRING
- **Status**: NOT_ON_PAGE
- **Method**: HTML parser - `<meta name='twitter:creator'>`
- **Example**: `null`
- **Description**: Twitter creator handle (@username)

### ✅ dp_lang - Language
- **Crawl4AI Field**: `lang`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<html lang>`
- **Example**: `"en"`
- **Description**: Page language from `<html lang>` attribute

### ✅ dp_charset - Character Encoding
- **Crawl4AI Field**: `charset`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<meta charset>`
- **Example**: `"utf-8"`
- **Description**: Character encoding from `<meta charset>`

### ✅ dp_meta_viewport - Viewport Meta Tag
- **Crawl4AI Field**: `meta_viewport`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - `<meta name='viewport'>`
- **Example**: `"width=device-width, initial-scale=1"`
- **Description**: Viewport configuration for mobile devices

### ✅ dp_is_mobile_responsive - Mobile Responsive
- **Crawl4AI Field**: `is_mobile_responsive`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: HTML parser - checks viewport + responsive CSS
- **Example**: `"true"`
- **Description**: Whether page appears mobile-responsive

---

## CONTENT Category (6 data points)

### ✅ dp_body_content - Body Content
- **Crawl4AI Field**: `body_content`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: Crawl4AI markdown conversion
- **Example**: `"Open House & Creative Workshops | Nov 15...(3,457 words)"`
- **Description**: Main text content of the page in markdown format

### ✅ dp_word_count - Word Count
- **Crawl4AI Field**: `word_count`
- **Data Type**: INTEGER
- **Status**: EXTRACTED
- **Method**: Calculated from markdown content
- **Example**: `3457`
- **Description**: Total word count of page content

### ✅ dp_webpage_structure - Webpage Structure
- **Crawl4AI Field**: `webpage_structure`
- **Data Type**: JSON
- **Status**: EXTRACTED
- **Method**: HTML parser - analyzes HTML elements
- **Example**: `{'h1_count': 1, 'h2_count': 9, 'h3_count': 3, 'paragraph_count': 47, 'link_count': 142...}`
- **Description**: HTML structure analysis (heading counts, element counts)

### ⚠️ dp_schema_markup - Schema Markup
- **Crawl4AI Field**: `schema_markup`
- **Data Type**: JSON
- **Status**: NOT_ON_PAGE
- **Method**: HTML parser - `<script type='application/ld+json'>`
- **Example**: `null`
- **Description**: Structured data from JSON-LD or microdata

### 🔧 dp_salient_entities - Salient Entities
- **Crawl4AI Field**: `salient_entities`
- **Data Type**: JSON
- **Status**: REQUIRES_CUSTOM_LOGIC
- **Method**: Requires NLP (spaCy, OpenAI, etc.)
- **Example**: `null`
- **Description**: Key entities extracted from content (people, orgs, places)
- **Notes**: Not implemented - requires NLP/entity extraction integration

### 🔧 dp_body_content_embedding - Content Embedding
- **Crawl4AI Field**: `body_content_embedding`
- **Data Type**: VECTOR
- **Status**: REQUIRES_CUSTOM_LOGIC
- **Method**: Requires embeddings API (OpenAI, Anthropic, etc.)
- **Example**: `null`
- **Description**: Vector embedding of page content for semantic search
- **Notes**: Not implemented - requires vector embeddings integration

---

## LINKS Category (3 data points)

### ✅ dp_internal_links - Internal Links
- **Crawl4AI Field**: `internal_links`
- **Data Type**: JSON
- **Status**: EXTRACTED
- **Method**: Crawl4AI link extraction
- **Example**: `[{'href': 'https://lasallecollegevancouver.lcieducation.com/en/about-us', 'text': 'About Us'}...]`
- **Description**: Array of internal links found on the page

### ✅ dp_external_links - External Links
- **Crawl4AI Field**: `external_links`
- **Data Type**: JSON
- **Status**: EXTRACTED
- **Method**: Crawl4AI link extraction
- **Example**: `[{'href': 'https://lasalleinternational.com/...', 'text': 'Apply Now'}...]`
- **Description**: Array of external links found on the page

### ✅ dp_image_count - Image Count
- **Crawl4AI Field**: `image_count`
- **Data Type**: INTEGER
- **Status**: EXTRACTED
- **Method**: Crawl4AI media extraction
- **Example**: `29`
- **Description**: Total number of images on the page

---

## MEDIA Category (2 data points)

### ✅ dp_screenshot_url - Thumbnail Screenshot
- **Crawl4AI Field**: `screenshot_url`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: Crawl4AI screenshot capture (base64 PNG)
- **Example**: `"Qk2+lXcBAAAAADYAAAA...(24.6 MB base64)"`
- **Description**: URL or path to viewport screenshot
- **Notes**: Base64 string - should be saved to file and store path

### ✅ dp_screenshot_full_url - Full Screenshot
- **Crawl4AI Field**: `screenshot_full_url`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: Crawl4AI screenshot capture (base64 PNG)
- **Example**: `"Qk2+lXcBAAAAADYAAAA...(24.6 MB base64)"`
- **Description**: URL or path to full-page screenshot
- **Notes**: Same as screenshot_url in Crawl4AI v0.7.6

---

## TECHNICAL Category (16 data points)

### ✅ dp_url - Page URL
- **Crawl4AI Field**: `url`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: Crawl4AI result.url
- **Example**: `"https://lasallecollegevancouver.lcieducation.com/en/programs-and-courses/diploma-accounting-and-bookkeeping"`
- **Description**: Full URL of the crawled page

### ✅ dp_status_code - HTTP Status Code
- **Crawl4AI Field**: `status_code`
- **Data Type**: INTEGER
- **Status**: EXTRACTED
- **Method**: Crawl4AI result.status_code
- **Example**: `307`
- **Description**: HTTP status code returned by server

### ✅ dp_success - Crawl Success
- **Crawl4AI Field**: `success`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: Crawl4AI result.success
- **Example**: `"true"`
- **Description**: Whether the crawl was successful

### ✅ dp_error_message - Error Message
- **Crawl4AI Field**: `error_message`
- **Data Type**: STRING
- **Status**: EXTRACTED
- **Method**: Crawl4AI result.error_message
- **Example**: `null`
- **Description**: Error message if crawl failed
- **Notes**: NULL for successful crawls

### 🔧 dp_last_crawled_at - Last Crawled
- **Crawl4AI Field**: `last_crawled_at`
- **Data Type**: DATETIME
- **Status**: REQUIRES_CUSTOM_LOGIC
- **Method**: Application-managed timestamp
- **Example**: `null`
- **Description**: Timestamp when page was last crawled
- **Notes**: Set by application when saving ClientPage record

### 🔧 dp_last_checked_at - Last Checked
- **Crawl4AI Field**: `last_checked_at`
- **Data Type**: DATETIME
- **Status**: REQUIRES_CUSTOM_LOGIC
- **Method**: Application-managed timestamp
- **Example**: `null`
- **Description**: Timestamp when page status was last checked
- **Notes**: Set by application when re-checking page

### 🔧 dp_redirected_url - Redirected URL
- **Crawl4AI Field**: `result.redirected_url`
- **Data Type**: STRING
- **Status**: REQUIRES_CUSTOM_LOGIC
- **Method**: Requires redirect chain tracking
- **Example**: `null`
- **Description**: Final URL after following redirects
- **Notes**: Not currently tracked by Crawl4AI

### ❌ dp_ssl_valid_until - SSL Valid Until
- **Crawl4AI Field**: `ssl_certificate.valid_until`
- **Data Type**: DATETIME
- **Status**: NOT_WORKING
- **Method**: Crawl4AI fetch_ssl_certificate=True
- **Example**: `null`
- **Description**: SSL certificate expiration date
- **Notes**: Config enabled but not returning data in v0.7.6

### ❌ dp_ssl_days_until_expiry - SSL Days Until Expiry
- **Crawl4AI Field**: `ssl_certificate.days_until_expiry`
- **Data Type**: INTEGER
- **Status**: NOT_WORKING
- **Method**: Crawl4AI fetch_ssl_certificate=True
- **Example**: `null`
- **Description**: Days until SSL certificate expires
- **Notes**: Config enabled but not returning data in v0.7.6

### ❌ dp_has_ssl_certificate - Has SSL Certificate
- **Crawl4AI Field**: `has_ssl_certificate`
- **Data Type**: STRING
- **Status**: NOT_WORKING
- **Method**: Crawl4AI fetch_ssl_certificate=True
- **Example**: `null`
- **Description**: Whether page has valid SSL certificate
- **Notes**: Config enabled but not returning data in v0.7.6

---

## Legend

- ✅ **EXTRACTED**: Successfully extracted from test page (23 data points)
- ⚠️ **NOT_ON_PAGE**: Data point not present on test page (6 data points)
- 🔧 **REQUIRES_CUSTOM_LOGIC**: Needs additional implementation (5 data points)
- ❌ **NOT_WORKING**: Configuration issue or bug (3 data points)

---

## Implementation Files

| Component | File Path |
|-----------|-----------|
| Model | `app/models.py` (lines 82-591) |
| Migration | `migrations/versions/99898f8234b9_add_data_point_definition_model.py` |
| HTML Parser | `app/services/html_parser_service.py` |
| Test Script | `test_extraction_enhanced.py` |
| Seed Script (Base) | `app/commands/seed_data_points.py` |
| Seed Script (Phase 1) | `app/commands/seed_phase1_data_points.py` |

---

## Configuration

```python
# Crawl4AI Configuration
BrowserConfig(
    headless=True,
    verbose=False,
    extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"]
)

CrawlerRunConfig(
    screenshot=True,
    screenshot_wait_for=1.0,
    fetch_ssl_certificate=True,
    page_timeout=60000,
    wait_until="domcontentloaded",
    word_count_threshold=1,
    verbose=False
)
```

---

## Test Results

**Test URL**: https://lasallecollegevancouver.lcieducation.com/en/programs-and-courses/diploma-accounting-and-bookkeeping

- **Total Data Points**: 44
- **Successfully Extracted**: 23 (52.3%)
- **Not on Test Page**: 6 (13.6%)
- **Requires Custom Logic**: 5 (11.4%)
- **Not Working**: 3 (6.8%)
- **Screenshot Size**: 24.6 MB
- **Content Word Count**: 3,457 words
- **Extraction Time**: ~4-6 seconds per page

---

**Generated**: 2025-01-11
**Version**: 1.0.0
