# Create New API Endpoint

Create a complete FastAPI endpoint following the clean architecture pattern.

**Arguments**: `$ARGUMENTS` - Description of the endpoint (e.g., "GET /api/users/{id}/stats returns user statistics")

## Steps:

1. **Define Pydantic Schemas** (`app/schemas/`)
   - Create request model (if POST/PUT)
   - Create response model
   - Add proper validation and field descriptions

2. **Implement Service Layer** (`app/services/`)
   - Create or update service class
   - Add business logic method
   - Handle validation and errors
   - Use proper type hints and async/await

3. **Create Controller Endpoint** (`app/controllers/`)
   - Add route handler with proper HTTP method
   - Use dependency injection for service
   - Handle authentication with `Depends(get_current_user)`
   - Convert service exceptions to HTTP responses
   - Add proper response_model and status codes

4. **Register Router** (if new controller)
   - Import router in `main.py`
   - Register with `app.include_router()`

5. **Generate Frontend Client**
   - Run: `task frontend:generate-client`
   - Verify generated TypeScript types

6. **Create React Query Hook** (`frontend/src/hooks/api/`)
   - Create custom hook using generated service
   - Add error handling with `useErrorHandler`
   - Configure query/mutation options

7. **Write Tests**
   - Unit tests for service logic
   - Integration tests for endpoint
   - Test error cases and edge conditions

## Example:

For: "GET /api/articles/{id}/analytics returns article view count and engagement"

Follow the existing patterns in:
- `app/schemas/article.py` - for schemas
- `app/services/article_service.py` - for service
- `app/controllers/article.py` - for controller
- `frontend/src/hooks/api/useArticles.ts` - for hook

Remember: Controllers → Services → Models pattern!

