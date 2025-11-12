# CLIENT MANAGEMENT & ENGINE SETUP - COMPREHENSIVE AUDIT

**Date:** November 10, 2025
**Application:** Velocity V2.0.1 - Full-Stack SaaS Boilerplate
**Scope:** Client Management System + Website Engine Setup

---

## EXECUTIVE SUMMARY

The Client Management and ENGINE Setup system is a sophisticated **website page discovery and SEO data extraction platform** built with modern full-stack architecture. The system allows users to:

1. **Manage Clients** - Create and organize client profiles
2. **Discover Pages** - Import website pages via sitemap or manual entry (ENGINE)
3. **Extract Data** - Crawl pages to extract 22 SEO data points
4. **Analyze Content** - Vector search and semantic analysis capabilities

**Architecture Quality:** Production-ready with clean separation of concerns, async background jobs, real-time progress tracking, and comprehensive error handling.

---

## 1. SYSTEM ARCHITECTURE

### 1.1 Technology Stack

| Layer | Technology | Version/Details |
|-------|-----------|-----------------|
| **Backend** | FastAPI | 0.115+ |
| **Database** | PostgreSQL | Via SQLModel ORM |
| **Migrations** | Alembic | Async migrations |
| **Background Jobs** | APScheduler | AsyncIOScheduler |
| **Frontend** | React | 18.x with TypeScript |
| **Build Tool** | Vite | 5.x (Dev server: localhost:5173) |
| **UI Library** | Material-UI | v6 |
| **State Management** | TanStack React Query | Client-side caching |
| **HTTP Client** | httpx | Async sitemap fetching |

### 1.2 Architecture Pattern

**Clean Architecture (3-Tier):**
```
┌─────────────────────────────────────────────┐
│         Controllers (HTTP Layer)             │
│    - Route handlers                          │
│    - Request validation                      │
│    - Response formatting                     │
│    - HTTP exception handling                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│          Services (Business Logic)           │
│    - Domain logic                            │
│    - Data validation                         │
│    - External API calls                      │
│    - Background job orchestration            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│         Models (Data Layer)                  │
│    - SQLModel entities                       │
│    - Database relationships                  │
│    - Constraints and indexes                 │
└─────────────────────────────────────────────┘
```

### 1.3 Request Flow Example

```
User clicks "Setup Website Engine" button
  │
  ├─> Frontend: EngineSetupModal opens
  │     └─> User selects: Sitemap mode
  │     └─> Enters sitemap URL
  │     └─> Submits form
  │
  ├─> React Hook: useStartEngineSetup()
  │     └─> POST /api/engine-setup/start
  │
  ├─> Backend Controller: engine_setup.py
  │     └─> Validates request body
  │     └─> Calls EngineSetupService.start_setup()
  │
  ├─> Service Layer: EngineSetupService
  │     └─> Creates EngineSetupRun record (status: pending)
  │     └─> Returns run_id to controller
  │
  ├─> Background Job Scheduler
  │     └─> Schedules run_sitemap_setup_task(run_id, sitemap_url)
  │     └─> APScheduler executes immediately via DateTrigger
  │
  ├─> Background Task Execution
  │     └─> Creates new async DB session
  │     └─> Updates status: in_progress
  │     └─> Parses sitemap XML
  │     └─> Validates URLs
  │     └─> Creates ClientPage records in batches (50/batch)
  │     └─> Updates progress_percentage after each batch
  │     └─> Updates status: completed
  │     └─> Sets Client.engine_setup_completed = true
  │
  └─> Frontend: Real-time Progress Tracking
        └─> useEngineSetupProgress(runId) polls every 2 seconds
        └─> GET /api/engine-setup/{run_id}/progress
        └─> Updates progress bar, current URL, success/failed counts
        └─> When status === 'completed', stops polling
        └─> Invalidates React Query cache
        └─> ClientDetail page refreshes with new data
```

---

## 2. DATABASE SCHEMA

### 2.1 Core Models

#### **Client** (`app/models.py:126-192`)

**Purpose:** Central entity representing a client organization/website.

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | str | UNIQUE, INDEXED, NOT NULL | Client name (prevents duplicates) |
| `description` | str | OPTIONAL | Client description |
| `website_url` | str | OPTIONAL | Main website URL |
| `sitemap_url` | str | OPTIONAL | Sitemap URL for discovery |
| `industry` | str | OPTIONAL | Client industry |
| `logo_url` | str | OPTIONAL | Logo URL |
| `crawl_frequency` | str | DEFAULT: "Manual Only" | Crawl schedule |
| `status` | str | DEFAULT: "Active", INDEXED | Client status |
| `page_count` | int | DEFAULT: 0 | Total discovered pages |
| `created_by` | UUID | FK → User | Creator user ID |
| `project_lead_id` | UUID | FK → ProjectLead, OPTIONAL | Assigned project lead |
| `created_at` | datetime | AUTO | Creation timestamp |
| `updated_at` | datetime | AUTO | Last update timestamp |
| **ENGINE FIELDS:** | | | |
| `engine_setup_completed` | bool | INDEXED, DEFAULT: false | Setup status flag |
| `last_setup_run_id` | UUID | FK → EngineSetupRun, OPTIONAL | Most recent setup run |

**Relationships:**
```python
project_lead: ProjectLead          # Many-to-One
projects: List[Project]            # One-to-Many
client_pages: List[ClientPage]     # One-to-Many (CASCADE DELETE)
engine_setup_runs: List[EngineSetupRun]  # One-to-Many (CASCADE DELETE)
```

**Indexes:**
- `name` - Fast lookup by client name
- `status` - Filter active/inactive clients
- `engine_setup_completed` - Filter clients by setup status

---

#### **EngineSetupRun** (`app/models.py:262-288`)

**Purpose:** Tracks each ENGINE setup execution with real-time progress.

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY | Unique run identifier |
| `client_id` | UUID | FK → Client, INDEXED | Associated client |
| `setup_type` | str | NOT NULL | "sitemap" or "manual" |
| `total_pages` | int | DEFAULT: 0 | Total pages to import |
| `successful_pages` | int | DEFAULT: 0 | Successfully imported |
| `failed_pages` | int | DEFAULT: 0 | Import failures |
| `skipped_pages` | int | DEFAULT: 0 | Duplicate URLs skipped |
| `status` | str | INDEXED | "pending", "in_progress", "completed", "failed" |
| `current_url` | str | OPTIONAL | Real-time: URL being processed |
| `progress_percentage` | int | 0-100 | Real-time: Progress % |
| `error_message` | str | OPTIONAL | Error details if failed |
| `started_at` | datetime | OPTIONAL | Execution start time |
| `completed_at` | datetime | OPTIONAL | Execution end time |
| `created_at` | datetime | AUTO | Record creation time |

**Relationships:**
```python
client: Client  # Many-to-One
```

**Indexes:**
- `client_id` - Fast lookup of client's setup runs
- `status` - Filter runs by status

**Use Case:**
- Progress tracking during import
- Historical audit trail of all setup runs
- Error diagnostics

---

#### **ClientPage** (`app/models.py:194-260`)

**Purpose:** Represents a discovered webpage with metadata and SEO data.

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY | Unique page identifier |
| `client_id` | UUID | FK → Client, INDEXED | Associated client |
| `url` | str | NOT NULL | Page URL |
| `slug` | str | OPTIONAL | URL path/slug |
| `status_code` | int | INDEXED, OPTIONAL | HTTP status code |
| `is_failed` | bool | INDEXED, DEFAULT: false | Import failure flag |
| `failure_reason` | str | OPTIONAL | Error message |
| `retry_count` | int | DEFAULT: 0 | Number of retry attempts |
| `last_checked_at` | datetime | OPTIONAL | Last validation check |
| `created_at` | datetime | AUTO | Discovery timestamp |
| `updated_at` | datetime | AUTO | Last update timestamp |

**Phase 3: SEO Data Fields (22 Data Points)**

| Field | Type | Purpose |
|-------|------|---------|
| `page_title` | str | HTML `<title>` content |
| `meta_title` | str | `<meta name="title">` |
| `meta_description` | str | `<meta name="description">` |
| `h1` | str | First H1 heading |
| `canonical_url` | str | Canonical link |
| `hreflang` | JSON | Language alternates |
| `meta_robots` | str | Robots meta tag |
| `word_count` | int (INDEXED) | Text content word count |
| `body_content` | str | Page text content |
| `webpage_structure` | JSON | HTML structure analysis |
| `schema_markup` | JSON | Structured data |
| `salient_entities` | JSON | NLP-extracted entities |
| `internal_links` | JSON | Links to same domain |
| `external_links` | JSON | Links to other domains |
| `image_count` | int | Number of images |
| `body_content_embedding` | vector | OpenAI embedding (for similarity search) |
| `screenshot_url` | str | Screenshot storage URL |
| `screenshot_full_url` | str | Full-page screenshot URL |
| `last_crawled_at` | datetime | Last data extraction time |
| `crawl_run_id` | UUID (FK → CrawlRun) | Extraction batch ID |

**Relationships:**
```python
client: Client                  # Many-to-One
crawl_run: CrawlRun            # Many-to-One
data_points: List[DataPoint]   # One-to-Many (CASCADE DELETE)
```

**Unique Constraint:**
```sql
UNIQUE(client_id, url)  -- Prevents duplicate URLs per client
```

**Indexes:**
- `client_id` - Fast client page lookups
- `status_code` - Filter by HTTP status
- `is_failed` - Filter failed pages
- `word_count` - Sort/filter by content length

---

#### **ProjectLead** (`app/models.py:103-124`)

