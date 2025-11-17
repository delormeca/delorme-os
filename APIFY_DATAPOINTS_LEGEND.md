# Apify Crawler Data Points Legend

This document defines all data points collected by the Apify Website Content Crawler for SEO analysis and n8n workflow integration.

## Data Structure Overview

Each crawled page produces a **Page Result** object with a unique ID and comprehensive on-page SEO metrics.

## JSON Output Format

```json
{
  "crawl_run_id": "uuid",
  "client_id": "uuid",
  "crawled_at": "2025-11-17T20:00:00Z",
  "total_pages": 150,
  "pages": [
    {
      "id": "unique-page-id-uuid",
      "url": "https://example.com/page",
      "status_code": 200,
      "crawled_at": "2025-11-17T20:01:23Z",

      // Basic Metadata
      "title": "Page Title",
      "meta_description": "Meta description content",
      "canonical_url": "https://example.com/page",
      "language": "en",

      // Content Metrics
      "word_count": 1250,
      "paragraph_count": 15,
      "sentence_count": 45,
      "reading_time_minutes": 5,

      // Heading Structure
      "h1_count": 1,
      "h1_text": "Main Heading",
      "h2_count": 5,
      "h2_list": ["Subheading 1", "Subheading 2", ...],
      "h3_count": 8,
      "h4_count": 2,
      "h5_count": 0,
      "h6_count": 0,
      "heading_hierarchy_valid": true,

      // Links Analysis
      "internal_links_count": 25,
      "external_links_count": 8,
      "broken_links_count": 0,
      "nofollow_links_count": 3,
      "internal_links": [
        {"url": "/about", "anchor_text": "About Us", "is_broken": false},
        ...
      ],
      "external_links": [
        {"url": "https://external.com", "anchor_text": "Link", "is_nofollow": true},
        ...
      ],

      // Image Analysis
      "images_count": 12,
      "images_with_alt_count": 10,
      "images_without_alt_count": 2,
      "images_over_100kb_count": 3,
      "images": [
        {
          "src": "https://example.com/image.jpg",
          "alt": "Alt text",
          "width": 800,
          "height": 600,
          "file_size_kb": 125
        },
        ...
      ],

      // SEO Tags
      "meta_robots": "index,follow",
      "og_title": "Open Graph Title",
      "og_description": "OG Description",
      "og_image": "https://example.com/og-image.jpg",
      "og_type": "article",
      "twitter_card": "summary_large_image",
      "twitter_title": "Twitter Title",
      "twitter_description": "Twitter Description",
      "twitter_image": "https://example.com/twitter-image.jpg",

      // Schema.org / Structured Data
      "schema_types": ["Article", "BreadcrumbList"],
      "schema_json": [
        {"@type": "Article", "@context": "https://schema.org", ...},
        ...
      ],

      // Performance Indicators
      "load_time_ms": 1250,
      "page_size_kb": 450,
      "requests_count": 35,

      // Page Tags (for filtering and categorization)
      "tags": ["blog", "product-page", "category:marketing"],

      // SEO Issues (Auto-detected)
      "seo_issues": [
        {
          "severity": "error",
          "code": "MISSING_H1",
          "message": "Page is missing H1 tag"
        },
        {
          "severity": "warning",
          "code": "LOW_WORD_COUNT",
          "message": "Word count (250) is below recommended minimum (300)"
        },
        {
          "severity": "warning",
          "code": "IMAGES_NO_ALT",
          "message": "2 images are missing alt text"
        }
      ],

      // Content Extraction
      "markdown_content": "# Main Heading\n\nPage content in markdown...",
      "html_content": "<html>...</html>",
      "text_content": "Plain text content...",
      "screenshot_url": "https://storage.com/screenshot.png",

      // Additional Metadata
      "last_modified": "2025-11-15T10:30:00Z",
      "http_headers": {
        "content-type": "text/html; charset=utf-8",
        "server": "nginx",
        ...
      }
    }
  ]
}
```

## Data Point Categories

### 1. Core Identifiers
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `id` | UUID | Unique page result ID | Yes | `"550e8400-e29b-41d4-a716-446655440000"` |
| `url` | String | Page URL | Yes | `"https://example.com/page"` |
| `crawl_run_id` | UUID | Parent crawl run ID | Yes | `"650e8400-e29b-41d4-a716-446655440001"` |
| `client_id` | UUID | Client ID | Yes | `"750e8400-e29b-41d4-a716-446655440002"` |

### 2. HTTP Response
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `status_code` | Integer | HTTP status code | Yes | `200`, `404`, `500` |
| `crawled_at` | ISO DateTime | Timestamp of crawl | Yes | `"2025-11-17T20:01:23Z"` |
| `load_time_ms` | Integer | Page load time in ms | No | `1250` |
| `page_size_kb` | Integer | Total page size in KB | No | `450` |

