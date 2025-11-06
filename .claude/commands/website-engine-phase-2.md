---
description: Analyze and implement the Website Engine Setup feature for client page discovery
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task
model: sonnet
argument-hint: [review|implement|test]
---

# Website Engine Setup & Page Discovery Implementation

You are implementing Phase 2 of the content extraction system: Website Engine Setup feature that discovers and imports pages from client websites.

## STACK OVERVIEW

**Backend:** FastAPI 0.115+ + SQLModel + PostgreSQL + Alembic
**Frontend:** React 18 + TypeScript + Vite + Material-UI v6
**Background Jobs:** APScheduler (NOT Celery/Redis)
**State Management:** TanStack React Query + Context API
**ORM:** SQLModel (SQLAlchemy + Pydantic)

## COMMAND MODES

**Usage:** `/website-engine [mode]`

- `review` - Review existing codebase structure before implementation
- `implement` - Build the complete feature
- `test` - Verify implementation against testing checklist

---

## IMPLEMENTATION INSTRUCTIONS

### STEP 1: REVIEW EXISTING CODE (REQUIRED FIRST)

Before implementing, examine:

- ✅ Client database schema and models (`app/models.py`)
- ✅ Client detail page structure (`frontend/src/pages/Clients/ClientDetail.tsx`)
- ✅ Form and modal patterns (`frontend/src/components/Settings/ProjectLeadsManager.tsx`)
- ✅ Current API route patterns (`app/controllers/clients.py`)
- ✅ UI component library (Material-UI v6 in `frontend/src/components/ui/`)
- ✅ Background job system (APScheduler in `app/tasks/crawl_tasks.py`)
- ✅ Existing test-sitemap endpoint (`app/controllers/clients.py:220`)

**Output a summary of:**

1. Database ORM: SQLModel (SQLAlchemy + Pydantic)
2. Current client schema fields: name, website_url, sitemap_url, page_count, etc.
3. Modal component pattern: MUI Dialog with React Hook Form + Zod
4. API route structure: FastAPI with `app/controllers/` → `app/services/` → `app/models.py`
5. UI library: Material-UI v6 (MUI) with custom components in `components/ui/`
6. Background jobs: APScheduler with AsyncIO scheduler

---

### STEP 2: DATABASE SCHEMA

**Create SQLModel classes in `app/models.py`:**

```python
# app/models.py

class Page(UUIDModelBase, table=True):
    """Model representing a page/URL from a client's website."""
    client_id: uuid.UUID = Field(foreign_key="client.id", nullable=False, index=True)
    url: str = Field(nullable=False, sa_column=Column(sa.Text))
    slug: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    status_code: Optional[int] = Field(default=None, index=True)
    is_failed: bool = Field(default=False, nullable=False, index=True)
    failure_reason: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    retry_count: int = Field(default=0, nullable=False)
    last_checked_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)
    updated_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    # Relationships
    client: "Client" = Relationship(back_populates="pages")

    __table_args__ = (
        UniqueConstraint("client_id", "url", name="unique_client_url"),
    )


class EngineSetupRun(UUIDModelBase, table=True):
    """Model representing an engine setup run (sitemap import or manual entry)."""
    client_id: uuid.UUID = Field(foreign_key="client.id", nullable=False, index=True)
    setup_type: str = Field(nullable=False)  # 'sitemap' or 'manual'
    total_pages: int = Field(default=0, nullable=False)
    successful_pages: int = Field(default=0, nullable=False)
    failed_pages: int = Field(default=0, nullable=False)
    skipped_pages: int = Field(default=0, nullable=False)  # Duplicates
    status: str = Field(default="pending", nullable=False, index=True)  # 'pending', 'in_progress', 'completed', 'failed'
    current_url: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    progress_percentage: int = Field(default=0, nullable=False)
    error_message: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    started_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    # Relationships
    client: "Client" = Relationship(back_populates="engine_setup_runs")


# Update Client model - ADD these fields and relationships
class Client(UUIDModelBase, table=True):
    # ... existing fields ...

    # NEW FIELDS:
    engine_setup_completed: bool = Field(default=False, nullable=False, index=True)
    last_setup_run_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="engine_setup_run.id", nullable=True
    )

    # NEW RELATIONSHIPS:
    pages: List["Page"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"}
    )
    engine_setup_runs: List["EngineSetupRun"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"}
    )

    # NOTE: page_count field already exists - reuse it!
```

