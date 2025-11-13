"""Test CORS header restrictions"""
import requests

BASE_URL = "http://localhost:8020"

def test_health_endpoint_with_allowed_headers():
    """Test API call with allowed headers (Content-Type)"""
    print("Test 1: GET request with allowed headers...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/health",
            headers={
                "Content-Type": "application/json",
                "Origin": "http://localhost:5173"
            }
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print(f"CORS Headers: {response.headers.get('access-control-allow-origin', 'Not set')}")

        if response.status_code == 200:
            print("[PASS] API call with allowed headers works\n")
            return True
        else:
            print("[FAIL] Unexpected status code\n")
            return False
    except Exception as e:
        print(f"[ERROR] {e}\n")
        return False

def test_options_preflight():
    """Test OPTIONS preflight request"""
    print("Test 2: OPTIONS preflight request...")
    try:
        response = requests.options(
            f"{BASE_URL}/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type"
            }
        )
        print(f"Status: {response.status_code}")
        print(f"Allow-Origin: {response.headers.get('access-control-allow-origin', 'Not set')}")
        print(f"Allow-Methods: {response.headers.get('access-control-allow-methods', 'Not set')}")
        print(f"Allow-Headers: {response.headers.get('access-control-allow-headers', 'Not set')}")

        allow_headers = response.headers.get('access-control-allow-headers', '')

        # Check that wildcard is not used
        if "*" in allow_headers:
            print("[FAIL] Wildcard still in use\n")
            return False

        # Check that expected headers are present
        expected_headers = ["Authorization", "Content-Type", "Accept"]
        if all(h.lower() in allow_headers.lower() for h in expected_headers):
            print("[PASS] Explicit headers configured correctly\n")
            return True
        else:
            print(f"[FAIL] Missing expected headers. Got: {allow_headers}\n")
            return False

    except Exception as e:
        print(f"[ERROR] {e}\n")
        return False

def test_custom_header():
    """Test that custom/unknown headers are handled"""
    print("Test 3: Request with custom header...")
    try:
        response = requests.options(
            f"{BASE_URL}/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "X-Custom-Unknown-Header"
            }
        )
        print(f"Status: {response.status_code}")

        # OPTIONS should still return 200, but browser would reject the custom header
        # We're just checking the allowed headers list doesn't include everything
        allow_headers = response.headers.get('access-control-allow-headers', '')
        print(f"Allowed headers: {allow_headers}")

        if "*" not in allow_headers:
            print("[PASS] Custom headers not automatically allowed\n")
            return True
        else:
            print("[FAIL] Wildcard in use\n")
            return False

    except Exception as e:
        print(f"[ERROR] {e}\n")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("CORS Header Restriction Tests")
    print("=" * 60)
    print()

    test1 = test_health_endpoint_with_allowed_headers()
    test2 = test_options_preflight()
    test3 = test_custom_header()

    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Allowed headers work: {'[PASS]' if test1 else '[FAIL]'}")
    print(f"Preflight configured: {'[PASS]' if test2 else '[FAIL]'}")
    print(f"No wildcard in use: {'[PASS]' if test3 else '[FAIL]'}")

    if all([test1, test2, test3]):
        print("\n[PASS] ALL TESTS PASSED")
    else:
        print("\n[FAIL] SOME TESTS FAILED")
