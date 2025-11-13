# Delorme OS Redesign - Implementation Status (PAD Framework)

**Created**: 2025-11-13
**Methodology**: Patterned Agentic Development (PAD)
**Estimated Duration**: 8-10 weeks
**Current Status**: 📋 Planning Complete - Awaiting Approval

---

## Problem Analysis

Delorme OS currently faces architectural challenges that limit scalability and user experience. The system stores screenshots as base64 in PostgreSQL (causing bloat), lacks a structured workflow output system for n8n integration, uses a confusing "Projects" model that doesn't align with user mental models, has critical security vulnerabilities (default JWT secrets, no rate limiting, permissive CORS), and is split across Render.com (backend/database) and static hosting (frontend) creating deployment complexity. With 50 clients running monthly full crawls generating 1.25 GB/month of data, the database will reach capacity within 18 months without optimization. The architecture documents propose a comprehensive redesign addressing these issues systematically.

---

## Solution Approach

**Phase 1: Security Hardening**
- Fix critical vulnerabilities before adding new features
- Add JWT secret validation, rate limiting, CORS restrictions
- Implement request size limits and security headers

**Phase 2: Storage Layer (Simplified)**
- Use Cloudflare R2 for screenshots and workflow outputs ONLY
- Keep crawl data in PostgreSQL (no archiving initially - defer for 12 months)
- Implement StorageService with upload/download/presigned URLs

**Phase 3: Database & Workflows**
- Add WorkflowOutput model for n8n integration
- Create WorkflowService for trigger → callback → download flow
- Build workflow API endpoints

**Phase 4: Frontend Redesign**
- Remove Projects pages entirely
- Redesign ClientDetail with Engine box + Workflows toggle
- Implement workflow trigger UI
- Generate new TypeScript API client

**Phase 5: Deployment & Infrastructure**
- Migrate to Supabase (PostgreSQL + Storage + Auth)
- Deploy frontend to Vercel
- Add monitoring and health checks
- Comprehensive testing

---

## Micro-Task Breakdown (58 Tasks)

### 🔒 SPRINT 1: Security Fixes (P0 Priority) - 5 tasks

#### TASK 1A: Add JWT Secret Production Validation

**OBJECTIVE:** Prevent production deployment with default JWT secret key

**CONTEXT:** Backend audit identified that `app/config/base.py` has `secret_key` defaulting to "example-key" which is a critical security vulnerability if deployed to production without override.

**STEP 1: REVIEW**
- Read `app/config/base.py` lines 48-56
- Locate `BaseConfig` class and its `__init__` method (or identify where to add one)

**STEP 2: IMPLEMENT**
Add validation method to BaseConfig:
```python
def __post_init__(self):
    """Validate critical production settings"""
    if self.is_production() and self.secret_key == "example-key":
        raise ValueError(
            "CRITICAL SECURITY: SECRET_KEY must be set in production! "
            "Generate a secure key with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
```

**STEP 3: TEST**
```bash
# Test 1: Should raise error
ENV=production SECRET_KEY=example-key poetry run python -c "from app.config.base import config"

# Test 2: Should start normally
ENV=production SECRET_KEY=secure-key-here poetry run python -c "from app.config.base import config; print('✅ Config loaded')"

# Test 3: Development should work with any key
ENV=development SECRET_KEY=example-key poetry run python -c "from app.config.base import config; print('✅ Dev config loaded')"
```

**DELIVERABLE:** Modified `app/config/base.py` with production validation

**VERIFICATION:**
- [ ] ValueError raised when ENV=production and SECRET_KEY=example-key
- [ ] Config loads successfully with valid production key
- [ ] Development mode works with default key
- [ ] Error message includes instructions for generating secure key

**STOP:** Report completion and test results

---

#### TASK 1B: Install slowapi for Rate Limiting

**OBJECTIVE:** Add slowapi dependency to project for API rate limiting

**CONTEXT:** Backend audit identified missing rate limiting as a security vulnerability. slowapi provides Flask-Limiter-style rate limiting for FastAPI.

**STEP 1: INSTALL**
```bash
poetry add slowapi
```

**STEP 2: VERIFY**
```bash
poetry show slowapi
# Should display version info
```

**DELIVERABLE:** Updated `pyproject.toml` with slowapi dependency

**VERIFICATION:**
- [ ] slowapi appears in `pyproject.toml` under `[tool.poetry.dependencies]`
- [ ] `poetry show slowapi` displays package info
- [ ] No dependency conflicts reported

**STOP:** Report completion

---

#### TASK 1C: Implement Rate Limiting on Auth Endpoints

**OBJECTIVE:** Add rate limiting to prevent brute force attacks on authentication

**CONTEXT:** Auth endpoints (/api/auth/login, /api/auth/register) are vulnerable to brute force without rate limiting.

**STEP 1: REVIEW**
- Read `main.py` lines 1-80 (imports and app initialization)
- Read `app/controllers/auth.py` to identify auth endpoints