**Purpose:** Represents a project lead who can be assigned to clients.

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | str | NOT NULL | Lead name |
| `email` | str | UNIQUE, INDEXED | Contact email |
| `created_at` | datetime | AUTO | Creation timestamp |
| `updated_at` | datetime | AUTO | Last update timestamp |

**Relationships:**
```python
clients: List[Client]  # One-to-Many
```

---

#### **CrawlRun** (`app/models.py:604-646`)

**Purpose:** Tracks data extraction jobs (Phase 3/4).

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Unique run identifier |
| `client_id` | UUID (FK → Client) | Associated client |
| `run_type` | str | "full", "selective", "manual" |
| `status` | str | Execution status |
| `total_pages` | int | Pages to crawl |
| `successful_pages` | int | Successfully crawled |
| `failed_pages` | int | Crawl failures |
| `data_points_extracted` | List[str] | Types of data extracted |
| `started_at` | datetime | Start time |
| `completed_at` | datetime | End time |
| `estimated_cost` | float | Estimated API cost (USD) |
| `actual_cost` | float | Actual API cost (USD) |

**Phase 4: Real-time Tracking**
| Field | Type | Purpose |
|-------|------|---------|
| `current_page_url` | str | Currently processing URL |
| `progress_percentage` | int | 0-100% |
| `current_status_message` | str | Real-time status |
| `error_log` | JSON | Detailed error tracking |
| `performance_metrics` | JSON | Execution metrics |
| `api_costs` | JSON | OpenAI/Google NLP costs |

**Relationships:**
```python
client: Client                # Many-to-One
pages: List[ClientPage]       # One-to-Many
```

---

#### **DataPoint** (`app/models.py:648-669`)

**Purpose:** Flexible sub-record system for granular page data.

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `id` | UUID | PRIMARY KEY | Format: `pg_{uuid}_{data_type}` |
| `page_id` | UUID | FK → ClientPage, INDEXED | Associated page |
| `data_type` | str | INDEXED | Type: "title", "embedding", etc. |
| `value` | JSON | NOT NULL | Flexible JSON storage |
| `crawl_run_id` | UUID | FK → CrawlRun, OPTIONAL | Extraction batch |
| `created_at` | datetime | AUTO | Extraction timestamp |

**Relationships:**
```python
page: ClientPage  # Many-to-One
crawl_run: CrawlRun  # Many-to-One
```

**Indexes:**
- Composite: `(page_id, data_type)` - Fast lookup by page + type
- `data_type` - Filter by data type across all pages

**Use Case:**
- Allows flexible schema evolution
- Supports versioning of extracted data
- Enables granular tracking of extraction jobs

---

### 2.2 Database Relationship Diagram

```
User
  │
  └─> Client (created_by)
        ├─> ProjectLead (optional)
        │
        ├─> Project[] (multiple projects)
        │
        ├─> ClientPage[] (discovered pages)
        │     ├─> CrawlRun (data extraction job)
        │     └─> DataPoint[] (granular data records)
        │
        └─> EngineSetupRun[] (setup history)
              └─> Client.last_setup_run_id (self-reference)
```

**Cascade Delete Rules:**
- Delete `Client` → deletes all `ClientPage`, `EngineSetupRun`, `Project`
- Delete `ClientPage` → deletes all `DataPoint`
- Delete `CrawlRun` → nullifies `ClientPage.crawl_run_id`, deletes `DataPoint.crawl_run_id` references

---

## 3. BACKEND API

### 3.1 Client Management API

**Base Path:** `/api/clients`
**Controller:** `app/controllers/clients.py`
**Service:** `app/services/client_service.py`
**Authentication:** Required (JWT token via `Depends(get_current_user)`)

#### Endpoints

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| **POST** | `/clients` | Create new client | `ClientCreate` | `ClientRead` |
| **GET** | `/clients` | List all clients | Query params | `List[ClientRead]` |
| **GET** | `/clients/{client_id}` | Get client by ID | - | `ClientRead` |
| **PUT** | `/clients/{client_id}` | Update client | `ClientUpdate` | `ClientRead` |
| **DELETE** | `/clients/{client_id}` | Delete client (with password) | `ClientDelete` | `{"message": "..."}` |
| **POST** | `/clients/test-sitemap` | Test sitemap URL validity | `ClientSitemapTest` | `ClientSitemapTestResult` |
| **POST** | `/clients/bulk-delete` | Delete multiple clients | `ClientBulkDelete` | `{"message": "...", "backup_url": "..."}` |
| **POST** | `/clients/backup` | Generate backup .zip | - | StreamingResponse (file) |

#### Query Parameters (GET /clients)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string (optional) | Filter by name or website URL | `?search=acme` |
| `project_lead_id` | UUID (optional) | Filter by project lead | `?project_lead_id=<uuid>` |

#### Schemas (Pydantic)

**ClientCreate** (`app/schemas/client.py`)
```python
{
  "name": str,                    # Required, unique
  "description": str | None,
  "website_url": str | None,
  "sitemap_url": str | None,
  "industry": str | None,
  "logo_url": str | None,
  "crawl_frequency": str,         # Default: "Manual Only"
  "status": str,                  # Default: "Active"
  "project_lead_id": UUID | None
}
```

**ClientRead**
```python
{
  "id": UUID,
  "name": str,
  "description": str | None,
  "website_url": str | None,
  "sitemap_url": str | None,
  "industry": str | None,
  "logo_url": str | None,
  "crawl_frequency": str,
  "status": str,
  "page_count": int,
  "created_by": UUID,
  "project_lead_id": UUID | None,
  "engine_setup_completed": bool,
  "last_setup_run_id": UUID | None,
  "created_at": datetime,
  "updated_at": datetime,
  "project_lead": ProjectLeadRead | None  # Nested relationship
}
```

**ClientUpdate**
```python
{
  "name": str | None,
  "description": str | None,
  "website_url": str | None,
  "sitemap_url": str | None,
  "industry": str | None,
  "logo_url": str | None,
  "crawl_frequency": str | None,
  "status": str | None,
  "project_lead_id": UUID | None
}
```

**ClientDelete**
```python
{
  "password": str  # Required for deletion confirmation
}
```

**ClientBulkDelete**
```python
{
  "client_ids": List[UUID],
  "create_backup": bool,  # Default: true
  "password": str         # Required
}
```

**ClientSitemapTest**
```python
{
  "sitemap_url": str  # URL to test
}
```

**ClientSitemapTestResult**
```python
{
  "is_valid": bool,
  "url_count": int | None,
  "error_message": str | None
}
```

#### Business Logic (Service Layer)

**File:** `app/services/client_service.py`

**Key Functions:**

1. **`get_clients(db, search=None, project_lead_id=None)`**
   - Fetches all clients with optional filtering
   - Eager loads `project_lead` relationship
   - Search filters `name` and `website_url` with case-insensitive LIKE
   - Returns `List[ClientRead]`

2. **`get_client_by_id(db, client_id)`**
   - Fetches single client by UUID
   - Eager loads `project_lead`
   - Raises `NotFoundException` if not found
   - Returns `ClientRead`

3. **`create_client(db, client_data, user_id)`**
   - Validates name uniqueness (case-insensitive)
   - Validates sitemap URL (if provided)
   - Creates `Client` record with `created_by = user_id`
   - Sets `engine_setup_completed = false` by default
   - Returns `ClientRead`

4. **`update_client(db, client_id, update_data)`**
   - Validates name uniqueness (excluding current client)
   - Validates new sitemap URL (if changed)
   - Validates `project_lead_id` existence (if provided)
   - Updates `updated_at` automatically
   - Returns `ClientRead`

5. **`delete_client(db, client_id, password)`**
   - Verifies user password for security
   - Checks for dependencies (projects, pages)
   - Cascade deletes `ClientPage` and `EngineSetupRun` records
   - Returns deletion confirmation message

6. **`test_sitemap(sitemap_url)`**
   - Async HTTP GET to sitemap URL (httpx)
   - Parses XML with `SitemapParser`
   - Counts `<loc>` tags
   - Returns validation result with URL count or error message
   - Timeout: 10 seconds

7. **`bulk_delete_clients(db, client_ids, create_backup, password)`**
   - Verifies user password
   - Optionally generates backup .zip file
   - Deletes multiple clients in single transaction
   - Returns deletion summary + backup URL (if created)

8. **`generate_backup(db, client_ids=None)`**
   - Creates in-memory .zip file
   - Includes JSON metadata for each client:
     - Client details
     - Associated pages
     - Setup run history
   - Returns `StreamingResponse` with .zip file
   - Filename format: `clients_backup_YYYYMMDD_HHMMSS.zip`

**Validation Rules:**
- Client name must be 3-100 characters
- Client name must be unique (case-insensitive)
- Sitemap URL must return HTTP 200 and valid XML
- Project lead must exist in database
- Password must match current user's password for deletion

---

### 3.2 ENGINE Setup API

**Base Path:** `/api/engine-setup`
**Controller:** `app/controllers/engine_setup.py`
**Service:** `app/services/engine_setup_service.py`
**Authentication:** Required

#### Endpoints

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| **POST** | `/engine-setup/start` | Start ENGINE setup | `EngineSetupRequest` | `EngineSetupRunRead` |
| **GET** | `/engine-setup/{run_id}` | Get setup run details | - | `EngineSetupRunRead` |
| **GET** | `/engine-setup/{run_id}/progress` | Get real-time progress | - | `EngineSetupProgress` |
| **GET** | `/engine-setup/client/{client_id}/runs` | List client's setup runs | Query: `limit` | `List[EngineSetupRunRead]` |
| **GET** | `/engine-setup/client/{client_id}/stats` | Get client setup statistics | - | `EngineSetupStats` |
| **POST** | `/engine-setup/{run_id}/cancel` | Cancel running setup | - | `{"message": "..."}` |

