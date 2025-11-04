# CraftYourStartup Boilerplate - Claude Code Context

This file provides Claude with essential project context for optimal code generation and assistance.

## Project Overview

Full-stack SaaS boilerplate with FastAPI backend, React frontend, Stripe payments, and comprehensive authentication system. Built for rapid startup development with production-ready patterns.

**Stack:**
- Backend: FastAPI 0.115+ + SQLModel + PostgreSQL + Alembic
- Frontend: React 18 + TypeScript + Vite + Material-UI v6
- Auth: JWT + Google OAuth
- Payments: Stripe (subscriptions + one-time)
- State: TanStack React Query + Context API
- Dev: Poetry + Task runner + Auto environment loading

## Common Bash Commands

### Development
```bash
# Backend (always use Poetry)
poetry install                          # Install dependencies
poetry run uvicorn main:app --reload    # Start backend dev server
task run-backend                        # Alternative using task runner

# Frontend
cd frontend && npm install              # Install dependencies
npm run dev                            # Start frontend dev server (port 5173)
task run-frontend                      # Alternative using task runner

# Database
docker-compose up -d                   # Start PostgreSQL
task db:migrate-up                     # Run Alembic migrations
task db:migrate-create -- "description" # Create new migration
task db:user-create -- --email EMAIL   # Create superuser
```

### API Client Generation
```bash
task frontend:generate-client          # Generate TypeScript client from OpenAPI
# Run this after ANY backend API changes!
```

### Testing
```bash
poetry run pytest                      # Run backend tests
cd frontend && npm run test            # Run frontend tests
task quality:test                      # Run all tests
```

### Linting & Quality
```bash
poetry run ruff check .                # Python linting
cd frontend && npm run lint            # Frontend linting
task quality:lint                      # Lint everything
```

## Core Files & Directory Structure

### Backend (`app/`)
- `main.py` - FastAPI app with router registration
- `db.py` - Database session management
- `models.py` - SQLModel database models (User, Article, Purchase, Subscription)
- `permissions.py` - PlanType enum, FeaturePermission enum, RBAC system
- `auth_backend.py` - JWT authentication with HTTPBearer
- `config/base.py` - Base configuration (auto environment loading)
- `config/payments.py` - Stripe configuration
- `controllers/` - API endpoints (auth, article, payments, analytics, integrations, plans, upgrades)
- `services/` - Business logic (payment_manager, webhook_handler, oauth_service, etc.)
- `schemas/` - Pydantic request/response models
- `core/exceptions.py` - Custom exception classes
- `core/access_control.py` - Permission checking decorators
- `admin.py` - SQLAdmin panel with custom dashboards

### Frontend (`frontend/src/`)
- `App.tsx` - Main app with routing
- `main.tsx` - Entry point with providers
- `client/` - Auto-generated TypeScript API client
- `pages/` - Route components (Dashboard, Articles, Billing, Analytics, etc.)
- `components/` - Reusable UI components
- `components/ui/` - Layout components (DashboardLayout, Header, etc.)
- `hooks/api/` - React Query hooks for API calls
- `theme/` - MUI theme system (light + dark mode)
- `context/` - React Context providers
- `utils/errorHandler.ts` - Centralized error handling

### Configuration
- `local.env` - Development environment variables
- `prod.env` - Production environment variables
- `pyproject.toml` - Poetry dependencies
- `Taskfile.yml` - Task runner commands
- `alembic.ini` - Database migration config
- `docker-compose.yml` - PostgreSQL service

## Code Style Guidelines

### Python (Backend)
- **Clean Architecture**: Controllers → Services → Models
- **Type hints**: Always use type hints for function parameters and returns
- **Async/Await**: Use `async def` for all route handlers and database operations
- **Dependency Injection**: Use FastAPI's `Depends()` for services and database sessions
- **Error Handling**: Raise specific exceptions from services, convert to HTTP in controllers
- **Imports**: Group imports (stdlib, third-party, local) with blank lines between
- **Naming**: 
  - `snake_case` for functions, variables, file names
  - `PascalCase` for classes
  - `UPPER_CASE` for constants