**STEP 2: IMPLEMENT**
Add to `main.py` after line 77 (before middleware):
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter

# Add rate limit error handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"error": "Rate limit exceeded. Please try again later."}
    )

# Add middleware
app.add_middleware(SlowAPIMiddleware)
```

**STEP 3: ADD TO AUTH ENDPOINTS**
Modify `app/controllers/auth.py`:
```python
from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")  # 5 login attempts per minute
async def login(request: Request, ...):
    ...

@router.post("/register")
@limiter.limit("3/hour")  # 3 registrations per hour
async def register(request: Request, ...):
    ...
```

**STEP 4: TEST**
```bash
# Start backend
task run-backend

# Test rate limiting (in separate terminal)
for i in {1..6}; do curl -X POST http://localhost:8020/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'; echo "Request $i"; done

# Should see 429 error on 6th request
```

**DELIVERABLE:**
- Modified `main.py` with rate limiter setup
- Modified `app/controllers/auth.py` with rate limits on endpoints

**VERIFICATION:**
- [ ] Login endpoint returns 429 after 5 requests/minute
- [ ] Register endpoint returns 429 after 3 requests/hour
- [ ] Rate limit error message is user-friendly
- [ ] Other endpoints not affected

**STOP:** Report completion and test results

---

#### TASK 1D: Restrict CORS Headers

**OBJECTIVE:** Tighten CORS security by explicitly listing allowed headers instead of wildcard

**CONTEXT:** Current CORS configuration uses `allow_headers=["*"]` which is overly permissive (main.py:94).

**STEP 1: REVIEW**
- Read `main.py` lines 81-95 (CORS middleware configuration)

**STEP 2: IMPLEMENT**
Change line 94 from:
```python
allow_headers=["*"],
```
to:
```python
allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
```

**STEP 3: TEST**
```bash
# Start backend
task run-backend

# Test with allowed header (should work)
curl -X GET http://localhost:8020/api/health \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173"

# Test OPTIONS preflight
curl -X OPTIONS http://localhost:8020/api/health \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**DELIVERABLE:** Modified `main.py` with explicit CORS headers

**VERIFICATION:**
- [ ] Allowed headers explicitly listed (no wildcard)
- [ ] OPTIONS preflight requests work correctly
- [ ] Frontend can still make API calls
- [ ] Custom/unknown headers are rejected

**STOP:** Report completion

---

#### TASK 1E: Add Request Size Limits

**OBJECTIVE:** Prevent DoS attacks via large request payloads

**CONTEXT:** No maximum request size is currently enforced, allowing potential memory exhaustion attacks.

**STEP 1: IMPLEMENT**
Add to `main.py` after CORS middleware (around line 96):
```python
from starlette.middleware.base import BaseHTTPMiddleware

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int = 10 * 1024 * 1024):  # 10 MB default
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request, call_next):
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > self.max_upload_size:
                return JSONResponse(
                    status_code=413,
                    content={"error": f"Request too large. Maximum size: {self.max_upload_size / 1024 / 1024}MB"}
                )
        response = await call_next(request)
        return response

# Add after CORS middleware
app.add_middleware(RequestSizeLimitMiddleware, max_upload_size=10 * 1024 * 1024)  # 10 MB limit
```

**STEP 2: TEST**
```bash
# Test with small payload (should work)
curl -X POST http://localhost:8020/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Client"}'

# Test with large payload (should fail)
dd if=/dev/zero bs=1M count=11 | curl -X POST http://localhost:8020/api/clients \
  -H "Content-Type: application/octet-stream" \
  --data-binary @- \
  -v
```

**DELIVERABLE:** Modified `main.py` with request size limit middleware

**VERIFICATION:**
- [ ] Requests under 10 MB succeed
- [ ] Requests over 10 MB return 413 status
- [ ] Error message indicates size limit
- [ ] GET requests not affected

**STOP:** Report completion

---

### 📦 SPRINT 2: Storage Layer (P0 Priority) - 12 tasks

#### TASK 2A: Research Cloudflare R2 SDK

**OBJECTIVE:** Confirm R2 is boto3-compatible and identify any configuration differences

**CONTEXT:** Storage architecture recommends Cloudflare R2 for cost savings. Need to verify it works with standard boto3 SDK before implementation.

**AGENT:** `technical-researcher`

**RESEARCH QUESTIONS:**
1. Is Cloudflare R2 fully compatible with boto3 (AWS S3 SDK)?
2. What are the endpoint URL and configuration differences?
3. How do presigned URLs work with R2?
4. Are there any limitations vs AWS S3?
5. What's the best practice for R2 bucket organization?

**DELIVERABLE:** Research summary document (can be inline in this file)

**VERIFICATION:**
- [ ] Boto3 compatibility confirmed
- [ ] R2 endpoint URL format documented
- [ ] Presigned URL generation method identified
- [ ] Any R2-specific limitations noted

