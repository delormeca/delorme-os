# Bot Protection Detection Feature

## Overview

This feature detects when sitemaps are protected by security measures (Vercel, Cloudflare, etc.) and provides user-friendly guidance instead of generic error messages.

## Implementation Summary

### Backend Changes

**File**: `app/utils/sitemap_parser.py`

**Changes**:
1. **Whitespace Handling (Lines 88-106)**: Added `.strip()` to all URL extractions to handle Webflow-style XML formatting with whitespace inside `<loc>` tags

2. **Bot Protection Detection (Lines 51-58)**: Detects HTTP 403 and 429 status codes and returns a special error message prefixed with "BOT_PROTECTION:"

```python
except httpx.HTTPStatusError as e:
    # Detect bot protection / security checkpoints
    if e.response.status_code in [403, 429]:
        raise SitemapParseError(
            f"BOT_PROTECTION: The sitemap is protected by security measures "
            f"(Status {e.response.status_code}). This is common for sites using "
            f"Vercel, Cloudflare, or similar protection. Please use Manual URL Entry instead."
        )
```

### Frontend Changes

**File**: `frontend/src/components/Clients/EngineSetupProgressDialog.tsx`

**Changes (Lines 222-248)**: Enhanced error display to detect "BOT_PROTECTION:" prefix and show a warning alert instead of error alert

```typescript
{progress.error_message.includes("BOT_PROTECTION:") ? (
  // Special handling for bot protection errors
  <Alert severity="warning" sx={{ bgcolor: "warning.lighter" }}>
    <Typography variant="body2" fontWeight={600} gutterBottom>
      Sitemap Protected by Security Measures
    </Typography>
    <Typography variant="body2" gutterBottom>
      {progress.error_message.replace("BOT_PROTECTION:", "").trim()}
    </Typography>
    <Typography variant="body2" sx={{ mt: 1 }}>
      <strong>Alternative:</strong> Please use the "Add Pages Manually" option to import URLs for this website.
    </Typography>
  </Alert>
) : (
  // Standard error display
  <Alert severity="error">
    ...
  </Alert>
)}
```

## User Experience

### Before
- User attempts to import sitemap
- Gets generic red error: "Failed to fetch sitemap from URL: 429 Too Many Requests"
- No guidance on what to do next

### After
- User attempts to import sitemap
- Gets friendly yellow warning with:
  - Clear title: "Sitemap Protected by Security Measures"
  - Explanation: Why this happened and which services cause it
  - Action: "Please use the Add Pages Manually option to import URLs"
- User knows exactly what to do next

## Testing

### Test Scripts Created

1. **`test_bot_protection.py`** - Verifies bot protection detection
   - Tests protected sitemap (lcieducation.com)
   - Confirms BOT_PROTECTION prefix is added
   - Shows how frontend will display it

2. **`test_shopify_sitemap.py`** - Verifies normal operation
   - Tests unprotected Shopify sitemap (arvikabikerack.com)
   - Confirms 378 URLs extracted and validated
   - Ensures whitespace stripping works

3. **`test_url_validation.py`** - Verifies URL validation
   - Tests pestagent.ca (Webflow) sitemap
   - Confirms all 227 URLs validate after stripping

### Test Results

```bash
# Bot Protection Detection
python test_bot_protection.py
# Result: BOT_PROTECTION prefix detected, friendly message displayed

# Normal Sitemap Parsing
python test_shopify_sitemap.py
# Result: 378 URLs, 100% valid

# URL Validation
python test_url_validation.py
# Result: 227 URLs, 100% valid
```

## Supported Platforms

| Platform | Status | Test URL | URLs Found | Notes |
|----------|--------|----------|------------|-------|
| **Webflow** | ✅ Working | pestagent.ca | 227 | Whitespace stripping implemented |
| **Shopify** | ✅ Working | arvikabikerack.com | 378 | No special handling needed |
| **WordPress** | ✅ Working | lafusee.net | 210 | Standard format |
| **Vercel Protected** | ⚠️ Protected | lcieducation.com | 0 | Bot protection detected, friendly warning shown |
| **Cloudflare Protected** | ⚠️ Protected | Various | 0 | Bot protection detected, friendly warning shown |

## Error Codes Detected

- **403 Forbidden**: Access denied by security policy
- **429 Too Many Requests**: Rate limiting or bot protection

## Files Modified

### Backend
- `app/utils/sitemap_parser.py` - Added whitespace stripping and bot protection detection

### Frontend
- `frontend/src/components/Clients/EngineSetupProgressDialog.tsx` - Added friendly warning display

### Test Files Created
- `test_bot_protection.py`
- `test_shopify_sitemap.py`
- `test_url_validation.py`
- `test_sitemap_parse.py`

## Future Enhancements

1. **Retry with User-Agent Spoofing**: Attempt to bypass soft blocks by using common browser user agents
2. **Proxy Support**: Allow configuring proxy servers for sites with geographic restrictions
3. **Manual Override**: Add option to download sitemap manually and upload XML file
4. **Alternative Discovery**: Implement robots.txt parsing as fallback
5. **Smart Detection**: Detect common CMS platforms and generate sitemap URLs (e.g., /sitemap.xml, /sitemap_index.xml, /sitemap-0.xml)

## Impact

### User Experience
- ✅ Clear, actionable error messages
- ✅ Reduced confusion and support requests
- ✅ Guides users to working alternative (manual URL entry)

### Platform Compatibility
- ✅ Fixed Webflow sitemap parsing (whitespace issue)
- ✅ Maintained compatibility with Shopify, WordPress
- ✅ Graceful handling of protected sitemaps

### Code Quality
- ✅ Consistent error handling pattern
- ✅ Test coverage for edge cases
- ✅ Documentation for future maintenance

---

**Last Updated**: 2025-01-06
**Status**: ✅ Production Ready
**Version**: v2.0.1
