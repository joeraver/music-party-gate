# 🎃 Music Assistant Party Gatekeeper (S3 + CloudFront Edition)

An ultra-fast, responsive web application that gates access to your **Music Assistant Party Mode** queue with an interactive trivia challenge.
- **Hosted on AWS S3 + CloudFront**: Pure static SPA architecture with zero server maintenance, zero cold starts, sub-100ms global CDN caching, and virtually $0/mo cost.
- **Theme Support**: Default Spooky Halloween atmosphere with 25 curated music & pop-culture trivia questions, plus Electric Neon, Cyberpunk 2077, and Midnight Lounge themes.
- **Party Rewards**: Solving the trivia unlocks **1 Boost** (queue jumper / play next) and **2 Song Requests** before redirecting guests into the jukebox.
- **Host Admin Panel**: Live theme switching, question editing, and party URL customization stored in `localStorage` or via QR code query parameters (e.g. `?join=...`).

---

## 🎧 How It Works with Music Assistant

1. In Home Assistant (`https://home.raverendo.com`), open **Music Assistant** → **Settings** → **Plugins** → **Party**.
2. Configure your rate limits (e.g., 2 song requests every 15 min, 1 boost every 30 min).
3. Copy your party join link (e.g. `https://home.raverendo.com/#/party?join=...`).
4. In the Gatekeeper, click the ⚙️ **Gear Icon** in the top right (host password: `party`) and paste your join link into **Music Assistant Party URL**.

---

## 🚀 Quick Deployment to AWS (S3 + CloudFront)

### Prerequisites
- [AWS CLI v2](https://aws.amazon.com/cli/) configured (`aws configure` or `aws login`)
- Node.js 18+ and npm

### Deploy in One Command

**On Windows (PowerShell):**
```powershell
npm run deploy
```
*(Or run `.\deploy\deploy-s3-cloudfront.ps1` directly)*

**On macOS / Linux:**
```bash
npm run deploy:bash
```

The script will automatically:
1. Compile the React + Vite frontend (`client/dist`).
2. Deploy/update the CloudFormation stack (`music-party-gate`) creating:
   - A private S3 bucket with public access blocked.
   - CloudFront Origin Access Control (OAC).
   - A CloudFront CDN distribution with HTTPS enforcement, SPA routing (403/404 -> `/index.html`), and Brotli/Gzip compression.
3. Sync build assets to the S3 bucket.
4. Invalidate the CloudFront cache (`/*`) so changes are immediately live globally.
5. Print out your live HTTPS URL (e.g. `https://d1234567abcdef.cloudfront.net`).

---

## 🌐 Custom Domain Setup (`party.raverendo.com`)

If you want to use your custom domain with your own SSL certificate:

1. In AWS Certificate Manager (**ACM**), request a free public SSL certificate for `party.raverendo.com` in **`us-east-1`** (CloudFront requires certificates to be in `us-east-1`).
2. Deploy with your domain and certificate ARN:
   ```powershell
   .\deploy\deploy-s3-cloudfront.ps1 -DomainName "party.raverendo.com" -AcmCertificateArn "arn:aws:acm:us-east-1:123456789012:certificate/your-cert-uuid"
   ```
3. In your DNS provider (Route 53, Cloudflare, Squarespace, etc.):
   - Add a **CNAME** record:
     - **Host / Name**: `party`
     - **Value / Target**: `<your-distribution-id>.cloudfront.net`

---

## 💻 Local Development

```bash
# Start Vite development server with instant HMR:
npm run dev

# Or build and test static preview locally:
npm run build
npm run preview
```
Visit `http://localhost:5173` to test locally.

---

## 🔄 Cache Invalidation

If you ever update assets, custom questions, or config and want to purge the CloudFront edge cache without re-running full deployment:
```powershell
npm run invalidate
```

---

## 🛠️ Project Structure

```
├── client/                     # React + Vite + Tailwind static application
│   ├── public/                 # Static assets (config.json, questions.json)
│   ├── src/
│   │   ├── components/         # UI components (QuizCard, AdminModal, etc.)
│   │   ├── services/           # triviaService.ts (zero-server client engine)
│   │   └── App.tsx             # Main application
│   └── package.json
├── data/                       # Trivia questions & default configuration bank
│   ├── config.json
│   └── default_questions.json
├── deploy/                     # Infrastructure as Code & deployment scripts
│   ├── cloudfront-s3.yaml      # CloudFormation template (S3 + OAC + CloudFront)
│   ├── deploy-s3-cloudfront.ps1# Windows PowerShell deployment script
│   ├── deploy-s3-cloudfront.sh # Bash deployment script
│   └── invalidate-cache.ps1    # Cache invalidation utility
├── .github/workflows/          # CI/CD automated deployment
│   └── deploy.yml              # GitHub Actions S3 sync & CloudFront invalidation
└── package.json                # Root scripts
```