#### Schemas

**EngineSetupRequest**
```python
{
  "client_id": UUID,
  "setup_type": "sitemap" | "manual",

  # Required if setup_type == "sitemap"
  "sitemap_url": str | None,

  # Required if setup_type == "manual"
  "manual_urls": List[str] | None  # Max 1000 URLs
}
```

**EngineSetupRunRead**
```python
{
  "id": UUID,
  "client_id": UUID,
  "setup_type": str,
  "total_pages": int,
  "successful_pages": int,
  "failed_pages": int,
  "skipped_pages": int,
  "status": str,
  "current_url": str | None,
  "progress_percentage": int,
  "error_message": str | None,
  "started_at": datetime | None,
  "completed_at": datetime | None,
  "created_at": datetime
}
```

**EngineSetupProgress**
```python
{
  "run_id": UUID,
  "status": str,
  "progress_percentage": int,
  "current_url": str | None,
  "total_pages": int,
  "successful_pages": int,
  "failed_pages": int,
  "skipped_pages": int,
  "started_at": datetime | None,
  "estimated_completion": datetime | None  # Calculated based on rate
}
```

**EngineSetupStats**
```python
{
  "client_id": UUID,
  "total_runs": int,
  "completed_runs": int,
  "failed_runs": int,
  "total_pages_discovered": int,
  "last_run_at": datetime | None,
  "average_pages_per_run": float
}
```

#### Business Logic (Service Layer)

**File:** `app/services/engine_setup_service.py`

**Class:** `EngineSetupService`

**Key Methods:**

1. **`start_setup(db, request, current_user)`**
   - Validates client existence
   - Validates request based on `setup_type`
   - Creates `EngineSetupRun` record with `status = "pending"`
   - Schedules background job via APScheduler
   - Returns `EngineSetupRunRead` with `run_id`

2. **`execute_sitemap_setup(run_id, sitemap_url)`** (Background Task)
   - Creates new async DB session
   - Updates run status to `"in_progress"`
   - Sets `started_at` timestamp
   - Parses sitemap XML with `SitemapParser.parse_sitemap()`
   - Validates URLs with `URLValidator.validate_batch()`
   - Processes URLs in batches of 50:
     - Calls `ClientPageService.create_pages_bulk()`
     - Tracks duplicates (increments `skipped_pages`)
     - Updates `progress_percentage = (processed / total) * 100`
     - Updates `current_url` to latest URL
     - Commits batch to database
   - On completion:
     - Updates run status to `"completed"`
     - Sets `completed_at` timestamp
     - Updates `Client.engine_setup_completed = true`
     - Updates `Client.page_count = successful_pages`
     - Updates `Client.last_setup_run_id = run_id`
   - On error:
     - Updates run status to `"failed"`
     - Logs `error_message`
     - Rolls back transaction

3. **`execute_manual_setup(run_id, manual_urls)`** (Background Task)
   - Same flow as `execute_sitemap_setup`
   - Skips sitemap parsing step
   - Directly validates `manual_urls` list
   - Processes in batches

4. **`get_progress(db, run_id)`**
   - Fetches `EngineSetupRun` by ID
   - Calculates `estimated_completion` based on:
     - Time elapsed since `started_at`
     - Pages processed so far
     - Average processing rate
   - Returns `EngineSetupProgress`

5. **`list_client_runs(db, client_id, limit=10)`**
   - Fetches last N setup runs for client
   - Orders by `created_at DESC`
   - Returns `List[EngineSetupRunRead]`

6. **`get_client_stats(db, client_id)`**
   - Aggregates statistics across all runs
   - Calculates total/completed/failed runs
   - Calculates average pages per run
   - Returns `EngineSetupStats`

7. **`cancel_setup(db, run_id)`**
   - Updates run status to `"cancelled"`
   - Removes job from APScheduler queue
   - Returns cancellation confirmation

**Validation Rules:**
- Sitemap mode: `sitemap_url` must be valid URL
- Manual mode: `manual_urls` must be 1-1000 URLs
- URLs must pass `URLValidator` (format, scheme, accessibility)
- Client must exist and belong to current user

**Error Handling:**
- Invalid sitemap XML → status = "failed", error logged
- Network timeout → retries up to 3 times, then fails
- Database errors → rolls back transaction, status = "failed"
- Job cancellation → graceful shutdown, marks as "cancelled"

---

### 3.3 Client Pages API

**Base Path:** `/api/client-pages`
**Controller:** `app/controllers/client_pages.py`
**Service:** `app/services/client_page_service.py`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| **GET** | `/client-pages/client/{client_id}` | List pages for client |
| **GET** | `/client-pages/{page_id}` | Get single page details |
| **PUT** | `/client-pages/{page_id}` | Update page metadata |
| **DELETE** | `/client-pages/{page_id}` | Delete single page |
| **POST** | `/client-pages/bulk-delete` | Delete multiple pages |

**Query Parameters (GET /client-pages/client/{client_id})**
- `status_code` (int): Filter by HTTP status
- `is_failed` (bool): Filter failed pages
- `search` (str): Search in URL or slug
- `limit` (int): Max results (default: 100)
- `offset` (int): Pagination offset

---

### 3.4 Page Crawl API (Data Extraction)

**Base Path:** `/api/page-crawl`
**Controller:** `app/controllers/page_crawl.py`
**Service:** `app/services/page_crawl_service.py`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| **POST** | `/page-crawl/start` | Start data extraction |
| **GET** | `/page-crawl/{run_id}/progress` | Real-time progress tracking |
| **GET** | `/page-crawl/client/{client_id}/runs` | List extraction runs |

**Request Body (POST /page-crawl/start)**
```python
{
  "client_id": UUID,
  "run_type": "full" | "selective" | "manual",
  "page_ids": List[UUID] | None,  # Required if selective/manual
  "data_points_to_extract": List[str]  # e.g., ["title", "meta_description", "word_count"]
}
```

---

## 4. FRONTEND ARCHITECTURE

### 4.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18.x |
| **Language** | TypeScript (strict mode) |
| **Build Tool** | Vite 5.x |
| **UI Library** | Material-UI v6 |
| **State Management** | TanStack React Query |
| **Routing** | React Router v6 |
| **Form Validation** | React Hook Form + Zod |
| **HTTP Client** | Auto-generated from OpenAPI |

### 4.2 Directory Structure

```
frontend/src/
├── pages/Clients/
│   ├── MyClients.tsx                  # List page (route: /clients)
│   ├── CreateClient.tsx               # Create form (route: /clients/new)
│   ├── EditClient.tsx                 # Edit form (route: /clients/:id/edit)
│   └── ClientDetail.tsx               # Detail page (route: /clients/:id)
│
├── components/Clients/
│   ├── ClientsList.tsx                # Grid/table list component
│   ├── CreateClientForm.tsx           # Client creation form
│   ├── EditClientForm.tsx             # Client editing form
│   ├── ClientPagesList.tsx            # Basic page list
│   ├── EnhancedClientPagesList.tsx    # Advanced page list with filtering
│   ├── EngineSetupModal.tsx           # ENGINE setup dialog
│   └── EngineSetupProgressDialog.tsx  # Real-time progress tracker
│
├── components/PageCrawl/
│   ├── StartCrawlDialog.tsx           # Data extraction dialog
│   └── CrawlProgressTracker.tsx       # Crawl progress tracking
│
├── hooks/api/
│   ├── useClients.ts                  # Client API hooks
│   ├── useEngineSetup.ts              # ENGINE API hooks
│   ├── useClientPages.ts              # ClientPage API hooks
│   └── usePageCrawl.ts                # Crawl API hooks
│
├── client/                            # Auto-generated API client
│   ├── services/
│   │   ├── ClientsService.ts
│   │   ├── EngineSetupService.ts
│   │   └── ClientPagesService.ts
│   └── models/
│       ├── ClientRead.ts
│       ├── ClientCreate.ts
│       ├── EngineSetupRequest.ts
│       └── ... (all TypeScript types)
│
└── App.tsx                            # Route definitions
```

### 4.3 React Query Hooks

**File:** `frontend/src/hooks/api/useClients.ts`

#### Client Hooks

```typescript
// Query Hooks (Data Fetching)

useClients(search?: string, projectLeadId?: string)
  ├─ Query Key: ['clients', search, projectLeadId]
  ├─ Fetches: List of clients with optional filtering
  ├─ Returns: { data: ClientRead[], isLoading, error }
  └─ Auto-refetch: On window focus

useClientDetail(clientId: string)
  ├─ Query Key: ['clients', clientId]
  ├─ Fetches: Single client with nested relationships
  ├─ Returns: { data: ClientRead, isLoading, error }
  └─ Enabled: Only when clientId is provided

// Mutation Hooks (Data Modification)

useCreateClient()
  ├─ Mutation: POST /api/clients
  ├─ Returns: { mutate, mutateAsync, isLoading, error }
  └─ On Success: Invalidates ['clients'] query key

useUpdateClient()
  ├─ Mutation: PUT /api/clients/{id}
  ├─ Returns: { mutate, mutateAsync, isLoading, error }
  └─ On Success: Invalidates ['clients'] and ['clients', clientId]

useDeleteClient()
  ├─ Mutation: DELETE /api/clients/{id}
  ├─ Returns: { mutate, mutateAsync, isLoading, error }
  └─ On Success: Invalidates ['clients'], redirects to /clients

useBulkDeleteClients()
  ├─ Mutation: POST /api/clients/bulk-delete
  ├─ Returns: { mutate, mutateAsync, isLoading, error }
  └─ On Success: Invalidates ['clients'], returns backup URL

useTestSitemap()
  ├─ Mutation: POST /api/clients/test-sitemap
  ├─ Returns: { mutate, mutateAsync, isLoading, error, data }
  └─ Use Case: Validate sitemap URL in form
```

