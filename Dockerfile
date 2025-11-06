# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install system dependencies for Node.js, Playwright, and Chromium
RUN apt-get update && \
    apt-get install -y \
    nodejs \
    npm \
    # Playwright/Chromium dependencies
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the Poetry configuration files into the container
COPY pyproject.toml ./
COPY poetry.lock ./

# Disable virtual environments and install dependencies
RUN poetry config virtualenvs.create false
RUN poetry install --without dev

# Install Playwright browsers (Chromium only for efficiency)
RUN playwright install --with-deps chromium

# Copy the rest of the application code
COPY . .

# Specify the directory containing the frontend code
WORKDIR /usr/src/app/frontend

# Install Node.js, npm, and build the frontend
RUN npm install
RUN npm run build

# Copy build artifacts to the static directory
RUN cp -r dist/* /usr/src/app/static/

# Set the working directory back to the main application directory
WORKDIR /usr/src/app

# Expose port (Render will use PORT env var)
EXPOSE ${PORT:-8080}

# Specify the command to run on container start
# Use sh -c to allow environment variable substitution
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"
