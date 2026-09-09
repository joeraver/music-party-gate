#!/bin/bash
# ==============================================================================
# Home Lab Quick Launch Script for Music Party Gatekeeper
# Run this on your Home Lab server (Proxmox LXC, Ubuntu, Debian, etc.)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo " Starting Music Party Gatekeeper (Home Lab)"
echo "=========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "ℹ️  Creating .env from .env.example..."
    cp .env.example .env
fi

# Build and start container
echo "--> Building and starting Docker container..."
docker compose up -d --build

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================================="
echo " ✅ Music Party Gatekeeper is running!"
echo " Local Network URL: http://${LOCAL_IP}:3000"
echo ""
echo " 🌐 Reverse Proxy / Cloudflare Tunnel Configuration:"
echo "    Service Type: HTTP"
echo "    URL:          localhost:3000 (or ${LOCAL_IP}:3000)"
echo "    Domain:       party.raverendo.com"
echo "=========================================================="
