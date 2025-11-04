#!/usr/bin/env python3
"""
Quick test script to verify Deep Researcher API configuration.
Run this to check if OpenAI and Tavily API keys are working.
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("local.env")

async def test_openai():
    """Test OpenAI API connection."""
    print("\n[*] Testing OpenAI API...")

    try:
        from openai import AsyncOpenAI

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("❌ OPENAI_API_KEY not found in environment")
            return False

        client = AsyncOpenAI(api_key=api_key)

        # Simple test request
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Say 'API test successful'"}],
            max_tokens=10
        )

        result = response.choices[0].message.content
        print(f"[+] OpenAI API working! Response: {result}")
        return True

    except Exception as e:
        print(f"[-] OpenAI API Error: {str(e)}")
        return False

async def test_tavily():
    """Test Tavily API connection."""
    print("\n[*] Testing Tavily API...")

    try:
        from tavily import TavilyClient

        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            print("❌ TAVILY_API_KEY not found in environment")
            return False

        client = TavilyClient(api_key=api_key)

        # Simple test search
        response = client.search(query="test query", max_results=1)

        if response and "results" in response:
            print(f"[+] Tavily API working! Found {len(response['results'])} results")
            return True
        else:
            print("[!] Tavily API responded but format unexpected")
            return False

    except Exception as e:
        print(f"[-] Tavily API Error: {str(e)}")
        return False

async def test_gpt_researcher():
    """Test GPT Researcher library."""
    print("\n[*] Testing GPT Researcher library...")

    try:
        from gpt_researcher import GPTResearcher

        # Create a minimal researcher instance
        researcher = GPTResearcher(
            query="What is artificial intelligence?",
            report_type="research_report",
        )

        print("[+] GPT Researcher library imported successfully")
        print("    Ready to conduct research!")
        return True

    except Exception as e:
        print(f"[-] GPT Researcher Error: {str(e)}")
        return False

async def main():
    """Run all tests."""
    print("=" * 60)
    print("DEEP RESEARCHER API CONFIGURATION TEST")
    print("=" * 60)

    results = []

    # Test OpenAI
    results.append(("OpenAI", await test_openai()))

    # Test Tavily
    results.append(("Tavily", await test_tavily()))

    # Test GPT Researcher
    results.append(("GPT Researcher", await test_gpt_researcher()))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    for name, passed in results:
        status = "[PASSED]" if passed else "[FAILED]"
        print(f"{name:20} {status}")

    all_passed = all(passed for _, passed in results)

    if all_passed:
        print("\n[SUCCESS] All tests passed! Deep Researcher is ready to use!")
        print("\nNext steps:")
        print("   1. Start backend: task run-backend")
        print("   2. Start frontend: task run-frontend")
        print("   3. Navigate to: http://localhost:5173/dashboard/deep-researcher")
    else:
        print("\n[WARNING] Some tests failed. Please check your API keys in local.env")

    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
