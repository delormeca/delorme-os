"""
Seed script for Phase 1: Essential SEO & Social data points.
Adds 22 high-priority data points for Open Graph, Twitter Cards, SSL, and technical tracking.
"""
import asyncio
import logging
from datetime import datetime

from sqlalchemy import insert
from sqlalchemy.exc import IntegrityError

from app.db import AsyncSessionLocal
from app.models import DataPointDefinition, DataPointCategory, DataPointDataType
from app.utils.helpers import get_utcnow

logger = logging.getLogger(__name__)


# Phase 1: Essential SEO & Social (22 data points)
PHASE_1_DATA_POINTS = [
    # Open Graph Tags (6 points)
    {
        "id": "dp_og_title",
        "name": "Open Graph Title",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Title for social media sharing (Open Graph protocol)",
        "crawl4ai_field": "head_data.og:title",
        "display_order": 10,
        "icon": "ShareIcon",
        "color": "#3b5998"
    },
    {
        "id": "dp_og_description",
        "name": "Open Graph Description",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Description for social media sharing (Open Graph)",
        "crawl4ai_field": "head_data.og:description",
        "display_order": 11,
        "icon": "DescriptionIcon",
        "color": "#3b5998"
    },
    {
        "id": "dp_og_image",
        "name": "Open Graph Image",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Image URL for social media sharing (Open Graph)",
        "crawl4ai_field": "head_data.og:image",
        "display_order": 12,
        "icon": "ImageIcon",
        "color": "#3b5998"
    },
    {
        "id": "dp_og_type",
        "name": "Open Graph Type",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Content type for Open Graph (article, website, etc.)",
        "crawl4ai_field": "head_data.og:type",
        "display_order": 13,
        "icon": "CategoryIcon",
        "color": "#3b5998"
    },
    {
        "id": "dp_og_url",
        "name": "Open Graph URL",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Canonical URL for Open Graph",
        "crawl4ai_field": "head_data.og:url",
        "display_order": 14,
        "icon": "LinkIcon",
        "color": "#3b5998"
    },
    {
        "id": "dp_og_site_name",
        "name": "Open Graph Site Name",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Website name for Open Graph",
        "crawl4ai_field": "head_data.og:site_name",
        "display_order": 15,
        "icon": "BusinessIcon",
        "color": "#3b5998"
    },

    # Twitter Card Tags (6 points)
    {
        "id": "dp_twitter_card",
        "name": "Twitter Card Type",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Twitter Card type (summary, summary_large_image, etc.)",
        "crawl4ai_field": "head_data.twitter:card",
        "display_order": 20,
        "icon": "TwitterIcon",
        "color": "#1da1f2"
    },
    {
        "id": "dp_twitter_title",
        "name": "Twitter Card Title",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Title for Twitter Card sharing",
        "crawl4ai_field": "head_data.twitter:title",
        "display_order": 21,
        "icon": "TitleIcon",
        "color": "#1da1f2"
    },
    {
        "id": "dp_twitter_description",
        "name": "Twitter Card Description",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Description for Twitter Card sharing",
        "crawl4ai_field": "head_data.twitter:description",
        "display_order": 22,
        "icon": "DescriptionIcon",
        "color": "#1da1f2"
    },
    {
        "id": "dp_twitter_image",
        "name": "Twitter Card Image",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Image URL for Twitter Card sharing",
        "crawl4ai_field": "head_data.twitter:image",
        "display_order": 23,
        "icon": "ImageIcon",
        "color": "#1da1f2"
    },
    {
        "id": "dp_twitter_site",
        "name": "Twitter Site Handle",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Twitter username for the website (@handle)",
        "crawl4ai_field": "head_data.twitter:site",
        "display_order": 24,
        "icon": "AlternateEmailIcon",
        "color": "#1da1f2"
    },
    {
        "id": "dp_twitter_creator",
        "name": "Twitter Creator Handle",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Twitter username for the content creator (@handle)",
        "crawl4ai_field": "head_data.twitter:creator",
        "display_order": 25,
        "icon": "PersonIcon",
        "color": "#1da1f2"
    },

    # Language & Encoding (2 points)
    {
        "id": "dp_lang",
        "name": "Page Language",
        "category": DataPointCategory.CONTENT,
        "data_type": DataPointDataType.STRING,
        "description": "Language code from HTML lang attribute (e.g., en-US, fr-FR)",
        "crawl4ai_field": "head_data.lang",
        "display_order": 7,
        "icon": "LanguageIcon",
        "color": "#388e3c"
    },
    {
        "id": "dp_charset",
        "name": "Character Encoding",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.STRING,
        "description": "Character encoding specified in page header",
        "crawl4ai_field": "head_data.charset",
        "display_order": 10,
        "icon": "CodeIcon",
        "color": "#d32f2f"
    },

    # Mobile Responsiveness (2 points)
    {
        "id": "dp_meta_viewport",
        "name": "Meta Viewport",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.STRING,
        "description": "Viewport configuration for mobile responsiveness",
        "crawl4ai_field": "head_data.meta.viewport",
        "display_order": 11,
        "icon": "PhonelinkIcon",
        "color": "#d32f2f"
    },
    {
        "id": "dp_is_mobile_responsive",
        "name": "Is Mobile Responsive",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.STRING,
        "description": "Whether page has mobile viewport configuration (calculated boolean stored as string)",
        "crawl4ai_field": "calculated from head_data.meta.viewport",
        "display_order": 12,
        "icon": "PhoneAndroidIcon",
        "color": "#d32f2f"
    },

    # SSL Certificate (3 points)
    {
        "id": "dp_ssl_valid_until",
        "name": "SSL Valid Until Date",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.DATETIME,
        "description": "SSL certificate expiration date",
        "crawl4ai_field": "result.ssl_certificate.valid_until",
        "display_order": 13,
        "icon": "SecurityIcon",
        "color": "#d32f2f"
    },
    {
        "id": "dp_ssl_days_until_expiry",
        "name": "SSL Days Until Expiry",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.INTEGER,
        "description": "Number of days until SSL certificate expires (calculated)",
        "crawl4ai_field": "calculated from result.ssl_certificate.valid_until",
        "display_order": 14,
        "icon": "EventIcon",
        "color": "#d32f2f"
    },
    {
        "id": "dp_has_ssl_certificate",
        "name": "Has Valid SSL Certificate",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.STRING,
        "description": "Whether site has an SSL certificate (calculated boolean stored as string)",
        "crawl4ai_field": "result.ssl_certificate is not None",
        "display_order": 15,
        "icon": "VerifiedUserIcon",
        "color": "#d32f2f"
    },

    # Crawl Status & Errors (3 points)
    {
        "id": "dp_success",
        "name": "Crawl Success Status",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.STRING,
        "description": "Whether the crawl completed successfully (boolean stored as string)",
        "crawl4ai_field": "result.success",
        "display_order": 5,
        "icon": "CheckCircleIcon",
        "color": "#d32f2f"
    },
    {
        "id": "dp_error_message",
        "name": "Error Message",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.STRING,
        "description": "Error description if crawl failed",
        "crawl4ai_field": "result.error_message",
        "display_order": 6,
        "icon": "ErrorIcon",
        "color": "#d32f2f"
    },
    {
        "id": "dp_redirected_url",
        "name": "Redirected URL",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.STRING,
        "description": "Final URL after redirects (first redirect only in current Crawl4AI version)",
        "crawl4ai_field": "result.redirected_url",
        "display_order": 7,
        "icon": "RedirectIcon",
        "color": "#d32f2f"
    },
]


