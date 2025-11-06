import datetime
import uuid
from enum import Enum
from typing import List, Optional

from pydantic import ConfigDict
import sqlalchemy as sa
from sqlalchemy import Column, JSON, UniqueConstraint
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import registry
from sqlmodel import Field, Relationship, SQLModel

from app.permissions import AccountType, PlanType
from app.utils.helpers import get_utcnow

mapper_registry = registry()
Base = mapper_registry.generate_base()


class UUIDModelBase(SQLModel, AsyncAttrs):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    model_config = ConfigDict(arbitrary_types_allowed=True)


class Article(UUIDModelBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    author: str
    published_at: Optional[datetime.datetime] = Field(
        default_factory=get_utcnow,
        nullable=True,
    )
    is_published: Optional[bool] = Field(default=False)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    user: "User" = Relationship(back_populates="articles")


class User(UUIDModelBase, table=True):
    email: str = Field(sa_column_kwargs={"unique": True})
    password_hash: Optional[str]
    full_name: str
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )
    last_login: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )
    verified: bool = False
    account_type: AccountType = AccountType.free
    current_plan: PlanType = PlanType.FREE
    stripe_customer_id: Optional[str] = Field(nullable=True, index=True)
    articles: List[Article] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})
    is_superuser: bool = Field(default=False, nullable=False)

    purchases: List["Purchase"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})
    subscription: Optional["Subscription"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})
    research_requests: List["ResearchRequest"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})


class Purchase(UUIDModelBase, table=True):
    """
    Model representing a one-time purchase transaction.
    """

    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    product_type: str  # "basic" or "pro"
    price_id: str  # Stripe price ID
    transaction_id: str = Field(unique=True)  # Stripe transaction ID
    purchase_date: datetime.datetime = Field(default_factory=get_utcnow)
    amount: float  # Store in smallest currency unit if needed
    currency: str = Field(default="USD")
    is_successful: bool = Field(default=False)  # Set True after Stripe confirmation
    download_link: Optional[str] = None  # S3 signed URL for file access

    user: Optional["User"] = Relationship(back_populates="purchases")


class SubscriptionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    TRIALING = "TRIALING"
    CANCELED = "CANCELED"
    EXPIRED = "EXPIRED"
    PAST_DUE = "PAST_DUE"
    UNPAID = "UNPAID"
    INCOMPLETE = "INCOMPLETE"
    INCOMPLETE_EXPIRED = "INCOMPLETE_EXPIRED"


class Subscription(UUIDModelBase, table=True):
    """
    Model representing a user's subscription plan.
    """

    user_id: uuid.UUID = Field(foreign_key="user.id", index=True, unique=True)
    stripe_subscription_id: Optional[str] = Field(
        nullable=True, index=True
    )  # Stripe sub ID
    plan: str  # "premium"
    status: SubscriptionStatus = Field(default=SubscriptionStatus.ACTIVE)
    start_date: datetime.datetime = Field(default_factory=get_utcnow)
    end_date: Optional[datetime.datetime] = None

    user: Optional["User"] = Relationship(back_populates="subscription")


# VibeCode Models


class ProjectLead(UUIDModelBase, table=True):
    """
    Model representing a project lead who manages clients.
    """
    __tablename__ = "projectlead"

    name: str = Field(nullable=False)
    email: str = Field(unique=True, nullable=False, index=True)
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    # Relationships
    clients: List["Client"] = Relationship(
        back_populates="project_lead", sa_relationship_kwargs={"lazy": "selectin"}
    )


class Client(UUIDModelBase, table=True):
    """
    Model representing a client/company in VibeCode.
    """

    name: str = Field(unique=True, nullable=False, index=True)
    description: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    website_url: Optional[str] = None
    sitemap_url: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    crawl_frequency: str = Field(default="Manual Only", nullable=False)
    status: str = Field(default="Active", nullable=False, index=True)
    page_count: int = Field(default=0, nullable=False)

    # Foreign keys
    created_by: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    project_lead_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="projectlead.id",
        nullable=True,
        index=True,
    )

    # Timestamps
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )
    updated_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    # Engine Setup Fields (Phase 2)
    engine_setup_completed: bool = Field(default=False, nullable=False, index=True)
    last_setup_run_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="engine_setup_run.id",
        nullable=True,
    )

    # Relationships
    project_lead: Optional["ProjectLead"] = Relationship(back_populates="clients")
    projects: List["Project"] = Relationship(
        back_populates="client", sa_relationship_kwargs={"lazy": "selectin"}
    )
    client_pages: List["ClientPage"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"}
    )
    engine_setup_runs: List["EngineSetupRun"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "cascade": "all, delete-orphan",
            "foreign_keys": "EngineSetupRun.client_id"
        }
    )
    last_setup_run: Optional["EngineSetupRun"] = Relationship(
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "Client.last_setup_run_id",
            "post_update": True
        }
    )


