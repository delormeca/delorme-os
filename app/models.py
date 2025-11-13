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
