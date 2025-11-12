# DataTable Component Suite - Usage Guide

## Overview

A comprehensive data table system with 22+ columns for displaying client pages with full SEO data. Built with TanStack Table v8 and Material-UI.

## Features

- ✅ **22+ Columns** - All SEO data points included
- ✅ **Expandable Cells** - Complex data (structure, links, entities, content, schema)
- ✅ **Column Visibility** - Toggle which columns to show/hide
- ✅ **Pagination** - Full pagination with page size selection
- ✅ **Search & Filter** - Global search + per-column filters
- ✅ **Bulk Selection** - Multi-select with bulk actions
- ✅ **Sorting** - Click column headers to sort
- ✅ **Export Ready** - Supports CSV/JSON export
- ✅ **Responsive** - Works on mobile and desktop
- ✅ **Persistent Settings** - Column visibility saved to localStorage

## Quick Start

### Basic Usage

```typescript
import { EnhancedDataTable } from '@/components/DataTable';
import { useClientPages } from '@/hooks/api/useClientPages';

function MyComponent() {
  const { data: pagesData, isLoading } = useClientPages({
    client_id: 'your-client-id',
    page: 1,
    page_size: 50,
  });

  return (
    <EnhancedDataTable
      clientId="your-client-id"
      data={pagesData?.pages || []}
      totalCount={pagesData?.total}
      isLoading={isLoading}
    />
  );
}
```

### With Export and Delete

```typescript
import { EnhancedDataTable } from '@/components/DataTable';

function MyComponent() {
  const handleExport = async (selectedIds: string[]) => {
    // Call export API
    const response = await fetch(`/api/client-pages/export?page_ids=${selectedIds.join(',')}&format=csv`);
    // Download file...
  };

  const handleDelete = async (selectedIds: string[]) => {
    if (confirm(`Delete ${selectedIds.length} pages?`)) {
      // Call delete API
      await Promise.all(selectedIds.map(id => fetch(`/api/client-pages/${id}`, { method: 'DELETE' })));
    }
  };

  return (
    <EnhancedDataTable
      clientId="your-client-id"
      data={pages}
      onExport={handleExport}
      onDelete={handleDelete}
    />
  );
}
```

## Component Props

### EnhancedDataTable

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clientId` | string | Yes | Client UUID |
| `data` | ClientPageRead[] | Yes | Array of page data |
| `totalCount` | number | No | Total count for pagination |
| `isLoading` | boolean | No | Loading state |
| `onExport` | (ids: string[]) => void | No | Export callback |
| `onDelete` | (ids: string[]) => void | No | Delete callback |

## Column Definitions

All 22 columns are defined with appropriate renderers:

### Basic Columns
1. **Checkbox** - Selection (always visible)
2. **URL** - Full page URL with tooltip
3. **Slug** - URL path
4. **Page Status** - HTTP status with color chips
5. **Screenshot** - Thumbnail or placeholder
6. **Page Title** - HTML title tag
7. **Meta Title** - SEO meta title
8. **Meta Description** - Truncated description
9. **H1** - Main heading
11. **Canonical URL** - Canonical link
12. **Hreflang** - Language tags
14. **Word Count** - Formatted number
15. **Meta Robots** - Robots directives
17. **Image Count** - Number of images
22. **Last Crawled** - Formatted timestamp

### Expandable Columns
10. **Webpage Structure** - Heading hierarchy (expandable)
13. **Schema Markup** - JSON schema (expandable)
16. **Internal Links** - Links list (expandable)
18. **External Links** - Links list (expandable)
19. **Body Content** - Full text (expandable, hidden by default)
20. **Embedding** - Vector data (hidden by default)
21. **Salient Entities** - Entities with salience (expandable)

## Column Visibility Settings

Users can:
- Toggle individual columns on/off
- Select All / Deselect All
- Reset to Default
- Settings persist to localStorage

**Default Hidden Columns:**
- `body_content` - Too large for table view
- `body_content_embedding` - Technical/vector data

## Pagination

**Features:**
- Page size selector: 20, 50, 100, 250, 500 rows
- Page navigation with ellipsis
- First/Last page buttons
- Shows "X-Y of Z" count

**Keyboard Navigation:**
- Arrow keys to navigate pages (when focused)
- Ctrl/Cmd + Left/Right for first/last page

## Search and Filtering

### Global Search
- Searches across multiple fields
- 300ms debounce for performance
- Clear button

### Column Filters
- **Status Filter** - Dropdown for HTTP codes
- **Word Count Range** - Min/max inputs
- Active filters indicator
- Clear all filters button

## Bulk Actions

When rows are selected:
- Shows selection count
- "Select all X pages" for cross-page selection
- Export button (if handler provided)
- Delete button (if handler provided)
- Clear selection button

## Expandable Cells

### Webpage Structure
```typescript
<WebpageStructureCell structure={data.webpage_structure} />
```
Displays heading hierarchy:
```
<H1> Main Title
  <H2> Section 1
  <H2> Section 2
    <H3> Subsection
