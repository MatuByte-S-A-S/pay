#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3020}"
if [[ -f .env ]]; then
  p=$(grep -E '^PORT=' .env | tail -1 | cut -d= -f2 | tr -d '"' | tr -d ' ')
  [[ -n "$p" ]] && PORT="$p"
fi

echo "=== Puerto PayMatuByte esperado: $PORT ==="
echo ""
echo "=== 1. PM2 ==="
pm2 describe paymatubyte 2>/dev/null | grep -E 'status|restarts|script path' || echo "paymatubyte no en PM2"
echo ""
echo "=== 2. Quién usa :3000 y :$PORT ==="
ss -tlnp 2>/dev/null | grep -E ':3000|:3020' || netstat -tlnp 2>/dev/null | grep -E ':3000|:3020' || true
echo ""
echo "=== 3. API PayMatuByte (debe ser JSON) ==="
curl -sS -m 5 "http://127.0.0.1:${PORT}/health" | head -c 350 || echo "FALLO en :$PORT"
echo ""
echo ""
echo "=== 4. :3000 (suele ser Next.js matubyte — NO PayMatuByte) ==="
curl -sS -m 5 http://127.0.0.1:3000/health 2>/dev/null | head -c 120 || true
echo ""
echo ""
echo "=== 5. HTTPS público ==="
curl -sS -m 10 -o /tmp/pay-health.txt -w "HTTP %{http_code}\n" https://pay.matubyte.com/health || true
head -c 350 /tmp/pay-health.txt 2>/dev/null; echo

echo ""
echo "Si (3) falla: en .env pon PORT=3020, git pull, bash deploy/deploy.sh, sudo bash deploy/fix-nginx-pay.sh"
