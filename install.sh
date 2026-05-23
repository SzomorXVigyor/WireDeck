#!/bin/bash
set -e

# Repository details
REPO="szomorxvigyor/wiredeck"
BRANCH="main"
BASE_URL="https://raw.githubusercontent.com/$REPO/$BRANCH"

echo "Downloading WireDeck configuration files..."

# Create necessary directories
mkdir -p nginx/html nginx/sites database

# Download docker-compose.yml
echo "Downloading docker-compose.yml..."
curl -sSL "$BASE_URL/docker-compose.yml" -o docker-compose.yml

# Download .env.example
echo "Downloading .env.example..."
curl -sSL "$BASE_URL/.env.example" -o .env.example

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example. Please review and edit your .env file."
fi

# Download nginx folder contents
echo "Downloading nginx configuration..."
curl -sSL "$BASE_URL/nginx/nginx.conf" -o nginx/nginx.conf
curl -sSL "$BASE_URL/nginx/error-pages.conf" -o nginx/error-pages.conf
curl -sSL "$BASE_URL/nginx/html/502.html" -o nginx/html/502.html
curl -sSL "$BASE_URL/nginx/html/503.html" -o nginx/html/503.html
curl -sSL "$BASE_URL/nginx/html/504.html" -o nginx/html/504.html

# Make the script executable for future use (if downloaded directly)
chmod +x "$0"

echo ""
echo "Installation files downloaded successfully!"
echo "Next steps:"
echo "1. Edit the .env file with your specific configuration."
echo "2. Run 'docker compose up -d' to start WireDeck."