**STOP:** Report research findings

---

#### TASK 2B: Add R2 Configuration to base.py

**OBJECTIVE:** Add Cloudflare R2 credentials and settings to application config

**CONTEXT:** Need to store R2 access keys and bucket configuration for StorageService to use.

**STEP 1: REVIEW**
- Read `app/config/base.py` lines 1-50

**STEP 2: IMPLEMENT**
Add to BaseConfig class (after line 151):
```python
# Cloudflare R2 Storage Configuration
r2_account_id: str = Field(
    default="",
    description="Cloudflare R2 account ID"
)
r2_access_key_id: str = Field(
    default="",
    description="R2 access key ID"
)
r2_secret_access_key: str = Field(
    default="",
    description="R2 secret access key"
)
r2_bucket_name: str = Field(
    default="delorme-os-storage",
    description="R2 bucket name"
)
r2_public_url: Optional[str] = Field(
    default=None,
    description="R2 public URL for accessing files (optional)"
)
```

**STEP 3: EXPORT VARIABLES**
Add after line 256:
```python
# R2 Storage
R2_ACCOUNT_ID = config.r2_account_id
R2_ACCESS_KEY_ID = config.r2_access_key_id
R2_SECRET_ACCESS_KEY = config.r2_secret_access_key
R2_BUCKET_NAME = config.r2_bucket_name
R2_PUBLIC_URL = config.r2_public_url
```

**STEP 4: UPDATE local.env.example**
Add R2 configuration template:
```bash
# Cloudflare R2 Storage (for screenshots and workflow outputs)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=delorme-os-storage
R2_PUBLIC_URL=  # Optional: public URL if bucket is public
```

**DELIVERABLE:**
- Modified `app/config/base.py` with R2 config
- Updated `local.env.example` with R2 variables

**VERIFICATION:**
- [ ] Config loads without errors
- [ ] R2 config fields are type-safe (Pydantic validation)
- [ ] Example env file includes R2 variables with descriptions

**STOP:** Report completion

---

#### TASK 2C: Create StorageService Class Structure

**OBJECTIVE:** Create StorageService class with method signatures (no implementation yet)

**CONTEXT:** Define the interface for storage operations before implementing individual methods.

**STEP 1: CREATE FILE**
Create `app/services/storage_service.py`:
```python
"""
Cloudflare R2 storage service for screenshots and workflow outputs.
Uses boto3 SDK with R2-compatible endpoint.
"""

import logging
from typing import Optional
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)


class StorageService:
    """Service for Cloudflare R2 object storage operations"""

    def __init__(self):
        """Initialize R2 storage client"""
        pass

    # Path generators
    def get_client_base_path(self, client_slug: str) -> str:
        """Generate base path for client folder"""
        pass

    def get_screenshot_path(self, client_slug: str, page_id: uuid.UUID, full_page: bool = False) -> str:
        """Generate S3 key for screenshot"""
        pass

    def get_workflow_output_path(
        self,
        client_slug: str,
        workflow_name: str,
        timestamp: datetime,
        file_extension: str
    ) -> str:
        """Generate S3 key for workflow output"""
        pass

    # Upload operations
    async def upload_file(
        self,
        content: bytes,
        key: str,
        content_type: str = "application/octet-stream"
    ) -> str:
        """Upload file to R2, return S3 path"""
        pass

    async def upload_screenshot(
        self,
        client_slug: str,
        page_id: uuid.UUID,
        image_bytes: bytes,
        full_page: bool = False
    ) -> str:
        """Upload screenshot to R2"""
        pass

    # Download operations
    async def download_file(self, key: str) -> bytes:
        """Download file from R2"""
        pass

    async def generate_presigned_url(
        self,
        key: str,
        expiration: int = 3600
    ) -> str:
        """Generate presigned URL for temporary access"""
        pass

    # Utility operations
    async def delete_file(self, key: str) -> None:
        """Delete file from R2"""
        pass

    async def delete_client_folder(self, client_slug: str) -> None:
        """Delete entire client folder (for GDPR compliance)"""
        pass
```

**DELIVERABLE:** `app/services/storage_service.py` with class structure

**VERIFICATION:**
- [ ] File imports without errors
- [ ] All method signatures defined
- [ ] Type hints are correct
- [ ] Docstrings present

**STOP:** Report completion

---

#### TASK 2D: Implement StorageService Initialization

**OBJECTIVE:** Implement `__init__` method to create boto3 R2 client

**CONTEXT:** Connect to Cloudflare R2 using boto3 with custom endpoint

**STEP 1: REVIEW**
- Research findings from Task 2A (R2 endpoint format)
- R2 config from Task 2B

