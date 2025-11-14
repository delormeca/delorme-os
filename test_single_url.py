"""
Test crawl for specific URL: https://mcaressources.ca/formation-equipements-a-nacelle/
Saves detailed output to markdown file.
"""
import asyncio
import sys
import json
import io
from datetime import datetime

# Fix for Windows console encoding
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    # Fix UTF-8 encoding for console
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


async def test_url():
    """Test crawl for specific URL."""
    from app.services.robust_page_crawler import RobustPageCrawler

    url = "https://mcaressources.ca/formation-equipements-a-nacelle/"

    print(f"🕷️  Starting crawl of: {url}")
    print("="*80)

    async with RobustPageCrawler() as crawler:
        result = await crawler.extract_page_data(url, max_retries=3)

    # Format output as markdown
    md_output = f"""# Crawl4AI Test Result - {url}

**Test Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## 📊 Crawl Summary

- **Success:** {result.get('success', False)}
- **Final URL:** {result.get('url', 'N/A')}
- **Status Code:** {result.get('status_code', 'N/A')}

---

## ✅ Extraction Results

### SEO Fields

"""

    # SEO fields
    seo_fields = {
        'Page Title': result.get('page_title'),
        'Meta Title': result.get('meta_title'),
        'Meta Description': result.get('meta_description'),
        'H1': result.get('h1'),
        'Canonical URL': result.get('canonical_url'),
        'Meta Robots': result.get('meta_robots'),
    }

    for field, value in seo_fields.items():
        if value:
            md_output += f"**{field}:**\n```\n{value}\n```\n\n"
        else:
            md_output += f"**{field}:** ❌ Not found\n\n"

    # Content stats
    md_output += f"""### Content Statistics

- **Word Count:** {result.get('word_count', 0)}
- **Internal Links:** {len(result.get('internal_links', []))}
- **External Links:** {len(result.get('external_links', []))}
- **Images:** {result.get('image_count', 0)}

---

## 🎯 Validation Results

"""

    validation = result.get('validation', {})
    if validation:
        md_output += f"""**Quality Score:** {validation.get('quality_score', 0)}/100

**Issues (Critical):**
{chr(10).join(f'- ❌ {issue}' for issue in validation.get('issues', [])) if validation.get('issues') else '- ✅ No critical issues'}

**Warnings:**
{chr(10).join(f'- ⚠️ {warning}' for warning in validation.get('warnings', [])) if validation.get('warnings') else '- ✅ No warnings'}

**DOM Rendering:** {'✅ Complete' if result.get('dom_rendered_completely', False) else '⚠️ May be incomplete'}

---
"""

    # Crawl metadata
    crawl_meta = result.get('crawl_metadata', {})
    if crawl_meta:
        md_output += f"""## ⚙️ Crawl Configuration

- **Timeout Used:** {crawl_meta.get('timeout_used', 'N/A')}s
- **Stealth Mode:** {'✅ Enabled' if crawl_meta.get('stealth_enabled') else '❌ Disabled'}
- **Retry Attempt:** {crawl_meta.get('retry_attempt', 0) + 1}/3
- **Wait Strategy:** {crawl_meta.get('wait_until', 'N/A')}

---
"""

    # Response headers
    headers = result.get('response_headers', {})
    if headers:
        md_output += f"""## 📨 Response Headers

```json
{json.dumps(dict(headers), indent=2)}
```

---
"""

    # Body content preview
    body = result.get('body_content', '')
    if body:
        preview = body[:500] + '...' if len(body) > 500 else body
        md_output += f"""## 📄 Body Content Preview

```
{preview}
```

**Full Length:** {len(body)} characters

---
"""

    # Hreflang
    hreflang = result.get('hreflang')
    if hreflang:
        md_output += f"""## 🌍 Hreflang Tags

```json
{hreflang}
```

---
"""

    # Schema markup
    schema = result.get('schema_markup')
    if schema:
        md_output += f"""## 🏷️ Schema Markup

```json
{json.dumps(schema, indent=2) if isinstance(schema, (dict, list)) else schema}
```

---
"""

    # Links preview
    internal_links = result.get('internal_links', [])
    external_links = result.get('external_links', [])

    if internal_links or external_links:
        md_output += f"""## 🔗 Links Found

### Internal Links ({len(internal_links)})
{chr(10).join(f'- {link}' for link in internal_links[:10])}
{f'... and {len(internal_links) - 10} more' if len(internal_links) > 10 else ''}

### External Links ({len(external_links)})
{chr(10).join(f'- {link}' for link in external_links[:10])}
{f'... and {len(external_links) - 10} more' if len(external_links) > 10 else ''}

---
"""

    # Webpage structure
    structure = result.get('webpage_structure')
    if structure:
        md_output += f"""## 🏗️ Webpage Structure

```json
{json.dumps(structure, indent=2)}
```

---
"""

    # Error info if failed
    if not result.get('success'):
        md_output += f"""## ❌ Error Information

**Error Message:**
```
{result.get('error_message', 'Unknown error')}
```

"""
        retry_info = result.get('retry_info', {})
        if retry_info:
            md_output += f"""**Retry Information:**
- Attempts: {retry_info.get('attempts', 1)}
- Error Category: {retry_info.get('error_category', 'unknown')}
- Retryable: {retry_info.get('retryable', False)}

---
"""

    # X-Robots-Tag
    x_robots = result.get('x_robots_tag')
    if x_robots:
        md_output += f"""## 🤖 X-Robots-Tag

```
{x_robots}
```

---
"""

    # Screenshot info
    screenshot = result.get('screenshot_url')
    if screenshot:
        screenshot_preview = screenshot[:100] + '...' if len(screenshot) > 100 else screenshot
        md_output += f"""## 📸 Screenshot

**Captured:** ✅ Yes (base64 data available)

**Preview:**
```
{screenshot_preview}
```

**Length:** {len(screenshot)} characters

---
"""

    # Full raw result (truncated)
    md_output += f"""## 🔍 Raw Result (Truncated)

<details>
<summary>Click to expand full result JSON</summary>

```json
{json.dumps({k: v for k, v in result.items() if k not in ['body_content', 'screenshot_url', 'screenshot_full_url']}, indent=2, default=str)[:5000]}
...
```

</details>

---

## 📝 Notes

- This crawl was performed using the RobustPageCrawler service
- Configuration: wait_until="networkidle" for full JS rendering
- Retry logic: Up to 3 attempts with intelligent error classification
- Rate limiting: Dynamic delays (1-3s) between requests

"""

    # Save to file
    output_file = "crawl_test_output.md"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md_output)

    print(f"\n✅ Output saved to: {output_file}")
    print(f"\n📊 Quick Summary:")
    print(f"   Success: {result.get('success')}")
    print(f"   Title: {result.get('page_title', 'N/A')}")
    print(f"   Quality: {validation.get('quality_score', 0)}/100")
    print(f"   Word Count: {result.get('word_count', 0)}")

    return result


if __name__ == "__main__":
    asyncio.run(test_url())
