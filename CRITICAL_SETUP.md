# 🔴 CRITICAL: Environment Variables Setup

## ⚡ Quick Setup (2 minutes)

### Your Generated JWT Secret:
```
7oPS78NJKNRXiZzTJLp231vz0RAEcGfVfnBiK7egLTQ=
```

---

## 🎯 What You Need To Do

### Step 1: Create `.env` File

Create a file named `.env` in the root directory (same folder as `package.json`).

### Step 2: Copy This Content

```env
NODE_ENV=production
JWT_SECRET=7oPS78NJKNRXiZzTJLp231vz0RAEcGfVfnBiK7egLTQ=
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
PORT=8080
```

### Step 3: Replace `yourdomain.com`

**Change this:**
```
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**To your actual domain, for example:**
```
ALLOWED_ORIGINS=https://webprometrics.com,https://www.webprometrics.com
```

---

## ✅ Or Use Automated Setup

Run this command:
```bash
node setup-env.js
```

It will ask you for your domain and create everything automatically!

---

## 🧪 Verify It Works

```bash
npm start
```

**Expected output:**
```
🚀 Server running on port 8080
📦 Environment: production
🔒 Security: Enabled
```

**If you see an error about JWT_SECRET:**
- Check that `.env` file exists
- Check that `JWT_SECRET=` line is not empty
- Make sure there are no spaces around the `=` sign

---

## 📋 Checklist

Before deploying, make sure:

- [ ] `.env` file exists in root directory
- [ ] `NODE_ENV=production` is set
- [ ] `JWT_SECRET` has a value (use the one above or generate new)
- [ ] `ALLOWED_ORIGINS` contains your actual domain(s)
- [ ] Domain includes `https://` protocol
- [ ] No spaces around `=` signs
- [ ] Tested with `npm start` - no errors

---

## 🚨 Common Mistakes

❌ **Wrong:** `JWT_SECRET = value` (spaces around =)  
✅ **Right:** `JWT_SECRET=value`

❌ **Wrong:** `ALLOWED_ORIGINS=webprometrics.com` (missing https://)  
✅ **Right:** `ALLOWED_ORIGINS=https://webprometrics.com`

❌ **Wrong:** File named `.env.txt` or `env`  
✅ **Right:** File named exactly `.env`

---

## 📖 More Help

- See `QUICK_ENV_SETUP.md` for detailed instructions
- See `SETUP_ENV.md` for troubleshooting
- Run `node setup-env.js` for interactive setup

---

**Once `.env` is created with your domain, you're ready to deploy! 🚀**