**File:** `frontend/src/hooks/api/useEngineSetup.ts`

#### ENGINE Setup Hooks

```typescript
useStartEngineSetup()
  ├─ Mutation: POST /api/engine-setup/start
  ├─ Returns: { mutate, mutateAsync, isLoading, error, data }
  └─ On Success: Returns run_id, invalidates client queries

useEngineSetupProgress(runId: string)
  ├─ Query Key: ['engine-setup', 'progress', runId]
  ├─ Fetches: Real-time progress data
  ├─ Refetch Interval: 2 seconds
  ├─ Enabled: Only when status === "in_progress" or "pending"
  └─ Auto-stops: When status === "completed" or "failed"

useEngineSetupRun(runId: string)
  ├─ Query Key: ['engine-setup', 'run', runId]
  ├─ Fetches: Full setup run details
  └─ Returns: { data: EngineSetupRunRead, isLoading, error }

useClientSetupRuns(clientId: string, limit = 10)
  ├─ Query Key: ['engine-setup', 'client-runs', clientId, limit]
  ├─ Fetches: Historical setup runs for client
  └─ Returns: { data: EngineSetupRunRead[], isLoading, error }

useClientSetupStats(clientId: string)
  ├─ Query Key: ['engine-setup', 'stats', clientId]
  ├─ Fetches: Aggregate statistics
  └─ Returns: { data: EngineSetupStats, isLoading, error }

useCancelEngineSetup()
  ├─ Mutation: POST /api/engine-setup/{runId}/cancel
  ├─ Returns: { mutate, mutateAsync, isLoading, error }
  └─ On Success: Invalidates progress and run queries
```

### 4.4 Key Components

#### EngineSetupModal (`components/Clients/EngineSetupModal.tsx`)

**Purpose:** User interface for starting ENGINE setup.

**Features:**
- Radio button toggle: Sitemap vs Manual mode
- **Sitemap Mode:**
  - Single URL input field
  - Real-time validation with Zod
  - "Test Sitemap" button (uses `useTestSitemap` hook)
  - Shows URL count preview
- **Manual Mode:**
  - **Single URL Entry:**
    - Add/remove URL fields dynamically
    - Max 10 URLs
    - Validation for each URL
  - **Bulk Mode Toggle:**
    - Textarea for multiple URLs
    - One URL per line
    - Automatic parsing on submit
- Form submission with `useStartEngineSetup()` hook
- Error handling with toast notifications
- Opens `EngineSetupProgressDialog` on success

**Form Validation (Zod Schema):**
```typescript
const sitemapSchema = z.object({
  setup_type: z.literal("sitemap"),
  sitemap_url: z.string().url("Must be a valid URL")
});

const manualSchema = z.object({
  setup_type: z.literal("manual"),
  manual_urls: z.array(z.string().url()).min(1).max(1000)
});
```

---

#### EngineSetupProgressDialog (`components/Clients/EngineSetupProgressDialog.tsx`)

**Purpose:** Real-time progress tracking for ENGINE setup.

**Features:**
- **Progress Bar:** 0-100% visual indicator
- **Status Badge:** "Pending" → "In Progress" → "Completed" / "Failed"
- **Real-time Metrics:**
  - Current URL being processed
  - Successful pages count (green)
  - Failed pages count (red)
  - Skipped pages count (gray)
  - Total pages
- **Auto-polling:** Calls `useEngineSetupProgress(runId)` every 2 seconds
- **Auto-stop:** Stops polling when status === "completed" or "failed"
- **Error Display:** Shows `error_message` if status === "failed"
- **Close Button:**
  - Enabled only when setup complete or failed
  - Invalidates React Query cache on close
  - Triggers ClientDetail page refresh

**Polling Logic:**
```typescript
const { data: progress } = useEngineSetupProgress(runId, {
  refetchInterval: (data) => {
    if (!data) return 2000;
    if (data.status === "completed" || data.status === "failed") {
      return false;  // Stop polling
    }
    return 2000;  // Continue polling every 2s
  }
});

useEffect(() => {
  if (progress?.status === "completed") {
    queryClient.invalidateQueries(['clients', clientId]);
    queryClient.invalidateQueries(['client-pages', clientId]);
  }
}, [progress?.status]);
```

---

#### ClientDetail Page (`pages/Clients/ClientDetail.tsx`)

**Purpose:** Main client overview page with ENGINE integration.

**Layout:**

1. **Header Section:**
   - Client name, logo, status badge
   - "Edit Client" button
   - "Delete Client" button (with password confirmation)

2. **Client Information Card:**
   - Website URL (clickable link)
   - Industry
   - Project Lead
   - Crawl Frequency
   - Created At / Updated At

3. **ENGINE Setup Section:**
   - **If `engine_setup_completed === false`:**
     - Alert: "Engine setup required to start discovering pages"
     - "Setup Website Engine" button → opens `EngineSetupModal`
   - **If `engine_setup_completed === true`:**
     - Success alert: "Engine setup completed! {page_count} pages discovered"
     - "Re-run Setup" button (optional)
     - Link to view last setup run

4. **Pages Section (if setup completed):**
   - **Tabs:**
     - "All Pages" → `EnhancedClientPagesList`
     - "Failed Pages" → Filtered list (is_failed = true)
     - "Not Crawled" → Pages without SEO data
   - **Actions:**
     - "Start Data Extraction" button → opens `StartCrawlDialog`
     - "Export Pages" button → CSV download

5. **Setup History Section:**
   - Table of past setup runs
   - Columns: Date, Type (Sitemap/Manual), Status, Pages Discovered
   - Click row → view run details

**Data Loading:**
```typescript
const { data: client, isLoading } = useClientDetail(clientId);
const { data: setupRuns } = useClientSetupRuns(clientId, 5);
const { data: pages } = useClientPages(clientId);
```

---

#### EnhancedClientPagesList (`components/Clients/EnhancedClientPagesList.tsx`)

**Purpose:** Advanced page list with filtering, sorting, and actions.

**Features:**
- **Filters:**
  - Search by URL or slug
  - Filter by HTTP status code (200, 404, 500, etc.)
  - Filter by crawl status (crawled/not crawled)
  - Filter by word count range
- **Sorting:**
  - By URL (A-Z, Z-A)
  - By created_at (newest/oldest)
  - By word_count (high to low)
- **Pagination:**
  - Server-side pagination (limit/offset)
  - Page size selector: 10, 25, 50, 100
- **Bulk Actions:**
  - Select all / deselect all checkboxes
  - Bulk delete selected pages
  - Bulk re-crawl selected pages
- **Individual Actions:**
  - View page details
  - Re-crawl single page
  - Delete single page
- **Display:**
  - Table view with columns:
    - [Checkbox] | URL | Status Code | Word Count | Last Crawled | Actions
  - Mobile-responsive: Switches to card view on small screens

**Example Filter State:**
```typescript
const [filters, setFilters] = useState({
  search: "",
  status_code: null,
  is_crawled: null,
  word_count_min: null,
  word_count_max: null
});

const { data: pages } = useClientPages(clientId, {
  ...filters,
  limit: pageSize,
  offset: page * pageSize
});
```

---

### 4.5 User Journey Flow

**1. View Client List → Create Client**
```
/clients
  → Click "Create Client" button
  → Navigate to /clients/new
  → Fill CreateClientForm:
      - Name (required, unique)
      - Website URL
      - Sitemap URL (optional)
      - Industry
      - Project Lead (dropdown)
  → Submit form
  → useCreateClient() mutation
  → Success → Navigate to /clients/{client_id}
```

**2. Setup Website Engine (Sitemap Mode)**
```
/clients/{client_id}
  → Alert shown: "Engine setup required"
  → Click "Setup Website Engine" button
  → EngineSetupModal opens
  → Select "Sitemap" mode
  → Enter sitemap URL: https://example.com/sitemap.xml
  → Click "Test Sitemap" (optional)
    → Shows: "✓ Valid sitemap (142 URLs found)"
  → Click "Start Setup"
  → useStartEngineSetup() mutation:
      {
        client_id: "...",
        setup_type: "sitemap",
        sitemap_url: "https://example.com/sitemap.xml"
      }
  → Mutation returns: { run_id: "..." }
  → EngineSetupProgressDialog opens
  → Polling starts (every 2s):
      GET /api/engine-setup/{run_id}/progress
  → Progress updates in real-time:
      - Progress bar: 0% → 25% → 50% → 75% → 100%
      - Current URL: "https://example.com/about"
      - Successful: 35
      - Failed: 2
      - Skipped: 5 (duplicates)
  → Status changes: "In Progress" → "Completed"
  → Success message: "Setup completed! 35 pages discovered"
  → Close dialog
  → ClientDetail page refreshes
  → Alert now shows: "Engine setup completed! 35 pages discovered"
  → EnhancedClientPagesList visible with 35 pages
```

