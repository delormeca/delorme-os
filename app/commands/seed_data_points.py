"""
Seed script for DataPointDefinition catalog.
Populates the database with all extractable SEO data points.
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


# Define the 22 SEO data points
DATA_POINTS = [
    # ONPAGE Category (7 points)
    {
        "id": "dp_page_title",
        "name": "Page Title",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "The HTML <title> tag content, displayed in browser tabs and search results",
        "crawl4ai_field": "page_title",
        "display_order": 1,
        "icon": "TitleIcon",
        "color": "#1976d2"
    },
    {
        "id": "dp_meta_title",
        "name": "Meta Title",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Meta title tag used by search engines for page title display",
        "crawl4ai_field": "meta_title",
        "display_order": 2,
        "icon": "LabelIcon",
        "color": "#1976d2"
    },
    {
        "id": "dp_meta_description",
        "name": "Meta Description",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Meta description tag used in search engine result snippets",
        "crawl4ai_field": "meta_description",
        "display_order": 3,
        "icon": "DescriptionIcon",
        "color": "#1976d2"
    },
    {
        "id": "dp_h1",
        "name": "H1 Heading",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Primary H1 heading tag, the main heading of the page",
        "crawl4ai_field": "h1",
        "display_order": 4,
        "icon": "FormatSizeIcon",
        "color": "#1976d2"
    },
    {
        "id": "dp_canonical_url",
        "name": "Canonical URL",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Canonical link tag indicating the preferred version of the page",
        "crawl4ai_field": "canonical_url",
        "display_order": 5,
        "icon": "LinkIcon",
        "color": "#1976d2"
    },
    {
        "id": "dp_hreflang",
        "name": "Hreflang",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Hreflang tags for international and multilingual content",
        "crawl4ai_field": "hreflang",
        "display_order": 6,
        "icon": "LanguageIcon",
        "color": "#1976d2"
    },
    {
        "id": "dp_meta_robots",
        "name": "Meta Robots",
        "category": DataPointCategory.ONPAGE,
        "data_type": DataPointDataType.STRING,
        "description": "Meta robots tag controlling search engine crawling and indexing",
        "crawl4ai_field": "meta_robots",
        "display_order": 7,
        "icon": "SmartToyIcon",
        "color": "#1976d2"
    },

    # CONTENT Category (6 points)
    {
        "id": "dp_body_content",
        "name": "Body Content",
        "category": DataPointCategory.CONTENT,
        "data_type": DataPointDataType.STRING,
        "description": "Main textual content of the page for analysis and indexing",
        "crawl4ai_field": "body_content",
        "display_order": 1,
        "icon": "ArticleIcon",
        "color": "#388e3c"
    },
    {
        "id": "dp_word_count",
        "name": "Word Count",
        "category": DataPointCategory.CONTENT,
        "data_type": DataPointDataType.INTEGER,
        "description": "Total word count of the page content",
        "crawl4ai_field": "word_count",
        "display_order": 2,
        "icon": "FormatListNumberedIcon",
        "color": "#388e3c"
    },
    {
        "id": "dp_webpage_structure",
        "name": "Webpage Structure",
        "category": DataPointCategory.CONTENT,
        "data_type": DataPointDataType.JSON,
        "description": "Nested heading hierarchy (H1-H6) and document structure",
        "crawl4ai_field": "webpage_structure",
        "display_order": 3,
        "icon": "AccountTreeIcon",
        "color": "#388e3c"
    },
    {
        "id": "dp_schema_markup",
        "name": "Schema Markup",
        "category": DataPointCategory.CONTENT,
        "data_type": DataPointDataType.JSON,
        "description": "Structured data (JSON-LD, Microdata) for rich snippets",
        "crawl4ai_field": "schema_markup",
        "display_order": 4,
        "icon": "CodeIcon",
        "color": "#388e3c"
    },
    {
        "id": "dp_salient_entities",
        "name": "Salient Entities",
        "category": DataPointCategory.CONTENT,
        "data_type": DataPointDataType.JSON,
        "description": "Named entities with salience scores extracted from content",
        "crawl4ai_field": "salient_entities",
        "display_order": 5,
        "icon": "LocalOfferIcon",
        "color": "#388e3c"
    },
    {
        "id": "dp_body_content_embedding",
        "name": "Content Embedding",
        "category": DataPointCategory.CONTENT,
        "data_type": DataPointDataType.VECTOR,
        "description": "Vector embedding of page content for similarity analysis",
        "crawl4ai_field": "body_content_embedding",
        "display_order": 6,
        "icon": "GridOnIcon",
        "color": "#388e3c"
    },

    # LINKS Category (3 points)
    {
        "id": "dp_internal_links",
        "name": "Internal Links",
        "category": DataPointCategory.LINKS,
        "data_type": DataPointDataType.JSON,
        "description": "Array of internal links with URLs and anchor text",
        "crawl4ai_field": "internal_links",
        "display_order": 1,
        "icon": "InsertLinkIcon",
        "color": "#f57c00"
    },
    {
        "id": "dp_external_links",
        "name": "External Links",
        "category": DataPointCategory.LINKS,
        "data_type": DataPointDataType.JSON,
        "description": "Array of external links with URLs and anchor text",
        "crawl4ai_field": "external_links",
        "display_order": 2,
        "icon": "OpenInNewIcon",
        "color": "#f57c00"
    },
    {
        "id": "dp_image_count",
        "name": "Image Count",
        "category": DataPointCategory.LINKS,
        "data_type": DataPointDataType.INTEGER,
        "description": "Total number of images on the page",
        "crawl4ai_field": "image_count",
        "display_order": 3,
        "icon": "ImageIcon",
        "color": "#f57c00"
    },

    # MEDIA Category (2 points)
    {
        "id": "dp_screenshot_url",
        "name": "Thumbnail Screenshot",
        "category": DataPointCategory.MEDIA,
        "data_type": DataPointDataType.STRING,
        "description": "URL to thumbnail screenshot of the page",
        "crawl4ai_field": "screenshot_url",
        "display_order": 1,
        "icon": "CameraAltIcon",
        "color": "#7b1fa2"
    },
    {
        "id": "dp_screenshot_full_url",
        "name": "Full Screenshot",
        "category": DataPointCategory.MEDIA,
        "data_type": DataPointDataType.STRING,
        "description": "URL to full-page screenshot",
        "crawl4ai_field": "screenshot_full_url",
        "display_order": 2,
        "icon": "PhotoSizeSelectLargeIcon",
        "color": "#7b1fa2"
    },

    # TECHNICAL Category (4 points)
    {
        "id": "dp_status_code",
        "name": "HTTP Status Code",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.INTEGER,
        "description": "HTTP response status code (200, 404, 500, etc.)",
        "crawl4ai_field": "status_code",
        "display_order": 1,
        "icon": "HttpIcon",
        "color": "#d32f2f"
    },
    {
        "id": "dp_last_crawled_at",
        "name": "Last Crawled",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.DATETIME,
        "description": "Timestamp of when the page was last crawled",
        "crawl4ai_field": "last_crawled_at",
        "display_order": 2,
        "icon": "AccessTimeIcon",
        "color": "#d32f2f"
    },
    {
        "id": "dp_last_checked_at",
        "name": "Last Checked",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.DATETIME,
        "description": "Timestamp of when the page was last checked for updates",
        "crawl4ai_field": "last_checked_at",
        "display_order": 3,
        "icon": "UpdateIcon",
        "color": "#d32f2f"
    },
    {
        "id": "dp_url",
        "name": "Page URL",
        "category": DataPointCategory.TECHNICAL,
        "data_type": DataPointDataType.STRING,
        "description": "Full URL of the crawled page",
        "crawl4ai_field": "url",
        "display_order": 0,
        "icon": "PublicIcon",
        "color": "#d32f2f"
    },
]


async def seed_data_points():
    """Seed the database with data point definitions."""
    async with AsyncSessionLocal() as db_session:
        now = get_utcnow()
        inserted_count = 0
        skipped_count = 0

        for dp_data in DATA_POINTS:
            # Add timestamps
            dp_data["created_at"] = now
            dp_data["updated_at"] = now
            dp_data["is_active"] = True

            stmt = insert(DataPointDefinition).values(**dp_data)

            try:
                await db_session.execute(stmt)
                inserted_count += 1
                logger.info(f"✓ Inserted: {dp_data['name']} ({dp_data['id']})")
            except IntegrityError:
                await db_session.rollback()
                skipped_count += 1
                logger.warning(f"⊘ Skipped (already exists): {dp_data['name']} ({dp_data['id']})")
            except Exception as e:
                await db_session.rollback()
                logger.error(f"✗ Failed to insert {dp_data['name']}: {e}")
                continue

        # Commit all successful inserts
        try:
            await db_session.commit()
            logger.info(f"\n✅ Seed complete: {inserted_count} inserted, {skipped_count} skipped")
            logger.info(f"Total data points in catalog: {len(DATA_POINTS)}")
        except Exception as e:
            await db_session.rollback()
            logger.error(f"Failed to commit seed data: {e}")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(message)s'
    )

    logger.info("🌱 Seeding DataPointDefinition catalog...")
    logger.info(f"📊 Preparing to insert {len(DATA_POINTS)} data points\n")

    asyncio.run(seed_data_points())
