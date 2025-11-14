# Screenshot Storage - Client-Based Organization Update

## Change Summary

Screenshots are now organized by **client folders** to match the rest of your data structure.

---

## Before vs After

### Before (Flat Structure)
```
static/screenshots/
├── 550e8400-..._thumbnail.png    ← All clients mixed together
├── 661f9511-..._thumbnail.png
├── 772g0622-..._thumbnail.png
└── ...
```

**URL:** `/screenshots/{page_id}_thumbnail.png`

### After (Client-Based Organization) ✅
```
static/screenshots/
├── {client_a_id}/
│   ├── 550e8400-..._thumbnail.png    ← Client A's screenshots
│   ├── 661f9511-..._thumbnail.png
│   └── ...
├── {client_b_id}/
│   ├── 772g0622-..._thumbnail.png    ← Client B's screenshots
│   └── ...
└── ...
```

**URL:** `/screenshots/{client_id}/{page_id}_thumbnail.png`

---

## Benefits

✅ **Data isolation** - Each client's screenshots in separate folder
✅ **Easy cleanup** - Delete all screenshots for a client at once
✅ **Access control** - Can implement client-specific permissions
✅ **Disk quotas** - Monitor storage per client
✅ **Better organization** - Scalable structure for many clients
✅ **Consistent with rest of data** - All data tied to clients

---

## What Changed

### 1. ScreenshotStorage Service (`app/services/screenshot_storage.py`)

**Added `client_id` parameter to all methods:**

```python
# Before
storage.save_screenshot(
    screenshot_base64=base64_data,
    page_id=page_id,
    screenshot_type="thumbnail"
)

# After
storage.save_screenshot(
    screenshot_base64=base64_data,
    page_id=page_id,
    client_id=client_id,  # ✅ NEW
    screenshot_type="thumbnail"
)
```

**New method to delete all client screenshots:**

```python
# Delete all screenshots for a specific client
deleted_count = storage.delete_client_screenshots(client_id)
# Removes all screenshots and the client directory
```

**Enhanced cleanup method:**

```python
# Clean up orphaned screenshots for specific client
storage.cleanup_orphaned_screenshots(
    valid_page_ids,
    client_id=client_id  # ✅ Optional - filter by client
)
```

### 2. RobustPageCrawler (`app/services/robust_page_crawler.py`)

**Updated to pass `client_id` when saving screenshots:**

```python
# Now uses page.client_id to organize screenshots
screenshot_path = self.screenshot_storage.save_screenshot(
    screenshot_base64=screenshot_base64,
    page_id=page.id,
    client_id=page.client_id,  # ✅ From ClientPage model
    screenshot_type="thumbnail"
)
```

### 3. Test Script (`test_screenshot_storage.py`)

**Updated to show client-based organization:**

```python
print(f"File structure:")
print(f"  static/screenshots/")
print(f"  └── {client_id}/")
print(f"      └── {page_id}_thumbnail.png")
```

---

## Usage Examples

### Save Screenshot (Automatic in Crawler)

```python
async with RobustPageCrawler(db) as crawler:
    page = await crawler.extract_and_store_page(
        client_id=client_id,
        url="https://example.com"
    )

# Screenshot automatically saved to:
# static/screenshots/{client_id}/{page_id}_thumbnail.png

# Database stores:
# page.screenshot_url = "/screenshots/{client_id}/{page_id}_thumbnail.png"
```

### Delete All Client Screenshots

```python
from app.services.screenshot_storage import ScreenshotStorage

storage = ScreenshotStorage()

# When deleting a client, remove all their screenshots
deleted_count = storage.delete_client_screenshots(client_id)
print(f"Deleted {deleted_count} screenshots for client {client_id}")
```

### Clean Up Orphaned Screenshots per Client

```python
# Get valid page IDs for this client
result = await db.execute(
    select(ClientPage.id).where(ClientPage.client_id == client_id)
)
valid_page_ids = [row[0] for row in result.all()]

# Remove orphaned screenshots for this client only
deleted_count = storage.cleanup_orphaned_screenshots(
    valid_page_ids,
    client_id=client_id
)
```

### Monitor Storage per Client

```bash
# Check disk usage per client
du -sh static/screenshots/*/

# Output:
# 12M  static/screenshots/123e4567-e89b-12d3-a456-426614174000/
# 8.5M static/screenshots/234f5678-f90c-23e4-b567-537725285111/

# Count screenshots per client
for dir in static/screenshots/*/; do
    echo "$(basename $dir): $(ls $dir/*.png 2>/dev/null | wc -l) screenshots"
done

# Output:
# 123e4567-e89b-12d3-a456-426614174000: 15 screenshots
# 234f5678-f90c-23e4-b567-537725285111: 8 screenshots
```

---

## Migration

### Existing Screenshots

If you have existing screenshots in the flat structure, you can migrate them:

```python
from pathlib import Path
from app.services.screenshot_storage import ScreenshotStorage
from app.models import ClientPage
from sqlmodel import select
import shutil

storage = ScreenshotStorage()

async for db in get_async_db():
    # Get all pages with screenshots
    result = await db.execute(
        select(ClientPage).where(ClientPage.screenshot_url.isnot(None))
    )
    pages = result.scalars().all()

    for page in pages:
        # Old path: static/screenshots/{page_id}_thumbnail.png
        old_filename = f"{page.id}_thumbnail.png"
        old_path = Path("static/screenshots") / old_filename

        if old_path.exists():
            # New path: static/screenshots/{client_id}/{page_id}_thumbnail.png
            client_dir = Path("static/screenshots") / str(page.client_id)
            client_dir.mkdir(parents=True, exist_ok=True)
            new_path = client_dir / old_filename

            # Move file
            shutil.move(str(old_path), str(new_path))

            # Update database
            page.screenshot_url = f"/screenshots/{page.client_id}/{page.id}_thumbnail.png"
            await db.commit()

            print(f"Migrated: {old_path} -> {new_path}")
```

### New Crawls

All new crawls automatically use client-based organization - no action needed! ✅

---

## Testing

```bash
poetry run python test_screenshot_storage.py
```

**Expected output:**
```
🕷️  Testing Screenshot Storage - Client-Based Organization
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
```

---

## API Impact

### URL Format Changed

**Before:**
```json
{
  "screenshot_url": "/screenshots/550e8400-..._thumbnail.png"
}
```

**After:**
```json
{
  "screenshot_url": "/screenshots/123e4567-.../550e8400-..._thumbnail.png"
}
```

### Frontend Usage (No Changes Required!)

```tsx
// Frontend code remains the same
<img src={page.screenshot_url} alt="Screenshot" />

// URL is simply more organized now:
// Before: /screenshots/550e8400-..._thumbnail.png
// After:  /screenshots/123e4567-.../550e8400-..._thumbnail.png
```

Frontend doesn't need any changes - it just uses the URL from the database!

---

## Summary

✅ **Screenshots now organized by client folder**
✅ **All methods updated to require `client_id`**
✅ **New method to delete all client screenshots**
✅ **Enhanced cleanup to work per-client**
✅ **Better data isolation and organization**
✅ **Consistent with rest of data structure**

**File structure:**
```
static/screenshots/
├── {client_a_id}/
│   └── screenshots for client A
└── {client_b_id}/
    └── screenshots for client B
```

**Your screenshots are now properly tied to clients, just like the rest of your data!** 🎉