**STEP 2: IMPLEMENT**
Update `__init__` method in `app/services/storage_service.py`:
```python
import boto3
from botocore.config import Config
from app.config.base import config

def __init__(self):
    """Initialize R2 storage client"""
    # R2 endpoint format: https://<account-id>.r2.cloudflarestorage.com
    r2_endpoint = f"https://{config.r2_account_id}.r2.cloudflarestorage.com"

    self.s3_client = boto3.client(
        's3',
        endpoint_url=r2_endpoint,
        aws_access_key_id=config.r2_access_key_id,
        aws_secret_access_key=config.r2_secret_access_key,
        config=Config(signature_version='s3v4'),
        region_name='auto'  # R2 uses 'auto' region
    )

    self.bucket_name = config.r2_bucket_name
    logger.info(f"✅ R2 storage client initialized (bucket: {self.bucket_name})")
```

**STEP 3: TEST**
```python
# Test in Python shell
from app.services.storage_service import StorageService

storage = StorageService()
print(f"✅ Storage service initialized: {storage.bucket_name}")
```

**DELIVERABLE:** Implemented `__init__` method

**VERIFICATION:**
- [ ] StorageService instantiates without errors
- [ ] boto3 client created successfully
- [ ] Bucket name stored correctly
- [ ] Logger outputs initialization message

**STOP:** Report completion

---

#### TASK 2E: Implement Path Generator Methods

**OBJECTIVE:** Implement the 3 path generator methods for organized folder structure

**CONTEXT:** Creates consistent S3 key paths: `clients/{slug}/screenshots/`, `clients/{slug}/workflows/`

**STEP 1: IMPLEMENT**
Update methods in `app/services/storage_service.py`:
```python
def get_client_base_path(self, client_slug: str) -> str:
    """Generate base path for client folder"""
    return f"clients/{client_slug}"

def get_screenshot_path(
    self,
    client_slug: str,
    page_id: uuid.UUID,
    full_page: bool = False
) -> str:
    """Generate S3 key for screenshot"""
    suffix = "full" if full_page else "thumb"
    return f"{self.get_client_base_path(client_slug)}/screenshots/{page_id}_{suffix}.png"

def get_workflow_output_path(
    self,
    client_slug: str,
    workflow_name: str,
    timestamp: datetime,
    file_extension: str
) -> str:
    """Generate S3 key for workflow output"""
    timestamp_str = timestamp.strftime("%Y%m%d_%H%M%S")
    return f"{self.get_client_base_path(client_slug)}/workflows/{workflow_name}/{timestamp_str}.{file_extension}"
```

**STEP 2: TEST**
```python
from app.services.storage_service import StorageService
from datetime import datetime
import uuid

storage = StorageService()

# Test screenshot path
page_id = uuid.uuid4()
screenshot_path = storage.get_screenshot_path("test-client", page_id, full_page=False)
print(f"Screenshot path: {screenshot_path}")
# Expected: clients/test-client/screenshots/<uuid>_thumb.png

# Test workflow path
workflow_path = storage.get_workflow_output_path(
    "test-client",
    "seo-audit",
    datetime.now(),
    "pdf"
)
print(f"Workflow path: {workflow_path}")
# Expected: clients/test-client/workflows/seo-audit/20251113_143022.pdf
```

**DELIVERABLE:** Implemented path generator methods

**VERIFICATION:**
- [ ] Paths follow expected format
- [ ] Client slug is properly included
- [ ] Timestamps formatted correctly (YYYYMMDD_HHMMSS)
- [ ] File extensions appended correctly

**STOP:** Report completion

---

#### TASK 2F: Implement upload_file Method

**OBJECTIVE:** Implement core file upload method to R2

**CONTEXT:** Base method that other upload methods will use

**STEP 1: IMPLEMENT**
Update `upload_file` in `app/services/storage_service.py`:
```python
async def upload_file(
    self,
    content: bytes,
    key: str,
    content_type: str = "application/octet-stream"
) -> str:
    """Upload file to R2, return S3 URI"""
    try:
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=content,
            ContentType=content_type
        )

        s3_uri = f"s3://{self.bucket_name}/{key}"
        logger.info(f"✅ Uploaded file to R2: {s3_uri}")
        return s3_uri

    except Exception as e:
        logger.error(f"❌ Failed to upload file to R2: {key} - {str(e)}")
        raise
```

**STEP 2: TEST**
```python
from app.services.storage_service import StorageService

storage = StorageService()

# Test upload
test_content = b"This is a test file"
s3_uri = await storage.upload_file(
    content=test_content,
    key="test/sample.txt",
    content_type="text/plain"
)

print(f"Uploaded to: {s3_uri}")
# Expected: s3://delorme-os-storage/test/sample.txt
```

**DELIVERABLE:** Implemented `upload_file` method

**VERIFICATION:**
- [ ] File uploads successfully to R2
- [ ] Returns correct S3 URI format
- [ ] Content-Type header set correctly
- [ ] Errors logged appropriately
- [ ] Exception raised on failure

**STOP:** Report completion and show test results

---

#### TASK 2G: Implement upload_screenshot Method

**OBJECTIVE:** Implement specialized screenshot upload method

