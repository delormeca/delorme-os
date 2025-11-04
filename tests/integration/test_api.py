"""
Integration tests for API endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.integration
@pytest.mark.asyncio
async def test_health_check(test_client: AsyncClient):
    """Test that the application starts and responds to basic requests."""
    response = await test_client.get("/health")
    assert response.status_code == 200
    
    # Check the health response format
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "service" in data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_docs_endpoint(test_client: AsyncClient):
    """Test that API documentation is accessible."""
    response = await test_client.get("/docs")
    assert response.status_code == 200


@pytest.mark.integration
@pytest.mark.asyncio
async def test_openapi_spec(test_client: AsyncClient):
    """Test that OpenAPI specification is accessible."""
    response = await test_client.get("/openapi.json")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    
    # Basic structure validation
    openapi_spec = response.json()
    assert "openapi" in openapi_spec
    assert "info" in openapi_spec
    assert "paths" in openapi_spec


@pytest.mark.integration
@pytest.mark.asyncio
async def test_cors_headers(test_client: AsyncClient):
    """Test that CORS headers are properly configured."""
    # Test preflight OPTIONS request
    response = await test_client.options("/health", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type",
    })
    
    # CORS preflight should be handled (200 or 204)
    assert response.status_code in [200, 204]
    
    # Check CORS headers are present
    assert "access-control-allow-origin" in response.headers
    assert "access-control-allow-methods" in response.headers


@pytest.mark.integration
@pytest.mark.asyncio
async def test_auth_endpoints_exist(test_client: AsyncClient):
    """Test that authentication endpoints exist."""
    # Test signup endpoint exists
    response = await test_client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    })
    # Should return validation error or success, not 404
    assert response.status_code != 404
    
    # Test login endpoint exists
    response = await test_client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "testpass123"
    })
    # Should return validation error or auth error, not 404
    assert response.status_code != 404


@pytest.mark.integration
@pytest.mark.asyncio
async def test_api_routes_structure(test_client: AsyncClient):
    """Test that main API route groups are available."""
    openapi_response = await test_client.get("/openapi.json")
    openapi_spec = openapi_response.json()
    
    paths = openapi_spec.get("paths", {})
    
    # Check that main route groups exist
    auth_routes = [path for path in paths.keys() if "/api/auth/" in path]
    assert len(auth_routes) > 0, "Auth routes should exist"
    
    # Articles routes might exist
    article_routes = [path for path in paths.keys() if "/api/articles/" in path]
    # Don't assert on articles as they might not be in all versions 