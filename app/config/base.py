"""
Base application configuration with automatic environment loading.
Uses pydantic-settings to automatically load from .env files and environment variables.
"""

import os
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _get_env_files() -> List[str]:
    """
    Get environment files to load based on ENV_FILE environment variable.

    Examples:
        ENV_FILE=prod.env -> loads prod.env
        ENV_FILE=staging.env -> loads staging.env
        No ENV_FILE -> loads local.env, .env (default)
    """
    env_file = os.environ.get("ENV_FILE")
    if env_file:
        return [env_file]
    return ["local.env", ".env"]


class BaseConfig(BaseSettings):
    """
    Base configuration class with automatic environment loading.

    This automatically loads values from:
    1. Environment variables
    2. .env files (local.env, .env, or custom via ENV_FILE)
    3. Default values defined here
    """

    model_config = SettingsConfigDict(
        # Load from these files in order (later files override earlier ones)
        # Can be overridden by ENV_FILE environment variable
        env_file=_get_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Environment
    env: str = Field(
        default="local",
        description="Environment (local/development/staging/production)",
    )

    # Security & Authentication
    secret_key: str = Field(
        default="example-key", description="JWT signing key - CHANGE IN PRODUCTION!"
    )
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(
        default=10080, description="JWT expiration (7 days)"
    )
    jwt_cookie_name: str = Field(default="jwt", description="JWT cookie name")
    reset_token_expire_hours: int = Field(
        default=1, description="Password reset token expiration"
    )

    # Domain & URLs
    domain: str = Field(
        default="http://localhost:3000", description="Application domain"
    )
    redirect_after_login: Optional[str] = Field(
        default=None, description="Redirect URL after login"
    )

    # Google OAuth2
    google_oauth2_client_id: Optional[str] = Field(
        default=None, description="Google OAuth2 client ID"
    )
    google_oauth2_secret: Optional[str] = Field(
        default=None, description="Google OAuth2 secret"
    )
    google_oauth2_redirect_uri: Optional[str] = Field(
        default=None, description="Google OAuth2 redirect URI (must match Google Cloud Console exactly)"
    )

    # Database Configuration
    # Support both DATABASE_URL and individual components
    database_url: Optional[str] = Field(
        default=None, description="Full database connection URL (overrides individual db_* fields)"
    )
    db_username: str = Field(
        default="craftyourstartup", description="Database username"
    )
    db_password: str = Field(
        default="craftyourstartup", description="Database password"
    )
    db_host: str = Field(default="localhost", description="Database host")
    db_port: str = Field(default="54323", description="Database port")
    db_database: str = Field(default="craftyourstartup", description="Database name")
    db_sslmode: str = Field(default="require", description="Database SSL mode")

    # Email Configuration
    mailchimp_api_key: Optional[str] = Field(
        default=None, description="Mailchimp Transactional API key for email sending"
    )
    from_email: str = Field(
        default="noreply@example.com", description="Default sender email address"
    )
    from_name: str = Field(
        default="CraftYourStartup", description="Default sender name"
    )
    support_email: str = Field(
        default="support@example.com", description="Support email address"
    )

    # Deep Researcher Configuration
    openai_api_key: Optional[str] = Field(
        default=None, description="OpenAI API key for GPT Researcher"
    )
    tavily_api_key: Optional[str] = Field(
        default=None, description="Tavily API key for web search"
    )
    google_api_key: Optional[str] = Field(
        default=None, description="Google Custom Search API key"
    )
    google_cx: Optional[str] = Field(
        default=None, description="Google Custom Search Engine ID"
    )
    bing_api_key: Optional[str] = Field(
        default=None, description="Bing Search API key"
    )
    serper_api_key: Optional[str] = Field(
        default=None, description="Serper API key"
    )
    serpapi_api_key: Optional[str] = Field(
        default=None, description="SerpAPI key"
    )
    research_max_iterations: int = Field(
        default=5, description="Default max research iterations"
    )
    research_default_retriever: str = Field(
        default="tavily", description="Default retriever"
    )
    research_output_dir: str = Field(
        default="./outputs/research", description="Research output directory"
    )

    # Phase 4: Data Extraction & Crawling Configuration
    google_cloud_credentials_path: Optional[str] = Field(
        default=None, description="Path to Google Cloud service account JSON key file"
    )
    redis_host: str = Field(
        default="localhost", description="Redis host for caching and job queue"
    )
    redis_port: int = Field(
        default=6379, description="Redis port"
    )
    redis_db: int = Field(
        default=0, description="Redis database number"
    )

    # Crawling Configuration
    crawl_rate_limit_delay: int = Field(
        default=2, description="Delay between page crawls in seconds"
    )
    crawl_timeout_seconds: int = Field(
        default=30, description="Timeout for page crawl requests"
    )
    crawl_max_workers: int = Field(
        default=5, description="Maximum concurrent crawl workers"
    )
    crawl_retry_attempts: int = Field(
        default=3, description="Number of retry attempts for failed pages"
    )

    # Embedding Configuration
    embedding_model: str = Field(
        default="text-embedding-3-large", description="OpenAI embedding model"
    )
    embedding_dimensions: int = Field(
        default=3072, description="Embedding vector dimensions"
    )
    embedding_max_tokens: int = Field(
        default=8000, description="Maximum tokens for embedding generation"
    )

    def get_database_url(self) -> str:
        """
        Get database URL.
        If DATABASE_URL env var is set, use it (with asyncpg driver).
        Otherwise, construct from individual components.
        """
        if self.database_url:
            # Use provided DATABASE_URL, converting to asyncpg driver if needed
            url = self.database_url
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url

        # Construct from individual components
        return f"postgresql+asyncpg://{self.db_username}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_database}"

    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.env.lower() in ("local", "development", "dev")

    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.env.lower() in ("production", "prod")

    def is_staging(self) -> bool:
        """Check if running in staging environment."""
        return self.env.lower() in ("staging", "stage")

    def model_post_init(self, __context) -> None:
        """
        Validate critical production settings after initialization.
        Called automatically by Pydantic after model is created.
        """
        if self.is_production() and self.secret_key == "example-key":
            raise ValueError(
                "CRITICAL SECURITY: SECRET_KEY must be set in production!\n"
                "Generate a secure key with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )


# Create a singleton instance for easy importing
config = BaseConfig()

# Export individual variables for backward compatibility
ENV = config.env
SECRET_KEY = config.secret_key
ALGORITHM = config.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = config.access_token_expire_minutes
JWT_COOKIE_NAME = config.jwt_cookie_name
RESET_TOKEN_EXPIRE_HOURS = config.reset_token_expire_hours

DOMAIN = config.domain
REDIRECT_AFTER_LOGIN = config.redirect_after_login

GOOGLE_OAUTH2_CLIENT_ID = config.google_oauth2_client_id
GOOGLE_OAUTH2_SECRET = config.google_oauth2_secret
GOOGLE_OAUTH2_REDIRECT_URI = config.google_oauth2_redirect_uri

# Database
DB_USERNAME = config.db_username
DB_PASSWORD = config.db_password
DB_HOST = config.db_host
DB_PORT = config.db_port
DB_DATABASE = config.db_database
DB_SSLMODE = config.db_sslmode
DATABASE_URL = config.get_database_url()

# Email
MAILCHIMP_API_KEY = config.mailchimp_api_key
FROM_EMAIL = config.from_email
FROM_NAME = config.from_name
SUPPORT_EMAIL = config.support_email

# Deep Researcher
OPENAI_API_KEY = config.openai_api_key
TAVILY_API_KEY = config.tavily_api_key
GOOGLE_API_KEY = config.google_api_key
GOOGLE_CX = config.google_cx
BING_API_KEY = config.bing_api_key
SERPER_API_KEY = config.serper_api_key
SERPAPI_API_KEY = config.serpapi_api_key
RESEARCH_MAX_ITERATIONS = config.research_max_iterations
RESEARCH_DEFAULT_RETRIEVER = config.research_default_retriever
RESEARCH_OUTPUT_DIR = config.research_output_dir

# Phase 4: Crawling & Data Extraction
GOOGLE_CLOUD_CREDENTIALS_PATH = config.google_cloud_credentials_path
REDIS_HOST = config.redis_host
REDIS_PORT = config.redis_port
REDIS_DB = config.redis_db
CRAWL_RATE_LIMIT_DELAY = config.crawl_rate_limit_delay
CRAWL_TIMEOUT_SECONDS = config.crawl_timeout_seconds
CRAWL_MAX_WORKERS = config.crawl_max_workers
CRAWL_RETRY_ATTEMPTS = config.crawl_retry_attempts
EMBEDDING_MODEL = config.embedding_model
EMBEDDING_DIMENSIONS = config.embedding_dimensions
EMBEDDING_MAX_TOKENS = config.embedding_max_tokens
