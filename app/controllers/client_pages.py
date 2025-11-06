"""
Client Pages API endpoints.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
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
from app.services.users_service import get_current_user
from app.core.exceptions import NotFoundException, ValidationException

router = APIRouter()


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


@router.get("/client-pages/client/{client_id}/count", response_model=dict)
async def get_client_page_count(
    client_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """Get total and failed page counts for a client."""
    try:
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
