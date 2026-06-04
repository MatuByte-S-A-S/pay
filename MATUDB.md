# PayMatuByte + MatuDB

Base de datos: **MatuDB** (PostgreSQL) con [`@devjuanes/matuclient`](https://www.npmjs.com/package/@devjuanes/matuclient).

## Configuración

1. Proyecto en [db.matudb.com](https://db.matudb.com) (dedicado a PayMatuByte).
2. Ejecutar **`sql/schema.sql`** en el editor SQL del panel.
3. En `.env`:

```env
MATUDB_URL=https://db.matudb.com
MATUDB_PROJECT_ID=tu-project-id
MATUDB_SERVICE_KEY=mb_tu_service_key
```

Opcional desde CLI (mismo SQL):

```bash
npm run db:setup
```

## Tablas

| Tabla | Uso |
|-------|-----|
| `paymatu_payments` | Pagos / links Bold por app |
| `paymatu_webhook_events` | Idempotencia webhooks Bold |

---

## Referencia del cliente (MatuDB)

Documentación del paquete:
