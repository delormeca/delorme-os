# Run Tests

Execute test suite with proper configuration and reporting.

**Arguments**: `$ARGUMENTS` (optional) - Specific test path or options

## Quick Commands:

```bash
# Run all backend tests
poetry run pytest

# Run specific test file
poetry run pytest tests/unit/test_auth_controller.py

# Run specific test function
poetry run pytest tests/unit/test_auth_controller.py::test_login_success

# Run with coverage
poetry run pytest --cov=app --cov-report=html

# Run with verbose output
poetry run pytest -v

# Run all frontend tests
cd frontend && npm run test

# Run frontend tests in watch mode
cd frontend && npm run test -- --watch

# Run all tests (backend + frontend)
task quality:test
```

## Test Workflow:

### 1. Run Tests Before Changes
```bash
# Establish baseline
poetry run pytest
cd frontend && npm run test
```

### 2. Make Code Changes
- Modify code as needed
- Follow existing patterns

### 3. Run Affected Tests
```bash
# If backend changes
poetry run pytest tests/unit/test_<affected_module>.py

# If frontend changes
cd frontend && npm run test -- <ComponentName>
```

### 4. Run Full Suite
```bash
task quality:test
```

### 5. Check Coverage
```bash
poetry run pytest --cov=app --cov-report=term-missing
```

## Writing New Tests:

### Backend Test Pattern:
```python
# tests/unit/test_my_service.py
import pytest
from app.services.my_service import MyService

@pytest.mark.asyncio
async def test_my_function(db_session):
    service = MyService(db_session)
    result = await service.my_function("test_input")
    assert result.success is True
```

### Frontend Test Pattern:
```typescript
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('should handle click', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Test Debugging:

```bash
# Run with print statements visible
poetry run pytest -s

# Run with debugger
poetry run pytest --pdb

# Run only failed tests
poetry run pytest --lf

# Run tests matching pattern
poetry run pytest -k "test_auth"
```

## CI/CD Testing:

```bash
# Simulate CI environment
task quality:test
task quality:lint
```

## Common Issues:

**Tests failing after code changes?**
- Check fixtures in `tests/conftest.py`
- Verify database state
- Check for test interdependencies

**Import errors?**
- Ensure Poetry environment is active
- Run `poetry install`

**Frontend tests failing?**
- Check node_modules: `npm install`
- Clear cache: `npm run test -- --clearCache`

