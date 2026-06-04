-- PayMatuByte — esquema MatuDB (PostgreSQL)
-- Ejecutar en el panel SQL de MatuDB o: npm run db:setup

CREATE TABLE IF NOT EXISTS paymatu_payments (
  id UUID PRIMARY KEY,
  app_id TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  bold_transaction_id TEXT,
  payment_link_id TEXT,
  checkout_url TEXT,
  product_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  amount_total INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  payment_method TEXT NOT NULL,
  description TEXT,
  metadata TEXT,
  bold_event_type TEXT,
  bold_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS paymatu_payments_app_id_idx ON paymatu_payments (app_id);
CREATE INDEX IF NOT EXISTS paymatu_payments_status_idx ON paymatu_payments (status);
CREATE INDEX IF NOT EXISTS paymatu_payments_payment_link_id_idx ON paymatu_payments (payment_link_id);

CREATE TABLE IF NOT EXISTS paymatu_webhook_events (
  id TEXT PRIMARY KEY,
  payment_id TEXT,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS paymatu_webhook_events_payment_id_idx ON paymatu_webhook_events (payment_id);