class ClientPage(UUIDModelBase, table=True):
    """
    Model representing a page/URL discovered during engine setup.
    Different from Project.pages which are pages being actively crawled.

    Now extended to store all 22 SEO data points extracted from pages.
    """
    __tablename__ = "client_page"

    client_id: uuid.UUID = Field(foreign_key="client.id", index=True)
    url: str = Field(sa_column=Column(sa.Text, nullable=False))
    slug: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    status_code: Optional[int] = Field(default=None, index=True)
    is_failed: bool = Field(default=False, index=True)
    failure_reason: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    retry_count: int = Field(default=0)
    last_checked_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=get_utcnow)
    updated_at: datetime.datetime = Field(default_factory=get_utcnow)

    # Phase 3: SEO Data Points (22 columns)
    # Core SEO Data
    page_title: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    meta_title: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    meta_description: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    h1: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    canonical_url: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    hreflang: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    meta_robots: Optional[str] = Field(default=None)
    word_count: Optional[int] = Field(default=None, index=True)

    # Content Analysis
    body_content: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    webpage_structure: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # Nested heading hierarchy
    schema_markup: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # Structured data
    salient_entities: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # Entities with salience scores

    # Links
    internal_links: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # Array of {url, anchor_text}
    external_links: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # Array of {url, anchor_text}
    image_count: Optional[int] = Field(default=None)

    # Embeddings (for future cosine similarity)
    # Note: For pgvector support, you would use: VECTOR(3072) type
    # For now, storing as JSON or reference to separate embeddings table
    body_content_embedding: Optional[str] = Field(default=None, sa_column=Column(sa.Text))  # JSON or vector reference

    # Screenshots
    screenshot_url: Optional[str] = Field(default=None)  # Thumbnail screenshot URL
    screenshot_full_url: Optional[str] = Field(default=None)  # Full page screenshot URL

    # Metadata
    last_crawled_at: Optional[datetime.datetime] = Field(default=None)
    crawl_run_id: Optional[uuid.UUID] = Field(default=None, foreign_key="crawl_run.id", index=True)

    # Relationships
    client: "Client" = Relationship(back_populates="client_pages")
    crawl_run: Optional["CrawlRun"] = Relationship(back_populates="pages")
    data_points: List["DataPoint"] = Relationship(
        back_populates="page",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"}
    )

    __table_args__ = (
        UniqueConstraint("client_id", "url", name="unique_client_url"),
    )


class EngineSetupRun(UUIDModelBase, table=True):
    """
    Model representing an engine setup run (sitemap import or manual entry).
    Tracks progress of page discovery process.
    """
    __tablename__ = "engine_setup_run"

    client_id: uuid.UUID = Field(foreign_key="client.id", index=True)
    setup_type: str  # 'sitemap' or 'manual'
    total_pages: int = Field(default=0)
    successful_pages: int = Field(default=0)
    failed_pages: int = Field(default=0)
    skipped_pages: int = Field(default=0)  # Duplicates
    status: str = Field(default="pending", index=True)  # 'pending', 'in_progress', 'completed', 'failed'
    current_url: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    progress_percentage: int = Field(default=0)
    error_message: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    started_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime = Field(default_factory=get_utcnow)

    # Relationships
    client: "Client" = Relationship(
        back_populates="engine_setup_runs",
        sa_relationship_kwargs={"foreign_keys": "EngineSetupRun.client_id"}
    )


class Project(UUIDModelBase, table=True):
    """
    Model representing a website project in VibeCode.
    """

    client_id: uuid.UUID = Field(foreign_key="client.id", nullable=False)
    name: str
    url: str
    description: Optional[str] = None
    sitemap_url: Optional[str] = None
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    client: "Client" = Relationship(back_populates="projects")
    pages: List["Page"] = Relationship(
        back_populates="project", sa_relationship_kwargs={"lazy": "selectin"}
    )
    crawl_jobs: List["CrawlJob"] = Relationship(
        back_populates="project", sa_relationship_kwargs={"lazy": "selectin"}
    )
    business_files: List["BusinessFile"] = Relationship(
        back_populates="project", sa_relationship_kwargs={"lazy": "selectin"}
    )
    chat_messages: List["ChatMessage"] = Relationship(
        back_populates="project", sa_relationship_kwargs={"lazy": "selectin"}
    )