**Generate Alembic Migration:**

```bash
poetry run alembic revision --autogenerate -m "add pages and engine setup tables"
```

**IMPORTANT:** Review the generated migration file before applying!

**Apply Migration:**

```bash
poetry run alembic upgrade head
# OR
task db:migrate-up
```

---

### STEP 3: BACKEND SCHEMAS

**Create `app/schemas/page.py`:**

```python
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
import uuid
import datetime

class PageBase(BaseModel):
    url: str
    slug: Optional[str] = None

class PageCreate(PageBase):
    client_id: uuid.UUID

class PageUpdate(BaseModel):
    url: Optional[str] = None
    status_code: Optional[int] = None
    is_failed: Optional[bool] = None
    failure_reason: Optional[str] = None

class PageRead(PageBase):
    id: uuid.UUID
    client_id: uuid.UUID
    status_code: Optional[int]
    is_failed: bool
    failure_reason: Optional[str]
    retry_count: int
    last_checked_at: Optional[datetime.datetime]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class PageList(BaseModel):
    pages: list[PageRead]
    total: int
    page: int
    per_page: int
    total_pages: int
```

**Create `app/schemas/engine_setup.py`:**

```python
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import uuid
import datetime

class EngineSetupRequest(BaseModel):
    setup_type: str  # 'sitemap' or 'manual'
    sitemap_url: Optional[str] = None
    urls: Optional[List[str]] = None

class EngineSetupResponse(BaseModel):
    run_id: uuid.UUID
    status: str
    message: str
    job_id: str

class ProgressResponse(BaseModel):
    run_id: uuid.UUID
    status: str
    progress: dict  # { current, total, percentage }
    current_url: Optional[str]
    successful_pages: int
    failed_pages: int
    skipped_pages: int
    remaining_pages: int
    estimated_time_seconds: Optional[int]
    started_at: Optional[datetime.datetime]
    error_message: Optional[str]

    class Config:
        from_attributes = True

class RetryPagesRequest(BaseModel):
    page_ids: List[uuid.UUID]

class AddPagesRequest(BaseModel):
    setup_type: str  # 'sitemap' or 'manual'
    sitemap_url: Optional[str] = None
    urls: Optional[List[str]] = None
```

---

### STEP 4: BACKEND SERVICES

**Create `app/services/page_service.py`:**

```python
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func
from fastapi import HTTPException, status
from typing import Optional
import uuid

from app.models import Page, Client
from app.schemas.page import PageCreate, PageUpdate, PageList, PageRead

class PageService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_pages(
        self,
        client_id: uuid.UUID,
        page: int = 1,
        per_page: int = 100,
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> PageList:
        """Get paginated list of pages for a client."""
        query = select(Page).where(Page.client_id == client_id)

        # Search filter
        if search:
            query = query.where(
                (Page.url.ilike(f"%{search}%")) |
                (Page.slug.ilike(f"%{search}%"))
            )

        # Status filter
        if status_filter == "failed":
            query = query.where(Page.is_failed == True)
        elif status_filter == "success":
            query = query.where(Page.is_failed == False)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.execute(count_query)
        total = total.scalar_one()

        # Paginate
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page).order_by(Page.created_at.desc())

        result = await self.session.execute(query)
        pages = result.scalars().all()

        return PageList(
            pages=[PageRead.model_validate(p) for p in pages],
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page
        )

    async def get_page_by_id(self, page_id: uuid.UUID) -> Optional[Page]:
        """Get a single page by ID."""
        result = await self.session.execute(
            select(Page).where(Page.id == page_id)
        )
        return result.scalar_one_or_none()

    async def create_page(self, page_data: PageCreate) -> Page:
        """Create a new page."""
        page = Page(**page_data.model_dump())
        self.session.add(page)
        await self.session.commit()
        await self.session.refresh(page)
        return page

    async def bulk_create_pages(self, pages_data: List[dict]) -> int:
        """Bulk insert pages for performance."""
        self.session.bulk_insert_mappings(Page, pages_data)
        await self.session.commit()
        return len(pages_data)

    async def update_page(self, page_id: uuid.UUID, page_data: PageUpdate) -> Page:
        """Update a page."""
        page = await self.get_page_by_id(page_id)
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")

        for key, value in page_data.model_dump(exclude_unset=True).items():
            setattr(page, key, value)

        await self.session.commit()
        await self.session.refresh(page)
        return page

    async def delete_page(self, page_id: uuid.UUID) -> None:
        """Delete a page."""
        page = await self.get_page_by_id(page_id)
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")

        await self.session.delete(page)
        await self.session.commit()
```

