"""
Client Pages API endpoints.
"""
from uuid import UUID
from typing import List
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.schemas.auth import CurrentUserResponse
from app.schemas.client_page import (
    ClientPageCreate,
    ClientPageUpdate,
    ClientPageRead,
    ClientPageList,
    ClientPageSearchParams
)
from app.services.client_page_service import ClientPageService
from app.services.page_extraction_service import PageExtractionService
from app.services.users_service import get_current_user
from app.core.exceptions import NotFoundException, ValidationException
from app.services import client_service

router = APIRouter()


async def resolve_client_identifier(client_identifier: str, db: AsyncSession) -> UUID:
    """Helper to resolve client identifier (UUID or slug) to UUID."""
    try:
        # Try parsing as UUID first
        return UUID(client_identifier)
    except ValueError:
        # If not a UUID, treat as slug and get the client
        client = await client_service.get_client_by_slug(db, client_identifier)
        return client.id


# Request/Response schemas for extraction
class ExtractPageRequest(BaseModel):
    """Request to extract data from a single URL."""
    client_id: UUID
    url: str
    crawl_run_id: UUID | None = None


class ExtractBatchRequest(BaseModel):
    """Request to extract data from multiple URLs."""
    client_id: UUID
    urls: List[str]
    crawl_run_id: UUID | None = None


class ExtractionResponse(BaseModel):
    """Response from extraction request."""
    message: str
    page_id: UUID | None = None
    extracted_count: int | None = None


@router.post("/client-pages", response_model=ClientPageRead)
async def create_page(
    page_data: ClientPageCreate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Create a new client page."""
    try:
        page_service = ClientPageService(db)
        return await page_service.create_page(page_data)

    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create page: {str(e)}"
        )


@router.get("/client-pages", response_model=ClientPageList)
async def list_pages(
    client_id: UUID = Query(..., description="Filter by client ID"),
    is_failed: bool = Query(None, description="Filter by failed status"),
    status_code: int = Query(None, description="Filter by HTTP status code"),
    search: str = Query(None, description="Search in URL or slug"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    List client pages with filtering, search, and pagination.

    Supports:
    - Filtering by client, failed status, and HTTP status code
    - Text search in URL and slug
    - Pagination
    - Sorting
    """
    try:
        page_service = ClientPageService(db)

        # Build search params
        params = ClientPageSearchParams(
            client_id=client_id,
            is_failed=is_failed,
            status_code=status_code,
            search=search,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order
        )

        return await page_service.list_pages(params)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list pages: {str(e)}"
        )


@router.get("/client-pages/{page_id}", response_model=ClientPageRead)
async def get_page(
    page_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get a specific client page by ID."""
    try:
        page_service = ClientPageService(db)
        return await page_service.get_page(page_id)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get page: {str(e)}"
        )


@router.put("/client-pages/{page_id}", response_model=ClientPageRead)
async def update_page(
    page_id: UUID,
    update_data: ClientPageUpdate,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Update a client page."""
    try:
        page_service = ClientPageService(db)
        return await page_service.update_page(page_id, update_data)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update page: {str(e)}"
        )


