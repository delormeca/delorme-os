# Enhanced Crawler Table Features - Technical Specification

**Status**: Design Phase
**Target Component**: `EnhancedCrawlResultsTable`
**Inspired By**: Screaming Frog SEO Spider v22, Airtable, Notion

---

## 1. Column Management System

### 1.1 Overview
Allow users to show/hide columns, reorder them, and save preferences per client or globally.

### 1.2 Features
- **Hide/Show Columns**: Toggle visibility of any column except URL (primary field)
- **Reorder Columns**: Drag-and-drop column headers to reorder
- **Bulk Operations**: "Show All" / "Hide All" buttons
- **Persistent State**: Save preferences to localStorage or backend
- **Reset to Default**: Restore original column configuration
- **Export Compliance**: Hidden columns excluded from CSV exports

### 1.3 Default Columns
```typescript
interface ColumnDefinition {
  id: string;
  label: string;
  minWidth: number;
  isPrimary: boolean;      // URL column cannot be hidden
  defaultVisible: boolean;
  dataKey: keyof EnhancedCrawlPageData;
}

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'url', label: 'URL', minWidth: 300, isPrimary: true, defaultVisible: true, dataKey: 'url' },
  { id: 'h1', label: 'H1', minWidth: 200, isPrimary: false, defaultVisible: true, dataKey: 'h1' },
  { id: 'meta_title', label: 'META-TITLE', minWidth: 200, isPrimary: false, defaultVisible: true, dataKey: 'meta_title' },
  { id: 'meta_description', label: 'Meta-desc', minWidth: 200, isPrimary: false, defaultVisible: true, dataKey: 'meta_description' },
  { id: 'word_count', label: 'Word Count', minWidth: 150, isPrimary: false, defaultVisible: true, dataKey: 'word_count' },
  { id: 'image_count', label: 'Images', minWidth: 120, isPrimary: false, defaultVisible: true, dataKey: 'image_count' },
  { id: 'internal_link_count', label: 'Links (I)', minWidth: 120, isPrimary: false, defaultVisible: true, dataKey: 'internal_link_count' },
  { id: 'external_link_count', label: 'Links (E)', minWidth: 120, isPrimary: false, defaultVisible: true, dataKey: 'external_link_count' },
  { id: 'status_code', label: 'Status', minWidth: 120, isPrimary: false, defaultVisible: true, dataKey: 'status_code' },
];
```

### 1.4 State Management
```typescript
interface ColumnPreferences {
  clientId: string;
  visibleColumns: string[];  // Array of column IDs
  columnOrder: string[];     // Ordered array of column IDs
  updatedAt: string;
}
```

### 1.5 UI Component: ColumnManagementModal
**Location**: `frontend/src/components/EnhancedCrawler/ColumnManagementModal.tsx`

**Features**:
- Checkbox list with drag-and-drop reordering
- "Show All" / "Hide All" buttons
- "Reset to Default" button
- Live preview of changes
- Save/Cancel buttons

**Wireframe**:
```
┌─────────────────────────────────────────┐
│  Manage Columns                    [X]  │
├─────────────────────────────────────────┤
│  [Show All] [Hide All] [Reset Default]  │
│                                          │
│  ☑ URL (cannot hide)                    │
│  ☑ H1                           [≡]     │
│  ☑ META-TITLE                   [≡]     │
│  ☐ Meta-desc                    [≡]     │
│  ☑ Word Count                   [≡]     │
│  ☑ Images                       [≡]     │
│  ☑ Links (I)                    [≡]     │
│  ☑ Links (E)                    [≡]     │
│  ☑ Status                       [≡]     │
│                                          │
│         [Cancel]  [Apply Changes]        │
└─────────────────────────────────────────┘
```

### 1.6 Persistence Strategy
**Option 1 (Phase 1)**: LocalStorage per client
```typescript
// Key: `enhanced-table-columns-${clientId}`
// Value: ColumnPreferences JSON
```

**Option 2 (Phase 2)**: Backend API
```python
# New endpoint: GET/POST /api/clients/{client_id}/table-preferences
# Store in database table: user_table_preferences
```

