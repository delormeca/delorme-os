import datetime
import uuid
from enum import Enum
from typing import List, Optional

from pydantic import ConfigDict
from sqlalchemy import Column, JSON
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


class Client(UUIDModelBase, table=True):
    """
    Model representing a client/company in VibeCode.
    """

    name: str
    industry: Optional[str] = None
    created_by: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    created_at: datetime.datetime = Field(
        default_factory=get_utcnow,
        nullable=False,
    )

    projects: List["Project"] = Relationship(
        back_populates="client", sa_relationship_kwargs={"lazy": "selectin"}
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
