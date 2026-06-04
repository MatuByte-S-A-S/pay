/** PM2 — PayMatuByte (pay.matubyte.com) */
module.exports = {
  apps: [
    {
      name: 'paymatubyte',
      cwd: __dirname,
      script: 'dist/index.js',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        /** 3000 = sitio Next.js "matubyte" en este VPS; no usar ese puerto */
        PORT: '3020',
        HOST: '0.0.0.0',
      },
    },
  ],
}
