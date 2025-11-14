# Screenshot Storage - File-Based Implementation

## Overview

Screenshots are now saved as **PNG image files** on the filesystem instead of base64-encoded data in the database. This significantly reduces database size and improves performance.

---

## Changes Made

### Before (Base64 in Database)
```python
# Screenshots stored as 34MB base64 strings in database
page.screenshot_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." # 34MB!
```

**Problems:**
- ❌ Database bloat (34MB per screenshot)
- ❌ Slow queries when loading pages
- ❌ Can't view screenshots directly in browser
- ❌ JSON responses become massive

### After (Files on Disk)
```python
# Screenshots saved as PNG files, only URL path stored in database
page.screenshot_url = "/screenshots/a1b2c3d4-e5f6-7890-abcd-ef1234567890_thumbnail.png"
```

**Benefits:**
- ✅ Database stores only 80 bytes (URL path)
- ✅ Fast queries and page loads
- ✅ Screenshots viewable directly in browser
- ✅ Web server can cache and serve efficiently
- ✅ Can delete/manage screenshots independently

---

## File Storage Structure

### Directory Layout
Screenshots are organized by client to maintain data isolation:
```
static/
└── screenshots/
    ├── {client_id}/
    │   ├── {page_id}_thumbnail.png     # Viewport screenshot
    │   ├── {page_id}_full.png          # Full page screenshot (if captured)
    │   └── ...
    ├── {client_id}/
    │   └── ...
    └── ...
```

### Example Files
```
static/screenshots/
├── 123e4567-e89b-12d3-a456-426614174000/    # Client A
│   ├── 550e8400-e29b-41d4-a716-446655440000_thumbnail.png
│   ├── 550e8400-e29b-41d4-a716-446655440000_full.png
│   └── 661f9511-f3ab-52e5-b827-557766551111_thumbnail.png
└── 234f5678-f90c-23e4-b567-537725285111/    # Client B
    └── 772g0622-g4bc-63f6-c938-668877662222_thumbnail.png
```

### URL Paths
Screenshots are served at:
```
http://localhost:8020/screenshots/{client_id}/{page_id}_thumbnail.png
http://localhost:8020/screenshots/{client_id}/{page_id}_full.png
```

### Benefits of Client-Based Organization
- ✅ **Data isolation** - Each client's screenshots in separate folder
- ✅ **Easy cleanup** - Delete all screenshots for a client at once
- ✅ **Access control** - Can implement client-specific permissions
- ✅ **Disk quotas** - Monitor storage per client
- ✅ **Better organization** - Scalable structure for many clients

---

## How It Works

### 1. Crawl4AI Captures Screenshot
```python
# Crawl4AI returns base64-encoded PNG data
result = await crawler.arun(url, config=CrawlerRunConfig(screenshot=True))
# result.screenshot = "iVBORw0KGgoAAAANSUhEUgAA..."
```

### 2. ScreenshotStorage Service Saves to File
```python
from app.services.screenshot_storage import ScreenshotStorage

storage = ScreenshotStorage()  # Uses 'static/screenshots' directory

# Save screenshot to disk (organized by client)
screenshot_path = storage.save_screenshot(
    screenshot_base64="iVBORw0KGgoAAAANSUhEUgAA...",
    page_id=page.id,
    client_id=client_id,
    screenshot_type="thumbnail"  # or "full"
)
# Returns: "/screenshots/{client_id}/{page_id}_thumbnail.png"
```

### 3. Database Stores Only URL Path
```python
page.screenshot_url = screenshot_path  # Just the URL, not the image data
await db.commit()
```

### 4. Frontend Displays Screenshot
```tsx
// In React component
<img src={page.screenshot_url} alt="Page screenshot" />
// Renders: <img src="/screenshots/{client_id}/{page_id}_thumbnail.png" />
```

---

## Usage Examples

### Database-Backed Crawling (Production)
```python
from app.services.robust_page_crawler import RobustPageCrawler
from app.db import get_async_db

async for db in get_async_db():
    async with RobustPageCrawler(db) as crawler:
        # Screenshots automatically saved to files
        page = await crawler.extract_and_store_page(
            client_id=client_id,
            url="https://example.com"
        )

        print(f"Screenshot: {page.screenshot_url}")
        # Output: /screenshots/{client_id}/{page_id}_thumbnail.png

        print(f"Image file: static{page.screenshot_url}")
        # Output: static/screenshots/{client_id}/{page_id}_thumbnail.png
```

### Testing Without Database
```python
from app.services.robust_page_crawler import RobustPageCrawler

async with RobustPageCrawler() as crawler:
    # No database - returns base64 data in result dictionary
    result = await crawler.extract_page_data("https://example.com")

    print(f"Screenshot: {result['screenshot_url'][:50]}...")
    # Output: iVBORw0KGgoAAAANSUhEUgAAAAUA... (base64 data)

    # This is fine for testing - screenshots only saved to files when using database
```

---

## API Configuration

