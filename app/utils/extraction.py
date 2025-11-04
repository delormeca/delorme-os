"""
Utility functions for extracting content from HTML pages.
"""
import json
import re
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
import html2text


def extract_meta_title(html: str) -> Optional[str]:
    """
    Extract the meta title from HTML.

    Args:
        html: Raw HTML content

    Returns:
        The meta title or None if not found
    """
    try:
        soup = BeautifulSoup(html, "lxml")

        # Try <title> tag first
        title_tag = soup.find("title")
        if title_tag and title_tag.string:
            return title_tag.string.strip()

        # Try og:title meta tag
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title.get("content").strip()

        # Try twitter:title meta tag
        twitter_title = soup.find("meta", attrs={"name": "twitter:title"})
        if twitter_title and twitter_title.get("content"):
            return twitter_title.get("content").strip()

        return None
    except Exception:
        return None


def extract_meta_description(html: str) -> Optional[str]:
    """
    Extract the meta description from HTML.

    Args:
        html: Raw HTML content

    Returns:
        The meta description or None if not found
    """
    try:
        soup = BeautifulSoup(html, "lxml")

        # Try standard meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            return meta_desc.get("content").strip()

        # Try og:description
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            return og_desc.get("content").strip()

        # Try twitter:description
        twitter_desc = soup.find("meta", attrs={"name": "twitter:description"})
        if twitter_desc and twitter_desc.get("content"):
            return twitter_desc.get("content").strip()

        return None
    except Exception:
        return None


def extract_h1_tags(html: str) -> List[str]:
    """
    Extract all H1 tags from HTML.

    Args:
        html: Raw HTML content

    Returns:
        List of H1 text content
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        h1_tags = soup.find_all("h1")
        return [h1.get_text(strip=True) for h1 in h1_tags if h1.get_text(strip=True)]
    except Exception:
        return []


def extract_h2_tags(html: str) -> List[str]:
    """
    Extract all H2 tags from HTML.

    Args:
        html: Raw HTML content

    Returns:
        List of H2 text content
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        h2_tags = soup.find_all("h2")
        return [h2.get_text(strip=True) for h2 in h2_tags if h2.get_text(strip=True)]
    except Exception:
        return []


def extract_h3_tags(html: str) -> List[str]:
    """
    Extract all H3 tags from HTML.

    Args:
        html: Raw HTML content

    Returns:
        List of H3 text content
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        h3_tags = soup.find_all("h3")
        return [h3.get_text(strip=True) for h3 in h3_tags if h3.get_text(strip=True)]
    except Exception:
        return []


def extract_h4_tags(html: str) -> List[str]:
    """
    Extract all H4 tags from HTML.

    Args:
        html: Raw HTML content

    Returns:
        List of H4 text content
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        h4_tags = soup.find_all("h4")
        return [h4.get_text(strip=True) for h4 in h4_tags if h4.get_text(strip=True)]
    except Exception:
        return []


def extract_h5_tags(html: str) -> List[str]:
    """
    Extract all H5 tags from HTML.

    Args:
        html: Raw HTML content

    Returns:
        List of H5 text content
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        h5_tags = soup.find_all("h5")
        return [h5.get_text(strip=True) for h5 in h5_tags if h5.get_text(strip=True)]
    except Exception:
        return []


def extract_h6_tags(html: str) -> List[str]:
    """
    Extract all H6 tags from HTML.

    Args:
        html: Raw HTML content

    Returns:
        List of H6 text content
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        h6_tags = soup.find_all("h6")
        return [h6.get_text(strip=True) for h6 in h6_tags if h6.get_text(strip=True)]
    except Exception:
        return []


