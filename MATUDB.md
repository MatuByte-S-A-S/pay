# PayMatuByte + MatuDB

Base de datos: **MatuDB** (PostgreSQL) con [`@devjuanes/matuclient`](https://www.npmjs.com/package/@devjuanes/matuclient).

## Configuración

1. Proyecto en [db.matudb.com](https://db.matudb.com) (dedicado a PayMatuByte).
2. Ejecutar **`sql/schema.sql`** en el editor SQL del panel.
3. En `.env`:

```env
MATUDB_URL=https://db.matudb.com
MATUDB_PROJECT_ID=tu-project-id
MATUDB_API_KEY=mb_tu_api_key
```

Igual que en la doc del cliente (`MATUDB_API_KEY` / `apiKey` en `createClient`).

Opcional desde CLI (mismo SQL):

```bash
npm run db:setup
```

## Tablas

| Tabla | Uso |
|-------|-----|
| `paymatu_payments` | Pagos / links Bold por app (`environment`: `live` \| `sandbox`) |
| `paymatu_app_balances` | Saldo acumulado por app y entorno (independiente live vs prueba) |
| `paymatu_webhook_events` | Idempotencia webhooks Bold |

Si ya creaste las tablas antes, ejecuta también `sql/002_sandbox_environment.sql` y `sql/003_push_devices.sql` en el panel SQL.

---

## Referencia del cliente (MatuDB)

Documentación del paquete:
