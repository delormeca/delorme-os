"""
Client Page service for managing discovered pages.
"""
from typing import Optional, List, Tuple
from sqlalchemy import select, func, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import datetime

from app.models import ClientPage, Client, ClientPageVersion
from app.schemas.client_page import (
    ClientPageCreate,
    ClientPageUpdate,
    ClientPageRead,
    ClientPageList,
    ClientPageSearchParams,
    EnhancedCrawlResultsList,
    EnhancedCrawlPageData,
    EnhancedDatapoint,
    DatapointHistory
)
from app.core.exceptions import NotFoundException, ValidationException


class ClientPageService:
    """Service for client page operations."""

    def __init__(self, db: AsyncSession):
        """
        Initialize service.

        Args:
            db: Database session
        """
        self.db = db

    async def create_page(
        self,
        page_data: ClientPageCreate
    ) -> ClientPageRead:
        """
        Create a new client page.

        Args:
            page_data: Page creation data

        Returns:
            Created page

        Raises:
            ValidationException: If client doesn't exist or URL is duplicate
        """
        # Verify client exists
        client = await self.db.get(Client, page_data.client_id)
        if not client:
            raise ValidationException(f"Client {page_data.client_id} not found")

        # Check for duplicate URL
        existing = await self.db.execute(
            select(ClientPage).where(
                ClientPage.client_id == page_data.client_id,
                ClientPage.url == page_data.url
            )
        )
        if existing.scalar_one_or_none():
            raise ValidationException(f"Page with URL {page_data.url} already exists for this client")

        # Create page
        page = ClientPage(
            **page_data.model_dump(),
            is_failed=False,
            retry_count=0,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )

        self.db.add(page)
        await self.db.commit()
        await self.db.refresh(page)

        return ClientPageRead.model_validate(page)

    async def create_pages_bulk(
        self,
        client_id: uuid.UUID,
        urls: List[str],
        skip_duplicates: bool = True
    ) -> Tuple[List[ClientPageRead], List[str], List[str]]:
        """
        Create multiple pages in bulk.

        Args:
            client_id: Client ID
            urls: List of URLs to create
            skip_duplicates: Whether to skip duplicate URLs

        Returns:
            Tuple of (created_pages, skipped_urls, failed_urls)

        Raises:
            ValidationException: If client doesn't exist
        """
        # Verify client exists
        client = await self.db.get(Client, client_id)
        if not client:
            raise ValidationException(f"Client {client_id} not found")

        # Get existing URLs for this client
        existing_result = await self.db.execute(
            select(ClientPage.url).where(ClientPage.client_id == client_id)
        )
        existing_urls = set(row[0] for row in existing_result.all())

        created_pages = []
        skipped_urls = []
        failed_urls = []

        for url in urls:
            try:
                if url in existing_urls:
                    if skip_duplicates:
                        skipped_urls.append(url)
                        continue
                    else:
                        failed_urls.append(url)
                        continue

                # Create page
                page = ClientPage(
                    client_id=client_id,
                    url=url,
                    is_failed=False,
                    retry_count=0,
                    created_at=datetime.datetime.utcnow(),
                    updated_at=datetime.datetime.utcnow()
                )

                self.db.add(page)
                created_pages.append(page)
                existing_urls.add(url)  # Track to prevent duplicates in this batch

            except Exception:
                failed_urls.append(url)

        # Commit all at once
        await self.db.commit()

        # Refresh all created pages
        for page in created_pages:
            await self.db.refresh(page)

        created_reads = [ClientPageRead.model_validate(p) for p in created_pages]

        return created_reads, skipped_urls, failed_urls

    async def get_page(self, page_id: uuid.UUID) -> ClientPageRead:
        """
        Get a page by ID.

        Args:
            page_id: Page ID

        Returns:
            Page data

        Raises:
            NotFoundException: If page not found
        """
        page = await self.db.get(ClientPage, page_id)
        if not page:
            raise NotFoundException(f"Page {page_id} not found")

        return ClientPageRead.model_validate(page)

    async def update_page(
        self,
        page_id: uuid.UUID,
        update_data: ClientPageUpdate
    ) -> ClientPageRead:
        """
        Update a page.

        Args:
            page_id: Page ID
            update_data: Update data

        Returns:
            Updated page

        Raises:
            NotFoundException: If page not found
        """
        page = await self.db.get(ClientPage, page_id)
        if not page:
            raise NotFoundException(f"Page {page_id} not found")

        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(page, key, value)

        page.updated_at = datetime.datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(page)

        return ClientPageRead.model_validate(page)

    async def delete_page(self, page_id: uuid.UUID) -> None:
        """
        Delete a page.

        Args:
            page_id: Page ID

        Raises:
            NotFoundException: If page not found
        """
        page = await self.db.get(ClientPage, page_id)
        if not page:
            raise NotFoundException(f"Page {page_id} not found")

        await self.db.delete(page)
        await self.db.commit()

    async def list_pages(
        self,
        params: ClientPageSearchParams
    ) -> ClientPageList:
        """
        List pages with filtering, search, and pagination.

        Args:
            params: Search parameters

        Returns:
            Paginated list of pages
        """
        # Build base query
        query = select(ClientPage)

        # Apply filters
        if params.client_id:
            query = query.where(ClientPage.client_id == params.client_id)

        if params.is_failed is not None:
            query = query.where(ClientPage.is_failed == params.is_failed)

        if params.status_code:
            query = query.where(ClientPage.status_code == params.status_code)

        if params.search:
            search_term = f"%{params.search}%"
            query = query.where(
                or_(
                    ClientPage.url.ilike(search_term),
                    ClientPage.slug.ilike(search_term)
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        # Apply sorting
        sort_column = getattr(ClientPage, params.sort_by, ClientPage.created_at)
        if params.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Apply pagination
        offset = (params.page - 1) * params.page_size
        query = query.offset(offset).limit(params.page_size)

        # Execute query
        result = await self.db.execute(query)
        pages = result.scalars().all()

        # Build response
        page_reads = [ClientPageRead.model_validate(p) for p in pages]
        total_pages = (total + params.page_size - 1) // params.page_size

        return ClientPageList(
            pages=page_reads,
            total=total,
            page=params.page,
            page_size=params.page_size,
            total_pages=total_pages
        )

    async def get_client_page_count(self, client_id: uuid.UUID) -> int:
        """
        Get total page count for a client.

        Args:
            client_id: Client ID

        Returns:
            Total page count
        """
        result = await self.db.execute(
            select(func.count()).where(ClientPage.client_id == client_id)
        )
        return result.scalar_one()

    async def get_client_failed_page_count(self, client_id: uuid.UUID) -> int:
        """
        Get failed page count for a client.

        Args:
            client_id: Client ID

        Returns:
            Failed page count
        """
        result = await self.db.execute(
            select(func.count()).where(
                ClientPage.client_id == client_id,
                ClientPage.is_failed == True  # noqa: E712
            )
        )
        return result.scalar_one()

    async def mark_page_failed(
        self,
        page_id: uuid.UUID,
        failure_reason: str
    ) -> ClientPageRead:
        """
        Mark a page as failed.

        Args:
            page_id: Page ID
            failure_reason: Reason for failure

        Returns:
            Updated page

        Raises:
            NotFoundException: If page not found
        """
        page = await self.db.get(ClientPage, page_id)
        if not page:
            raise NotFoundException(f"Page {page_id} not found")

        page.is_failed = True
        page.failure_reason = failure_reason
        page.retry_count += 1
        page.last_checked_at = datetime.datetime.utcnow()
        page.updated_at = datetime.datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(page)

        return ClientPageRead.model_validate(page)

    async def delete_client_pages(self, client_id: uuid.UUID) -> int:
        """
        Delete all pages for a client.

        Args:
            client_id: Client ID

        Returns:
            Number of pages deleted
        """
        result = await self.db.execute(
            select(ClientPage).where(ClientPage.client_id == client_id)
        )
        pages = result.scalars().all()

        for page in pages:
            await self.db.delete(page)

        await self.db.commit()

        return len(pages)

    async def get_pages_by_ids(self, page_ids: List[uuid.UUID]) -> List[ClientPageRead]:
        """
        Get multiple pages by their IDs.

        Args:
            page_ids: List of page IDs

        Returns:
            List of pages

        Raises:
            NotFoundException: If any page ID is not found
        """
        result = await self.db.execute(
            select(ClientPage).where(ClientPage.id.in_(page_ids))
        )
        pages = result.scalars().all()

        if len(pages) != len(page_ids):
            raise NotFoundException("One or more page IDs not found")

        return [ClientPageRead.model_validate(page) for page in pages]

    async def get_enhanced_crawl_results(
        self,
        client_id: uuid.UUID,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> EnhancedCrawlResultsList:
        """
        Get enhanced crawl results with historical tracking for all datapoints.
        Each datapoint includes current value + history from previous crawls.

        Args:
            client_id: Client UUID
            search: Search term for URL filtering
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            EnhancedCrawlResultsList with pages containing historical data per datapoint
        """
        from sqlalchemy.orm import selectinload

        # Build base query
        query = select(ClientPage).where(ClientPage.client_id == client_id)

        # Apply search filter
        if search:
            query = query.where(ClientPage.url.ilike(f"%{search}%"))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination and sorting
        query = query.order_by(desc(ClientPage.created_at))
        query = query.offset((page - 1) * page_size).limit(page_size)

        # Execute query with versions eager loaded
        query = query.options(selectinload(ClientPage.versions))
        result = await self.db.execute(query)
        client_pages = result.scalars().all()

        # Build enhanced page data
        enhanced_pages = []
        for client_page in client_pages:
            enhanced_page = await self._build_enhanced_page_data(client_page)
            enhanced_pages.append(enhanced_page)

        # Calculate total pages
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0

        return EnhancedCrawlResultsList(
            pages=enhanced_pages,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    async def _build_enhanced_page_data(self, client_page: ClientPage) -> EnhancedCrawlPageData:
        """
        Build enhanced page data with historical tracking for all datapoints.

        Args:
            client_page: ClientPage model instance with versions loaded

        Returns:
            EnhancedCrawlPageData with all datapoints enhanced with history
        """
        # Sort versions by version number descending (newest first)
        versions = sorted(client_page.versions, key=lambda v: v.version, reverse=True)

        # Helper to build enhanced datapoint
        def build_datapoint(field_name: str) -> EnhancedDatapoint:
            # Get current value from latest version or client_page
            current_value = None
            history_items = []

            if versions:
                # Use latest version as current
                latest_version = versions[0]
                current_value = getattr(latest_version, field_name, None)

                # Build history from all versions (skip first as it's current)
                for version in versions:
                    value = getattr(version, field_name, None)
                    history_items.append(DatapointHistory(
                        value=value,
                        crawled_at=version.created_at,
                        crawl_run_id=version.crawl_run_id,
                        version=version.version
                    ))
            else:
                # No versions yet, use client_page value
                current_value = getattr(client_page, field_name, None)

            # Determine if value changed from previous crawl
            has_changed = False
            if len(history_items) >= 2:
                has_changed = history_items[0].value != history_items[1].value

            return EnhancedDatapoint(
                current=current_value,
                history=history_items,
                has_changed=has_changed
            )

        # Build enhanced page data with all datapoints
        return EnhancedCrawlPageData(
            id=client_page.id,
            url=client_page.url,
            slug=client_page.slug,
            status_code=build_datapoint('status_code'),
            page_title=build_datapoint('page_title'),
            meta_title=build_datapoint('meta_title'),
            meta_description=build_datapoint('meta_description'),
            h1=build_datapoint('h1'),
            canonical_url=build_datapoint('canonical_url'),
            meta_robots=build_datapoint('meta_robots'),
            word_count=build_datapoint('word_count'),
            image_count=build_datapoint('image_count'),
            internal_link_count=build_datapoint('internal_link_count'),
            external_link_count=build_datapoint('external_link_count'),
            tags=client_page.tags,
            last_crawled_at=client_page.last_crawled_at,
            crawl_count=client_page.crawl_count,
            created_at=client_page.created_at
        )