**3. Setup Website Engine (Manual Mode)**
```
/clients/{client_id}
  → Click "Setup Website Engine" button
  → EngineSetupModal opens
  → Select "Manual" mode
  → **Option A: Single URL Entry**
      → Enter URLs one-by-one:
          1. https://example.com/
          2. https://example.com/about
          3. https://example.com/contact
      → Click "Add URL" for more (max 10)
  → **Option B: Bulk Mode**
      → Toggle "Bulk Input"
      → Textarea appears
      → Paste URLs (one per line):
          https://example.com/
          https://example.com/about
          https://example.com/contact
          https://example.com/blog/post-1
          https://example.com/blog/post-2
      → Auto-parsed on submit
  → Click "Start Setup"
  → useStartEngineSetup() mutation:
      {
        client_id: "...",
        setup_type: "manual",
        manual_urls: [
          "https://example.com/",
          "https://example.com/about",
          ...
        ]
      }
  → Same progress flow as Sitemap mode
```

**4. Start Data Extraction (Crawl)**
```
/clients/{client_id}
  → ENGINE setup completed (35 pages)
  → Click "Start Data Extraction" button
  → StartCrawlDialog opens
  → Configure extraction:
      - Run Type: "Full" (all pages) | "Selective" (choose pages)
      - Data Points (checkboxes):
          ☑ Page Title
          ☑ Meta Description
          ☑ H1 Headings
          ☑ Word Count
          ☑ Body Content
          ☑ Internal Links
          ☑ External Links
          ☐ Schema Markup
          ☐ Screenshots
          ☑ Content Embedding (vector)
  → Estimate shown: "~$0.50 USD (35 pages × 9 data points)"
  → Click "Start Extraction"
  → useStartPageCrawl() mutation
  → CrawlProgressTracker opens
  → Real-time updates:
      - Progress: 0/35 → 10/35 → 35/35
      - Current page: "https://example.com/about"
      - Cost: $0.12 / $0.50
  → Completion
  → ClientDetail page refreshes
  → Pages now show extracted data:
      - Word count: 1,245
      - Last crawled: "2 minutes ago"
```

---

## 5. BACKGROUND JOBS (APScheduler)

### 5.1 Architecture

**Scheduler Type:** `AsyncIOScheduler` (non-blocking, async-compatible)
**Initialization:** In `main.py` lifespan context manager
**Task Files:**
- `app/tasks/engine_setup_tasks.py` - ENGINE setup jobs
- `app/tasks/page_crawl_tasks.py` - Data extraction jobs
- `app/tasks/crawl_tasks.py` - Scheduler management

### 5.2 Lifecycle

**Startup** (`main.py:34-57`)
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from app.tasks.crawl_tasks import get_scheduler
    scheduler = get_scheduler()  # Initializes AsyncIOScheduler
    scheduler.start()            # Starts background thread
    logging.info(f"✅ APScheduler started with {len(scheduler.get_jobs())} jobs")

    yield

    # Shutdown
    from app.tasks.crawl_tasks import shutdown_scheduler
    shutdown_scheduler()  # Gracefully stops scheduler
    logging.info("✅ APScheduler shutdown complete")
```

**Singleton Pattern** (`app/tasks/crawl_tasks.py`)
```python
_scheduler = None

def get_scheduler():
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
        _scheduler.start()
    return _scheduler

def shutdown_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=True)  # Wait for running jobs to finish
        _scheduler = None
```

### 5.3 ENGINE Setup Tasks

**File:** `app/tasks/engine_setup_tasks.py`

#### Task Functions

**1. run_sitemap_setup_task(run_id: UUID, sitemap_url: str)**

**Execution Flow:**
```python
async def run_sitemap_setup_task(run_id: UUID, sitemap_url: str):
    # 1. Create new async DB session (independent of FastAPI request)
    async with get_async_db_session() as db:

        # 2. Initialize service
        service = EngineSetupService(db)

        try:
            # 3. Execute setup (main business logic)
            await service.execute_sitemap_setup(run_id, sitemap_url)

        except Exception as e:
            # 4. Error handling
            await service.mark_run_failed(run_id, str(e))
            logging.error(f"Sitemap setup failed: {e}")
```

**Key Points:**
- Runs in background thread pool
- Creates own database session (not tied to HTTP request)
- Handles all exceptions internally
- Updates run status in database

**2. run_manual_setup_task(run_id: UUID, manual_urls: str)**

**Same structure as sitemap task:**
- Parses comma-separated URL string
- Calls `service.execute_manual_setup(run_id, urls)`

#### Scheduling Functions

**schedule_sitemap_setup(run_id: UUID, sitemap_url: str)**
```python
def schedule_sitemap_setup(run_id: UUID, sitemap_url: str):
    scheduler = get_scheduler()

    scheduler.add_job(
        func=run_sitemap_setup_task,
        trigger=DateTrigger(run_date=None),  # Run immediately
        args=[run_id, sitemap_url],
        id=f"sitemap_setup_{run_id}",        # Unique job ID
        replace_existing=True                # Replace if job ID exists
    )

    logging.info(f"Scheduled sitemap setup job: {run_id}")
```

**schedule_manual_setup(run_id: UUID, manual_urls: List[str])**
```python
def schedule_manual_setup(run_id: UUID, manual_urls: List[str]):
    scheduler = get_scheduler()

    # Convert list to comma-separated string for job args
    urls_str = ",".join(manual_urls)

    scheduler.add_job(
        func=run_manual_setup_task,
        trigger=DateTrigger(run_date=None),
        args=[run_id, urls_str],
        id=f"manual_setup_{run_id}",
        replace_existing=True
    )
```

**cancel_setup_job(run_id: UUID, setup_type: str)**
```python
def cancel_setup_job(run_id: UUID, setup_type: str):
    scheduler = get_scheduler()
    job_id = f"{setup_type}_setup_{run_id}"

    try:
        scheduler.remove_job(job_id)
        logging.info(f"Cancelled job: {job_id}")
        return True
    except JobLookupError:
        logging.warning(f"Job not found: {job_id}")
        return False
```

**get_setup_job_status(run_id: UUID, setup_type: str)**
```python
def get_setup_job_status(run_id: UUID, setup_type: str):
    scheduler = get_scheduler()
    job_id = f"{setup_type}_setup_{run_id}"

    job = scheduler.get_job(job_id)
    if job:
        return {
            "job_id": job_id,
            "next_run_time": job.next_run_time,
            "pending": job.pending
        }
    return None
```

### 5.4 Service Layer Implementation

**File:** `app/services/engine_setup_service.py`

**execute_sitemap_setup(run_id: UUID, sitemap_url: str)**

**Detailed Flow:**

```python
async def execute_sitemap_setup(self, run_id: UUID, sitemap_url: str):
    # 1. Fetch run record
    run = await self.db.get(EngineSetupRun, run_id)
    if not run:
        raise NotFoundException(f"Setup run {run_id} not found")

    # 2. Update status to in_progress
    run.status = "in_progress"
    run.started_at = datetime.utcnow()
    await self.db.commit()

    try:
        # 3. Parse sitemap XML
        from app.utils.sitemap_parser import SitemapParser
        parser = SitemapParser()
        urls = await parser.parse_sitemap(sitemap_url)  # Returns List[str]

        # 4. Validate URLs
        from app.utils.url_validator import URLValidator
        validator = URLValidator()
        validated_urls = validator.validate_batch(urls)  # Filters invalid URLs

        # 5. Update total_pages
        run.total_pages = len(validated_urls)
        await self.db.commit()

        # 6. Process in batches
        BATCH_SIZE = 50
        batches = [validated_urls[i:i+BATCH_SIZE] for i in range(0, len(validated_urls), BATCH_SIZE)]

        for i, batch in enumerate(batches):
            # 6a. Create pages
            from app.services.client_page_service import ClientPageService
            page_service = ClientPageService(self.db)

            result = await page_service.create_pages_bulk(
                client_id=run.client_id,
                urls=batch,
                run_id=run_id
            )

            # 6b. Update counters
            run.successful_pages += result['created']
            run.skipped_pages += result['skipped']
            run.failed_pages += result['failed']

            # 6c. Update progress
            processed = (i + 1) * BATCH_SIZE
            run.progress_percentage = min(int((processed / run.total_pages) * 100), 100)

            # 6d. Update current URL (last URL in batch)
            run.current_url = batch[-1]

            # 6e. Commit batch
            await self.db.commit()

            # 6f. Log progress
            logging.info(f"Run {run_id}: {run.progress_percentage}% complete ({run.successful_pages} pages)")

        # 7. Mark as completed
        run.status = "completed"
        run.completed_at = datetime.utcnow()
        run.progress_percentage = 100
        await self.db.commit()

        # 8. Update client
        client = await self.db.get(Client, run.client_id)
        client.engine_setup_completed = True
        client.page_count = run.successful_pages
        client.last_setup_run_id = run_id
        await self.db.commit()

        logging.info(f"Setup run {run_id} completed: {run.successful_pages} pages discovered")

    except Exception as e:
        # 9. Error handling
        run.status = "failed"
        run.error_message = str(e)
        run.completed_at = datetime.utcnow()
        await self.db.commit()
        logging.error(f"Setup run {run_id} failed: {e}")
        raise
```

### 5.5 Utility Services

#### SitemapParser (`app/utils/sitemap_parser.py`)

**Purpose:** Parse XML sitemaps to extract URLs.

**Key Method:**
```python
async def parse_sitemap(self, sitemap_url: str) -> List[str]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(sitemap_url)
        response.raise_for_status()

        # Parse XML
        import re
        urls = re.findall(r'<loc>(.*?)</loc>', response.text)

        # Handle sitemap indexes (recursive)
        if '<sitemapindex>' in response.text:
            all_urls = []
            for sub_sitemap_url in urls:
                sub_urls = await self.parse_sitemap(sub_sitemap_url)
                all_urls.extend(sub_urls)
            return all_urls

        return urls
