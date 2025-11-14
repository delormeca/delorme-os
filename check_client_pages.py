"""
Quick script to check if pages exist for a client.
Usage: poetry run python check_client_pages.py
"""
import asyncio
from sqlalchemy import select
from app.db import async_session_factory
from app.models import Client, ClientPage

async def check_pages():
    async with async_session_factory() as session:
        # Get all clients
        result = await session.execute(select(Client))
        clients = result.scalars().all()

        print(f"\n{'='*60}")
        print(f"Found {len(clients)} clients:")
        print(f"{'='*60}\n")

        for client in clients:
            # Count pages for this client
            page_result = await session.execute(
                select(ClientPage).where(ClientPage.client_id == client.id)
            )
            pages = page_result.scalars().all()

            print(f"Client: {client.name} ({client.slug})")
            print(f"  ID: {client.id}")
            print(f"  Engine Setup Completed: {client.engine_setup_completed}")
            print(f"  Page Count: {client.page_count}")
            print(f"  Actual Pages in DB: {len(pages)}")
            print(f"  Sitemap URL: {client.sitemap_url or 'Not set'}")

            if len(pages) > 0:
                print(f"\n  Sample pages:")
                for page in pages[:3]:
                    print(f"    - {page.url}")

            print()

if __name__ == "__main__":
    asyncio.run(check_pages())