**Example Service Pattern:**
```python
class ArticleService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_article(self, article_data: ArticleCreate, user_id: uuid.UUID) -> ArticleRead:
        # Validation
        if len(article_data.title.strip()) < 3:
            raise ValidationException("Title must be at least 3 characters")
        
        # Business logic
        article = Article(**article_data.model_dump(), user_id=user_id)
        self.db.add(article)
        await self.db.commit()
        await self.db.refresh(article)
        
        return ArticleRead.model_validate(article)
```

### TypeScript (Frontend)
- **Strict mode**: All TypeScript strict checks enabled
- **Functional components**: Use `React.FC<Props>` with typed props
- **Hooks first**: Use hooks at the top of components
- **Error handling**: Use `useErrorHandler` hook for all API errors
- **Imports**: Use `@/` path alias for absolute imports
- **Naming**:
  - `PascalCase` for components, interfaces, types
  - `camelCase` for functions, variables
  - `UPPER_CASE` for constants

**Example Component Pattern:**
```typescript
interface MyComponentProps {
  title: string;
  onSave: (data: FormData) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onSave }) => {
  const { data, isLoading, error } = useQuery();
  const { handleApiError } = useErrorHandler();
  
  if (error) {
    handleApiError(error);
    return null;
  }
  
  return (
    <Container>
      {isLoading ? <CircularProgress /> : <Content />}
    </Container>
  );
};

export default MyComponent;
```

## Testing Instructions

### Backend Tests (pytest)
- Location: `tests/unit/`, `tests/integration/`
- Run: `poetry run pytest`
- Use fixtures from `tests/conftest.py`
- Test services independently with mock database
- Test controllers with FastAPI TestClient

### Frontend Tests (Vitest + React Testing Library)
- Location: `frontend/src/**/*.test.tsx`
- Run: `cd frontend && npm run test`
- Mock API calls using React Query's QueryClient
- Test user interactions, not implementation details
- Use `renderWithProviders` helper for components needing context

## Repository Workflow

### Git Conventions
- Branch naming: `feature/description`, `fix/description`, `refactor/description`
- Commit messages: Start with verb (Add, Fix, Update, Remove, Refactor)
- PR workflow: Create branch, make changes, push, create PR

### Before Committing
1. Run linters: `task quality:lint`
2. Run tests: `task quality:test`
3. Regenerate API client if backend changed: `task frontend:generate-client`
4. Ensure migrations are created for model changes: `task db:migrate-create`

## Stripe Integration Patterns

### Adding New Payment Features
1. Define product/price in Stripe Dashboard or `app/commands/setup_stripe_products.py`
2. Add price ID to `app/config/payments.py`
3. Create checkout session in `app/services/payment_manager.py`
4. Handle webhook events in `app/services/webhook_handler.py`
5. Update frontend in `frontend/src/hooks/api/usePayments.ts`

### Webhook Testing
- Use Stripe CLI: `stripe listen --forward-to localhost:8000/api/payments/webhook`
- Test events: `stripe trigger payment_intent.succeeded`

## Analytics Extension Patterns

### Adding New Analytics Endpoints
1. Define endpoint in `app/controllers/analytics.py`
2. Add business logic in `app/services/analytics_service.py`
3. Check permissions using `@require_permission` decorator
4. Create frontend hook in `frontend/src/hooks/api/useAnalytics.ts`
5. Add UI component in `frontend/src/pages/Analytics.tsx`

## Common Pitfalls & Important Notes

### Backend
- **ALWAYS use AsyncSession** for database operations, not Session
- **NEVER commit sensitive data** (API keys, passwords) - use environment variables
- **ALWAYS validate input** in service layer before database operations
- **Migrations**: Auto-generate with `--autogenerate`, then review before applying
- **OAuth redirect URI**: Must EXACTLY match what's in Google Cloud Console
- **Stripe webhooks**: Must verify signature using webhook secret

### Frontend
- **ALWAYS regenerate API client** after backend changes
- **NEVER store sensitive data** in localStorage (use httpOnly cookies for tokens)
- **Error handling**: Use `useErrorHandler` hook, don't catch errors individually
- **API calls**: Use React Query hooks from `hooks/api/`, don't call services directly
- **Theme**: Use MUI `sx` prop with theme values, avoid inline styles
- **Routing**: Use `navigate()` from react-router, not `window.location`

## MUI Theming Conventions