### 3. Basic SEO Metadata
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `title` | String | Page `<title>` tag | No | `"Best SEO Tools 2025"` |
| `meta_description` | String | Meta description | No | `"Discover the top SEO tools..."` |
| `canonical_url` | String | Canonical URL | No | `"https://example.com/seo-tools"` |
| `language` | String | Page language (ISO 639-1) | No | `"en"` |
| `meta_robots` | String | robots meta tag | No | `"index,follow"` |

### 4. Content Metrics
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `word_count` | Integer | Total words on page | Yes | `1250` |
| `paragraph_count` | Integer | Number of `<p>` tags | No | `15` |
| `sentence_count` | Integer | Number of sentences | No | `45` |
| `reading_time_minutes` | Integer | Estimated reading time | No | `5` |

### 5. Heading Structure
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `h1_count` | Integer | Number of H1 tags | Yes | `1` |
| `h1_text` | String | H1 tag content | No | `"Main Heading"` |
| `h2_count` | Integer | Number of H2 tags | Yes | `5` |
| `h2_list` | Array[String] | List of all H2 content | No | `["Sub 1", "Sub 2"]` |
| `h3_count` | Integer | Number of H3 tags | Yes | `8` |
| `h4_count` | Integer | Number of H4 tags | Yes | `2` |
| `h5_count` | Integer | Number of H5 tags | Yes | `0` |
| `h6_count` | Integer | Number of H6 tags | Yes | `0` |
| `heading_hierarchy_valid` | Boolean | Headings in correct order | No | `true` |

### 6. Link Analysis
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `internal_links_count` | Integer | Internal links count | Yes | `25` |
| `external_links_count` | Integer | External links count | Yes | `8` |
| `broken_links_count` | Integer | Broken links (404) | Yes | `0` |
| `nofollow_links_count` | Integer | Links with rel=nofollow | No | `3` |
| `internal_links` | Array[Object] | Detailed internal links | No | See JSON example |
| `external_links` | Array[Object] | Detailed external links | No | See JSON example |

### 7. Image Analysis
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `images_count` | Integer | Total images on page | Yes | `12` |
| `images_with_alt_count` | Integer | Images with alt text | Yes | `10` |
| `images_without_alt_count` | Integer | Images missing alt text | Yes | `2` |
| `images_over_100kb_count` | Integer | Large images (>100KB) | No | `3` |
| `images` | Array[Object] | Detailed image data | No | See JSON example |

### 8. Social Media / Open Graph
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `og_title` | String | Open Graph title | No | `"OG Title"` |
| `og_description` | String | OG description | No | `"OG Description"` |
| `og_image` | String | OG image URL | No | `"https://example.com/og.jpg"` |
| `og_type` | String | OG content type | No | `"article"` |
| `twitter_card` | String | Twitter card type | No | `"summary_large_image"` |
| `twitter_title` | String | Twitter title | No | `"Twitter Title"` |
| `twitter_description` | String | Twitter description | No | `"Twitter Desc"` |
| `twitter_image` | String | Twitter image URL | No | `"https://example.com/tw.jpg"` |

### 9. Structured Data (Schema.org)
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `schema_types` | Array[String] | Schema.org types found | No | `["Article", "BreadcrumbList"]` |
| `schema_json` | Array[Object] | Full schema JSON-LD | No | See JSON example |

### 10. Page Tags
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `tags` | Array[String] | Custom categorization tags for filtering and workflows | Yes | `["blog", "product-page", "category:marketing"]` |

### 11. SEO Issues (Auto-detected)
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `seo_issues` | Array[Object] | List of detected issues | Yes | See JSON example |

#### SEO Issue Codes:
- `MISSING_TITLE` - No `<title>` tag
- `MISSING_META_DESCRIPTION` - No meta description
- `MISSING_H1` - No H1 tag
- `MULTIPLE_H1` - More than one H1
- `LOW_WORD_COUNT` - Word count < 300
- `HIGH_WORD_COUNT` - Word count > 5000
- `IMAGES_NO_ALT` - Images missing alt text
- `BROKEN_LINKS` - Contains broken links
- `NO_CANONICAL` - Missing canonical URL
- `DUPLICATE_TITLE` - Title same as another page
- `DUPLICATE_META_DESCRIPTION` - Meta desc same as another page
- `THIN_CONTENT` - Word count < 100
- `HEADING_HIERARCHY_INVALID` - Skipped heading levels (H1 → H3)

### 12. Content Extraction
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `markdown_content` | String | Page content in markdown | No | `"# Heading\n\nContent..."` |
| `html_content` | String | Full HTML source | No | `"<html>...</html>"` |
| `text_content` | String | Plain text extraction | No | `"Plain text..."` |
| `screenshot_url` | String | URL to screenshot | No | `"https://storage.com/shot.png"` |

## Column Visibility Configuration

Users can toggle which columns to display in the table view:

```json
{
  "visible_columns": [
    "url",
    "title",
    "status_code",
    "word_count",
    "h1_count",
    "images_with_alt_count",
    "internal_links_count",
    "tags",
    "seo_issues"
  ],
  "hidden_columns": [
    "html_content",
    "markdown_content",
    "schema_json",
    ...
  ]
}
```