```

**Features:**
- Async HTTP requests with httpx
- Timeout: 10 seconds
- Handles sitemap indexes (nested sitemaps)
- Regex parsing (fast and simple)
- Raises HTTPException on network errors

#### URLValidator (`app/utils/url_validator.py`)

**Purpose:** Validate and normalize URLs.

**Key Method:**
```python
def validate_batch(self, urls: List[str]) -> List[str]:
    validated = []

    for url in urls:
        # 1. Parse URL
        from urllib.parse import urlparse
        parsed = urlparse(url)

        # 2. Check scheme
        if parsed.scheme not in ['http', 'https']:
            continue  # Skip invalid scheme

        # 3. Check domain
        if not parsed.netloc:
            continue  # Skip missing domain

        # 4. Normalize (add trailing slash)
        if not parsed.path or parsed.path == '/':
            normalized = f"{parsed.scheme}://{parsed.netloc}/"
        else:
            normalized = url

        # 5. Add to validated list
        validated.append(normalized)

    return validated
```

**Validation Rules:**
- Must have http/https scheme
- Must have valid domain
- Normalizes trailing slashes
- Removes duplicates
- Filters out invalid URLs

#### ClientPageService (`app/services/client_page_service.py`)

**Purpose:** Bulk creation of ClientPage records.

**Key Method:**
```python
async def create_pages_bulk(
    self,
    client_id: UUID,
    urls: List[str],
    run_id: UUID
) -> Dict[str, int]:
    # 1. Fetch existing URLs for this client
    from sqlmodel import select
    existing_urls_query = select(ClientPage.url).where(
        ClientPage.client_id == client_id
    )
    existing_result = await self.db.execute(existing_urls_query)
    existing_urls = set(existing_result.scalars().all())

    # 2. Filter out duplicates
    new_urls = [url for url in urls if url not in existing_urls]
    skipped_count = len(urls) - len(new_urls)

    # 3. Create ClientPage records
    created_pages = []
    for url in new_urls:
        page = ClientPage(
            client_id=client_id,
            url=url,
            slug=self._extract_slug(url),
            is_failed=False,
            retry_count=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        created_pages.append(page)

    # 4. Bulk insert
    self.db.add_all(created_pages)
    await self.db.flush()  # Get IDs without committing

    # 5. Return statistics
    return {
        "created": len(created_pages),
        "skipped": skipped_count,
        "failed": 0
    }

def _extract_slug(self, url: str) -> str:
    from urllib.parse import urlparse
    parsed = urlparse(url)
    return parsed.path.strip('/') or 'home'
```

**Performance Optimization:**
- Batch insert (not individual inserts)
- Single query to fetch existing URLs
- Set-based duplicate detection (O(1) lookup)
- `flush()` instead of `commit()` (caller commits)

---

## 6. WORKFLOW DIAGRAMS

### 6.1 Complete ENGINE Setup Flow (Sitemap Mode)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ClientDetail Page: /clients/{client_id}                        │
│  - Shows alert: "Engine setup required"                         │
│  - User clicks "Setup Website Engine" button                    │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  EngineSetupModal Component                                     │
│  1. User selects: Sitemap mode                                  │
│  2. Enters: https://example.com/sitemap.xml                     │
│  3. (Optional) Clicks "Test Sitemap" → validates URL            │
│  4. Clicks "Start Setup"                                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND: useStartEngineSetup() Hook                           │
│  - Mutation: POST /api/engine-setup/start                       │
│  - Request Body:                                                │
│    {                                                            │
│      client_id: "abc-123",                                      │
│      setup_type: "sitemap",                                     │
│      sitemap_url: "https://example.com/sitemap.xml"            │
│    }                                                            │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND: engine_setup.py Controller                            │
│  1. Validates request body (Pydantic)                           │
│  2. Verifies client exists                                      │
│  3. Calls: EngineSetupService.start_setup()                     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVICE LAYER: EngineSetupService.start_setup()                │
│  1. Creates EngineSetupRun record:                              │
│     - status: "pending"                                         │
│     - setup_type: "sitemap"                                     │
│     - client_id: abc-123                                        │
│     - total_pages: 0                                            │
│  2. Commits to database                                         │
│  3. Returns: run_id = "xyz-789"                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  CONTROLLER: Schedules Background Job                           │
│  - Calls: engine_setup_tasks.schedule_sitemap_setup()           │
│  - Args: (run_id="xyz-789", sitemap_url="...")                  │
│  - Returns HTTP 200: { run_id: "xyz-789" }                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──────────────────────────┬─────────────────────────┐
             │                          │                         │
             ▼                          ▼                         ▼
┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  FRONTEND             │  │  APScheduler         │  │  Background Thread   │
│  - Opens Progress     │  │  - Adds job to queue │  │  - Executes job      │
│    Dialog             │  │  - Job ID:           │  │    immediately       │
│  - Starts polling     │  │    sitemap_setup_    │  │                      │
│    every 2s           │  │    xyz-789           │  │                      │
└───────────────────────┘  └──────────────────────┘  └──────────┬───────────┘
                                                                 │
                                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKGROUND TASK: run_sitemap_setup_task(run_id, sitemap_url)  │
│                                                                 │
│  Step 1: Create new async DB session                           │
│  Step 2: Fetch EngineSetupRun record                           │
│  Step 3: Update status: "in_progress", started_at: now()       │
│  Step 4: Call EngineSetupService.execute_sitemap_setup()       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVICE: execute_sitemap_setup()                               │
│                                                                 │
│  Phase 1: Sitemap Parsing                                      │
│    - SitemapParser.parse_sitemap(sitemap_url)                  │
│    - HTTP GET to https://example.com/sitemap.xml               │
│    - Parse XML with regex: /<loc>(.*?)<\/loc>/                 │
│    - Returns: 142 URLs                                         │
│                                                                 │
│  Phase 2: URL Validation                                       │
│    - URLValidator.validate_batch(urls)                         │
│    - Filters invalid URLs (bad scheme, missing domain)         │
│    - Normalizes URLs (trailing slash, etc.)                    │
│    - Returns: 140 valid URLs (2 filtered out)                  │
│                                                                 │
│  Phase 3: Update Total Count                                   │
│    - run.total_pages = 140                                     │
│    - Commit to database                                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4: Batch Processing (50 URLs per batch)                  │
│                                                                 │
│  Batch 1: URLs 1-50                                            │
│    - ClientPageService.create_pages_bulk()                     │
│      • Queries existing URLs for client                        │
│      • Finds 3 duplicates → skipped                            │
│      • Creates 47 ClientPage records                           │
│      • Returns: {created: 47, skipped: 3, failed: 0}           │
│    - Update run:                                               │
│      • successful_pages = 47                                   │
│      • skipped_pages = 3                                       │
│      • progress_percentage = 35%                               │
│      • current_url = "https://example.com/about"               │
│    - Commit batch                                              │
│                                                                 │
│  [Frontend polls → GET /api/engine-setup/xyz-789/progress]     │
│  [Progress Dialog updates: 35%, 47 successful, 3 skipped]      │
│                                                                 │
│  Batch 2: URLs 51-100                                          │
│    - create_pages_bulk()                                       │
│      • 48 created, 2 skipped, 0 failed                         │
│    - Update run:                                               │
│      • successful_pages = 95                                   │
│      • skipped_pages = 5                                       │
│      • progress_percentage = 71%                               │
│    - Commit batch                                              │
│                                                                 │
│  [Frontend polls → 71%, 95 successful, 5 skipped]              │
│                                                                 │
│  Batch 3: URLs 101-140                                         │
│    - create_pages_bulk()                                       │
│      • 38 created, 2 skipped, 0 failed                         │
│    - Update run:                                               │
│      • successful_pages = 133                                  │
│      • skipped_pages = 7                                       │
│      • progress_percentage = 100%                              │
│    - Commit batch                                              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 5: Completion                                            │
│    - Update run:                                               │
│      • status = "completed"                                    │
│      • completed_at = now()                                    │
│      • progress_percentage = 100                               │
│    - Update client:                                            │
│      • engine_setup_completed = true                           │
│      • page_count = 133                                        │
│      • last_setup_run_id = "xyz-789"                           │
│    - Commit all changes                                        │
│    - Log: "Setup run xyz-789 completed: 133 pages discovered"  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND: Final Poll                                           │
│  - GET /api/engine-setup/xyz-789/progress                       │
│  - Response: { status: "completed", progress: 100, ... }        │
│  - Progress Dialog:                                             │
│    • Stops polling (refetchInterval = false)                   │
│    • Shows success message: "Setup completed! 133 pages"       │
│    • Enables "Close" button                                    │
│  - User clicks "Close"                                          │
│    • Invalidates React Query cache:                            │
│      - ['clients', 'abc-123']                                  │
│      - ['client-pages', 'abc-123']                             │
│    • ClientDetail page re-fetches data                         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  RESULT: ClientDetail Page Refreshed                            │
│  - Alert: "Engine setup completed! 133 pages discovered"        │
│  - EnhancedClientPagesList shown with 133 pages                 │
│  - "Start Data Extraction" button now available                │
│  - Setup History table shows new run entry                      │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Real-Time Progress Tracking Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  Component: EngineSetupProgressDialog                            │
│  Props: { runId: "xyz-789", clientId: "abc-123" }               │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Hook: useEngineSetupProgress(runId)                             │
│                                                                  │
│  const { data: progress, isLoading } = useQuery({                │
│    queryKey: ['engine-setup', 'progress', 'xyz-789'],           │
│    queryFn: () => EngineSetupService.getProgress('xyz-789'),    │
│    refetchInterval: (data) => {                                 │
│      if (!data) return 2000;                                    │
│      if (data.status === 'completed') return false;             │
│      if (data.status === 'failed') return false;                │
│      return 2000;  // Poll every 2 seconds                      │
│    },                                                           │
│    enabled: true                                                │
│  });                                                            │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ Every 2 seconds
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  API Call: GET /api/engine-setup/xyz-789/progress                │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Controller: engine_setup.py                                     │
│  - Calls: EngineSetupService.get_progress(run_id)               │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Service: EngineSetupService.get_progress()                      │
│  - Fetches EngineSetupRun record from database                  │
│  - Calculates estimated_completion:                             │
│    • time_elapsed = now() - started_at                          │
│    • pages_per_second = successful_pages / time_elapsed         │
│    • remaining_pages = total_pages - successful_pages           │
│    • estimated_seconds = remaining_pages / pages_per_second     │
│    • estimated_completion = now() + estimated_seconds           │
│  - Returns EngineSetupProgress DTO                              │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Response Example:                                               │
│  {                                                               │
│    "run_id": "xyz-789",                                          │
│    "status": "in_progress",                                      │
│    "progress_percentage": 71,                                    │
│    "current_url": "https://example.com/blog/post-42",           │
│    "total_pages": 140,                                           │
│    "successful_pages": 95,                                       │
│    "failed_pages": 0,                                            │
│    "skipped_pages": 5,                                           │
│    "started_at": "2025-11-10T12:30:00Z",                        │
│    "estimated_completion": "2025-11-10T12:32:15Z"               │
│  }                                                               │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Component Updates (React Re-render):                            │
│                                                                  │
│  <EngineSetupProgressDialog>                                     │
│    <LinearProgress value={71} />                                 │
│    <Chip label="In Progress" color="primary" />                 │
│    <Typography>                                                  │
│      Processing: https://example.com/blog/post-42                │
│    </Typography>                                                 │
│    <Box>                                                         │
│      <Chip label="✓ 95 Successful" color="success" />           │
│      <Chip label="⊘ 5 Skipped" color="default" />               │
│      <Chip label="✗ 0 Failed" color="error" />                  │
│    </Box>                                                        │
│    <Typography variant="caption">                               │
│      Estimated completion: in 45 seconds                         │
│    </Typography>                                                 │
│    <Button disabled>Close</Button>  {/* Disabled during run */} │
│  </EngineSetupProgressDialog>                                    │
└──────────────────────────────────────────────────────────────────┘

               [2 seconds later]

               │
               ▼

          [Repeat cycle until status === "completed" or "failed"]
```

---

## 7. KEY FEATURES & CAPABILITIES

### 7.1 ENGINE Setup Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Dual Import Modes** | Sitemap XML parsing or manual URL entry | Radio button selection in modal |
| **Bulk URL Input** | Paste multiple URLs (one per line) | Textarea with parsing on submit |
| **Sitemap Validation** | Test sitemap URL before setup | `test-sitemap` endpoint + preview |
| **Real-Time Progress** | Live updates during import | 2-second polling + WebSocket future |
| **Duplicate Detection** | Skips URLs already in database | Set-based lookup in service |
| **Batch Processing** | Processes 50 URLs at a time | Prevents memory issues, enables progress |
| **Error Recovery** | Tracks failed pages with retry count | `is_failed`, `failure_reason` fields |
| **Historical Audit** | Keeps record of all setup runs | `EngineSetupRun` with timestamps |
| **Cancellation** | Stop running setup mid-execution | APScheduler job removal |
| **Sitemap Recursion** | Handles nested sitemap indexes | Recursive parsing in SitemapParser |

### 7.2 Client Management Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Search & Filter** | Search by name/URL, filter by lead | Query params on GET /clients |
| **Project Leads** | Assign responsible person to client | ProjectLead foreign key relationship |
| **Bulk Operations** | Delete multiple clients at once | `bulk-delete` endpoint with backup |
| **Data Backup** | Generate .zip with all client data | Streaming response with JSON metadata |
| **Password Protection** | Confirm deletions with password | Password validation in service |
| **Logo Upload** | Store client logos | `logo_url` field (S3/CDN ready) |
| **Status Management** | Mark clients as Active/Inactive | `status` field with indexing |
| **Unique Naming** | Prevent duplicate client names | Unique constraint + validation |
| **Cascade Deletion** | Auto-delete related pages/runs | Database foreign key constraints |
| **Page Count Tracking** | Display total discovered pages | Auto-updated after setup |

### 7.3 Page Management Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Advanced Filtering** | Filter by status, word count, crawl date | ✅ Implemented |
| **Pagination** | Server-side pagination (limit/offset) | ✅ Implemented |
| **Bulk Actions** | Re-crawl or delete multiple pages | ✅ Implemented |
| **Status Tracking** | Track HTTP status codes (200, 404, etc.) | ✅ Implemented |
| **Failure Logging** | Record why pages failed to load | ✅ Implemented |
| **Retry Mechanism** | Track retry attempts for failed pages | ✅ Implemented |
| **URL Slug Extraction** | Auto-extract URL path as slug | ✅ Implemented |

### 7.4 SEO Data Extraction (Phase 3/4)

| Data Point | Type | Extraction Method |
|------------|------|-------------------|
| **Page Title** | str | HTML `<title>` tag |
| **Meta Title** | str | `<meta name="title">` |
| **Meta Description** | str | `<meta name="description">` |
| **H1 Heading** | str | First `<h1>` tag |
| **Canonical URL** | str | `<link rel="canonical">` |
| **Hreflang** | JSON | `<link rel="alternate" hreflang>` |
| **Meta Robots** | str | `<meta name="robots">` |
| **Word Count** | int | Text content word count |
| **Body Content** | str | Visible text extraction |
| **Webpage Structure** | JSON | HTML element tree |
| **Schema Markup** | JSON | JSON-LD structured data |
| **Salient Entities** | JSON | Google NLP API extraction |
| **Internal Links** | JSON | Links to same domain |
| **External Links** | JSON | Links to other domains |
| **Image Count** | int | Count of `<img>` tags |
| **Content Embedding** | vector | OpenAI embedding (1536 dimensions) |
| **Screenshots** | str (URL) | Playwright screenshot capture |
| **Full Screenshot** | str (URL) | Full-page screenshot |
| **Last Crawled** | datetime | Extraction timestamp |
| **Crawl Run ID** | UUID | Batch tracking |

---

## 8. SECURITY & BEST PRACTICES

### 8.1 Security Implementations

| Security Concern | Implementation | Location |
|------------------|----------------|----------|
| **Authentication** | JWT tokens via HTTPBearer | `app/auth_backend.py` |
| **Authorization** | `Depends(get_current_user)` on all endpoints | Controllers |
| **Password Validation** | Password check before deletion | `client_service.py:delete_client()` |
| **SQL Injection** | SQLModel ORM (parameterized queries) | All database queries |
| **XSS Prevention** | React auto-escapes JSX content | Frontend components |
| **CSRF Protection** | CORS with allowed origins | `main.py:64-76` |
| **Input Validation** | Pydantic schemas + Zod validation | Schemas + frontend forms |
| **URL Validation** | URLValidator checks scheme/domain | `url_validator.py` |
| **Timeout Protection** | 10s timeout on external HTTP requests | `sitemap_parser.py` |
| **Rate Limiting** | Not yet implemented | **TODO** |

### 8.2 Code Quality Patterns

**Backend:**
- ✅ Async/await throughout (no blocking I/O)
- ✅ Type hints on all functions
- ✅ Dependency injection via FastAPI Depends
- ✅ Exception handling in service layer
- ✅ HTTP exceptions in controller layer
- ✅ Database transactions (commit/rollback)
- ✅ Eager loading of relationships (`selectinload`)
- ✅ Index optimization on frequently queried fields

**Frontend:**
- ✅ TypeScript strict mode
- ✅ React Query for server state management
- ✅ Error boundaries for component errors
- ✅ Form validation with Zod schemas
- ✅ Separation of concerns (pages/components/hooks)
- ✅ Reusable UI components (ModernCard, StandardButton)
- ✅ Responsive design (mobile-first)
- ✅ Accessibility (ARIA labels, keyboard navigation)

### 8.3 Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| **Database Indexing** | Indexes on `client.name`, `client_page.client_id`, `client_page.status_code`, etc. |
| **Batch Processing** | 50 URLs per batch (prevents memory overflow) |
| **React Query Caching** | 5-minute stale time on client list |
| **Eager Loading** | `selectinload(Client.project_lead)` to avoid N+1 queries |
| **Pagination** | Server-side limit/offset on page lists |
| **Lazy Loading** | Routes code-split with React.lazy() |
| **Connection Pooling** | SQLModel async engine with pool |
| **Background Jobs** | APScheduler for long-running tasks |
| **Progress Batching** | Update progress after each 50-URL batch, not per URL |

---

## 9. TESTING RECOMMENDATIONS

### 9.1 Backend Testing

**Unit Tests** (`tests/unit/`)
```python
# Test service business logic
async def test_create_client_with_valid_data():
    # Mock database session
    # Call service.create_client()
    # Assert client created
    # Assert engine_setup_completed = False

async def test_create_client_duplicate_name():
    # Create client with name "Acme Corp"
    # Attempt to create another with same name
    # Assert raises ValidationException

async def test_execute_sitemap_setup_success():
    # Mock SitemapParser.parse_sitemap() → returns 10 URLs
    # Mock ClientPageService.create_pages_bulk()
    # Call execute_sitemap_setup()
    # Assert run.status = "completed"
    # Assert client.engine_setup_completed = True
```

**Integration Tests** (`tests/integration/`)
```python
# Test full API endpoints
async def test_engine_setup_flow():
    # 1. Create client via POST /api/clients
    # 2. Start setup via POST /api/engine-setup/start
    # 3. Poll progress via GET /api/engine-setup/{run_id}/progress
    # 4. Verify client.page_count updated
    # 5. Verify pages created in database
```

### 9.2 Frontend Testing

**Component Tests** (`frontend/src/**/*.test.tsx`)
```typescript
describe('EngineSetupModal', () => {
  test('validates sitemap URL format', () => {
    render(<EngineSetupModal />);
    // Select sitemap mode
    // Enter invalid URL
    // Assert error message shown
  });

  test('submits sitemap setup request', async () => {
    const mockMutate = jest.fn();
    // Mock useStartEngineSetup hook
    render(<EngineSetupModal />);
    // Enter sitemap URL
    // Click "Start Setup"
    // Assert mockMutate called with correct payload
  });
});

describe('EngineSetupProgressDialog', () => {
  test('polls progress every 2 seconds', () => {
    jest.useFakeTimers();
    render(<EngineSetupProgressDialog runId="123" />);
    // Fast-forward 2 seconds
    jest.advanceTimersByTime(2000);
    // Assert API called
    // Fast-forward again
    jest.advanceTimersByTime(2000);
    // Assert API called again
  });

  test('stops polling when completed', () => {
    // Mock progress data with status="completed"
    render(<EngineSetupProgressDialog runId="123" />);
    // Assert no more polling calls
  });
});
```

### 9.3 End-to-End Testing

**Playwright Tests** (`tests/e2e/`)
```typescript
test('complete engine setup flow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 2. Create client
  await page.goto('/clients/new');
  await page.fill('input[name="name"]', 'Test Client');
  await page.fill('input[name="website_url"]', 'https://example.com');
  await page.click('button[type="submit"]');

  // 3. Start engine setup
  await page.waitForSelector('button:has-text("Setup Website Engine")');
  await page.click('button:has-text("Setup Website Engine")');
  await page.click('input[value="sitemap"]');
  await page.fill('input[name="sitemap_url"]', 'https://example.com/sitemap.xml');
  await page.click('button:has-text("Start Setup")');

  // 4. Wait for completion
  await page.waitForSelector('text=Setup completed', { timeout: 60000 });
  await page.click('button:has-text("Close")');

  // 5. Verify pages listed
  await expect(page.locator('table tbody tr')).toHaveCountGreaterThan(0);
});
```

---

## 10. FUTURE ENHANCEMENTS

### 10.1 Planned Features

| Feature | Priority | Estimated Effort |
|---------|----------|------------------|
| **Scheduled Crawls** | High | 3 days |
| **WebSocket Progress** | Medium | 2 days |
| **Rate Limiting** | High | 1 day |
| **Advanced Search** | Low | 2 days |
| **Export to CSV** | Medium | 1 day |
| **Bulk Edit Pages** | Low | 2 days |
| **Custom Data Points** | Medium | 3 days |
| **Vector Similarity Search** | High | 5 days |
| **AI Content Analysis** | Low | 7 days |
| **Multi-language Support** | Low | 5 days |

### 10.2 Scheduled Crawls Implementation

**Database Changes:**
- Add `Client.crawl_schedule` (JSONB):
  ```json
  {
    "enabled": true,
    "frequency": "weekly",
    "day_of_week": "monday",
    "time": "02:00",
    "data_points": ["title", "meta_description", "word_count"]
  }
  ```

**Backend:**
- Add APScheduler cron trigger:
  ```python
  scheduler.add_job(
      func=run_scheduled_crawl,
      trigger=CronTrigger(day_of_week='mon', hour=2),
      args=[client_id],
      id=f"scheduled_crawl_{client_id}"
  )
  ```

**Frontend:**
- Add "Schedule" tab in ClientDetail page
- Form with frequency selector (daily/weekly/monthly)
- Time picker for crawl time
- Data point checkboxes

### 10.3 WebSocket Real-Time Updates

**Replace polling with WebSocket:**
- Backend: FastAPI WebSocket endpoint
  ```python
  @app.websocket("/ws/engine-setup/{run_id}")
  async def websocket_progress(websocket: WebSocket, run_id: UUID):
      await websocket.accept()
      while True:
          progress = await get_progress(run_id)
          await websocket.send_json(progress)
          if progress.status in ["completed", "failed"]:
              break
          await asyncio.sleep(1)
  ```

- Frontend: WebSocket hook
  ```typescript
  const useWebSocketProgress = (runId: string) => {
    const [progress, setProgress] = useState(null);

    useEffect(() => {
      const ws = new WebSocket(`ws://localhost:8000/ws/engine-setup/${runId}`);
      ws.onmessage = (event) => {
        setProgress(JSON.parse(event.data));
      };
      return () => ws.close();
    }, [runId]);

    return progress;
  };
  ```

---

## 11. KNOWN ISSUES & LIMITATIONS

### 11.1 Current Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **No rate limiting** | API abuse potential | Manual monitoring |
| **Polling overhead** | Increased server load | WebSocket planned |
| **Max 1000 manual URLs** | Hard limit in validation | Use sitemap instead |
| **No retry for failed pages** | Manual re-crawl needed | Bulk retry feature planned |
| **No multi-user collaboration** | Single user per client | Role-based access planned |
| **No versioning of crawl data** | Overwrites previous data | DataPoint versioning exists |
| **No notification system** | User must check manually | Email/webhook planned |

### 11.2 Known Issues

| Issue | Status | Workaround |
|-------|--------|------------|
| **Sitemap timeout for large files** | Open | Increase timeout to 30s |
| **Progress dialog shows old data briefly** | Open | Add loading state on open |
| **Duplicate URL detection case-sensitive** | Open | Normalize to lowercase |
| **No indication of running job on reload** | Open | Check job status on mount |

---

## 12. DEPLOYMENT CONSIDERATIONS

### 12.1 Environment Variables

**Backend** (`.env` file):
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname

# Security
SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# External APIs
OPENAI_API_KEY=sk-...
GOOGLE_NLP_API_KEY=...

# Storage (for screenshots)
S3_BUCKET=velocity-screenshots
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=us-east-1

# Application
DOMAIN=https://yourapp.com
ENVIRONMENT=production
```

