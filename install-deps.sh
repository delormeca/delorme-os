#!/bin/bash
# Robust dependency installation script with retries for network issues

set -e

echo "Starting Poetry dependency installation..."

MAX_RETRIES=3
RETRY_COUNT=0

# Function to install dependencies with retry
install_with_retry() {
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "Attempt $((RETRY_COUNT + 1)) of $MAX_RETRIES..."

        if poetry install --without dev --no-interaction --no-ansi; then
            echo "✅ Dependencies installed successfully!"
            return 0
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo "⚠️  Installation failed, waiting 10 seconds before retry..."
                sleep 10
            fi
        fi
    done

    echo "❌ Failed to install dependencies after $MAX_RETRIES attempts"
    return 1
}

# Configure Poetry
poetry config virtualenvs.create false
poetry config installer.max-workers 10
poetry config installer.parallel true

# Run installation with retry
install_with_retry