---

## 2. Tag Management System

### 2.1 Overview
Allow users to add tags to URLs for categorization, filtering, and organization.

### 2.2 Database Schema

**New Models** (`app/models.py`):
```python
class ClientPageTag(SQLModel, table=True):
    """Tags for categorizing client pages"""
    __tablename__ = "client_page_tags"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    client_id: uuid.UUID = Field(foreign_key="clients.id", index=True)
    name: str = Field(max_length=50, index=True)  # e.g., "Homepage", "Product Page", "Blog"
    color: str = Field(default="#3b82f6")  # Hex color for UI display
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: uuid.UUID = Field(foreign_key="users.id")

    # Relationships
    client: "Client" = Relationship(back_populates="page_tags")
    page_tag_associations: List["ClientPageTagAssociation"] = Relationship(back_populates="tag")


class ClientPageTagAssociation(SQLModel, table=True):
    """Many-to-many relationship between pages and tags"""
    __tablename__ = "client_page_tag_associations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    client_page_id: uuid.UUID = Field(foreign_key="client_pages.id", index=True)
    tag_id: uuid.UUID = Field(foreign_key="client_page_tags.id", index=True)
    tagged_at: datetime = Field(default_factory=datetime.utcnow)
    tagged_by: uuid.UUID = Field(foreign_key="users.id")

    # Relationships
    page: "ClientPage" = Relationship(back_populates="tag_associations")
    tag: "ClientPageTag" = Relationship(back_populates="page_tag_associations")
```

**Update Existing Models**:
```python
# In Client model:
page_tags: List["ClientPageTag"] = Relationship(back_populates="client")

# In ClientPage model:
tag_associations: List["ClientPageTagAssociation"] = Relationship(back_populates="page")
```

### 2.3 Backend API Endpoints

**New Controller** (`app/controllers/client_page_tags.py`):
```python
# Tag CRUD
GET    /api/clients/{client_id}/tags              # List all tags for client
POST   /api/clients/{client_id}/tags              # Create new tag
PUT    /api/clients/{client_id}/tags/{tag_id}     # Update tag (name, color)
DELETE /api/clients/{client_id}/tags/{tag_id}     # Delete tag (and all associations)

# Tag Associations
POST   /api/clients/{client_id}/pages/tags        # Add tags to pages (bulk operation)
DELETE /api/clients/{client_id}/pages/tags        # Remove tags from pages (bulk operation)
GET    /api/clients/{client_id}/pages/{page_id}/tags  # Get tags for specific page
```

**Request/Response Schemas** (`app/schemas/client_page_tags.py`):
```python
class ClientPageTagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(default="#3b82f6", pattern=r'^#[0-9A-Fa-f]{6}$')

class ClientPageTagRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    name: str
    color: str
    created_at: datetime
    usage_count: int  # Number of pages with this tag

class ClientPageTagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')

class BulkTagOperationRequest(BaseModel):
    page_ids: List[uuid.UUID] = Field(..., min_items=1)
    tag_ids: List[uuid.UUID] = Field(..., min_items=1)
```

### 2.4 Update EnhancedCrawlPageData Schema
```python
class EnhancedCrawlPageData(BaseModel):
    id: str
    url: str
    h1: EnhancedDatapoint
    meta_title: EnhancedDatapoint
    meta_description: EnhancedDatapoint
    word_count: EnhancedDatapoint
    image_count: EnhancedDatapoint
    internal_link_count: EnhancedDatapoint
    external_link_count: EnhancedDatapoint
    status_code: EnhancedDatapoint
    tags: List[ClientPageTagRead] = []  # NEW: Tags associated with this page
```

### 2.5 Frontend UI Components

**TagManagementModal** (`frontend/src/components/EnhancedCrawler/TagManagementModal.tsx`):
- Create new tags with color picker
- Edit existing tags
- Delete tags
- View tag usage count

**BulkTaggingDialog** (`frontend/src/components/EnhancedCrawler/BulkTaggingDialog.tsx`):
- Opens when "Manage tags" toolbar button clicked with rows selected
- Add/remove tags from selected pages
- Shows current tags on selected pages