**Create `app/services/engine_setup_service.py`:**

```python
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from fastapi import HTTPException, status
import uuid
from typing import List, Optional

from app.models import Client, EngineSetupRun, Page
from app.schemas.engine_setup import (
    EngineSetupRequest,
    EngineSetupResponse,
    ProgressResponse
)

class EngineSetupService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def initiate_setup(
        self,
        client_id: uuid.UUID,
        setup_data: EngineSetupRequest
    ) -> EngineSetupResponse:
        """Initiate engine setup (sitemap or manual)."""
        # Validate client exists
        client = await self.session.get(Client, client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        # Check for existing in-progress run
        existing = await self.session.execute(
            select(EngineSetupRun)
            .where(EngineSetupRun.client_id == client_id)
            .where(EngineSetupRun.status == 'in_progress')
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=409,
                detail="Setup already in progress for this client"
            )

        # Validate request
        if setup_data.setup_type == 'sitemap' and not setup_data.sitemap_url:
            raise HTTPException(
                status_code=400,
                detail="sitemap_url required for sitemap setup type"
            )
        if setup_data.setup_type == 'manual' and not setup_data.urls:
            raise HTTPException(
                status_code=400,
                detail="urls required for manual setup type"
            )

        # Create setup run
        run = EngineSetupRun(
            client_id=client_id,
            setup_type=setup_data.setup_type,
            status="pending"
        )
        self.session.add(run)
        await self.session.commit()
        await self.session.refresh(run)

        # Schedule background task
        from app.tasks.engine_setup_tasks import schedule_engine_setup
        job_id = schedule_engine_setup(
            client_id=client_id,
            run_id=run.id,
            setup_data=setup_data
        )

        return EngineSetupResponse(
            run_id=run.id,
            status=run.status,
            message="Engine setup initiated",
            job_id=job_id
        )

    async def get_progress(
        self,
        client_id: uuid.UUID,
        run_id: uuid.UUID
    ) -> ProgressResponse:
        """Get progress of engine setup run."""
        run = await self.session.get(EngineSetupRun, run_id)
        if not run or run.client_id != client_id:
            raise HTTPException(status_code=404, detail="Setup run not found")

        # Calculate remaining
        remaining = run.total_pages - run.successful_pages - run.failed_pages

        # Estimate time (assume 100 pages/minute)
        estimated_time = None
        if remaining > 0 and run.status == 'in_progress':
            estimated_time = int(remaining / 100 * 60)  # seconds

        return ProgressResponse(
            run_id=run.id,
            status=run.status,
            progress={
                "current": run.successful_pages + run.failed_pages,
                "total": run.total_pages,
                "percentage": run.progress_percentage
            },
            current_url=run.current_url,
            successful_pages=run.successful_pages,
            failed_pages=run.failed_pages,
            skipped_pages=run.skipped_pages,
            remaining_pages=remaining,
            estimated_time_seconds=estimated_time,
            started_at=run.started_at,
            error_message=run.error_message
        )
```

**Create `app/utils/sitemap_parser.py`:**

```python
import lxml.etree as etree
import gzip
import requests
from typing import List
from fastapi import HTTPException

SITEMAP_NAMESPACES = {
    'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'
}

def parse_sitemap(url: str, depth: int = 0) -> List[str]:
    """
    Parse XML sitemap and extract all URLs.
    Handles standard sitemaps, sitemap indexes, and gzipped files.
    """
    if depth > 3:
        raise ValueError("Maximum sitemap recursion depth exceeded")

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch sitemap: {str(e)}"
        )

    # Handle gzipped sitemaps
    try:
        if url.endswith('.gz'):
            content = gzip.decompress(response.content)
        else:
            content = response.content
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to decompress sitemap: {str(e)}"
        )

    # Parse XML
    try:
        tree = etree.fromstring(content)
    except etree.XMLSyntaxError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid XML format: {str(e)}"
        )

    # Check if sitemap index
    if tree.tag.endswith('sitemapindex'):
        return parse_sitemap_index(tree, depth)

    # Extract URLs
    urls = tree.xpath('//ns:loc/text()', namespaces=SITEMAP_NAMESPACES)

    if not urls:
        # Try without namespace
        urls = tree.xpath('//loc/text()')

    return urls


def parse_sitemap_index(tree, depth: int) -> List[str]:
    """Parse sitemap index file (contains links to multiple sitemaps)."""
    sitemap_urls = tree.xpath('//ns:sitemap/ns:loc/text()', namespaces=SITEMAP_NAMESPACES)

    if not sitemap_urls:
        sitemap_urls = tree.xpath('//sitemap/loc/text()')

    all_urls = []
    for sitemap_url in sitemap_urls:
        try:
            all_urls.extend(parse_sitemap(sitemap_url, depth + 1))
        except Exception as e:
            # Log error but continue with other sitemaps
            print(f"Failed to parse nested sitemap {sitemap_url}: {e}")
            continue

    return all_urls
```

