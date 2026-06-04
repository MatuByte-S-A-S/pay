# Deploy PayMatuByte — pay.matubyte.com

Repositorio: [github.com/MatuByte-S-A-S/pay](https://github.com/MatuByte-S-A-S/pay)

## Arquitectura

```text
Usuario paga en Bold
  → Bold redirige a https://pay.matubyte.com/v1/pay/return/{appId}?reference=...
  → PayMatuByte consulta estado en Bold
  → Redirige al frontend de la app (ej. chat.matubyte.com/.../pago-resultado)
```

| URL | Uso |
|-----|-----|
| `https://pay.matubyte.com` | API central de pagos |
| `https://pay.matubyte.com/health` | Health check |
| `https://pay.matubyte.com/v1/payment` | Crear link (apps con Bearer apiKey) |
| `https://pay.matubyte.com/v1/pay/return/matu-ai` | Callback Bold → relay |

Proceso interno: **PM2** `paymatubyte` en puerto **3020** → **Nginx** proxy HTTPS.

> En este VPS el puerto **3000** ya lo usa la web Next.js `matubyte` (PM2). No cambies PayMatuByte a 3000.

---

## 1. DNS

Registro **A** en tu dominio:

```text
pay.matubyte.com  →  IP del VPS (misma que chat/ai)
```

---

## 2. Clonar en el servidor

```bash
cd ~/apps
git clone https://github.com/MatuByte-S-A-S/pay.git pay
cd pay
```

Quedará junto a `matu-ai` y `MatuByte-S.A.S.`:

```text
~/apps/
  pay/           ← este proyecto
  matu-ai/
  MatuByte-S.A.S./
```

---

## 3. Variables de entorno

```bash
cp .env.production.example .env
nano .env
```

Obligatorio:

- `NODE_ENV=production`
- `PAYMATUBYTE_PUBLIC_URL=https://pay.matubyte.com` (HTTPS, sin barra final)
- `AUTHORIZATION_BOLD` y `AUTHORIZATION_BOLD_DEV` con formato `x-api-key ...` (llaves Bold **Link de pagos**)
- `URL_API_EXCHANGERATE` si usas `convertUsdToCop` (Matu AI)
- **No** pongas `BOLD_DEV_NO_CALLBACK=true` en producción

Genera master key:

```bash
openssl rand -hex 24
```

---

## 4. API keys de cada app (`config/apps/`)

En el servidor edita por ejemplo `config/apps/matu-ai.yaml`:

```yaml
apiKey: pk_matu_ai_prod_CAMBIAR_POR_SECRETO_LARGO
```

Ese mismo valor va en **Matu AI** (`~/apps/matu-ai/.env`):

```env
PAYMATUBYTE_URL=https://pay.matubyte.com
PAYMATUBYTE_API_KEY=pk_matu_ai_prod_CAMBIAR_POR_SECRETO_LARGO
BILLING_MOCK_CHECKOUT=false
```

Reinicia Matu AI API después: `pm2 restart matu-ai-api`.

---

## 5. Nginx + SSL (primera vez)

```bash
cd ~/apps/pay
chmod +x deploy/*.sh
sudo bash deploy/setup-ssl.sh
sudo bash deploy/install-nginx.sh
```

Si ya tienes certificado, solo:

```bash
sudo bash deploy/install-nginx.sh
```

---

## 6. Build y PM2

```bash
bash deploy/deploy.sh
```

Verifica:

```bash
curl -s https://pay.matubyte.com/health
pm2 logs paymatubyte --lines 30
```

Debe mostrar: `[apps] 4 aplicación(es) cargada(s): ... matu-ai ...`

---

## 7. Actualizar después de un `git pull`

```bash
cd ~/apps/pay
git pull
bash deploy/deploy.sh
```

---

## 8. Bold (panel)

- Webhook (opcional): URL `https://pay.matubyte.com/v1/webhooks/bold` y `BOLD_WEBHOOK_SECRET` en `.env`
- Tras pagar, Bold usa `callback_url` = `https://pay.matubyte.com/v1/pay/return/...`

---

## Resolución de problemas

### HTML de matubyte.com o 404 en pay.matubyte.com

Causas típicas en este servidor:

1. **Puerto equivocado:** `matubyte` (Next.js) usa **:3000**. PayMatuByte debe usar **:3020** en `.env`, PM2 y nginx.
2. **Nginx** apunta a `:3000` → verás el sitio corporativo, no la API.

```bash
grep ^PORT= ~/apps/pay/.env   # debe ser 3020
curl -s http://127.0.0.1:3020/health   # JSON PayMatuByte
```

```bash
cd ~/apps/pay
git pull
chmod +x deploy/*.sh
# Arreglo automático (puerto 3020 + quitar pay de matubyte.com nginx + PM2)
sudo bash deploy/fix-pay-complete.sh
```

O paso a paso: `grep ^PORT= .env` → debe ser **3020**, luego `sudo bash deploy/fix-nginx-pay.sh`.

Debe verse JSON con `"service":"PayMatuByte"`. Luego `bash deploy/deploy.sh` y `pm2 restart paymatubyte`.

### `npm ci` falla en `@prisma/engines` (ECONNRESET / aborted)

La red del VPS a veces corta la descarga de Prisma. En el servidor:

```bash
cd ~/apps/pay
git pull
rm -rf node_modules
bash deploy/deploy.sh
```

El script reintenta solo y, si hace falta, usa `npm ci --ignore-scripts` y luego `npx prisma generate`.

Manual:

```bash
npm config set fetch-retries 5
npm ci --ignore-scripts
npx prisma generate
npm run build
npm run db:push
pm2 restart paymatubyte
```

| Síntoma | Qué revisar |
|---------|-------------|
| 401 UNAUTHORIZED | `apiKey` en YAML = `PAYMATUBYTE_API_KEY` en la app cliente |
| 403 Bold | `PAYMATUBYTE_PUBLIC_URL` debe ser **https** |
| App no en logs | Reiniciar PM2 tras añadir YAML en `config/apps/` |
| SSL | `sudo certbot certificates` y `deploy/setup-ssl.sh` |
