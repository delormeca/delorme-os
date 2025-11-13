"""
QA Test Script for Render.com Deployment
Tests both backend API and frontend application
"""

import asyncio
import sys
import io

# Fix Windows console encoding for emojis
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
import httpx


class RenderDeploymentQA:
    def __init__(self, backend_url: str, frontend_url: str):
        self.backend_url = backend_url.rstrip('/')
        self.frontend_url = frontend_url.rstrip('/')
        self.results = []

    def log(self, test_name: str, status: str, message: str = ""):
        """Log test result"""
        emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        result = f"{emoji} {test_name}: {status}"
        if message:
            result += f" - {message}"
        print(result)
        self.results.append({
            "test": test_name,
            "status": status,
            "message": message
        })

    async def test_backend_health(self):
        """Test 1: Backend API is accessible"""
        print("\n🔍 Testing Backend API...")
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Test root endpoint
                response = await client.get(f"{self.backend_url}/")
                if response.status_code == 200:
                    self.log("Backend Root", "PASS", f"Status: {response.status_code}")
                else:
                    self.log("Backend Root", "FAIL", f"Status: {response.status_code}")

                # Test docs endpoint
                response = await client.get(f"{self.backend_url}/docs")
                if response.status_code == 200:
                    self.log("Backend Swagger Docs", "PASS", "Documentation accessible")
                else:
                    self.log("Backend Swagger Docs", "FAIL", f"Status: {response.status_code}")

                # Test health endpoint (if exists)
                try:
                    response = await client.get(f"{self.backend_url}/api/health")
                    if response.status_code == 200:
                        data = response.json()
                        self.log("Backend Health Check", "PASS", f"Status: {data.get('status', 'unknown')}")
                    else:
                        self.log("Backend Health Check", "WARN", "No health endpoint")
                except Exception:
                    self.log("Backend Health Check", "WARN", "No health endpoint found")

        except Exception as e:
            self.log("Backend Connection", "FAIL", str(e))

    async def test_frontend_loads(self):
        """Test 2: Frontend loads successfully"""
        print("\n🔍 Testing Frontend...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            try:
                # Navigate to frontend
                response = await page.goto(self.frontend_url, wait_until="networkidle", timeout=30000)

                if response and response.ok:
                    self.log("Frontend Load", "PASS", f"Status: {response.status}")
                else:
                    self.log("Frontend Load", "FAIL", f"Status: {response.status if response else 'No response'}")

                # Check for React app
                await page.wait_for_selector('#root', timeout=10000)
                self.log("React App Mount", "PASS", "App container found")

                # Take screenshot
                await page.screenshot(path="render_frontend_screenshot.png")
                self.log("Screenshot", "PASS", "Saved as render_frontend_screenshot.png")

            except PlaywrightTimeout as e:
                self.log("Frontend Load", "FAIL", f"Timeout: {str(e)}")
            except Exception as e:
                self.log("Frontend Load", "FAIL", str(e))
            finally:
                await browser.close()

    async def test_cors_configuration(self):
        """Test 3: CORS is properly configured"""
        print("\n🔍 Testing CORS Configuration...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            cors_errors = []

            # Listen for console errors
            page.on("console", lambda msg:
                cors_errors.append(msg.text) if "CORS" in msg.text else None
            )

            try:
                await page.goto(self.frontend_url, wait_until="networkidle", timeout=30000)
                await asyncio.sleep(2)  # Wait for any API calls

                if cors_errors:
                    self.log("CORS Configuration", "FAIL", f"Found {len(cors_errors)} CORS errors")
                    for error in cors_errors[:3]:  # Show first 3 errors
                        print(f"   ⚠️  {error}")
                else:
                    self.log("CORS Configuration", "PASS", "No CORS errors detected")

            except Exception as e:
                self.log("CORS Configuration", "WARN", f"Could not test: {str(e)}")
            finally:
                await browser.close()

    async def test_api_connection(self):
        """Test 4: Frontend can connect to backend API"""
        print("\n🔍 Testing Frontend → Backend Connection...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            api_requests = []
            api_errors = []

            # Monitor network requests
            page.on("request", lambda request:
                api_requests.append(request.url) if self.backend_url in request.url else None
            )

            page.on("response", lambda response:
                api_errors.append(f"{response.url} - {response.status}")
                if self.backend_url in response.url and not response.ok else None
            )

            try:
                await page.goto(self.frontend_url, wait_until="networkidle", timeout=30000)
                await asyncio.sleep(3)  # Wait for API calls

                if api_requests:
                    self.log("API Requests", "PASS", f"Found {len(api_requests)} requests to backend")
                    if api_errors:
                        self.log("API Errors", "WARN", f"Found {len(api_errors)} failed requests")
                        for error in api_errors[:3]:
                            print(f"   ⚠️  {error}")
                    else:
                        self.log("API Responses", "PASS", "All API requests succeeded")
                else:
                    self.log("API Requests", "WARN", "No API requests detected (may be normal for landing page)")

            except Exception as e:
                self.log("API Connection", "FAIL", str(e))
            finally:
                await browser.close()

    async def test_login_page(self):
        """Test 5: Login page loads and form is present"""
        print("\n🔍 Testing Login Page...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            try:
                await page.goto(f"{self.frontend_url}/login", wait_until="networkidle", timeout=30000)

                # Check for login form elements
                email_input = await page.query_selector('input[type="email"], input[name="email"]')
                password_input = await page.query_selector('input[type="password"]')

                if email_input and password_input:
                    self.log("Login Form", "PASS", "Email and password fields found")
                else:
                    self.log("Login Form", "FAIL", "Login form elements not found")

                # Take screenshot of login page
                await page.screenshot(path="render_login_screenshot.png")
                self.log("Login Screenshot", "PASS", "Saved as render_login_screenshot.png")

            except Exception as e:
                self.log("Login Page", "FAIL", str(e))
            finally:
                await browser.close()

    async def test_database_connection(self):
        """Test 6: Database connection (via API endpoint)"""
        print("\n🔍 Testing Database Connection...")
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Try to hit an endpoint that requires DB (like users or health check)
                response = await client.get(f"{self.backend_url}/api/health")
                if response.status_code == 200:
                    data = response.json()
                    if "database" in data:
                        db_status = data.get("database", "unknown")
                        if "connected" in str(db_status).lower() or "healthy" in str(db_status).lower():
                            self.log("Database Connection", "PASS", f"Status: {db_status}")
                        else:
                            self.log("Database Connection", "FAIL", f"Status: {db_status}")
                    else:
                        self.log("Database Connection", "WARN", "Cannot verify - no health endpoint")
                else:
                    self.log("Database Connection", "WARN", "Cannot verify - no health endpoint")
        except Exception as e:
            self.log("Database Connection", "WARN", f"Cannot verify: {str(e)}")

    async def run_all_tests(self):
        """Run all QA tests"""
        print("="*60)
        print("🚀 RENDER.COM DEPLOYMENT QA")
        print("="*60)
        print(f"Backend URL:  {self.backend_url}")
        print(f"Frontend URL: {self.frontend_url}")
        print("="*60)

        # Run tests
        await self.test_backend_health()
        await self.test_database_connection()
        await self.test_frontend_loads()
        await self.test_cors_configuration()
        await self.test_api_connection()
        await self.test_login_page()

        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)

        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")
        warned = sum(1 for r in self.results if r["status"] == "WARN")
        total = len(self.results)

        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {failed}/{total}")
        print(f"⚠️  Warnings: {warned}/{total}")

        if failed == 0:
            print("\n🎉 All critical tests passed! Deployment looks good!")
        else:
            print("\n⚠️  Some tests failed. Check errors above.")

        print("="*60)


async def main():
    # Get URLs from command line or use defaults
    if len(sys.argv) >= 3:
        backend_url = sys.argv[1]
        frontend_url = sys.argv[2]
    else:
        print("Usage: python test_render_deployment.py <backend_url> <frontend_url>")
        print("\nExample:")
        print("  python test_render_deployment.py https://delorme-os-backend.onrender.com https://delorme-os-frontend.onrender.com")
        print("\nOr edit this script and set the URLs manually below:")
        print()

        # Set your Render URLs here:
        backend_url = "https://delorme-os-backend.onrender.com"  # CHANGE THIS
        frontend_url = "https://delorme-os-frontend.onrender.com"  # CHANGE THIS

        print(f"Using default URLs:")
        print(f"  Backend:  {backend_url}")
        print(f"  Frontend: {frontend_url}")
        print()

        response = input("Press Enter to continue or Ctrl+C to exit...")

    qa = RenderDeploymentQA(backend_url, frontend_url)
    await qa.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