**Create `app/utils/url_validator.py`:**

```python
from urllib.parse import urlparse, urlunparse
from typing import List, Tuple
import re

def normalize_url(url: str) -> str:
    """
    Normalize URL for consistency.
    - Lowercase domain
    - Add https:// if missing
    - Add trailing slash
    - Strip fragments
    """
    # Add protocol if missing
    if not url.startswith(('http://', 'https://')):
        url = f'https://{url}'

    parsed = urlparse(url)

    # Normalize domain (lowercase)
    domain = parsed.netloc.lower()

    # Normalize path (add trailing slash if not present and no file extension)
    path = parsed.path
    if not path:
        path = '/'
    elif not path.endswith('/') and '.' not in path.split('/')[-1]:
        path += '/'

    # Reconstruct URL without fragment
    normalized = urlunparse((
        parsed.scheme,
        domain,
        path,
        parsed.params,
        parsed.query,
        ''  # Remove fragment
    ))

    return normalized


def validate_url(url: str) -> Tuple[bool, str]:
    """
    Validate URL format.
    Returns (is_valid, error_message)
    """
    # Check for spaces
    if ' ' in url:
        return False, "URL contains spaces"

    # Check for valid protocol
    if not url.startswith(('http://', 'https://')):
        return False, "URL must start with http:// or https://"

    # Parse URL
    try:
        parsed = urlparse(url)
    except Exception as e:
        return False, f"Invalid URL format: {str(e)}"

    # Check for domain
    if not parsed.netloc:
        return False, "URL must have a domain"

    # Check for invalid characters
    invalid_chars = ['<', '>', '"', '\\', '^', '`', '{', '}', '|']
    if any(char in url for char in invalid_chars):
        return False, "URL contains invalid characters"

    return True, ""


def detect_duplicates(urls: List[str]) -> Tuple[List[str], List[str]]:
    """
    Detect and remove duplicate URLs.
    Returns (unique_urls, duplicate_urls)
    """
    seen = set()
    unique = []
    duplicates = []

    for url in urls:
        normalized = normalize_url(url)
        if normalized in seen:
            duplicates.append(url)
        else:
            seen.add(normalized)
            unique.append(normalized)

    return unique, duplicates
```

---

### STEP 5: BACKGROUND TASKS (APScheduler)

**Create `app/tasks/engine_setup_tasks.py`:**

```python
from apscheduler.triggers.date import DateTrigger
from sqlmodel.ext.asyncio.session import AsyncSession, async_sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine
import uuid
import asyncio
import aiohttp
from typing import List
import logging

from app.config.base import config
from app.models import EngineSetupRun, Page, Client
from app.schemas.engine_setup import EngineSetupRequest
from app.utils.sitemap_parser import parse_sitemap
from app.utils.url_validator import normalize_url, validate_url, detect_duplicates
from app.tasks.crawl_tasks import get_scheduler

logger = logging.getLogger(__name__)


def schedule_engine_setup(
    client_id: uuid.UUID,
    run_id: uuid.UUID,
    setup_data: EngineSetupRequest
) -> str:
    """Schedule engine setup background task."""
    scheduler = get_scheduler()

    job = scheduler.add_job(
        run_engine_setup_task,
        trigger=DateTrigger(),  # Execute immediately
        args=[str(client_id), str(run_id), setup_data.model_dump()],
        id=f"engine_setup_{run_id}",
        replace_existing=True
    )

    logger.info(f"Scheduled engine setup job {job.id} for client {client_id}")
    return job.id


