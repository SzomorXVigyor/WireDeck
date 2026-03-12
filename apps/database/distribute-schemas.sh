#!/bin/bash

# Script to distribute Prisma schemas from database to application backends

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRISMA_DIR="$SCRIPT_DIR/prisma"

# Check if prisma directory exists
if [ ! -d "$PRISMA_DIR" ]; then
    echo "Error: Prisma directory not found at $PRISMA_DIR"
    exit 1
fi

# Iterate through each app-specific schema directory
for app_dir in "$PRISMA_DIR"/*; do
    if [ -d "$app_dir" ]; then
        app_name=$(basename "$app_dir")
        target_dir="$SCRIPT_DIR/../$app_name/backend/prisma"
        
        # Check if target backend directory exists
        if [ -d "$SCRIPT_DIR/../$app_name/backend" ]; then
            echo "Distributing Prisma schema for: $app_name"
            
            # Create target prisma directory if it doesn't exist
            mkdir -p "$target_dir"
            
            # Copy all prisma files
            cp -v "$app_dir"/* "$target_dir/" 2>/dev/null || {
                echo "Warning: No files found to copy from $app_dir"
            }
            
            echo "Successfully distributed schema to $target_dir"
        else
            echo "Target directory not found: $SCRIPT_DIR/../$app_name/backend"
        fi
    fi
done

echo ""
echo "Schema distribution completed!"
