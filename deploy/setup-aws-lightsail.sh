#!/bin/bash
# ==============================================================================
# AWS Lightsail / EC2 Ubuntu Setup Script for Music Party Gatekeeper
# Run this on a fresh Ubuntu 22.04 or 24.04 Lightsail instance ($3.50 or $5/mo)
# ==============================================================================

set -e

DOMAIN="party.raverendo.com"
APP_DIR="/opt/music-party-gate"

echo "=========================================="
echo " Setting up Music Party Gatekeeper on AWS "
echo " Target Domain: https://$DOMAIN"
echo "=========================================="

# 1. Update and install prerequisites
echo "--> Updating system packages..."
sudo apt-get update && sudo apt-get install -y curl git ufw ca-certificates gnupg

# 2. Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "--> Installing Docker..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
fi

# 3. Install Caddy for Automatic Free HTTPS (Let's Encrypt)
if ! command -v caddy &> /dev/null; then
    echo "--> Installing Caddy web server (automatic SSL)..."
    sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt-get update
    sudo apt-get install -y caddy
fi

# 4. Configure Caddy reverse proxy
echo "--> Configuring Caddy for $DOMAIN..."
sudo tee /etc/caddy/Caddyfile > /dev/null <<EOF
$DOMAIN {
    reverse_proxy localhost:3000
}
EOF
sudo systemctl restart caddy

# 5. Configure Firewall (allow HTTP, HTTPS, and SSH)
echo "--> Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 6. Setup Application Directory
echo "--> Preparing application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

echo "=========================================================="
echo " Setup complete! Next steps:"
echo " 1. Copy your application files or git clone into: $APP_DIR"
echo " 2. cd $APP_DIR"
echo " 3. Ensure your DNS record points $DOMAIN to this server's public IP"
echo " 4. Run: docker compose up -d --build"
echo " 5. Open https://$DOMAIN in your browser!"
echo "=========================================================="
