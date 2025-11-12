import requests
import os

# Test the new slug endpoint
BASE_URL = "http://localhost:8000/api"

# You'll need to login first to get a token
# Using test credentials (adjust as needed)
login_data = {
    "email": "admin@example.com",  # Adjust this
    "password": "admin123"  # Adjust this
}

try:
    # Login to get token
    print("Logging in...")
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Test 1: Valid slug
        print("\n--- TEST 1: Valid slug (pest-agent2) ---")
        response = requests.get(f"{BASE_URL}/clients/slug/pest-agent2", headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Client Name: {data.get('name')}")
            print(f"Client Slug: {data.get('slug')}")
            print(f"Website: {data.get('website_url')}")
        else:
            print(f"Error: {response.text}")

        # Test 2: Invalid slug
        print("\n--- TEST 2: Invalid slug (nonexistent-slug) ---")
        response = requests.get(f"{BASE_URL}/clients/slug/nonexistent-slug", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

    else:
        print(f"Login failed: {response.status_code}")
        print(f"Response: {response.text}")

except Exception as e:
    print(f"Error: {e}")
