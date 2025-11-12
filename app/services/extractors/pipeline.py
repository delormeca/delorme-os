"""
Extraction pipeline for orchestrating all data extractors.
"""
from typing import Dict, List, Optional, Any
import logging
import time

from .base import BaseExtractor
from .metadata_extractors import (
    PageTitleExtractor,
    MetaTitleExtractor,
    MetaDescriptionExtractor,
    H1Extractor,
    CanonicalExtractor,
    HreflangExtractor,
    MetaRobotsExtractor,
)
from .content_extractors import (
    BodyContentExtractor,
    WebpageStructureExtractor,
    WordCountExtractor,
)
from .link_extractors import (
    InternalLinksExtractor,
    ExternalLinksExtractor,
    ImageCountExtractor,
)
from .advanced_extractors import (
    SchemaMarkupExtractor,
    SlugExtractor,
)

logger = logging.getLogger(__name__)


class ExtractionPipeline:
    """
    Pipeline for running multiple extractors on HTML content.

    Orchestrates extraction of all 22 data points from a page.
    """

    def __init__(self):
        """Initialize pipeline with all extractors."""
        self.extractors: Dict[str, BaseExtractor] = {}

        # Register all extractors
        self.register_default_extractors()

    def register_default_extractors(self) -> None:
        """Register all default extractors for the 22 data points."""
        # Metadata extractors
        self.register_extractor("page_title", PageTitleExtractor())
        self.register_extractor("meta_title", MetaTitleExtractor())
        self.register_extractor("meta_description", MetaDescriptionExtractor())
        self.register_extractor("h1", H1Extractor())
        self.register_extractor("canonical_url", CanonicalExtractor())
        self.register_extractor("hreflang", HreflangExtractor())
        self.register_extractor("meta_robots", MetaRobotsExtractor())

        # Content extractors
        self.register_extractor("body_content", BodyContentExtractor())
        self.register_extractor("webpage_structure", WebpageStructureExtractor())
        self.register_extractor("word_count", WordCountExtractor())

        # Link extractors
        self.register_extractor("internal_links", InternalLinksExtractor())
        self.register_extractor("external_links", ExternalLinksExtractor())
        self.register_extractor("image_count", ImageCountExtractor())

        # Advanced extractors
        self.register_extractor("schema_markup", SchemaMarkupExtractor())
        self.register_extractor("slug", SlugExtractor())

    def register_extractor(self, name: str, extractor: BaseExtractor) -> None:
        """
        Register a new extractor.

        Args:
            name: Name/key for the extractor
            extractor: Extractor instance
        """
        self.extractors[name] = extractor
        logger.debug(f"Registered extractor: {name}")

    def extract_all(self, html: str, url: str) -> Dict[str, Any]:
        """
        Extract all data points from HTML.

        Args:
            html: HTML content to extract from
            url: URL of the page

        Returns:
            Dictionary with all extracted data points
        """
        logger.info(f"Starting extraction pipeline for {url}")
        start_time = time.time()

        results = {}
        extraction_times = {}
        errors = []

        for name, extractor in self.extractors.items():
            extractor_start = time.time()

            try:
                value = extractor.extract_safe(html, url)
                results[name] = value

                extraction_time = time.time() - extractor_start
                extraction_times[name] = round(extraction_time, 3)

                if value is not None:
                    logger.debug(f"✓ {name}: extracted ({extraction_time:.3f}s)")
                else:
                    logger.debug(f"✗ {name}: no data found")

            except Exception as e:
                logger.error(f"✗ {name}: extraction failed - {str(e)}")
                results[name] = None
                errors.append({"extractor": name, "error": str(e)})

        total_time = time.time() - start_time
        successful = sum(1 for v in results.values() if v is not None)
        total = len(self.extractors)

        logger.info(
            f"✅ Extraction complete: {successful}/{total} successful "
            f"in {total_time:.2f}s"
        )

        # Add metadata
        results["_extraction_metadata"] = {
            "total_time": round(total_time, 2),
            "successful_extractions": successful,
            "total_extractors": total,
            "extraction_times": extraction_times,
            "errors": errors if errors else None,
        }

        return results

    def extract_selected(
        self, html: str, url: str, data_points: List[str]
    ) -> Dict[str, Any]:
        """
        Extract only selected data points.

        Args:
            html: HTML content to extract from
            url: URL of the page
            data_points: List of data point names to extract

        Returns:
            Dictionary with selected extracted data points
        """
        logger.info(f"Extracting {len(data_points)} selected data points from {url}")
        start_time = time.time()

        results = {}
        extraction_times = {}
        errors = []

        for name in data_points:
            if name not in self.extractors:
                logger.warning(f"Unknown data point requested: {name}")
                continue

            extractor = self.extractors[name]
            extractor_start = time.time()

            try:
                value = extractor.extract_safe(html, url)
                results[name] = value

                extraction_time = time.time() - extractor_start
                extraction_times[name] = round(extraction_time, 3)

                if value is not None:
                    logger.debug(f"✓ {name}: extracted ({extraction_time:.3f}s)")

            except Exception as e:
                logger.error(f"✗ {name}: extraction failed - {str(e)}")
                results[name] = None
                errors.append({"extractor": name, "error": str(e)})

        total_time = time.time() - start_time
        successful = sum(1 for v in results.values() if v is not None)

        logger.info(
            f"✅ Selected extraction complete: {successful}/{len(data_points)} "
            f"successful in {total_time:.2f}s"
        )

        # Add metadata
        results["_extraction_metadata"] = {
            "total_time": round(total_time, 2),
            "successful_extractions": successful,
            "requested_extractors": len(data_points),
            "extraction_times": extraction_times,
            "errors": errors if errors else None,
        }

        return results

    def get_available_extractors(self) -> List[str]:
        """
        Get list of available extractor names.

        Returns:
            List of extractor names
        """
        return list(self.extractors.keys())
