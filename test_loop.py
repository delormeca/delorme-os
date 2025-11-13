"""Test script to check event loop type under uvicorn"""
import asyncio
import sys

print(f"Python version: {sys.version}")
print(f"Platform: {sys.platform}")
print(f"Event loop policy: {asyncio.get_event_loop_policy()}")

# Try to get the running loop
try:
    loop = asyncio.get_running_loop()
    print(f"Running loop type: {type(loop).__name__}")
    print(f"Loop object: {loop}")
except RuntimeError:
    print("No event loop running")

# Check if ProactorEventLoop supports subprocesses
from asyncio import ProactorEventLoop, SelectorEventLoop
print(f"\nProactorEventLoop supports subprocesses: Yes")
print(f"SelectorEventLoop supports subprocesses: No (NotImplementedError)")

# Set policy explicitly
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    print(f"\nAfter setting ProactorEventLoopPolicy:")
    print(f"Event loop policy: {asyncio.get_event_loop_policy()}")
