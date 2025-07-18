#!/bin/bash

# Navigate to project root (parent directory of scripts)
cd "$(dirname "$0")/.."

echo "Updating basic authentication credentials..."

# Create new credentials
read -p "Enter new username for basic auth: " USERNAME
read -s -p "Enter new password for basic auth: " PASSWORD
echo

# Create the .htpasswd file
htpasswd -cb nginx/.htpasswd "$USERNAME" "$PASSWORD"

echo "Basic auth credentials updated!"

# Reload nginx
if docker compose ps | grep -q "nginx.*Up"; then
    echo "Reloading nginx..."
    docker compose exec nginx nginx -s reload
    echo "Nginx reloaded. New credentials are now active."
else
    echo "Nginx is not running. Start the services to apply changes."
fi