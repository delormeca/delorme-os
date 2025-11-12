# Heading Structure Data Point - Feature Documentation

## Overview

Added a new data point that extracts the complete heading hierarchy (H1-H6) from web pages in document order. This provides a structured view of the page's content organization.

## Data Point Details

- **ID**: `dp_heading_structure`
- **Name**: Heading Structure
- **Category**: CONTENT
- **Data Type**: JSON (Array of heading objects)
- **Crawl4AI Field**: `heading_structure`
- **Status**: ✅ EXTRACTED
- **Display Order**: 7

## Data Structure

Each heading in the array contains:
```json
{
  "level": 1-6,           // Heading level (1=H1, 2=H2, etc.)
  "tag": "H1"-"H6",       // HTML tag name
  "text": "Heading text"  // Text content of the heading
}
```

## Example Output

From the test page (LaSalle College Vancouver), we extracted **15 headings**:

```
  1. <H1> Accounting and Bookkeeping
  2.   <H2> Overview
  3.   <H2> About the Program
  4.   <H2> Opportunities
  5.     <H3> Real-World Tools & Industry-Focused Learning
  6.   <H2> Admissions Criteria
  7.       <H4> Domestic applicants generally require:
  8.       <H4> International applicants generally require:
  9.   <H2> List of Courses
 10.   <H2> Tuition & Aid
 11.   <H2> Your Dream Future, Within Reach
 12.     <H3> Budget Friendly. Future Ready.
 13.   <H2> You May Also Like
 14.   <H2> Open House | LaSalle College Vancouver
 15.     <H3> Open House & Creative Workshops
```

### Summary by Level
- **H1**: 1 heading
- **H2**: 9 headings
- **H3**: 3 headings
- **H4**: 2 headings
- **Total**: 15 headings

## JSON Format Example

```json
[
  {
    "level": 1,
    "tag": "H1",
    "text": "Accounting and Bookkeeping"
  },
  {
    "level": 2,
    "tag": "H2",
    "text": "Overview"
  },
  {
    "level": 2,
    "tag": "H2",
    "text": "About the Program"
  },
  {
    "level": 3,
    "tag": "H3",
    "text": "Real-World Tools & Industry-Focused Learning"
  }
]
```

## Implementation

### 1. Database Seed Script
**File**: `app/commands/seed_heading_structure_datapoint.py`

Adds the data point to the `data_point_definition` table.

### 2. HTML Parser Method
**File**: `app/services/html_parser_service.py`

```python
def get_heading_structure(self) -> List[Dict[str, Any]]:
    """
    Extract complete heading structure (H1-H6) in document order.

    Returns:
        List of all headings with their level and text content
    """
    headings = []

    # Find all heading tags (H1-H6) in document order
    for heading in self.soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
        level = int(heading.name[1])
        text = heading.get_text(strip=True)

        if text:  # Only include headings with actual text
            headings.append({
                'level': level,
                'tag': heading.name.upper(),
                'text': text
            })

    return headings
```

### 3. Integration
The method is automatically called in `extract_all()` and the result is returned as `heading_structure` field.

## Use Cases

### SEO Analysis
- Verify proper heading hierarchy (single H1, logical H2/H3 structure)
- Check for heading gaps (e.g., H1 → H3 without H2)
- Analyze keyword placement in headings

### Content Auditing
- Generate table of contents
- Analyze content structure and organization
- Compare heading structure across pages

### Accessibility Compliance
- Verify semantic heading structure
- Check for proper heading nesting
- Ensure screen reader compatibility

### Content Migration
- Preserve heading hierarchy when migrating content
- Map old heading structure to new templates
- Validate heading structure after migration

## Coverage Impact

**Before**: 23/44 data points (52.3% coverage)
**After**: 24/45 data points (53.3% coverage)
**Improvement**: +1 data point, +1.0% coverage

## Testing

### Test Script
**File**: `test_heading_structure.py`

Run test:
```bash
cd velocity-boilerplate
poetry run python test_heading_structure.py
```

### Test Output
Shows:
- Total headings found
- Complete heading hierarchy with indentation
- Summary by heading level (H1-H6 counts)

## Database Record

```sql
SELECT * FROM data_point_definition WHERE id = 'dp_heading_structure';
```

**Result**:
- `id`: dp_heading_structure
- `name`: Heading Structure
- `category`: CONTENT
- `data_type`: JSON
- `crawl4ai_field`: heading_structure
- `display_order`: 7
- `is_active`: true
- `icon`: format_list_numbered
- `color`: #9C27B0

## Differences from webpage_structure

The existing `webpage_structure` data point includes:
- **Heading counts** (h1_count, h2_count, etc.)
- **First 20 headings** with level and text (truncated to 100 chars)
- **Other element counts** (paragraphs, links, images, etc.)

The new `heading_structure` data point:
- **ALL headings** (no limit)
- **Complete text** (not truncated)
- **Document order** (exact sequence as they appear)
- **Includes tag name** (H1, H2, etc.)
- **Dedicated data point** (not buried in larger structure)

## Notes

- Only extracts headings with actual text content (empty headings are skipped)
- Preserves exact document order (as they appear in HTML)
- No text truncation (full heading text included)
- No limit on number of headings extracted
- Works with all heading levels (H1-H6)

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `app/commands/seed_heading_structure_datapoint.py` | Created | Seed script for data point |
| `app/services/html_parser_service.py` | Modified | Added `get_heading_structure()` method |
| `test_heading_structure.py` | Created | Test script for heading extraction |
| `HEADING_STRUCTURE_FEATURE.md` | Created | This documentation |

---

**Created**: 2025-01-11
**Coverage**: 53.3% (24/45 data points)
**Status**: ✅ Complete and tested
