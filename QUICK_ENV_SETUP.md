# Quick Environment Variables Setup

## ✅ I've Generated Everything For You!

**Your JWT Secret:** `7oPS78NJKNRXiZzTJLp231vz0RAEcGfVfnBiK7egLTQ=`

---

## Option 1: Automated Setup (Easiest) ⭐

Run this command:
```bash
node setup-env.js
```

The script will:
- ✅ Generate a secure JWT secret
- ✅ Ask for your domain
- ✅ Create the `.env` file automatically
- ✅ Configure everything correctly

---

## Option 2: Manual Setup

### Step 1: Create `.env` File

Create a file named `.env` in the root directory (same folder as `package.json`).

### Step 2: Copy This Template

```env
# Server Configuration
PORT=8080
NODE_ENV=production

# JWT Configuration
JWT_SECRET=7oPS78NJKNRXiZzTJLp231vz0RAEcGfVfnBiK7egLTQ=

# CORS Configuration
# REPLACE yourdomain.com WITH YOUR ACTUAL DOMAIN
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Step 3: Replace Your Domain

**Change this line:**
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**To your actual domain, for example:**
```env
ALLOWED_ORIGINS=https://webprometrics.com,https://www.webprometrics.com
```

**Or if you only have one domain:**
```env
ALLOWED_ORIGINS=https://webprometrics.com
```

---

## ✅ Verification Checklist

After creating `.env`, verify:

- [ ] File is named exactly `.env` (not `.env.txt`)
- [ ] File is in the root directory (same folder as `package.json`)
- [ ] `JWT_SECRET` has a value (the generated secret above)
- [ ] `ALLOWED_ORIGINS` contains your actual domain(s)
- [ ] No spaces around the `=` sign
- [ ] Each variable is on its own line

---

## 🧪 Test It

```bash
npm start
```

You should see:
```
🚀 Server running on port 8080
📦 Environment: production
🔒 Security: Enabled
```

If you see an error about `JWT_SECRET`, double-check your `.env` file.

---

## 📝 Example .env File

Here's a complete example (replace with your domain):

```env
PORT=8080
NODE_ENV=production
JWT_SECRET=7oPS78NJKNRXiZzTJLp231vz0RAEcGfVfnBiK7egLTQ=
ALLOWED_ORIGINS=https://webprometrics.com,https://www.webprometrics.com
```

---

## ⚠️ Important Notes

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Keep JWT_SECRET secret** - Don't share it publicly
3. **Update ALLOWED_ORIGINS** - Must match your actual domain(s)
4. **Use HTTPS in production** - Always use `https://` in ALLOWED_ORIGINS

---

## 🚀 You're Done!

Once you've created the `.env` file with your domain, you're ready to:
1. Build: `npm run build`
2. Deploy: `npm start`

See `DEPLOYMENT_STEPS.md` for full deployment instructions.

