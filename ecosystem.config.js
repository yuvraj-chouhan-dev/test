/**
 * PM2 Ecosystem Configuration
 * Use this file to manage your application with PM2
 * 
 * Installation:
 *   npm install -g pm2
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup  # Sets up auto-start on server reboot
 */

module.exports = {
  apps: [{
    name: 'webprometrics',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Process management
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    
    // Advanced options
    kill_timeout: 5000,
    listen_timeout: 10000,
    shutdown_with_message: true
  }]
};

