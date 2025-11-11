import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel
from starlette.middleware.authentication import AuthenticationMiddleware

# Fix for Python 3.13 on Windows - Playwright/Crawl4ai subprocess issue
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.admin import create_admin
from app.auth_backend import JWTAuthenticationBackend
from app.controllers.auth import auth_router
from app.controllers.article import article_router
from app.controllers.payments import payments_router
from app.controllers.plans import plans_router
from app.controllers.analytics import analytics_router
from app.controllers.integrations import integrations_router
from app.controllers.upgrades import upgrades_router
from app.controllers.clients import router as clients_router
from app.controllers.projects import router as projects_router
from app.controllers.pages import router as pages_router
from app.controllers.crawling import router as crawling_router
from app.controllers.research import router as research_router
from app.controllers.project_leads import router as project_leads_router
from app.controllers.engine_setup import router as engine_setup_router
from app.controllers.client_pages import router as client_pages_router
from app.controllers.page_crawl import router as page_crawl_router
from app.db import async_engine
from app.config.base import config

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

    # Initialize APScheduler
    from app.tasks.crawl_tasks import get_scheduler, shutdown_scheduler
    scheduler = get_scheduler()
    logging.info(f"✅ APScheduler started with {len(scheduler.get_jobs())} jobs")

    yield

    # Shutdown
    logging.info("🛑 Shutting down APScheduler...")
    shutdown_scheduler()
    logging.info("✅ APScheduler shutdown complete")

middleware = [Middleware(AuthenticationMiddleware, backend=JWTAuthenticationBackend())]

app = FastAPI(debug=True, middleware=middleware, lifespan=lifespan)

# Add CORS middleware to handle preflight OPTIONS requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://localhost:5173",  # Vite development server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        config.domain,  # Production domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    
    # Apply CSP upgrade-insecure-requests only to admin routes (fixes SQLAdmin mixed content)
    if not config.is_development() and request.url.path.startswith("/admin"):
        response.headers["Content-Security-Policy"] = "upgrade-insecure-requests"
    
    return response


admin = create_admin(app)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(article_router, prefix="/api/articles", tags=["articles"])
app.include_router(payments_router, prefix="/api/payments", tags=["payments"])
app.include_router(plans_router)
app.include_router(analytics_router)
app.include_router(integrations_router)
app.include_router(upgrades_router)
app.include_router(clients_router, prefix="/api", tags=["clients"])
app.include_router(projects_router, prefix="/api", tags=["projects"])
app.include_router(pages_router, prefix="/api", tags=["pages"])
app.include_router(crawling_router, prefix="/api/crawl", tags=["crawling"])
app.include_router(research_router, prefix="/api", tags=["research"])
app.include_router(project_leads_router, prefix="/api", tags=["project-leads"])
app.include_router(engine_setup_router, prefix="/api", tags=["engine-setup"])
app.include_router(client_pages_router, prefix="/api", tags=["client-pages"])
app.include_router(page_crawl_router, tags=["page-crawl"])

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

