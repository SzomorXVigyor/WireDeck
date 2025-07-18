#!/bin/bash

# Navigate to project root (parent directory of scripts)
cd "$(dirname "$0")/.."

echo "This will remove all containers, volumes, and certificates. Are you sure? (y/N)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Stopping and removing containers..."
    docker-compose down -v
    
    echo "Removing certificates and configuration..."
    rm -rf certbot/conf certbot/www nginx/logs nginx/.htpasswd
    
    echo "Cleanup complete!"
else
    echo "Cleanup cancelled."
fi