async def run_engine_setup_task(
    client_id_str: str,
    run_id_str: str,
    setup_data_dict: dict
):
    """Background task to process engine setup."""
    client_id = uuid.UUID(client_id_str)
    run_id = uuid.UUID(run_id_str)
    setup_data = EngineSetupRequest(**setup_data_dict)

    # Create independent database session
    engine = create_async_engine(config.database_url)
    async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_factory() as session:
        try:
            # Get run
            run = await session.get(EngineSetupRun, run_id)
            if not run:
                logger.error(f"Run {run_id} not found")
                return

            # Update status to in_progress
            run.status = 'in_progress'
            run.started_at = datetime.datetime.utcnow()
            await session.commit()

            # Get URLs
            if setup_data.setup_type == 'sitemap':
                urls = parse_sitemap(setup_data.sitemap_url)
            else:
                urls = setup_data.urls

            # Validate and normalize URLs
            validated_urls = []
            invalid_urls = []

            for url in urls:
                is_valid, error = validate_url(url)
                if is_valid:
                    validated_urls.append(normalize_url(url))
                else:
                    invalid_urls.append((url, error))
                    logger.warning(f"Invalid URL {url}: {error}")

            # Detect duplicates
            unique_urls, duplicate_urls = detect_duplicates(validated_urls)

            # Check for existing pages
            from sqlmodel import select
            existing_result = await session.execute(
                select(Page.url).where(Page.client_id == client_id)
            )
            existing_urls = set(url for (url,) in existing_result)

            # Filter out existing pages
            new_urls = [url for url in unique_urls if url not in existing_urls]
            skipped_count = len(unique_urls) - len(new_urls)

            # Update run totals
            run.total_pages = len(new_urls)
            run.skipped_pages = skipped_count + len(duplicate_urls)
            await session.commit()

            # Process pages in batches
            batch_size = 500
            successful_count = 0
            failed_count = 0

            for i in range(0, len(new_urls), batch_size):
                batch = new_urls[i:i+batch_size]

                # Process batch
                for url in batch:
                    try:
                        # Create page
                        page = Page(
                            client_id=client_id,
                            url=url,
                            slug=urlparse(url).path,
                            status_code=None,  # Will be fetched later
                            is_failed=False
                        )
                        session.add(page)
                        successful_count += 1

                    except Exception as e:
                        logger.error(f"Failed to create page {url}: {e}")
                        failed_count += 1

                # Commit batch
                await session.commit()

                # Update progress
                run.successful_pages = successful_count
                run.failed_pages = failed_count
                run.progress_percentage = int((successful_count + failed_count) / len(new_urls) * 100)
                run.current_url = batch[-1] if batch else None
                await session.commit()

            # Mark run as completed
            run.status = 'completed'
            run.completed_at = datetime.datetime.utcnow()
            run.progress_percentage = 100
            await session.commit()

            # Update client
            client = await session.get(Client, client_id)
            if client:
                client.engine_setup_completed = True
                client.page_count = successful_count
                client.last_setup_run_id = run_id
                await session.commit()

            logger.info(f"Engine setup completed for client {client_id}: {successful_count} pages")

        except Exception as e:
            logger.error(f"Engine setup failed: {e}", exc_info=True)
            run.status = 'failed'
            run.error_message = str(e)
            run.completed_at = datetime.datetime.utcnow()
            await session.commit()
            raise
```

---

### STEP 6: BACKEND CONTROLLERS (API Endpoints)

**Create `app/controllers/engine_setup.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
import uuid

from app.db import get_async_db_session
from app.services.users_service import get_current_user
from app.services.engine_setup_service import EngineSetupService
from app.schemas.engine_setup import (
    EngineSetupRequest,
    EngineSetupResponse,
    ProgressResponse
)
from app.schemas.users import CurrentUserResponse

router = APIRouter()


@router.post("/clients/{client_id}/engine-setup", response_model=EngineSetupResponse)
async def initiate_engine_setup(
    client_id: uuid.UUID,
    setup_data: EngineSetupRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user)
):
    """Initiate engine setup (sitemap or manual)."""
    service = EngineSetupService(db)
    return await service.initiate_setup(client_id, setup_data)


@router.get("/clients/{client_id}/engine-setup/{run_id}/progress", response_model=ProgressResponse)
async def get_engine_setup_progress(
    client_id: uuid.UUID,
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user)
):
    """Get progress of engine setup run."""
    service = EngineSetupService(db)
    return await service.get_progress(client_id, run_id)