**Frontend** (`.env` file):
```bash
VITE_API_BASE_URL=https://api.yourapp.com
```

### 12.2 Database Migrations

**Pre-deployment checklist:**
```bash
# 1. Backup production database
pg_dump -h host -U user dbname > backup.sql

# 2. Test migrations on staging
alembic upgrade head

# 3. Verify data integrity
python scripts/verify_data.py

# 4. Deploy to production
alembic upgrade head
```

### 12.3 Scaling Recommendations

**Horizontal Scaling:**
- Frontend: Deploy to CDN (Vercel, Netlify)
- Backend: Multiple uvicorn workers behind load balancer
- Database: Read replicas for GET requests
- Background jobs: Separate worker instances

**Vertical Scaling:**
- Increase batch size to 100 URLs (from 50)
- Add Redis caching for frequently accessed clients
- Implement database connection pooling (already in place)

**Monitoring:**
- Add New Relic / DataDog for APM
- Track setup run times and page processing rates
- Alert on failed runs or high error rates

---

## 13. CONCLUSION

### 13.1 Architecture Assessment

**Strengths:**
✅ **Clean separation of concerns** (Controllers → Services → Models)
✅ **Production-ready patterns** (async/await, type safety, error handling)
✅ **Real-time progress tracking** (polling with planned WebSocket upgrade)
✅ **Scalable background job system** (APScheduler with batch processing)
✅ **Comprehensive data model** (22 SEO data points, flexible DataPoint system)
✅ **User-friendly UI** (Material-UI, real-time feedback, error states)
✅ **Security-conscious** (JWT auth, password confirmation, input validation)

