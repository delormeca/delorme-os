import datetime
import uuid
from enum import Enum
from typing import List, Optional

from pydantic import ConfigDict
import sqlalchemy as sa
from sqlalchemy import Column, JSON, Text, UniqueConstraint
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import registry
from sqlmodel import Field, Relationship, SQLModel
from pgvector.sqlalchemy import Vector

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


class DataPointCategory(str, Enum):
    """Categories for grouping data points in the UI."""
    ONPAGE = "onpage"
    TECHNICAL = "technical"
    CONTENT = "content"
    LINKS = "links"
    MEDIA = "media"


class DataPointDataType(str, Enum):
    """Data types for data point values."""
    STRING = "string"
    JSON = "json"
    INTEGER = "integer"
    VECTOR = "vector"
    DATETIME = "datetime"


class PageSource(str, Enum):
    """Enum for tracking how a page was added to the system."""
    MANUAL = "manual"              # Manually added by user
    SITEMAP_AUTO = "sitemap_auto"  # Auto-discovered from sitemap


class SitemapTrackingFrequency(str, Enum):
    """Enum for sitemap tracking frequency options."""
    DAILY = "daily"
    WEEKLY = "weekly"
    BI_MONTHLY = "bi_monthly"
    MONTHLY = "monthly"
    MANUAL_ONLY = "manual_only"