**TagChip** (`frontend/src/components/EnhancedCrawler/TagChip.tsx`):
- Display tags in table cells
- Click to filter by tag
- Hover to show tag actions

**TagFilter** (Added to toolbar):
- Multi-select dropdown for filtering by tags
- "No tags" option
- Clear filters button

**Wireframe - Tag Column**:
```
┌─────────────────────────────────────┐
│ URL            │ Tags               │
├─────────────────────────────────────┤
│ /              │ [Homepage] [Core]  │
│ /about         │ [Core]             │
│ /products/xyz  │ [Product] [Review] │
│ /blog/post-1   │ [Blog] [SEO]       │
└─────────────────────────────────────┘
```

### 2.6 Tag Filtering Logic
When user selects tags from filter dropdown:
- Update `useEnhancedCrawlResults` hook to accept `tag_ids` parameter
- Backend filters results: `WHERE page.tag_associations.tag_id IN (tag_ids)`
- Support "AND" logic (page must have ALL selected tags) or "OR" logic (page has ANY selected tag)

---

## 3. Saved Views System

### 3.1 Overview
Allow users to save and load complete table configurations including columns, filters, sorts, and tags.

### 3.2 Database Schema

**New Model** (`app/models.py`):
```python
class ClientTableView(SQLModel, table=True):
    """Saved table views for client crawler"""
    __tablename__ = "client_table_views"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    client_id: uuid.UUID = Field(foreign_key="clients.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    name: str = Field(max_length=100)  # e.g., "SEO Overview", "Technical Issues"
    description: Optional[str] = None
    is_default: bool = Field(default=False)
    is_shared: bool = Field(default=False)  # Share with all users of this client

    # View Configuration (JSON)
    config: dict = Field(sa_column=Column(JSON))  # Contains columns, filters, sorts, etc.

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    client: "Client" = Relationship(back_populates="table_views")
    user: "User" = Relationship()
```

### 3.3 View Configuration Schema
```typescript
interface TableViewConfig {
  // Column settings
  visibleColumns: string[];
  columnOrder: string[];

  // Filters
  searchQuery: string;
  selectedTags: string[];  // Tag IDs
  statusCodeFilter?: number[];

  // Sorting (future enhancement)
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';

  // Pagination
  rowsPerPage: number;
}
```

### 3.4 Backend API Endpoints

**New Controller** (`app/controllers/client_table_views.py`):
```python
GET    /api/clients/{client_id}/views              # List all views (user's + shared)
POST   /api/clients/{client_id}/views              # Create new view
PUT    /api/clients/{client_id}/views/{view_id}    # Update view
DELETE /api/clients/{client_id}/views/{view_id}    # Delete view
POST   /api/clients/{client_id}/views/{view_id}/apply  # Apply view (returns config)
```

**Request/Response Schemas**:
```python
class ClientTableViewCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_default: bool = False
    is_shared: bool = False
    config: dict

class ClientTableViewRead(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str]
    is_default: bool
    is_shared: bool
    config: dict
    created_at: datetime
    updated_at: datetime
```

### 3.5 Frontend UI Components

**ViewSelector** (Dropdown in toolbar):
- Shows list of saved views
- "Save Current View" option
- "Manage Views" option
- Star icon for default view

**SaveViewDialog**:
- Input view name
- Input description (optional)
- Toggle "Set as default"
- Toggle "Share with team"
- Save button

