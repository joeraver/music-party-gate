# 🏠 Comprehensive Guide: Hosting on HexOS & Configuring Squarespace Domains

This single, step-by-step checklist walks you through deploying the **Music Party Gatekeeper** to your **HexOS (TrueNAS SCALE)** server and routing traffic via **Squarespace Domains** for `https://party.raverendo.com`.

---

## 📋 Overview of the Setup

* **Public Gatekeeper URL**: `https://party.raverendo.com`
* **Target Redirect (Music Assistant)**: `https://home.raverendo.com/#/party`
* **DNS Registrar**: Squarespace Domains
* **Server**: HexOS / TrueNAS SCALE (Docker Compose)
* **Storage**: Persistent ZFS path for config and custom questions

---

## Step 1: Configure Squarespace Domains DNS

Because you already have `home.raverendo.com` pointing to your home network, you can use a **CNAME record**. This ensures `party.raverendo.com` automatically tracks your home IP without needing extra dynamic DNS (DDNS) tools.

1. Go to the [Squarespace Domains Dashboard](https://account.squarespace.com/domains).
2. Click your domain: **`raverendo.com`**.
3. In the left menu, select **DNS** (or **DNS Settings**).
4. Scroll down to the **Custom Records** section.
5. Click **Add Record** and enter:
   * **Host / Name**: `party`
   * **Type**: `CNAME`
   * **Data / Points to**: `home.raverendo.com.` *(Include the trailing dot if Squarespace accepts it, otherwise just `home.raverendo.com`)*
6. Click **Save** / **Add**.

---

## Step 2: Prepare Persistent Storage on HexOS

HexOS uses TrueNAS SCALE's ZFS storage pool. Creating a dedicated dataset or folder ensures your trivia questions and settings never get deleted when updating containers.

1. Open your **HexOS / TrueNAS Web GUI**.
2. Go to **Datasets** (or **Storage**).
3. Under your main storage pool (e.g. `tank` or `storage`), create or locate your apps directory:
   ```text
   /mnt/<YOUR_POOL>/apps/music-party-gate/data
   ```

---

## Step 3: Copy Files to HexOS & Launch Container

### Method A: Via TrueNAS Shell / SSH (Fastest)

1. In HexOS, open the **Shell** (or SSH into your server).
2. Navigate to your apps folder:
   ```bash
   cd /mnt/<YOUR_POOL>/apps
   ```
3. Clone or copy your project repository:
   ```bash
   git clone <YOUR_GIT_REPO_URL> music-party-gate
   cd music-party-gate
   ```
   *(Or if copying directly from Windows, use SMB/SFTP to place the folder in `/mnt/<YOUR_POOL>/apps/music-party-gate`)*

4. Check your `.env` settings:
   ```bash
   nano .env
   ```
   Ensure these match your party:
   ```ini
   PORT=3000
   PARTY_URL=https://home.raverendo.com/#/party
   ADMIN_PASSWORD=party
   THEME=halloween
   ```

5. Launch the container:
   ```bash
   docker compose up -d --build
   ```

6. Verify the container is running:
   ```bash
   docker ps
   ```
   You should see `music-party-gate` running and listening on port `3000`.

7. **Test local access**: Open your web browser on your PC or phone and visit:
   ```text
   http://<YOUR_HEXOS_IP>:3000
   ```
   You should see the Halloween Gatekeeper trivia card!

---

### Method B: Via HexOS / TrueNAS Web UI ("Custom App")

If you prefer using the GUI instead of the command line:

1. In TrueNAS / HexOS, go to **Apps** → **Discover Apps** → **Install Custom App**.
2. Set the configuration:
   * **Application Name**: `music-party-gate`
   * **Image**: `music-party-gate:latest` (or your Docker repository)
   * **Port Forwarding**:
     * Container Port: `3000`
     * Host / Node Port: `3000`
   * **Storage / Host Path**:
     * Host Path: `/mnt/<YOUR_POOL>/apps/music-party-gate/data`
     * Container Path: `/app/data`
   * **Environment Variables**:
     * `PARTY_URL` = `https://home.raverendo.com/#/party`
     * `ADMIN_PASSWORD` = `party`
     * `THEME` = `halloween`
3. Click **Install**.

---

## Step 4: Route Traffic & SSL to `party.raverendo.com`

Since `home.raverendo.com` already reaches your home network, traffic hitting `party.raverendo.com` now reaches the same router/reverse proxy. You just need to add a route forwarding `party` to port `3000`.

Select whichever reverse proxy you currently use:

### Option 1: If You Use Cloudflare Tunnel (`cloudflared`)
1. Go to the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels**.
2. Click your active tunnel → **Configure** → **Public Hostnames**.
3. Click **Add a public hostname**:
   * **Subdomain**: `party`
   * **Domain**: `raverendo.com`
   * **Service Type**: `HTTP`
   * **URL**: `<YOUR_HEXOS_IP>:3000` (or `localhost:3000` if cloudflared is on the same machine)
4. Click **Save Hostname**. *(Cloudflare automatically provisions the SSL certificate immediately!)*

### Option 2: If You Use Nginx Proxy Manager (NPM)
1. Log into your **Nginx Proxy Manager** web interface.
2. Go to **Hosts** → **Proxy Hosts** → **Add Proxy Host**.
3. In the **Details** tab:
   * **Domain Names**: `party.raverendo.com`
   * **Scheme**: `http`
   * **Forward Hostname / IP**: `<YOUR_HEXOS_IP>`
   * **Forward Port**: `3000`
   * Toggle **Block Common Exploits**: ON
   * Toggle **Websockets Support**: ON
4. In the **SSL** tab:
   * Select **Request a new SSL Certificate**.
   * Toggle **Force SSL**: ON
   * Agree to the Let's Encrypt TOS.
5. Click **Save**.

### Option 3: If You Use Caddy
Add this block to your `Caddyfile`:
```caddy
party.raverendo.com {
    reverse_proxy <YOUR_HEXOS_IP>:3000
}
```
Then run `caddy reload`.

---

## Step 5: End-to-End Verification

Once DNS has propagated (usually 1–5 minutes):

1. On your phone (on mobile data, off Wi-Fi to test external routing), visit:
   ```text
   https://party.raverendo.com
   ```
2. Verify:
   * 🔒 **Green Padlock / HTTPS**: Valid SSL certificate.
   * 🎃 **Halloween Theme**: Spooky purple/orange theme, fog particles, and trivia challenge question.
   * ❌ **Wrong Answer Test**: Select a wrong answer; verify the card shakes and gives an encouraging retry message.
   * ✅ **Correct Answer Test**: Select the right answer; verify confetti fires, you see **"1 Boost & 2 Song Requests"**, and the countdown redirects you to **`https://home.raverendo.com/#/party`**.
   * ⚙️ **Host Admin Test**: Click the gear icon in the top right, enter password `party`, and verify you can edit questions, change themes, or update the party link live.
