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

Proceso interno: **PM2** `paymatubyte` en puerto **3000** → **Nginx** proxy HTTPS.

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

| Síntoma | Qué revisar |
|---------|-------------|
| 401 UNAUTHORIZED | `apiKey` en YAML = `PAYMATUBYTE_API_KEY` en la app cliente |
| 403 Bold | `PAYMATUBYTE_PUBLIC_URL` debe ser **https** |
| App no en logs | Reiniciar PM2 tras añadir YAML en `config/apps/` |
| SSL | `sudo certbot certificates` y `deploy/setup-ssl.sh` |
