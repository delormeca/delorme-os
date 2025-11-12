"""
Tag Management API endpoints for ClientPage tags.
"""
from uuid import UUID
from typing import List
from pydantic import BaseModel, Field, field_validator

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.models import ClientPage
from app.schemas.auth import CurrentUserResponse
from app.schemas.client_page import ClientPageRead
from app.services.users_service import get_current_user
from app.core.exceptions import NotFoundException, ValidationException

router = APIRouter()


# Request/Response schemas
class UpdateTagsRequest(BaseModel):
    """Request to update tags for a page."""
    tags: List[str] = Field(
        ...,
        description="Array of tag strings (e.g., ['blog', 'product-page', 'high-priority'])",
        max_length=50
    )

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        """Validate tags array."""
        if not isinstance(v, list):
            raise ValidationException("Tags must be an array of strings")

        # Remove empty strings and duplicates while preserving order
        seen = set()
        cleaned_tags = []
        for tag in v:
            if not isinstance(tag, str):
                raise ValidationException("All tags must be strings")
            tag = tag.strip()
            if tag and tag not in seen:
                seen.add(tag)
                cleaned_tags.append(tag)

        return cleaned_tags


class BulkUpdateTagsRequest(BaseModel):
    """Request to update tags for multiple pages."""
    page_ids: List[UUID] = Field(..., description="List of page IDs to update")
    tags: List[str] = Field(
        ...,
        description="Array of tag strings to apply to all pages",
        max_length=50
    )
    mode: str = Field(
        default="replace",
        description="Update mode: 'replace' (replace all tags) or 'append' (add to existing tags)"
    )

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        """Validate tags array."""
        if not isinstance(v, list):
            raise ValidationException("Tags must be an array of strings")

        # Remove empty strings and duplicates while preserving order
        seen = set()
        cleaned_tags = []
        for tag in v:
            if not isinstance(tag, str):
                raise ValidationException("All tags must be strings")
            tag = tag.strip()
            if tag and tag not in seen:
                seen.add(tag)
                cleaned_tags.append(tag)

        return cleaned_tags

    @field_validator('mode')
    @classmethod
    def validate_mode(cls, v):
        """Validate mode."""
        if v not in ['replace', 'append']:
            raise ValidationException("Mode must be 'replace' or 'append'")
        return v


class AllTagsResponse(BaseModel):
    """Response with all unique tags for a client."""
    client_id: UUID
    tags: List[str] = Field(description="All unique tags across client pages, sorted alphabetically")
    tag_count: int = Field(description="Total number of unique tags")


class BulkUpdateTagsResponse(BaseModel):
    """Response from bulk tag update."""
    updated_count: int = Field(description="Number of pages updated")
    page_ids: List[UUID] = Field(description="IDs of updated pages")


@router.put("/tags/{page_id}", response_model=ClientPageRead)
async def update_page_tags(
    page_id: UUID,
    request: UpdateTagsRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Update tags for a specific page.

    Replaces existing tags with the provided array.
    """
    try:
        # Fetch the page
        result = await db.execute(select(ClientPage).where(ClientPage.id == page_id))
        page = result.scalar_one_or_none()

        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Page with ID {page_id} not found"
            )

        # Update tags
        page.tags = request.tags
        db.add(page)
        await db.commit()
        await db.refresh(page)

        return ClientPageRead.model_validate(page)

    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update tags: {str(e)}"
        )


@router.post("/tags/bulk-update", response_model=BulkUpdateTagsResponse)
async def bulk_update_tags(
    request: BulkUpdateTagsRequest,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Update tags for multiple pages at once.

    Supports two modes:
    - 'replace': Replace all existing tags with the new tags
    - 'append': Add new tags to existing tags (no duplicates)
    """
    try:
        # Fetch all pages
        result = await db.execute(
            select(ClientPage).where(ClientPage.id.in_(request.page_ids))
        )
        pages = result.scalars().all()

        if not pages:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pages found with the provided IDs"
            )

        updated_ids = []
        for page in pages:
            if request.mode == "replace":
                page.tags = request.tags
            elif request.mode == "append":
                # Merge existing tags with new tags, removing duplicates
                existing_tags = page.tags or []
                seen = set(existing_tags)
                merged_tags = list(existing_tags)
                for tag in request.tags:
                    if tag not in seen:
                        seen.add(tag)
                        merged_tags.append(tag)
                page.tags = merged_tags

            db.add(page)
            updated_ids.append(page.id)

        await db.commit()

        return BulkUpdateTagsResponse(
            updated_count=len(updated_ids),
            page_ids=updated_ids
        )

    except ValidationException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk update tags: {str(e)}"
        )


@router.delete("/tags/{page_id}", response_model=ClientPageRead)
async def delete_page_tags(
    page_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Remove all tags from a specific page.

    Sets the tags field to an empty array.
    """
    try:
        # Fetch the page
        result = await db.execute(select(ClientPage).where(ClientPage.id == page_id))
        page = result.scalar_one_or_none()

        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Page with ID {page_id} not found"
            )

        # Clear tags
        page.tags = []
        db.add(page)
        await db.commit()
        await db.refresh(page)

        return ClientPageRead.model_validate(page)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tags: {str(e)}"
        )


@router.get("/tags/client/{client_id}/all-tags", response_model=AllTagsResponse)
async def get_all_client_tags(
    client_id: UUID,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: CurrentUserResponse = Depends(get_current_user),
):
    """
    Get all unique tags used across all pages for a specific client.

    Returns a sorted list of unique tags and the total count.
    Useful for:
    - Tag autocomplete/suggestions
    - Tag filtering dropdowns
    - Tag analytics
    """
    try:
        # Fetch all pages for the client
        result = await db.execute(
            select(ClientPage).where(ClientPage.client_id == client_id)
        )
        pages = result.scalars().all()

        # Collect all unique tags
        all_tags = set()
        for page in pages:
            if page.tags:
                all_tags.update(page.tags)

        # Sort tags alphabetically
        sorted_tags = sorted(all_tags)

        return AllTagsResponse(
            client_id=client_id,
            tags=sorted_tags,
            tag_count=len(sorted_tags)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get client tags: {str(e)}"
        )
