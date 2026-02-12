/**
 * PM2 Ecosystem Configuration
 * 
 * Keeps backend and n8n running with auto-restart on crash.
 * 
 * Usage:
 *   npm install -g pm2          (one-time)
 *   pm2 start ecosystem.config.js
 *   pm2 status                  (check status)
 *   pm2 logs                    (tail logs)
 *   pm2 restart all             (restart everything)
 *   pm2 stop all                (stop everything)
 */
module.exports = {
  apps: [
    {
      name: 'n8n-backend',
      cwd: './backend',
      script: 'dist/main.js',
      watch: false,
      autorestart: true,
      restart_delay: 3000,        // wait 3s before restarting
      max_restarts: 50,           // max restarts before giving up
      min_uptime: 5000,           // must run 5s to count as "started"
      exp_backoff_restart_delay: 1000, // exponential backoff
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
    },
    {
      name: 'n8n-engine',
      script: 'npx',
      args: 'n8n start',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 30,
      min_uptime: 10000,
      exp_backoff_restart_delay: 2000,
      env: {
        N8N_PORT: 5678,
        N8N_PROTOCOL: 'http',
        NODE_ENV: 'development',
      },
    },
    {
      name: 'n8n-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'vite --host',
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 30,
      min_uptime: 5000,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
