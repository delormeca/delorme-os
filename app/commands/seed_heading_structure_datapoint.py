"""
Add heading_structure data point to the catalog.
This captures the complete H1-H6 heading hierarchy from pages.
"""
import asyncio
from app.db import AsyncSessionLocal
from app.models import DataPointDefinition, DataPointCategory, DataPointDataType


async def seed_heading_structure_datapoint():
    """Add the heading_structure data point."""
    async with AsyncSessionLocal() as db:
        # Check if already exists
        existing = await db.get(DataPointDefinition, "dp_heading_structure")
        if existing:
            print("[INFO] dp_heading_structure already exists, skipping...")
            return

        # Create the data point
        data_point = DataPointDefinition(
            id="dp_heading_structure",
            name="Heading Structure",
            category=DataPointCategory.CONTENT,
            data_type=DataPointDataType.JSON,
            description="Complete heading hierarchy (H1-H6) extracted from page in order",
            crawl4ai_field="heading_structure",
            display_order=7,
            is_active=True,
            icon="format_list_numbered",
            color="#9C27B0"
        )

        # Store values before commit
        dp_id = data_point.id
        dp_name = data_point.name
        dp_category = str(data_point.category)
        dp_field = data_point.crawl4ai_field

        db.add(data_point)
        await db.commit()

        print(f"[SUCCESS] Added data point: {dp_id}")
        print(f"  Name: {dp_name}")
        print(f"  Category: {dp_category}")
        print(f"  Crawl4AI Field: {dp_field}")


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("SEEDING HEADING STRUCTURE DATA POINT")
    print("=" * 80 + "\n")

    asyncio.run(seed_heading_structure_datapoint())

    print("\n[COMPLETE] Heading structure data point seeded!")
