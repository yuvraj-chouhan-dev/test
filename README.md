<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# WebProMetrics - Digital Marketing Agency Reporting Platform

A comprehensive reporting platform for digital marketing agencies to track and manage client metrics across multiple platforms.

## Features

- 📊 Multi-platform analytics dashboard
- 🔐 Secure authentication with JWT
- 📈 Real-time metrics tracking
- 🎨 Beautiful, modern UI
- 🔌 Integration support for Google Ads, GA4, Meta Ads, LinkedIn, X, TikTok
- 📝 Custom report generation
- 💰 Invoice management

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=8080
   NODE_ENV=development
   JWT_SECRET=your-development-secret-key
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set strong `JWT_SECRET` (use `openssl rand -base64 32` to generate)
- [ ] Configure `ALLOWED_ORIGINS` with your production domain(s)
- [ ] Set `NODE_ENV=production`
- [ ] Review and update CORS settings
- [ ] Set up proper database (currently using JSON file - consider migrating to PostgreSQL/MongoDB)
- [ ] Configure HTTPS/SSL
- [ ] Set up logging and monitoring
- [ ] Configure backup strategy for `db.json`

### Build for Production

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Set production environment variables:**
   ```env
   PORT=8080
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-generate-with-openssl-rand-base64-32
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

3. **Start the production server:**
   ```bash
   npm run start:prod
   ```

   Or simply:
   ```bash
   npm start
   ```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `8080` |
| `NODE_ENV` | Environment mode | No | `development` |
| `JWT_SECRET` | Secret key for JWT signing | **Yes (production)** | `development-secret-key-change-in-production` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | No | `http://localhost:3000,http://localhost:5173` (dev only) |
| `GEMINI_API_KEY` | Gemini API key (if using Gemini features) | No | - |
| `VITE_API_URL` | Frontend API base URL | No | `/api` |

### Security Features

✅ **Implemented:**
- JWT-based authentication with secure token signing
- Password hashing with bcrypt
- CORS configuration
- Rate limiting on API endpoints
- Helmet.js for security headers
- Input validation on all endpoints
- Error handling middleware
- Environment-based configuration

⚠️ **Important Security Notes:**
- **Never commit `.env` files** - they are in `.gitignore`
- **Generate a strong JWT_SECRET** for production
- **Configure CORS** to only allow your production domains
- **Use HTTPS** in production (configure at reverse proxy level)
- **Consider migrating from JSON file** to a proper database for production

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/refresh` - Refresh access token

#### Resources
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create client
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create report
- `GET /api/templates` - Get report templates
- `POST /api/templates` - Create template
- `DELETE /api/templates/:id` - Delete template
- `GET /api/packages` - Get pricing packages
- `GET /api/integrations` - Get integrations
- `POST /api/integrations/:id/toggle` - Toggle integration
- `GET /api/invoices` - Get invoices
- `POST /api/invoices` - Create invoice
- `POST /api/invoices/:id/pay` - Mark invoice as paid
- `GET /api/platforms/:id/data` - Get platform metrics

#### Health Check
- `GET /health` - Server health status

### Development Admin User

In development mode, a default admin user is automatically created:
- **Email:** `admin@example.com` (or set via `ADMIN_EMAIL`)
- **Password:** `admin123` (or set via `ADMIN_PASSWORD`)

⚠️ **This only works in development mode. In production, create users through the signup endpoint.**

### Database

Currently using a JSON file (`db.json`) for data persistence. This is suitable for development and small deployments but should be migrated to a proper database (PostgreSQL, MongoDB, etc.) for production use.

### Rate Limiting

- **Authentication endpoints:** 5 requests per 15 minutes per IP
- **API endpoints:** 100 requests per 15 minutes per IP

### Troubleshooting

**Server won't start:**
- Check that `JWT_SECRET` is set in production
- Ensure port is not already in use
- Check Node.js version (requires 18+)

**CORS errors:**
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check that origin matches exactly (including protocol and port)

**Authentication fails:**
- Verify JWT_SECRET is the same across restarts
- Check token expiration (15 minutes for access tokens)
- Ensure password is hashed correctly in database

### License

Private - All rights reserved
