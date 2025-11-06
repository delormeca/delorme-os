import asyncio
from app.db import AsyncSessionLocal
from app.services.client_page_service import ClientPageService
import uuid

async def test():
    client_id = uuid.UUID('c0f387f7-6979-49a8-bfbc-7385e79cd89c')

    async with AsyncSessionLocal() as session:
        service = ClientPageService(session)

        total = await service.get_client_page_count(client_id)
        failed = await service.get_client_failed_page_count(client_id)

        print(f'Total pages: {total}')
        print(f'Failed pages: {failed}')
        print(f'Successful pages: {total - failed}')

        # Simulate the API response
        response = {
            "client_id": str(client_id),
            "total_pages": total,
            "failed_pages": failed,
            "successful_pages": total - failed
        }
        print(f'\nAPI Response: {response}')

asyncio.run(test())