```

### Links (Internal/External)
```typescript
<LinksCell links={data.internal_links} linkType="internal" />
```
Shows:
- Link count preview
- Anchor text
- Target URL (clickable)

### Salient Entities
```typescript
<SalientEntitiesCell entities={data.salient_entities} />
```
Displays:
- Entity name
- Entity type (PERSON, ORG, etc.)
- Salience score (%)
- Wikipedia link (if available)

### Body Content
```typescript
<BodyContentCell content={data.body_content} />
```
Shows:
- Truncated preview (100 chars)
- Full text in scrollable container

### Schema Markup
```typescript
<SchemaCell schema={data.schema_markup} />
```
Displays:
- "Schema present" indicator
- Formatted JSON with syntax highlighting

## Styling Customization

### Theme Integration
The table uses MUI theme tokens:
```typescript
sx={{
  bgcolor: theme.palette.grey[100],
  color: theme.palette.primary.main,
  '&:hover': {
    bgcolor: alpha(theme.palette.primary.main, 0.08),
  },
}}
```

### Custom Column Widths
Defined in column definitions:
```typescript
{
  id: 'url',
  size: 300,  // Width in pixels
}
```

## Performance Considerations

### Client-Side Pagination
- Default page size: 50 rows
- Filters all data in memory
- Good for <10k rows

### Server-Side Pagination (Recommended for Production)
For large datasets, implement server-side:
1. Move filtering/sorting to API
2. Pass page/filter params to backend
3. Backend returns paginated results

### Virtualization
For very large datasets (25k+ rows), consider:
```bash
npm install @tanstack/react-virtual
```

## Accessibility

- ✅ Keyboard navigation
- ✅ Screen reader labels
- ✅ ARIA attributes
- ✅ Focus indicators
- ✅ Semantic HTML

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported

## Troubleshooting

### Data not showing
**Check:**
1. Data array is not empty
2. Column visibility settings
3. Filters not excluding all data
4. Browser console for errors

### Export not working
**Ensure:**
1. `onExport` handler is provided
2. API endpoint is accessible
3. Page IDs are valid UUIDs

### Columns not persisting
**Check:**
1. localStorage is enabled
2. Browser privacy settings
3. Console for errors

## Examples

### Complete Implementation

See: `frontend/src/components/Clients/EnhancedClientPagesList.tsx` (to be created)

### Export Handler Example

```typescript
const handleExport = async (selectedIds: string[]) => {
  const params = new URLSearchParams({
    client_id: clientId,
    format: 'csv',
    page_ids: selectedIds.join(','),
    columns: 'url,page_title,meta_title,word_count',
  });

  const response = await fetch(`/api/client-pages/export?${params}`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pages-export-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
```

## API Integration

### Fetch Pages
```typescript
GET /api/client-pages?client_id={id}&page=1&page_size=50
```

### Export Pages
```typescript
GET /api/client-pages/export?client_id={id}&format=csv&page_ids={ids}
```

### Delete Page
```typescript
DELETE /api/client-pages/{page_id}
```

## Future Enhancements

Potential improvements:
- [ ] Column reordering (drag & drop)
- [ ] Column resizing
- [ ] Row details drawer
- [ ] Inline editing
- [ ] Column pinning
- [ ] Advanced filters (multi-select, date ranges)
- [ ] Export to Excel
- [ ] Print view
- [ ] Saved filter presets

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review API documentation
3. Check browser console for errors
4. Verify data format matches `ClientPageRead` schema

---

**Last Updated**: 2025-11-06
**Version**: 1.0.0
**Dependencies**: @tanstack/react-table@^8, @mui/material@^6
