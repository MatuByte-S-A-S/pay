#!/usr/bin/env bash
# pay.matubyte.com debe ir a PayMatuByte :3020, NO al Next.js :3000 (matubyte)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PAY_PORT="${PORT:-3020}"
if [[ -f .env ]]; then
  p=$(grep -E '^PORT=' .env | tail -1 | cut -d= -f2 | tr -d '"' | tr -d ' ')
  [[ -n "$p" ]] && PAY_PORT="$p"
fi

echo "→ Puerto PayMatuByte: $PAY_PORT"

echo "→ Quitar pay.matubyte.com de otros sitios nginx (p. ej. matubyte.com)"
for f in /etc/nginx/sites-enabled/* /etc/nginx/sites-available/*; do
  [[ -f "$f" ]] || continue
  base=$(basename "$f")
  [[ "$base" == "pay.matubyte.com" ]] && continue
  if sudo grep -qE 'pay\.matubyte\.com' "$f" 2>/dev/null; then
    echo "  Corrigiendo: $f"
    sudo cp "$f" "${f}.bak-before-pay-$(date +%s)"
    sudo sed -i \
      -e 's/ pay\.matubyte\.com//g' \
      -e 's/pay\.matubyte\.com //g' \
      -e 's/pay\.matubyte\.com//g' \
      "$f"
  fi
done

echo "→ Instalar pay.matubyte.com → 127.0.0.1:${PAY_PORT}"
if [[ -f /etc/letsencrypt/live/pay.matubyte.com/fullchain.pem ]]; then
  sudo cp "$ROOT/deploy/nginx/pay.matubyte.com.conf" /etc/nginx/sites-available/pay.matubyte.com
else
  sudo cp "$ROOT/deploy/nginx/pay.matubyte.com.http.conf" /etc/nginx/sites-available/pay.matubyte.com
fi

# Asegurar puerto correcto en upstream (por si el archivo viejo tenía 3000)
sudo sed -i "s|127.0.0.1:3000|127.0.0.1:${PAY_PORT}|g" /etc/nginx/sites-available/pay.matubyte.com

sudo ln -sf /etc/nginx/sites-available/pay.matubyte.com /etc/nginx/sites-enabled/pay.matubyte.com

echo "→ upstream en nginx:"
sudo grep -A1 'upstream paymatubyte' /etc/nginx/sites-available/pay.matubyte.com || true

sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "→ Prueba local API (:${PAY_PORT})"
if curl -sS -m 5 "http://127.0.0.1:${PAY_PORT}/health" | head -c 80 | grep -q PayMatuByte; then
  echo "  OK API en :${PAY_PORT}"
else
  echo "  FALLO: PayMatuByte no responde en :${PAY_PORT}"
  echo "  Ejecuta: grep ^PORT= .env  (debe ser 3020)"
  echo "  pm2 restart paymatubyte --update-env"
  exit 1
fi

echo "→ Prueba HTTPS"
BODY=$(curl -sS -m 10 https://pay.matubyte.com/health || true)
if echo "$BODY" | head -c 80 | grep -q PayMatuByte; then
  echo "  OK https://pay.matubyte.com/health"
else
  echo "  FALLO: sigue sin ser PayMatuByte. Primeros bytes:"
  echo "$BODY" | head -c 200
  exit 1
fi

echo "✓ Nginx + PayMatuByte OK"
