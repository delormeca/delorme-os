"""Check crawl run status from database."""
import asyncio
import sys
import io
import json

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from app.db import get_async_db_session
from app.models import CrawlRun
from sqlmodel import select

async def check_status():
    async for db in get_async_db_session():
        result = await db.execute(
            select(CrawlRun).order_by(CrawlRun.created_at.desc()).limit(10)
        )
        crawl_runs = result.scalars().all()
        
        print(f"\nFound {len(crawl_runs)} recent crawl runs:\n")
        
        for i, run in enumerate(crawl_runs, 1):
            print(f"\n[{i}] Crawl Run ID: {run.id}")
            print(f"    Client ID: {run.client_id}")
            print(f"    Status: {run.status}")
            print(f"    Run Type: {run.run_type}")
            print(f"    Progress: {run.progress_percentage}%")
            print(f"    Pages: {run.successful_pages} successful / {run.failed_pages} failed / {run.total_pages} total")
            print(f"    Created: {run.created_at}")
            print(f"    Started: {run.started_at}")
            print(f"    Completed: {run.completed_at}")
            
            if hasattr(run, 'error_log') and run.error_log:
                print(f"    Errors: {json.dumps(run.error_log, indent=2)[:500]}")
            
            if hasattr(run, 'current_status_message') and run.current_status_message:
                print(f"    Status Message: {run.current_status_message}")
            
            print("    " + "-" * 76)
        
        # Check for stuck crawls
        stuck_runs = [r for r in crawl_runs if r.status == 'in_progress']
        if stuck_runs:
            print(f"\nWARNING: Found {len(stuck_runs)} crawls stuck 'in_progress':")
            for run in stuck_runs:
                print(f"  - {run.id} (created {run.created_at})")
        
        break

asyncio.run(check_status())