### FastAPI Static Files Setup
In `main.py`:
```python
from fastapi.staticfiles import StaticFiles

# Serve screenshots directory
screenshots_directory = "static/screenshots"
if os.path.exists(screenshots_directory):
    app.mount(
        "/screenshots",
        StaticFiles(directory=screenshots_directory),
        name="screenshots"
    )
```

### Screenshot Storage Service
In `app/services/screenshot_storage.py`:
```python
class ScreenshotStorage:
    def __init__(self, storage_dir: str = "static/screenshots"):
        """Initialize with custom directory if needed."""
        self.storage_dir = Path(storage_dir)
        self._ensure_directory_exists()

    def save_screenshot(
        self,
        screenshot_base64: str,
        page_id: uuid.UUID,
        screenshot_type: str = "thumbnail"
    ) -> Optional[str]:
        """
        Save base64 screenshot to disk.

        Returns:
            URL path like "/screenshots/{page_id}_thumbnail.png"
        """
```

---

## Testing Screenshot Storage

### Run the Test Script
```bash
poetry run python test_screenshot_storage.py
```

**Expected Output:**
```
🕷️  Testing Screenshot Storage - Client-Based Organization
================================================================================
URL: https://mcaressources.ca/formation-equipements-a-nacelle/
Expected screenshot location: static/screenshots/{client_id}/

✅ Using client: admin@example.com (ID: 123e4567-...)

🔍 Crawling page and saving screenshot to filesystem...

================================================================================
✅ Screenshot Storage Test Results:
================================================================================

✅ Screenshot URL in database: /screenshots/123e4567-.../550e8400-..._thumbnail.png
   (Organized by client: 123e4567-e89b-12d3-a456-426614174000)

✅ Screenshot file exists: static\screenshots\123e4567-...\550e8400-..._thumbnail.png
✅ File size: 1,234,567 bytes (1205.6 KB)

🎉 SUCCESS! Screenshot is organized by client folder!

File structure:
  static/screenshots/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 550e8400-e29b-41d4-a716-446655440000_thumbnail.png

You can view the screenshot at:
  - File path: C:\path\to\static\screenshots\123e4567-...\550e8400-..._thumbnail.png
  - Web URL: http://localhost:8020/screenshots/123e4567-.../550e8400-..._thumbnail.png
```

### Verify Files Exist
```bash
# List all client folders
ls -lh static/screenshots/

# Output:
# drwxr-xr-x 2 user 4.0K Jan 15 10:30 123e4567-e89b-12d3-a456-426614174000/
# drwxr-xr-x 2 user 4.0K Jan 15 10:30 234f5678-f90c-23e4-b567-537725285111/

# List screenshots for a specific client
ls -lh static/screenshots/123e4567-e89b-12d3-a456-426614174000/

# Output:
# -rw-r--r-- 1 user 1.2M Jan 15 10:30 550e8400-e29b-41d4-a716-446655440000_thumbnail.png
# -rw-r--r-- 1 user 3.5M Jan 15 10:30 550e8400-e29b-41d4-a716-446655440000_full.png
# -rw-r--r-- 1 user 2.1M Jan 15 10:31 661f9511-f3ab-52e5-b827-557766551111_thumbnail.png
```

---

## Database Impact

### Before (Base64 Storage)
```sql
SELECT id, screenshot_url FROM client_page WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Result:
-- screenshot_url: "data:image/png;base64,iVBORw0KGgoAAAANSU..." (34,175,592 characters)
```

**Database row size:** ~34 MB per page

### After (File Path Storage)
```sql
SELECT id, screenshot_url FROM client_page WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Result:
-- screenshot_url: "/screenshots/550e8400-e29b-41d4-a716-446655440000_thumbnail.png" (79 characters)
```

**Database row size:** ~80 bytes per page

**Savings:** 99.9% reduction in database storage!

---

## File Management

### Delete All Screenshots for a Client
```python
from app.services.screenshot_storage import ScreenshotStorage
import uuid

storage = ScreenshotStorage()

# Delete all screenshots for a specific client
client_id = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
deleted_count = storage.delete_client_screenshots(client_id)
print(f"Deleted {deleted_count} screenshots for client {client_id}")

# This removes:
# - All thumbnail screenshots for the client
# - All full screenshots for the client
# - The client directory (if empty)
```

### Delete Specific Screenshot
```python
from app.services.screenshot_storage import ScreenshotStorage
import uuid

storage = ScreenshotStorage()

page_id = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")
client_id = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")

# Delete thumbnail
storage.delete_screenshot(
    page_id=page_id,
    client_id=client_id,
    screenshot_type="thumbnail"
)

# Delete full screenshot
storage.delete_screenshot(
    page_id=page_id,
    client_id=client_id,
    screenshot_type="full"
)
```

