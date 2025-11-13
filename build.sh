#!/bin/bash

# Vercel Build Script for Delorme OS Backend
# This script runs during Vercel deployment to set up Playwright and dependencies

echo "🚀 Starting Delorme OS build..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install Playwright browsers (required for Crawl4AI)
echo "🌐 Installing Playwright browsers..."
playwright install chromium
playwright install-deps chromium

echo "✅ Build complete!"
