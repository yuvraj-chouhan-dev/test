# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

## Required for Production

```env
# Server Configuration
PORT=8080
NODE_ENV=production

# JWT Configuration
# Generate a strong secret: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Configuration
# Comma-separated list of allowed origins (e.g., https://example.com,https://app.example.com)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Optional

```env
# Gemini API (if needed)
GEMINI_API_KEY=your-gemini-api-key-here

# Frontend API URL (optional, defaults to /api)
VITE_API_URL=/api

# Development Admin User (development only)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

## Quick Setup

1. Copy this template to `.env`:
   ```bash
   cp ENV_SETUP.md .env
   # Then edit .env with your actual values
   ```

2. Generate a secure JWT secret:
   ```bash
   openssl rand -base64 32
   ```

3. Update the `.env` file with your generated secret and domain.

## Security Notes

- **Never commit `.env` files** - they are automatically ignored by git
- **Use strong, random secrets** in production
- **Restrict CORS origins** to only your production domains
- **Rotate secrets** periodically in production

