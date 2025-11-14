#!/usr/bin/env python3
"""
Development helper script with automatic environment loading.

Usage:
    poetry run python dev.py                   # Show available commands
    poetry run python dev.py server            # Start development server
    poetry run python dev.py migrate           # Run database migrations
    poetry run python dev.py create-super      # Create superuser
    poetry run python dev.py setup-payments    # Setup payment integration
    poetry run python dev.py test-config       # Test configuration loading
"""
import sys
import subprocess
import os
from pathlib import Path

# Add the project root to Python path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

def run_command(cmd: list[str], description: str = ""):
    """Run a command with proper environment loading."""
    if description:
        print(f"🚀 {description}")
    
    try:
        result = subprocess.run(cmd, check=True, cwd=PROJECT_ROOT)
        return result.returncode
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed with exit code {e.returncode}")
        return e.returncode
    except FileNotFoundError:
        print(f"❌ Command not found: {cmd[0]}")
        return 1

def test_config():
    """Test that configuration loading works properly."""
    print("🧪 Testing configuration loading...")
    try:
        from app.config import config, payment_config
        print(f"Configuration loaded successfully")
        print(f"Environment: {config.env}")
        print(f"Database URL configured: {bool(config.get_database_url())}")
        print(f"Payment domain: {payment_config.domain}")
        print(f"Secret key configured: {bool(config.secret_key)}")
        return True
    except Exception as e:
        print(f"❌ Configuration loading failed: {e}")
        return False

def show_help():
    """Show available commands."""
    print("""
🛠️  CraftYourStartup Development Helper

Available commands:
  server           Start the development server (with auto-reload)
  migrate          Run database migrations (upgrade to latest)
  create-super     Create a superuser account
  setup-payments   Setup payment integration system
  test-config      Test configuration loading
  
Examples:
  poetry run python dev.py server
  poetry run python dev.py migrate
  poetry run python dev.py create-super --email admin@YOUR_DOMAIN.com --full_name "Admin User" --password admin123
  
💡 This script automatically loads environment variables from local.env
💡 No need to manually source environment files!

For more advanced tasks, use:
  task --list                    # Show all available tasks
  poetry run <command>          # Run commands with Poetry
""")

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        show_help()
        return 0
    
    command = sys.argv[1].lower()
    args = sys.argv[2:] if len(sys.argv) > 2 else []
    
    # Test configuration first
    if command != "test-config" and not test_config():
        print("\n❌ Configuration test failed. Please check your local.env file.")
        return 1
    
    if command == "server":
        return run_command([
            "poetry", "run", "uvicorn", "main:app", 
            "--reload", "--reload-dir", "app", "--port", "8020"
        ], "Starting development server with auto-reload")
        
    elif command == "migrate":
        return run_command([
            "poetry", "run", "alembic", "upgrade", "head"
        ], "Running database migrations")
        
    elif command == "create-super":
        cmd = ["poetry", "run", "python", "-m", "app.commands.create_superuser"]
        if args:
            cmd.extend(args)
        return run_command(cmd, "Creating superuser")
        
    elif command == "setup-payments":
        return run_command([
            "poetry", "run", "python", "scripts/setup_payments.py"
        ], "Setting up payment integration")
        
    elif command == "test-config":
        success = test_config()
        return 0 if success else 1
        
    else:
        print(f"❌ Unknown command: {command}")
        show_help()
        return 1

if __name__ == "__main__":
    exit(main()) 