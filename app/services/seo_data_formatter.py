"""
SEO Data Formatter - Makes extraction data visually appealing for frontend display.

Provides formatted output for UI while keeping raw JSON available for webhooks/n8n.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import json


class SEODataFormatter:
    """Formats SEO extraction data for visual display."""

    @staticmethod
    def format_for_display(extraction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format extraction data for beautiful frontend display.

        Returns both formatted HTML/text and raw JSON for webhooks.

        Args:
            extraction_data: Raw extraction result from crawler

        Returns:
            Dictionary with:
            - display: Human-readable formatted data
            - raw: Original JSON (for webhooks/n8n)
            - summary: Quick stats
        """
        # Extract key fields
        url = extraction_data.get('url', 'N/A')
        success = extraction_data.get('success', False)

        # Build formatted output
        formatted = {
            # Visual display data (for frontend)
            'display': {
                'overview': SEODataFormatter._format_overview(extraction_data),
                'seo_fields': SEODataFormatter._format_seo_fields(extraction_data),
                'content_analysis': SEODataFormatter._format_content_analysis(extraction_data),
                'technical': SEODataFormatter._format_technical(extraction_data),
                'structure': SEODataFormatter._format_structure(extraction_data),
                'validation': SEODataFormatter._format_validation(extraction_data),
                'links': SEODataFormatter._format_links(extraction_data),
            },

            # Summary stats (for dashboard cards)
            'summary': SEODataFormatter._create_summary(extraction_data),

            # Raw JSON (for webhooks/n8n integration)
            'raw': extraction_data,

            # Metadata
            'formatted_at': datetime.utcnow().isoformat(),
            'url': url,
            'success': success,
        }

        return formatted

    @staticmethod
    def _format_overview(data: Dict[str, Any]) -> Dict[str, Any]:
        """Format overview section."""
        validation = data.get('validation', {})

        return {
            'url': data.get('url', 'N/A'),
            'status_code': data.get('status_code', 'N/A'),
            'quality_score': {
                'value': validation.get('quality_score', 0),
                'label': SEODataFormatter._get_quality_label(validation.get('quality_score', 0)),
                'color': SEODataFormatter._get_quality_color(validation.get('quality_score', 0)),
            },
            'crawl_time': data.get('crawl_metadata', {}).get('timeout_used', 'N/A'),
            'retry_attempt': data.get('crawl_metadata', {}).get('retry_attempt', 0) + 1,
        }

    @staticmethod
    def _format_seo_fields(data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Format SEO fields as card items."""
        fields = [
            {
                'name': 'Page Title',
                'value': data.get('page_title'),
                'icon': '📝',
                'critical': True,
                'character_count': len(data.get('page_title', '')),
                'recommendation': '50-60 characters ideal' if data.get('page_title') else 'Missing title tag',
            },
            {
                'name': 'Meta Description',
                'value': data.get('meta_description'),
                'icon': '📄',
                'critical': True,
                'character_count': len(data.get('meta_description', '')),
                'recommendation': '150-160 characters ideal' if data.get('meta_description') else 'Missing meta description',
            },
            {
                'name': 'H1 Heading',
                'value': data.get('h1'),
                'icon': '📌',
                'critical': True,
                'character_count': len(data.get('h1', '')),
                'recommendation': 'Should be unique and descriptive' if data.get('h1') else 'Missing H1 tag',
            },
            {
                'name': 'Canonical URL',
                'value': data.get('canonical_url'),
                'icon': '🔗',
                'critical': False,
                'matches_url': data.get('canonical_url') == data.get('url'),
            },
            {
                'name': 'Meta Robots',
                'value': data.get('meta_robots'),
                'icon': '🤖',
                'critical': False,
                'indexable': 'noindex' not in (data.get('meta_robots') or '').lower(),
            },
        ]

        # Add X-Robots-Tag if present
        if data.get('x_robots_tag'):
            fields.append({
                'name': 'X-Robots-Tag',
                'value': data.get('x_robots_tag'),
                'icon': '🚫',
                'critical': False,
                'note': 'HTTP header directive',
            })

        return fields

    @staticmethod
    def _format_content_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
        """Format content analysis."""
        word_count = data.get('word_count', 0)

        return {
            'word_count': {
                'value': word_count,
                'label': SEODataFormatter._get_content_label(word_count),
                'color': SEODataFormatter._get_content_color(word_count),
                'recommendation': 'Good length' if word_count >= 300 else 'Consider adding more content',
            },
            'images': {
                'count': data.get('image_count', 0),
                'note': 'Visual content found',
            },
            'readability': {
                'estimated_read_time': f"{max(1, word_count // 200)} min",
                'paragraph_count': data.get('webpage_structure', {}).get('paragraph_count', 0),
            },
        }

    @staticmethod
    def _format_technical(data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Format technical details."""
        technical = []

        # Language
        lang = data.get('lang')
        if lang:
            technical.append({
                'label': 'Language',
                'value': lang,
                'icon': '🌍',
            })

        # Charset
        charset = data.get('charset')
        if charset:
            technical.append({
                'label': 'Character Encoding',
                'value': charset,
                'icon': '💻',
            })

        # Viewport (mobile responsive)
        is_responsive = data.get('is_mobile_responsive', False)
        technical.append({
            'label': 'Mobile Responsive',
            'value': 'Yes' if is_responsive else 'No',
            'icon': '📱' if is_responsive else '⚠️',
            'status': 'good' if is_responsive else 'warning',
        })

        # DOM rendering
        dom_complete = data.get('dom_rendered_completely', False)
        technical.append({
            'label': 'DOM Rendering',
            'value': 'Complete' if dom_complete else 'Incomplete',
            'icon': '✅' if dom_complete else '⚠️',
            'status': 'good' if dom_complete else 'warning',
        })

        return technical

    @staticmethod
    def _format_structure(data: Dict[str, Any]) -> Dict[str, Any]:
        """Format page structure."""
        structure = data.get('webpage_structure', {})

        return {
            'elements': [
                {'name': 'Headings', 'count': structure.get('heading_count', 0), 'icon': '📋'},
                {'name': 'Paragraphs', 'count': structure.get('paragraph_count', 0), 'icon': '📝'},
                {'name': 'Links', 'count': structure.get('link_count', 0), 'icon': '🔗'},
                {'name': 'Images', 'count': structure.get('image_count', 0), 'icon': '🖼️'},
                {'name': 'Forms', 'count': structure.get('form_count', 0), 'icon': '📋'},
                {'name': 'Tables', 'count': structure.get('table_count', 0), 'icon': '📊'},
                {'name': 'Lists', 'count': structure.get('list_count', 0), 'icon': '📌'},
            ],
            'heading_hierarchy': structure.get('heading_hierarchy', [])[:10],  # First 10 for display
            'schema_markup': {
                'present': data.get('schema_markup') is not None,
                'count': len(data.get('schema_markup', [])) if data.get('schema_markup') else 0,
            },
        }

    @staticmethod
    def _format_validation(data: Dict[str, Any]) -> Dict[str, Any]:
        """Format validation results."""
        validation = data.get('validation', {})

        return {
            'quality_score': validation.get('quality_score', 0),
            'has_issues': validation.get('has_issues', False),
            'issues': [
                {
                    'type': issue,
                    'severity': 'critical',
                    'icon': '❌',
                    'message': SEODataFormatter._get_issue_message(issue),
                }
                for issue in validation.get('issues', [])
            ],
            'warnings': [
                {
                    'type': warning,
                    'severity': 'warning',
                    'icon': '⚠️',
                    'message': SEODataFormatter._get_warning_message(warning),
                }
                for warning in validation.get('warnings', [])
            ],
        }

    @staticmethod
    def _format_links(data: Dict[str, Any]) -> Dict[str, Any]:
        """Format links summary."""
        internal = data.get('internal_links', [])
        external = data.get('external_links', [])

        return {
            'internal': {
                'count': len(internal),
                'preview': [link.get('href', '') for link in internal[:5]],  # First 5
            },
            'external': {
                'count': len(external),
                'preview': [link.get('href', '') for link in external[:5]],  # First 5
            },
            'ratio': {
                'internal': len(internal),
                'external': len(external),
                'total': len(internal) + len(external),
            },
        }

    @staticmethod
    def _create_summary(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create quick summary stats for dashboard cards."""
        validation = data.get('validation', {})
        structure = data.get('webpage_structure', {})

        return {
            'quality_score': validation.get('quality_score', 0),
            'word_count': data.get('word_count', 0),
            'heading_count': structure.get('heading_count', 0),
            'image_count': data.get('image_count', 0),
            'link_count': structure.get('link_count', 0),
            'issues_count': len(validation.get('issues', [])),
            'warnings_count': len(validation.get('warnings', [])),
            'has_schema': data.get('schema_markup') is not None,
            'is_indexable': 'noindex' not in (data.get('meta_robots') or '').lower(),
        }

    # Helper methods for labels and colors

    @staticmethod
    def _get_quality_label(score: int) -> str:
        """Get quality label from score."""
        if score >= 90:
            return 'Excellent'
        elif score >= 75:
            return 'Good'
        elif score >= 50:
            return 'Fair'
        else:
            return 'Poor'

    @staticmethod
    def _get_quality_color(score: int) -> str:
        """Get color code for quality score."""
        if score >= 90:
            return 'success'  # Green
        elif score >= 75:
            return 'info'  # Blue
        elif score >= 50:
            return 'warning'  # Yellow
        else:
            return 'error'  # Red

    @staticmethod
    def _get_content_label(word_count: int) -> str:
        """Get content length label."""
        if word_count >= 1000:
            return 'Long-form'
        elif word_count >= 300:
            return 'Standard'
        elif word_count >= 100:
            return 'Short'
        else:
            return 'Thin'

    @staticmethod
    def _get_content_color(word_count: int) -> str:
        """Get color for content length."""
        if word_count >= 300:
            return 'success'
        elif word_count >= 100:
            return 'warning'
        else:
            return 'error'

    @staticmethod
    def _get_issue_message(issue_type: str) -> str:
        """Get human-readable message for issue."""
        messages = {
            'missing_title': 'Page is missing a title tag - critical for SEO',
            'missing_meta_description': 'Meta description is missing',
            'missing_h1': 'Page has no H1 heading',
            'thin_content': 'Content is too short (< 50 words)',
            'canonical_differs': 'Canonical URL points to a different page',
        }
        return messages.get(issue_type, issue_type.replace('_', ' ').title())

    @staticmethod
    def _get_warning_message(warning_type: str) -> str:
        """Get human-readable message for warning."""
        messages = {
            'missing_meta_description': 'Consider adding a meta description for better CTR',
            'missing_h1': 'Add an H1 heading for better content structure',
            'thin_content': 'Consider expanding content to at least 300 words',
            'canonical_differs': 'Canonical URL differs - may indicate duplicate content',
        }
        return messages.get(warning_type, warning_type.replace('_', ' ').title())


def format_seo_data(extraction_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to format SEO data.

    Args:
        extraction_data: Raw extraction result

    Returns:
        Formatted data with display, summary, and raw sections
    """
    return SEODataFormatter.format_for_display(extraction_data)
