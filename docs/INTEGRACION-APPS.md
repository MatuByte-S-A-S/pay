# Integrar tu app con PayMatuByte (resumen)

Documento corto para cualquier SaaS de MatuByte. **Ejemplo completo:** Matu AI → `AI/docs/PASARELA-PAGOS.md`.

## 1. Registrar la app

Copia `config/apps/matu-ai.yaml` y cambia `id`, `apiKey`, `returnUrls`.

- **development**: URL de tu frontend local donde mostrarás el resultado (`?reference=...&paid=...`).
- **production**: la misma ruta en tu dominio real.

`convertUsdToCop: true` si cobras en USD pero Bold debe recibir COP.

## 2. En tu backend (no en el frontend)

Guarda solo:

```env
PAYMATUBYTE_URL=http://localhost:3000
PAYMATUBYTE_API_KEY=<mismo apiKey del yaml>
```

Nunca expongas las llaves Bold en tu app.

## 3. Flujo mínimo de código

1. Creas un pedido/recarga **pendiente** en tu base de datos con una `reference` única.
2. `POST {PAYMATUBYTE_URL}/v1/payment` con header `Authorization: Bearer {apiKey}`:

```json
{
  "amount": 50000,
  "currency": "COP",
  "reference": "MATU-ABC123",
  "description": "Recarga plan"
}
```

3. Respuesta: `data.url` → rediriges al usuario ahí (checkout Bold).
4. Bold vuelve a PayMatuByte → PayMatuByte redirige a tu `returnUrls` con query params.
5. Tu pantalla de resultado llama a tu API; tu API opcionalmente `GET /v1/payment/link/{reference}` y si `status === "PAID"` marcas el pedido como pagado.

## 4. Query params al volver del pago

| Param | Significado |
|-------|-------------|
| `reference` | Tu referencia de pedido |
| `status` | Estado Bold (ej. `PAID`) |
| `paid` | `true` / `false` |
| `transaction_id` | ID transacción Bold (si aplica) |
| `link_id` | ID del link de pago |

## 5. Probar en local

1. `npm run dev` en PayMatuByte (`PAYMATUBYTE_PUBLIC_URL=http://localhost:3000`).
2. Tu API + frontend con `returnUrls.development` apuntando al puerto de Vite.
3. Llaves Bold en `.env` de PayMatuByte (`AUTHORIZATION_BOLD_DEV` con prefijo `x-api-key `).

## 6. Modo prueba (sandbox) y MatuPay

- En `NODE_ENV=development`, los pagos nuevos se guardan con `environment: sandbox`.
- En producción, los pagos son `live`; Bold puede marcar `is_sandbox` al consultar el link.
- Saldo acumulado al pasar a `PAID` / `APPROVED` en tabla `paymatu_app_balances` (live y sandbox **independientes**).
- **MatuPay** (`config/apps/matupay.yaml`, `walletAppId: matu-ai`):
  - `GET /v1/wallet?environment=sandbox|live`
  - `GET /v1/payments?environment=sandbox`
- Ejecuta `sql/002_sandbox_environment.sql` en MatuDB si el proyecto ya existía antes de este cambio.

## 7. Push MatuPay (FCM)

Cuando un pago pasa a **PAID**, PayMatuByte envía notificación a dispositivos registrados:

- `POST /v1/devices/push-token` — `{ "token": "<fcm>", "platform": "android" }` (Bearer apiKey de `matupay`)
- Tabla `paymatu_push_devices`, migración `sql/003_push_devices.sql`
- `.env`: `FIREBASE_SERVICE_ACCOUNT_PATH` o `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`

Ver `C:\dev\matupay\README-PAYMATU.md` para configurar Firebase en la app.
