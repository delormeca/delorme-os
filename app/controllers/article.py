from typing import List

from fastapi import APIRouter, Depends

from app.schemas.article import ArticleCreate, ArticleRead, ArticleUpdate
from app.services.article_service import ArticleService, get_article_service

article_router = APIRouter()


@article_router.post("", response_model=ArticleRead)
async def create_article(
    article_data: ArticleCreate,
    service: ArticleService = Depends(get_article_service),
):
    return await service.create_article(article_data=article_data)


@article_router.get("/{article_id}", response_model=ArticleRead)
async def read_article(
    article_id: int, service: ArticleService = Depends(get_article_service)
):
    return await service.get_article(article_id=article_id)


@article_router.get("", response_model=List[ArticleRead])
async def list_articles(
    published_only: bool = False, service: ArticleService = Depends(get_article_service)
):
    return await service.get_all_articles(published_only=published_only)


@article_router.put("/{article_id}", response_model=ArticleRead)
async def update_article(
    article_id: int,
    article_data: ArticleUpdate,
    service: ArticleService = Depends(get_article_service),
):
    return await service.update_article(
        article_id=article_id, article_data=article_data
    )


@article_router.delete("/{article_id}")
async def delete_article(
    article_id: int, service: ArticleService = Depends(get_article_service)
):
    await service.delete_article(article_id=article_id)
    return {"message": "Article deleted successfully"}