class Page(UUIDModelBase, table=True):
    """
    Model representing a webpage in a project.
    """

    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False)
    url: str
    slug: str
    status: str = Field(default="discovered")  # discovered, testing, crawling, crawled, failed, removed
    extraction_method: Optional[str] = None  # crawl4ai, jina, firecrawl, playwright
    update_frequency: Optional[str] = None
    last_crawled_at: Optional[datetime.datetime] = None
    next_crawl_at: Optional[datetime.datetime] = None
    is_in_sitemap: bool = Field(default=True)  # Track if URL still exists in sitemap
    removed_from_sitemap_at: Optional[datetime.datetime] = None  # When it was removed
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    project: "Project" = Relationship(back_populates="pages")
    page_data: List["PageData"] = Relationship(
        back_populates="page", sa_relationship_kwargs={"lazy": "selectin"}
    )
    keywords: List["Keyword"] = Relationship(
        back_populates="page", sa_relationship_kwargs={"lazy": "selectin"}
    )
    entities: List["Entity"] = Relationship(
        back_populates="page", sa_relationship_kwargs={"lazy": "selectin"}
    )


class PageData(UUIDModelBase, table=True):
    """
    Model representing extracted data from a webpage.
    Supports versioning - each scrape creates new PageData records with incremented version.
    """

    page_id: uuid.UUID = Field(foreign_key="page.id", nullable=False)
    data_type: str  # meta_title, meta_desc, h1, body, schema
    content: dict = Field(sa_column=Column(JSON))
    version: int = Field(default=1)  # Version number for tracking content changes
    is_current: bool = Field(default=True)  # Only the latest version is marked as current
    extraction_method: Optional[str] = None  # Method used for this specific extraction
    extracted_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    page: "Page" = Relationship(back_populates="page_data")


class Keyword(UUIDModelBase, table=True):
    """
    Model representing a keyword associated with a page.
    """

    page_id: uuid.UUID = Field(foreign_key="page.id", nullable=False)
    keyword: str
    added_by: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    page: "Page" = Relationship(back_populates="keywords")


class Entity(UUIDModelBase, table=True):
    """
    Model representing a named entity extracted from a page.
    """

    page_id: uuid.UUID = Field(foreign_key="page.id", nullable=False)
    entity_text: str
    entity_type: str  # PERSON, LOCATION, ORGANIZATION, etc.
    salience_score: float
    extracted_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    page: "Page" = Relationship(back_populates="entities")


class BusinessFile(UUIDModelBase, table=True):
    """
    Model representing a business file uploaded to a project.
    """

    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False)
    file_name: str
    file_type: str  # pdf, txt, csv, docx
    storage_path: str
    tags: dict = Field(sa_column=Column(JSON))
    uploaded_by: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    uploaded_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    project: "Project" = Relationship(back_populates="business_files")


class CrawlJob(UUIDModelBase, table=True):
    """
    Model representing a crawl job for extracting website content.
    """

    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False)

    # Job phases
    phase: str = Field(default="discovering")  # discovering, testing, extracting, completed, failed
    status: str = Field(default="pending")  # pending, running, completed, failed

    # Discovery results
    urls_discovered: int = Field(default=0)
    discovery_method: Optional[str] = None  # sitemap, crawl4ai, manual

    # Testing results
    test_results: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    winning_method: Optional[str] = None  # crawl4ai, jina, firecrawl, playwright

    # Extraction results
    pages_total: int = Field(default=0)
    pages_crawled: int = Field(default=0)
    pages_failed: int = Field(default=0)

    # Timing
    started_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None

    # Errors
    error_message: Optional[str] = None

    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    # Relationship
    project: "Project" = Relationship(back_populates="crawl_jobs")


class ChatMessage(UUIDModelBase, table=True):
    """
    Model representing a chat message in a project.
    """

    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    message: str
    response: str
    sources: dict = Field(sa_column=Column(JSON))
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    project: "Project" = Relationship(back_populates="chat_messages")
    user: "User" = Relationship()


# Deep Researcher Models


class ResearchRequest(UUIDModelBase, table=True):
    """
    Model representing a deep research request.
    """
    __tablename__ = "research_requests"

    # User relationship
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, index=True)

    # Research Parameters
    query: str = Field(nullable=False, description="Research query/question")
    report_type: str = Field(default="research_report", nullable=False)
    # Options: research_report, detailed_report, deep_research, resource_report, etc.

    tone: str = Field(default="objective", nullable=False)
    # Options: objective, formal, analytical, persuasive, informative, etc.

    max_iterations: int = Field(default=5, nullable=False)
    search_depth: int = Field(default=5, nullable=False)

    # Retriever Configuration
    retrievers: dict = Field(sa_column=Column(JSON), default={"retrievers": ["tavily"]})
    # Options: ["tavily", "google", "duckduckgo", "arxiv", "semantic_scholar", etc.]

    # Status Tracking
    status: str = Field(default="pending", nullable=False, index=True)
    # Options: pending, processing, completed, failed, cancelled

    progress: float = Field(default=0.0, nullable=False)
    # 0.0 to 100.0

    # Results
    report_content: Optional[str] = Field(default=None, sa_column=Column(JSON))
    report_markdown: Optional[str] = None
    report_html: Optional[str] = None

    # Metadata
    total_sources: int = Field(default=0, nullable=False)
    cost_usd: float = Field(default=0.0, nullable=False)
    duration_seconds: Optional[float] = Field(default=None)

    error_message: Optional[str] = Field(default=None)

    # Timestamps
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)
    started_at: Optional[datetime.datetime] = Field(default=None)
    completed_at: Optional[datetime.datetime] = Field(default=None)

    # Relationships
    user: "User" = Relationship(back_populates="research_requests")
    sources: List["ResearchSource"] = Relationship(
        back_populates="research_request",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"}
    )
    chat_messages: List["ResearchChatMessage"] = Relationship(
        back_populates="research_request",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"}
    )


