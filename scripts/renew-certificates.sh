#!/bin/bash

# Navigate to project root (parent directory of scripts)
cd "$(dirname "$0")/.."

# Script to manually renew certificates (the certbot container auto-renews every 12 hours)
echo "Renewing SSL certificates..."

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "Docker containers are not running. Please start them first with: docker-compose up -d"
    exit 1
fi

docker-compose exec certbot certbot renew

if [ $? -eq 0 ]; then
    echo "Certificates renewed successfully!"
    
    # Reload nginx after renewal
    echo "Reloading nginx..."
    docker-compose exec nginx nginx -s reload
    
    echo "Certificate renewal complete!"
else
    echo "Certificate renewal failed. Please check the logs."
    exit 1
fi