/**
 * Production Node.js Server
 * Serves the React Frontend and provides the REST API with JSON Persistence.
 * Converted to CommonJS for LiteSpeed Web Server compatibility
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const dotenv = require('dotenv');
const prisma = require('./services/db.js');
const { google } = require('googleapis');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_FILE = path.join(__dirname, '/tmp/db.json');
const DB_ENABLED = !!process.env.DATABASE_URL;

// Security: Require JWT_SECRET in production
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY || SECRET_KEY === 'your-super-secret-jwt-key-change-this-in-production') {
    if (NODE_ENV === 'production') {
        console.error('ERROR: JWT_SECRET must be set in production!');
        process.exit(1);
    }
    console.warn('WARNING: Using default JWT_SECRET. Set JWT_SECRET in production!');
}

const JWT_SECRET = SECRET_KEY || 'development-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = 900; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 604800; // 7 days

// Encryption key for storing third-party OAuth tokens
const TOKEN_KEY_SOURCE = process.env.TOKEN_ENCRYPTION_KEY || SECRET_KEY || 'dev-token-key';
const TOKEN_KEY = crypto.createHash('sha256').update(TOKEN_KEY_SOURCE).digest();

const encryptText = (plain) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', TOKEN_KEY, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
};

const decryptText = (b64) => {
    try {
        const buf = Buffer.from(b64, 'base64');
        const iv = buf.subarray(0, 12);
        const tag = buf.subarray(12, 28);
        const enc = buf.subarray(28);
        const decipher = crypto.createDecipheriv('aes-256-gcm', TOKEN_KEY, iv);
        decipher.setAuthTag(tag);
        const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
        return dec.toString('utf8');
    } catch (e) {
        return null;
    }
};

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : (NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:5173']);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(helmet({
    contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging Middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Rate Limiting (overridable for tests via env)
const AUTH_LIMIT = Number(process.env.AUTH_LIMIT_MAX) || 5;
const AUTH_WINDOW_MS = Number(process.env.AUTH_LIMIT_WINDOW_MS) || (15 * 60 * 1000);
const API_LIMIT = Number(process.env.API_LIMIT_MAX) || 100;
const API_WINDOW_MS = Number(process.env.API_LIMIT_WINDOW_MS) || (15 * 60 * 1000);

const authLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS, // default 15 minutes
    max: AUTH_LIMIT, // default 5 requests per window
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: API_WINDOW_MS, // default 15 minutes
    max: API_LIMIT, // default 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// --- PERSISTENCE LAYER ---
const loadDb = () => {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    } catch (e) {
        console.error("Failed to load DB:", e);
    }
    // Default DB State
    return {
        users: [],
        clients: [],
        reports: [],
        templates: [],
        packages: [
            { id: 'pkg_1', name: 'SEO Starter', description: 'Essential SEO monitoring.', price: 25000, interval: 'Monthly', features: ['Monthly Site Audit', 'Keyword Tracking'] },
            { id: 'pkg_2', name: 'PPC Growth', description: 'Comprehensive ad management.', price: 65000, interval: 'Monthly', features: ['Ad Spend Management', 'Weekly Optimization'] }
        ],
        invoices: [],
        integrations: [
            { id: 'google_ads', name: 'Google Ads', provider: 'google', status: 'Disconnected', description: 'Campaign performance...' },
            { id: 'ga4', name: 'Google Analytics 4', provider: 'google', status: 'Disconnected', description: 'Web traffic...' },
            { id: 'meta_ads', name: 'Meta Ads', provider: 'meta', status: 'Disconnected', description: 'Social campaign...' },
            { id: 'gmb', name: 'Google My Business', provider: 'google', status: 'Disconnected', description: 'Local profile views...' },
            { id: 'linkedin', name: 'LinkedIn', provider: 'linkedin', status: 'Disconnected', description: 'Company page insights...' },
            { id: 'x_ads', name: 'X (Twitter) Ads', provider: 'x', status: 'Disconnected', description: 'Tweet engagement...' },
            { id: 'tiktok_ads', name: 'TikTok Ads', provider: 'tiktok', status: 'Disconnected', description: 'Video views...' }
        ]
    };
};

const saveDb = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Failed to save DB:", e);
        throw e;
    }
};

let db = loadDb();

// Initialize password reset tokens storage
if (!db.passwordResetTokens) {
    db.passwordResetTokens = [];
}

// Initialize audit log storage
if (!db.auditLogs) {
    db.auditLogs = [];
}

// Initialize client report customizations
if (!db.clientReportCustomizations) {
    db.clientReportCustomizations = [];
}

// Initialize KPIs
if (!db.kpis) {
    db.kpis = [];
}

// Initialize scheduled reports
if (!db.scheduledReports) {
    db.scheduledReports = [];
}

// Initialize subscriptions
if (!db.subscriptions) {
    db.subscriptions = [];
}

// Initialize OAuth token storage
if (!db.oauthTokens) {
    db.oauthTokens = [];
}

// Initialize admin user
if (db.users.length === 0 || !db.users.find(u => u.id === 'super_admin')) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);

    db.users.push({
        id: 'super_admin',
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        companyName: 'Admin Company',
        isTrial: false,
        createdAt: new Date().toISOString()
    });
    saveDb(db);
    console.log(`Admin user created: ${adminEmail}`);
}

// Initialize agency owner account (development only)
if (NODE_ENV !== 'production') {
    if (!db.users.find(u => u.email === 'marubefred02@gmail.com')) {
        const agencyOwnerPassword = bcrypt.hashSync('marubekenya2025', 10);

        db.users.push({
            id: 'agency_owner_' + Date.now(),
            name: 'Fred Marube',
            email: 'marubefred02@gmail.com',
            password: agencyOwnerPassword,
            role: 'ADMIN',
            companyName: 'WebMetricsPro Agency',
            isTrial: false,
            subscription: 'AGENCY',
            createdAt: new Date().toISOString()
        });
        saveDb(db);
        console.log('Agency owner account created (dev): marubefred02@gmail.com');
    }
}

// --- HELPER FUNCTIONS ---

// Create JWT Token
const createToken = (payload, expiresInSeconds) => {
    return jwt.sign(
        { ...payload, iat: Math.floor(Date.now() / 1000) },
        JWT_SECRET,
        { expiresIn: expiresInSeconds }
    );
};

// Verify JWT Token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
};

// Validation Error Handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// --- AUTH MIDDLEWARE ---
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Invalid authorization header format' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
};

// Combined auth + trial/subscription check for protected routes
const requireAuthAndAccess = (req, res, next) => {
    // First check authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Invalid authorization header format' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;

    // Then check trial/subscription
    checkTrialAndSubscription(req, res, next);
};

// --- ROLE-BASED ACCESS CONTROL ---
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

// --- GOOGLE OAUTH (Search Console) ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const getGoogleOAuthClient = () => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) return null;
    return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
};

// Refresh Google OAuth token if expired or expiring soon
const refreshGoogleToken = async (userId, scopeType = 'searchconsole') => {
    try {
        const entry = db.oauthTokens.find(t => t.userId === userId && t.provider === 'google' && t.scope.includes(scopeType));
        if (!entry) return null;

        const oauthData = decryptText(entry.data);
        if (!oauthData) return null;

        const tokens = JSON.parse(oauthData);
        const now = Date.now();
        const expiryBuffer = 5 * 60 * 1000; // 5 minutes buffer

        // Check if token is expired or expiring soon
        if (tokens.expiry_date && tokens.expiry_date > now + expiryBuffer) {
            return tokens; // Token still valid
        }

        // Refresh the token
        if (!tokens.refresh_token) {
            console.warn('No refresh token available for user:', userId);
            return tokens; // Return existing token, user will need to re-auth
        }

        const oauth2 = getGoogleOAuthClient();
        oauth2.setCredentials({ refresh_token: tokens.refresh_token });
        const { credentials } = await oauth2.refreshAccessToken();

        // Update stored tokens
        const updatedTokens = { ...tokens, ...credentials };
        entry.data = encryptText(JSON.stringify(updatedTokens));
        entry.updatedAt = new Date().toISOString();
        saveDb(db);

        console.log('Google OAuth token refreshed for user:', userId);
        return updatedTokens;
    } catch (error) {
        console.error('Failed to refresh Google token:', error.message);
        return null;
    }
};

// Start OAuth for Google (supports scope=searchconsole|ads|gmb)
app.get('/api/oauth/google/start', requireAuth, (req, res) => {
    const scopeParam = (req.query.scope || 'searchconsole').toString();
    const oauth2 = getGoogleOAuthClient();
    if (!oauth2) return res.status(500).json({ message: 'Google OAuth not configured' });

    const scopes = [];
    if (scopeParam.includes('searchconsole')) {
        scopes.push('https://www.googleapis.com/auth/webmasters.readonly');
    }
    if (scopeParam.includes('ads')) {
        scopes.push('https://www.googleapis.com/auth/adwords');
    }
    if (scopeParam.includes('gmb')) {
        scopes.push('https://www.googleapis.com/auth/business.manage');
    }
    if (scopes.length === 0) return res.status(400).json({ message: 'No valid scopes requested' });

    const url = oauth2.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
        state: JSON.stringify({ uid: req.user.id, scope: scopeParam })
    });
    res.json({ url });
});

// OAuth callback
app.get('/api/oauth/google/callback', async (req, res) => {
    try {
        const oauth2 = getGoogleOAuthClient();
        if (!oauth2) return res.status(500).send('Google OAuth not configured');
        const { code, state } = req.query;
        if (!code) return res.status(400).send('Missing code');
        const parsed = state ? JSON.parse(state) : {};
        const { tokens } = await oauth2.getToken(code.toString());
        const encrypted = encryptText(JSON.stringify(tokens));

        // Persist tokens per user and scope
        db.oauthTokens = db.oauthTokens.filter(t => !(t.userId === parsed.uid && t.provider === 'google' && t.scope === parsed.scope));
        db.oauthTokens.push({
            id: 'tok_' + Date.now(),
            userId: parsed.uid,
            provider: 'google',
            scope: parsed.scope || 'searchconsole',
            data: encrypted,
            createdAt: new Date().toISOString()
        });
        saveDb(db);
        res.send('Google account linked successfully. You can close this tab.');
    } catch (e) {
        console.error('Google OAuth callback error', e);
        res.status(500).send('Failed to link Google account');
    }
});

// List connected Search Console sites
app.get('/api/google/search-console/sites', requireAuth, async (req, res) => {
    try {
        const tokens = await refreshGoogleToken(req.user.id, 'searchconsole');
        if (!tokens) return res.status(400).json({ message: 'Google Search Console not linked or token expired' });

        const oauth2 = getGoogleOAuthClient();
        oauth2.setCredentials(tokens);
        const webmasters = google.webmasters({ version: 'v3', auth: oauth2 });
        const resp = await webmasters.sites.list({});
        res.json(resp.data);
    } catch (e) {
        console.error('SC sites error', e);
        res.status(500).json({ message: 'Failed to list sites' });
    }
});

// Fetch Search Console metrics for a site (live fetch)
app.get('/api/google/search-console/metrics', requireAuth, async (req, res) => {
    try {
        const { siteUrl, dateRange } = req.query;
        if (!siteUrl) return res.status(400).json({ message: 'siteUrl is required' });
        const range = (dateRange || 'daily').toString();

        const tokens = await refreshGoogleToken(req.user.id, 'searchconsole');
        if (!tokens) return res.status(400).json({ message: 'Google Search Console not linked or token expired' });

        const oauth2 = getGoogleOAuthClient();
        oauth2.setCredentials(tokens);
        const webmasters = google.webmasters({ version: 'v3', auth: oauth2 });

        const end = new Date();
        let start = new Date();
        if (range === 'weekly') start.setDate(end.getDate() - 7);
        else if (range === 'monthly') start.setDate(end.getDate() - 30);
        else start.setDate(end.getDate() - 1);

        const body = {
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
            dimensions: ['date'],
            rowLimit: 100
        };
        const resp = await webmasters.searchanalytics.query({ siteUrl: siteUrl.toString(), requestBody: body });
        // Store the result for historical tracking
        if (!db.searchConsoleHistory) db.searchConsoleHistory = [];
        db.searchConsoleHistory.push({
            id: 'gsc_' + Date.now(),
            userId: req.user.id,
            siteUrl: siteUrl.toString(),
            dateRange: range,
            fetchedAt: new Date().toISOString(),
            data: resp.data
        });
        saveDb(db);
        res.json(resp.data);
    } catch (e) {
        console.error('SC metrics error', e);
        res.status(500).json({ message: 'Failed to fetch metrics' });
    }
});

// Get Search Console keyword history for a site
app.get('/api/google/search-console/history', requireAuth, async (req, res) => {
    try {
        const { siteUrl, dateRange } = req.query;
        if (!siteUrl) return res.status(400).json({ message: 'siteUrl is required' });
        const range = (dateRange || 'daily').toString();
        if (!db.searchConsoleHistory) db.searchConsoleHistory = [];
        const history = db.searchConsoleHistory.filter(h => h.userId === req.user.id && h.siteUrl === siteUrl && h.dateRange === range);
        res.json({ history });
    } catch (e) {
        res.status(500).json({ message: 'Failed to fetch history' });
    }
});

// ---------------- META (FACEBOOK/INSTAGRAM) ----------------
app.get('/api/oauth/meta/start', requireAuth, (req, res) => {
    const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI || `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://reports.corporatedigitalmarketing.agency'}/api/oauth/meta/callback`;
    if (!appId) return res.status(500).json({ message: 'Meta App not configured' });
    const scopes = ['ads_read', 'business_management', 'pages_read_engagement', 'instagram_basic', 'instagram_manage_insights'].join(',');
    const state = JSON.stringify({ uid: req.user.id });
    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${encodeURIComponent(state)}`;
    res.json({ url });
});

app.get('/api/oauth/meta/callback', async (req, res) => {
    try {
        const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
        const redirectUri = process.env.META_REDIRECT_URI || `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://reports.corporatedigitalmarketing.agency'}/api/oauth/meta/callback`;
        if (!appId || !appSecret) return res.status(500).send('Meta App not configured');
        const { code, state } = req.query;
        if (!code) return res.status(400).send('Missing code');
        const parsed = state ? JSON.parse(state) : {};
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
        const tokenResp = await fetch(tokenUrl);
        const tokenData = await tokenResp.json();
        if (!tokenData.access_token) return res.status(500).send('Failed to get Meta token');
        const encrypted = encryptText(JSON.stringify({ access_token: tokenData.access_token }));
        db.oauthTokens = db.oauthTokens.filter(t => !(t.userId === parsed.uid && t.provider === 'meta'));
        db.oauthTokens.push({ id: 'tok_' + Date.now(), userId: parsed.uid, provider: 'meta', scope: 'meta', data: encrypted, createdAt: new Date().toISOString() });
        saveDb(db);
        res.send('Meta account linked successfully. You can close this tab.');
    } catch (e) {
        console.error('Meta OAuth callback error', e);
        res.status(500).send('Failed to link Meta account');
    }
});

app.get('/api/meta/ad-accounts', requireAuth, async (req, res) => {
    try {
        const entry = db.oauthTokens.find(t => t.userId === req.user.id && t.provider === 'meta');
        if (!entry) return res.status(400).json({ message: 'Meta not linked' });
        const oauthData = decryptText(entry.data);
        if (!oauthData) return res.status(500).json({ message: 'Failed to decrypt token' });
        const { access_token } = JSON.parse(oauthData);
        const resp = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name&access_token=${access_token}`);
        const data = await resp.json();
        res.json(data);
    } catch (e) {
        console.error('Meta ad accounts error', e);
        res.status(500).json({ message: 'Failed to list ad accounts' });
    }
});

app.get('/api/meta/insights', requireAuth, async (req, res) => {
    try {
        const { accountId, dateRange } = req.query;
        if (!accountId) return res.status(400).json({ message: 'accountId required' });
        const range = (dateRange || 'weekly').toString();
        const entry = db.oauthTokens.find(t => t.userId === req.user.id && t.provider === 'meta');
        if (!entry) return res.status(400).json({ message: 'Meta not linked' });
        const oauthData = decryptText(entry.data);
        if (!oauthData) return res.status(500).json({ message: 'Failed to decrypt token' });
        const { access_token } = JSON.parse(oauthData);
        const datePreset = range === 'daily' ? 'yesterday' : range === 'monthly' ? 'last_30d' : 'last_7d';
        const fields = 'impressions,clicks,spend,cpc,ctr,conversions';
        const url = `https://graph.facebook.com/v18.0/${accountId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${access_token}`;
        const resp = await fetch(url);
        const data = await resp.json();
        res.json(data);
    } catch (e) {
        console.error('Meta insights error', e);
        res.status(500).json({ message: 'Failed to fetch Meta insights' });
    }
});

// ---------------- X (TWITTER) with OAuth 2.0 PKCE ----------------
const pendingPKCE = {}; // In-memory store for code_verifier by state; consider Redis for scale

app.get('/api/oauth/x/start', requireAuth, (req, res) => {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = process.env.TWITTER_REDIRECT_URI || `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://reports.corporatedigitalmarketing.agency'}/api/oauth/x/callback`;
    if (!clientId) return res.status(500).json({ message: 'Twitter/X app not configured' });
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    pendingPKCE[state] = { verifier: codeVerifier, uid: req.user.id };
    const scopes = ['tweet.read', 'users.read', 'offline.access'].join(' ');
    const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    res.json({ url });
});

app.get('/api/oauth/x/callback', async (req, res) => {
    try {
        const clientId = process.env.TWITTER_CLIENT_ID;
        const redirectUri = process.env.TWITTER_REDIRECT_URI || `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://reports.corporatedigitalmarketing.agency'}/api/oauth/x/callback`;
        if (!clientId) return res.status(500).send('Twitter/X app not configured');
        const { code, state } = req.query;
        if (!code || !state) return res.status(400).send('Missing code or state');
        const pkce = pendingPKCE[state.toString()];
        if (!pkce) return res.status(400).send('Invalid state');
        delete pendingPKCE[state.toString()];
        const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        const body = new URLSearchParams({
            code: code.toString(),
            grant_type: 'authorization_code',
            client_id: clientId,
            redirect_uri: redirectUri,
            code_verifier: pkce.verifier
        });
        const tokenResp = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
        const tokenData = await tokenResp.json();
        if (!tokenData.access_token) return res.status(500).send('Failed to get X token');
        const encrypted = encryptText(JSON.stringify({ access_token: tokenData.access_token, refresh_token: tokenData.refresh_token }));
        db.oauthTokens = db.oauthTokens.filter(t => !(t.userId === pkce.uid && t.provider === 'x'));
        db.oauthTokens.push({ id: 'tok_' + Date.now(), userId: pkce.uid, provider: 'x', scope: 'x', data: encrypted, createdAt: new Date().toISOString() });
        saveDb(db);
        res.send('X (Twitter) account linked successfully. You can close this tab.');
    } catch (e) {
        console.error('X OAuth callback error', e);
        res.status(500).send('Failed to link X account');
    }
});

app.get('/api/x/user', requireAuth, async (req, res) => {
    try {
        const tokens = await refreshXToken(req.user.id);
        if (!tokens) return res.status(400).json({ message: 'X not linked or token expired' });
        const { access_token } = tokens;
        const resp = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics', { headers: { 'Authorization': `Bearer ${access_token}` } });
        const data = await resp.json();
        res.json(data);
    } catch (e) {
        console.error('X user error', e);
        res.status(500).json({ message: 'Failed to fetch X user' });
    }
});

app.get('/api/x/metrics', requireAuth, async (req, res) => {
    try {
        const { dateRange } = req.query;
        const range = (dateRange || 'weekly').toString();
        const tokens = await refreshXToken(req.user.id);
        if (!tokens) return res.status(400).json({ message: 'X not linked or token expired' });
        const { access_token } = tokens;
        // Fetch minimal user metrics as a placeholder; real campaign metrics require Ads API access
        const resp = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics', { headers: { 'Authorization': `Bearer ${access_token}` } });
        const data = await resp.json();
        res.json({ user: data, dateRange: range });
    } catch (e) {
        console.error('X metrics error', e);
        res.status(500).json({ message: 'Failed to fetch X metrics' });
    }
});

// --- OAUTH WEBHOOKS ---

// Google OAuth token revocation webhook
app.post('/api/webhooks/google/revoke',
    express.json(),
    (req, res) => {
        try {
            // In production, verify Google's signature here
            const { token } = req.body;

            if (token) {
                // Find and remove the revoked token
                const tokensBefore = db.oauthTokens.length;
                db.oauthTokens = db.oauthTokens.filter(t => {
                    if (t.provider !== 'google') return true;
                    const data = decryptText(t.data);
                    if (!data) return true;
                    const parsed = JSON.parse(data);
                    return parsed.access_token !== token;
                });

                if (db.oauthTokens.length < tokensBefore) {
                    saveDb(db);
                    console.log('Google token revoked via webhook');
                    auditLog('OAUTH_REVOKED', 'system', { provider: 'google', via: 'webhook' });
                }
            }

            res.status(200).send('OK');
        } catch (e) {
            console.error('Google revoke webhook error:', e);
            res.status(500).send('Error');
        }
    }
);

// Meta OAuth deauthorization callback
app.post('/api/webhooks/meta/deauth',
    express.json(),
    (req, res) => {
        try {
            const { signed_request, user_id } = req.body;

            // In production, verify Meta's signed request
            // const data = parseMetaSignedRequest(signed_request, META_APP_SECRET);

            const userId = user_id;
            if (userId) {
                const tokensBefore = db.oauthTokens.length;
                db.oauthTokens = db.oauthTokens.filter(t =>
                    !(t.provider === 'meta' && t.userId === userId)
                );

                if (db.oauthTokens.length < tokensBefore) {
                    saveDb(db);
                    console.log('Meta token deauthorized via webhook for user:', userId);
                    auditLog('OAUTH_REVOKED', userId, { provider: 'meta', via: 'webhook' });
                }
            }

            res.status(200).json({ success: true });
        } catch (e) {
            console.error('Meta deauth webhook error:', e);
            res.status(500).send('Error');
        }
    }
);

// Generic OAuth disconnection endpoint (user-initiated)
app.post('/api/oauth/disconnect',
    requireAuth,
    [
        body('provider').isIn(['google', 'meta', 'x', 'linkedin']).withMessage('Invalid provider')
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const { provider } = req.body;
            const userId = req.user.id;

            const tokensBefore = db.oauthTokens.length;
            db.oauthTokens = db.oauthTokens.filter(t =>
                !(t.userId === userId && t.provider === provider)
            );

            if (db.oauthTokens.length < tokensBefore) {
                saveDb(db);
                auditLog('OAUTH_DISCONNECTED', userId, { provider });
                res.json({ message: `${provider} disconnected successfully` });
            } else {
                res.status(404).json({ message: `${provider} not connected` });
            }
        } catch (error) {
            console.error('OAuth disconnect error:', error);
            res.status(500).json({ message: 'Failed to disconnect OAuth' });
        }
    }
);

// ---------------- LINKEDIN ----------------
app.get('/api/oauth/linkedin/start', requireAuth, (req, res) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://reports.corporatedigitalmarketing.agency'}/api/oauth/linkedin/callback`;
    if (!clientId) return res.status(500).json({ message: 'LinkedIn app not configured' });
    const scopes = ['r_liteprofile', 'r_emailaddress', 'r_organization_social', 'rw_organization_admin'].join(' ');
    const state = JSON.stringify({ uid: req.user.id });
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;
    res.json({ url });
});

app.get('/api/oauth/linkedin/callback', async (req, res) => {
    try {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://reports.corporatedigitalmarketing.agency'}/api/oauth/linkedin/callback`;
        if (!clientId || !clientSecret) return res.status(500).send('LinkedIn app not configured');
        const { code, state } = req.query;
        if (!code) return res.status(400).send('Missing code');
        const parsed = state ? JSON.parse(state) : {};
        const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
        const body = new URLSearchParams({ grant_type: 'authorization_code', code: code.toString(), redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret });
        const tokenResp = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
        const tokenData = await tokenResp.json();
        if (!tokenData.access_token) return res.status(500).send('Failed to get LinkedIn token');
        const encrypted = encryptText(JSON.stringify({ access_token: tokenData.access_token }));
        db.oauthTokens = db.oauthTokens.filter(t => !(t.userId === parsed.uid && t.provider === 'linkedin'));
        db.oauthTokens.push({ id: 'tok_' + Date.now(), userId: parsed.uid, provider: 'linkedin', scope: 'linkedin', data: encrypted, createdAt: new Date().toISOString() });
        saveDb(db);
        res.send('LinkedIn account linked successfully. You can close this tab.');
    } catch (e) {
        console.error('LinkedIn OAuth callback error', e);
        res.status(500).send('Failed to link LinkedIn account');
    }
});

// Refresh X (Twitter) OAuth token if needed
const refreshXToken = async (userId) => {
    try {
        const entry = db.oauthTokens.find(t => t.userId === userId && t.provider === 'x');
        if (!entry) return null;

        const oauthData = decryptText(entry.data);
        if (!oauthData) return null;

        const tokens = JSON.parse(oauthData);

        // X tokens don't have expiry_date in response, but typically last 2 hours
        // Attempt refresh if refresh_token exists
        if (!tokens.refresh_token) {
            return tokens; // No refresh token, return existing
        }

        const clientId = process.env.TWITTER_CLIENT_ID;
        if (!clientId) return tokens;

        const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokens.refresh_token,
            client_id: clientId
        });

        const tokenResp = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        const tokenData = await tokenResp.json();
        if (!tokenData.access_token) {
            console.warn('Failed to refresh X token for user:', userId);
            return tokens; // Return old token
        }

        // Update stored tokens
        const updatedTokens = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || tokens.refresh_token
        };
        entry.data = encryptText(JSON.stringify(updatedTokens));
        entry.updatedAt = new Date().toISOString();
        saveDb(db);

        console.log('X OAuth token refreshed for user:', userId);
        return updatedTokens;
    } catch (error) {
        console.error('Failed to refresh X token:', error.message);
        return null;
    }
};

app.get('/api/linkedin/organizations', requireAuth, async (req, res) => {
    try {
        const entry = db.oauthTokens.find(t => t.userId === req.user.id && t.provider === 'linkedin');
        if (!entry) return res.status(400).json({ message: 'LinkedIn not linked' });
        const oauthData = decryptText(entry.data);
        if (!oauthData) return res.status(500).json({ message: 'Failed to decrypt token' });
        const { access_token } = JSON.parse(oauthData);
        const resp = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(organization~(localizedName)))', { headers: { 'Authorization': `Bearer ${access_token}`, 'LinkedIn-Version': '202304' } });
        const data = await resp.json();
        res.json(data);
    } catch (e) {
        console.error('LinkedIn orgs error', e);
        res.status(500).json({ message: 'Failed to list LinkedIn orgs' });
    }
});

app.get('/api/linkedin/metrics', requireAuth, async (req, res) => {
    try {
        const { organizationId, dateRange } = req.query;
        if (!organizationId) return res.status(400).json({ message: 'organizationId required' });
        const range = (dateRange || 'weekly').toString();
        const entry = db.oauthTokens.find(t => t.userId === req.user.id && t.provider === 'linkedin');
        if (!entry) return res.status(400).json({ message: 'LinkedIn not linked' });
        const oauthData = decryptText(entry.data);
        if (!oauthData) return res.status(500).json({ message: 'Failed to decrypt token' });
        const { access_token } = JSON.parse(oauthData);

        // Calculate date range for analytics
        const end = new Date();
        let start = new Date();
        if (range === 'daily') start.setDate(end.getDate() - 1);
        else if (range === 'monthly') start.setDate(end.getDate() - 30);
        else start.setDate(end.getDate() - 7);

        const startMs = start.getTime();
        const endMs = end.getTime();

        // Fetch organization follower statistics
        const followerStatsUrl = `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(organizationId)}`;
        const followerResp = await fetch(followerStatsUrl, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'LinkedIn-Version': '202312'
            }
        });

        // Fetch organization share statistics (posts/engagement)
        const shareStatsUrl = `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(organizationId)}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${startMs}&timeIntervals.timeRange.end=${endMs}`;
        const shareResp = await fetch(shareStatsUrl, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'LinkedIn-Version': '202312'
            }
        });

        const metrics = {
            organizationId,
            dateRange: range,
            followers: { total: 0, organic: 0, paid: 0 },
            engagement: { impressions: 0, clicks: 0, likes: 0, comments: 0, shares: 0, engagement_rate: 0 }
        };

        // Parse follower stats
        if (followerResp.ok) {
            const followerData = await followerResp.json();
            if (followerData.elements && followerData.elements[0]) {
                const stats = followerData.elements[0];
                metrics.followers.total = stats.followerCounts?.organicFollowerCount || 0;
                metrics.followers.organic = stats.followerCounts?.organicFollowerCount || 0;
                metrics.followers.paid = stats.followerCounts?.paidFollowerCount || 0;
            }
        }

        // Parse share/engagement stats
        if (shareResp.ok) {
            const shareData = await shareResp.json();
            if (shareData.elements && shareData.elements.length > 0) {
                let totalImpressions = 0, totalClicks = 0, totalLikes = 0, totalComments = 0, totalShares = 0;

                shareData.elements.forEach(elem => {
                    if (elem.totalShareStatistics) {
                        const stats = elem.totalShareStatistics;
                        totalImpressions += stats.impressionCount || 0;
                        totalClicks += stats.clickCount || 0;
                        totalLikes += stats.likeCount || 0;
                        totalComments += stats.commentCount || 0;
                        totalShares += stats.shareCount || 0;
                    }
                });

                metrics.engagement.impressions = totalImpressions;
                metrics.engagement.clicks = totalClicks;
                metrics.engagement.likes = totalLikes;
                metrics.engagement.comments = totalComments;
                metrics.engagement.shares = totalShares;

                const totalEngagement = totalLikes + totalComments + totalShares + totalClicks;
                metrics.engagement.engagement_rate = totalImpressions > 0
                    ? ((totalEngagement / totalImpressions) * 100).toFixed(2)
                    : 0;
            }
        }

        res.json(metrics);
    } catch (e) {
        console.error('LinkedIn metrics error', e);
        res.status(500).json({ message: 'Failed to fetch LinkedIn metrics', error: e.message });
    }
});

// ---------------- GOOGLE ADS ----------------
// List accessible Google Ads customers for the linked account
app.get('/api/google/ads/customers', requireAuth, async (req, res) => {
    try {
        const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
        if (!devToken) return res.status(500).json({ message: 'Google Ads developer token not configured' });
        const entry = db.oauthTokens.find(t => t.userId === req.user.id && t.provider === 'google' && t.scope.includes('ads'));
        if (!entry) return res.status(400).json({ message: 'Google Ads not linked' });
        const oauthData = decryptText(entry.data);
        if (!oauthData) return res.status(500).json({ message: 'Failed to decrypt token' });

        const { access_token } = JSON.parse(oauthData);
        const resp = await fetch('https://googleads.googleapis.com/v14/customers:listAccessibleCustomers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'developer-token': devToken
            }
        });
        if (!resp.ok) {
            const err = await resp.text();
            return res.status(resp.status).json({ message: 'Failed to list customers', error: err });
        }
        const data = await resp.json();
        res.json(data);
    } catch (e) {
        console.error('Ads customers error', e);
        res.status(500).json({ message: 'Failed to list Google Ads customers' });
    }
});

// Fetch simple Google Ads metrics for a customer using GAQL via googleAds:search
app.get('/api/google/ads/metrics', requireAuth, async (req, res) => {
    try {
        const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
        if (!devToken) return res.status(500).json({ message: 'Google Ads developer token not configured' });
        const { customerId, dateRange } = req.query;
        if (!customerId) return res.status(400).json({ message: 'customerId is required' });
        const range = (dateRange || 'weekly').toString();
        const entry = db.oauthTokens.find(t => t.userId === req.user.id && t.provider === 'google' && t.scope.includes('ads'));
        if (!entry) return res.status(400).json({ message: 'Google Ads not linked' });
        const oauthData = decryptText(entry.data);
        if (!oauthData) return res.status(500).json({ message: 'Failed to decrypt token' });

        const { access_token } = JSON.parse(oauthData);
        const during = range === 'daily' ? 'YESTERDAY' : range === 'monthly' ? 'LAST_30_DAYS' : 'LAST_7_DAYS';
        const query = `SELECT metrics.impressions, metrics.clicks, metrics.average_cpc, metrics.conversions, metrics.cost_micros FROM customer WHERE segments.date DURING ${during}`;
        const url = `https://googleads.googleapis.com/v14/customers/${encodeURIComponent(customerId.toString())}/googleAds:search`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'developer-token': devToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });
        if (!resp.ok) {
            const err = await resp.text();
            return res.status(resp.status).json({ message: 'Failed to fetch Ads metrics', error: err });
        }
        const data = await resp.json();
        res.json(data);
    } catch (e) {
        console.error('Ads metrics error', e);
        res.status(500).json({ message: 'Failed to fetch Google Ads metrics' });
    }
});

// ---------- GOOGLE MY BUSINESS (GMB) ----------
// List Google My Business accounts for the linked Google account
app.get('/api/google/gmb/accounts', requireAuth, async (req, res) => {
    try {
        const entry = db.oauthTokens.find(t => t.userId === req.user.id && t.provider === 'google' && t.scope.includes('business'));
        if (!entry) return res.status(400).json({ message: 'Google My Business not linked' });
        const oauthData = decryptText(entry.data);
        if (!oauthData) return res.status(500).json({ message: 'Failed to decrypt token' });

        const { access_token } = JSON.parse(oauthData);

        // Fetch accounts from Google Business Profile API
        const resp = await fetch('https://mybusinessbusinessinformation.googleapis.com/v1/accounts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!resp.ok) {
            const err = await resp.text();
            return res.status(resp.status).json({ message: 'Failed to list GMB accounts', error: err });
        }

        const data = await resp.json();
        res.json(data);
    } catch (e) {
        console.error('GMB accounts error', e);
        res.status(500).json({ message: 'Failed to fetch Google My Business accounts', error: e.message });
    }
});

// List locations for a specific GMB account
app.get('/api/google/gmb/locations', requireAuth, async (req, res) => {
    try {
        const { accountId } = req.query;
        if (!accountId) return res.status(400).json({ message: 'accountId is required' });

        const entry = db.oauthTokens.find(t => t.userId === req.user.id && t.provider === 'google' && t.scope.includes('business'));
        if (!entry) return res.status(400).json({ message: 'Google My Business not linked' });
        const oauthData = decryptText(entry.data);
        if (!oauthData) return res.status(500).json({ message: 'Failed to decrypt token' });

        const { access_token } = JSON.parse(oauthData);

        // Fetch locations for the account
        const resp = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${encodeURIComponent(accountId.toString())}/locations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!resp.ok) {
            const err = await resp.text();
            return res.status(resp.status).json({ message: 'Failed to list locations', error: err });
        }

        const data = await resp.json();
        res.json(data);
    } catch (e) {
        console.error('GMB locations error', e);
        res.status(500).json({ message: 'Failed to fetch GMB locations', error: e.message });
    }
});

// Fetch GMB insights (profile views, searches, actions) for a location
app.get('/api/google/gmb/insights', requireAuth, async (req, res) => {
    try {
        const { locationId, dateRange } = req.query;
        if (!locationId) return res.status(400).json({ message: 'locationId is required' });

        const entry = db.oauthTokens.find(t => t.userId === req.user.id && t.provider === 'google' && t.scope.includes('business'));
        if (!entry) return res.status(400).json({ message: 'Google My Business not linked' });
        const oauthData = decryptText(entry.data);
        if (!oauthData) return res.status(500).json({ message: 'Failed to decrypt token' });

        const { access_token } = JSON.parse(oauthData);
        const range = (dateRange || 'LAST_30_DAYS').toString();

        // Calculate date range for insights query
        const endDate = new Date();
        const startDate = new Date();
        if (range === 'LAST_7_DAYS') startDate.setDate(startDate.getDate() - 7);
        else if (range === 'LAST_30_DAYS') startDate.setDate(startDate.getDate() - 30);
        else if (range === 'LAST_90_DAYS') startDate.setDate(startDate.getDate() - 90);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Fetch insights using Google Insights API
        const resp = await fetch(`https://mybusinessinsights.googleapis.com/v1/${locationId}/insights:reportInsights`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                locationFilter: { locations: [locationId] },
                basicRequest: {
                    metricRequests: [
                        { metric: 'QUERIES_DIRECT' },
                        { metric: 'QUERIES_INDIRECT' },
                        { metric: 'VIEWS_MAPS' },
                        { metric: 'VIEWS_WEBSITE' },
                        { metric: 'ACTIONS_PHONE' },
                        { metric: 'ACTIONS_WEBSITE' },
                        { metric: 'ACTIONS_DIRECTIONS' }
                    ],
                    timeRange: {
                        startTime: { year: startDate.getFullYear(), month: startDate.getMonth() + 1, day: startDate.getDate() },
                        endTime: { year: endDate.getFullYear(), month: endDate.getMonth() + 1, day: endDate.getDate() }
                    }
                }
            })
        });

        if (!resp.ok) {
            const err = await resp.text();
            return res.status(resp.status).json({ message: 'Failed to fetch insights', error: err });
        }

        const data = await resp.json();
        res.json({
            locationId,
            dateRange: range,
            startDate: startDateStr,
            endDate: endDateStr,
            metrics: data
        });
    } catch (e) {
        console.error('GMB insights error', e);
        res.status(500).json({ message: 'Failed to fetch GMB insights', error: e.message });
    }
});

// --- CLIENT INVITES (stubs) ---
app.post('/api/clients/invite', requireAuth, requireRole('ADMIN'), apiLimiter, [
    body('email').isEmail().normalizeEmail(),
    body('name').notEmpty(),
    body('companyName').notEmpty(),
], handleValidationErrors, async (req, res) => {
    try {
        const { email, name, companyName } = req.body;
        if (db.users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const tempPassword = crypto.randomBytes(6).toString('base64url');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const newUser = {
            id: 'u_' + Date.now(),
            name,
            email,
            password: hashedPassword,
            role: 'ADMIN', // client admin has ADMIN role; super admin identified by id
            companyName,
            isTrial: true,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            subscription: 'TRIAL_PREMIUM',
            features: {
                dashboardAccess: true,
                reportGeneration: true,
                integrations: true,
                clientManagement: true,
                customBranding: true,
                unlimitedReports: true,
                apiAccess: true,
                advancedAnalytics: true
            },
            createdAt: new Date().toISOString()
        };
        db.users.push(newUser);
        saveDb(db);
        // Email sending would go here; return temp password for now (avoid in real prod)
        res.status(201).json({ message: 'Client admin invited', tempPassword });
    } catch (e) {
        console.error('Invite error', e);
        res.status(500).json({ message: 'Failed to invite user' });
    }
});

// --- TRIAL & SUBSCRIPTION CHECK ---
const checkTrialAndSubscription = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // Super admin always has access
    if (req.user.role === 'ADMIN' && req.user.id === 'super_admin') {
        return next();
    }

    // Get fresh user data from database
    const dbUser = db.users.find(u => u.id === req.user.id);
    if (!dbUser) {
        return res.status(401).json({ message: 'User not found' });
    }

    // Check if user has active subscription
    const activeSubscription = db.subscriptions.find(s =>
        s.userId === dbUser.id &&
        s.status === 'active' &&
        new Date(s.expiresAt) > new Date()
    );

    // Check trial status
    const isTrialActive = dbUser.isTrial &&
        dbUser.trialEndsAt &&
        new Date(dbUser.trialEndsAt) > new Date();

    // User has access if they have active subscription OR active trial
    if (activeSubscription || isTrialActive) {
        // Attach subscription info to request
        req.user.subscription = activeSubscription;
        req.user.isTrialActive = isTrialActive;
        req.user.trialEndsAt = dbUser.trialEndsAt;
        return next();
    }

    // Trial expired and no active subscription
    return res.status(403).json({
        message: 'Trial period expired. Please subscribe to a package to continue.',
        requiresSubscription: true,
        trialExpired: dbUser.isTrial && dbUser.trialEndsAt && new Date(dbUser.trialEndsAt) <= new Date()
    });
};

// --- MULTI-TENANT ISOLATION ---
const requireClientAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // Super admins can access all clients
    if (req.user.role === 'ADMIN' && req.user.id === 'super_admin') {
        return next();
    }

    // For other users, filter by their company/clientId
    req.clientFilter = req.user.companyName || req.user.id;
    next();
};

// Helper to filter data by client
const filterByClient = (data, user) => {
    if (user.role === 'ADMIN' && user.id === 'super_admin') {
        return data; // Super admin sees all
    }

    // Filter by companyName or userId
    return data.filter(item =>
        item.companyName === user.companyName ||
        item.userId === user.id ||
        item.clientId === user.id
    );
};

// --- AUDIT LOGGING ---
const auditLog = (action, userId, details = {}) => {
    const logEntry = {
        id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        action,
        userId,
        timestamp: new Date().toISOString(),
        details,
        ip: details.ip || 'unknown'
    };

    db.auditLogs.push(logEntry);

    // Keep only last 10000 logs
    if (db.auditLogs.length > 10000) {
        db.auditLogs = db.auditLogs.slice(-10000);
    }

    saveDb(db);
    return logEntry;
};

// Audit middleware
const auditMiddleware = (action) => {
    return (req, res, next) => {
        if (req.user) {
            auditLog(action, req.user.id, {
                method: req.method,
                path: req.path,
                ip: req.ip || req.connection.remoteAddress
            });
        }
        next();
    };
};

// --- DATA BACKUP ---
const createBackup = () => {
    try {
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `db-backup-${timestamp}.json`);

        fs.writeFileSync(backupFile, JSON.stringify(db, null, 2));

        // Keep only last 30 backups
        const backups = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('db-backup-'))
            .map(f => ({
                name: f,
                path: path.join(backupDir, f),
                time: fs.statSync(path.join(backupDir, f)).mtime
            }))
            .sort((a, b) => b.time - a.time);

        if (backups.length > 30) {
            backups.slice(30).forEach(b => {
                fs.unlinkSync(b.path);
            });
        }

        return backupFile;
    } catch (error) {
        console.error('Backup failed:', error);
        return null;
    }
};

// Auto-backup every 6 hours
setInterval(() => {
    createBackup();
    console.log('Auto-backup completed');
}, 6 * 60 * 60 * 1000);

// Auto-refresh OAuth tokens (check every hour)
setInterval(async () => {
    try {
        console.log('Starting OAuth token refresh check...');
        let refreshedCount = 0;

        // Get all Google OAuth tokens
        const googleTokens = db.oauthTokens.filter(t => t.provider === 'google');
        for (const entry of googleTokens) {
            const oauthData = decryptText(entry.data);
            if (!oauthData) continue;

            const tokens = JSON.parse(oauthData);
            const now = Date.now();
            const expiryBuffer = 30 * 60 * 1000; // 30 minutes buffer

            // Refresh if expiring within 30 minutes
            if (tokens.expiry_date && tokens.expiry_date <= now + expiryBuffer && tokens.refresh_token) {
                const refreshed = await refreshGoogleToken(entry.userId, entry.scope);
                if (refreshed) {
                    refreshedCount++;
                    console.log(`Refreshed Google token for user ${entry.userId}`);
                }
            }
        }

        if (refreshedCount > 0) {
            console.log(`OAuth token refresh completed: ${refreshedCount} tokens refreshed`);
        }
    } catch (error) {
        console.error('OAuth token refresh job error:', error);
    }
}, 60 * 60 * 1000); // Run every hour

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        uptime: process.uptime()
    });
});

// Lightweight API base ping to help proxy verification
app.get('/api', (req, res) => {
    res.json({
        ok: true,
        service: 'webprometrics-api',
        node: process.version,
        env: NODE_ENV
    });
});

// --- API ROUTES ---

// Auth: Login
app.post('/api/auth/login',
    authLimiter,
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { email, password } = req.body;

            if (DB_ENABLED && prisma) {
                const pUser = await prisma.user.findUnique({ where: { email } });
                if (!pUser) return res.status(401).json({ message: 'Invalid credentials' });
                const isValid = await bcrypt.compare(password, pUser.password);
                if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });
                const { password: _pw, ...safeUser } = pUser;
                const accessToken = createToken(safeUser, ACCESS_TOKEN_EXPIRY);
                const refreshToken = createToken({ id: safeUser.id, type: 'refresh' }, REFRESH_TOKEN_EXPIRY);
                return res.json({ token: accessToken, refreshToken, user: safeUser });
            }

            // Fallback to JSON store
            const dbUser = db.users.find(u => u.email === email);
            if (!dbUser) return res.status(401).json({ message: 'Invalid credentials' });
            const isValidPassword = await bcrypt.compare(password, dbUser.password);
            if (!isValidPassword) return res.status(401).json({ message: 'Invalid credentials' });
            const { password: _, ...safeUser } = dbUser;
            const accessToken = createToken(safeUser, ACCESS_TOKEN_EXPIRY);
            const refreshToken = createToken({ id: safeUser.id, type: 'refresh' }, REFRESH_TOKEN_EXPIRY);
            return res.json({ token: accessToken, refreshToken, user: safeUser });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Auth: Signup
app.post('/api/auth/signup',
    authLimiter,
    async (req, res) => {
        try {
            const { name, email, password, companyName } = req.body;
            const normalizedEmail = (email || '').toString().trim().toLowerCase();
            if (!normalizedEmail || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            // Prisma path when DB is enabled
            if (DB_ENABLED && prisma) {
                const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
                if (existing) return res.status(400).json({ message: 'User already exists' });
                const hashedPassword = await bcrypt.hash(password, 10);
                const user = await prisma.user.create({
                    data: {
                        name,
                        email: normalizedEmail,
                        password: hashedPassword,
                        role: 'USER',
                        companyName: companyName || null,
                        isTrial: true,
                        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    }
                });
                const { password: _pw, ...safeUser } = user;
                const accessToken = createToken(safeUser, ACCESS_TOKEN_EXPIRY);
                const refreshToken = createToken({ id: safeUser.id, type: 'refresh' }, REFRESH_TOKEN_EXPIRY);
                return res.status(201).json({ token: accessToken, refreshToken, user: safeUser });
            }

            // Fallback JSON path
            if (db.users.find(u => (u.email || '').toLowerCase() === normalizedEmail)) {
                return res.status(400).json({ message: 'User already exists' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = {
                id: 'u_' + Date.now(),
                name,
                email: normalizedEmail,
                password: hashedPassword,
                role: 'USER',
                companyName: companyName || null,
                isTrial: true,
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date().toISOString()
            };
            db.users.push(newUser);
            saveDb(db);
            const { password: _pw2, ...safeUser } = newUser;
            const accessToken = createToken(safeUser, ACCESS_TOKEN_EXPIRY);
            const refreshToken = createToken({ id: safeUser.id, type: 'refresh' }, REFRESH_TOKEN_EXPIRY);
            return res.status(201).json({ token: accessToken, refreshToken, user: safeUser });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Auth: Refresh Token
app.post('/api/auth/refresh',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const { refreshToken } = req.body;

            const decoded = verifyToken(refreshToken);
            if (!decoded || decoded.type !== 'refresh') {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }

            // Find user to get latest roles/data
            const user = db.users.find(u => u.id === decoded.id);
            if (!user) {
                return res.status(403).json({ message: 'User not found' });
            }

            const { password: _, ...safeUser } = user;
            const newAccessToken = createToken(safeUser, ACCESS_TOKEN_EXPIRY);

            res.json({ token: newAccessToken });
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Auth: Request Password Reset
app.post('/api/auth/password-reset/request',
    authLimiter,
    [
        body('email').isEmail().normalizeEmail(),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { email } = req.body;

            // Find user
            const user = db.users.find(u => u.email === email);

            // Always return success (security best practice - don't reveal if email exists)
            if (user) {
                // Generate reset token
                const resetToken = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date(Date.now() + 3600000); // 1 hour

                // Store reset token
                db.passwordResetTokens = db.passwordResetTokens.filter(t => t.email !== email);
                db.passwordResetTokens.push({
                    email,
                    token: resetToken,
                    expiresAt: expiresAt.toISOString(),
                    createdAt: new Date().toISOString()
                });
                saveDb(db);

                // In production, send email here
                // For now, log the token (remove in production!)
                if (NODE_ENV === 'development') {
                    console.log(`Password reset token for ${email}: ${resetToken}`);
                }
            }

            res.json({ message: 'If an account exists, a password reset link has been sent.' });
        } catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Auth: Confirm Password Reset
app.post('/api/auth/password-reset/confirm',
    authLimiter,
    [
        body('email').isEmail().normalizeEmail(),
        body('token').notEmpty().withMessage('Reset token is required'),
        body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { email, token, newPassword } = req.body;

            // Find reset token
            const resetToken = db.passwordResetTokens.find(
                t => t.email === email && t.token === token
            );

            if (!resetToken) {
                return res.status(400).json({ message: 'Invalid or expired reset token' });
            }

            // Check if token expired
            if (new Date(resetToken.expiresAt) < new Date()) {
                db.passwordResetTokens = db.passwordResetTokens.filter(t => t.token !== token);
                saveDb(db);
                return res.status(400).json({ message: 'Reset token has expired' });
            }

            // Find user
            const user = db.users.find(u => u.email === email);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Update password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            user.updatedAt = new Date().toISOString();

            // Remove used token
            db.passwordResetTokens = db.passwordResetTokens.filter(t => t.token !== token);
            saveDb(db);

            res.json({ message: 'Password reset successfully' });
        } catch (error) {
            console.error('Password reset confirm error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Auth: Change Password (for authenticated users)
app.post('/api/auth/change-password',
    requireAuth,
    apiLimiter,
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            // Find user
            const user = db.users.find(u => u.id === userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            // Update password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            user.updatedAt = new Date().toISOString();
            saveDb(db);

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Auth: Update User Profile
app.put('/api/auth/profile',
    requireAuth,
    apiLimiter,
    [
        body('name').optional().trim().isLength({ min: 2, max: 100 }),
        body('companyName').optional().trim().isLength({ max: 200 }),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const updates = req.body;

            const user = db.users.find(u => u.id === userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Update allowed fields
            if (updates.name) user.name = updates.name;
            if (updates.companyName !== undefined) user.companyName = updates.companyName;
            if (updates.logoUrl !== undefined) user.logoUrl = updates.logoUrl;
            if (updates.brandColor !== undefined) user.brandColor = updates.brandColor;
            user.updatedAt = new Date().toISOString();

            saveDb(db);

            const { password: _, ...safeUser } = user;
            res.json({ user: safeUser, message: 'Profile updated successfully' });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Auth: Two-Factor Authentication Setup
app.post('/api/auth/2fa/setup',
    requireAuth,
    apiLimiter,
    handleValidationErrors,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const user = db.users.find(u => u.id === userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Generate secret (in production, use speakeasy)
            const secret = crypto.randomBytes(20).toString('base64');
            user.twoFactorSecret = secret;
            user.twoFactorEnabled = false; // Not enabled until verified
            saveDb(db);

            // In production, generate QR code with speakeasy
            // For now, return secret (remove in production!)
            res.json({
                secret,
                qrCode: `otpauth://totp/WebProMetrics:${user.email}?secret=${secret}&issuer=WebProMetrics`
            });
        } catch (error) {
            console.error('2FA setup error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Auth: Verify and Enable 2FA
app.post('/api/auth/2fa/verify',
    requireAuth,
    apiLimiter,
    [
        body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { code } = req.body;
            const userId = req.user.id;
            const user = db.users.find(u => u.id === userId);

            if (!user || !user.twoFactorSecret) {
                return res.status(400).json({ message: '2FA not set up' });
            }

            // In production, verify with speakeasy.totp.verify()
            // For now, accept any 6-digit code (remove in production!)
            if (code.length === 6 && /^\d+$/.test(code)) {
                user.twoFactorEnabled = true;
                saveDb(db);
                res.json({ message: '2FA enabled successfully' });
            } else {
                res.status(400).json({ message: 'Invalid verification code' });
            }
        } catch (error) {
            console.error('2FA verify error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Auth: Disable 2FA
app.post('/api/auth/2fa/disable',
    requireAuth,
    apiLimiter,
    [
        body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { code } = req.body;
            const userId = req.user.id;
            const user = db.users.find(u => u.id === userId);

            if (!user || !user.twoFactorEnabled) {
                return res.status(400).json({ message: '2FA not enabled' });
            }

            // Verify code before disabling
            // In production, use speakeasy.totp.verify()
            if (code.length === 6 && /^\d+$/.test(code)) {
                user.twoFactorEnabled = false;
                user.twoFactorSecret = undefined;
                saveDb(db);
                res.json({ message: '2FA disabled successfully' });
            } else {
                res.status(400).json({ message: 'Invalid verification code' });
            }
        } catch (error) {
            console.error('2FA disable error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Clients
app.get('/api/clients', requireAuthAndAccess, requireClientAccess, apiLimiter, async (req, res) => {
    try {
        if (DB_ENABLED && prisma) {
            // Super admin sees all
            if (req.user.role === 'ADMIN' && req.user.id === 'super_admin') {
                const all = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
                return res.json(all);
            }
            const companyName = req.user.companyName || null;
            const userId = req.user.id;
            const tenantId = req.user.companyName || req.user.id;
            const results = await prisma.client.findMany({
                where: {
                    OR: [
                        { companyName: companyName || undefined },
                        { userId },
                        { tenantId }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(results);
        }

        let clients = db.clients;
        if (req.user.role !== 'ADMIN' || req.user.id !== 'super_admin') {
            clients = filterByClient(clients, req.user);
        }
        res.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/clients',
    requireAuthAndAccess,
    requireRole('ADMIN', 'USER'),
    apiLimiter,
    [
        body('name').trim().notEmpty().withMessage('Client name is required'),
        body('email').optional().isEmail().normalizeEmail(),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const base = {
                name: req.body.name,
                website: req.body.website || '',
                status: req.body.status || 'Active',
                nextReport: req.body.nextReport || new Date().toISOString(),
                logo: req.body.logo || null,
                companyName: req.user.companyName || req.user.id,
                tenantId: req.user.companyName || req.user.id,
                userId: req.user.id
            };

            if (DB_ENABLED && prisma) {
                const created = await prisma.client.create({ data: base });
                return res.status(201).json(created);
            }

            const newClient = { ...base, id: Date.now().toString(), createdAt: new Date().toISOString() };
            db.clients.push(newClient);
            saveDb(db);
            return res.status(201).json(newClient);
        } catch (error) {
            console.error('Create client error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Reports
app.get('/api/reports', requireAuthAndAccess, requireClientAccess, apiLimiter, async (req, res) => {
    try {
        if (DB_ENABLED && prisma) {
            if (req.user.role === 'ADMIN' && req.user.id === 'super_admin') {
                const all = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
                return res.json(all);
            }
            const companyName = req.user.companyName || null;
            const userId = req.user.id;
            const tenantId = req.user.companyName || req.user.id;
            const results = await prisma.report.findMany({
                where: {
                    OR: [
                        { companyName: companyName || undefined },
                        { userId },
                        { tenantId }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(results);
        }

        let reports = db.reports;
        if (req.user.role !== 'ADMIN' || req.user.id !== 'super_admin') {
            reports = filterByClient(reports, req.user);
        }
        res.json(reports);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/reports',
    requireAuthAndAccess,
    requireClientAccess,
    apiLimiter,
    [
        body('title').trim().notEmpty().withMessage('Report title is required'),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const base = {
                clientName: req.body.clientName || 'N/A',
                name: req.body.title || req.body.name || 'Report',
                date: req.body.date || new Date().toISOString(),
                status: req.body.status || 'Draft',
                platform: req.body.platform || 'Mixed',
                companyName: req.user.companyName || req.user.id,
                tenantId: req.user.companyName || req.user.id,
                userId: req.user.id
            };

            if (DB_ENABLED && prisma) {
                const created = await prisma.report.create({ data: base });
                return res.status(201).json(created);
            }

            const newReport = { ...base, id: Date.now().toString(), createdAt: new Date().toISOString() };
            db.reports.push(newReport);
            saveDb(db);
            return res.status(201).json(newReport);
        } catch (error) {
            console.error('Create report error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Report Export: PDF
app.get('/api/reports/:id/export/pdf',
    requireAuthAndAccess,
    requireClientAccess,
    apiLimiter,
    [param('id').notEmpty()],
    handleValidationErrors,
    (req, res) => {
        try {
            const { id } = req.params;
            const report = db.reports.find(r => r.id === id);

            if (!report) {
                return res.status(404).json({ message: 'Report not found' });
            }

            // Multi-tenant check
            if (req.user.role !== 'ADMIN' && req.user.id !== 'super_admin') {
                const filtered = filterByClient([report], req.user);
                if (filtered.length === 0) {
                    return res.status(403).json({ message: 'Access denied' });
                }
            }

            // Simple PDF generation (install jspdf for full functionality)
            const pdfContent = `Report: ${report.name || report.title || 'Report'}\n` +
                `Client: ${report.clientName || 'N/A'}\n` +
                `Date: ${report.date || 'N/A'}\n` +
                `Status: ${report.status || 'N/A'}\n`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="report-${id}.pdf"`);
            // For now, return text. Install jspdf for proper PDF generation
            res.send(Buffer.from(pdfContent));
        } catch (error) {
            console.error('PDF export error:', error);
            res.status(500).json({ message: 'Failed to generate PDF' });
        }
    }
);

// Report Export: CSV
app.get('/api/reports/:id/export/csv',
    requireAuthAndAccess,
    requireClientAccess,
    apiLimiter,
    [param('id').notEmpty()],
    handleValidationErrors,
    (req, res) => {
        try {
            const { id } = req.params;
            const report = db.reports.find(r => r.id === id);

            if (!report) {
                return res.status(404).json({ message: 'Report not found' });
            }

            // Multi-tenant check
            if (req.user.role !== 'ADMIN' && req.user.id !== 'super_admin') {
                const filtered = filterByClient([report], req.user);
                if (filtered.length === 0) {
                    return res.status(403).json({ message: 'Access denied' });
                }
            }

            // Create CSV
            let csv = 'Report Name,Client,Date,Status,Platform\n';
            csv += `"${report.name || report.title || 'Report'}","${report.clientName || 'N/A'}","${report.date || 'N/A'}","${report.status || 'N/A'}","${report.platform || 'N/A'}"\n`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="report-${id}.csv"`);
            res.send(csv);
        } catch (error) {
            console.error('CSV export error:', error);
            res.status(500).json({ message: 'Failed to generate CSV' });
        }
    }
);

// Templates
app.get('/api/templates', requireAuthAndAccess, apiLimiter, async (req, res) => {
    try {
        if (DB_ENABLED && prisma) {
            const tenantId = req.user.companyName || req.user.id;
            const templates = await prisma.template.findMany({ where: { tenantId: tenantId } });
            return res.json(templates);
        }
        res.json(db.templates);
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/templates',
    requireAuthAndAccess,
    apiLimiter,
    [
        body('name').trim().notEmpty().withMessage('Template name is required'),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const data = {
                name: req.body.name,
                description: req.body.description || '',
                category: req.body.category || 'General',
                isCustom: req.body.isCustom ?? true,
                lastModified: new Date().toISOString(),
                tenantId: req.user.companyName || req.user.id
            };
            if (DB_ENABLED && prisma) {
                const created = await prisma.template.create({ data });
                return res.status(201).json(created);
            }
            const newTemplate = { id: 't_' + Date.now(), createdAt: new Date().toISOString(), ...data };
            db.templates.push(newTemplate);
            saveDb(db);
            return res.status(201).json(newTemplate);
        } catch (error) {
            console.error('Create template error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

app.delete('/api/templates/:id',
    requireAuth,
    apiLimiter,
    [param('id').notEmpty()],
    handleValidationErrors,
    async (req, res) => {
        try {
            const id = req.params.id;
            if (DB_ENABLED && prisma) {
                await prisma.template.delete({ where: { id } });
                const tenantId = req.user.companyName || req.user.id;
                const list = await prisma.template.findMany({ where: { tenantId } });
                return res.json(list);
            }
            db.templates = db.templates.filter(t => t.id !== id);
            saveDb(db);
            return res.json(db.templates);
        } catch (error) {
            console.error('Delete template error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Packages
app.get('/api/packages', apiLimiter, (req, res) => {
    try {
        res.json(db.packages);
    } catch (error) {
        console.error('Get packages error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Subscriptions
app.get('/api/subscriptions',
    requireAuth,
    apiLimiter,
    (req, res) => {
        try {
            let subscriptions = db.subscriptions;
            if (req.user.role !== 'ADMIN' || req.user.id !== 'super_admin') {
                subscriptions = subscriptions.filter(s => s.userId === req.user.id);
            }
            res.json(subscriptions);
        } catch (error) {
            console.error('Get subscriptions error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

app.post('/api/subscriptions',
    requireAuth,
    apiLimiter,
    [
        body('packageId').notEmpty().withMessage('Package ID is required'),
        body('paymentMethod').optional().isIn(['card', 'paypal', 'bank']),
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const { packageId, paymentMethod } = req.body;

            // Find package
            const pkg = db.packages.find(p => p.id === packageId);
            if (!pkg) {
                return res.status(404).json({ message: 'Package not found' });
            }

            // Check if user already has active subscription
            const existingSubscription = db.subscriptions.find(s =>
                s.userId === req.user.id &&
                s.status === 'active' &&
                new Date(s.expiresAt) > new Date()
            );

            if (existingSubscription) {
                return res.status(400).json({
                    message: 'You already have an active subscription',
                    subscription: existingSubscription
                });
            }

            // Calculate subscription dates
            const now = new Date();
            const startDate = now.toISOString();
            let expiresAt;

            // Determine interval (monthly, yearly, etc.)
            const interval = pkg.interval || 'Monthly';
            if (interval.toLowerCase().includes('month')) {
                expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
            } else if (interval.toLowerCase().includes('year')) {
                expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
            } else {
                expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
            }

            // Create subscription
            const newSubscription = {
                id: 'sub_' + Date.now(),
                userId: req.user.id,
                packageId: packageId,
                packageName: pkg.name,
                status: paymentMethod ? 'pending' : 'active', // Active if no payment required (for testing)
                amount: pkg.price,
                interval: interval,
                startDate: startDate,
                expiresAt: expiresAt,
                paymentMethod: paymentMethod || null,
                createdAt: new Date().toISOString()
            };

            db.subscriptions.push(newSubscription);

            // If payment method provided, mark as pending (will be activated after payment)
            // Otherwise, activate immediately and end trial
            if (!paymentMethod || paymentMethod === 'bank') {
                const dbUser = db.users.find(u => u.id === req.user.id);
                if (dbUser) {
                    dbUser.isTrial = false;
                }
            }

            saveDb(db);
            auditLog('SUBSCRIPTION_CREATED', req.user.id, { subscriptionId: newSubscription.id, packageId });

            res.status(201).json(newSubscription);
        } catch (error) {
            console.error('Create subscription error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Activate subscription after payment
app.post('/api/subscriptions/:id/activate',
    requireAuth,
    apiLimiter,
    [param('id').notEmpty()],
    handleValidationErrors,
    (req, res) => {
        try {
            const { id } = req.params;
            const subscription = db.subscriptions.find(s => s.id === id && s.userId === req.user.id);

            if (!subscription) {
                return res.status(404).json({ message: 'Subscription not found' });
            }

            // Activate subscription
            subscription.status = 'active';
            subscription.activatedAt = new Date().toISOString();

            // End trial for user
            const dbUser = db.users.find(u => u.id === req.user.id);
            if (dbUser) {
                dbUser.isTrial = false;
            }

            saveDb(db);
            auditLog('SUBSCRIPTION_ACTIVATED', req.user.id, { subscriptionId: id });

            res.json(subscription);
        } catch (error) {
            console.error('Activate subscription error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

app.post('/api/packages',
    requireAuth,
    apiLimiter,
    [
        body('name').trim().notEmpty().withMessage('Package name is required'),
        body('price').isNumeric().withMessage('Price must be a number'),
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const newPkg = {
                ...req.body,
                id: 'pkg_' + Date.now(),
                createdAt: new Date().toISOString()
            };
            db.packages.push(newPkg);
            saveDb(db);
            res.status(201).json(db.packages);
        } catch (error) {
            console.error('Create package error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

app.delete('/api/packages/:id',
    requireAuth,
    apiLimiter,
    [param('id').notEmpty()],
    handleValidationErrors,
    (req, res) => {
        try {
            db.packages = db.packages.filter(p => p.id !== req.params.id);
            saveDb(db);
            res.json(db.packages);
        } catch (error) {
            console.error('Delete package error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Integrations
app.get('/api/integrations', requireAuthAndAccess, apiLimiter, async (req, res) => {
    try {
        if (DB_ENABLED && prisma) {
            const tenantId = req.user.companyName || req.user.id;
            let list = await prisma.integration.findMany({ where: { OR: [{ tenantId }, { tenantId: null }] } });
            if (list.length === 0 && Array.isArray(db.integrations)) {
                // Seed from JSON for first time per tenant
                await Promise.all(
                    db.integrations.map(int => prisma.integration.upsert({
                        where: { id: int.id },
                        update: {},
                        create: {
                            id: int.id,
                            name: int.name,
                            provider: int.provider,
                            status: int.status,
                            lastSync: int.lastSync || null,
                            description: int.description,
                            tenantId
                        }
                    }))
                );
                list = await prisma.integration.findMany({ where: { tenantId } });
            }
            return res.json(list);
        }
        res.json(db.integrations);
    } catch (error) {
        console.error('Get integrations error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/integrations/:id/toggle',
    requireAuth,
    apiLimiter,
    [param('id').notEmpty()],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            if (DB_ENABLED && prisma) {
                const tenantId = req.user.companyName || req.user.id;
                let int = await prisma.integration.findUnique({ where: { id } });
                if (!int) {
                    // Seed single integration if not found
                    const seed = (db.integrations || []).find(i => i.id === id);
                    if (!seed) return res.status(404).json({ message: 'Integration not found' });
                    int = await prisma.integration.create({ data: { ...seed, tenantId } });
                }
                const isConnected = int.status === 'Connected';
                await prisma.integration.update({
                    where: { id },
                    data: { status: isConnected ? 'Disconnected' : 'Connected', lastSync: isConnected ? null : 'Just now' }
                });
                const list = await prisma.integration.findMany({ where: { OR: [{ tenantId }, { tenantId: null }] } });
                return res.json(list);
            }

            db.integrations = db.integrations.map(int => {
                if (int.id === id) {
                    const isConnected = int.status === 'Connected';
                    return {
                        ...int,
                        status: isConnected ? 'Disconnected' : 'Connected',
                        lastSync: isConnected ? undefined : 'Just now'
                    };
                }
                return int;
            });
            saveDb(db);
            res.json(db.integrations);
        } catch (error) {
            console.error('Toggle integration error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Invoices
app.get('/api/invoices', requireAuthAndAccess, apiLimiter, async (req, res) => {
    try {
        if (DB_ENABLED && prisma) {
            const tenantId = req.user.companyName || req.user.id;
            const invoices = await prisma.invoice.findMany({ where: { tenantId } });
            return res.json(invoices);
        }
        res.json(db.invoices);
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/invoices',
    requireAuth,
    apiLimiter,
    [
        body('clientId').notEmpty().withMessage('Client ID is required'),
        body('amount').isNumeric().withMessage('Amount must be a number'),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const base = {
                clientName: req.body.clientName || 'N/A',
                amount: Number(req.body.amount),
                date: req.body.date || new Date().toISOString(),
                dueDate: req.body.dueDate || new Date().toISOString(),
                status: req.body.status || 'Pending',
                items: req.body.items || [{ description: req.body.description || 'Service', amount: Number(req.body.amount) }],
                tenantId: req.user.companyName || req.user.id
            };
            if (DB_ENABLED && prisma) {
                const created = await prisma.invoice.create({ data: base });
                const invoices = await prisma.invoice.findMany({ where: { tenantId: base.tenantId } });
                return res.status(201).json(invoices);
            }
            const invoice = { id: 'inv_' + Date.now(), createdAt: new Date().toISOString(), ...base };
            db.invoices.push(invoice);
            saveDb(db);
            res.status(201).json(db.invoices);
        } catch (error) {
            console.error('Create invoice error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

app.post('/api/invoices/:id/pay',
    requireAuth,
    apiLimiter,
    [param('id').notEmpty()],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            if (DB_ENABLED && prisma) {
                await prisma.invoice.update({ where: { id }, data: { status: 'Paid', /* paidAt not in schema, keep status only */ } });
                const tenantId = req.user.companyName || req.user.id;
                const invoices = await prisma.invoice.findMany({ where: { tenantId } });
                return res.json(invoices);
            }
            db.invoices = db.invoices.map(inv => inv.id === id ? { ...inv, status: 'Paid', paidAt: new Date().toISOString() } : inv);
            saveDb(db);
            res.json(db.invoices);
        } catch (error) {
            console.error('Pay invoice error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// --- PAYMENT PROCESSING ---

// Initialize payment configurations
if (!db.paymentConfig) {
    db.paymentConfig = {
        stripe: {
            enabled: false,
            publishableKey: '',
            secretKey: '',
            webhookSecret: ''
        },
        paypal: {
            enabled: false,
            clientId: '',
            clientSecret: '',
            mode: 'sandbox' // or 'live'
        },
        bankAccount: {
            accountName: '',
            accountNumber: '',
            bankName: '',
            swiftCode: '',
            routingNumber: ''
        }
    };
    saveDb(db);
}

// Initialize payment transactions
if (!db.paymentTransactions) {
    db.paymentTransactions = [];
}

// Get payment configuration (Admin only)
app.get('/api/payments/config',
    requireAuth,
    requireRole('ADMIN'),
    apiLimiter,
    (req, res) => {
        try {
            // Don't send secret keys to frontend
            const config = {
                stripe: {
                    enabled: db.paymentConfig.stripe.enabled,
                    publishableKey: db.paymentConfig.stripe.publishableKey
                },
                paypal: {
                    enabled: db.paymentConfig.paypal.enabled,
                    clientId: db.paymentConfig.paypal.clientId,
                    mode: db.paymentConfig.paypal.mode
                },
                bankAccount: db.paymentConfig.bankAccount
            };
            res.json(config);
        } catch (error) {
            console.error('Get payment config error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Update payment configuration (Admin only)
app.put('/api/payments/config',
    requireAuth,
    requireRole('ADMIN'),
    apiLimiter,
    [
        body('stripe').optional().isObject(),
        body('paypal').optional().isObject(),
        body('bankAccount').optional().isObject(),
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            if (req.body.stripe) {
                db.paymentConfig.stripe = {
                    ...db.paymentConfig.stripe,
                    ...req.body.stripe
                };
            }
            if (req.body.paypal) {
                db.paymentConfig.paypal = {
                    ...db.paymentConfig.paypal,
                    ...req.body.paypal
                };
            }
            if (req.body.bankAccount) {
                db.paymentConfig.bankAccount = {
                    ...db.paymentConfig.bankAccount,
                    ...req.body.bankAccount
                };
            }

            saveDb(db);
            auditLog('PAYMENT_CONFIG_UPDATED', req.user.id);
            res.json({ message: 'Payment configuration updated successfully' });
        } catch (error) {
            console.error('Update payment config error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// Process card payment (Stripe)
app.post('/api/payments/process',
    requireAuth,
    apiLimiter,
    [
        body('invoiceId').notEmpty(),
        body('method').equals('card'),
        body('amount').isNumeric(),
        body('cardDetails').isObject(),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { invoiceId, amount, cardDetails } = req.body;

            // Find invoice
            const invoice = db.invoices.find(inv => inv.id === invoiceId);
            if (!invoice) {
                return res.status(404).json({ message: 'Invoice not found' });
            }

            if (invoice.amount !== amount) {
                return res.status(400).json({ message: 'Amount mismatch' });
            }

            // Check if Stripe is configured
            if (!db.paymentConfig.stripe.enabled || !db.paymentConfig.stripe.secretKey) {
                // In production, you would use Stripe SDK here
                // For now, simulate successful payment
                const transaction = {
                    id: 'txn_' + Date.now(),
                    invoiceId,
                    amount,
                    method: 'card',
                    cardType: cardDetails.number.startsWith('4') ? 'Visa' :
                        cardDetails.number.startsWith('5') ? 'Mastercard' : 'Card',
                    status: 'completed',
                    userId: req.user.id,
                    createdAt: new Date().toISOString(),
                    // In production, store Stripe payment intent ID
                    paymentIntentId: 'pi_mock_' + Date.now()
                };

                db.paymentTransactions.push(transaction);

                // Update invoice
                invoice.status = 'Paid';
                invoice.paidAt = new Date().toISOString();
                invoice.paymentMethod = 'card';
                invoice.transactionId = transaction.id;

                saveDb(db);
                auditLog('PAYMENT_PROCESSED', req.user.id, { invoiceId, method: 'card', amount });

                res.json({
                    success: true,
                    transactionId: transaction.id,
                    message: 'Payment processed successfully'
                });
            } else {
                // TODO: Integrate with Stripe SDK
                // const stripe = require('stripe')(db.paymentConfig.stripe.secretKey);
                // const paymentIntent = await stripe.paymentIntents.create({...});
                res.status(501).json({ message: 'Stripe integration pending. Please configure Stripe keys.' });
            }
        } catch (error) {
            console.error('Process payment error:', error);
            res.status(500).json({ message: 'Payment processing failed' });
        }
    }
);

// Create PayPal payment
app.post('/api/payments/paypal/create',
    requireAuth,
    apiLimiter,
    [
        body('invoiceId').notEmpty(),
        body('amount').isNumeric(),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { invoiceId, amount } = req.body;

            // Find invoice
            const invoice = db.invoices.find(inv => inv.id === invoiceId);
            if (!invoice) {
                return res.status(404).json({ message: 'Invoice not found' });
            }

            if (invoice.amount !== amount) {
                return res.status(400).json({ message: 'Amount mismatch' });
            }

            // Check if PayPal is configured
            if (!db.paymentConfig.paypal.enabled || !db.paymentConfig.paypal.clientId) {
                return res.status(400).json({
                    message: 'PayPal is not configured. Please contact administrator.'
                });
            }

            // TODO: Integrate with PayPal SDK
            // For now, create a mock payment approval URL
            // In production, use PayPal REST API:
            // const paypal = require('@paypal/checkout-server-sdk');
            // const request = new paypal.orders.OrdersCreateRequest();
            // ... create order and return approval URL

            const paymentId = 'paypal_' + Date.now();
            const approvalUrl = `https://www.paypal.com/checkoutnow?token=${paymentId}`;

            // Store pending payment
            const pendingPayment = {
                id: paymentId,
                invoiceId,
                amount,
                method: 'paypal',
                status: 'pending',
                userId: req.user.id,
                createdAt: new Date().toISOString(),
                approvalUrl
            };

            db.paymentTransactions.push(pendingPayment);
            saveDb(db);

            auditLog('PAYPAL_PAYMENT_INITIATED', req.user.id, { invoiceId, amount });

            res.json({
                paymentId,
                approvalUrl,
                message: 'Redirect to PayPal to complete payment'
            });
        } catch (error) {
            console.error('Create PayPal payment error:', error);
            res.status(500).json({ message: 'PayPal payment creation failed' });
        }
    }
);

// PayPal callback/confirmation
app.post('/api/payments/paypal/confirm',
    requireAuth,
    apiLimiter,
    [
        body('paymentId').notEmpty(),
        body('payerId').notEmpty(),
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { paymentId, payerId } = req.body;

            // Find pending payment
            const transaction = db.paymentTransactions.find(t => t.id === paymentId);
            if (!transaction) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            // TODO: Verify with PayPal API
            // In production, use PayPal SDK to execute the payment

            // Update transaction
            transaction.status = 'completed';
            transaction.payerId = payerId;
            transaction.completedAt = new Date().toISOString();

            // Update invoice
            const invoice = db.invoices.find(inv => inv.id === transaction.invoiceId);
            if (invoice) {
                invoice.status = 'Paid';
                invoice.paidAt = new Date().toISOString();
                invoice.paymentMethod = 'paypal';
                invoice.transactionId = transaction.id;

                // If invoice has a subscriptionId, activate the subscription
                if (invoice.subscriptionId) {
                    const subscription = db.subscriptions.find(s => s.id === invoice.subscriptionId);
                    if (subscription && subscription.status === 'pending') {
                        subscription.status = 'active';
                        subscription.activatedAt = new Date().toISOString();

                        // End trial for user
                        const dbUser = db.users.find(u => u.id === req.user.id);
                        if (dbUser) {
                            dbUser.isTrial = false;
                        }
                    }
                }
            }

            saveDb(db);
            auditLog('PAYPAL_PAYMENT_CONFIRMED', req.user.id, { paymentId, invoiceId: transaction.invoiceId });

            res.json({
                success: true,
                transactionId: transaction.id,
                message: 'PayPal payment confirmed successfully',
                subscriptionActivated: invoice?.subscriptionId ? true : false
            });
        } catch (error) {
            console.error('Confirm PayPal payment error:', error);
            res.status(500).json({ message: 'PayPal payment confirmation failed' });
        }
    }
);

// Get payment transactions
app.get('/api/payments/transactions',
    requireAuth,
    requireClientAccess,
    apiLimiter,
    (req, res) => {
        try {
            let transactions = db.paymentTransactions;
            if (req.user.role !== 'ADMIN' || req.user.id !== 'super_admin') {
                transactions = transactions.filter(t => t.userId === req.user.id);
            }

            // Sort by date (newest first)
            transactions = transactions.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            res.json(transactions);
        } catch (error) {
            console.error('Get transactions error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// --- REPORT CUSTOMIZATION PER CLIENT ---
app.post('/api/reports/:reportId/customize',
    requireAuth,
    requireClientAccess,
    apiLimiter,
    [
        param('reportId').notEmpty(),
        body('clientId').notEmpty(),
        body('customizations').isObject(),
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const { reportId } = req.params;
            const { clientId, customizations } = req.body;

            // Remove existing customization
            db.clientReportCustomizations = db.clientReportCustomizations.filter(
                c => !(c.reportId === reportId && c.clientId === clientId)
            );

            // Add new customization
            db.clientReportCustomizations.push({
                id: 'custom_' + Date.now(),
                reportId,
                clientId,
                customizations,
                userId: req.user.id,
                createdAt: new Date().toISOString()
            });

            saveDb(db);
            auditLog('REPORT_CUSTOMIZED', req.user.id, { reportId, clientId });
            res.json({ message: 'Report customized successfully' });
        } catch (error) {
            console.error('Customize report error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

app.get('/api/reports/:reportId/customizations/:clientId',
    requireAuth,
    requireClientAccess,
    apiLimiter,
    (req, res) => {
        try {
            const { reportId, clientId } = req.params;
            const customization = db.clientReportCustomizations.find(
                c => c.reportId === reportId && c.clientId === clientId
            );
            res.json(customization || { customizations: {} });
        } catch (error) {
            console.error('Get customization error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// --- KPI TRACKING ---
app.get('/api/kpis',
    requireAuth,
    requireClientAccess,
    apiLimiter,
    (req, res) => {
        try {
            let kpis = db.kpis;
            if (req.user.role !== 'ADMIN' || req.user.id !== 'super_admin') {
                kpis = filterByClient(kpis, req.user);
            }
            res.json(kpis);
        } catch (error) {
            console.error('Get KPIs error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

app.post('/api/kpis',
    requireAuth,
    requireClientAccess,
    apiLimiter,
    [
        body('name').trim().notEmpty(),
        body('target').isNumeric(),
        body('current').optional().isNumeric(),
        body('clientId').optional(),
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const newKPI = {
                id: 'kpi_' + Date.now(),
                ...req.body,
                userId: req.user.id,
                companyName: req.user.companyName || req.user.id,
                createdAt: new Date().toISOString(),
                current: req.body.current || 0
            };
            db.kpis.push(newKPI);
            saveDb(db);
            auditLog('KPI_CREATED', req.user.id, { kpiId: newKPI.id });
            res.status(201).json(newKPI);
        } catch (error) {
            console.error('Create KPI error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

app.put('/api/kpis/:id',
    requireAuth,
    requireClientAccess,
    apiLimiter,
    [param('id').notEmpty()],
    handleValidationErrors,
    (req, res) => {
        try {
            const { id } = req.params;
            const kpi = db.kpis.find(k => k.id === id);
            if (!kpi) {
                return res.status(404).json({ message: 'KPI not found' });
            }

            Object.assign(kpi, req.body, { updatedAt: new Date().toISOString() });
            saveDb(db);
            auditLog('KPI_UPDATED', req.user.id, { kpiId: id });
            res.json(kpi);
        } catch (error) {
            console.error('Update KPI error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// --- SCHEDULED REPORTS ---
function calculateNextRun(schedule) {
    const now = new Date();
    switch (schedule) {
        case 'daily':
            now.setDate(now.getDate() + 1);
            break;
        case 'weekly':
            now.setDate(now.getDate() + 7);
            break;
        case 'monthly':
            now.setMonth(now.getMonth() + 1);
            break;
    }
    return now.toISOString();
}

app.get('/api/scheduled-reports',
    requireAuth,
    requireClientAccess,
    apiLimiter,
    (req, res) => {
        try {
            let scheduled = db.scheduledReports;
            if (req.user.role !== 'ADMIN' || req.user.id !== 'super_admin') {
                scheduled = filterByClient(scheduled, req.user);
            }
            res.json(scheduled);
        } catch (error) {
            console.error('Get scheduled reports error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

app.post('/api/scheduled-reports',
    requireAuth,
    requireClientAccess,
    apiLimiter,
    [
        body('reportTemplateId').notEmpty(),
        body('clientId').notEmpty(),
        body('schedule').isIn(['daily', 'weekly', 'monthly']),
        body('recipients').isArray().notEmpty(),
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const newSchedule = {
                id: 'schedule_' + Date.now(),
                ...req.body,
                userId: req.user.id,
                companyName: req.user.companyName || req.user.id,
                enabled: true,
                lastRun: null,
                nextRun: calculateNextRun(req.body.schedule),
                createdAt: new Date().toISOString()
            };
            db.scheduledReports.push(newSchedule);
            saveDb(db);
            auditLog('SCHEDULE_CREATED', req.user.id, { scheduleId: newSchedule.id });
            res.status(201).json(newSchedule);
        } catch (error) {
            console.error('Create schedule error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// --- AUDIT LOGS ---
app.get('/api/audit-logs',
    requireAuth,
    requireRole('ADMIN'),
    apiLimiter,
    (req, res) => {
        try {
            const { limit = 100, offset = 0, userId, action } = req.query;
            let logs = db.auditLogs;

            if (userId) logs = logs.filter(l => l.userId === userId);
            if (action) logs = logs.filter(l => l.action === action);

            logs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            logs = logs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

            res.json({ logs, total: db.auditLogs.length });
        } catch (error) {
            console.error('Get audit logs error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// --- DATA BACKUP ---
app.post('/api/admin/backup',
    requireAuth,
    requireRole('ADMIN'),
    apiLimiter,
    (req, res) => {
        try {
            const backupFile = createBackup();
            if (backupFile) {
                auditLog('BACKUP_CREATED', req.user.id);
                res.json({ message: 'Backup created successfully', file: backupFile });
            } else {
                res.status(500).json({ message: 'Backup failed' });
            }
        } catch (error) {
            console.error('Manual backup error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// --- GDPR COMPLIANCE ---
app.get('/api/gdpr/export-data',
    requireAuth,
    apiLimiter,
    (req, res) => {
        try {
            const userId = req.user.id;
            const userData = {
                user: db.users.find(u => u.id === userId),
                clients: filterByClient(db.clients, req.user),
                reports: filterByClient(db.reports, req.user),
                kpis: filterByClient(db.kpis, req.user),
                scheduledReports: filterByClient(db.scheduledReports, req.user),
                auditLogs: db.auditLogs.filter(l => l.userId === userId)
            };

            auditLog('GDPR_EXPORT', userId);
            res.json(userData);
        } catch (error) {
            console.error('GDPR export error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

app.delete('/api/gdpr/delete-account',
    requireAuth,
    apiLimiter,
    [
        body('confirm').equals('DELETE').withMessage('Must confirm deletion'),
    ],
    handleValidationErrors,
    (req, res) => {
        try {
            const userId = req.user.id;

            // Delete user data
            db.users = db.users.filter(u => u.id !== userId);
            db.clients = db.clients.filter(c => c.userId !== userId);
            db.reports = db.reports.filter(r => r.userId !== userId);
            db.kpis = db.kpis.filter(k => k.userId !== userId);
            db.scheduledReports = db.scheduledReports.filter(s => s.userId !== userId);

            saveDb(db);
            auditLog('ACCOUNT_DELETED', userId);
            res.json({ message: 'Account and all data deleted successfully' });
        } catch (error) {
            console.error('GDPR delete error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// --- PLATFORM DATA ENDPOINTS ---
app.get('/api/platforms/:id/data',
    requireAuth,
    apiLimiter,
    [param('id').notEmpty()],
    handleValidationErrors,
    (req, res) => {
        try {
            const { id } = req.params;
            const { range } = req.query;

            const m = range === 'daily' ? 1 : range === 'weekly' ? 7 : 30;
            const variance = () => 0.9 + Math.random() * 0.2;

            let data = null;

            if (id === 'google_ads') {
                data = {
                    id: 'google_ads',
                    metrics: [
                        { label: 'Impressions', value: (1200000 * m * variance()).toLocaleString(), change: '+12%', trend: 'up' },
                        { label: 'Clicks', value: Math.floor(45200 * m * variance()).toLocaleString(), change: '+8%', trend: 'up' },
                        { label: 'Avg. CPC', value: 'KES 45', change: '-2%', trend: 'down' },
                        { label: 'Conversions', value: Math.floor(1240 * m * variance()).toLocaleString(), change: '+15%', trend: 'up' },
                    ]
                };
            } else if (id === 'ga4') {
                data = {
                    id: 'ga4',
                    metrics: [
                        { label: 'Users', value: Math.floor(85400 * m * variance()).toLocaleString(), change: '+22%', trend: 'up' },
                        { label: 'New Users', value: Math.floor(65000 * m * variance()).toLocaleString(), change: '+15%', trend: 'up' },
                        { label: 'Sessions', value: Math.floor(120000 * m * variance()).toLocaleString(), change: '+18%', trend: 'up' },
                        { label: 'Engagement Rate', value: '58.4%', change: '+2.4%', trend: 'up' },
                    ]
                };
            }

            if (data) {
                res.json(data);
            } else {
                res.json({ id, metrics: [] });

                // --- SUBSCRIPTION & PAYMENT ENDPOINTS ---

                // Basic email logger (replace with real provider in production)
                const queueEmailNotification = (to, subject, message, meta = {}) => {
                    if (!to) return;
                    if (!db.emailNotifications) db.emailNotifications = [];
                    const entry = {
                        id: 'mail_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                        to,
                        subject,
                        message,
                        meta,
                        timestamp: new Date().toISOString()
                    };
                    db.emailNotifications.push(entry);
                    saveDb(db);
                    console.log(`[EMAIL-LOG] → ${to}: ${subject}`);
                };

                // Payment webhook (Stripe/M-Pesa ready)
                app.post('/api/payments/webhook',
                    apiLimiter,
                    (req, res) => {
                        try {
                            const secret = process.env.WEBHOOK_SECRET;
                            const signature = req.headers['x-webhook-signature'] || req.headers['stripe-signature'];
                            if (secret && signature !== secret) {
                                return res.status(401).json({ message: 'Invalid webhook signature' });
                            }

                            const { eventType, data = {} } = req.body || {};
                            const paymentIntentId = data.paymentIntentId || data.id;
                            const userId = data.userId;

                            if (eventType === 'payment_succeeded' && paymentIntentId) {
                                const intent = db.paymentIntents?.find(p => p.id === paymentIntentId);
                                if (intent) {
                                    intent.status = 'succeeded';
                                    intent.transactionId = data.transactionId || data.chargeId || intent.transactionId;
                                    intent.confirmedAt = new Date().toISOString();

                                    // If a trial exists, activate it
                                    const subscription = db.subscriptions?.find(s => s.userId === intent.userId && s.status === 'trial');
                                    if (subscription) {
                                        subscription.status = 'active';
                                        subscription.paymentIntentId = paymentIntentId;
                                        subscription.transactionId = intent.transactionId;
                                        subscription.updatedAt = new Date().toISOString();
                                        subscription.nextBillingDate = subscription.nextBillingDate || new Date(Date.now() + (subscription.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();
                                    }

                                    saveDb(db);
                                    const emailTo = intent.email || (db.users.find(u => u.id === intent.userId)?.email);
                                    queueEmailNotification(emailTo, 'Payment successful', 'Your payment was received successfully. Your access remains active.', { paymentIntentId });
                                    auditLog('PAYMENT_CONFIRMED', intent.userId || userId, { via: 'webhook', paymentIntentId });
                                }
                            } else if (eventType === 'payment_failed' && paymentIntentId) {
                                const intent = db.paymentIntents?.find(p => p.id === paymentIntentId);
                                if (intent) {
                                    intent.status = 'failed';
                                    intent.failedAt = new Date().toISOString();
                                    saveDb(db);
                                    const emailTo = intent.email || (db.users.find(u => u.id === intent.userId)?.email);
                                    queueEmailNotification(emailTo, 'Payment failed', 'Payment could not be processed. Please update your payment method to keep access.', { paymentIntentId });
                                    auditLog('PAYMENT_FAILED', intent.userId || userId, { paymentIntentId });
                                }
                            } else if (eventType === 'trial_will_expire' && data.subscriptionId) {
                                const sub = db.subscriptions?.find(s => s.id === data.subscriptionId);
                                if (sub && sub.status === 'trial') {
                                    const emailTo = db.users.find(u => u.id === sub.userId)?.email;
                                    queueEmailNotification(emailTo, 'Trial ending soon', 'Your trial ends soon. Add a payment method to keep uninterrupted access.', { subscriptionId: sub.id });
                                    sub.trialWarningSent = true;
                                    saveDb(db);
                                    auditLog('TRIAL_WARNING_SENT', sub.userId, { subscriptionId: sub.id });
                                }
                            }

                            res.json({ received: true });
                        } catch (error) {
                            console.error('Webhook handling error:', error);
                            res.status(500).json({ message: 'Webhook handling failed' });
                        }
                    }
                );

                // Create Trial Subscription (7 days free)
                app.post('/api/subscriptions/create-trial',
                    requireAuth,
                    apiLimiter,
                    [
                        body('planId').isIn(['starter', 'agency', 'enterprise']).withMessage('Invalid plan'),
                        body('trialDays').isInt({ min: 1, max: 30 }).withMessage('Trial days must be 1-30'),
                        body('billingCycle').isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle')
                    ],
                    handleValidationErrors,
                    (req, res) => {
                        try {
                            const { planId, trialDays = 7, billingCycle } = req.body;
                            const userId = req.user.id;

                            // Initialize subscriptions array if needed
                            if (!db.subscriptions) {
                                db.subscriptions = [];
                            }

                            // Create subscription record
                            const subscription = {
                                id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                                userId,
                                planId,
                                billingCycle,
                                status: 'trial',
                                trialStartsAt: new Date().toISOString(),
                                trialEndsAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
                                paymentStartDate: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            };

                            // Remove any existing trial or pending subscription
                            db.subscriptions = db.subscriptions.filter(
                                s => !(s.userId === userId && (s.status === 'trial' || s.status === 'pending'))
                            );

                            db.subscriptions.push(subscription);

                            // Update user trial status
                            const user = db.users.find(u => u.id === userId);
                            if (user) {
                                user.isTrial = true;
                                user.trialEndsAt = subscription.trialEndsAt;
                                user.subscriptionId = subscription.id;
                            }

                            saveDb(db);
                            auditLog('SUBSCRIPTION_TRIAL_CREATED', userId, { planId, trialDays });

                            res.status(201).json({
                                success: true,
                                subscriptionId: subscription.id,
                                subscription
                            });
                        } catch (error) {
                            console.error('Trial subscription creation error:', error);
                            res.status(500).json({ message: 'Failed to create trial subscription' });
                        }
                    }
                );

                // Create Payment Checkout Session
                app.post('/api/payments/create-checkout',
                    requireAuth,
                    apiLimiter,
                    [
                        body('planId').isIn(['starter', 'agency', 'enterprise']).withMessage('Invalid plan'),
                        body('billingCycle').isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle'),
                        body('amount').isInt({ min: 1000 }).withMessage('Invalid amount'),
                        body('trialPeriodDays').optional().isInt({ min: 1, max: 30 })
                    ],
                    handleValidationErrors,
                    async (req, res) => {
                        try {
                            const { planId, billingCycle, amount, trialPeriodDays = 7 } = req.body;
                            const userId = req.user.id;
                            const user = db.users.find(u => u.id === userId);

                            if (!user) {
                                return res.status(404).json({ message: 'User not found' });
                            }

                            // In production, integrate with Stripe or M-Pesa
                            // For now, create a payment intent record
                            if (!db.paymentIntents) {
                                db.paymentIntents = [];
                            }

                            const paymentIntent = {
                                id: 'pi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                                userId,
                                planId,
                                billingCycle,
                                amount,
                                status: 'pending',
                                trialDays: trialPeriodDays,
                                email: user.email,
                                createdAt: new Date().toISOString(),
                                expiresAt: new Date(Date.now() + 1800000).toISOString() // 30 minutes
                            };

                            db.paymentIntents.push(paymentIntent);
                            saveDb(db);

                            // In production, create Stripe or M-Pesa checkout session
                            // For demo, return a mock session URL
                            const sessionUrl = `/payment/checkout?intent=${paymentIntent.id}&plan=${planId}&amount=${amount}`;

                            auditLog('PAYMENT_INTENT_CREATED', userId, { planId, amount });

                            res.json({
                                success: true,
                                paymentIntentId: paymentIntent.id,
                                sessionUrl,
                                // In production:
                                // sessionUrl: stripeSession.url or mpesaUrl
                            });
                        } catch (error) {
                            console.error('Payment checkout error:', error);
                            res.status(500).json({ message: 'Failed to create payment session' });
                        }
                    }
                );

                // Confirm Payment and Activate Subscription
                app.post('/api/payments/confirm',
                    requireAuth,
                    apiLimiter,
                    [
                        body('paymentIntentId').notEmpty(),
                        body('transactionId').notEmpty().withMessage('Transaction ID required')
                    ],
                    handleValidationErrors,
                    (req, res) => {
                        try {
                            const { paymentIntentId, transactionId } = req.body;
                            const userId = req.user.id;

                            const paymentIntent = db.paymentIntents?.find(
                                p => p.id === paymentIntentId && p.userId === userId
                            );

                            if (!paymentIntent) {
                                return res.status(404).json({ message: 'Payment intent not found' });
                            }

                            if (paymentIntent.status !== 'pending') {
                                return res.status(400).json({ message: 'Payment already processed' });
                            }

                            // Update payment intent
                            paymentIntent.status = 'succeeded';
                            paymentIntent.transactionId = transactionId;
                            paymentIntent.confirmedAt = new Date().toISOString();

                            // Create active subscription
                            if (!db.subscriptions) {
                                db.subscriptions = [];
                            }

                            // Calculate next billing date
                            const nextBillingDate = paymentIntent.billingCycle === 'yearly'
                                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                            const subscription = {
                                id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                                userId,
                                planId: paymentIntent.planId,
                                billingCycle: paymentIntent.billingCycle,
                                status: 'active',
                                paymentStatus: 'paid',
                                paymentIntentId,
                                transactionId,
                                startDate: new Date().toISOString(),
                                nextBillingDate: nextBillingDate.toISOString(),
                                amount: paymentIntent.amount,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            };

                            // Replace any previous subscription
                            db.subscriptions = db.subscriptions.filter(s => s.userId !== userId || s.status === 'cancelled');
                            db.subscriptions.push(subscription);

                            // Update user
                            const user = db.users.find(u => u.id === userId);
                            if (user) {
                                user.isTrial = false;
                                user.subscriptionId = subscription.id;
                                user.subscriptionPlan = subscription.planId;
                                user.subscriptionStatus = 'active';
                            }

                            saveDb(db);
                            auditLog('PAYMENT_CONFIRMED', userId, { planId: paymentIntent.planId, amount: paymentIntent.amount });

                            const emailTo = paymentIntent.email || user?.email;
                            queueEmailNotification(emailTo, 'Payment successful', 'Your payment was received successfully. Your subscription is now active.', { paymentIntentId, transactionId, planId: paymentIntent.planId });

                            res.json({
                                success: true,
                                subscription,
                                message: 'Payment successful. Your subscription is now active!'
                            });
                        } catch (error) {
                            console.error('Payment confirmation error:', error);
                            res.status(500).json({ message: 'Failed to confirm payment' });
                        }
                    }
                );

                // Get Subscription Status
                app.get('/api/subscriptions/current',
                    requireAuth,
                    apiLimiter,
                    (req, res) => {
                        try {
                            const userId = req.user.id;
                            const subscription = db.subscriptions?.find(
                                s => s.userId === userId && (s.status === 'active' || s.status === 'trial')
                            );

                            if (!subscription) {
                                return res.json({ subscription: null, message: 'No active subscription' });
                            }

                            // Calculate trial time remaining
                            if (subscription.status === 'trial' && subscription.trialEndsAt) {
                                const now = new Date();
                                const trialEnd = new Date(subscription.trialEndsAt);
                                const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
                                subscription.trialDaysRemaining = Math.max(0, daysRemaining);
                            }

                            res.json({ subscription });
                        } catch (error) {
                            console.error('Get subscription error:', error);
                            res.status(500).json({ message: 'Failed to fetch subscription' });
                        }
                    }
                );

                // Cancel Subscription
                app.post('/api/subscriptions/cancel',
                    requireAuth,
                    apiLimiter,
                    (req, res) => {
                        try {
                            const userId = req.user.id;
                            const subscription = db.subscriptions?.find(
                                s => s.userId === userId && s.status === 'active'
                            );

                            if (!subscription) {
                                return res.status(404).json({ message: 'No active subscription to cancel' });
                            }

                            subscription.status = 'cancelled';
                            subscription.cancelledAt = new Date().toISOString();
                            subscription.updatedAt = new Date().toISOString();

                            const user = db.users.find(u => u.id === userId);
                            if (user) {
                                user.subscriptionStatus = 'cancelled';
                            }

                            saveDb(db);
                            auditLog('SUBSCRIPTION_CANCELLED', userId);

                            res.json({ success: true, message: 'Subscription cancelled' });
                        } catch (error) {
                            console.error('Cancel subscription error:', error);
                            res.status(500).json({ message: 'Failed to cancel subscription' });
                        }
                    }
                );

                // Upgrade/Downgrade Plan
                app.post('/api/subscriptions/change-plan',
                    requireAuth,
                    apiLimiter,
                    [
                        body('newPlanId').isIn(['starter', 'agency', 'enterprise']).withMessage('Invalid plan'),
                        body('billingCycle').isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle')
                    ],
                    handleValidationErrors,
                    (req, res) => {
                        try {
                            const { newPlanId, billingCycle } = req.body;
                            const userId = req.user.id;

                            const subscription = db.subscriptions?.find(
                                s => s.userId === userId && s.status === 'active'
                            );

                            if (!subscription) {
                                return res.status(404).json({ message: 'No active subscription' });
                            }

                            // Create change record
                            if (!db.planChanges) {
                                db.planChanges = [];
                            }

                            db.planChanges.push({
                                id: 'change_' + Date.now(),
                                subscriptionId: subscription.id,
                                userId,
                                fromPlan: subscription.planId,
                                toPlan: newPlanId,
                                fromBilling: subscription.billingCycle,
                                toBilling: billingCycle,
                                status: 'pending',
                                changedAt: new Date().toISOString()
                            });

                            // Update subscription
                            subscription.planId = newPlanId;
                            subscription.billingCycle = billingCycle;
                            subscription.updatedAt = new Date().toISOString();

                            saveDb(db);
                            auditLog('SUBSCRIPTION_PLAN_CHANGED', userId, { newPlan: newPlanId });

                            res.json({
                                success: true,
                                subscription,
                                message: 'Plan changed successfully'
                            });
                        } catch (error) {
                            console.error('Change plan error:', error);
                            res.status(500).json({ message: 'Failed to change plan' });
                        }
                    }
                );

                // Check Trial Status and Migrate to Paid if Expired
                app.post('/api/subscriptions/check-trial-expiry',
                    requireAuth,
                    apiLimiter,
                    (req, res) => {
                        try {
                            const userId = req.user.id;
                            const user = db.users.find(u => u.id === userId);
                            const subscription = db.subscriptions?.find(
                                s => s.userId === userId && s.status === 'trial'
                            );

                            if (!subscription) {
                                return res.json({ expired: false, message: 'No trial subscription' });
                            }

                            const now = new Date();
                            const trialEnd = new Date(subscription.trialEndsAt);

                            if (now > trialEnd) {
                                // Trial has expired - require payment
                                subscription.status = 'expired';
                                subscription.updatedAt = new Date().toISOString();

                                if (user) {
                                    user.isTrial = false;
                                }

                                saveDb(db);
                                auditLog('TRIAL_EXPIRED', userId);

                                const emailTo = user?.email;
                                queueEmailNotification(emailTo, 'Trial expired', 'Your trial has ended. Add a payment method to keep using WebProMetrics.', { subscriptionId: subscription.id });

                                return res.json({
                                    expired: true,
                                    message: 'Trial has expired. Please subscribe to continue.',
                                    trialEndedAt: subscription.trialEndsAt
                                });
                            }

                            const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

                            if (daysRemaining <= 2 && !subscription.trialWarningSent) {
                                const emailTo = user?.email;
                                queueEmailNotification(emailTo, 'Trial ending soon', `Your trial ends in ${daysRemaining} day(s). Add payment to avoid interruption.`, { subscriptionId: subscription.id, daysRemaining });
                                subscription.trialWarningSent = true;
                                subscription.updatedAt = new Date().toISOString();
                                saveDb(db);
                                auditLog('TRIAL_WARNING_SENT', userId, { subscriptionId: subscription.id, daysRemaining });
                            }

                            res.json({
                                expired: false,
                                trialActive: true,
                                daysRemaining,
                                trialEndsAt: subscription.trialEndsAt
                            });
                        } catch (error) {
                            console.error('Trial expiry check error:', error);
                            res.status(500).json({ message: 'Failed to check trial status' });
                        }
                    }
                );
            }
        } catch (error) {
            console.error('Get platform data error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

// --- DB TEST ENDPOINT ---
// import prisma from './services/db.js';

app.get('/api/db-test', async (req, res) => {
    try {
        if (!prisma) {
            return res.status(500).json({ connected: false, message: 'Prisma not initialized. Check DATABASE_URL.' });
        }
        // Try a simple query (list tables or users)
        await prisma.$queryRaw`SELECT 1`;
        res.json({ connected: true, message: 'Prisma is connected to MySQL.' });
    } catch (e) {
        res.status(500).json({ connected: false, message: e.message });
    }
});

// --- SERVE FRONTEND ---
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for non-API routes
app.get('*', (req, res, next) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
        if (err) next(err);
    });
});

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API route not found' });
});

// --- ERROR TRACKING ---
const errorLog = (error, req, context = {}) => {
    if (!db.errorLogs) {
        db.errorLogs = [];
    }

    const errorEntry = {
        id: 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        message: error.message,
        stack: NODE_ENV === 'development' ? error.stack : undefined,
        path: req?.path,
        method: req?.method,
        userId: req?.user?.id,
        ip: req?.ip || req?.connection?.remoteAddress,
        timestamp: new Date().toISOString(),
        context
    };

    db.errorLogs.push(errorEntry);

    // Keep only last 5000 errors
    if (db.errorLogs.length > 5000) {
        db.errorLogs = db.errorLogs.slice(-5000);
    }

    saveDb(db);
    console.error('Error logged:', errorEntry);
    return errorEntry;
};

// --- ERROR HANDLING MIDDLEWARE (must be last) ---
app.use((err, req, res, next) => {
    errorLog(err, req);
    console.error('Unhandled error:', err);

    // Don't leak error details in production
    if (NODE_ENV === 'production') {
        res.status(err.status || 500).json({
            message: err.message || 'Internal server error'
        });
    } else {
        res.status(err.status || 500).json({
            message: err.message || 'Internal server error',
            stack: err.stack
        });
    }
});

if (process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📦 Environment: ${NODE_ENV}`);
        console.log(`🔒 Security: ${NODE_ENV === 'production' ? 'Enabled' : 'Development mode'}`);
        console.log(`📊 Features: Audit Logging, Backups, KPIs, Scheduled Reports, GDPR, Multi-Tenant, RBAC`);
        console.log(`🌐 Access at: http://localhost:${PORT}`);

        // Create initial backup
        createBackup();
        console.log(`💾 Initial backup created`);

        if (NODE_ENV === 'development') {
            console.log(`⚠️  WARNING: Running in development mode. Not suitable for production!`);
        }
    }).on('error', (err) => {
        console.error('❌ Server failed to start:', err.message);
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Kill the process using: npx kill-port ${PORT}`);
        } else if (err.code === 'EACCES') {
            console.error(`Permission denied to bind to port ${PORT}. Try a port above 1024 or run with admin privileges.`);
        }
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('\nSIGINT received. Shutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
}

module.exports = app;