class ResearchSource(UUIDModelBase, table=True):
    """
    Model representing individual sources used in research.
    """
    __tablename__ = "research_sources"

    # Relationships
    research_request_id: uuid.UUID = Field(
        foreign_key="research_requests.id",
        nullable=False,
        index=True
    )

    # Source Information
    url: str = Field(nullable=False)
    title: Optional[str] = Field(default=None)
    summary: Optional[str] = Field(default=None)

    # Retriever that found this source
    retriever: str = Field(nullable=False)

    # Relevance score
    relevance_score: Optional[float] = Field(default=None)

    # Timestamps
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    # Relationships
    research_request: "ResearchRequest" = Relationship(back_populates="sources")


class ResearchChatMessage(UUIDModelBase, table=True):
    """
    Model representing chat messages about research results.
    """
    __tablename__ = "research_chat_messages"

    # Relationships
    research_request_id: uuid.UUID = Field(
        foreign_key="research_requests.id",
        nullable=False,
        index=True
    )

    # Message Content
    role: str = Field(nullable=False)  # "user" or "assistant"
    content: str = Field(nullable=False)

    # Timestamps
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    # Relationships
    research_request: "ResearchRequest" = Relationship(back_populates="chat_messages")


# Phase 3: Data Table Models


class CrawlRun(UUIDModelBase, table=True):
    """
    Model representing a crawl run for data extraction.
    Tracks which pages were crawled and what data was extracted.
    """
    __tablename__ = "crawl_run"

    client_id: uuid.UUID = Field(foreign_key="client.id", nullable=False, index=True)
    run_type: str = Field(nullable=False)  # 'full', 'selective', 'manual'
    status: str = Field(default="pending", nullable=False, index=True)  # 'in_progress', 'completed', 'failed', 'partial'

    # Statistics
    total_pages: int = Field(default=0, nullable=False)
    successful_pages: int = Field(default=0, nullable=False)
    failed_pages: int = Field(default=0, nullable=False)

    # Data points extracted in this run
    data_points_extracted: Optional[list] = Field(default=None, sa_column=Column(sa.ARRAY(sa.String)))  # Array of data point types

    # Timing
    started_at: Optional[datetime.datetime] = Field(default=None)
    completed_at: Optional[datetime.datetime] = Field(default=None)

    # Cost tracking
    estimated_cost: Optional[float] = Field(default=None)  # In USD
    actual_cost: Optional[float] = Field(default=None)  # In USD

    # Phase 4: Real-time progress tracking
    current_page_url: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    progress_percentage: int = Field(default=0, nullable=False)
    current_status_message: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    error_log: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # {errors: [{url, error, timestamp}]}
    performance_metrics: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # {avg_time_per_page, pages_per_minute}
    api_costs: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # {openai_embeddings: {requests, tokens, cost_usd}, google_nlp: {...}}

    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    # Relationships
    pages: List["ClientPage"] = Relationship(
        back_populates="crawl_run",
        sa_relationship_kwargs={"lazy": "selectin"}
    )


class DataPoint(UUIDModelBase, table=True):
    """
    Model representing individual data points for tracking and querying.
    Enables sub-ID system: pg_[uuid]_[data_type]
    Example: pg_a1b2c3d4_embedding, pg_a1b2c3d4_title
    """
    __tablename__ = "data_point"

    page_id: uuid.UUID = Field(foreign_key="client_page.id", nullable=False, index=True)
    data_type: str = Field(nullable=False, index=True)  # 'title', 'meta_title', 'embedding', 'body_content', etc.
    value: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # Flexible storage for any data type
    crawl_run_id: Optional[uuid.UUID] = Field(default=None, foreign_key="crawl_run.id", index=True)

    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    # Relationships
    page: "ClientPage" = Relationship(back_populates="data_points")

    __table_args__ = (
        sa.Index("ix_data_point_page_data_type", "page_id", "data_type"),
        sa.Index("ix_data_point_data_type", "data_type"),
    )
