import asyncio
import httpx


async def test_sitemap_validation():
    """Test the sitemap validation endpoint."""

    # Test with a real sitemap (cleio.com from requirements)
    test_urls = [
        "https://cleio.com/page-sitemap1.xml",  # Should succeed
        "https://cleio.com/nonexistent.xml",     # Should fail with NOT_FOUND
    ]

    async with httpx.AsyncClient() as client:
        # First, login to get auth cookie
        login_response = await client.post(
            "http://localhost:8000/api/auth/login",
            json={
                "email": "admin@admin.com",
                "password": "password"
            }
        )

        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            return

        cookies = login_response.cookies
        print("✓ Logged in successfully\n")

        # Test each sitemap URL
        for url in test_urls:
            print(f"Testing: {url}")
            response = await client.post(
                "http://localhost:8000/api/engine-setup/validate-sitemap",
                json={"sitemap_url": url},
                cookies=cookies
            )

            print(f"Status: {response.status_code}")
            data = response.json()
            print(f"Valid: {data.get('valid')}")
            print(f"URL Count: {data.get('url_count')}")
            print(f"Sitemap Type: {data.get('sitemap_type')}")
            print(f"Error Type: {data.get('error_type')}")
            print(f"Error Message: {data.get('error_message')}")
            print(f"Suggestion: {data.get('suggestion')}")
            print(f"Parse Time: {data.get('parse_time')}s")
            print("-" * 80)
            print()


if __name__ == "__main__":
    asyncio.run(test_sitemap_validation())