### Cleanup Orphaned Screenshots
```python
from app.services.screenshot_storage import ScreenshotStorage
from sqlmodel import select
from app.models import ClientPage

storage = ScreenshotStorage()

# Option 1: Clean up for specific client
async for db in get_async_db():
    client_id = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")

    # Get valid page IDs for this client
    result = await db.execute(
        select(ClientPage.id).where(ClientPage.client_id == client_id)
    )
    valid_page_ids = [row[0] for row in result.all()]

    # Remove orphaned screenshots for this client
    deleted_count = storage.cleanup_orphaned_screenshots(
        valid_page_ids,
        client_id=client_id
    )
    print(f"Deleted {deleted_count} orphaned screenshots for client {client_id}")

# Option 2: Clean up for all clients
async for db in get_async_db():
    # Get all valid page IDs
    result = await db.execute(select(ClientPage.id))
    valid_page_ids = [row[0] for row in result.all()]

    # Remove orphaned screenshots across all clients
    deleted_count = storage.cleanup_orphaned_screenshots(valid_page_ids)
    print(f"Deleted {deleted_count} orphaned screenshots total")
```

---

## Frontend Integration

### React Component Example
```tsx
interface PageScreenshotProps {
  screenshotUrl: string;
  pageTitle: string;
}

const PageScreenshot: React.FC<PageScreenshotProps> = ({
  screenshotUrl,
  pageTitle
}) => {
  if (!screenshotUrl) {
    return <div>No screenshot available</div>;
  }

  return (
    <div>
      <h3>Page Preview</h3>
      <img
        src={screenshotUrl}
        alt={`Screenshot of ${pageTitle}`}
        style={{ maxWidth: '100%', border: '1px solid #ccc' }}
      />
      <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
        View full size
      </a>
    </div>
  );
};

// Usage
<PageScreenshot
  screenshotUrl={page.screenshot_url}
  pageTitle={page.page_title}
/>
```

### API Response Example
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com",
  "page_title": "Example Page",
  "screenshot_url": "/screenshots/550e8400-e29b-41d4-a716-446655440000_thumbnail.png",
  "screenshot_full_url": "/screenshots/550e8400-e29b-41d4-a716-446655440000_full.png"
}
```

**Frontend can directly use these URLs:**
```tsx
<img src={page.screenshot_url} />
// Renders: <img src="/screenshots/550e8400-..._thumbnail.png" />
```

---

## Production Deployment

### 1. Ensure Directory Exists
```bash
mkdir -p static/screenshots
chmod 755 static/screenshots
```

### 2. Configure Web Server (Nginx Example)
```nginx
# Serve screenshots with caching
location /screenshots/ {
    alias /app/static/screenshots/;
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

### 3. Backup Strategy
```bash
# Backup screenshots directory
tar -czf screenshots-backup-$(date +%Y%m%d).tar.gz static/screenshots/

# Restore from backup
tar -xzf screenshots-backup-20250115.tar.gz
```

### 4. Storage Monitoring
```bash
# Check total disk usage
du -sh static/screenshots/

# Check disk usage per client
du -sh static/screenshots/*/

# Count total screenshots
find static/screenshots/ -name "*.png" | wc -l

# Count screenshots per client
for dir in static/screenshots/*/; do
    echo "$(basename $dir): $(ls $dir/*.png 2>/dev/null | wc -l) screenshots"
done

# Clean up old screenshots for a specific client (manual)
find static/screenshots/{client_id}/ -mtime +30 -type f -delete
```

---

## Troubleshooting

### Screenshot Not Appearing
**Problem:** Database has screenshot_url but image doesn't display

**Checks:**
1. Verify file exists:
   ```bash
   ls static/screenshots/{page_id}_thumbnail.png
   ```

2. Check file permissions:
   ```bash
   chmod 644 static/screenshots/*.png
   ```

3. Verify web server is serving `/screenshots/`:
   ```bash
   curl http://localhost:8020/screenshots/{page_id}_thumbnail.png
   ```

### Screenshots Still in Base64
**Problem:** Database still contains base64 data

**Solution:** This means you're using the old crawler or `extract_page_data` without database.

- Use `extract_and_store_page` for database storage with file-based screenshots
- Use `extract_page_data` for testing (returns base64 in result dictionary)

### Large Disk Usage
**Problem:** Screenshots directory is too large

**Solutions:**
1. Delete old screenshots:
   ```python
   storage.cleanup_orphaned_screenshots(valid_page_ids)
   ```

2. Compress old screenshots:
   ```bash
   find static/screenshots/ -mtime +7 -exec gzip {} \;
   ```

3. Use thumbnail-only mode:
   ```python
   # Disable full screenshots in config
   CrawlerRunConfig(screenshot=True)  # Only captures thumbnail
   ```

---

## Summary

✅ **Screenshots are now saved as PNG files** in `static/screenshots/`
✅ **Database stores only URL paths** (~80 bytes instead of 34MB)
✅ **99.9% reduction in database storage**
✅ **Fast queries and page loads**
✅ **Screenshots viewable directly in browser**
✅ **Easy file management and cleanup**

**Before:** 34 MB base64 string in database
**After:** 80 byte URL path + 1-3 MB PNG file on disk

🎉 **Your crawler now saves screenshots efficiently!**
