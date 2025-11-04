# Fix Linting Issues

Automatically fix linting errors in backend and frontend code.

**Arguments**: `$ARGUMENTS` (optional) - Specific file path or "all" for everything

## Quick Fixes:

```bash
# Auto-fix Python linting
poetry run ruff check . --fix

# Auto-fix TypeScript linting
cd frontend && npm run lint:fix

# Fix all (backend + frontend)
task quality:lint-fix
```

## Step-by-Step Process:

### 1. Check Current Issues
```bash
# Backend
poetry run ruff check .

# Frontend
cd frontend && npm run lint
```

### 2. Auto-Fix What's Possible
```bash
# Backend
poetry run ruff check . --fix

# Frontend
cd frontend && npm run lint:fix
```

### 3. Manual Fixes for Remaining Issues

Review output and fix manually:
- Unused imports
- Type errors
- Complex rule violations
- Logic issues

### 4. Verify Fixes
```bash
poetry run ruff check .
cd frontend && npm run lint
```

## Common Linting Issues:

### Backend (Python/Ruff):

**Unused imports:**
```python
# Before
from app.models import User, Article, Purchase
# After (if Purchase unused)
from app.models import User, Article
```

**Line too long:**
```python
# Before
def my_function(param1, param2, param3, param4, param5, param6):
# After
def my_function(
    param1, param2, param3,
    param4, param5, param6
):
```

**Import order:**
```python
# Correct order:
# 1. Standard library
import os
from datetime import datetime

# 2. Third-party
from fastapi import APIRouter
from sqlmodel import Session

# 3. Local
from app.models import User
from app.services import UserService
```

### Frontend (TypeScript/ESLint):

**Unused variables:**
```typescript
// Before
const [data, setData] = useState();  // setData unused
// After
const [data] = useState();
```

**Missing types:**
```typescript
// Before
const handleClick = (e) => {}
// After
const handleClick = (e: React.MouseEvent) => {}
```

**React hooks dependencies:**
```typescript
// Before
useEffect(() => {
  fetchData(userId);
}, []);  // Missing userId dependency
// After
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

## Bulk Fixing Strategy:

For many errors, use this workflow:

1. **Create error list:**
   ```bash
   poetry run ruff check . > lint_errors.txt
   ```

2. **Group by type:**
   - Read `lint_errors.txt`
   - Identify common patterns
   - Fix one pattern at a time

3. **Use search & replace:**
   - For repetitive issues
   - Verify each change

4. **Test after fixes:**
   ```bash
   poetry run pytest
   cd frontend && npm run test
   ```

## Pre-commit Setup:

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
poetry run ruff check .
cd frontend && npm run lint
```

## Important Notes:

- **NEVER** disable linting rules without understanding why they exist
- **ALWAYS** run tests after fixing linting issues
- **AUTO-FIX** can sometimes introduce bugs - review changes
- **TYPE ERRORS** often indicate real bugs - don't ignore them

## Troubleshooting:

**Linter not finding all issues?**
```bash
# Clear cache
poetry run ruff clean
cd frontend && npm run lint -- --clear-cache
```

**False positives?**
```bash
# Ignore specific line
# type: ignore  # Python
// eslint-disable-next-line  // TypeScript
```