def extract_schema_markup(html: str) -> List[Dict]:
    """
    Extract JSON-LD schema markup from HTML.

    Args:
        html: Raw HTML content

    Returns:
        List of parsed JSON-LD objects
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        schema_tags = soup.find_all("script", type="application/ld+json")

        schemas = []
        for tag in schema_tags:
            if tag.string:
                try:
                    schema_data = json.loads(tag.string)
                    schemas.append(schema_data)
                except json.JSONDecodeError:
                    continue

        return schemas
    except Exception:
        return []


def html_to_markdown(html: str) -> str:
    """
    Convert HTML to Markdown format.

    Args:
        html: Raw HTML content

    Returns:
        Markdown text
    """
    try:
        h = html2text.HTML2Text()
        h.ignore_links = False
        h.ignore_images = False
        h.ignore_emphasis = False
        h.body_width = 0  # Don't wrap lines
        h.single_line_break = False

        markdown = h.handle(html)
        return markdown.strip()
    except Exception:
        return ""


def extract_body_text(html: str, markdown: bool = False) -> str:
    """
    Extract main body text from HTML.

    Args:
        html: Raw HTML content
        markdown: If True, convert to markdown format

    Returns:
        Body text content
    """
    try:
        soup = BeautifulSoup(html, "lxml")

        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()

        # Try to find main content area
        main_content = soup.find("main") or soup.find("article") or soup.find("body")

        if main_content:
            if markdown:
                return html_to_markdown(str(main_content))
            else:
                return main_content.get_text(separator=" ", strip=True)

        return ""
    except Exception:
        return ""


def count_words(text: str) -> int:
    """
    Count words in text.

    Args:
        text: Text content

    Returns:
        Word count
    """
    if not text:
        return 0

    # Remove extra whitespace and split
    words = re.findall(r'\b\w+\b', text)
    return len(words)


def extract_links(html: str) -> List[Dict[str, str]]:
    """
    Extract all links from HTML.

    Args:
        html: Raw HTML content

    Returns:
        List of dictionaries with 'url' and 'text' keys
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        links = []

        for a_tag in soup.find_all("a", href=True):
            href = a_tag.get("href", "").strip()
            text = a_tag.get_text(strip=True)

            if href and not href.startswith(("#", "javascript:", "mailto:", "tel:")):
                links.append({
                    "url": href,
                    "text": text
                })

        return links
    except Exception:
        return []


def extract_images(html: str) -> List[Dict[str, str]]:
    """
    Extract all images from HTML.

    Args:
        html: Raw HTML content

    Returns:
        List of dictionaries with 'src', 'alt' keys
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        images = []

        for img_tag in soup.find_all("img"):
            src = img_tag.get("src", "").strip()
            alt = img_tag.get("alt", "").strip()

            if src:
                images.append({
                    "src": src,
                    "alt": alt
                })

        return images
    except Exception:
        return []


def extract_canonical_url(html: str) -> Optional[str]:
    """
    Extract canonical URL from HTML.

    Args:
        html: Raw HTML content

    Returns:
        Canonical URL or None
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        canonical = soup.find("link", rel="canonical")
        if canonical and canonical.get("href"):
            return canonical.get("href").strip()
        return None
    except Exception:
        return None


def extract_meta_keywords(html: str) -> Optional[str]:
    """
    Extract meta keywords from HTML.

    Args:
        html: Raw HTML content

    Returns:
        Meta keywords or None
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        keywords = soup.find("meta", attrs={"name": "keywords"})
        if keywords and keywords.get("content"):
            return keywords.get("content").strip()
        return None
    except Exception:
        return None


def extract_meta_robots(html: str) -> Optional[str]:
    """
    Extract meta robots directive from HTML.

    Args:
        html: Raw HTML content

    Returns:
        Meta robots directive or None
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        robots = soup.find("meta", attrs={"name": "robots"})
        if robots and robots.get("content"):
            return robots.get("content").strip()
        return None
    except Exception:
        return None


def extract_meta_author(html: str) -> Optional[str]:
    """
    Extract meta author from HTML.

    Args:
        html: Raw HTML content

    Returns:
        Meta author or None
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        author = soup.find("meta", attrs={"name": "author"})
        if author and author.get("content"):
            return author.get("content").strip()
        return None
    except Exception:
        return None


def extract_language(html: str) -> Optional[str]:
    """
    Extract language from HTML.

    Args:
        html: Raw HTML content

    Returns:
        Language code or None
    """
    try:
        soup = BeautifulSoup(html, "lxml")

        # Try html lang attribute
        html_tag = soup.find("html")
        if html_tag and html_tag.get("lang"):
            return html_tag.get("lang").strip()

        # Try meta content-language
        lang_meta = soup.find("meta", attrs={"http-equiv": "content-language"})
        if lang_meta and lang_meta.get("content"):
            return lang_meta.get("content").strip()

        return None
    except Exception:
        return None


def extract_og_tags(html: str) -> Dict[str, str]:
    """
    Extract Open Graph meta tags from HTML.

    Args:
        html: Raw HTML content

    Returns:
        Dictionary of OG tags
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        og_tags = {}

        # Find all og: meta tags
        for meta in soup.find_all("meta", property=re.compile("^og:")):
            property_name = meta.get("property", "").replace("og:", "")
            content = meta.get("content", "").strip()
            if property_name and content:
                og_tags[property_name] = content

        return og_tags
    except Exception:
        return {}


