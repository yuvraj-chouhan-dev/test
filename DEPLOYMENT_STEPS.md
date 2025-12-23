# Step-by-Step Deployment Guide

Follow these steps in order to deploy your application successfully.

## Prerequisites

- Server with Node.js 18+ installed
- Domain name pointing to your server
- SSH access to your server
- Basic knowledge of Linux commands

---

## Step 1: Prepare Your Local Environment

### 1.1 Generate JWT Secret
```bash
openssl rand -base64 32
```
**Save this value** - you'll need it for the `.env` file.

### 1.2 Build the Application
```bash
npm install
npm run build
```

Verify the `dist/` folder was created:
```bash
ls -la dist/
```

### 1.3 Test Locally
```bash
# Create test .env
echo "NODE_ENV=production
JWT_SECRET=your-generated-secret-here
ALLOWED_ORIGINS=http://localhost:8080
PORT=8080" > .env

# Test
npm start
```

Visit `http://localhost:8080` and verify it works.

---

## Step 2: Prepare Server

### 2.1 Connect to Server
```bash
ssh user@your-server-ip
```

### 2.2 Install Node.js (if not installed)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be 18+
npm --version
```

### 2.3 Install PM2
```bash
sudo npm install -g pm2
```

### 2.4 Install Nginx (if not installed)
```bash
sudo apt-get update
sudo apt-get install nginx
```

### 2.5 Create Application Directory
```bash
sudo mkdir -p /var/www/webprometrics
sudo chown $USER:$USER /var/www/webprometrics
```

---

## Step 3: Upload Application

### Option A: Using Git (Recommended)
```bash
# On server
cd /var/www/webprometrics
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

### Option B: Using SCP
```bash
# From your local machine
scp -r . user@your-server:/var/www/webprometrics/
```

### Option C: Using rsync
```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude '.git' . user@your-server:/var/www/webprometrics/
```

---

## Step 4: Configure Application

### 4.1 Create .env File
```bash
cd /var/www/webprometrics
nano .env
```

Add:
```env
NODE_ENV=production
JWT_SECRET=your-generated-secret-from-step-1
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
PORT=8080
GEMINI_API_KEY=your-key-if-needed
```

Save and exit (Ctrl+X, then Y, then Enter).

### 4.2 Install Dependencies
```bash
npm install --production
```

### 4.3 Build Frontend
```bash
npm run build
```

### 4.4 Create Logs Directory
```bash
mkdir -p logs
```

---

## Step 5: Set Up PM2

### 5.1 Start Application
```bash
pm2 start ecosystem.config.js
```

### 5.2 Verify It's Running
```bash
pm2 status
pm2 logs webprometrics
```

### 5.3 Save PM2 Configuration
```bash
pm2 save
```

### 5.4 Set Up Auto-Start
```bash
pm2 startup
# Follow the instructions it provides
```

---

## Step 6: Configure Nginx

### 6.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/webprometrics
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be set up in next step)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    
    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }
    
    # Static files (optional - can serve directly from Nginx)
    location /static {
        alias /var/www/webprometrics/dist;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/webprometrics /etc/nginx/sites-enabled/
sudo nginx -t
```

### 6.3 Reload Nginx
```bash
sudo systemctl reload nginx
```

---

## Step 7: Set Up SSL Certificate

### 7.1 Install Certbot
```bash
sudo apt-get install certbot python3-certbot-nginx
```

### 7.2 Get Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically configure Nginx.

### 7.3 Test Auto-Renewal
```bash
sudo certbot renew --dry-run
```

---

## Step 8: Configure Firewall

### 8.1 Allow Required Ports
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 8.2 Verify
```bash
sudo ufw status
```

---

## Step 9: Verify Deployment

### 9.1 Check Application Status
```bash
pm2 status
pm2 logs webprometrics --lines 50
```

### 9.2 Test Health Endpoint
```bash
curl http://localhost:8080/health
```

### 9.3 Test from Browser
- Visit `https://yourdomain.com`
- Check browser console for errors
- Test login/signup functionality
- Verify all pages load correctly

---

## Step 10: Set Up Monitoring

### 10.1 Install PM2 Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 10.2 Set Up Monitoring (Optional)
```bash
pm2 link <secret> <public>
```

---

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs webprometrics

# Check if port is in use
sudo lsof -i :8080

# Verify .env file
cat .env

# Check Node.js version
node --version
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify proxy_pass URL
curl http://localhost:8080/health
```

### SSL Certificate Issues
```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew
```

### Database Issues
```bash
# Check db.json permissions
ls -la db.json

# Verify file exists
cat db.json
```

---

## Maintenance Commands

### Update Application
```bash
cd /var/www/webprometrics
git pull
npm install --production
npm run build
pm2 restart webprometrics
```

### View Logs
```bash
pm2 logs webprometrics
pm2 logs webprometrics --lines 100
```

### Restart Application
```bash
pm2 restart webprometrics
```

### Stop Application
```bash
pm2 stop webprometrics
```

### Check Status
```bash
pm2 status
pm2 info webprometrics
```

---

## Security Checklist

- [ ] `.env` file has correct permissions (600)
- [ ] `db.json` is backed up regularly
- [ ] Firewall is configured
- [ ] SSL certificate is active
- [ ] Nginx security headers are set
- [ ] PM2 is running as non-root user
- [ ] Application files have correct ownership
- [ ] Logs are rotated
- [ ] Regular backups are configured

---

## Success Criteria

Your deployment is successful when:
- ✅ Application loads at `https://yourdomain.com`
- ✅ Health endpoint returns 200: `curl https://yourdomain.com/health`
- ✅ Login/Signup works
- ✅ All pages load correctly
- ✅ SSL certificate is valid
- ✅ PM2 shows app as "online"
- ✅ No errors in logs

---

**Congratulations! Your application is now deployed! 🎉**

