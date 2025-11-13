import asyncio
import logging
import os
import sys
import io
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# CRITICAL: Set event loop policy at module import time (before uvicorn creates loops)
# This MUST be the first thing that happens on Windows for Playwright/subprocess support
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    print("[STARTUP] Set WindowsProactorEventLoopPolicy for Playwright/APScheduler compatibility")

    # Fix for Windows console encoding issues with Crawl4AI/rich
    # Reconfigure stdout/stderr to use UTF-8 encoding
    # This prevents UnicodeEncodeError when rich/Crawl4AI outputs Unicode characters
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    os.environ['PYTHONIOENCODING'] = 'utf-8'

from app.admin import create_admin
from app.auth_backend import JWTAuthenticationBackend
from app.controllers.auth import auth_router
from app.controllers.payments import payments_router
from app.controllers.plans import plans_router
from app.controllers.integrations import integrations_router
from app.controllers.upgrades import upgrades_router
from app.controllers.clients import router as clients_router
from app.controllers.research import router as research_router
from app.controllers.project_leads import router as project_leads_router
from app.controllers.engine_setup import router as engine_setup_router
from app.controllers.client_pages import router as client_pages_router
from app.controllers.page_crawl import router as page_crawl_router
from app.controllers.tags import router as tags_router
from app.controllers.setup import setup_router
from app.db import async_engine
from app.config.base import config


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to limit request payload size and prevent DoS attacks"""

    def __init__(self, app, max_upload_size: int = 10 * 1024 * 1024):  # 10 MB default
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request, call_next):
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > self.max_upload_size:
                return JSONResponse(
                    status_code=413,
                    content={
                        "error": f"Request too large. Maximum size: {self.max_upload_size / 1024 / 1024:.0f}MB"
                    }
                )
        response = await call_next(request)
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logging.info("✅ Database tables created/verified")
    except Exception as e:
        # Tables might already exist - log warning but continue
        logging.warning(f"⚠️ Database initialization: {str(e)}")
        logging.info("✅ Continuing with existing database schema")

    # Initialize APScheduler (for sitemap discovery)
    from app.tasks.crawl_tasks import get_scheduler, shutdown_scheduler
    scheduler = get_scheduler()
    logging.info(f"✅ APScheduler (crawl_tasks) started with {len(scheduler.get_jobs())} jobs")

    # Initialize APScheduler for page crawl tasks (data extraction)
    from app.tasks.page_crawl_tasks import get_page_crawl_scheduler, shutdown_page_crawl_scheduler
    page_crawl_scheduler = get_page_crawl_scheduler()
    logging.info(f"✅ APScheduler (page_crawl_tasks) started with {len(page_crawl_scheduler.get_jobs())} jobs")

    yield

    # Shutdown both schedulers
    logging.info("🛑 Shutting down APSchedulers...")
    shutdown_scheduler()
    shutdown_page_crawl_scheduler()
    logging.info("✅ APSchedulers shutdown complete")

middleware = [Middleware(AuthenticationMiddleware, backend=JWTAuthenticationBackend())]

app = FastAPI(debug=True, middleware=middleware, lifespan=lifespan)

# Rate limiter configuration
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter

# Rate limit error handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"error": "Rate limit exceeded. Please try again later."}
    )

# Add CORS middleware to handle preflight OPTIONS requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://localhost:5173",  # Vite development server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        config.domain,  # Production domain
        "https://delorme-os-staging-frontend.onrender.com",  # Staging frontend
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Add rate limiting middleware
app.add_middleware(SlowAPIMiddleware)

# Add request size limit middleware (10 MB limit)
app.add_middleware(RequestSizeLimitMiddleware, max_upload_size=10 * 1024 * 1024)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    
    # Apply CSP upgrade-insecure-requests only to admin routes (fixes SQLAdmin mixed content)
    if not config.is_development() and request.url.path.startswith("/admin"):
        response.headers["Content-Security-Policy"] = "upgrade-insecure-requests"
    
    return response


admin = create_admin(app)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(payments_router, prefix="/api/payments", tags=["payments"])
app.include_router(plans_router)
app.include_router(integrations_router)
app.include_router(upgrades_router)
app.include_router(clients_router, prefix="/api", tags=["clients"])
app.include_router(research_router, prefix="/api", tags=["research"])
app.include_router(project_leads_router, prefix="/api", tags=["project-leads"])
app.include_router(engine_setup_router, prefix="/api", tags=["engine-setup"])
app.include_router(client_pages_router, prefix="/api", tags=["client-pages"])
app.include_router(page_crawl_router, tags=["page-crawl"])
app.include_router(tags_router, prefix="/api", tags=["tags"])
app.include_router(setup_router, prefix="/api/setup", tags=["setup"])

static_directory = "static/static"

if os.path.exists(static_directory):
    app.mount(
        "/static", StaticFiles(directory=static_directory, html=True), name="static"
    )

public_directory = "static/assets"

if os.path.exists(public_directory):
    app.mount(
        "/assets", StaticFiles(directory=public_directory, html=True), name="static"
    )

# Mount screenshots directory
screenshots_directory = "static/screenshots"

if os.path.exists(screenshots_directory):
    app.mount(
        "/screenshots", StaticFiles(directory=screenshots_directory), name="screenshots"
    )


@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring and testing"""
    return {"status": "healthy", "service": "CraftYourStartup API"}


@app.get("/robots.txt", response_class=FileResponse)
async def read_robots():
    return FileResponse("static/robots.txt")


@app.get("/sitemap.xml", response_class=FileResponse)
async def read_sitemap():
    return FileResponse("static/sitemap.xml")


@app.get("/{full_path:path}", response_class=HTMLResponse)
async def catch_all(full_path: str):
    index_path = "static/index.html"

    if not os.path.exists(index_path):
        raise HTTPException(status_code=404)
    return FileResponse(index_path, headers={"Document-Policy": "js-profiling"})


logging.basicConfig(level=logging.INFO)
logging.getLogger("sqlalchemy").setLevel(logging.ERROR)

# map static

fetch_lock = asyncio.Lock()
plan_lock = asyncio.Lock()
logger = logging.getLogger()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8020)