class ChangeType(str, Enum):
    """Enum for sitemap change types."""
    ADDED = "added"              # New URL discovered in sitemap
    REMOVED = "removed"          # URL no longer in sitemap
    STATUS_CHANGED = "status_changed"  # HTTP status code changed


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
    slug: str = Field(
        unique=True,
        nullable=False,
        index=True,
        description="URL-friendly unique identifier (format: lowercase-with-hyphens)"
    )
    description: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    website_url: Optional[str] = None
    sitemap_url: Optional[str] = None
    industry: Optional[str] = None
    team_lead: Optional[str] = Field(
        default=None,
        nullable=True,
        description="Team lead responsible for this client. Must be one of: Tommy Delorme, Ismael Girard, OP"
    )
    logo_url: Optional[str] = None
    crawl_frequency: str = Field(default="Manual Only", nullable=False)
    sitemap_tracking_frequency: str = Field(
        default=SitemapTrackingFrequency.WEEKLY.value,
        nullable=False
    )  # Sitemap tracking schedule (separate from crawl_frequency)
    sitemap_tracker_enabled: bool = Field(default=True, nullable=False)  # Enable/disable sitemap tracking
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
    sitemap_tracker_configured: bool = Field(
        default=False,
        nullable=False,
        index=True
    )  # Sitemap tracker configured and run at least once
    last_setup_run_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="engine_setup_run.id",
        nullable=True,
    )
    last_sitemap_tracker_run_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="sitemap_tracker_run.id"
    )  # FK to most recent sitemap tracker run

    # Relationships
    project_lead: Optional["ProjectLead"] = Relationship(back_populates="clients")
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
    apify_crawl_runs: List["ApifyCrawlRun"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={"foreign_keys": "[ApifyCrawlRun.client_id]"}
    )
    sitemap_tracker_runs: List["SitemapTrackerRun"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={"foreign_keys": "SitemapTrackerRun.client_id"}
    )
    sitemap_changes: List["SitemapChange"] = Relationship(back_populates="client")
    last_setup_run: Optional["EngineSetupRun"] = Relationship(
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "Client.last_setup_run_id",
            "post_update": True
        }
    )
    last_sitemap_tracker_run: Optional["SitemapTrackerRun"] = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[Client.last_sitemap_tracker_run_id]",
            "lazy": "joined"
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
    schema_markup: Optional[list] = Field(default=None, sa_column=Column(JSON))  # Structured data (array of JSON-LD objects)
    salient_entities: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # Entities with salience scores

    # Links
    internal_links: Optional[list] = Field(default=None, sa_column=Column(JSON))  # Array of {url, anchor_text}
    external_links: Optional[list] = Field(default=None, sa_column=Column(JSON))  # Array of {url, anchor_text}
    image_count: Optional[int] = Field(default=None)

    # Embeddings (for future cosine similarity)
    # Note: For pgvector support, you would use: VECTOR(3072) type
    # For now, storing as JSON or reference to separate embeddings table
    body_content_embedding: Optional[str] = Field(default=None, sa_column=Column(sa.Text))  # JSON or vector reference

    # Screenshots
    screenshot_url: Optional[str] = Field(default=None)  # Thumbnail screenshot URL
    screenshot_full_url: Optional[str] = Field(default=None)  # Full page screenshot URL

    # Tags for filtering and organization
    tags: Optional[list] = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
        description="Array of tag strings for categorization and filtering (e.g., ['blog', 'product-page', 'high-priority'])"
    )

    # Metadata
    last_crawled_at: Optional[datetime.datetime] = Field(default=None)
    crawl_run_id: Optional[uuid.UUID] = Field(default=None, foreign_key="crawl_run.id", index=True)

    # Sitemap Tracker Integration Fields
    source: PageSource = Field(default=PageSource.MANUAL, nullable=False, index=True)
    sent_to_crawler_at: Optional[datetime.datetime] = Field(default=None)
    crawl_count: int = Field(default=0, nullable=False, index=True)
    in_crawler: bool = Field(default=False, nullable=False, index=True)
    status_code_history: Optional[list] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Array tracking status code changes: [{status_code: int, checked_at: ISO datetime, source: 'sitemap'|'crawler'}]"
    )

    # Relationships
    client: "Client" = Relationship(back_populates="client_pages")
    crawl_run: Optional["CrawlRun"] = Relationship(back_populates="pages")
    versions: List["ClientPageVersion"] = Relationship(
        back_populates="client_page",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
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


class ApifyCrawlRun(UUIDModelBase, table=True):
    """
    Model representing an Apify crawl run (default crawler).
    Tracks progress and statistics for Apify website content crawler runs.
    """
    __tablename__ = "apify_crawl_run"

    client_id: uuid.UUID = Field(foreign_key="client.id", nullable=False, index=True)
    apify_run_id: Optional[str] = Field(default=None, index=True)  # Apify platform run ID
    apify_actor_id: str = Field(default="apify/website-content-crawler", nullable=False)
    status: str = Field(default="pending", nullable=False, index=True)  # pending, running, completed, failed

    # Statistics
    total_pages: int = Field(default=0, nullable=False)
    pages_crawled: int = Field(default=0, nullable=False)
    pages_failed: int = Field(default=0, nullable=False)

    # Cost tracking
    apify_compute_units: Optional[float] = Field(default=None)
    apify_cost_usd: Optional[float] = Field(default=None)

    # Timing
    run_time_seconds: Optional[float] = Field(default=None)
    started_at: Optional[datetime.datetime] = Field(default=None)
    completed_at: Optional[datetime.datetime] = Field(default=None)

    # Error handling
    error_message: Optional[str] = Field(default=None, sa_column=Column(sa.Text))

    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    # Relationships
    client: "Client" = Relationship(
        back_populates="apify_crawl_runs",
        sa_relationship_kwargs={"foreign_keys": "[ApifyCrawlRun.client_id]"}
    )
    page_versions: List["ClientPageVersion"] = Relationship(
        back_populates="crawl_run",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class ClientPageVersion(UUIDModelBase, table=True):
    """
    Model storing complete page data from Apify with versioning support.
    Each crawl creates a new version, enabling historical tracking and change detection.
    Stores all 83 data points extracted from Apify Website Content Crawler.
    """
    __tablename__ = "client_page_version"

    # Foreign Keys
    client_page_id: uuid.UUID = Field(foreign_key="client_page.id", nullable=False, index=True)
    crawl_run_id: uuid.UUID = Field(foreign_key="apify_crawl_run.id", nullable=False, index=True)
    version: int = Field(default=1, nullable=False, index=True)  # Incremental version number

    # Core metadata
    url: str = Field(sa_column=Column(sa.Text, nullable=False))
    slug: str = Field(sa_column=Column(sa.Text, nullable=False))
    page_title: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    meta_title: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    meta_description: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    canonical_url: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    language: Optional[str] = None
    author: Optional[str] = None

    # Dates
    publishing_date: Optional[datetime.datetime] = None
    last_modified: Optional[datetime.datetime] = None

    # Headings (individual counts)
    h1: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    h1_count: int = Field(default=0, nullable=False)
    h2_count: int = Field(default=0, nullable=False)
    h3_count: int = Field(default=0, nullable=False)
    h4_count: int = Field(default=0, nullable=False)
    h5_count: int = Field(default=0, nullable=False)
    h6_count: int = Field(default=0, nullable=False)
    h1_list: Optional[list] = Field(default=None, sa_column=Column(JSON))
    webpage_structure: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    # Content (raw and markdown)
    raw_text: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    markdown_text: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    word_count: int = Field(default=0, nullable=False)
    character_count: int = Field(default=0, nullable=False)
    readability_score: Optional[float] = None

    # Page metrics
    page_weight_kb: float = Field(default=0, nullable=False)
    page_weight_mb: float = Field(default=0, nullable=False)

    # SEO metadata
    meta_robots: Optional[str] = None
    meta_keywords: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    meta_viewport: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    meta_generator: Optional[str] = None

    # Structured data
    schema_markup: Optional[list] = Field(default=None, sa_column=Column(JSON))
    schema_types: Optional[list] = Field(default=None, sa_column=Column(JSON))
    hreflang: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    # Links
    internal_links: Optional[list] = Field(default=None, sa_column=Column(JSON))
    internal_link_count: int = Field(default=0, nullable=False)
    external_links: Optional[list] = Field(default=None, sa_column=Column(JSON))
    external_link_count: int = Field(default=0, nullable=False)
    total_link_count: int = Field(default=0, nullable=False)

    # Media
    image_count: int = Field(default=0, nullable=False)
    image_alt_texts: Optional[list] = Field(default=None, sa_column=Column(JSON))
    video_count: int = Field(default=0, nullable=False)
    iframe_count: int = Field(default=0, nullable=False)

    # Open Graph tags
    og_title: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    og_description: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    og_image: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    og_type: Optional[str] = None
    og_url: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    og_site_name: Optional[str] = None
    og_locale: Optional[str] = None

    # Twitter Card tags
    twitter_card: Optional[str] = None
    twitter_title: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    twitter_description: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    twitter_image: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    twitter_site: Optional[str] = None
    twitter_creator: Optional[str] = None

    # Facebook tags
    fb_app_id: Optional[str] = None
    fb_admins: Optional[str] = None

    # Apify crawl info
    http_status_code: Optional[int] = Field(default=None, index=True)
    apify_loaded_url: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    apify_loaded_time: Optional[datetime.datetime] = None
    apify_referrer_url: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    apify_crawl_depth: int = Field(default=0, nullable=False)
    apify_request_handler_mode: Optional[str] = None  # "browser" or "http"

    # Apify flags
    apify_has_html: bool = Field(default=False, nullable=False)
    apify_has_markdown: bool = Field(default=False, nullable=False)
    apify_has_screenshot: bool = Field(default=False, nullable=False)

    # Screenshots
    screenshot_url: Optional[str] = Field(default=None, sa_column=Column(sa.Text))
    screenshot_file: Optional[str] = Field(default=None, sa_column=Column(sa.Text))

    # HTML technical info
    html_lang: Optional[str] = None
    html_dir: Optional[str] = None
    charset: Optional[str] = None
    favicon: Optional[str] = Field(default=None, sa_column=Column(sa.Text))

    # Forms & interactivity
    form_count: int = Field(default=0, nullable=False)
    input_count: int = Field(default=0, nullable=False)
    button_count: int = Field(default=0, nullable=False)

    # Scripts & styles
    script_count: int = Field(default=0, nullable=False)
    style_count: int = Field(default=0, nullable=False)
    external_scripts: int = Field(default=0, nullable=False)
    external_stylesheets: int = Field(default=0, nullable=False)

    # Embeddings (using pgvector) - Hidden from UI
    embedding_raw_text: Optional[list] = Field(default=None, sa_column=Column(Vector(3072)))
    embedding_page_title: Optional[list] = Field(default=None, sa_column=Column(Vector(3072)))
    embedding_slug: Optional[list] = Field(default=None, sa_column=Column(Vector(3072)))

    # Similar pages (calculated from embeddings)
    similar_to: Optional[list] = Field(default=None, sa_column=Column(JSON))

    # Metadata
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)

    # Relationships
    client_page: "ClientPage" = Relationship(back_populates="versions")
    crawl_run: "ApifyCrawlRun" = Relationship(back_populates="page_versions")

    # Table constraints
    __table_args__ = (
        sa.Index("ix_client_page_version_page_version", "client_page_id", "version"),
        sa.Index("ix_client_page_version_created", "created_at"),
    )


class SitemapTrackerRun(UUIDModelBase, table=True):
    """Tracks each sitemap monitoring execution with full historical data."""
    __tablename__ = "sitemap_tracker_run"

    # Foreign Key & Core Configuration
    client_id: uuid.UUID = Field(foreign_key="client.id", nullable=False, index=True)
    schedule_frequency: str = Field(default="weekly", nullable=False)  # daily, weekly, bi_monthly, monthly, manual
    sitemap_url: str = Field(nullable=False)  # The sitemap URL checked during this run

    # Run Status & Progress
    status: str = Field(default="pending", nullable=False, index=True)  # pending, in_progress, completed, failed, cancelled
    progress_percentage: int = Field(default=0, nullable=False)  # 0-100
    current_url_being_checked: Optional[str] = Field(default=None)
    current_status_message: Optional[str] = Field(default=None)

    # Statistics - Sitemap Inventory
    total_urls_in_sitemap: int = Field(default=0, nullable=False)
    total_urls_checked: int = Field(default=0, nullable=False)

    # Statistics - Change Detection
    new_urls_count: int = Field(default=0, nullable=False)
    removed_urls_count: int = Field(default=0, nullable=False)
    status_code_changes_count: int = Field(default=0, nullable=False)
    unchanged_urls_count: int = Field(default=0, nullable=False)

    # Statistics - HTTP Status Codes
    status_code_summary: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Distribution of status codes: {\"200\": 1150, \"404\": 3, ...}"
    )

    # Timestamps
    started_at: Optional[datetime.datetime] = Field(default=None, index=True)
    completed_at: Optional[datetime.datetime] = Field(default=None)
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False, index=True)

    # Error Handling
    error_message: Optional[str] = Field(default=None)
    error_log: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Detailed error information: {\"failed_urls\": [...], \"errors\": [...]}"
    )

    # Comparison Metadata
    previous_run_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="sitemap_tracker_run.id",
        index=True
    )
    comparison_baseline_snapshot: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Snapshot of previous run's URL list for delta calculation"
    )

    # Performance Metrics
    execution_time_seconds: Optional[float] = Field(default=None)
    average_response_time_ms: Optional[float] = Field(default=None)

    # Relationships
    client: "Client" = Relationship(
        back_populates="sitemap_tracker_runs",
        sa_relationship_kwargs={"foreign_keys": "[SitemapTrackerRun.client_id]"}
    )
    changes: List["SitemapChange"] = Relationship(
        back_populates="sitemap_tracker_run",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    previous_run: Optional["SitemapTrackerRun"] = Relationship(
        sa_relationship_kwargs={
            "remote_side": "SitemapTrackerRun.id",
            "foreign_keys": "[SitemapTrackerRun.previous_run_id]"
        }
    )


class SitemapChange(UUIDModelBase, table=True):
    """Records individual URL changes detected during sitemap monitoring runs."""
    __tablename__ = "sitemap_change"

    # Foreign Keys
    client_id: uuid.UUID = Field(foreign_key="client.id", nullable=False, index=True)
    sitemap_tracker_run_id: uuid.UUID = Field(
        foreign_key="sitemap_tracker_run.id",
        nullable=False,
        index=True
    )

    # Change Identification
    url: str = Field(sa_column=Column(Text, nullable=False, index=True))
    change_type: ChangeType = Field(nullable=False, index=True)

    # Status Tracking
    old_status_code: Optional[int] = Field(default=None, index=True)
    new_status_code: Optional[int] = Field(default=None, index=True)

    # Timestamps
    detected_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
        index=True
    )
    last_seen_at: Optional[datetime.datetime] = Field(default=None)

    # Crawler Integration
    pushed_to_crawler: bool = Field(default=False, nullable=False, index=True)
    pushed_at: Optional[datetime.datetime] = Field(default=None)

    # Importance & Filtering
    importance: Optional[str] = Field(default=None, index=True)
    notes: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Relationships
    client: "Client" = Relationship(
        back_populates="sitemap_changes",
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    sitemap_tracker_run: "SitemapTrackerRun" = Relationship(
        back_populates="changes",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    # Table Constraints & Indexes
    __table_args__ = (
        sa.Index("ix_sitemap_change_client_type", "client_id", "change_type"),
        sa.Index("ix_sitemap_change_status_codes", "new_status_code", "old_status_code"),
        sa.Index("ix_sitemap_change_client_detected", "client_id", "detected_at"),
        sa.Index("ix_sitemap_change_unpushed", "client_id", "pushed_to_crawler"),
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


class DataPointDefinition(SQLModel, AsyncAttrs, table=True):
    """
    Master catalog of all extractable data points.
    Defines metadata for UI rendering, validation, and Crawl4AI field mapping.

    Uses custom string IDs (format: dp_{name}) instead of UUID for human readability
    and easier reference in code/configuration.
    """
    __tablename__ = "data_point_definition"

    # Primary Key - Custom string format: dp_meta_title, dp_h1, etc.
    id: str = Field(
        primary_key=True,
        index=True,
        nullable=False,
        description="Custom ID format: dp_{snake_case_name}"
    )

    # Core Metadata
    name: str = Field(
        nullable=False,
        max_length=100,
        description="Human-readable display name (e.g., 'Meta Title')"
    )

    category: DataPointCategory = Field(
        nullable=False,
        index=True,
        description="Category for UI grouping (onpage, technical, content, links, media)"
    )

    data_type: DataPointDataType = Field(
        nullable=False,
        index=True,
        description="Data type for storage and validation (string, json, integer, vector, datetime)"
    )

    description: str = Field(
        sa_column=Column(sa.Text, nullable=False),
        description="Detailed explanation of what this data point represents"
    )

    # Crawl4AI Integration
    crawl4ai_field: str = Field(
        nullable=False,
        sa_column_kwargs={"unique": True},
        description="Exact field name from Crawl4AI extraction output"
    )

    # UI Configuration
    display_order: int = Field(
        default=0,
        nullable=False,
        index=True,
        ge=0,
        description="Sort order within category for UI display (0-based)"
    )

    is_active: bool = Field(
        default=True,
        nullable=False,
        index=True,
        description="Whether this data point is enabled for extraction"
    )

    icon: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Material-UI icon name for UI rendering"
    )

    color: Optional[str] = Field(
        default=None,
        max_length=7,
        description="Hex color code for category-based theming (format: #RRGGBB)"
    )

    # Timestamps - Following Client model pattern
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    updated_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    # Relationships
    # NOTE: Phase 4 - Add relationship to ClientEngineConfig when that model is created
    # client_engine_configs: List["ClientEngineConfig"] = Relationship(...)

    # Composite index for efficient category-ordered queries
    __table_args__ = (
        sa.Index("ix_data_point_definition_category_order", "category", "display_order"),
    )
