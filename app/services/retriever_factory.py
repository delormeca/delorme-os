"""
Retriever factory for GPT Researcher integration.
Manages available search retrievers and their configurations.
"""

from typing import List

from app.config.base import config
from app.schemas.research import RetrieverInfo


class RetrieverFactory:
    """Factory class for managing search retrievers."""

    @staticmethod
    def get_available_retrievers() -> List[RetrieverInfo]:
        """
        Get list of all available retrievers with their configuration status.

        Returns:
            List of RetrieverInfo objects with configuration status
        """
        retrievers = [
            # Web Search Retrievers
            RetrieverInfo(
                name="tavily",
                display_name="Tavily Search",
                description="AI-optimized search engine with high-quality results",
                requires_api_key=True,
                is_configured=bool(config.tavily_api_key),
                category="web",
            ),
            RetrieverInfo(
                name="duckduckgo",
                display_name="DuckDuckGo",
                description="Privacy-focused web search (free, no API key required)",
                requires_api_key=False,
                is_configured=True,  # Always available
                category="web",
            ),
            RetrieverInfo(
                name="google",
                display_name="Google Custom Search",
                description="Google's search engine with comprehensive results",
                requires_api_key=True,
                is_configured=bool(config.google_api_key and config.google_cx),
                category="web",
            ),
            RetrieverInfo(
                name="bing",
                display_name="Bing Search",
                description="Microsoft's search engine",
                requires_api_key=True,
                is_configured=bool(config.bing_api_key),
                category="web",
            ),
            RetrieverInfo(
                name="serper",
                display_name="Serper",
                description="Fast and affordable Google search API",
                requires_api_key=True,
                is_configured=bool(config.serper_api_key),
                category="web",
            ),
            RetrieverInfo(
                name="serpapi",
                display_name="SerpAPI",
                description="Comprehensive search API with multiple engines",
                requires_api_key=True,
                is_configured=bool(config.serpapi_api_key),
                category="web",
            ),
            # Academic Retrievers
            RetrieverInfo(
                name="arxiv",
                display_name="arXiv",
                description="Scientific research papers and preprints",
                requires_api_key=False,
                is_configured=True,  # Always available
                category="academic",
            ),
            RetrieverInfo(
                name="semantic_scholar",
                display_name="Semantic Scholar",
                description="AI-powered research paper search",
                requires_api_key=False,
                is_configured=True,  # Always available
                category="academic",
            ),
            RetrieverInfo(
                name="pubmed",
                display_name="PubMed",
                description="Biomedical and life sciences literature",
                requires_api_key=False,
                is_configured=True,  # Always available
                category="academic",
            ),
        ]

        return retrievers

    @staticmethod
    def validate_retriever_config(retriever_name: str) -> bool:
        """
        Check if a specific retriever is properly configured.

        Args:
            retriever_name: Name of the retriever to check

        Returns:
            True if retriever is configured, False otherwise
        """
        retrievers = RetrieverFactory.get_available_retrievers()
        for retriever in retrievers:
            if retriever.name == retriever_name:
                return retriever.is_configured

        return False

    @staticmethod
    def get_configured_retrievers() -> List[str]:
        """
        Get list of retriever names that are currently configured.

        Returns:
            List of configured retriever names
        """
        retrievers = RetrieverFactory.get_available_retrievers()
        return [r.name for r in retrievers if r.is_configured]

    @staticmethod
    def validate_retrievers_list(retrievers: List[str]) -> tuple[bool, List[str]]:
        """
        Validate a list of retrievers and return which ones are not configured.

        Args:
            retrievers: List of retriever names to validate

        Returns:
            Tuple of (all_valid: bool, invalid_retrievers: List[str])
        """
        configured = RetrieverFactory.get_configured_retrievers()
        invalid = [r for r in retrievers if r not in configured]

        return (len(invalid) == 0, invalid)
