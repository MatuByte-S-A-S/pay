#!/usr/bin/env bash
# Corrige proxy nginx → PayMatuByte :3000 (evita 404 de otro sitio en el VPS)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Instalar site pay.matubyte.com"
sudo bash "$ROOT/deploy/install-nginx.sh"

echo "→ Quitar pay.matubyte.com de otros server_name (matubyte.com, etc.)"
for f in /etc/nginx/sites-enabled/*; do
  [[ -f "$f" ]] || continue
  [[ "$(basename "$f")" == "pay.matubyte.com" ]] && continue
  if sudo grep -q 'pay\.matubyte\.com' "$f" 2>/dev/null; then
    echo "  AVISO: $f también menciona pay.matubyte.com — edítalo y deja solo el bloque de ~/apps/pay"
    sudo grep -n 'pay\.matubyte\.com' "$f" || true
  fi
done

sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "→ Prueba"
curl -sS -m 10 https://pay.matubyte.com/health | head -c 300
echo ""
echo "✓ Si ves JSON con PayMatuByte, nginx OK"
