"""
Check what data points are in the catalog.
"""
import asyncio
from app.db import AsyncSessionLocal
from app.models import DataPointDefinition
from sqlalchemy import select


async def check_catalog():
    """Show all data points in catalog."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(DataPointDefinition)
            .order_by(DataPointDefinition.category, DataPointDefinition.display_order)
        )
        data_points = result.scalars().all()

        print(f"\n[CATALOG] {len(data_points)} data points in database")
        print("=" * 80)

        by_category = {}
        for dp in data_points:
            cat = str(dp.category).split('.')[-1]
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(dp)

        for cat in sorted(by_category.keys()):
            print(f"\n[{cat}]")
            for dp in by_category[cat]:
                print(f"  {dp.id}")
                print(f"    Name: {dp.name}")
                print(f"    Crawl4AI field: {dp.crawl4ai_field}")
                print()


if __name__ == "__main__":
    asyncio.run(check_catalog())
