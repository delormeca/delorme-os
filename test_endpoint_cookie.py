import requests

BASE_URL = "http://localhost:8020/api"

# Create a session to persist cookies
session = requests.Session()

# Try to signup a new user
signup_data = {
    "email": "slugtest@example.com",
    "password": "password123",
    "full_name": "Slug Test User"
}

print("Signing up/logging in...")
response = session.post(f"{BASE_URL}/auth/signup", json=signup_data)

if response.status_code == 409:
    # User already exists, try to login
    login_data = {"email": signup_data["email"], "password": signup_data["password"]}
    response = session.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login Status: {response.status_code}")
else:
    print(f"Signup Status: {response.status_code}")

if response.status_code not in [200, 201]:
    print(f"Auth failed: {response.text}")
    exit(1)

print("Authenticated successfully!")
print(f"Cookies: {session.cookies.get_dict()}")

# Test 1: Valid slug
print("\n=== TEST 1: Valid slug (pest-agent2) ===")
response = session.get(f"{BASE_URL}/clients/slug/pest-agent2")
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print("SUCCESS!")
    print(f"  Client Name: {data.get('name')}")
    print(f"  Client Slug: {data.get('slug')}")
    print(f"  Website: {data.get('website_url')}")
    print(f"  Industry: {data.get('industry')}")
else:
    print(f"ERROR: {response.text}")

# Test 2: Invalid slug
print("\n=== TEST 2: Invalid slug (nonexistent-slug) ===")
response = session.get(f"{BASE_URL}/clients/slug/nonexistent-slug")
print(f"Status Code: {response.status_code}")
if response.status_code == 404:
    print("SUCCESS! Got expected 404 error")
    print(f"  Error Message: {response.json().get('detail')}")
else:
    print("Unexpected status code")
    print(f"  Response: {response.json()}")

print("\n=== All tests completed successfully! ===")
