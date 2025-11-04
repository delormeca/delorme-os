import logging
from datetime import datetime
from typing import List, Optional

from fastapi import Depends, HTTPException, Request, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.models import Article, User
from app.schemas.article import ArticleCreate, ArticleRead, ArticleUpdate
from app.schemas.auth import CurrentUserResponse
from app.services.oauth_service import OAuthService
from app.services.users_service import get_current_user_optional
from app.permissions import FeaturePermission
from app.core.access_control import PlanChecker, get_user_current_plan

logger = logging.getLogger(__name__)


class ArticleService:
    def __init__(
        self,
        db: AsyncSession,
        current_user: Optional[CurrentUserResponse],
        request: Request,
    ):
        self.db = db
        self.current_user = current_user
        self.request = request
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.oauth_service = OAuthService(db, request)

    async def create_article(self, article_data: ArticleCreate) -> ArticleRead:
        """
        Create a new article with the given data. The current user is set as the author.
        
        Requires BASIC_ARTICLES permission (Starter plan or higher).
        """
        if await self._article_exists(article_data.title):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Article with this title already exists",
            )

        # Ensure current user is provided for author assignment
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current user not authenticated",
            )
        
        # Get full user object for plan checking
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Check if user has permission to create articles
        current_plan = await get_user_current_plan(user, self.db)
        plan_checker = PlanChecker(user, self.db, current_plan)
        plan_checker.require_permission(FeaturePermission.BASIC_ARTICLES)

        article = Article(
            title=article_data.title,
            content=article_data.content,
            author=self.current_user.email,  # Set current user as author
            published_at=datetime.utcnow() if article_data.is_published else None,
            is_published=article_data.is_published,
            user_id=self.current_user.user_id,
        )

        self.db.add(article)
        await self.db.commit()
        await self.db.refresh(article)

        logger.info(
            "Article created with title: %s by %s",
            article_data.title,
            self.current_user.email,
        )
        return ArticleRead.from_orm(article)

    async def get_article(self, article_id: int) -> ArticleRead:
        """
        Get an article by its ID.
        """
        article = await self.db.get(Article, article_id)
        if not article:
            logger.error("Article not found with ID: %s", article_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article not found",
            )
        return ArticleRead.from_orm(article)

    async def get_all_articles(self, published_only: bool = False) -> List[ArticleRead]:
        """
        Get all articles, optionally filtering by published status.
        
        Free users can only see published articles.
        Starter+ users can see their own articles (published and unpublished).
        Pro+ users can see all articles with advanced filtering.
        """
        # For unauthenticated users, only show published articles
        if not self.current_user:
            query = select(Article).where(Article.is_published == True)
            result = await self.db.execute(query)
            articles = result.scalars().all()
            return [ArticleRead.from_orm(article) for article in articles]
        
        # Get full user object for plan checking
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        current_plan = await get_user_current_plan(user, self.db)
        plan_checker = PlanChecker(user, self.db, current_plan)
        
        # Free users: only published articles
        if not plan_checker.has_permission(FeaturePermission.BASIC_ARTICLES):
            query = select(Article).where(Article.is_published == True)
        # Starter users: their own articles + published articles from others
        elif not plan_checker.has_permission(FeaturePermission.ADVANCED_DASHBOARD):
            if published_only:
                query = select(Article).where(Article.is_published == True)
            else:
                query = select(Article).where(
                    (Article.user_id == user.id) | (Article.is_published == True)
                )
        # Pro+ users: all articles with full control
        else:
            query = (
                select(Article).where(Article.is_published == True)
                if published_only
                else select(Article)
            )
        
        result = await self.db.execute(query)
        articles = result.scalars().all()

        logger.info(
            "Fetched %d articles with published_only=%s for user plan %s", 
            len(articles), published_only, plan_checker.current_plan.value
        )
        return [ArticleRead.from_orm(article) for article in articles]

    async def update_article(
        self, article_id: int, article_data: ArticleUpdate
    ) -> ArticleRead:
        """
        Update an article with the given ID and data.
        
        Requires ARTICLE_MANAGEMENT permission and ownership of the article.
        """
        # Ensure current user is authenticated
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current user not authenticated",
            )
        
        # Fetch the actual Article model instance
        article = await self.db.get(Article, article_id)
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article not found",
            )
        
        # Get full user object for plan and ownership checking
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Check ownership (users can only edit their own articles)
        if article.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your own articles",
            )
        
        # Check if user has permission to manage articles
        current_plan = await get_user_current_plan(user, self.db)
        plan_checker = PlanChecker(user, self.db, current_plan)
        plan_checker.require_permission(FeaturePermission.ARTICLE_MANAGEMENT)

        if article_data.title is not None:
            article.title = article_data.title
        if article_data.content is not None:
            article.content = article_data.content
        if article_data.is_published is not None:
            article.is_published = article_data.is_published
            article.published_at = (
                datetime.utcnow() if article_data.is_published else None
            )

        self.db.add(article)
        await self.db.commit()
        await self.db.refresh(article)

        logger.info("Article updated with ID: %s", article_id)
        return ArticleRead.from_orm(article)

    async def delete_article(self, article_id: int) -> None:
        """
        Delete an article by its ID.
        
        Requires ARTICLE_MANAGEMENT permission and ownership of the article.
        """
        # Ensure current user is authenticated
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current user not authenticated",
            )
        
        # Fetch the actual Article model instance
        article = await self.db.get(Article, article_id)
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article not found",
            )
        
        # Get full user object for plan and ownership checking
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Check ownership (users can only delete their own articles)
        if article.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own articles",
            )
        
        # Check if user has permission to manage articles
        current_plan = await get_user_current_plan(user, self.db)
        plan_checker = PlanChecker(user, self.db, current_plan)
        plan_checker.require_permission(FeaturePermission.ARTICLE_MANAGEMENT)

        await self.db.delete(article)  # Delete the Article instance
        await self.db.commit()

        logger.info("Article deleted with ID: %s", article_id)

    async def _article_exists(self, title: str) -> bool:
        """
        Check if an article with the given title already exists.
        """
        query = select(Article).where(Article.title == title)
        result = await self.db.execute(query)
        return result.scalars().first() is not None


def get_article_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
    request: Request = None,
) -> ArticleService:
    """
    Get an instance of the ArticleService class.
    """
    return ArticleService(db_session, current_user, request)
