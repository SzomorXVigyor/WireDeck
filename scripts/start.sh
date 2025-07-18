#!/bin/bash

# Navigate to project root (parent directory of scripts)
cd "$(dirname "$0")/.."

echo "Starting WireGuard Manager with Nginx Proxy..."

# Check if .htpasswd exists
if [ ! -f "nginx/.htpasswd" ]; then
    echo "Basic auth file not found. Running setup first..."
    ./scripts/setup.sh
fi

# Start the services
docker-compose up -d

echo "Services started! Checking container status..."
docker-compose ps

echo ""
echo "If this is the first run, obtain SSL certificates with:"
echo "./scripts/get-certificates.sh"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"