**CONTEXT:** Wrapper around upload_file with screenshot-specific logic

**STEP 1: IMPLEMENT**
Update `upload_screenshot` in `app/services/storage_service.py`:
```python
async def upload_screenshot(
    self,
    client_slug: str,
    page_id: uuid.UUID,
    image_bytes: bytes,
    full_page: bool = False
) -> str:
    """Upload screenshot to R2"""
    key = self.get_screenshot_path(client_slug, page_id, full_page)

    return await self.upload_file(
        content=image_bytes,
        key=key,
        content_type="image/png"
    )
```

**STEP 2: TEST**
```python
import uuid
from app.services.storage_service import StorageService

storage = StorageService()

# Create fake image bytes (1x1 transparent PNG)
fake_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'

page_id = uuid.uuid4()
s3_uri = await storage.upload_screenshot(
    client_slug="test-client",
    page_id=page_id,
    image_bytes=fake_image,
    full_page=False
)

print(f"Screenshot uploaded: {s3_uri}")
# Expected: s3://delorme-os-storage/clients/test-client/screenshots/<uuid>_thumb.png
```

**DELIVERABLE:** Implemented `upload_screenshot` method

**VERIFICATION:**
- [ ] Screenshot uploads to correct path
- [ ] Content-Type is image/png
- [ ] S3 URI follows expected format
- [ ] Both thumb and full versions work

**STOP:** Report completion

---

#### TASK 2H: Implement download_file Method

**OBJECTIVE:** Implement file download from R2

**CONTEXT:** Retrieve file contents from R2 by key

**STEP 1: IMPLEMENT**
Update `download_file` in `app/services/storage_service.py`:
```python
async def download_file(self, key: str) -> bytes:
    """Download file from R2"""
    try:
        response = self.s3_client.get_object(
            Bucket=self.bucket_name,
            Key=key
        )

        file_bytes = response['Body'].read()
        logger.info(f"✅ Downloaded file from R2: {key} ({len(file_bytes)} bytes)")
        return file_bytes

    except self.s3_client.exceptions.NoSuchKey:
        logger.error(f"❌ File not found in R2: {key}")
        raise FileNotFoundError(f"File not found: {key}")
    except Exception as e:
        logger.error(f"❌ Failed to download file from R2: {key} - {str(e)}")
        raise
```

**STEP 2: TEST**
```python
from app.services.storage_service import StorageService

storage = StorageService()

# Download the file we uploaded in Task 2F
file_bytes = await storage.download_file("test/sample.txt")
print(f"Downloaded: {file_bytes.decode('utf-8')}")
# Expected: "This is a test file"

# Test non-existent file
try:
    await storage.download_file("nonexistent/file.txt")
except FileNotFoundError as e:
    print(f"✅ Correctly raised FileNotFoundError: {e}")
```

**DELIVERABLE:** Implemented `download_file` method

**VERIFICATION:**
- [ ] Downloads existing files successfully
- [ ] Returns bytes content
- [ ] Raises FileNotFoundError for missing files
- [ ] Logs download size
- [ ] Handles S3 errors gracefully

**STOP:** Report completion

---

#### TASK 2I: Implement generate_presigned_url Method

**OBJECTIVE:** Generate temporary download URLs for secure file access

**CONTEXT:** Presigned URLs allow frontend to download files directly from R2 without exposing credentials

**STEP 1: IMPLEMENT**
Update `generate_presigned_url` in `app/services/storage_service.py`:
```python
async def generate_presigned_url(
    self,
    key: str,
    expiration: int = 3600
) -> str:
    """Generate presigned URL for temporary access (default 1 hour)"""
    try:
        url = self.s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': self.bucket_name,
                'Key': key
            },
            ExpiresIn=expiration
        )

        logger.info(f"✅ Generated presigned URL for: {key} (expires in {expiration}s)")
        return url

    except Exception as e:
        logger.error(f"❌ Failed to generate presigned URL: {key} - {str(e)}")
        raise
```

**STEP 2: TEST**
```python
from app.services.storage_service import StorageService
import requests

storage = StorageService()

# Generate presigned URL
url = await storage.generate_presigned_url("test/sample.txt", expiration=60)
print(f"Presigned URL: {url}")

# Test download via URL
response = requests.get(url)
print(f"Downloaded via presigned URL: {response.text}")
# Expected: "This is a test file"

# URL should contain expiration parameter
assert "X-Amz-Expires=60" in url or "Expires" in url
```

**DELIVERABLE:** Implemented `generate_presigned_url` method

**VERIFICATION:**
- [ ] URL generated successfully
- [ ] URL is accessible without authentication
- [ ] Expiration parameter present in URL
- [ ] Downloaded content matches uploaded content
- [ ] URL expires after specified time (wait 60s and retry)

**STOP:** Report completion

---

#### TASK 2J: Implement delete_file Method

**OBJECTIVE:** Delete individual files from R2

**CONTEXT:** Needed for cleanup and GDPR compliance

