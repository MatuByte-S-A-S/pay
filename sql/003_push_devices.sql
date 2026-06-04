CREATE TABLE IF NOT EXISTS paymatu_push_devices (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  wallet_app_id TEXT NOT NULL,
  fcm_token TEXT NOT NULL UNIQUE,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS paymatu_push_devices_wallet_idx ON paymatu_push_devices (wallet_app_id);
