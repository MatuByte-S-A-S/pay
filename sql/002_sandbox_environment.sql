-- Migración: entorno live/sandbox + saldos por app (ejecutar si ya tienes paymatu_payments)

ALTER TABLE paymatu_payments
  ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'live';

ALTER TABLE paymatu_payments
  ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS paymatu_payments_env_idx ON paymatu_payments (app_id, environment);

CREATE TABLE IF NOT EXISTS paymatu_app_balances (
  app_id TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('live', 'sandbox')),
  balance_cop BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'COP',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (app_id, environment)
);
