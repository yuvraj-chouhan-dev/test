# Sign-In Error Fix

## Problem
When signing in, you were getting the error:
```
[API fallback failed] status=200 Network Error: Cannot reach backend at https://api.corporatedigitalmarketing.agency/api. 
Please ensure the server is running. | Response preview: It works! NodeJS 16.20.2
```

## Root Causes

### 1. Server Not Running
The main issue is that the local Node.js server isn't running. The backend API needs to be active to handle authentication requests.

### 2. Incorrect Fallback URL Configuration
The `.env.production` file had a fallback API URL configured:
```env
VITE_API_URL_FALLBACK=https://api.corporatedigitalmarketing.agency/api
```

This fallback URL was pointing to an external server that:
- **Returns plain text** instead of JSON responses
- **Responds with "It works! NodeJS 16.20.2"** instead of actual API data
- **Is not properly configured** to handle API requests

### 3. API Client Behavior
The `services/api.ts` file implements a fallback mechanism:
1. First tries the primary API URL (`/api` - same origin)
2. If that fails, tries the fallback URL
3. When the fallback returns non-JSON content, it throws a detailed error

## Solution Applied

### 1. Fixed Environment Configuration
Updated `.env.production` to disable the problematic fallback:

```env
# Frontend build-time API configuration
VITE_API_URL=/api
# Prefer HTTPS fallback to avoid mixed-content blocking in browsers
# After creating DNS + Nginx vhost for api.corporatedigitalmarketing.agency, use:
# VITE_API_URL_FALLBACK=https://api.corporatedigitalmarketing.agency/api
# Fallback disabled - using same-origin API only
```

### 2. Created Start Script
Created `fix-and-start.ps1` to automate the process:
- Kills any existing processes on port 8080
- Optionally rebuilds the frontend
- Verifies the dist folder exists
- Starts the production server

## How to Fix

### Quick Fix (Using the Script)
```powershell
.\fix-and-start.ps1
```

### Manual Fix

#### Step 1: Stop any existing node processes
```powershell
# Find processes on port 8080
netstat -ano | findstr ":8080"

# If found, kill the process (replace PID with actual process ID)
Stop-Process -Id PID -Force
```

#### Step 2: Rebuild frontend (if needed)
```powershell
npm run build
```

#### Step 3: Start the server
```powershell
npm start
```

#### Step 4: Access the application
Open your browser and navigate to:
```
http://localhost:8080
```

## Verification

### 1. Check Server is Running
```powershell
Test-NetConnection -ComputerName localhost -Port 8080
```

Should show: `TcpTestSucceeded : True`

### 2. Test API Endpoint
```powershell
# Should return 400 Bad Request (no credentials provided) - this is correct!
Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body "{}"
```

### 3. Test Login
Try logging in with:
- **Email:** `marubefred02@gmail.com`
- **Password:** `marubekenya2025`

## Production Deployment Notes

When deploying to production:

### Option A: Same-Origin API (Recommended)
- Serve both frontend and backend from the same domain
- Use relative API URLs (`/api`)
- No CORS issues
- Simpler configuration

### Option B: Separate API Domain
If you want to use `https://api.corporatedigitalmarketing.agency`:

1. **Set up proper DNS** for api.corporatedigitalmarketing.agency
2. **Configure Nginx** to proxy requests to your Node.js server
3. **Update server.js** allowed origins:
   ```javascript
   const allowedOrigins = [
     'https://reports.corporatedigitalmarketing.agency',
     'https://api.corporatedigitalmarketing.agency'
   ];
   ```
4. **Enable fallback** in `.env.production`:
   ```env
   VITE_API_URL=/api
   VITE_API_URL_FALLBACK=https://api.corporatedigitalmarketing.agency/api
   ```
5. **Rebuild frontend:**
   ```bash
   npm run build
   ```

## Current Configuration

### Frontend (Built with Vite)
- Primary API: `/api` (same origin)
- Fallback: Disabled
- Build output: `dist/`

### Backend (Node.js/Express)
- Port: 8080
- API Routes: `/api/*`
- Static Files: Serves `dist/` folder
- SPA Fallback: Returns `index.html` for non-API routes

### Authentication
- JWT-based authentication
- Access tokens: 15 minutes
- Refresh tokens: 7 days
- Bcrypt password hashing

## Troubleshooting

### "Cannot GET /api"
- Server not running → Start with `npm start`
- Wrong port → Check `PORT` environment variable

### "CORS Error"
- Check allowed origins in `server.js`
- Ensure frontend and backend origins match

### "Invalid credentials"
- Verify email/password
- Check `db.json` has the user account
- Ensure password is hashed with bcrypt

### "Network Error"
- Server not running
- Firewall blocking port 8080
- Check browser console for details

## Files Modified
1. `.env.production` - Disabled fallback URL
2. `fix-and-start.ps1` - Created startup script
3. `SIGNIN_FIX.md` - This documentation

## Next Steps
1. ✅ Environment configuration fixed
2. ✅ Start script created
3. ⏳ **Start the server** using `.\fix-and-start.ps1` or `npm start`
4. ⏳ **Test login** at http://localhost:8080
5. ⏳ Verify dashboard loads correctly
