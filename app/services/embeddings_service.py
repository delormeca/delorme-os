"""
OpenAI embeddings generation service for semantic search.

Generates vector embeddings from text content for similarity search.
"""
import logging
import json
from typing import Optional, List, Tuple
import tiktoken

from openai import AsyncOpenAI

from app.config.base import config

logger = logging.getLogger(__name__)


class EmbeddingsService:
    """
    Service for generating OpenAI embeddings from text.

    Uses text-embedding-3-large for high-quality semantic vectors.
    """

    def __init__(self):
        """Initialize the embeddings service."""
        if not config.openai_api_key:
            logger.warning("⚠️  OpenAI API key not configured. Embeddings disabled.")
            self.client = None
        else:
            self.client = AsyncOpenAI(api_key=config.openai_api_key)
            logger.info("✅ OpenAI embeddings service initialized")

        # Initialize tokenizer for the embedding model
        try:
            self.tokenizer = tiktoken.encoding_for_model(config.embedding_model)
        except Exception:
            # Fallback to cl100k_base encoding (used by text-embedding-3-*)
            self.tokenizer = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text for cost estimation.

        Args:
            text: Text to count tokens for

        Returns:
            Number of tokens
        """
        if not text:
            return 0

        tokens = self.tokenizer.encode(text)
        return len(tokens)

    def truncate_text(self, text: str, max_tokens: int = None) -> str:
        """
        Truncate text to fit within token limit.

        Args:
            text: Text to truncate
            max_tokens: Maximum tokens (defaults to config.embedding_max_tokens)

        Returns:
            Truncated text
        """
        if not text:
            return ""

        max_tokens = max_tokens or config.embedding_max_tokens

        # Encode to tokens
        tokens = self.tokenizer.encode(text)

        # Truncate if needed
        if len(tokens) > max_tokens:
            logger.warning(
                f"Text truncated from {len(tokens)} to {max_tokens} tokens"
            )
            tokens = tokens[:max_tokens]

        # Decode back to text
        return self.tokenizer.decode(tokens)

    async def generate_embedding(
        self, text: str, truncate: bool = True
    ) -> Optional[Tuple[List[float], int, float]]:
        """
        Generate embedding for text.

        Args:
            text: Text to generate embedding for
            truncate: Whether to truncate text if too long

        Returns:
            Tuple of (embedding_vector, tokens_used, cost_usd) or None on error
        """
        if not self.client:
            logger.warning("OpenAI client not initialized. Skipping embeddings.")
            return None

        if not text or not text.strip():
            logger.warning("Empty text provided for embedding generation")
            return None

        try:
            # Truncate if needed
            if truncate:
                text = self.truncate_text(text)

            # Count tokens for cost tracking
            token_count = self.count_tokens(text)

            logger.info(f"Generating embedding for {token_count} tokens...")

            # Generate embedding
            response = await self.client.embeddings.create(
                model=config.embedding_model,
                input=text,
                dimensions=config.embedding_dimensions,
            )

            # Extract embedding vector
            embedding = response.data[0].embedding

            # Calculate cost
            # text-embedding-3-large pricing: $0.13 per 1M tokens
            cost_per_token = 0.13 / 1_000_000
            cost_usd = token_count * cost_per_token

            logger.info(
                f"✅ Generated embedding: {len(embedding)} dimensions, "
                f"{token_count} tokens, ${cost_usd:.6f}"
            )

            return (embedding, token_count, cost_usd)

        except Exception as e:
            logger.error(f"❌ Error generating embedding: {str(e)}", exc_info=True)
            return None

    async def generate_embeddings_batch(
        self, texts: List[str], truncate: bool = True
    ) -> List[Optional[Tuple[List[float], int, float]]]:
        """
        Generate embeddings for multiple texts (batch).

        Note: OpenAI API supports batch requests but we process sequentially
        to avoid rate limits and provide better error handling.

        Args:
            texts: List of texts to generate embeddings for
            truncate: Whether to truncate texts if too long

        Returns:
            List of (embedding_vector, tokens_used, cost_usd) tuples or None
        """
        results = []

        for i, text in enumerate(texts, start=1):
            logger.info(f"Generating embedding {i}/{len(texts)}...")
            result = await self.generate_embedding(text, truncate)
            results.append(result)

        return results

    def embedding_to_json(self, embedding: List[float]) -> str:
        """
        Convert embedding vector to JSON string for storage.

        Args:
            embedding: Embedding vector

        Returns:
            JSON string
        """
        return json.dumps(embedding)

    def json_to_embedding(self, json_str: str) -> List[float]:
        """
        Convert JSON string back to embedding vector.

        Args:
            json_str: JSON string

        Returns:
            Embedding vector
        """
        return json.loads(json_str)

    def calculate_cosine_similarity(
        self, embedding1: List[float], embedding2: List[float]
    ) -> float:
        """
        Calculate cosine similarity between two embeddings.

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Cosine similarity score (0-1)
        """
        import numpy as np

        # Convert to numpy arrays
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)

        # Calculate cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = dot_product / (norm1 * norm2)
        return float(similarity)


# Singleton instance
_embeddings_service: Optional[EmbeddingsService] = None


def get_embeddings_service() -> EmbeddingsService:
    """
    Get singleton embeddings service instance.

    Returns:
        EmbeddingsService instance
    """
    global _embeddings_service

    if _embeddings_service is None:
        _embeddings_service = EmbeddingsService()

    return _embeddings_service