def extract_twitter_tags(html: str) -> Dict[str, str]:
    """
    Extract Twitter Card meta tags from HTML.

    Args:
        html: Raw HTML content

    Returns:
        Dictionary of Twitter tags
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        twitter_tags = {}

        # Find all twitter: meta tags
        for meta in soup.find_all("meta", attrs={"name": re.compile("^twitter:")}):
            name = meta.get("name", "").replace("twitter:", "")
            content = meta.get("content", "").strip()
            if name and content:
                twitter_tags[name] = content

        return twitter_tags
    except Exception:
        return {}


def extract_favicon(html: str) -> Optional[str]:
    """
    Extract favicon URL from HTML.

    Args:
        html: Raw HTML content

    Returns:
        Favicon URL or None
    """
    try:
        soup = BeautifulSoup(html, "lxml")

        # Try various favicon link types
        favicon_rels = ["icon", "shortcut icon", "apple-touch-icon"]
        for rel in favicon_rels:
            favicon = soup.find("link", rel=rel)
            if favicon and favicon.get("href"):
                return favicon.get("href").strip()

        return None
    except Exception:
        return None


def calculate_content_quality_score(html: str) -> int:
    """
    Calculate a quality score (0-100) for extracted content.

    Scoring criteria:
    - Has meta title: 20 points
    - Has meta description: 20 points
    - Has H1 tags: 15 points
    - Has H2 tags: 10 points
    - Has schema markup: 15 points
    - Has body content (>100 words): 20 points

    Args:
        html: Raw HTML content

    Returns:
        Quality score (0-100)
    """
    score = 0

    # Check meta title
    if extract_meta_title(html):
        score += 20

    # Check meta description
    if extract_meta_description(html):
        score += 20

    # Check H1 tags
    h1_tags = extract_h1_tags(html)
    if h1_tags:
        score += 15

    # Check H2 tags
    h2_tags = extract_h2_tags(html)
    if h2_tags:
        score += 10

    # Check schema markup
    schema = extract_schema_markup(html)
    if schema:
        score += 15

    # Check body content
    body_text = extract_body_text(html)
    word_count = count_words(body_text)
    if word_count > 100:
        score += 20
    elif word_count > 50:
        score += 10

    return min(score, 100)


def extract_all_content(html: str) -> Dict:
    """
    Extract all available content from HTML.

    Args:
        html: Raw HTML content

    Returns:
        Dictionary containing all extracted content
    """
    body_markdown = html_to_markdown(html)
    body_text = extract_body_text(html)

    return {
        # Meta tags
        "meta_title": extract_meta_title(html),
        "meta_description": extract_meta_description(html),
        "meta_keywords": extract_meta_keywords(html),
        "meta_robots": extract_meta_robots(html),
        "meta_author": extract_meta_author(html),

        # Heading tags
        "h1_tags": extract_h1_tags(html),
        "h2_tags": extract_h2_tags(html),
        "h3_tags": extract_h3_tags(html),
        "h4_tags": extract_h4_tags(html),
        "h5_tags": extract_h5_tags(html),
        "h6_tags": extract_h6_tags(html),

        # Structured data
        "schema_markup": extract_schema_markup(html),

        # Body content
        "body_markdown": body_markdown,
        "body_text": body_text,
        "word_count": count_words(body_text),
        "char_count": len(body_text),

        # Links and images
        "links": extract_links(html),
        "images": extract_images(html),

        # SEO and social
        "canonical_url": extract_canonical_url(html),
        "og_tags": extract_og_tags(html),
        "twitter_tags": extract_twitter_tags(html),

        # Other
        "language": extract_language(html),
        "favicon": extract_favicon(html),
        "quality_score": calculate_content_quality_score(html),
    }
