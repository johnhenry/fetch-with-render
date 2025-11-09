#!/bin/bash
# scripts/install_ngrok.sh
# Minimal ngrok installation script

set -e

if command -v ngrok &> /dev/null; then
    echo "✓ ngrok already installed ($(ngrok version))"
    exit 0
fi

echo "→ Installing ngrok..."
cd /tmp
wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xzf ngrok-v3-stable-linux-amd64.tgz
mv ngrok /usr/local/bin/
chmod +x /usr/local/bin/ngrok
rm ngrok-v3-stable-linux-amd64.tgz

echo "✓ ngrok installed ($(ngrok version))"

# Configure if token is set
[ ! -z "$NGROK_TOKEN" ] && ngrok config add-authtoken "$NGROK_TOKEN" && echo "✓ Token configured"
