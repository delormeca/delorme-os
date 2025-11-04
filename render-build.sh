#!/bin/bash
# Render.com Build Script
# This script runs during deployment to build and prepare the backend

set -e  # Exit on error

echo "🚀 Starting Render.com build process..."

# Install Poetry
echo "📦 Installing Poetry..."
pip install poetry

# Configure Poetry to not create virtual environments
echo "⚙️  Configuring Poetry..."
poetry config virtualenvs.create false

# Install dependencies (production only)
echo "📚 Installing dependencies..."
poetry install --no-dev --no-interaction --no-ansi

# Run database migrations
echo "🗄️  Running database migrations..."
poetry run alembic upgrade head

echo "✅ Build completed successfully!"