**STEP 1: IMPLEMENT**
Update `delete_file` in `app/services/storage_service.py`:
```python
async def delete_file(self, key: str) -> None:
    """Delete file from R2"""
    try:
        self.s3_client.delete_object(
            Bucket=self.bucket_name,
            Key=key
        )

        logger.info(f"✅ Deleted file from R2: {key}")

    except Exception as e:
        logger.error(f"❌ Failed to delete file from R2: {key} - {str(e)}")
        raise
```

**STEP 2: TEST**
```python
from app.services.storage_service import StorageService

storage = StorageService()

# Delete test file
await storage.delete_file("test/sample.txt")

# Verify deletion
try:
    await storage.download_file("test/sample.txt")
    print("❌ File still exists!")
except FileNotFoundError:
    print("✅ File successfully deleted")
```

**DELIVERABLE:** Implemented `delete_file` method

**VERIFICATION:**
- [ ] File deleted successfully
- [ ] No error if file doesn't exist (idempotent)
- [ ] Download attempt raises FileNotFoundError after deletion

**STOP:** Report completion

---

#### TASK 2K: Implement delete_client_folder Method

**OBJECTIVE:** Delete entire client folder for GDPR compliance

**CONTEXT:** When client is deleted, all their files must be removed from R2

**STEP 1: IMPLEMENT**
Update `delete_client_folder` in `app/services/storage_service.py`:
```python
async def delete_client_folder(self, client_slug: str) -> None:
    """Delete entire client folder (for GDPR compliance)"""
    prefix = f"{self.get_client_base_path(client_slug)}/"

    try:
        # List all objects in client folder
        paginator = self.s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=self.bucket_name, Prefix=prefix)

        delete_count = 0
        for page in pages:
            if 'Contents' in page:
                # Delete in batches of 1000 (S3 limit)
                objects_to_delete = [{'Key': obj['Key']} for obj in page['Contents']]

                if objects_to_delete:
                    self.s3_client.delete_objects(
                        Bucket=self.bucket_name,
                        Delete={'Objects': objects_to_delete}
                    )
                    delete_count += len(objects_to_delete)

        logger.info(f"✅ Deleted {delete_count} files from client folder: {client_slug}")

    except Exception as e:
        logger.error(f"❌ Failed to delete client folder: {client_slug} - {str(e)}")
        raise
```

**STEP 2: TEST**
```python
from app.services.storage_service import StorageService
import uuid

storage = StorageService()

# Upload multiple test files
for i in range(3):
    page_id = uuid.uuid4()
    await storage.upload_screenshot(
        "test-client-delete",
        page_id,
        b"fake image data",
        full_page=False
    )

# Delete entire folder
await storage.delete_client_folder("test-client-delete")

# Verify folder is empty
# (List objects with prefix should return empty)
response = storage.s3_client.list_objects_v2(
    Bucket=storage.bucket_name,
    Prefix="clients/test-client-delete/"
)
assert 'Contents' not in response, "❌ Folder not empty!"
print("✅ Client folder successfully deleted")
```

**DELIVERABLE:** Implemented `delete_client_folder` method

**VERIFICATION:**
- [ ] All files in client folder deleted
- [ ] Handles folders with 1000+ files (pagination)
- [ ] No error if folder is empty
- [ ] Returns count of deleted files

**STOP:** Report completion

---

#### TASK 2L: Add Unit Tests for StorageService

**OBJECTIVE:** Create comprehensive unit tests for all StorageService methods

**CONTEXT:** Ensure storage service works correctly before using in production

**STEP 1: CREATE TEST FILE**
Create `tests/unit/test_storage_service.py`:
```python
import pytest
import uuid
from app.services.storage_service import StorageService

@pytest.fixture
def storage():
    """Create storage service instance"""
    return StorageService()

@pytest.mark.asyncio
async def test_upload_and_download(storage):
    """Test file upload and download"""
    # Upload
    test_content = b"Test file content"
    key = "test/upload_test.txt"
    s3_uri = await storage.upload_file(test_content, key, "text/plain")

    assert s3_uri.startswith("s3://")

    # Download
    downloaded = await storage.download_file(key)
    assert downloaded == test_content

    # Cleanup
    await storage.delete_file(key)

@pytest.mark.asyncio
async def test_screenshot_upload(storage):
    """Test screenshot upload with path generation"""
    fake_image = b"fake png data"
    page_id = uuid.uuid4()

    s3_uri = await storage.upload_screenshot(
        "test-client",
        page_id,
        fake_image,
        full_page=False
    )

    assert "clients/test-client/screenshots" in s3_uri
    assert str(page_id) in s3_uri
    assert "_thumb.png" in s3_uri

@pytest.mark.asyncio
async def test_presigned_url(storage):
    """Test presigned URL generation"""
    # Upload test file
    key = "test/presigned_test.txt"
    await storage.upload_file(b"Test content", key)

    # Generate presigned URL
    url = await storage.generate_presigned_url(key, expiration=300)

    assert url.startswith("https://")
    assert "Expires" in url or "X-Amz-Expires" in url

    # Cleanup
    await storage.delete_file(key)

@pytest.mark.asyncio
async def test_file_not_found(storage):
    """Test FileNotFoundError for missing files"""
    with pytest.raises(FileNotFoundError):
        await storage.download_file("nonexistent/file.txt")
```

