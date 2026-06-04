#!/usr/bin/env bash
# Certificado Let's Encrypt para pay.matubyte.com
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

sudo mkdir -p /var/www/certbot
sudo cp "$ROOT/deploy/nginx/pay.matubyte.com.http.conf" /etc/nginx/sites-available/pay.matubyte.com
sudo ln -sf /etc/nginx/sites-available/pay.matubyte.com /etc/nginx/sites-enabled/pay.matubyte.com
sudo nginx -t && sudo systemctl reload nginx

sudo certbot certonly --webroot -w /var/www/certbot \
  -d pay.matubyte.com \
  --agree-tos -m admin@matubyte.com --non-interactive || true

sudo cp "$ROOT/deploy/nginx/pay.matubyte.com.conf" /etc/nginx/sites-available/pay.matubyte.com
sudo nginx -t && sudo systemctl reload nginx

echo "✓ SSL pay.matubyte.com (si certbot terminó OK)"
