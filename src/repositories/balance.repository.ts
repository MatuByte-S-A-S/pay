import { getDb } from "../db/matu.js";
import { matuUpdate } from "../lib/matu-query.js";
import type { PaymentEnvironment } from "../modules/payments/payment-environment.js";

/** MatuDB devuelve BIGINT como string; sin esto JS concatena ("30000" + 30000 → "3000030000"). */
function toCopAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export interface AppBalanceRow {
  app_id: string;
  environment: PaymentEnvironment;
  balance_cop: number;
  currency: string;
  updated_at: string;
}

export async function getAppBalance(
  appId: string,
  environment: PaymentEnvironment,
): Promise<AppBalanceRow> {
  const { data, error } = await getDb()
    .from("paymatu_app_balances")
    .select("*")
    .eq("app_id", appId)
    .eq("environment", environment)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (data) {
    const row = data as AppBalanceRow;
    return { ...row, balance_cop: toCopAmount(row.balance_cop) };
  }

  return {
    app_id: appId,
    environment,
    balance_cop: 0,
    currency: "COP",
    updated_at: new Date().toISOString(),
  };
}

export async function creditAppBalance(
  appId: string,
  environment: PaymentEnvironment,
  amountCop: number,
): Promise<AppBalanceRow> {
  const creditAmount = toCopAmount(amountCop);
  if (creditAmount <= 0) return getAppBalance(appId, environment);

  const now = new Date().toISOString();
  const current = await getAppBalance(appId, environment);

  const { data: existing } = await getDb()
    .from("paymatu_app_balances")
    .select("app_id")
    .eq("app_id", appId)
    .eq("environment", environment)
    .maybeSingle();

  if (!existing) {
    const { error } = await getDb().from("paymatu_app_balances").insert({
      app_id: appId,
      environment,
      balance_cop: creditAmount,
      currency: "COP",
      updated_at: now,
    });
    if (error) throw new Error(error.message);
    return getAppBalance(appId, environment);
  }

  const { error } = await matuUpdate(
    getDb(),
    "paymatu_app_balances",
    { app_id: appId, environment },
    {
      balance_cop: current.balance_cop + creditAmount,
      updated_at: now,
    },
  );
  if (error) throw new Error(error.message);

  return getAppBalance(appId, environment);
}
