"""Test rate limiting on auth endpoints"""
import requests
import time

BASE_URL = "http://localhost:8020/api/auth"

def test_login_rate_limit():
    """Test that login endpoint enforces 5/minute rate limit"""
    print("Testing login rate limit (5/minute)...")

    # Make 7 requests (should hit rate limit on 6th)
    results = []
    for i in range(1, 8):
        try:
            response = requests.post(
                f"{BASE_URL}/login",
                json={"email": "test@example.com", "password": "password123"},
                timeout=5
            )
            results.append({
                "request": i,
                "status": response.status_code,
                "body": response.json() if response.status_code != 429 else response.text
            })
            print(f"Request {i}: Status {response.status_code}")

            if response.status_code == 429:
                print(f"[PASS] Rate limit hit on request {i} (expected after 5)")
                break

        except Exception as e:
            print(f"[ERROR] Request {i} error: {e}")

        time.sleep(0.2)  # Small delay between requests

    # Check results
    success_count = sum(1 for r in results if r["status"] != 429)
    rate_limited = any(r["status"] == 429 for r in results)

    print(f"\nResults:")
    print(f"- Successful requests: {success_count}")
    print(f"- Rate limit triggered: {rate_limited}")

    if rate_limited and success_count <= 5:
        print("\n[PASS] Rate limiting works correctly!")
        return True
    else:
        print("\n[FAIL] Rate limiting not working as expected")
        return False

def test_signup_rate_limit():
    """Test that signup endpoint enforces 3/minute rate limit"""
    print("\n\nTesting signup rate limit (3/minute)...")

    # Make 5 requests (should hit rate limit on 4th)
    results = []
    for i in range(1, 6):
        try:
            response = requests.post(
                f"{BASE_URL}/signup",
                json={
                    "email": f"test{i}@example.com",
                    "password": "password123",
                    "full_name": "Test User"
                },
                timeout=5
            )
            results.append({
                "request": i,
                "status": response.status_code
            })
            print(f"Request {i}: Status {response.status_code}")

            if response.status_code == 429:
                print(f"[PASS] Rate limit hit on request {i} (expected after 3)")
                break

        except Exception as e:
            print(f"Request {i}: {e}")

        time.sleep(0.2)

    # Check results
    success_count = sum(1 for r in results if r["status"] != 429)
    rate_limited = any(r["status"] == 429 for r in results)

    print(f"\nResults:")
    print(f"- Successful/attempted requests: {success_count}")
    print(f"- Rate limit triggered: {rate_limited}")

    if rate_limited and success_count <= 3:
        print("\n[PASS] Rate limiting works correctly!")
        return True
    else:
        print("\n[FAIL] Rate limiting not working as expected")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Rate Limiting Test Suite")
    print("=" * 60)

    login_passed = test_login_rate_limit()
    signup_passed = test_signup_rate_limit()

    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Login rate limit: {'[PASS]' if login_passed else '[FAIL]'}")
    print(f"Signup rate limit: {'[PASS]' if signup_passed else '[FAIL]'}")

    if login_passed and signup_passed:
        print("\n[PASS] ALL TESTS PASSED")
    else:
        print("\n[FAIL] SOME TESTS FAILED")
