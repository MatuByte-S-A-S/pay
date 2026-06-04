# PayMatuByte

API central de pagos **Bold** para todos los productos de **MatuByte S.A.S.**  
Misma integración que **fymapp-api** (API Link de pagos), configurable por app en YAML.

**Producción:** `https://pay.matubyte.com` · Repo: [github.com/MatuByte-S-A-S/pay](https://github.com/MatuByte-S-A-S/pay) · Deploy: [`deploy/DEPLOY.md`](deploy/DEPLOY.md)

**No se modifica fymapp-api** — solo se replica su lógica de pagos aquí.

## Cómo funciona (igual que fymapp)

| fymapp-api | PayMatuByte |
|------------|-------------|
| `URL_API_BOLD` | `URL_API_BOLD` |
| `AUTHORIZATION_BOLD` / `_DEV` | Igual según `NODE_ENV` |
| `POST /payment` | `POST /v1/payment` |
| `GET /payment/link/:id` | `GET /v1/payment/link/:id` |
| `callback_url` por producto | `callbackUrl` en `config/apps/*.yaml` |
| USD → COP si país USA | `convertUsdToCop` en YAML |

## Variables `.env` (copiar de fymapp)

```env
MATUDB_URL=https://db.matudb.com
MATUDB_PROJECT_ID=tu-proyecto
MATUDB_API_KEY=mb_...
NODE_ENV=development
URL_API_BOLD=https://integrations.api.bold.co/online/link/v1
AUTHORIZATION_BOLD="x-api-key <llave producción>"
AUTHORIZATION_BOLD_DEV="x-api-key <llave pruebas>"
URL_API_EXCHANGERATE=https://v6.exchangerate-api.com/v6/.../latest/USD
```

Importante: el header va **completo** con `x-api-key `, como en fymapp.

## ¿`.env` o YAML para `callbackUrl`?

| Dónde | Qué va |
|-------|--------|
| **`.env`** | Credenciales Bold + `PAYMATUBYTE_PUBLIC_URL` (este backend) |
| **`config/apps/<proyecto>.yaml`** | Por SaaS: `returnUrls`, precios, `apiKey` |

### Flujo de redirección (escalable)

```text
Usuario paga en Bold
    → Bold redirige a PayMatuByte: /v1/pay/return/carmoby?reference=...
    → PayMatuByte consulta estado en Bold
    → Redirige al frontend de Carmoby con ?status=PAID&paid=true&reference=...
```

Así cada app define **su** URL (`returnUrls.development` / `production`), no el dominio genérico de la empresa.

Opcional en cada cobro: `returnUrl` en el body del POST para override puntual.

## Nueva app SaaS

Hay dos ejemplos en `config/apps/`:

| Archivo | App | `callbackUrl` |
|---------|-----|----------------|
| `paymatubyte.yaml` | PayMatuByte | dev: `localhost:3000/demo/pago-resultado` |
| `carmoby.yaml` | Carmoby | dev: `localhost:5173/carmoby/pago/resultado` |
| `inventario-pro.yaml` | Inventario Pro | dev: `localhost:5174/pago/resultado` |
| `matu-ai.yaml` | Matu AI (recargas) | dev: `localhost:5173/dashboard/billing/pago-resultado` |

Copia uno y cambia `id`, `apiKey`, `callbackUrl` y `catalog`:

```yaml
id: mi-nuevo-saas
name: Mi producto
apiKey: pk_secreto_unico
returnUrls:
  development: http://localhost:5173/mi-saas/pago/resultado
  production: https://mi-saas.com/pago/resultado
catalog:
  - id: plan-pro
    amount: 99000
    currency: COP
```

## API para tus proyectos

`Authorization: Bearer <apiKey del yaml>`

```http
POST /v1/payment
{ "productId": "plan-pro", "license": "tenant-123" }
```

Respuesta (como fymapp):

```json
{
  "status": "success",
  "data": {
    "url": "https://checkout.bold.co/LNK_...",
    "link_id": "LNK_...",
    "reference": "tenant-123_..."
  }
}
```

```http
GET /v1/payment/link/LNK_xxx
GET /v1/payment/payment_methods
GET /v1/catalog
GET /health
```

## Demo

```bash
npm install
# Ejecuta sql/schema.sql en MatuDB (o npm run db:setup)
npm run dev
```

http://localhost:3000/

## Documentación Bold

- [API Link de pagos](https://developers.bold.co/pagos-en-linea/api-link-de-pagos)
