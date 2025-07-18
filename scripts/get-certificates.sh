#!/bin/bash

# Navigate to project root (parent directory of scripts)
cd "$(dirname "$0")/.."

# Script to obtain SSL certificates
echo "Obtaining SSL certificates..."

# Prompt for email address
read -p "Enter your email address for Let's Encrypt notifications: " EMAIL

if [ -z "$EMAIL" ]; then
    echo "Email address is required!"
    exit 1
fi

echo "Getting certificates for vpn1.remoteconnect.hu and *.vpn1.remoteconnect.hu..."

# Check if containers are running
if ! docker compose ps | grep -q "Up"; then
    echo "Docker containers are not running. Starting them first..."
    docker compose up -d
    echo "Waiting 10 seconds for containers to be ready..."
    sleep 10
fi

# Get certificates for main domain and wildcard
docker compose exec certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  -d vpn1.remoteconnect.hu \
  -d "*.vpn1.remoteconnect.hu"

if [ $? -eq 0 ]; then
    echo "Certificates obtained successfully!"
    
    # Reload nginx after getting certificates
    echo "Reloading nginx..."
    docker compose exec nginx nginx -s reload
    
    echo "Setup complete! You can now access:"
    echo "- WireGuard Manager: https://vpn1.remoteconnect.hu (with basic auth)"
    echo "- Other apps: https://{PORT}.vpn1.remoteconnect.hu (no auth required)"
else
    echo "Failed to obtain certificates. Please check your DNS settings and try again."
    exit 1
fi