@router.delete("/client-pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(
    page_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Delete a client page."""
    try:
        page_service = ClientPageService(db)
        await page_service.delete_page(page_id)

    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete page: {str(e)}"
        )


@router.get("/client-pages/client/{client_identifier}/count", response_model=dict)
async def get_client_page_count(
    client_identifier: str,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get total and failed page counts for a client (accepts UUID or slug)."""
    try:
        # Resolve client identifier to UUID
        client_id = await resolve_client_identifier(client_identifier, db)

        page_service = ClientPageService(db)

        total_count = await page_service.get_client_page_count(client_id)
        failed_count = await page_service.get_client_failed_page_count(client_id)

        return {
            "client_id": str(client_id),
            "total_pages": total_count,
            "failed_pages": failed_count,
            "successful_pages": total_count - failed_count
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get page counts: {str(e)}"
        )


@router.delete("/client-pages/client/{client_id}/all", response_model=dict)
async def delete_all_client_pages(
    client_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Delete all pages for a client (useful for resetting engine setup)."""
    try:
        page_service = ClientPageService(db)
        deleted_count = await page_service.delete_client_pages(client_id)

        return {
            "client_id": str(client_id),
            "deleted_count": deleted_count,
            "message": f"Deleted {deleted_count} pages"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete pages: {str(e)}"
        )


@router.get("/client-pages/export")
async def export_pages(
    client_id: UUID = Query(..., description="Client ID to export pages from"),
    format: str = Query("json", description="Export format (json or csv)"),
    page_ids: str = Query(None, description="Comma-separated page IDs to export (exports all if not specified)"),
    columns: str = Query(None, description="Comma-separated columns to include"),
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Export client pages in JSON or CSV format.

    Supports:
    - Export all pages or specific pages by ID
    - Column selection
    - JSON or CSV format
    """
    from fastapi.responses import StreamingResponse
    import io
    import json
    import csv

    try:
        page_service = ClientPageService(db)

        # Parse page IDs if provided
        selected_page_ids = None
        if page_ids:
            try:
                selected_page_ids = [UUID(pid.strip()) for pid in page_ids.split(',')]
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid page IDs format"
                )

        # Get pages
        if selected_page_ids:
            # Export specific pages
            pages_data = await page_service.get_pages_by_ids(selected_page_ids)
        else:
            # Export all pages for client
            params = ClientPageSearchParams(
                client_id=client_id,
                page=1,
                page_size=10000  # Large enough to get all pages
            )
            result = await page_service.list_pages(params)
            pages_data = result.pages

        # Convert to dict
        pages_list = [page.model_dump() for page in pages_data]

        # Filter columns if specified
        if columns:
            column_list = [c.strip() for c in columns.split(',')]
            pages_list = [
                {k: v for k, v in page.items() if k in column_list}
                for page in pages_list
            ]

        # Export based on format
        if format.lower() == 'csv':
            # Create CSV
            if not pages_list:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No pages found to export"
                )

            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=pages_list[0].keys())
            writer.writeheader()
            writer.writerows(pages_list)

            return StreamingResponse(
                io.BytesIO(output.getvalue().encode('utf-8')),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=pages-export-{client_id}.csv"
                }
            )
        else:
            # Export as JSON
            json_output = json.dumps(pages_list, indent=2, default=str)

            return StreamingResponse(
                io.BytesIO(json_output.encode('utf-8')),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=pages-export-{client_id}.json"
                }
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export pages: {str(e)}"
        )


@router.post("/client-pages/extract", response_model=ExtractionResponse)
async def extract_page_data(
    request: ExtractPageRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Extract data from a single URL using Crawl4AI + HTML Parser.
    Extracts all 24 data points and stores in ClientPage.
    """
    try:
        extraction_service = PageExtractionService(db)

        # Extract and store
        page = await extraction_service.extract_and_store_page(
            client_id=request.client_id,
            url=request.url,
            crawl_run_id=request.crawl_run_id
        )

        return ExtractionResponse(
            message="Page extracted successfully",
            page_id=page.id,
            extracted_count=1
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract page data: {str(e)}"
        )


@router.post("/client-pages/extract-batch", response_model=ExtractionResponse)
async def extract_batch_pages(
    request: ExtractBatchRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Extract data from multiple URLs in the background.
    Returns immediately and processes URLs asynchronously.
    """
    from app.db import AsyncSessionLocal

    async def process_batch():
        """Background task to process batch extraction."""
        async with AsyncSessionLocal() as db_session:
            extraction_service = PageExtractionService(db_session)

            for url in request.urls:
                try:
                    await extraction_service.extract_and_store_page(
                        client_id=request.client_id,
                        url=url,
                        crawl_run_id=request.crawl_run_id
                    )
                except Exception as e:
                    print(f"[ERROR] Failed to extract {url}: {str(e)}")
                    continue

    # Add to background tasks
    background_tasks.add_task(process_batch)

    return ExtractionResponse(
        message=f"Batch extraction started for {len(request.urls)} URLs",
        page_id=None,
        extracted_count=len(request.urls)
    )
