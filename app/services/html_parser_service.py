"""
HTML Parser Service for extracting metadata and structured data from HTML.
Extracts Open Graph, Twitter Cards, Schema markup, and other metadata.
"""
from typing import Optional, Dict, Any, List
from bs4 import BeautifulSoup
import json
import re


class HTMLParserService:
    """Service for parsing HTML and extracting structured metadata."""

    def __init__(self, html: str):
        """
        Initialize parser with HTML content.

        Args:
            html: Raw HTML string to parse
        """
        self.html = html
        self.soup = BeautifulSoup(html, 'html.parser')

    def extract_all(self) -> Dict[str, Any]:
        """
        Extract all available metadata from HTML.

        Returns:
            Dictionary with all extracted fields
        """
        return {
            # Core SEO metadata
            'page_title': self.get_page_title(),
            'meta_title': self.get_meta_title(),
            'meta_description': self.get_meta_description(),

            # OnPage metadata
            'h1': self.get_h1(),
            'canonical_url': self.get_canonical_url(),
            'hreflang': self.get_hreflang(),
            'meta_robots': self.get_meta_robots(),
            'meta_viewport': self.get_meta_viewport(),
            'lang': self.get_language(),
            'charset': self.get_charset(),

            # Open Graph (use colon format to match database)
            'head_data.og:title': self.get_open_graph('title'),
            'head_data.og:description': self.get_open_graph('description'),
            'head_data.og:image': self.get_open_graph('image'),
            'head_data.og:type': self.get_open_graph('type'),
            'head_data.og:url': self.get_open_graph('url'),
            'head_data.og:site_name': self.get_open_graph('site_name'),

            # Twitter Cards (use colon format to match database)
            'head_data.twitter:card': self.get_twitter_card('card'),
            'head_data.twitter:title': self.get_twitter_card('title'),
            'head_data.twitter:description': self.get_twitter_card('description'),
            'head_data.twitter:image': self.get_twitter_card('image'),
            'head_data.twitter:site': self.get_twitter_card('site'),
            'head_data.twitter:creator': self.get_twitter_card('creator'),

            # Content structure
            'webpage_structure': self.get_webpage_structure(),
            'schema_markup': self.get_schema_markup(),
            'heading_structure': self.get_heading_structure(),

            # Mobile
            'is_mobile_responsive': self.is_mobile_responsive(),
        }

    # OnPage Metadata Extraction

    def get_page_title(self) -> Optional[str]:
        """
        Extract <title> tag content with OG fallback.

        Returns:
            Title text or None
        """
        # Primary: <title> tag
        title_tag = self.soup.find('title')
        if title_tag and title_tag.string:
            return title_tag.string.strip()

        # Fallback: Open Graph title
        og_title = self.get_open_graph('title')
        return og_title if og_title else None

    def get_meta_title(self) -> Optional[str]:
        """
        Extract <meta name="title"> content.

        Returns:
            Meta title or None
        """
        meta_title = self.soup.find('meta', attrs={'name': 'title'})
        return meta_title.get('content', '').strip() if meta_title else None

    def get_meta_description(self) -> Optional[str]:
        """
        Extract <meta name="description"> content with OG fallback.

        Returns:
            Meta description or None
        """
        # Primary: <meta name="description">
        meta_desc = self.soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            return meta_desc['content'].strip()

        # Fallback: Open Graph description
        og_desc = self.get_open_graph('description')
        return og_desc if og_desc else None

    def get_h1(self) -> Optional[str]:
        """Extract first H1 heading from page."""
        h1 = self.soup.find('h1')
        return h1.get_text(strip=True) if h1 else None

    def get_canonical_url(self) -> Optional[str]:
        """Extract canonical URL from link tag."""
        canonical = self.soup.find('link', rel='canonical')
        return canonical.get('href') if canonical else None

    def get_hreflang(self) -> Optional[List[Dict[str, str]]]:
        """Extract hreflang alternate links."""
        hreflang_links = self.soup.find_all('link', rel='alternate', hreflang=True)
        if not hreflang_links:
            return None

        return [
            {
                'hreflang': link.get('hreflang'),
                'href': link.get('href')
            }
            for link in hreflang_links
        ]

    def get_meta_robots(self) -> Optional[str]:
        """Extract meta robots directive."""
        robots = self.soup.find('meta', attrs={'name': 'robots'})
        return robots.get('content') if robots else None

    def get_meta_viewport(self) -> Optional[str]:
        """Extract viewport meta tag."""
        viewport = self.soup.find('meta', attrs={'name': 'viewport'})
        return viewport.get('content') if viewport else None

    def get_language(self) -> Optional[str]:
        """Extract page language from html tag."""
        html_tag = self.soup.find('html')
        return html_tag.get('lang') if html_tag else None

    def get_charset(self) -> Optional[str]:
        """Extract character encoding."""
        charset_meta = self.soup.find('meta', charset=True)
        if charset_meta:
            return charset_meta.get('charset')

        # Try content-type meta
        content_type = self.soup.find('meta', attrs={'http-equiv': 'Content-Type'})
        if content_type:
            content = content_type.get('content', '')
            match = re.search(r'charset=([^;]+)', content)
            if match:
                return match.group(1)

        return None

    # Open Graph Extraction

    def get_open_graph(self, property_name: str) -> Optional[str]:
        """
        Extract Open Graph meta tag.

        Args:
            property_name: OG property name (e.g., 'title', 'description')

        Returns:
            Content value or None
        """
        og_tag = self.soup.find('meta', property=f'og:{property_name}')
        return og_tag.get('content') if og_tag else None

    # Twitter Card Extraction

    def get_twitter_card(self, name: str) -> Optional[str]:
        """
        Extract Twitter Card meta tag.

        Args:
            name: Twitter card name (e.g., 'card', 'title')

        Returns:
            Content value or None
        """
        twitter_tag = self.soup.find('meta', attrs={'name': f'twitter:{name}'})
        return twitter_tag.get('content') if twitter_tag else None

    # Content Structure Analysis

    def get_webpage_structure(self) -> Dict[str, Any]:
        """
        Analyze webpage HTML structure.

        Returns:
            Dictionary with structure metrics
        """
        structure = {
            'h1_count': len(self.soup.find_all('h1')),
            'h2_count': len(self.soup.find_all('h2')),
            'h3_count': len(self.soup.find_all('h3')),
            'h4_count': len(self.soup.find_all('h4')),
            'h5_count': len(self.soup.find_all('h5')),
            'h6_count': len(self.soup.find_all('h6')),
            'paragraph_count': len(self.soup.find_all('p')),
            'image_count': len(self.soup.find_all('img')),
            'link_count': len(self.soup.find_all('a')),
            'form_count': len(self.soup.find_all('form')),
            'table_count': len(self.soup.find_all('table')),
            'list_count': len(self.soup.find_all(['ul', 'ol'])),
        }

        # Add heading hierarchy
        headings = []
        for level in range(1, 7):
            for heading in self.soup.find_all(f'h{level}'):
                text = heading.get_text(strip=True)
                if text:
                    headings.append({
                        'level': level,
                        'text': text[:100]  # Limit to 100 chars
                    })

        structure['heading_hierarchy'] = headings[:20]  # Limit to first 20

        return structure

    def get_schema_markup(self) -> Optional[List[Dict[str, Any]]]:
        """
        Extract JSON-LD schema markup.

        Returns:
            List of schema objects or None
        """
        schema_scripts = self.soup.find_all('script', type='application/ld+json')
        if not schema_scripts:
            return None

        schemas = []
        for script in schema_scripts:
            try:
                schema_data = json.loads(script.string)

                # Handle both single schema objects and arrays of schemas
                if isinstance(schema_data, list):
                    schemas.extend(schema_data)
                else:
                    schemas.append(schema_data)
            except (json.JSONDecodeError, TypeError, AttributeError):
                continue

        return schemas if schemas else None

    def get_heading_structure(self) -> List[Dict[str, Any]]:
        """
        Extract complete heading structure (H1-H6) in document order.

        Returns:
            List of all headings with their level and text content
        """
        headings = []

        # Find all heading tags (H1-H6) in document order
        for heading in self.soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            # Get the heading level from tag name (h1 -> 1, h2 -> 2, etc.)
            level = int(heading.name[1])
            text = heading.get_text(strip=True)

            if text:  # Only include headings with actual text
                headings.append({
                    'level': level,
                    'tag': heading.name.upper(),
                    'text': text
                })

        return headings

    # Mobile Responsiveness

    def is_mobile_responsive(self) -> bool:
        """
        Check if page appears to be mobile-responsive.

        Returns:
            True if responsive indicators found
        """
        # Check for viewport meta tag
        viewport = self.get_meta_viewport()
        if viewport and ('width=device-width' in viewport or 'initial-scale' in viewport):
            return True

        # Check for responsive CSS media queries in style tags
        style_tags = self.soup.find_all('style')
        for style in style_tags:
            if style.string and '@media' in style.string:
                return True

        # Check for responsive frameworks (Bootstrap, Tailwind classes)
        responsive_classes = ['container', 'row', 'col-', 'sm:', 'md:', 'lg:', 'xl:', 'flex', 'grid']
        html_text = str(self.soup)
        for cls in responsive_classes:
            if cls in html_text:
                return True

        return False

    # Utility Methods

    def get_all_meta_tags(self) -> List[Dict[str, str]]:
        """Get all meta tags for debugging."""
        meta_tags = self.soup.find_all('meta')
        return [
            {
                'name': tag.get('name'),
                'property': tag.get('property'),
                'content': tag.get('content'),
                'charset': tag.get('charset'),
                'http-equiv': tag.get('http-equiv'),
            }
            for tag in meta_tags
        ]

    def get_all_link_tags(self) -> List[Dict[str, str]]:
        """Get all link tags for debugging."""
        link_tags = self.soup.find_all('link')
        return [
            {
                'rel': tag.get('rel'),
                'href': tag.get('href'),
                'type': tag.get('type'),
                'hreflang': tag.get('hreflang'),
            }
            for tag in link_tags
        ]


def parse_html(html: str) -> Dict[str, Any]:
    """
    Convenience function to parse HTML and extract all metadata.

    Args:
        html: Raw HTML string

    Returns:
        Dictionary with all extracted fields
    """
    parser = HTMLParserService(html)
    return parser.extract_all()
