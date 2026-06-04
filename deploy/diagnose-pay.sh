#!/usr/bin/env bash
# Diagnóstico: ¿pay.matubyte.com llega a PM2 :3000?
set -euo pipefail

echo "=== 1. PM2 paymatubyte ==="
pm2 describe paymatubyte 2>/dev/null | grep -E 'status|script path|exec cwd' || echo "PM2: paymatubyte no existe"

echo ""
echo "=== 2. API local (debe responder JSON) ==="
curl -sS -m 5 http://127.0.0.1:3000/health | head -c 400 || echo "FALLO: nada en :3000"

echo ""
echo ""
echo "=== 3. HTTPS público (debe ser el mismo JSON, no HTML 404) ==="
curl -sS -m 10 -o /tmp/pay-health.txt -w "HTTP %{http_code}\n" https://pay.matubyte.com/health || true
head -c 400 /tmp/pay-health.txt 2>/dev/null; echo

echo ""
echo "=== 4. Nginx: quién atiende pay.matubyte.com ==="
sudo nginx -T 2>/dev/null | grep -A2 'server_name pay.matubyte.com' || echo "No hay server_name pay.matubyte.com en nginx -T"

echo ""
echo "=== 5. sites-enabled ==="
ls -la /etc/nginx/sites-enabled/ 2>/dev/null | grep -i pay || true

echo ""
echo "Si (2) OK pero (3) es HTML 404 → ejecuta: sudo bash deploy/fix-nginx-pay.sh"
