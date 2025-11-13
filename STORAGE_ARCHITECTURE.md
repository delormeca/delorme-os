# Storage Architecture & Multi-Client Data Management

**Date**: 2025-11-12
**Status**: 📋 Design Document
**Author**: Architecture Planning Session

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Current Architecture Analysis](#current-architecture-analysis)
4. [Recommended Architecture](#recommended-architecture)
5. [Detailed Implementation](#detailed-implementation)
6. [Database Schema Changes](#database-schema-changes)
7. [API Endpoints](#api-endpoints)
8. [n8n Workflow Integration](#n8n-workflow-integration)
9. [Monthly Crawl Strategy](#monthly-crawl-strategy)
10. [Cost Analysis](#cost-analysis)
11. [Migration Path](#migration-path)
12. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

### The Challenge

**Delorme OS** is a multi-client SaaS platform that extracts and stores SEO data from client websites. With plans to:
- Run **monthly full crawls** for all clients
- **Maximum 50 clients** in the system
- Store **24+ data points per page** (titles, meta descriptions, schema markup, screenshots, etc.)
- Generate **workflow outputs** (optimization plans, audits, reports) via **n8n integration**
- Maintain **historical data** for trend analysis and comparison

The current **single PostgreSQL database** approach will face:
- ❌ Rapid database bloat (even with 50 clients)
- ❌ Query performance degradation
- ❌ Expensive backups
- ❌ No structured file storage for PDFs, reports, screenshots
- ❌ Loss of historical data when overwriting

### The Solution

**Hybrid Architecture: PostgreSQL + S3 Object Storage**

```
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                        │
│  • Client metadata (always current)                         │
│  • Latest 3 months of crawl data (hot storage)              │
│  • CrawlRun history (metadata only)                         │
│  • Workflow output references                               │
└─────────────────────────────────────────────────────────────┘
                          +
┌─────────────────────────────────────────────────────────────┐
│  S3 Object Storage (Per-Client Folders)                     │
│  • /clients/{slug}/crawls/{date}/ - Full crawl archives     │
│  • /clients/{slug}/workflows/ - n8n output files            │
│  • /clients/{slug}/reports/ - Generated reports             │
│  • /clients/{slug}/assets/ - Client files                   │
└─────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ Keeps database lean (< 10 GB for 100 clients)
- ✅ Unlimited historical storage (~$1/month)
- ✅ Per-client folder organization
- ✅ Easy n8n workflow integration
- ✅ Fast queries on recent data
- ✅ Simple backup and recovery

---

## Problem Statement

### Current Requirements

1. **Monthly Full Crawls**
   - **Maximum 50 clients** (fixed capacity)
   - Average 500 pages per client
   - 24 data points per page
   - ~50 KB of data per page
   - Monthly data: 50 × 500 × 50 KB = **1.25 GB/month**
   - Annual accumulation: **15 GB/year**

2. **Workflow Outputs (n8n Integration)**
   - Optimization plans (PDFs, JSON)
   - SEO audits (PDFs, Markdown)
   - Content analysis reports
   - Custom client reports
   - Must be stored **per-client** in organized folders

3. **Historical Data**
   - Compare month-over-month changes
   - Track SEO improvements
   - Identify content trends
   - Generate historical reports

### Current Architecture Problems

| Problem | Impact | Urgency |
|---------|--------|---------|
| **Database bloat** | 1.25 GB/month → 15 GB/year → 75 GB in 5 years | 🟡 Medium |
| **No file storage** | Screenshots as base64 strings in DB | 🔴 High |
| **Overwriting data** | Lose historical comparison ability | 🟡 Medium |
| **Query slowdown** | With 50 clients, manageable but growing | 🟢 Low |
| **No workflow storage** | Where do n8n outputs go? | 🔴 High |
| **Expensive backups** | Full DB backup includes all historical data | 🟢 Low |

---

## Current Architecture Analysis

### Database Models

#### Current Structure (from `app/models.py`)

```python
class Client(UUIDModelBase, table=True):
    """Single client/company"""
    name: str
    slug: str  # "lasalle-college", "nike"
    website_url: str
    sitemap_url: str
    created_by: uuid.UUID  # User who created

    # Relationships
    client_pages: List["ClientPage"]  # All pages
    engine_setup_runs: List["EngineSetupRun"]


class ClientPage(UUIDModelBase, table=True):
    """Page with extracted data"""
    client_id: uuid.UUID  # FK to Client
    url: str

    # 24 data points
    page_title: str
    meta_description: str
    h1: str
    canonical_url: str
    word_count: int
    body_content: str  # Full markdown content
    schema_markup: dict  # JSON
    internal_links: dict  # JSON array
    external_links: dict  # JSON array
    screenshot_url: str  # ❌ Currently base64 string!
    # ... 14 more fields

    last_crawled_at: datetime
    crawl_run_id: uuid.UUID


class CrawlRun(UUIDModelBase, table=True):
    """Tracks a crawl execution"""
    client_id: uuid.UUID
    run_type: str  # 'full', 'selective', 'manual'
    status: str
    total_pages: int
    successful_pages: int
    failed_pages: int

    # Cost tracking
    actual_cost: float
    api_costs: dict

    started_at: datetime
    completed_at: datetime
```

### Current Data Flow

```
1. User triggers "Start Data Extraction"
   ↓
2. POST /api/page-crawl/start
   ↓
3. Create CrawlRun record (status: "pending")
   ↓
4. APScheduler background task starts
   ↓
5. For each ClientPage URL:
   ├─ Crawl4AI extracts data
   ├─ Parse 24 data points
   └─ UPDATE ClientPage (overwrite existing data!)  ❌
   ↓
6. Mark CrawlRun as "completed"
   ↓
7. Frontend shows updated data
```

**Problem**: Step 5 **overwrites** existing data. No historical tracking!

---

## Recommended Architecture

### Hybrid: Database + S3 Storage

#### What Goes Where?

| Data Type | Storage | Retention | Why |
|-----------|---------|-----------|-----|
| **Client metadata** | PostgreSQL | Forever | Fast queries, frequently accessed |
| **Latest crawl data** | PostgreSQL | 3 months | Fast dashboard display |
| **Historical crawls** | S3 (archived) | Forever | Long-term storage, infrequent access |
| **Screenshots** | S3 | Forever | Too large for DB (base64) |
| **Workflow outputs** | S3| Forever | PDFs, reports, JSON files |
| **CrawlRun metadata** | PostgreSQL | Forever | Lightweight, needed for UI |

#### S3 Folder Structure

```
s3://delorme-os-storage/
│
├─ clients/
│  │
│  ├─ lasalle-college/                    ← Client slug
│  │  ├─ metadata.json                    ← Client info snapshot
│  │  │
│  │  ├─ crawls/                          ← Monthly full crawls
│  │  │  ├─ 2025-01-15/
│  │  │  │  ├─ manifest.json              ← Crawl metadata
│  │  │  │  ├─ pages.jsonl.gz             ← All pages (compressed)
│  │  │  │  ├─ summary.json               ← Quick stats
│  │  │  │  ├─ screenshots/
│  │  │  │  │  ├─ homepage.png
│  │  │  │  │  ├─ about.png
│  │  │  │  │  └─ ...
│  │  │  │  └─ errors.json                ← Failed pages
│  │  │  │
│  │  │  ├─ 2025-02-15/
│  │  │  ├─ 2025-03-15/
│  │  │  └─ ...
│  │  │
│  │  ├─ workflows/                       ← n8n outputs
│  │  │  ├─ optimization-plans/
│  │  │  │  ├─ 2025-01-20_v1.pdf
│  │  │  │  └─ 2025-01-20_v1.json        ← Structured data
│  │  │  │
│  │  │  ├─ seo-audits/
│  │  │  │  ├─ 2025-01-25_technical.pdf
│  │  │  │  └─ 2025-01-25_technical.json
│  │  │  │
│  │  │  ├─ content-analysis/
│  │  │  │  └─ 2025-02-01_gap-analysis.json
│  │  │  │
│  │  │  └─ custom-reports/
│  │  │     └─ q1-2025-executive-summary.pdf
│  │  │
│  │  ├─ reports/                         ← Generated reports
│  │  │  ├─ monthly/
│  │  │  │  ├─ 2025-01.pdf
│  │  │  │  ├─ 2025-02.pdf
│  │  │  │  └─ 2025-03.pdf
│  │  │  │
│  │  │  └─ custom/
│  │  │     └─ executive-summary-q1.pdf
│  │  │
│  │  └─ assets/                          ← Client files
│  │     ├─ logo.png
│  │     ├─ brand-colors.json
│  │     └─ style-guide.pdf
│  │
│  ├─ nike/
│  │  └─ (same structure)
│  │
│  └─ adidas/
│     └─ (same structure)
```

#### Archive File Format: JSON Lines (JSONL)

**Why JSON Lines?**
- ✅ Streaming-friendly (can read line-by-line)
- ✅ Better compression than regular JSON
- ✅ Easy to append new entries
- ✅ Compatible with data processing tools (pandas, spark)

**Example: `pages.jsonl.gz`**

```jsonl
{"id":"uuid-1","url":"https://example.com/","page_title":"Home","word_count":850,...}
{"id":"uuid-2","url":"https://example.com/about","page_title":"About Us","word_count":620,...}
{"id":"uuid-3","url":"https://example.com/contact","page_title":"Contact","word_count":340,...}
```

Each line = one page (complete JSON object). Compressed with gzip.

---

## Detailed Implementation

### 1. Storage Service Layer

**File**: `app/services/storage_service.py`

**Responsibilities:**
- Upload/download files to/from S3
- Generate presigned URLs for temporary access
- Manage client folder structure
- Handle compression/decompression

**Key Methods:**

```python
class StorageService:
    """Service for S3 operations"""

    # Path generators
    def get_client_base_path(client_slug: str) -> str
    def get_crawl_archive_path(client_slug: str, date: datetime) -> str
    def get_workflow_output_path(client_slug: str, workflow_name: str, timestamp: datetime) -> str

    # Upload operations
    async def upload_file(content: bytes, key: str, content_type: str, compress: bool) -> str
    async def upload_json(data: dict, key: str, compress: bool) -> str
    async def upload_jsonl(items: List[dict], key: str, compress: bool) -> str

    # Download operations
    async def download_file(key: str, decompress: bool) -> bytes
    async def download_json(key: str) -> dict
    async def download_jsonl(key: str) -> List[dict]

    # List operations
    async def list_client_crawls(client_slug: str) -> List[dict]
    async def list_workflow_outputs(client_slug: str, workflow_name: str) -> List[dict]

    # Presigned URLs
    async def generate_presigned_url(key: str, expiration: int) -> str
```

**Example Usage:**

```python
# Upload a crawl archive
storage = StorageService()

pages_data = [
    {"url": "https://example.com/", "page_title": "Home", ...},
    {"url": "https://example.com/about", "page_title": "About", ...},
]

s3_path = await storage.upload_jsonl(
    items=pages_data,
    key="clients/lasalle-college/crawls/2025-01-15/pages.jsonl",
    compress=True,
)
# Returns: "s3://bucket/clients/lasalle-college/crawls/2025-01-15/pages.jsonl.gz"
```

---

### 2. Archive Service

**File**: `app/services/archive_service.py`

**Responsibilities:**
- Archive completed crawls to S3
- Retrieve archived crawls from S3
- Compare two crawls for diff analysis
- Clean up old database records

**Key Methods:**

```python
class ArchiveService:
    """Service for archiving crawl data"""

    async def archive_crawl_run(crawl_run_id: UUID, include_screenshots: bool) -> dict
    async def retrieve_archived_crawl(crawl_run_id: UUID) -> dict
    async def compare_crawls(crawl_run_id_1: UUID, crawl_run_id_2: UUID) -> dict
    async def cleanup_old_crawl_data(days_to_keep: int) -> int
```

**Archive Process:**

```python
# After crawl completes
archive_service = ArchiveService(db)

result = await archive_service.archive_crawl_run(
    crawl_run_id=crawl_run.id,
    include_screenshots=True,
)

# Returns:
{
    "archive_path": "s3://bucket/clients/lasalle/crawls/2025-01-15/",
    "files": {
        "pages": "s3://bucket/clients/lasalle/crawls/2025-01-15/pages.jsonl.gz",
        "manifest": "s3://bucket/clients/lasalle/crawls/2025-01-15/manifest.json",
        "summary": "s3://bucket/clients/lasalle/crawls/2025-01-15/summary.json",
    },
    "summary": {
        "total_pages": 487,
        "successful_pages": 485,
        "failed_pages": 2,
        "avg_word_count": 842,
        "pages_with_schema": 123,
    }
}
```

**Manifest File Structure:**

```json
{
  "archive_metadata": {
    "crawl_run_id": "abc-123-uuid",
    "client_id": "xyz-789-uuid",
    "client_name": "LaSalle College",
    "client_slug": "lasalle-college",
    "archive_date": "2025-01-15T00:00:00Z",
    "archived_at": "2025-01-15T03:45:22Z"
  },
  "crawl_statistics": {
    "run_type": "monthly_full",
    "total_pages": 487,
    "successful_pages": 485,
    "failed_pages": 2,
    "data_points_extracted": [
      "page_title", "meta_description", "h1", "canonical_url",
      "word_count", "schema_markup", "internal_links", "external_links"
    ]
  },
  "cost_tracking": {
    "estimated_cost": 2.45,
    "actual_cost": 2.38,
    "api_costs": {
      "openai_embeddings": {"requests": 485, "tokens": 364200, "cost_usd": 0.073},
      "google_nlp": {"requests": 485, "cost_usd": 0.24}
    }
  },
  "timing": {
    "started_at": "2025-01-15T00:15:00Z",
    "completed_at": "2025-01-15T03:42:18Z",
    "duration_minutes": 207
  },
  "performance": {
    "avg_time_per_page": 25.6,
    "pages_per_minute": 2.34
  },
  "files": {
    "pages": "crawls/2025-01-15/pages.jsonl.gz",
    "manifest": "crawls/2025-01-15/manifest.json",
    "summary": "crawls/2025-01-15/summary.json"
  }
}
```

---

### 3. Workflow Service (n8n Integration)

**File**: `app/services/workflow_service.py`

**Responsibilities:**
- Trigger n8n workflows with client data
- Handle callbacks from n8n with output files
- Store workflow outputs to S3
- Generate download URLs

**Key Methods:**

```python
class WorkflowService:
    """Service for n8n workflow integration"""

    async def trigger_workflow(
        client_id: UUID,
        workflow_name: str,
        workflow_id: str,
        input_params: dict,
        triggered_by: UUID,
    ) -> WorkflowOutput

    async def handle_workflow_callback(
        workflow_output_id: UUID,
        output_content: bytes,
        output_type: str,
        content_type: str,
        preview_data: dict,
    ) -> WorkflowOutput

    async def get_workflow_output_download_url(
        workflow_output_id: UUID,
        expiration: int,
    ) -> str
```

**Workflow Integration Flow:**

```
┌─────────────────────────────────────────────────┐
│  1. User clicks "Generate Optimization Plan"    │
│     in Delorme OS UI                            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  2. POST /api/workflows/trigger                 │
│     {                                           │
│       client_id: "abc-123",                     │
│       workflow_name: "optimization-plan",       │
│       workflow_id: "n8n-webhook-id",            │
│       input_params: {                           │
│         pages: ["url1", "url2"],                │
│         focus_areas: ["technical", "content"]   │
│       }                                         │
│     }                                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  3. Create WorkflowOutput record (status:       │
│     "pending")                                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  4. HTTP POST to n8n webhook                    │
│     https://n8n.example.com/webhook/abc123      │
│     {                                           │
│       workflow_output_id: "xyz-789",            │
│       client_id: "abc-123",                     │
│       client_name: "LaSalle College",           │
│       callback_url: "https://api.../callback",  │
│       ...input_params                           │
│     }                                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  5. n8n Workflow Executes                       │
│     ├─ Fetch client data from Delorme OS API   │
│     ├─ Analyze SEO issues                       │
│     ├─ Generate recommendations                 │
│     └─ Create PDF report                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  6. n8n calls back with result                  │
│     POST /api/workflows/callback                │
│     {                                           │
│       workflow_output_id: "xyz-789",            │
│       output_file: <PDF bytes>,                 │
│       preview_data: {                           │
│         summary: "15 issues found",             │
│         priority_count: 8                       │
│       }                                         │
│     }                                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  7. Save to S3                                  │
│     s3://bucket/clients/lasalle-college/        │
│     workflows/optimization-plans/               │
│     2025-01-20_14-30-00.pdf                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  8. Update WorkflowOutput (status: "completed") │
│     Store S3 path, preview data                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  9. User downloads via presigned URL            │
│     GET /api/workflows/{id}/download            │
│     → Returns temporary download link           │
└─────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Models to Add

#### 1. WorkflowOutput Model

```python
class WorkflowOutput(UUIDModelBase, table=True):
    """Track n8n workflow outputs per client"""
    __tablename__ = "workflow_output"

    # Relationships
    client_id: uuid.UUID = Field(foreign_key="client.id", index=True)
    triggered_by: uuid.UUID = Field(foreign_key="user.id")

    # Workflow identification
    workflow_name: str = Field(index=True)
    # Examples: "optimization-plan", "seo-audit", "content-analysis"

    workflow_id: str
    # n8n workflow ID or webhook URL

    # Input parameters
    input_params: dict = Field(sa_column=Column(JSON))
    # {"pages": ["url1", "url2"], "focus": "technical-seo"}

    # Status tracking
    status: str = Field(default="pending", index=True)
    # "pending", "processing", "completed", "failed"

    # Output storage
    output_type: Optional[str] = None
    # "pdf", "json", "markdown", "csv"

    s3_path: Optional[str] = None
    # "s3://bucket/clients/slug/workflows/name/timestamp.pdf"

    # Quick preview (optional, for dashboard display)
    preview_data: Optional[dict] = Field(sa_column=Column(JSON))
    # {"summary": "Found 15 issues", "priority_count": 8}

    # Timestamps
    created_at: datetime = Field(default_factory=get_utcnow)
    completed_at: Optional[datetime] = None
```

**Indexes:**
- `client_id` - Filter outputs by client
- `workflow_name` - Filter by workflow type
- `status` - Filter by completion status
- `created_at` - Sort by date

#### 2. Modify CrawlRun Model

Add fields for archiving:

```python
class CrawlRun(UUIDModelBase, table=True):
    # ... existing fields ...

    # NEW: S3 archive reference
    s3_archive_path: Optional[str] = Field(default=None)
    # "s3://bucket/clients/lasalle-college/crawls/2025-01-15/"

    # NEW: Quick summary (stored in DB for fast access)
    summary: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    # {
    #   "total_pages": 487,
    #   "avg_word_count": 842,
    #   "pages_with_schema": 123,
    #   "top_errors": [...]
    # }
```

#### 3. Modify ClientPage Model

Add archive tracking:

```python
class ClientPage(UUIDModelBase, table=True):
    # ... existing fields ...

    # NEW: Reference to archived versions
    archived_crawls: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Map of dates to S3 archive paths"
    )
    # {
    #   "2025-01": "s3://bucket/clients/slug/crawls/2025-01-15/",
    #   "2025-02": "s3://bucket/clients/slug/crawls/2025-02-15/",
    # }
```

### Database Migration

**Create migration:**

```bash
task db:migrate-create -- "add_s3_storage_support"
```

**Migration file** (`migrations/versions/xxx_add_s3_storage_support.py`):

```python
"""Add S3 storage support for archiving and workflows

Revision ID: xxx
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Add workflow_output table
    op.create_table(
        'workflow_output',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('triggered_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workflow_name', sa.String(), nullable=False),
        sa.Column('workflow_id', sa.String(), nullable=False),
        sa.Column('input_params', postgresql.JSON(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('output_type', sa.String(), nullable=True),
        sa.Column('s3_path', sa.String(), nullable=True),
        sa.Column('preview_data', postgresql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['client.id']),
        sa.ForeignKeyConstraint(['triggered_by'], ['user.id']),
    )

    op.create_index('ix_workflow_output_client_id', 'workflow_output', ['client_id'])
    op.create_index('ix_workflow_output_workflow_name', 'workflow_output', ['workflow_name'])
    op.create_index('ix_workflow_output_status', 'workflow_output', ['status'])

    # Add s3_archive_path to crawl_run
    op.add_column('crawl_run', sa.Column('s3_archive_path', sa.String(), nullable=True))
    op.add_column('crawl_run', sa.Column('summary', postgresql.JSON(), nullable=True))

    # Add archived_crawls to client_page
    op.add_column('client_page', sa.Column('archived_crawls', postgresql.JSON(), nullable=True))

def downgrade():
    op.drop_column('client_page', 'archived_crawls')
    op.drop_column('crawl_run', 'summary')
    op.drop_column('crawl_run', 's3_archive_path')
    op.drop_table('workflow_output')
```

---

## API Endpoints

### Archive Endpoints

**File**: `app/controllers/archive.py`

```python
@router.post("/archive/crawl/{crawl_run_id}")
async def archive_crawl(
    crawl_run_id: uuid.UUID,
    include_screenshots: bool = False,
):
    """Archive a completed crawl run to S3"""
    # Implementation in ArchiveService

@router.get("/archive/crawl/{crawl_run_id}")
async def get_archived_crawl(crawl_run_id: uuid.UUID):
    """Retrieve archived crawl data from S3"""
    # Returns manifest + pages

@router.get("/archive/client/{client_id}/list")
async def list_archived_crawls(client_id: uuid.UUID):
    """List all archived crawls for a client"""
    # Returns list of available archives

@router.post("/archive/compare")
async def compare_crawls(
    crawl_run_id_1: uuid.UUID,
    crawl_run_id_2: uuid.UUID,
):
    """Compare two crawls and return diff"""
    # Returns added/removed/changed pages
```

### Workflow Endpoints

**File**: `app/controllers/workflows.py`

```python
@router.post("/workflows/trigger")
async def trigger_workflow(
    request: WorkflowTriggerRequest,
    client_id: uuid.UUID,
):
    """
    Trigger n8n workflow for client

    Request body:
    {
      "workflow_name": "optimization-plan",
      "workflow_id": "n8n-webhook-id",
      "input_params": {
        "pages": ["url1", "url2"],
        "focus_areas": ["technical", "content"]
      }
    }
    """

@router.post("/workflows/callback")
async def workflow_callback(
    workflow_output_id: uuid.UUID,
    output_file: UploadFile,
    preview_data: Optional[str] = None,
):
    """
    Callback from n8n with workflow result
    Called by n8n when workflow completes
    """

@router.get("/workflows/{workflow_output_id}")
async def get_workflow_output(workflow_output_id: uuid.UUID):
    """Get workflow output details"""

@router.get("/workflows/{workflow_output_id}/download")
async def download_workflow_output(workflow_output_id: uuid.UUID):
    """Get presigned URL for downloading output file"""
    # Returns temporary download link (valid 1 hour)

@router.get("/workflows/client/{client_id}/list")
async def list_client_workflows(
    client_id: uuid.UUID,
    workflow_name: Optional[str] = None,
):
    """List all workflow outputs for a client"""
```

---

## n8n Workflow Integration

### Example n8n Workflow: Optimization Plan Generator

**Workflow Steps:**

1. **Webhook Trigger** - Receives data from Delorme OS
   - `workflow_output_id`: UUID
   - `client_id`: UUID
   - `client_name`: String
   - `pages`: Array of URLs to analyze
   - `callback_url`: Where to send result

2. **HTTP Request** - Fetch page data from Delorme OS API
   ```
   GET /api/clients/{client_id}/pages?urls[]={url1}&urls[]={url2}
   ```

3. **Code Node** - Analyze SEO issues
   ```javascript
   // Find missing meta descriptions
   const issues = [];
   for (const page of items) {
     if (!page.meta_description) {
       issues.push({
         url: page.url,
         issue: "Missing meta description",
         priority: "high"
       });
     }
     // ... more checks
   }
   return issues;
   ```

4. **PDF Generator Node** - Create report
   - Template: HTML with Handlebars
   - Output: PDF file

5. **HTTP Request** - Send result back to Delorme OS
   ```
   POST {callback_url}
   Body: multipart/form-data
     - workflow_output_id: UUID
     - output_file: PDF file
     - preview_data: JSON string {summary, priority_count}
   ```

### n8n Webhook URL Format

```
https://n8n.yourdomain.com/webhook/optimization-plan
https://n8n.yourdomain.com/webhook/seo-audit
https://n8n.yourdomain.com/webhook/content-analysis
```

### Environment Variables (n8n)

Add to n8n environment:

```bash
DELORME_API_URL=https://api.delorme-os.com
DELORME_API_KEY=your-api-key-here
```

---

## Monthly Crawl Strategy

### Automated Monthly Full Crawl

**Scheduled Task** (APScheduler):

```python
# app/tasks/scheduled_crawls.py

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job(
    CronTrigger(day=1, hour=0, minute=0),  # 1st of every month at midnight
    id='monthly_full_crawl',
    name='Run monthly full crawl for all clients',
)
async def run_monthly_full_crawl():
    """
    Triggered on the 1st of every month

    Process:
    1. Get all active clients
    2. For each client:
       a. Start full crawl
       b. Wait for completion
       c. Archive previous month's data
       d. Generate monthly report
    """
    clients = await get_all_active_clients()

    for client in clients:
        try:
            # 1. Start crawl
            crawl_run = await start_crawl(
                client_id=client.id,
                run_type="monthly_full"
            )

            # 2. Archive previous month (if exists)
            previous_month_runs = await get_previous_month_crawls(client.id)
            for old_run in previous_month_runs:
                if not old_run.s3_archive_path:
                    await archive_service.archive_crawl_run(old_run.id)

            # 3. Clean up old data (keep last 3 months only)
            await cleanup_old_data(client.id, days_to_keep=90)

            # 4. Generate monthly report
            await generate_monthly_report(client.id, crawl_run.id)

        except Exception as e:
            logger.error(f"Monthly crawl failed for {client.name}: {e}")
```

### Data Retention Policy

**Keep in Database:**
- Latest 3 months of crawl data
- All CrawlRun metadata (lightweight)
- All WorkflowOutput references

**Archive to S3:**
- Data older than 3 months
- Full page content
- Screenshots
- Historical comparisons

**Delete Permanently:**
- Nothing! (S3 storage is cheap)

**Cleanup Process:**

```python
# app/tasks/cleanup_tasks.py

async def cleanup_old_crawl_data(days_to_keep: int = 90):
    """
    Remove old crawl data from database after archiving

    Runs: Weekly
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

    # 1. Find old crawl runs
    statement = select(CrawlRun).where(
        CrawlRun.completed_at < cutoff_date,
        CrawlRun.s3_archive_path.is_(None)  # Not yet archived
    )
    old_runs = await db.execute(statement)

    for crawl_run in old_runs.scalars():
        # 2. Archive to S3 first
        await archive_service.archive_crawl_run(crawl_run.id)

        # 3. Delete page data (but keep CrawlRun metadata)
        await db.execute(
            update(ClientPage)
            .where(ClientPage.crawl_run_id == crawl_run.id)
            .values(
                # Clear large fields
                body_content=None,
                screenshot_url=None,
                screenshot_full_url=None,
            )
        )

    await db.commit()
    logger.info(f"Cleaned up {len(old_runs)} old crawl runs")
```

---

## Cost Analysis

### Storage Costs (AWS S3)

**Assumptions:**
- **50 clients** (maximum capacity)
- 500 pages per client (average)
- Monthly full crawl
- 24 data points per page
- ~50 KB per page (compressed)

**Calculation:**

```
Data per client per month:
  500 pages × 50 KB = 25 MB/client

Total per month:
  50 clients × 25 MB = 1.25 GB/month

Annual storage:
  1.25 GB × 12 months = 15 GB/year

S3 Standard pricing (first 50 TB):
  $0.023 per GB/month

Monthly cost (year 1):
  15 GB × $0.023 = $0.35/month

Add workflow outputs (~2.5 GB/year for 50 clients):
  2.5 GB × $0.023 = $0.06/month

Total S3 cost: ~$0.41/month or $4.92/year
```

### Alternative: Cloudflare R2 (Zero Egress Fees) - RECOMMENDED

```
Storage: $0.015/GB/month
15 GB × $0.015 = $0.23/month = $2.76/year

Benefit: No egress fees (S3 charges for downloads)

RECOMMENDED for 50 clients: Use Cloudflare R2
  - Cheaper storage
  - Free downloads (important for workflow outputs)
  - Better for small-scale operations
```

### Database Size Comparison

**Current approach (no archiving) - 50 clients:**
```
Year 1: 15 GB in database
Year 2: 30 GB
Year 3: 45 GB
Year 5: 75 GB

PostgreSQL pricing (Render):
  Standard: $7/month (10 GB limit) ❌ Not enough by Month 9
  Pro: $50/month (50 GB limit) ❌ Not enough by Year 3
  Pro Plus: $90/month (100 GB limit) ✅ Enough for 5 years

Year 5 cost: $90/month = $1,080/year ❌
```

**With archiving (3 months hot + R2 cold) - 50 clients:**
```
Hot data: 1.25 GB × 3 months = 3.75 GB
Cold data: R2 storage

PostgreSQL pricing:
  Standard: $7/month (10 GB) ✅ Plenty of room!

Cloudflare R2 pricing: $2.76/year (Year 1) → $13.80/year (Year 5)

Total Year 5 cost: $84/year + $13.80 = $97.80/year ✅

Savings: $1,080 - $97.80 = $982/year (91% reduction!)
```

### Key Insight for 50 Clients

With only 50 clients, the database approach is **more viable** than with 100+ clients, BUT:
- ✅ **Still recommended to use S3/R2** for workflow outputs (PDFs, reports)
- ✅ **Still beneficial to archive old crawls** (keeps DB fast, enables historical comparison)
- ✅ **Cost savings still significant** (~$980/year)
- ✅ **Future-proof** if you ever expand beyond 50 clients

**Alternative: Simplified Approach for 50 Clients**

If you want to minimize complexity:
1. **Keep all crawl data in PostgreSQL** (upgrade to Pro Plus: $90/month)
2. **Use S3/R2 ONLY for**:
   - Workflow outputs (PDFs, JSON files)
   - Screenshots (too large for DB)
   - Monthly report archives

This reduces implementation to just `StorageService` + `WorkflowService` (skip `ArchiveService`).

---

## Migration Path

### Phase 1: Setup S3 Storage (Week 1-2)

**Tasks:**
- [ ] Create S3 bucket or Cloudflare R2 account
- [ ] Add AWS credentials to environment
- [ ] Install `boto3` dependency: `poetry add boto3`
- [ ] Create `StorageService` class
- [ ] Write unit tests for upload/download
- [ ] Test with sample client data

**Environment Variables:**

```bash
# Add to local.env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=delorme-os-storage
```

**Config:**

```python
# app/config/base.py

class BaseConfig(BaseSettings):
    # ... existing fields ...

    # S3 Configuration
    aws_access_key_id: str = Field(default="")
    aws_secret_access_key: str = Field(default="")
    aws_region: str = Field(default="us-east-1")
    s3_bucket_name: str = Field(default="delorme-os-storage")
```

---

### Phase 2: Add Archive System (Week 3-4)

**Tasks:**
- [ ] Create database migration for new fields
- [ ] Implement `ArchiveService` class
- [ ] Add archive endpoints to API
- [ ] Test archiving with 1 client
- [ ] Verify retrieval works correctly
- [ ] Test comparison between two crawls

**Migration:**

```bash
task db:migrate-create -- "add_s3_storage_support"
# Edit migration file (see Database Schema Changes section)
task db:migrate-up
```

**Test Archive:**

```bash
# In Python shell
from app.services.archive_service import ArchiveService
from app.db import AsyncSessionLocal

async with AsyncSessionLocal() as db:
    service = ArchiveService(db)

    # Archive a crawl
    result = await service.archive_crawl_run(
        crawl_run_id="your-crawl-run-id",
        include_screenshots=True,
    )

    print(f"Archived to: {result['archive_path']}")

    # Retrieve it
    data = await service.retrieve_archived_crawl("your-crawl-run-id")
    print(f"Retrieved {len(data['pages'])} pages")
```

---

### Phase 3: Workflow Integration (Week 5-6)

**Tasks:**
- [ ] Add `WorkflowOutput` model
- [ ] Create migration
- [ ] Implement `WorkflowService` class
- [ ] Create workflow endpoints
- [ ] Set up test n8n workflow
- [ ] Test trigger → callback flow
- [ ] Test file download

**n8n Test Workflow:**

Create simple test workflow in n8n:
1. Webhook trigger
2. Code node (return dummy data)
3. HTTP request back to callback URL

Test with:
```bash
curl -X POST http://localhost:8000/api/workflows/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "your-client-id",
    "workflow_name": "test",
    "workflow_id": "your-n8n-webhook-id",
    "input_params": {}
  }'
```

---

### Phase 4: Automated Cleanup (Week 7-8)

**Tasks:**
- [ ] Implement cleanup scheduled task
- [ ] Add retention policy configuration
- [ ] Test cleanup with old data
- [ ] Create admin dashboard for monitoring
- [ ] Set up alerting for failed archives

**Scheduled Task:**

```python
# app/tasks/maintenance_tasks.py

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job(
    CronTrigger(day_of_week='sun', hour=2, minute=0),  # Every Sunday at 2 AM
    id='weekly_cleanup',
)
async def weekly_cleanup():
    """Archive old data and clean database"""
    await cleanup_old_crawl_data(days_to_keep=90)
```

---

### Phase 5: Monthly Crawl Automation (Week 9-10)

**Tasks:**
- [ ] Implement monthly crawl scheduled task
- [ ] Add automatic archiving after crawl
- [ ] Generate monthly reports
- [ ] Test with 2-3 clients
- [ ] Monitor for 1 month

---

## Implementation Checklist

### Prerequisites

- [x] PostgreSQL database (current)
- [ ] S3 bucket or Cloudflare R2 account
- [ ] n8n instance (if using workflows)
- [ ] AWS credentials or R2 API keys

### Code Changes

#### Backend

- [ ] Install dependencies
  - [ ] `poetry add boto3`
  - [ ] `poetry add python-multipart` (for file uploads)

- [ ] Create new service files
  - [ ] `app/services/storage_service.py`
  - [ ] `app/services/archive_service.py`
  - [ ] `app/services/workflow_service.py`

- [ ] Database changes
  - [ ] Create migration for `WorkflowOutput` table
  - [ ] Add `s3_archive_path` to `CrawlRun`
  - [ ] Add `summary` to `CrawlRun`
  - [ ] Add `archived_crawls` to `ClientPage`
  - [ ] Run migration

- [ ] API controllers
  - [ ] `app/controllers/archive.py`
  - [ ] `app/controllers/workflows.py`
  - [ ] Register routers in `main.py`

- [ ] Scheduled tasks
  - [ ] `app/tasks/scheduled_crawls.py` (monthly)
  - [ ] `app/tasks/cleanup_tasks.py` (weekly)

- [ ] Configuration
  - [ ] Add S3 config to `app/config/base.py`
  - [ ] Add to `local.env.example`

#### Frontend

- [ ] Generate new API client
  - [ ] `task frontend:generate-client`

- [ ] New pages/components
  - [ ] Workflow trigger button in ClientDetail
  - [ ] Workflow outputs list component
  - [ ] Archive browser component
  - [ ] Crawl comparison view

- [ ] API hooks
  - [ ] `useWorkflows.ts`
  - [ ] `useArchive.ts`

### Testing

- [ ] Unit tests
  - [ ] `StorageService` upload/download
  - [ ] `ArchiveService` archive/retrieve
  - [ ] `WorkflowService` trigger/callback

- [ ] Integration tests
  - [ ] Full archive cycle
  - [ ] Workflow trigger → callback → download
  - [ ] Cleanup task execution

- [ ] Manual testing
  - [ ] Archive 1 month of data
  - [ ] Retrieve and compare archives
  - [ ] Trigger workflow and download result
  - [ ] Verify S3 folder structure

### Deployment

- [ ] Add environment variables to production
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `S3_BUCKET_NAME`
  - [ ] `N8N_WEBHOOK_URL` (if applicable)

- [ ] Run database migration in production

- [ ] Monitor for issues
  - [ ] Check S3 upload success
  - [ ] Verify scheduled tasks running
  - [ ] Monitor database size

---

## Example Use Cases

### Use Case 1: Monthly SEO Report

**Scenario**: Generate a monthly report comparing current vs. previous month

**Steps:**
1. Monthly crawl completes on Feb 1st
2. Archive January crawl to S3
3. Compare Jan vs Feb data
4. Trigger n8n workflow "monthly-report"
5. n8n generates PDF with:
   - New pages added
   - Pages removed
   - Title/description changes
   - Word count trends
   - Schema markup improvements
6. PDF saved to `/clients/{slug}/reports/monthly/2025-02.pdf`
7. User downloads via presigned URL

### Use Case 2: Technical SEO Audit

**Scenario**: Client requests technical audit

**Steps:**
1. User clicks "Run Technical Audit" in ClientDetail page
2. Frontend calls `POST /api/workflows/trigger`
   ```json
   {
     "workflow_name": "technical-audit",
     "workflow_id": "n8n-tech-audit-webhook",
     "input_params": {
       "focus_areas": ["page-speed", "mobile", "crawlability"]
     }
   }
   ```
3. n8n workflow runs:
   - Fetches all client pages
   - Checks for missing canonical URLs
   - Identifies broken internal links
   - Finds pages with no H1
   - Checks mobile viewport settings
4. Generates audit report PDF
5. Calls back with result
6. Stored in `/clients/{slug}/workflows/technical-audits/2025-01-25.pdf`
7. User receives notification + download link

### Use Case 3: Content Gap Analysis

**Scenario**: Compare client content with competitor

**Steps:**
1. User provides competitor URL
2. Trigger workflow "content-gap-analysis"
3. n8n crawls competitor site (limited pages)
4. Compares:
   - Topic coverage
   - Keyword usage
   - Content depth (word count)
   - Schema markup adoption
5. Generates recommendations JSON
6. Stored in `/clients/{slug}/workflows/content-analysis/`
7. Frontend displays visual comparison

---

## Monitoring & Maintenance

### Metrics to Track

**Database:**
- Total size (should stay < 10 GB)
- Row counts per table
- Query performance (slow query log)

**S3:**
- Total storage used
- Costs per month
- Upload/download success rates

**Scheduled Tasks:**
- Monthly crawl completion rate
- Archive task success rate
- Cleanup task execution time

**Workflows:**
- Workflow trigger count
- Success/failure rates
- Average execution time

### Alerts to Configure

**Critical:**
- Database > 8 GB (approaching limit)
- Monthly crawl failed
- S3 upload failures

**Warning:**
- Workflow failure rate > 5%
- Archive task taking > 1 hour
- Cleanup task skipped

### Admin Dashboard

Create admin page showing:
- Storage usage (DB vs S3)
- Recent crawls status
- Workflow execution history
- Archive list with sizes
- Cost tracking

---

## Security Considerations

### S3 Bucket Security

**Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::delorme-os-storage/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalArn": "arn:aws:iam::ACCOUNT:user/delorme-os-backend"
        }
      }
    }
  ]
}
```

**Enable:**
- [x] Versioning (protect against accidental deletes)
- [x] Encryption at rest (AES-256)
- [x] Access logging
- [x] Block public access

### Presigned URLs

- Expire after 1 hour (configurable)
- One-time use recommended
- Log all downloads

### Workflow Security

- Validate `workflow_output_id` exists
- Verify client ownership
- Sanitize file uploads
- Virus scan PDFs (optional)

---

## FAQ

### Q: What if S3 goes down?

**A**: Implement fallback:
1. Retry uploads with exponential backoff
2. Queue failed uploads for later
3. Alert admins
4. Crawls continue, archiving happens when S3 recovers

### Q: How to migrate existing data to S3?

**A**: Run migration script:
```python
async def migrate_existing_crawls():
    """One-time migration of existing data to S3"""
    all_crawls = await get_all_completed_crawls()

    for crawl_run in all_crawls:
        if not crawl_run.s3_archive_path:
            await archive_service.archive_crawl_run(crawl_run.id)
            await asyncio.sleep(1)  # Rate limit
```

### Q: Can users download archived crawls?

**A**: Yes, via API:
```
GET /api/archive/crawl/{crawl_run_id}/download
→ Returns presigned URL valid for 1 hour
```

### Q: How to delete a client and all their data?

**A**: Cascade delete:
1. Delete from database (cascade deletes pages, crawls)
2. Delete S3 folder: `storage.delete_client_folder(client.slug)`

### Q: What about GDPR/data retention?

**A**: Configure retention policy:
- Archive for X years
- Implement deletion endpoint
- Log all access to client data

---

## Next Steps

1. **Review this document** with team
2. **Get approval** for architecture approach
3. **Set up S3/R2 account**
4. **Start Phase 1** implementation
5. **Test with 1-2 clients** before full rollout

---

## References

- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- Cloudflare R2: https://developers.cloudflare.com/r2/
- JSON Lines Format: https://jsonlines.org/
- boto3 (AWS SDK): https://boto3.amazonaws.com/v1/documentation/api/latest/index.html
- n8n Workflows: https://docs.n8n.io/

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Status**: Ready for Implementation
