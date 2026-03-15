# TOX Express — Hosting Guide for toxexpress.org

## What You Need
- Domain: **toxexpress.org** (already owned)
- VPS server (DigitalOcean, Hetzner, Vultr, or Contabo — $5-10/month)
- SSH access to your server

---

## OPTION A: VPS (DigitalOcean / Hetzner / Vultr) — RECOMMENDED

### Step 1 — Buy a VPS
| Provider | Price | Link |
|----------|-------|------|
| DigitalOcean | $6/mo | digitalocean.com → Create Droplet |
| Hetzner | €4/mo | hetzner.com → Cloud |
| Vultr | $6/mo | vultr.com → Deploy |
| Contabo | $5/mo | contabo.com → VPS |

Choose **Ubuntu 22.04**, the cheapest plan (1 CPU / 1GB RAM is enough).

### Step 2 — Point Your Domain
Go to your domain registrar (wherever you bought toxexpress.org) and set these DNS records:

```
Type    Name    Value                  TTL
A       @       YOUR_SERVER_IP         3600
A       www     YOUR_SERVER_IP         3600
```

Replace `YOUR_SERVER_IP` with the IP address from your VPS provider.

### Step 3 — Connect to Your Server
Open a terminal (PowerShell or Command Prompt):
```bash
ssh root@YOUR_SERVER_IP
```

### Step 4 — Install Everything (copy/paste this entire block)
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Nginx
apt install -y nginx

# Install PM2 (keeps your app running forever)
npm install -g pm2

# Create app directory
mkdir -p /var/www/toxexpress
```

### Step 5 — Upload Your Files
From your local machine (PowerShell), run:
```powershell
# Upload all files to server (replace YOUR_SERVER_IP)
scp -r "C:\Users\MY PC\Desktop\TRANSPORT WORLD\*" root@YOUR_SERVER_IP:/var/www/toxexpress/
```

Or use **WinSCP** (free graphical tool):
1. Download WinSCP from winscp.net
2. Connect with your server IP + root password
3. Drag all files from `TRANSPORT WORLD` folder to `/var/www/toxexpress/`

### Step 6 — Install Dependencies & Start App
```bash
cd /var/www/toxexpress
npm install
pm2 start server.js --name tox-express
pm2 save
pm2 startup
```

### Step 7 — Configure Nginx (reverse proxy + SSL)
```bash
# Create Nginx config
cat > /etc/nginx/sites-available/toxexpress << 'EOF'
server {
    listen 80;
    server_name toxexpress.org www.toxexpress.org;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/toxexpress /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t && systemctl restart nginx
```

### Step 8 — Install Free SSL (HTTPS)
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (auto-configures Nginx)
certbot --nginx -d toxexpress.org -d www.toxexpress.org --non-interactive --agree-tos -m admin@toxexpress.org

# Auto-renew SSL
systemctl enable certbot.timer
```

Your site is now live at **https://toxexpress.org** with HTTPS!

### Step 9 — Firewall
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw --force enable
```

---

## OPTION B: Railway / Render (Zero-config, no VPS needed)

### Railway (railway.app)
1. Go to railway.app → Sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Push your code to GitHub first:
```powershell
cd "C:\Users\MY PC\Desktop\TRANSPORT WORLD"
git init
git add .
git commit -m "TOX Express initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/toxexpress.git
git push -u origin main
```
4. Railway auto-detects Node.js and deploys
5. Go to Settings → Custom Domain → Add `toxexpress.org`
6. Set the DNS CNAME record shown by Railway at your registrar

### Render (render.com)
1. Go to render.com → New Web Service
2. Connect GitHub repo
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add custom domain `toxexpress.org`

---

## Quick DNS Setup (for any option)

At your domain registrar (Namecheap, GoDaddy, etc.):

**For VPS hosting:**
```
Type    Name    Value              TTL
A       @       YOUR_SERVER_IP     3600
A       www     YOUR_SERVER_IP     3600
```

**For Railway/Render:**
```
Type    Name    Value                          TTL
CNAME   @       your-app.up.railway.app        3600
CNAME   www     your-app.up.railway.app        3600
```

DNS changes take 5-30 minutes to propagate.

---

## Management Commands (VPS)

```bash
# Check status
pm2 status

# View logs
pm2 logs tox-express

# Restart after code changes
cd /var/www/toxexpress && pm2 restart tox-express

# Re-upload files after changes
# (from your local PowerShell)
scp -r "C:\Users\MY PC\Desktop\TRANSPORT WORLD\*" root@YOUR_SERVER_IP:/var/www/toxexpress/
ssh root@YOUR_SERVER_IP "cd /var/www/toxexpress && npm install && pm2 restart tox-express"
```

---

## URLs When Live
| Page | URL |
|------|-----|
| Main Site | https://toxexpress.org |
| Tracking | https://toxexpress.org/tracking.html |
| Dashboard | https://toxexpress.org/dashboard.html |
| Partners | https://toxexpress.org/partners.html |
| Admin | https://toxexpress.org/admin.html |

**Admin Login:** `admin` / `ToxAdmin2026`

---

## Google Search Console (get indexed)
1. Go to search.google.com/search-console
2. Add property → URL prefix → `https://toxexpress.org`
3. Verify with DNS TXT record or HTML file
4. Submit sitemap: `https://toxexpress.org/sitemap.xml`
