"""
Google Cloud Natural Language API service for entity extraction.

Extracts salient entities (people, organizations, locations, etc.) from text.
"""
import logging
from typing import Optional, List, Dict, Any, Tuple
import os

from app.config.base import config

logger = logging.getLogger(__name__)

# Import Google Cloud NLP only if credentials are configured
try:
    from google.cloud import language_v1
    from google.oauth2 import service_account

    GOOGLE_NLP_AVAILABLE = True
except ImportError:
    GOOGLE_NLP_AVAILABLE = False
    logger.warning("⚠️  google-cloud-language not installed. Entity extraction disabled.")


class GoogleNLPService:
    """
    Service for extracting entities using Google Cloud Natural Language API.

    Extracts salient entities (people, organizations, locations, products, etc.)
    with salience scores indicating their importance to the content.
    """

    def __init__(self):
        """Initialize the Google NLP service."""
        self.client = None

        if not GOOGLE_NLP_AVAILABLE:
            logger.warning("⚠️  Google Cloud NLP library not available")
            return

        # Check for credentials
        credentials_path = config.google_cloud_credentials_path

        if not credentials_path:
            logger.warning(
                "⚠️  Google Cloud credentials path not configured. "
                "Set GOOGLE_CLOUD_CREDENTIALS_PATH in environment."
            )
            return

        if not os.path.exists(credentials_path):
            logger.warning(
                f"⚠️  Google Cloud credentials file not found: {credentials_path}"
            )
            return

        try:
            # Load credentials from service account file
            credentials = service_account.Credentials.from_service_account_file(
                credentials_path
            )

            # Initialize client
            self.client = language_v1.LanguageServiceClient(credentials=credentials)

            logger.info("✅ Google Cloud NLP service initialized")

        except Exception as e:
            logger.error(f"❌ Failed to initialize Google NLP client: {str(e)}")
            self.client = None

    async def analyze_entities(
        self, text: str, language_code: str = "en"
    ) -> Optional[Tuple[List[Dict[str, Any]], float]]:
        """
        Analyze text and extract entities with salience scores.

        Args:
            text: Text to analyze
            language_code: Language code (default: "en")

        Returns:
            Tuple of (entities_list, cost_usd) or None on error

        Entities format:
        [
            {
                "name": "Google",
                "type": "ORGANIZATION",
                "salience": 0.85,
                "mentions": 3,
                "metadata": {...}
            },
            ...
        ]
        """
        if not self.client:
            logger.warning("Google NLP client not initialized. Skipping entity extraction.")
            return None

        if not text or not text.strip():
            logger.warning("Empty text provided for entity extraction")
            return None

        # Truncate text if too long (Google NLP has limits)
        max_chars = 100000  # ~100KB text limit
        if len(text) > max_chars:
            logger.warning(f"Text truncated from {len(text)} to {max_chars} characters")
            text = text[:max_chars]

        try:
            logger.info(f"Analyzing entities in {len(text)} characters of text...")

            # Prepare the document
            document = language_v1.Document(
                content=text,
                type_=language_v1.Document.Type.PLAIN_TEXT,
                language=language_code,
            )

            # Analyze entities
            response = self.client.analyze_entities(
                document=document,
                encoding_type=language_v1.EncodingType.UTF8,
            )

            # Extract and format entities
            entities_list = []

            for entity in response.entities:
                # Only include entities with salience > 0.01 (filter noise)
                if entity.salience > 0.01:
                    entity_data = {
                        "name": entity.name,
                        "type": language_v1.Entity.Type(entity.type_).name,
                        "salience": round(float(entity.salience), 4),
                        "mentions": len(entity.mentions),
                        "metadata": dict(entity.metadata) if entity.metadata else {},
                    }

                    # Add Wikipedia URL if available
                    if "wikipedia_url" in entity.metadata:
                        entity_data["wikipedia_url"] = entity.metadata["wikipedia_url"]

                    entities_list.append(entity_data)

            # Sort by salience (most important first)
            entities_list.sort(key=lambda x: x["salience"], reverse=True)

            # Calculate cost
            # Google Cloud Natural Language API pricing:
            # Entity Analysis: $1.00 per 1000 text records (up to 1000 chars each)
            # For text > 1000 chars, count as multiple records
            text_records = max(1, len(text) // 1000)
            cost_per_record = 1.00 / 1000
            cost_usd = text_records * cost_per_record

            logger.info(
                f"✅ Extracted {len(entities_list)} entities "
                f"({text_records} text records, ${cost_usd:.6f})"
            )

            return (entities_list, cost_usd)

        except Exception as e:
            logger.error(f"❌ Error analyzing entities: {str(e)}", exc_info=True)
            return None

    def format_entities_for_display(self, entities: List[Dict[str, Any]]) -> str:
        """
        Format entities as a readable string.

        Args:
            entities: List of entity dictionaries

        Returns:
            Formatted string
        """
        if not entities:
            return "No entities found"

        lines = []
        for entity in entities[:10]:  # Top 10 most salient
            lines.append(
                f"- {entity['name']} ({entity['type']}) "
                f"[salience: {entity['salience']:.2f}]"
            )

        return "\n".join(lines)

    def get_top_entities(
        self,
        entities: List[Dict[str, Any]],
        entity_type: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Get top N entities, optionally filtered by type.

        Args:
            entities: List of entity dictionaries
            entity_type: Optional type filter (e.g., "PERSON", "ORGANIZATION")
            limit: Maximum number to return

        Returns:
            Filtered and limited entities list
        """
        if entity_type:
            entities = [e for e in entities if e["type"] == entity_type]

        return entities[:limit]


# Singleton instance
_google_nlp_service: Optional[GoogleNLPService] = None


def get_google_nlp_service() -> GoogleNLPService:
    """
    Get singleton Google NLP service instance.

    Returns:
        GoogleNLPService instance
    """
    global _google_nlp_service

    if _google_nlp_service is None:
        _google_nlp_service = GoogleNLPService()

    return _google_nlp_service