**STEP 2: RUN TESTS**
```bash
poetry run pytest tests/unit/test_storage_service.py -v
```

**DELIVERABLE:** `tests/unit/test_storage_service.py` with passing tests

**VERIFICATION:**
- [ ] All tests pass
- [ ] Upload/download cycle works
- [ ] Screenshot path generation correct
- [ ] Presigned URLs functional
- [ ] FileNotFoundError raised appropriately

**STOP:** Report test results

---

### 🔄 SPRINT 3: Database & Workflows (P1 Priority) - 15 tasks

#### TASK 3A: Design WorkflowOutput Model

**OBJECTIVE:** Design database model for tracking n8n workflow executions

**CONTEXT:** Need to store workflow trigger data, outputs, and status

**AGENT:** `strategic-architect`

**REFERENCE MODELS:**
- `ResearchRequest` (app/models.py:325-383) - Similar async workflow pattern
- `CrawlRun` (app/models.py:443-485) - Status tracking pattern
- `Purchase` (app/models.py:53-68) - Simple transaction record

**DESIGN REQUIREMENTS:**
- Track which user triggered workflow
- Store workflow name and n8n webhook ID
- Track status (pending, processing, completed, failed)
- Store S3 path to output file
- Store input parameters and preview data (JSON)
- Link to Client model
- Timestamps for created_at and completed_at

**DELIVERABLE:** Model design specification

**VERIFICATION:**
- [ ] Follows existing model patterns
- [ ] All required fields identified
- [ ] Relationships defined
- [ ] Indexes specified

**STOP:** Show design spec for approval

---

#### TASK 3B: Implement WorkflowOutput Model

**OBJECTIVE:** Add WorkflowOutput model to app/models.py

**CONTEXT:** Based on approved design from Task 3A

**STEP 1: IMPLEMENT**
Add to `app/models.py` (after ResearchChatMessage model, around line 438):
```python
class WorkflowOutput(UUIDModelBase, table=True):
    """
    Model representing n8n workflow execution outputs.
    Tracks workflow triggers, status, and stores references to output files in R2.
    """
    __tablename__ = "workflow_output"

    # Relationships
    client_id: uuid.UUID = Field(foreign_key="client.id", nullable=False, index=True)
    triggered_by: uuid.UUID = Field(foreign_key="user.id", nullable=False)

    # Workflow identification
    workflow_name: str = Field(nullable=False, index=True)
    # Examples: "seo-audit", "performance-dashboard", "content-gap-analysis"

    workflow_id: str = Field(nullable=False)
    # n8n webhook ID or workflow identifier

    # Input parameters (stored as JSON)
    input_params: dict = Field(default={}, sa_column=Column(JSON))
    # Example: {"pages": ["url1", "url2"], "focus": "technical-seo"}

    # Status tracking
    status: str = Field(default="pending", nullable=False, index=True)
    # "pending", "processing", "completed", "failed"

    # Output storage
    output_type: Optional[str] = Field(default=None)
    # "pdf", "json", "markdown", "csv", "zip"

    s3_path: Optional[str] = Field(default=None)
    # S3 URI: "s3://bucket/clients/slug/workflows/name/timestamp.pdf"

    # Quick preview data (optional, for dashboard display without downloading file)
    preview_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    # Example: {"summary": "Found 15 issues", "priority_issues": 8, "pages_analyzed": 42}

    # Error tracking
    error_message: Optional[str] = Field(default=None, sa_column=Column(sa.Text))

    # Timestamps
    created_at: datetime.datetime = Field(default_factory=get_utcnow, nullable=False)
    completed_at: Optional[datetime.datetime] = Field(default=None)

    # Relationships
    client: "Client" = Relationship(back_populates="workflow_outputs")
    user: "User" = Relationship(back_populates="workflow_outputs")

    # Composite index for efficient queries
    __table_args__ = (
        sa.Index("ix_workflow_output_client_workflow", "client_id", "workflow_name"),
        sa.Index("ix_workflow_output_client_status", "client_id", "status"),
    )
```

**STEP 2: ADD RELATIONSHIPS**
Add to Client model (around line 217):
```python
workflow_outputs: List["WorkflowOutput"] = Relationship(
    back_populates="client",
    sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"}
)
```

Add to User model (around line 51):
```python
workflow_outputs: List["WorkflowOutput"] = Relationship(
    back_populates="user",
    sa_relationship_kwargs={"lazy": "selectin"}
)
```

**DELIVERABLE:** Modified `app/models.py` with WorkflowOutput model

