#!/bin/bash
# scripts/start-wireguard.sh

echo "?? Starting WireGuard setup..."

# Check if WireGuard config is provided
if [ -z "$WIREGUARD_CONF_STR" ]; then
    echo "? WIREGUARD_CONF_STR environment variable is not set"
    exit 1
fi

# Write WireGuard config from environment variable
echo "$WIREGUARD_CONF_STR" > /etc/wireguard/wg0.conf

echo "?? WireGuard config written to /etc/wireguard/wg0.conf"
echo "?? Config preview:"
head -5 /etc/wireguard/wg0.conf

# Ensure proper permissions
chmod 600 /etc/wireguard/wg0.conf

# Load WireGuard module
modprobe wireguard 2>/dev/null || echo "?? WireGuard module load failed (may be built-in)"

# Start WireGuard
echo "?? Starting WireGuard interface..."
wg-quick up wg0

if [ $? -eq 0 ]; then
    echo "? WireGuard started successfully"
    wg show wg0
else
    echo "? Failed to start WireGuard"
    exit 1
fi

# Keep monitoring WireGuard connection
while true; do
    if ! wg show wg0 > /dev/null 2>&1; then
        echo "?? WireGuard connection lost, attempting restart..."
        wg-quick down wg0 2>/dev/null || true
        sleep 5
        wg-quick up wg0
        if [ $? -eq 0 ]; then
            echo "? WireGuard restarted successfully"
        else
            echo "? Failed to restart WireGuard"
        fi
    fi
    sleep 30
done