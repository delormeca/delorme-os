"""
Analytics Service

Provides analytics and reporting features with plan-based access control.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from fastapi import Depends, HTTPException, status
from sqlmodel import Session, select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_async_db_session
from app.models import User, Article, Purchase, Subscription
from app.permissions import FeaturePermission
from app.core.access_control import PlanChecker, get_user_current_plan
from app.schemas.auth import CurrentUserResponse
from app.services.users_service import get_current_user_optional

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for analytics and reporting features"""
    
    def __init__(self, db: AsyncSession, current_user: Optional[CurrentUserResponse]):
        self.db = db
        self.current_user = current_user
    
    async def get_basic_analytics(self) -> Dict[str, Any]:
        """
        Get basic analytics available to Starter+ users.
        
        Includes:
        - Total articles created by user
        - Published vs draft articles
        - Recent activity
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check permissions
        current_plan = await get_user_current_plan(user, self.db)
        plan_checker = PlanChecker(user, self.db, current_plan)
        plan_checker.require_permission(FeaturePermission.BASIC_ANALYTICS)
        
        # Get user's articles
        articles_query = select(Article).where(Article.user_id == user.id)
        result = await self.db.execute(articles_query)
        articles = result.scalars().all()
        
        # Calculate basic metrics
        total_articles = len(articles)
        published_articles = len([a for a in articles if a.is_published])
        draft_articles = total_articles - published_articles
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_articles = [
            a for a in articles 
            if a.published_at and a.published_at >= thirty_days_ago
        ]
        
        return {
            "user_id": str(user.id),
            "analytics_type": "basic",
            "metrics": {
                "total_articles": total_articles,
                "published_articles": published_articles,
                "draft_articles": draft_articles,
                "recent_published": len(recent_articles),
            },
            "recent_activity": [
                {
                    "title": article.title,
                    "published_at": article.published_at.isoformat() if article.published_at else None,
                    "is_published": article.is_published,
                }
                for article in sorted(articles, key=lambda x: x.published_at or datetime.min, reverse=True)[:5]
            ],
        }
    
    async def get_advanced_analytics(self) -> Dict[str, Any]:
        """
        Get advanced analytics available to Pro+ users.
        
        Includes:
        - Detailed article performance
        - User engagement metrics
        - Growth trends
        - Comparative analysis
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check permissions
        current_plan = await get_user_current_plan(user, self.db)
        plan_checker = PlanChecker(user, self.db, current_plan)
        plan_checker.require_permission(FeaturePermission.ADVANCED_ANALYTICS)
        
        # Get comprehensive analytics data
        basic_data = await self.get_basic_analytics()
        
        # Advanced metrics
        articles_query = select(Article).where(Article.user_id == user.id)
        result = await self.db.execute(articles_query)
        articles = result.scalars().all()
        
        # Monthly breakdown
        monthly_stats = {}
        for article in articles:
            if article.published_at:
                month_key = article.published_at.strftime("%Y-%m")
                if month_key not in monthly_stats:
                    monthly_stats[month_key] = 0
                monthly_stats[month_key] += 1
        
        # Content analysis
        avg_content_length = sum(len(a.content) for a in articles) / len(articles) if articles else 0
        
        return {
            **basic_data,
            "analytics_type": "advanced",
            "advanced_metrics": {
                "monthly_breakdown": monthly_stats,
                "avg_content_length": round(avg_content_length, 2),
                "publishing_frequency": self._calculate_publishing_frequency(articles),
                "content_categories": self._analyze_content_categories(articles),
            },
            "growth_trends": self._calculate_growth_trends(articles),
        }
    
    async def get_premium_reporting(self) -> Dict[str, Any]:
        """
        Get premium reporting features available to Premium+ subscribers.
        
        Includes:
        - Custom report generation
        - Data export capabilities
        - Advanced filtering
        - Comparative benchmarking
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check permissions
        current_plan = await get_user_current_plan(user, self.db)
        plan_checker = PlanChecker(user, self.db, current_plan)
        plan_checker.require_permission(FeaturePermission.ADVANCED_REPORTING)
        
        # Get advanced analytics as base
        advanced_data = await self.get_advanced_analytics()
        
        # Premium features
        return {
            **advanced_data,
            "analytics_type": "premium",
            "premium_features": {
                "custom_reports": await self._generate_custom_reports(user),
                "benchmarking": await self._get_benchmarking_data(user),
                "export_options": [
                    {"format": "csv", "description": "Comma-separated values"},
                    {"format": "xlsx", "description": "Excel spreadsheet"},
                    {"format": "pdf", "description": "PDF report"},
                    {"format": "json", "description": "JSON data"},
                ],
            },
        }
    
    async def get_team_analytics(self) -> Dict[str, Any]:
        """
        Get team analytics available to Enterprise subscribers.
        
        Includes:
        - Team performance metrics
        - Collaboration insights
        - Resource utilization
        - Team productivity reports
        """
        if not self.current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user = await self.db.get(User, self.current_user.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check permissions
        current_plan = await get_user_current_plan(user, self.db)
        plan_checker = PlanChecker(user, self.db, current_plan)
        plan_checker.require_permission(FeaturePermission.TEAM_MANAGEMENT)
        
        # For demo purposes, show team-level analytics
        # In a real implementation, this would include team member data
        return {
            "user_id": str(user.id),
            "analytics_type": "team",
            "team_metrics": {
                "team_size": 1,  # Demo: single user team
                "total_team_articles": await self._get_team_article_count(),
                "team_productivity": await self._calculate_team_productivity(),
                "collaboration_score": 85.5,  # Demo metric
            },
            "team_insights": {
                "top_contributors": [
                    {
                        "user": user.full_name,
                        "articles": len(user.articles),
                        "contribution_score": 100,
                    }
                ],
                "content_distribution": {
                    "published": len([a for a in user.articles if a.is_published]),
                    "drafts": len([a for a in user.articles if not a.is_published]),
                },
            },
        }
    
    # Helper methods
    
    def _calculate_publishing_frequency(self, articles: List[Article]) -> str:
        """Calculate how often user publishes articles"""
        published = [a for a in articles if a.is_published and a.published_at]
        
        if len(published) < 2:
            return "insufficient_data"
        
        # Calculate average days between publications
        published_sorted = sorted(published, key=lambda x: x.published_at)
        total_days = (published_sorted[-1].published_at - published_sorted[0].published_at).days
        avg_days = total_days / (len(published) - 1) if len(published) > 1 else 0
        
        if avg_days <= 7:
            return "weekly"
        elif avg_days <= 30:
            return "monthly"
        elif avg_days <= 90:
            return "quarterly"
        else:
            return "sporadic"
    
    def _analyze_content_categories(self, articles: List[Article]) -> Dict[str, int]:
        """Analyze content categories based on keywords"""
        categories = {
            "technical": 0,
            "business": 0,
            "personal": 0,
            "tutorial": 0,
            "news": 0,
            "other": 0,
        }
        
        # Simple keyword-based categorization
        for article in articles:
            content_lower = (article.title + " " + article.content).lower()
            
            if any(word in content_lower for word in ["code", "programming", "technical", "api", "database"]):
                categories["technical"] += 1
            elif any(word in content_lower for word in ["business", "startup", "marketing", "sales"]):
                categories["business"] += 1
            elif any(word in content_lower for word in ["tutorial", "how to", "guide", "step by step"]):
                categories["tutorial"] += 1
            elif any(word in content_lower for word in ["news", "announcement", "update", "release"]):
                categories["news"] += 1
            elif any(word in content_lower for word in ["personal", "opinion", "thoughts", "experience"]):
                categories["personal"] += 1
            else:
                categories["other"] += 1
        
        return categories
    
    def _calculate_growth_trends(self, articles: List[Article]) -> Dict[str, Any]:
        """Calculate growth trends over time"""
        if not articles:
            return {"trend": "no_data", "growth_rate": 0}
        
        published = [a for a in articles if a.is_published and a.published_at]
        
        if len(published) < 2:
            return {"trend": "insufficient_data", "growth_rate": 0}
        
        # Simple growth calculation: compare first and second half
        published_sorted = sorted(published, key=lambda x: x.published_at)
        midpoint = len(published_sorted) // 2
        
        first_half = published_sorted[:midpoint]
        second_half = published_sorted[midpoint:]
        
        first_half_days = (first_half[-1].published_at - first_half[0].published_at).days or 1
        second_half_days = (second_half[-1].published_at - second_half[0].published_at).days or 1
        
        first_rate = len(first_half) / first_half_days
        second_rate = len(second_half) / second_half_days
        
        growth_rate = ((second_rate - first_rate) / first_rate * 100) if first_rate > 0 else 0
        
        return {
            "trend": "increasing" if growth_rate > 10 else "decreasing" if growth_rate < -10 else "stable",
            "growth_rate": round(growth_rate, 2),
        }
    
    async def _generate_custom_reports(self, user: User) -> List[Dict[str, Any]]:
        """Generate custom report templates for premium users"""
        return [
            {
                "id": "content_performance",
                "name": "Content Performance Report",
                "description": "Detailed analysis of your content performance metrics",
                "available": True,
            },
            {
                "id": "engagement_analysis",
                "name": "Engagement Analysis",
                "description": "Deep dive into user engagement with your content",
                "available": True,
            },
            {
                "id": "growth_projection",
                "name": "Growth Projection",
                "description": "Predictive analysis of your content growth trajectory",
                "available": True,
            },
        ]
    
    async def _get_benchmarking_data(self, user: User) -> Dict[str, Any]:
        """Get benchmarking data comparing user to platform averages"""
        # In a real implementation, this would compare against platform averages
        user_articles = len(user.articles)
        platform_avg = 15  # Demo value
        
        return {
            "user_articles": user_articles,
            "platform_average": platform_avg,
            "percentile": min(95, max(5, (user_articles / platform_avg) * 50)),
            "performance": "above_average" if user_articles > platform_avg else "below_average",
        }
    
    async def _get_team_article_count(self) -> int:
        """Get total articles across team (demo implementation)"""
        # In a real implementation, this would aggregate across team members
        if not self.current_user:
            return 0
        
        user = await self.db.get(User, self.current_user.user_id)
        return len(user.articles) if user else 0
    
    async def _calculate_team_productivity(self) -> Dict[str, float]:
        """Calculate team productivity metrics"""
        # Demo implementation
        return {
            "articles_per_week": 2.5,
            "avg_content_length": 1250.0,
            "publishing_consistency": 78.5,
        }


def get_analytics_service(
    db_session: AsyncSession = Depends(get_async_db_session),
    current_user: Optional[CurrentUserResponse] = Depends(get_current_user_optional),
) -> AnalyticsService:
    """Get an instance of the AnalyticsService class."""
    return AnalyticsService(db_session, current_user)
