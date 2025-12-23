# Environment Variables Setup Guide

## Quick Setup (5 minutes)

### Step 1: Generate JWT Secret

I've already generated one for you: `7oPS78NJKNRXiZzTJLp231vz0RAEcGfVfnBiK7egLTQ=`

**Or generate a new one:**
```bash
# Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Linux/Mac
openssl rand -base64 32
```

### Step 2: Create .env File

**Option A: Copy the example file**
```bash
# Copy .env.example to .env
cp .env.example .env
```

**Option B: Create manually**
Create a file named `.env` in the root directory with this content:

```env
# Server Configuration
PORT=8080
NODE_ENV=production

# JWT Configuration
JWT_SECRET=7oPS78NJKNRXiZzTJLp231vz0RAEcGfVfnBiK7egLTQ=

# CORS Configuration
# REPLACE THESE WITH YOUR ACTUAL DOMAIN(S)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Step 3: Update with Your Domain

**IMPORTANT:** Replace `https://yourdomain.com` with your actual production domain(s).

**Examples:**
- Single domain: `ALLOWED_ORIGINS=https://webprometrics.com`
- Multiple domains: `ALLOWED_ORIGINS=https://webprometrics.com,https://www.webprometrics.com`
- With subdomain: `ALLOWED_ORIGINS=https://app.webprometrics.com,https://webprometrics.com`

### Step 4: Verify .env File

Make sure:
- ✅ File is named exactly `.env` (not `.env.txt` or `env`)
- ✅ No spaces around the `=` sign
- ✅ No quotes around values (unless the value itself contains spaces)
- ✅ Each variable on its own line
- ✅ `JWT_SECRET` is set (not empty)
- ✅ `ALLOWED_ORIGINS` contains your actual domain(s)

### Step 5: Test Configuration

```bash
# Test that the server can read the .env file
npm start
```

You should see:
```
🚀 Server running on port 8080
📦 Environment: production
🔒 Security: Enabled
```

If you see an error about `JWT_SECRET`, check your `.env` file.

---

## Required Variables Explained

### `NODE_ENV=production`
- **Purpose:** Tells the application to run in production mode
- **Effects:** 
  - Enables security features
  - Disables debug information
  - Requires JWT_SECRET to be set
- **Required:** ✅ YES

### `JWT_SECRET`
- **Purpose:** Secret key used to sign and verify JWT authentication tokens
- **Security:** Must be a strong, random string (32+ characters)
- **Generated:** Already generated for you above
- **Required:** ✅ YES (in production)

### `ALLOWED_ORIGINS`
- **Purpose:** Controls which domains can make requests to your API (CORS)
- **Format:** Comma-separated list, no spaces after commas
- **Example:** `https://webprometrics.com,https://www.webprometrics.com`
- **Required:** ✅ YES (in production)

### `PORT`
- **Purpose:** Port number the server listens on
- **Default:** 8080
- **Required:** ⚠️ Optional (defaults to 8080)

---

## Common Issues

### Issue: "JWT_SECRET must be set in production!"
**Solution:** 
- Make sure `.env` file exists in the root directory
- Check that `JWT_SECRET=` line is not commented out
- Verify there are no spaces: `JWT_SECRET=value` (not `JWT_SECRET = value`)

### Issue: CORS errors in browser
**Solution:**
- Check `ALLOWED_ORIGINS` includes your exact domain
- Include protocol: `https://` not just `webprometrics.com`
- No trailing slashes: `https://webprometrics.com` not `https://webprometrics.com/`

### Issue: .env file not being read
**Solution:**
- File must be named exactly `.env` (case-sensitive)
- Must be in the root directory (same folder as `package.json`)
- Restart the server after creating/modifying `.env`

---

## Security Checklist

Before deploying:
- [ ] `.env` file is in `.gitignore` (already done)
- [ ] `JWT_SECRET` is a strong random string (32+ characters)
- [ ] `ALLOWED_ORIGINS` only includes your production domains
- [ ] No sensitive data in `.env` is committed to git
- [ ] `.env` file permissions are restricted (600 on Linux)

---

## Production Deployment

When deploying to your server:

1. **Create `.env` on server:**
   ```bash
   nano /var/www/webprometrics/.env
   ```

2. **Copy the same values** (or generate a new JWT_SECRET for production)

3. **Update ALLOWED_ORIGINS** with your production domain

4. **Set file permissions:**
   ```bash
   chmod 600 .env
   ```

5. **Verify:**
   ```bash
   cat .env  # Should show your variables
   ```

---

## Quick Reference

**Minimum required .env for production:**
```env
NODE_ENV=production
JWT_SECRET=<your-generated-secret>
ALLOWED_ORIGINS=https://yourdomain.com
```

**Full example:**
```env
PORT=8080
NODE_ENV=production
JWT_SECRET=7oPS78NJKNRXiZzTJLp231vz0RAEcGfVfnBiK7egLTQ=
ALLOWED_ORIGINS=https://webprometrics.com,https://www.webprometrics.com
GEMINI_API_KEY=your-key-if-needed
```

---

**You're all set!** Once you create the `.env` file with your domain, you're ready to build and deploy. 🚀

