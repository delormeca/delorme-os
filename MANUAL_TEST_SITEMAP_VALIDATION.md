# Manual Testing Guide: Sitemap Validation Endpoint

## Prerequisites

1. Backend server must be running:
   ```bash
   cd /c/Users/Admin/Documents/GitHub/delorme-os/velocity-v2.0.1/velocity-boilerplate
   poetry run uvicorn main:app --reload
   ```

2. Database must be running:
   ```bash
   docker-compose up -d
   ```

3. You need valid login credentials (default: admin@admin.com / password)

## Testing with curl

### Step 1: Login to get authentication cookie

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"password"}' \
  -c cookies.txt \
  -v
```

This saves the session cookie to `cookies.txt`.

### Step 2: Test with a VALID sitemap (should return valid: true)

```bash
curl -X POST http://localhost:8000/api/engine-setup/validate-sitemap \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"sitemap_url":"https://cleio.com/page-sitemap1.xml"}' \
  | python -m json.tool
```

**Expected Response:**
```json
{
  "valid": true,
  "status_code": null,
  "url_count": 25,
  "sitemap_type": "urlset",
  "error_type": null,
  "error_message": null,
  "suggestion": null,
  "parse_time": 1.234
}
```

### Step 3: Test with an INVALID sitemap (should return valid: false)

```bash
curl -X POST http://localhost:8000/api/engine-setup/validate-sitemap \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"sitemap_url":"https://cleio.com/nonexistent.xml"}' \
  | python -m json.tool
```

**Expected Response:**
```json
{
  "valid": false,
  "status_code": null,
  "url_count": 0,
  "sitemap_type": null,
  "error_type": "NOT_FOUND",
  "error_message": "Sitemap not found (HTTP 404)",
  "suggestion": "Check that the URL is correct and publicly accessible",
  "parse_time": 0.456
}
```

### Step 4: Test with malformed URL

```bash
curl -X POST http://localhost:8000/api/engine-setup/validate-sitemap \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"sitemap_url":"not-a-valid-url"}' \
  | python -m json.tool
```

**Expected Response:**
```json
{
  "valid": false,
  "status_code": null,
  "url_count": 0,
  "sitemap_type": null,
  "error_type": "INVALID_URL",
  "error_message": "Invalid URL format",
  "suggestion": "Ensure the URL starts with http:// or https://",
  "parse_time": 0.001
}
```

## Testing with the Python Script

If the backend server is running on port 8000:

```bash
cd /c/Users/Admin/Documents/GitHub/delorme-os/velocity-v2.0.1/velocity-boilerplate
poetry run python test_sitemap_validation.py
```

## Expected Behavior

1. **Valid Sitemap**: Returns `valid: true` with URL count and sitemap type
2. **Invalid Sitemap**: Returns `valid: false` with error details and suggestions
3. **HTTP Status**: Always returns 200 OK (errors are in response body, not status code)
4. **Authentication**: Requires valid user session (protected by `get_current_user` dependency)
5. **No Side Effects**: Does NOT create a setup run - purely validation only

## Troubleshooting

### "Connection refused" error
- Backend server is not running
- Solution: Start backend with `poetry run uvicorn main:app --reload`

### "401 Unauthorized" error
- Not logged in or session expired
- Solution: Run Step 1 again to get fresh cookies

### "422 Unprocessable Entity" error
- Request body format is incorrect
- Ensure JSON has `sitemap_url` field

## Integration Notes

This endpoint is designed to be called from the frontend before starting a full engine setup:

1. User enters sitemap URL
2. Frontend calls `/api/engine-setup/validate-sitemap`
3. If valid, enable "Start Setup" button
4. If invalid, show error message with suggestion
5. Proceed to `/api/engine-setup/start` only after validation succeeds

## Files Modified

1. **C:\Users\Admin\Documents\GitHub\delorme-os\velocity-v2.0.1\velocity-boilerplate\app\schemas\engine_setup.py**
   - Added `SitemapValidationRequest` schema (line 93-95)
   - Added `SitemapValidationResponse` schema (line 98-107)

2. **C:\Users\Admin\Documents\GitHub\delorme-os\velocity-v2.0.1\velocity-boilerplate\app\controllers\engine_setup.py**
   - Added `logging` import (line 4)
   - Added logger initialization (line 28)
   - Added new schemas to imports (lines 19-20)
   - Added `/engine-setup/validate-sitemap` endpoint (lines 199-260)

## Next Steps

1. Start backend server
2. Run manual tests using curl or Python script
3. Generate TypeScript API client: `task frontend:generate-client`
4. Implement frontend integration in Phase B2
