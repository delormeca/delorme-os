#!/bin/bash
set -e

echo "🚀 Running database migrations..."
alembic upgrade head

echo "👤 Creating superuser (if not exists)..."
python -m app.commands.setup_tommy_superuser || echo "Superuser already exists or creation skipped"

echo "✅ Startup complete! Starting application..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