### Using the Theme System
- Light + Dark mode support via `useTheme()` hook
- Access theme values: `theme.palette.primary.main`, `theme.spacing(2)`
- Responsive: `theme.breakpoints.down('md')` for mobile
- Use `sx` prop for styling with theme access

### Standard Components
- Buttons: Use `StandardButton`, `CTAButton`, not raw `Button`
- Cards: Use `ModernCard` component with consistent styling
- Forms: Use `InputText` component from `components/ui/forms/`
- Layouts: Use `MainLayout`, `DashboardLayout`, `AuthLayout`

## RBAC System Usage

### Checking Permissions
```python
# Backend - in service layer
from app.core.access_control import PlanChecker, get_user_current_plan

current_plan = await get_user_current_plan(user, db)
checker = PlanChecker(user, db, current_plan)
checker.require_permission(FeaturePermission.ADVANCED_ANALYTICS)  # Raises HTTPException if no access
```

```typescript
// Frontend - using PermissionGuard component
<PermissionGuard feature="advanced_analytics">
  <AdvancedAnalytics />
</PermissionGuard>
```

### Adding New Features to RBAC
1. Add to `FeaturePermission` enum in `app/permissions.py`
2. Add to `PLAN_FEATURES` mapping for appropriate plans
3. Use `@require_permission` decorator on controller endpoint
4. Use `<PermissionGuard>` in frontend for UI
5. Test with different plan types

## Environment & Configuration

### Automatic Environment Loading
- NO manual sourcing required
- Task commands auto-load `local.env` by default
- Set `ENV_FILE=prod.env` to use production config
- All commands: `task run-backend`, `poetry run python dev.py server`, etc.

### Adding New Config Values
1. Add to `app/config/base.py` or `app/config/payments.py`
2. Add to `local.env.example` and `prod.env.example`
3. Update local.env with actual value
4. Access via `from app.config.base import config; config.your_value`

## Database Patterns

### Creating New Models
1. Add SQLModel class to `app/models.py`
2. Define relationships using `Relationship()`
3. Create migration: `task db:migrate-create -- "add model name"`
4. Review generated migration in `migrations/versions/`
5. Apply migration: `task db:migrate-up`

### Query Patterns
```python
# Use select() for queries
from sqlmodel import select

# Simple query
articles = await db.execute(select(Article).where(Article.user_id == user_id))
articles = articles.scalars().all()

# With relationships (use selectinload for eager loading)
from sqlalchemy.orm import selectinload
users = await db.execute(select(User).options(selectinload(User.articles)))
```

## Development Workflow

### Adding New API Endpoint
1. Define Pydantic schemas in `app/schemas/`
2. Add business logic in `app/services/`
3. Create controller endpoint in `app/controllers/`
4. Register router in `main.py` if new controller
5. **IMPORTANT**: Run `task frontend:generate-client`
6. Create React Query hook in `frontend/src/hooks/api/`
7. Use hook in component

### Adding New React Page
1. Create page in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add navigation link in `DashboardLayout.tsx` (if dashboard page)
4. Create any needed API hooks
5. Use `ErrorBoundary` for error handling
6. Test with different user roles/plans

## Important Commands to Remember

```bash
# Start everything
task db:docker-start && task run-backend & task run-frontend

# Reset database
docker-compose down -v && docker-compose up -d && task db:migrate-up

# Create superuser
task db:user-create -- --email admin@example.com --password admin123 --full_name "Admin User"

# Setup Stripe products
task payments:setup

# Health check
task health-check

# Generate API client (after ANY backend API change)
task frontend:generate-client
```

## When Making Changes

**ALWAYS:**
- Follow the clean architecture pattern (Controllers → Services → Models)
- Use type hints in Python, strict typing in TypeScript
- Handle errors properly (raise in services, catch in controllers)
- Write tests for new features
- Update API client after backend changes
- Check permissions for protected features
- Use environment variables for configuration
- Commit with descriptive messages

**NEVER:**
- Commit sensitive data (use .env files)
- Skip migrations for model changes
- Use raw SQL queries (use SQLModel)
- Store tokens in localStorage (use httpOnly cookies)
- Forget to regenerate frontend client after backend changes
- Bypass error handling or permission checks

---

**Note**: This is a production-ready boilerplate. All patterns are battle-tested and follow industry best practices. When extending features, follow existing patterns for consistency.

