"""Simple test for request size limits using Content-Length header"""
import http.client

def test_size_limit():
    """Test with explicit Content-Length header"""
    print("Testing request size limit (11 MB payload)...")

    conn = http.client.HTTPConnection("localhost", 8020)

    # Set Content-Length to 11 MB (over the 10 MB limit)
    headers = {
        "Content-Length": str(11 * 1024 * 1024),
        "Content-Type": "application/json"
    }

    # Send minimal body (middleware checks header, not actual content)
    body = '{"test": "data"}'

    conn.request("POST", "/api/auth/login", body, headers)
    response = conn.getresponse()

    print(f"Status Code: {response.status}")
    print(f"Response: {response.read().decode()}")

    if response.status == 413:
        print("\n[PASS] Request size limit working! Got 413 Payload Too Large")
        return True
    else:
        print(f"\n[FAIL] Expected 413, got {response.status}")
        return False

if __name__ == "__main__":
    test_size_limit()