**ManageViewsDialog**:
- List all views (user's + shared)
- Edit/Delete/Duplicate actions
- Set default
- Share/unshare

**Wireframe - View Selector**:
```
┌────────────────────────────────┐
│ Quick Views ▼                  │
├────────────────────────────────┤
│ ★ SEO Overview                 │
│   Technical Issues             │
│   Content Audit                │
│   Images & Media               │
├────────────────────────────────┤
│ + Save Current View            │
│ ⚙ Manage Views                 │
└────────────────────────────────┘
```

### 3.6 Default Views
Create 4 default views programmatically for all new clients:

1. **SEO Overview**:
   - Columns: URL, H1, META-TITLE, Meta-desc, Word Count, Status
   - Filter: Status 200 only

2. **Technical Issues**:
   - Columns: URL, Status, Images, Links (I/E)
   - Filter: Status 4xx, 5xx, or 0

3. **Content Audit**:
   - Columns: URL, H1, META-TITLE, Meta-desc, Word Count
   - Filter: None

4. **Images & Media**:
   - Columns: URL, Images, Word Count, Status
   - Filter: Image Count > 0

---

## 4. Implementation Plan

### Phase 1: Column Management (3-4 hours)
1. Create `ColumnManagementModal` component
2. Add column state management to `EnhancedCrawlResultsTable`
3. Implement localStorage persistence
4. Add "Manage columns" button to toolbar
5. Test column show/hide, reorder, reset

### Phase 2: Tag Management Backend (4-5 hours)
1. Create database migrations for `ClientPageTag` and `ClientPageTagAssociation`
2. Implement `ClientPageTagService` with CRUD operations
3. Create `client_page_tags.py` controller with all endpoints
4. Create Pydantic schemas
5. Update `get_enhanced_crawl_results` to include tags
6. Run `task frontend:generate-client`

### Phase 3: Tag Management Frontend (3-4 hours)
1. Create `TagManagementModal` component
2. Create `BulkTaggingDialog` component
3. Create `TagChip` component
4. Add tags column to table
5. Add tag filter to toolbar
6. Implement tag-based filtering

### Phase 4: Saved Views Backend (3-4 hours)
1. Create database migration for `ClientTableView`
2. Implement `ClientTableViewService`
3. Create `client_table_views.py` controller
4. Create Pydantic schemas
5. Add default views creation on client creation
6. Run `task frontend:generate-client`

### Phase 5: Saved Views Frontend (3-4 hours)
1. Create `ViewSelector` component
2. Create `SaveViewDialog` component
3. Create `ManageViewsDialog` component
4. Integrate view state management
5. Implement apply view logic
6. Test view save/load/delete

### Phase 6: Integration Testing (2-3 hours)
1. Test all features on Digitad client
2. Test bulk operations with 496 pages
3. Test persistence across page refreshes
4. Test export with hidden columns
5. Playwright end-to-end tests

---

## 5. Technical Considerations

### 5.1 Performance
- **Column Visibility**: No backend changes needed, pure frontend optimization
- **Tag Filtering**: Backend query optimization with proper indexes on `tag_id` and `client_page_id`
- **Views**: Stored as JSON config, minimal storage overhead

### 5.2 Data Migration
- Add migrations for new tables
- Backfill default views for existing clients
- No migration needed for existing `client_pages` table

### 5.3 Permissions
- Users can only create/edit their own views (unless shared)
- Shared views visible to all users with access to client
- Deleting tags removes all tag associations
- Deleting client cascades to tags and views

### 5.4 Export Compliance
When exporting to CSV:
- Only export visible columns
- Include tags in export if tags column visible
- Respect current filters (tags, search, status)
- Add view name to export filename

---

## 6. Future Enhancements

1. **Advanced Filtering**:
   - Regex search
   - Status code ranges
   - Word count ranges
   - Multiple search terms

2. **Sorting**:
   - Sort by any column
   - Multi-column sort
   - Save sort preferences in views

3. **Column Freezing**:
   - Freeze URL column (always visible on scroll)
   - Freeze first N columns

4. **Grouping**:
   - Group by tags
   - Group by status code
   - Group by folder structure (URL segments)

5. **Bulk Actions**:
   - Bulk edit meta titles/descriptions
   - Bulk export selected rows
   - Bulk delete pages

6. **View Templates**:
   - Import/export views
   - Share views across clients
   - Community view library

---

## 7. Success Metrics

- ✅ Users can hide/show columns and preferences persist
- ✅ Users can create/apply tags to categorize pages
- ✅ Users can filter table by tags
- ✅ Users can save and load table configurations
- ✅ All features work with 496+ pages without performance issues
- ✅ Export respects column visibility and filters

---

**Next Steps**: Start implementation with Phase 1 (Column Management)
