#!/usr/bin/env bash
# Despliegue PayMatuByte en ~/apps/pay (pay.matubyte.com)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ PayMatuByte deploy en $ROOT"

if [[ ! -f .env ]]; then
  echo "ERROR: Crea .env desde .env.production.example"
  exit 1
fi

mkdir -p data

echo "→ npm ci"
npm ci

echo "→ prisma + build"
npm run db:generate
npm run build
npm run db:push

if pm2 describe paymatubyte &>/dev/null; then
  pm2 restart paymatubyte --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo "✓ PayMatuByte en PM2 — https://pay.matubyte.com/health"
echo "  pm2 logs paymatubyte"
