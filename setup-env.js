/**
 * Environment Variables Setup Script
 * 
 * This script helps you create a .env file with the required configuration
 * 
 * Usage: node setup-env.js
 */

import fs from 'fs';
import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🚀 WebProMetrics - Environment Variables Setup\n');
  console.log('This script will help you create a .env file for production.\n');

  // Check if .env already exists
  if (fs.existsSync('.env')) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Generate JWT Secret
  const jwtSecret = crypto.randomBytes(32).toString('base64');
  console.log(`\n✅ Generated JWT Secret: ${jwtSecret}\n`);

  // Get domain
  const domain = await question('Enter your production domain (e.g., webprometrics.com): ');
  if (!domain) {
    console.log('❌ Domain is required. Setup cancelled.');
    rl.close();
    return;
  }

  // Clean domain (remove protocol if provided)
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const allowedOrigins = `https://${cleanDomain},https://www.${cleanDomain}`;

  // Get port (optional)
  const port = await question('Enter server port (default: 8080): ') || '8080';

  // Optional: Gemini API Key
  const geminiKey = await question('Enter Gemini API Key (optional, press Enter to skip): ');

  // Build .env content
  let envContent = `# ============================================
# WebProMetrics - Production Environment Variables
# Generated: ${new Date().toISOString()}
# ============================================

# Server Configuration
PORT=${port}
NODE_ENV=production

# JWT Configuration
# Secret used to sign and verify JWT tokens
JWT_SECRET=${jwtSecret}

# CORS Configuration
# Allowed origins for API requests
ALLOWED_ORIGINS=${allowedOrigins}
`;

  if (geminiKey) {
    envContent += `
# Optional: Gemini API (if using AI features)
GEMINI_API_KEY=${geminiKey}
`;
  }

  // Write .env file
  fs.writeFileSync('.env', envContent);

  console.log('\n✅ .env file created successfully!\n');
  console.log('📋 Configuration Summary:');
  console.log(`   Port: ${port}`);
  console.log(`   Environment: production`);
  console.log(`   JWT Secret: ${jwtSecret.substring(0, 20)}...`);
  console.log(`   Allowed Origins: ${allowedOrigins}`);
  if (geminiKey) {
    console.log(`   Gemini API: Configured`);
  }
  console.log('\n⚠️  IMPORTANT:');
  console.log('   - Never commit .env to git');
  console.log('   - Keep JWT_SECRET secure');
  console.log('   - Update ALLOWED_ORIGINS if you add more domains\n');

  rl.close();
}

setup().catch(err => {
  console.error('❌ Error:', err.message);
  rl.close();
  process.exit(1);
});

