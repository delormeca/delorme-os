# Use an official Python runtime as a parent image
FROM python:3.11-slim
# Updated: 2025-11-12 - Force rebuild with automated superuser creation

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Install system dependencies required for Playwright and other packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir poetry

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the Poetry configuration files into the container
COPY pyproject.toml poetry.lock ./

# Copy installation script
COPY install-deps.sh ./

# Make script executable and run it
RUN chmod +x install-deps.sh && ./install-deps.sh

# Install Playwright browsers (Chromium only for efficiency)
# Using --with-deps but system deps are already installed above
RUN playwright install chromium

# Copy the rest of the application code
COPY . .

# Create static directory for future use (optional)
RUN mkdir -p /usr/src/app/static

# Make startup script executable
RUN chmod +x startup.sh

# Expose port (Render will use PORT env var)
EXPOSE ${PORT:-8080}

# Run startup script which handles migrations, superuser creation, and app start
CMD ["./startup.sh"]
