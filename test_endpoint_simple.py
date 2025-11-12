import requests

BASE_URL = "http://localhost:8000/api"

# Try to signup a new user
signup_data = {
    "email": "slugtest@example.com",
    "password": "password123",
    "full_name": "Slug Test User"
}

print("Signing up new user...")
response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
print(f"Signup Status: {response.status_code}")
if response.status_code in [200, 201]:
    print(f"Signup Response: {response.json()}")

if response.status_code in [200, 201]:
    # If signup successful, we should have a token
    token = response.json().get("access_token")
    if not token:
        # Try to login
        print("\nLogging in...")
        login_data = {"email": signup_data["email"], "password": signup_data["password"]}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login Status: {response.status_code}")
        if response.status_code == 200:
            token = response.json()["access_token"]
        else:
            print(f"Login failed: {response.text}")
            exit(1)
else:
    # User might already exist, try to login
    print("\nUser already exists, trying to login...")
    login_data = {"email": signup_data["email"], "password": signup_data["password"]}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login Status: {response.status_code}")
    print(f"Login Response: {response.json()}")
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"Token extracted: {token[:20]}...")
    else:
        print(f"Login failed: {response.text}")
        exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Test 1: Valid slug
print("\n=== TEST 1: Valid slug (pest-agent2) ===")
response = requests.get(f"{BASE_URL}/clients/slug/pest-agent2", headers=headers)
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print("SUCCESS!")
    print(f"  Client Name: {data.get('name')}")
    print(f"  Client Slug: {data.get('slug')}")
    print(f"  Website: {data.get('website_url')}")
else:
    print(f"ERROR: {response.text}")

# Test 2: Invalid slug
print("\n=== TEST 2: Invalid slug (nonexistent-slug) ===")
response = requests.get(f"{BASE_URL}/clients/slug/nonexistent-slug", headers=headers)
print(f"Status Code: {response.status_code}")
if response.status_code == 404:
    print("SUCCESS! Got expected 404 error")
    print(f"  Error Message: {response.json().get('detail')}")
else:
    print("Unexpected status code")
    print(f"  Response: {response.json()}")

print("\n=== All tests completed! ===")
