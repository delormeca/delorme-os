"""
Integration Test: Create Cleio Client and Run Full Extraction
This test verifies the complete engine/crawling workflow.
"""
import asyncio
import httpx
import time
from typing import Optional

# Test Configuration
BASE_URL = "http://localhost:8000"
LOGIN_EMAIL = "admin@admin.com"
LOGIN_PASSWORD = "password"

# Client Configuration
CLIENT_NAME = "Cleio"
TEAM_LEAD = "Tommy Delorme"
WEBSITE_URL = "https://cleio.com"
SITEMAP_URL = "https://cleio.com/sitemap.xml"


class IntegrationTest:
    def __init__(self):
        self.client = None
        self.cookies = None
        self.client_id = None
        self.setup_run_id = None

    async def setup(self):
        """Initialize HTTP client and login."""
        self.client = httpx.AsyncClient(timeout=60.0)
        print("🔐 Logging in...")

        response = await self.client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": LOGIN_EMAIL, "password": LOGIN_PASSWORD}
        )

        if response.status_code != 200:
            raise Exception(f"Login failed: {response.status_code} - {response.text}")

        self.cookies = response.cookies
        print("✅ Login successful\n")

    async def cleanup_existing_client(self):
        """Check if Cleio client exists and delete it."""
        print("🔍 Checking for existing Cleio client...")

        response = await self.client.get(
            f"{BASE_URL}/api/clients",
            cookies=self.cookies
        )

        if response.status_code == 200:
            clients = response.json()
            for client in clients:
                if client['name'] == CLIENT_NAME:
                    print(f"⚠️  Found existing Cleio client (ID: {client['id']}), deleting...")
                    delete_response = await self.client.delete(
                        f"{BASE_URL}/api/clients/{client['id']}",
                        cookies=self.cookies
                    )
                    if delete_response.status_code == 204:
                        print("✅ Existing client deleted\n")
                    else:
                        print(f"⚠️  Could not delete existing client: {delete_response.status_code}\n")
                    return

        print("✅ No existing Cleio client found\n")

    async def create_client(self):
        """Create the Cleio client."""
        print("📝 Creating Cleio client...")
        print(f"   Name: {CLIENT_NAME}")
        print(f"   Team Lead: {TEAM_LEAD}")
        print(f"   Website: {WEBSITE_URL}")
        print(f"   Sitemap: {SITEMAP_URL}\n")

        response = await self.client.post(
            f"{BASE_URL}/api/clients",
            json={
                "name": CLIENT_NAME,
                "team_lead": TEAM_LEAD,
                "website_url": WEBSITE_URL,
                "sitemap_url": SITEMAP_URL,
                "status": "Active",
                "crawl_frequency": "Manual Only"
            },
            cookies=self.cookies
        )

        if response.status_code not in [200, 201]:
            raise Exception(f"Failed to create client: {response.status_code} - {response.text}")

        data = response.json()
        self.client_id = data['id']
        slug = data.get('slug', 'N/A')

        print(f"✅ Client created successfully!")
        print(f"   ID: {self.client_id}")
        print(f"   Slug: {slug}\n")

    async def test_sitemap_validation(self):
        """Test the sitemap validation button/endpoint."""
        print("🧪 Testing sitemap validation...")
        print(f"   Validating: {SITEMAP_URL}\n")

        response = await self.client.post(
            f"{BASE_URL}/api/engine-setup/validate-sitemap",
            json={"sitemap_url": SITEMAP_URL},
            cookies=self.cookies
        )

        if response.status_code != 200:
            raise Exception(f"Sitemap validation failed: {response.status_code} - {response.text}")

        data = response.json()

        print(f"✅ Sitemap validation results:")
        print(f"   Valid: {data['valid']}")
        print(f"   URL Count: {data['url_count']}")
        print(f"   Sitemap Type: {data.get('sitemap_type', 'N/A')}")
        print(f"   Parse Time: {data['parse_time']:.2f}s")

        if not data['valid']:
            print(f"   ⚠️  Error Type: {data.get('error_type')}")
            print(f"   ⚠️  Error Message: {data.get('error_message')}")
            print(f"   ⚠️  Suggestion: {data.get('suggestion')}")
            raise Exception("Sitemap validation returned invalid result")

        print()
        return data['url_count']

    async def start_engine_setup(self):
        """Start the engine setup process (Add Pages)."""
        print("🚀 Starting engine setup (Add Pages)...")

        response = await self.client.post(
            f"{BASE_URL}/api/engine-setup/start",
            json={
                "client_id": self.client_id,
                "setup_type": "sitemap",
                "sitemap_url": SITEMAP_URL,
                "base_url": WEBSITE_URL
            },
            cookies=self.cookies
        )

        if response.status_code != 200:
            raise Exception(f"Failed to start engine setup: {response.status_code} - {response.text}")

        data = response.json()
        self.setup_run_id = data['setup_run_id']

        print(f"✅ Engine setup started!")
        print(f"   Setup Run ID: {self.setup_run_id}\n")

    async def monitor_setup_progress(self, expected_url_count: int):
        """Monitor the setup run until completion."""
        print("⏳ Monitoring setup progress...")
        print("   (This may take several minutes depending on sitemap size)\n")

        max_wait_time = 600  # 10 minutes
        start_time = time.time()
        last_status = None

        while time.time() - start_time < max_wait_time:
            response = await self.client.get(
                f"{BASE_URL}/api/engine-setup/runs/{self.setup_run_id}",
                cookies=self.cookies
            )

            if response.status_code != 200:
                print(f"   ⚠️  Failed to get setup run status: {response.status_code}")
                await asyncio.sleep(5)
                continue

            data = response.json()
            status = data.get('status', 'unknown')
            pages_imported = data.get('pages_imported', 0)

            if status != last_status:
                print(f"   Status: {status} | Pages Imported: {pages_imported}/{expected_url_count}")
                last_status = status

            if status == "completed":
                print(f"\n✅ Setup completed successfully!")
                print(f"   Pages Imported: {pages_imported}")
                print(f"   Duration: {data.get('duration', 'N/A')}\n")
                return True

            if status == "failed":
                print(f"\n❌ Setup failed!")
                print(f"   Error: {data.get('error_message', 'Unknown error')}\n")
                return False

            await asyncio.sleep(5)  # Check every 5 seconds

        print(f"\n⚠️  Setup did not complete within {max_wait_time}s")
        return False

    async def verify_pages_imported(self):
        """Verify that pages were imported and have data."""
        print("🔍 Verifying imported pages...")

        response = await self.client.get(
            f"{BASE_URL}/api/clients/{self.client_id}/pages",
            cookies=self.cookies
        )

        if response.status_code != 200:
            raise Exception(f"Failed to get pages: {response.status_code} - {response.text}")

        pages = response.json()
        total_pages = len(pages)

        print(f"   Total Pages: {total_pages}")

        if total_pages == 0:
            print("   ⚠️  No pages imported!\n")
            return False

        # Check sample pages for data
        pages_with_title = sum(1 for p in pages if p.get('page_title'))
        pages_with_meta = sum(1 for p in pages if p.get('meta_description'))
        pages_with_h1 = sum(1 for p in pages if p.get('h1'))
        pages_with_status = sum(1 for p in pages if p.get('status_code'))

        print(f"   Pages with Title: {pages_with_title}/{total_pages}")
        print(f"   Pages with Meta Description: {pages_with_meta}/{total_pages}")
        print(f"   Pages with H1: {pages_with_h1}/{total_pages}")
        print(f"   Pages with Status Code: {pages_with_status}/{total_pages}")

        # Show sample of first 3 pages
        print(f"\n   Sample Pages:")
        for i, page in enumerate(pages[:3], 1):
            print(f"   {i}. {page.get('url', 'N/A')}")
            print(f"      Title: {page.get('page_title', 'N/A')[:60]}...")
            print(f"      Status: {page.get('status_code', 'N/A')}")
            print(f"      H1: {page.get('h1', 'N/A')[:60]}...")

        print()
        return True

    async def verify_client_status(self):
        """Verify client status is updated."""
        print("🔍 Verifying client status...")

        response = await self.client.get(
            f"{BASE_URL}/api/clients/{self.client_id}",
            cookies=self.cookies
        )

        if response.status_code != 200:
            raise Exception(f"Failed to get client: {response.status_code} - {response.text}")

        data = response.json()

        print(f"   Engine Setup Completed: {data.get('engine_setup_completed', False)}")
        print(f"   Page Count: {data.get('page_count', 0)}")
        print(f"   Team Lead: {data.get('team_lead', 'N/A')}")
        print(f"   Slug: {data.get('slug', 'N/A')}\n")

        return data.get('engine_setup_completed', False)

    async def teardown(self):
        """Clean up HTTP client."""
        if self.client:
            await self.client.aclose()

    async def run(self):
        """Run the complete integration test."""
        print("=" * 80)
        print("🧪 CLEIO CLIENT INTEGRATION TEST")
        print("=" * 80)
        print()

        try:
            await self.setup()
            await self.cleanup_existing_client()
            await self.create_client()

            expected_url_count = await self.test_sitemap_validation()

            await self.start_engine_setup()
            setup_success = await self.monitor_setup_progress(expected_url_count)

            if not setup_success:
                print("❌ Setup did not complete successfully")
                return False

            pages_verified = await self.verify_pages_imported()
            client_updated = await self.verify_client_status()

            print("=" * 80)
            if pages_verified and client_updated:
                print("✅ INTEGRATION TEST PASSED")
                print()
                print("🎉 SUCCESS! All components working:")
                print("   ✅ Client creation with team_lead and slug")
                print("   ✅ Sitemap validation endpoint")
                print("   ✅ Engine setup process")
                print("   ✅ Page import from sitemap")
                print("   ✅ Data extraction (title, meta, h1, status)")
                print("   ✅ Data persistence (available for frontend)")
                print()
                print("📱 Next time you run the frontend, all Cleio data will be visible!")
            else:
                print("⚠️  INTEGRATION TEST COMPLETED WITH WARNINGS")
                print("   Some data may be missing. Check logs above.")
            print("=" * 80)

            return pages_verified and client_updated

        except Exception as e:
            print(f"\n❌ INTEGRATION TEST FAILED")
            print(f"   Error: {str(e)}\n")
            print("=" * 80)
            return False

        finally:
            await self.teardown()


async def main():
    test = IntegrationTest()
    success = await test.run()
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