**VERIFICATION:**
- [ ] Model imports without errors
- [ ] All fields typed correctly
- [ ] Relationships bidirectional
- [ ] Indexes defined

**STOP:** Report completion

---

#### TASK 3C: Create Database Migration for WorkflowOutput

**OBJECTIVE:** Generate Alembic migration for workflow_output table

**CONTEXT:** Add new table to database schema

**STEP 1: CREATE MIGRATION**
```bash
task db:migrate-create -- "add_workflow_output_table"
```

**STEP 2: REVIEW MIGRATION**
Check generated file in `migrations/versions/xxx_add_workflow_output_table.py`:
- Verify table creation includes all columns
- Verify foreign keys to client and user tables
- Verify indexes created

**STEP 3: RUN MIGRATION**
```bash
task db:migrate-up
```

**STEP 4: VERIFY**
```bash
# Connect to database and verify table
poetry run python -c "
from app.models import WorkflowOutput
print('✅ WorkflowOutput model imported successfully')
"

# Check table structure in database
psql -d delorme-os -c "\d+ workflow_output"
```

**DELIVERABLE:**
- Migration file in `migrations/versions/`
- Database updated with workflow_output table

**VERIFICATION:**
- [ ] Migration generated successfully
- [ ] Migration runs without errors
- [ ] Table exists in database
- [ ] All columns present
- [ ] Foreign keys defined
- [ ] Indexes created

**STOP:** Report completion and show table structure

---

(Tasks 3D through 5N continue in similar PAD format... Due to length constraints, I'll summarize the remaining sprints)

---

## Remaining Sprints Summary

### SPRINT 3 (continued): Database & Workflows
- Tasks 3D-3O: WorkflowService implementation, API endpoints, testing (12 tasks)

### SPRINT 4: Frontend Redesign
- Tasks 4A-4M: Remove Projects, implement Engine UI, Workflows components (13 tasks)

### SPRINT 5: Deployment & Testing
- Tasks 5A-5N: Supabase migration, Vercel deployment, monitoring, tests (14 tasks)

---

## Dependencies Graph

```
Sprint 1 (Security) → Must complete before any new features
  └─> Sprint 2 (Storage) → Required for Sprint 3
       └─> Sprint 3 (Workflows) → Required for Sprint 4
            └─> Sprint 4 (Frontend) → Required for Sprint 5
                 └─> Sprint 5 (Deploy) → Final
```

**Critical Path:**
1A → 1B → 1C (Security) → 2A → 2B → 2C-2L (Storage) → 3A-3O (Workflows) → 4A-4M (Frontend) → 5A-5N (Deploy)

**Parallel Opportunities:**
- Tasks 1A, 1B can run in parallel
- Tasks 2D-2K can run in parallel after 2C
- Frontend tasks 4A-4F can run in parallel after API client generated

---

## Risk Assessment

### High-Risk Tasks (Extra Validation Required)

**TASK 3C: Database Migration**
- **Risk**: Migration could fail on production database
- **Mitigation**: Always backup before migration, test on staging first
- **Rollback**: `task db:rollback` to revert

**TASK 5D: Supabase Migration**
- **Risk**: Data loss during database transfer
- **Mitigation**: Export full PostgreSQL dump before migration, verify row counts match
- **Rollback**: Restore from backup, revert DNS

**TASK 5I: Vercel Deployment**
- **Risk**: Frontend might not connect to backend after deployment
- **Mitigation**: Test API URLs in environment variables, verify CORS settings
- **Rollback**: Vercel instant rollback to previous deployment

### Medium-Risk Tasks

**TASK 2F-2I: R2 Integration**
- **Risk**: R2 credentials might not work or have insufficient permissions
- **Mitigation**: Test uploads with small files first, verify bucket permissions
- **Fallback**: Use local storage temporarily with feature flag

**TASK 4D: Delete Projects Pages**
- **Risk**: Breaking existing functionality
- **Mitigation**: Verify no references to Project routes remain, check all imports
- **Rollback**: Git revert commit

---

## Current Status

**Phase**: Planning Complete
**Next**: Awaiting user approval to begin Sprint 1
**Estimated Start**: Immediate upon approval
**Estimated Completion**: 8-10 weeks (assuming 5-10 hours/week)

---

## Commands Reference

**Start Sprint 1:**
```
Begin Sprint 1 security fixes
```

**Skip a task:**
```
Skip task 2C and continue
```

**Retry failed task:**
```
Retry task 3C with backup
```

**Check status:**
```
Show current progress
```

**Pause:**
```
Pause after current task
```

---

## Notes

- Total: 58 micro-tasks across 5 sprints
- Each task: 30-60 minutes estimated
- Total effort: ~40-50 hours
- Calendar time: 8-10 weeks at 5-10 hours/week
- All tasks follow PAD methodology: one objective, testable, verifiable

**Ready to begin?** Approve this plan and I'll start with Task 1A: JWT Secret Validation
