#!/bin/bash

# Navigate to project root (parent directory of scripts)
cd "$(dirname "$0")/.."

# Show logs for all services or specific service
if [ $# -eq 0 ]; then
    echo "Showing logs for all services..."
    docker-compose logs -f
else
    echo "Showing logs for service: $1"
    docker-compose logs -f "$1"
fi