#!/bin/bash

# Navigate to project root (parent directory of scripts)
cd "$(dirname "$0")/.."

# Create necessary directories
mkdir -p nginx/conf.d nginx/logs certbot/conf certbot/www

# Create .htpasswd file for basic authentication
echo "Creating basic auth credentials..."
read -p "Enter username for basic auth: " USERNAME
read -s -p "Enter password for basic auth: " PASSWORD
echo

# Check if htpasswd is available
if ! command -v htpasswd &> /dev/null; then
    echo "htpasswd not found. Installing apache2-utils..."
    
    # Detect the system and install htpasswd
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y apache2-utils
    elif command -v yum &> /dev/null; then
        sudo yum install -y httpd-tools
    elif command -v apk &> /dev/null; then
        sudo apk add apache2-utils
    elif command -v brew &> /dev/null; then
        brew install httpd
    else
        echo "Could not install htpasswd. Please install apache2-utils (Debian/Ubuntu) or httpd-tools (CentOS/RHEL) manually."
        exit 1
    fi
fi

# Create the .htpasswd file
htpasswd -cb nginx/.htpasswd "$USERNAME" "$PASSWORD"

echo "Basic auth file created!"

# Set proper permissions
chmod 644 nginx/.htpasswd

echo "Setup complete! Now you can run: docker-compose up -d"
echo ""
echo "After the containers are running, obtain SSL certificates with:"
echo "./scripts/get-certificates.sh"