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

# Red inestable en VPS: reintentos al descargar binarios de Prisma
export npm_config_fetch_retries=5
export npm_config_fetch_retry_mintimeout=20000
export npm_config_fetch_retry_maxtimeout=120000

run_retry() {
  local label="$1"
  shift
  local max=4
  local n=1
  while [[ $n -le $max ]]; do
    echo "→ $label (intento $n/$max)"
    if "$@"; then
      return 0
    fi
    if [[ $n -eq $max ]]; then
      echo "ERROR: $label falló tras $max intentos"
      return 1
    fi
    echo "   Reintentando en 8s..."
    sleep 8
    n=$((n + 1))
  done
}

install_deps() {
  if [[ -d node_modules ]] && npm ls @prisma/client &>/dev/null; then
    echo "→ node_modules OK, omitiendo npm ci"
    return 0
  fi

  if run_retry "npm ci" npm ci; then
    return 0
  fi

  echo "→ npm ci con --ignore-scripts (evita postinstall de Prisma en la red)"
  run_retry "npm ci --ignore-scripts" npm ci --ignore-scripts
}

install_deps

run_retry "prisma generate" npx prisma generate

echo "→ build + db"
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