## n8n Workflow Integration

The JSON output is designed for seamless n8n integration with unique page IDs for bi-directional data flow.

### Workflow 1: Read-Only Analysis
**Use Case**: Generate reports, send notifications, export to sheets

1. **Trigger**: Webhook from Apify crawl completion
2. **Input**: Full JSON with all page results
3. **Processing**:
   - Filter by tags: `pages.filter(p => p.tags.includes('blog'))`
   - Filter by SEO issues: `pages.filter(p => p.seo_issues.length > 0)`
   - Extract specific data points
   - Generate reports
4. **Output**:
   - Send to Google Sheets
   - Create Notion pages
   - Send Slack notifications

### Workflow 2: Update Page Data (e.g., Rewrite H1)
**Use Case**: AI rewrites H1 tags, then updates the page

#### Step 1: Receive Crawl Data from Apify
```json
{
  "crawl_run_id": "550e8400-e29b-41d4-a716-446655440000",
  "pages": [
    {
      "id": "page-uuid-1",
      "url": "https://example.com/blog/seo-tips",
      "h1_text": "Old H1 Title",
      "tags": ["blog", "needs-optimization"],
      "word_count": 450
    },
    {
      "id": "page-uuid-2",
      "url": "https://example.com/blog/marketing",
      "h1_text": "Another Old H1",
      "tags": ["blog"],
      "word_count": 800
    }
  ]
}
```

#### Step 2: Filter Pages in n8n
Filter by tag or criteria:
```javascript
// n8n Code Node
const pagesToUpdate = $json.pages.filter(page =>
  page.tags.includes('blog') &&
  page.word_count < 500
);

return pagesToUpdate;
```

#### Step 3: Process Each Page (AI Rewrite)
For each filtered page, send to OpenAI/Claude:
```json
{
  "page_id": "page-uuid-1",
  "current_h1": "Old H1 Title",
  "url": "https://example.com/blog/seo-tips",
  "prompt": "Rewrite this H1 to be more SEO-friendly and engaging"
}
```

#### Step 4: Send Updated Data Back via Webhook
**POST to**: `https://your-api.com/api/apify/pages/update`

**Payload** (one page at a time or batch):
```json
{
  "updates": [
    {
      "page_id": "page-uuid-1",
      "h1_text": "10 Proven SEO Tips to Boost Your Rankings in 2025"
    },
    {
      "page_id": "page-uuid-2",
      "h1_text": "Marketing Strategies That Actually Work"
    }
  ]
}
```

#### Required Fields for Updates:
- **`page_id`** (UUID) - REQUIRED - Identifies which page to update
- **Field to update** (e.g., `h1_text`, `meta_description`, `tags`) - The new value

#### Optional Update Fields:
```json
{
  "page_id": "page-uuid-1",
  "h1_text": "New H1",              // Update H1
  "meta_description": "New meta", // Update meta description
  "tags": ["blog", "updated"],    // Update tags
  "custom_notes": "AI optimized"  // Add custom metadata
}
```

### Example n8n Flow: Rewrite H1s for Blog Posts

```
[Webhook Trigger: Apify Completion]
         ↓
[Filter: pages with tag="blog" AND word_count < 500]
         ↓
[Split Into Items] (one per page)
         ↓
[OpenAI: Rewrite H1]
  Input: page_id, current_h1, url
  Output: page_id, new_h1
         ↓
[Batch Updates] (collect all updates)
         ↓
[HTTP Request: POST to /api/apify/pages/update]
  Body: {updates: [{page_id, h1_text}, ...]}
         ↓
[Slack Notification: "Updated 15 H1 tags"]
```

### Key IDs You Need:

| ID Type | Purpose | Example | When to Use |
|---------|---------|---------|-------------|
| `page_id` | Identify specific page for updates | `"550e8400-e29b..."` | **Required** for any update operation |
| `crawl_run_id` | Identify which crawl the data came from | `"650e8400-e29b..."` | For filtering/reporting on specific crawl runs |
| `client_id` | Identify which client the pages belong to | `"750e8400-e29b..."` | For multi-client workflows |
| `url` | The actual page URL | `"https://example.com/page"` | For reference, not for updates (use `page_id`) |

**IMPORTANT**: Always use `page_id` for updates, NOT `url`. URLs can change, but `page_id` is permanent.

## Performance Considerations

- **Pagination**: Default 25 rows per page (configurable: 25/50/100/200)
- **Lazy Loading**: Load data on-demand for large datasets
- **Search/Filter**: Client-side for < 1000 pages, server-side for larger
- **Export**: Support CSV, JSON, Excel export

## Implementation Notes

1. Each page result MUST have a unique `id` (UUID)
2. All data points are optional except `id`, `url`, `crawl_run_id`, `client_id`
3. SEO issues are auto-detected based on thresholds
4. Tags can be auto-assigned or manually added
5. JSON output compressed for storage, expanded for n8n
