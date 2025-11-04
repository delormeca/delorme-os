# Use an official Python runtime as a parent image
FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y nodejs npm

# Install Poetry
RUN pip install poetry

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the Poetry configuration files into the container
COPY pyproject.toml ./
COPY poetry.lock ./

# Disable virtual environments and install dependencies
RUN poetry config virtualenvs.create false
RUN poetry install

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

# Specify the command to run on container start
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