```

**Create `app/controllers/pages.py`:**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
import uuid

from app.db import get_async_db_session
from app.services.users_service import get_current_user
from app.services.page_service import PageService
from app.schemas.page import PageList, PageRead, PageUpdate
from app.schemas.users import CurrentUserResponse

router = APIRouter()


@router.get("/clients/{client_id}/pages", response_model=PageList)
async def list_pages(
    client_id: uuid.UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user)
):
    """List pages for a client with pagination and search."""
    service = PageService(db)
    return await service.get_pages(client_id, page, per_page, search, status_filter)


@router.get("/pages/{page_id}", response_model=PageRead)
async def get_page(
    page_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user)
):
    """Get a single page by ID."""
    service = PageService(db)
    page = await service.get_page_by_id(page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return PageRead.model_validate(page)


@router.put("/pages/{page_id}", response_model=PageRead)
async def update_page(
    page_id: uuid.UUID,
    page_data: PageUpdate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user)
):
    """Update a page."""
    service = PageService(db)
    page = await service.update_page(page_id, page_data)
    return PageRead.model_validate(page)


@router.delete("/pages/{page_id}")
async def delete_page(
    page_id: uuid.UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user)
):
    """Delete a page."""
    service = PageService(db)
    await service.delete_page(page_id)
    return {"message": "Page deleted successfully"}
```

**Register routers in `main.py`:**

```python
# main.py

from app.controllers import engine_setup, pages

app.include_router(engine_setup.router, prefix="/api", tags=["engine-setup"])
app.include_router(pages.router, prefix="/api", tags=["pages"])
```

---

### STEP 7: REGENERATE TYPESCRIPT CLIENT ⭐ **CRITICAL!**

**After implementing ALL backend endpoints, run:**

```bash
task frontend:generate-client
# OR
npm --prefix frontend run generate-client
```

This auto-generates:
- `frontend/src/client/services/EngineSetupService.ts`
- `frontend/src/client/services/PagesService.ts`
- TypeScript types for all request/response schemas

**DO NOT skip this step!** Frontend will have type errors without it.

---

### STEP 8: FRONTEND - REACT QUERY HOOKS

**Create `frontend/src/hooks/api/useEngineSetup.ts`:**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EngineSetupService } from '@/client';
import { useSnackBarContext } from '@/context/SnackBarContext';
import type { EngineSetupRequest } from '@/client';

export const useInitiateSetup = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({ clientId, data }: {
      clientId: string;
      data: EngineSetupRequest
    }) => EngineSetupService.initiateEngineSetup(clientId, data),

    onSuccess: (data, variables) => {
      createSnackBar({
        content: "Engine setup initiated!",
        severity: "success"
      });

      queryClient.invalidateQueries({
        queryKey: ['client', variables.clientId]
      });
    },

    onError: (error: any) => {
      createSnackBar({
        content: error.body?.detail || "Setup failed",
        severity: "error"
      });
    },
  });
};

export const useSetupProgress = (
  clientId: string,
  runId: string | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['engine-setup-progress', clientId, runId],
    queryFn: () => EngineSetupService.getEngineSetupProgress(clientId, runId!),
    enabled: enabled && !!runId,
    refetchInterval: (data) =>
      data?.status === 'in_progress' ? 2000 : false,
    refetchOnWindowFocus: false,
  });
};
```

**Create `frontend/src/hooks/api/usePages.ts`:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PagesService } from '@/client';
import { useSnackBarContext } from '@/context/SnackBarContext';

export const usePages = (
  clientId: string,
  page: number = 1,
  perPage: number = 100,
  search?: string,
  statusFilter?: string
) => {
  return useQuery({
    queryKey: ['pages', clientId, page, perPage, search, statusFilter],
    queryFn: () => PagesService.listPages(clientId, page, perPage, search, statusFilter),
  });
};

export const useDeletePage = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: (pageId: string) => PagesService.deletePage(pageId),
    onSuccess: () => {
      createSnackBar({ content: "Page deleted", severity: "success" });
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });
};
```

---

### STEP 9: FRONTEND COMPONENTS

**Create `frontend/src/components/Clients/EngineSetupModal.tsx`:**

