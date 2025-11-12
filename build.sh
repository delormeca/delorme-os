#!/bin/bash
# Render.com Build Script
# This script is executed during the Render build process

set -e  # Exit on error

echo "=========================================="
echo "🚀 Starting Velocity v2.0 Build Process"
echo "=========================================="

# 1. Install Poetry
echo ""
echo "📦 Installing Poetry..."
pip install poetry

# 2. Configure Poetry
echo ""
echo "⚙️  Configuring Poetry..."
poetry config virtualenvs.create false

# 3. Install Python Dependencies
echo ""
echo "📚 Installing Python dependencies..."
poetry install --no-dev --no-interaction --no-ansi

# 4. Install Playwright + Chromium
echo ""
echo "🎭 Installing Playwright with Chromium..."
echo "⏳ This may take 5-10 minutes (downloading ~100MB)"
playwright install --with-deps chromium

# 5. Verify Playwright Installation
echo ""
echo "✅ Verifying Playwright installation..."
python -c "from playwright.sync_api import sync_playwright; print('Playwright imported successfully')"

# 6. Display Environment Info
echo ""
echo "=========================================="
echo "📊 Build Environment Info"
echo "=========================================="
echo "Python version: $(python --version)"
echo "Poetry version: $(poetry --version)"
echo "Playwright version: $(python -c 'import playwright; print(playwright.__version__)' 2>/dev/null || echo 'Not found')"
echo "Crawl4AI installed: $(python -c 'import crawl4ai; print("Yes")' 2>/dev/null || echo 'No')"

# 7. Run Database Migrations (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ] || [ -n "$db_host" ]; then
    echo ""
    echo "🗃️  Running database migrations..."
    alembic upgrade head || echo "⚠️  Warning: Migration failed, continuing..."
else
    echo ""
    echo "⚠️  Skipping migrations (DATABASE_URL not set)"
fi

echo ""
echo "=========================================="
echo "✅ Build Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Verify environment variables are set"
echo "  2. Check health endpoint: /api/health"
echo "  3. Test sitemap import functionality"
echo "  4. Monitor logs for Playwright initialization"
echo ""
