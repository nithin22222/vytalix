# Use official Python runtime as a parent image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements or install them directly
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy current directory contents into the container
COPY . .

# Expose port 5050
EXPOSE 5050

# Run the Flask API
CMD ["python", "flask_api_backend.py"]
