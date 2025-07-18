#!/bin/bash

# Navigate to project root (parent directory of scripts)
cd "$(dirname "$0")/.."

echo "=== Container Status ==="
docker-compose ps

echo ""
echo "=== Certificate Status ==="
if [ -d "certbot/conf/live/vpn1.remoteconnect.hu" ]; then
    docker-compose exec certbot certbot certificates
else
    echo "No certificates found. Run ./scripts/get-certificates.sh to obtain them."
fi

echo ""
echo "=== Nginx Configuration Test ==="
docker-compose exec nginx nginx -t

echo ""
echo "=== Access URLs ==="
echo "WireGuard Manager: https://vpn1.remoteconnect.hu (with basic auth)"
echo "Example app on port 8080: https://8080.vpn1.remoteconnect.hu"
echo "Example app on port 9000: https://9000.vpn1.remoteconnect.hu"