"""
Data extraction modules for extracting SEO data points from HTML.
"""
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
from .pipeline import ExtractionPipeline

__all__ = [
    "BaseExtractor",
    "PageTitleExtractor",
    "MetaTitleExtractor",
    "MetaDescriptionExtractor",
    "H1Extractor",
    "CanonicalExtractor",
    "HreflangExtractor",
    "MetaRobotsExtractor",
    "BodyContentExtractor",
    "WebpageStructureExtractor",
    "WordCountExtractor",
    "InternalLinksExtractor",
    "ExternalLinksExtractor",
    "ImageCountExtractor",
    "SchemaMarkupExtractor",
    "SlugExtractor",
    "ExtractionPipeline",
]
