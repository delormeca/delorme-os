"""
Startup script for FastAPI with Python 3.13 + Windows + Playwright compatibility.

This script MUST be the entry point to ensure the event loop policy is set
BEFORE any async operations or event loops are created.
"""
import asyncio
import sys
import os

# CRITICAL: Set event loop policy BEFORE any imports that use asyncio
if sys.platform == 'win32':
    # Windows Proactor Event Loop is required for subprocess support (Playwright)
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    print("[INFO] Set WindowsProactorEventLoopPolicy for Playwright compatibility")

# Now we can safely import uvicorn and start the server
if __name__ == "__main__":
    import uvicorn

    # Run uvicorn with the app
    # CRITICAL: loop="asyncio" prevents uvicorn from overriding our ProactorEventLoop policy
    # Without this, uvicorn sets WindowsSelectorEventLoopPolicy in reload mode on Windows
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8020,
        reload=False,  # TESTING: Disable reload to test if this fixes event loop issue
        log_level="info",
        loop="asyncio"  # Use asyncio (respects our ProactorEventLoopPolicy)
    )
