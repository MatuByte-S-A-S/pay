#!/usr/bin/env bash
# Arreglo completo en el VPS: puerto 3020 + PM2 + nginx
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  if grep -q '^PORT=3000' .env 2>/dev/null; then
    sed -i 's/^PORT=3000/PORT=3020/' .env
    echo "→ .env: PORT cambiado 3000 → 3020"
  fi
  if ! grep -q '^PORT=' .env; then
    echo 'PORT=3020' >> .env
    echo "→ .env: añadido PORT=3020"
  fi
else
  echo "Crea .env primero (cp .env.production.example .env)"
  exit 1
fi

export PORT=3020

pm2 delete paymatubyte 2>/dev/null || true
bash "$ROOT/deploy/deploy.sh"
pm2 restart paymatubyte --update-env 2>/dev/null || true

sudo bash "$ROOT/deploy/fix-nginx-pay.sh"

echo ""
echo "Prueba retorno (HTML PayMatuByte, no 404 Next.js):"
curl -sS -m 10 "https://pay.matubyte.com/v1/pay/return/matu-ai" | head -c 200
echo ""
