# 🎃 Music Assistant Party Gatekeeper (Halloween Edition)

An interactive, responsive web application that gates access to the **Music Assistant Party Mode** queue with a fun trivia challenge.
- **Default Theme**: Spooky Halloween atmosphere with 25+ curated Halloween music, horror soundtrack, and pop-culture trivia questions.
- **Reward**: Solving the trivia unlocks **1 Boost** (queue jumper / play next) and **2 Song Requests** in the party jukebox.
- **Multi-Theme Support**: Easily switch themes (Halloween, Electric Neon, Cyberpunk 2077, Midnight Lounge) and question packs via the built-in host admin panel.
- **Deployment Ready**: Designed to be deployed to **AWS** under **`party.raverendo.com`** and redirect guests to your Home Assistant / Music Assistant instance at **`home.raverendo.com`**.

---

## 🎧 How It Works with Music Assistant Party Mode

Music Assistant has a built-in **Party Plugin** that allows guests to queue music without logging into Home Assistant.

### 1. Configure the Party Plugin in Music Assistant
1. In Home Assistant (at `https://home.raverendo.com`), open **Music Assistant**.
2. Go to **Settings** → **Plugins** → **Party**.
3. Under **Rate Limiting (Advanced)**:
   - **Add to Queue**:
     - `Allow Add to Queue`: **On**
     - `Token Limit`: **`2`** *(Guests get 2 song requests)*
     - `Refill Rate`: `15 min` *(or whatever cooldown you prefer)*
   - **Boost**:
     - `Allow Boost`: **On**
     - `Token Limit`: **`1`** *(Guests get 1 boost to play next)*
     - `Refill Rate`: `30 min`
4. Open the Party Dashboard or click the QR code icon to copy the party join URL (e.g. `https://home.raverendo.com/#/party?join=...`).

### 2. Enter the Party URL in the Gatekeeper
Click the ⚙️ **Gear Icon** in the top right of the Gatekeeper web app (default host password: `party`) and paste your Music Assistant party link into **Music Assistant Party URL**.

---

## 🚀 Local Development & Running

### Prerequisites
- Node.js 18+ (tested with Node 20)
- npm 9+

### Quick Start
```bash
# 1. Install root dependencies
npm install

# 2. Install client dependencies
cd client
npm install
cd ..

# 3. Build client
npm run build

# 4. Start the server
npm start
```
The application will be running at `http://localhost:3000`.

### Running in Dev Mode (with Live Reload)
```bash
# Terminal 1: Run Backend
npm run dev:server

# Terminal 2: Run Vite Frontend
cd client
npm run dev
```
Open `http://localhost:5173` (Vite proxies API calls to port 3000).

---

## 🏠 Option 1: Deploy to Your Home Lab Server (Recommended — $0 Extra Cost!)

Because you already run Home Assistant / Music Assistant on your home network (`home.raverendo.com`), you can run this gatekeeper container directly on your home lab server right alongside it.

### Step 1: Copy Files & Run with Docker Compose
On your Home Lab Linux server, Proxmox LXC, or VM:
```bash
# Clone or copy the music-party-gate directory
cd music-party-gate

# Start container (builds if needed, restarts automatically)
docker compose up -d --build
```
Your gatekeeper will be running locally at `http://<YOUR_HOMELAB_IP>:3000`.

### Step 2: Route `party.raverendo.com` via Reverse Proxy

#### If using Cloudflare Tunnel (cloudflared):
1. In the Cloudflare Zero Trust Dashboard, go to **Access** → **Tunnels** → your active tunnel.
2. Add a **Public Hostname**:
   - **Subdomain**: `party`
   - **Domain**: `raverendo.com`
   - **Service Type**: `HTTP`
   - **URL**: `localhost:3000` (or `http://<YOUR_HOMELAB_IP>:3000`)
3. Save hostname. Cloudflare automatically generates the SSL certificate!

#### If using Nginx Proxy Manager, Traefik, or Caddy:
Add a proxy host pointing `party.raverendo.com` to `http://localhost:3000` with **Websockets Support** and **Request SSL** enabled.

---

## ☁️ Option 2: Deploy to AWS Lightsail ($3.50/mo Flat-Rate VPS)

If you prefer off-site cloud hosting on AWS with a dedicated static IP and persistent storage:

### Step 1: Launch Lightsail Instance
1. Go to the [AWS Lightsail Console](https://lightsail.aws.amazon.com/).
2. Click **Create instance**.
3. Select **Linux/Unix** platform and **Ubuntu 22.04 LTS** blueprint.
4. Select the **$3.50/mo** plan (512 MB RAM, 1 vCPU, 20 GB SSD) or $5/mo plan.
5. In the instance's **Networking** tab:
   - Click **Attach static IP** to give it a permanent public IP.
   - Under **IPv4 Firewall**, ensure ports **22 (SSH)**, **80 (HTTP)**, and **443 (HTTPS)** are open.

### Step 2: Run the Automated Setup Script
SSH into your Lightsail instance (or click **Connect using SSH** in the AWS console):
```bash
# Clone your repository
git clone https://github.com/<your-user>/music-party-gate.git /opt/music-party-gate
cd /opt/music-party-gate

# Run the automated installer (installs Docker, Caddy SSL, and starts the app)
chmod +x deploy/setup-aws-lightsail.sh
./deploy/setup-aws-lightsail.sh
```

### Step 3: Point DNS to Lightsail
In your DNS provider (Route 53, Cloudflare, Namecheap, etc.):
- Create an **A Record**:
  - **Name / Host**: `party` (or `party.raverendo.com`)
  - **Points to**: `<YOUR_LIGHTSAIL_STATIC_IP>`
Caddy automatically detects the domain and provisions a free Let's Encrypt SSL certificate!

---

## 🚀 Option 3: Deploy to AWS App Runner (Serverless PaaS)

If you push this project to a GitHub repository, AWS App Runner can deploy it directly without managing any servers:

1. Push this project to GitHub.
2. Open [AWS App Runner Console](https://console.aws.amazon.com/apprunner).
3. Click **Create service** → Source: **Source code repository**.
4. Connect your GitHub account and select the `music-party-gate` repository.
5. In **Configuration file**, select **Use a configuration file** (it will automatically use the included [`apprunner.yaml`](file:///c:/Users/joera/Development/music-party-gate/apprunner.yaml)).
6. Under **Custom domains**, link `party.raverendo.com` and add the validated CNAME records to your DNS.


## 🛠️ Customizing Themes & Questions

### Visual Themes
The app includes 4 built-in responsive themes:
- **🎃 Spooky Halloween (Default)**: Dark violet & pumpkin glow, fog gradients, floating spooky particles.
- **⚡ Electric Neon**: Cyber neon blues and pinks.
- **🌆 Cyberpunk 2077**: High-tech yellow, neon cyan, and rose accents.
- **🍸 Midnight Lounge**: Classy deep indigo and teal.

You can switch the active theme instantly in the **Host Administration** panel or in `data/config.json`.

### Questions Bank
All trivia questions are stored in `data/questions.json`.
- Host can add, edit, and delete questions live through the in-app Admin modal without restarting the server.
- Click **Reset Defaults** at any time to restore the original 25 Halloween music and pop-culture questions.
- Anti-cheat protection: Options and questions are randomized; answer keys are never sent to the client browser until verified by the server.