```typescript
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  Stack,
} from '@mui/material';
import { StandardButton } from '@/components/ui';
import { SitemapImportTab } from './SitemapImportTab';
import { ManualImportTab } from './ManualImportTab';
import type { Client } from '@/client';

interface EngineSetupModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  onSuccess: (runId: string) => void;
}

export const EngineSetupModal: React.FC<EngineSetupModalProps> = ({
  open,
  onClose,
  client,
  onSuccess,
}) => {
  const [tab, setTab] = useState(0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Setup Website Engine</DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, pt: 1 }}>
        <Tab label="Import from Sitemap" />
        <Tab label="Add Pages Manually" />
      </Tabs>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {tab === 0 && (
            <SitemapImportTab
              client={client}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          )}
          {tab === 1 && (
            <ManualImportTab
              client={client}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <StandardButton onClick={onClose} variant="outlined">
          Cancel
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};
```

---

### STEP 10: CLIENT DETAIL PAGE - BLOCKING STATE

**Update `frontend/src/pages/Clients/ClientDetail.tsx`:**

```typescript
// Add state for setup modal
const [setupModalOpen, setSetupModalOpen] = useState(false);
const [currentRunId, setCurrentRunId] = useState<string | null>(null);

// Check setup completion
const needsSetup = !client.engine_setup_completed;

// Render blocking state
{needsSetup && (
  <Box sx={{
    position: 'relative',
    minHeight: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 3,
    p: 6,
    border: `2px dashed ${theme.palette.warning.main}`,
    borderRadius: 2,
    backgroundColor: alpha(theme.palette.warning.main, 0.05),
    mb: 4
  }}>
    <WarningAmberIcon sx={{ fontSize: 64, color: 'warning.main' }} />
    <Typography variant="h5" fontWeight={600}>
      Setup Required
    </Typography>
    <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth="600px">
      You must configure the Website Engine before extracting content and analyzing this website.
    </Typography>
    <StandardButton
      variant="contained"
      size="large"
      onClick={() => setSetupModalOpen(true)}
    >
      Setup Website Engine
    </StandardButton>
  </Box>
)}

{/* Grey out other sections if setup not complete */}
<Box sx={{
  filter: needsSetup ? 'grayscale(1) opacity(0.5)' : 'none',
  pointerEvents: needsSetup ? 'none' : 'auto'
}}>
  {/* Existing sections */}
</Box>

{/* Setup Modal */}
<EngineSetupModal
  open={setupModalOpen}
  onClose={() => setSetupModalOpen(false)}
  client={client}
  onSuccess={(runId) => {
    setCurrentRunId(runId);
    setSetupModalOpen(false);
  }}
/>

{/* Progress Tracker */}
{currentRunId && (
  <EngineSetupProgress
    clientId={client.id}
    runId={currentRunId}
    onComplete={() => {
      setCurrentRunId(null);
      refetchClient();
    }}
  />
)}
```

---

## TESTING CHECKLIST

After implementation, verify:

- [ ] ✅ Can import from valid sitemap
- [ ] ✅ Can handle sitemap index files
- [ ] ✅ Can add pages manually (single and bulk)
- [ ] ✅ Duplicate detection works
- [ ] ✅ Invalid URL detection works
- [ ] ✅ Progress indicator updates in real-time
- [ ] ✅ Failed pages are flagged correctly
- [ ] ✅ Retry mechanism works for failed pages
- [ ] ✅ Can add more pages after initial setup
- [ ] ✅ Page list search works
- [ ] ✅ Pagination works correctly
- [ ] ✅ Status codes are fetched and displayed
- [ ] ✅ All error cases show appropriate messages
- [ ] ✅ Database constraints prevent duplicate pages
- [ ] ✅ Engine setup completed flag updates client record

---

## IMPLEMENTATION PRIORITY

1. **Database schema** (models + migration)
2. **Backend services** (page_service, engine_setup_service)
3. **Backend controllers** (API endpoints)
4. **Background tasks** (APScheduler)
5. **Regenerate TypeScript client** ⭐ CRITICAL
6. **Frontend hooks** (React Query)
7. **Frontend components** (Modal, Progress, List)
8. **Client detail integration** (blocking state)
9. **Testing** against full checklist

---

## NOTES

- Follow FastAPI + SQLModel patterns from existing code
- Use Material-UI v6 components (NOT shadcn/ui)
- APScheduler for background jobs (NOT Celery)
- Database-backed progress tracking (NO Redis)
- React Query for state management
- Test sitemap endpoint already exists - reuse it!

---

When implementing, follow the existing codebase patterns discovered in Step 1 (review mode).