**Areas for Improvement:**
⚠️ **Rate limiting** - Add API rate limits (e.g., 100 req/min per user)
⚠️ **WebSocket implementation** - Replace polling for true real-time updates
⚠️ **Comprehensive testing** - Increase test coverage (target: 80%+)
⚠️ **Monitoring & observability** - Add logging, metrics, and tracing
⚠️ **Documentation** - Auto-generate API docs from OpenAPI schema

### 13.2 Summary

The **Client Management & ENGINE Setup** system is a **well-architected, production-ready platform** for discovering and analyzing website pages at scale. The system successfully implements:

1. **Dual-mode page discovery** (sitemap parsing + manual entry)
2. **Real-time progress tracking** with batch processing
3. **Comprehensive SEO data extraction** (22 data points)
4. **Scalable background job architecture** (APScheduler)
5. **Modern frontend experience** (React + Material-UI)
6. **Clean code patterns** (3-tier architecture, type safety)

The codebase demonstrates **professional software engineering practices** including:
- Async database operations
- Type-safe schemas (Pydantic + TypeScript)
- Error handling and validation
- Relationship management (foreign keys, cascade deletes)
- Performance optimization (indexes, batch processing, eager loading)
- Security best practices (JWT auth, password protection)

**Recommended Next Steps:**
1. Add WebSocket support for real-time updates
2. Implement rate limiting and API throttling
3. Add comprehensive test suite (unit + integration + e2e)
4. Set up monitoring and alerting (APM, error tracking)
5. Implement scheduled crawls feature
6. Add vector similarity search for content analysis

---

**Report Generated:** November 10, 2025
**Audit Scope:** Client Management + ENGINE Setup (Phases 1-2)
**Next Phase:** Data Extraction & Analysis (Phases 3-4)