async def seed_phase1_data_points():
    """Seed Phase 1: Essential SEO & Social data points."""
    async with AsyncSessionLocal() as db_session:
        now = get_utcnow()
        inserted_count = 0
        skipped_count = 0

        logger.info(f"[PHASE 1] Seeding {len(PHASE_1_DATA_POINTS)} essential SEO & social data points")
        logger.info("[INFO] Open Graph (6) + Twitter Cards (6) + Language (2) + Mobile (2) + SSL (3) + Status (3)\n")

        for dp_data in PHASE_1_DATA_POINTS:
            # Add timestamps
            dp_data["created_at"] = now
            dp_data["updated_at"] = now
            dp_data["is_active"] = True

            stmt = insert(DataPointDefinition).values(**dp_data)

            try:
                await db_session.execute(stmt)
                inserted_count += 1
                logger.info(f"  [+] {dp_data['name']} ({dp_data['id']})")
            except IntegrityError:
                await db_session.rollback()
                skipped_count += 1
                logger.warning(f"  [~] Skipped: {dp_data['name']} ({dp_data['id']}) - already exists")
            except Exception as e:
                await db_session.rollback()
                logger.error(f"  [X] Failed: {dp_data['name']} - {e}")
                continue

        # Commit all successful inserts
        try:
            await db_session.commit()
            logger.info(f"\n[SUCCESS] Phase 1 complete: {inserted_count} inserted, {skipped_count} skipped")
            logger.info(f"[TOTAL] Data points in catalog: {22 + inserted_count} (22 base + {inserted_count} Phase 1)")
        except Exception as e:
            await db_session.rollback()
            logger.error(f"[ERROR] Failed to commit Phase 1 seed data: {e}")


async def print_summary():
    """Print summary of all data points by category."""
    async with AsyncSessionLocal() as db_session:
        from sqlalchemy import select, func
        from app.models import DataPointDefinition

        # Total count
        result = await db_session.execute(select(func.count()).select_from(DataPointDefinition))
        total = result.scalar()

        print(f"\n{'='*60}")
        print(f"DATA POINT CATALOG SUMMARY")
        print(f"{'='*60}")
        print(f"Total data points: {total}")

        # By category
        result = await db_session.execute(
            select(DataPointDefinition.category, func.count())
            .group_by(DataPointDefinition.category)
            .order_by(DataPointDefinition.category)
        )
        print("\nBreakdown by category:")
        for row in result:
            print(f"  {str(row[0]).split('.')[1]:12s}: {row[1]:2d} points")

        # By data type
        result = await db_session.execute(
            select(DataPointDefinition.data_type, func.count())
            .group_by(DataPointDefinition.data_type)
            .order_by(DataPointDefinition.data_type)
        )
        print("\nBreakdown by data type:")
        for row in result:
            print(f"  {str(row[0]).split('.')[1]:10s}: {row[1]:2d} points")

        print(f"{'='*60}\n")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(message)s'
    )

    logger.info("\n" + "="*60)
    logger.info("PHASE 1: Essential SEO & Social Data Points")
    logger.info("="*60)

    asyncio.run(seed_phase1_data_points())
    asyncio.run(print_summary())
