import { getDb } from "../db/matu.js";
import { matuUpdate } from "../lib/matu-query.js";
import type { PaymentEnvironment } from "../modules/payments/payment-environment.js";

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

  if (data) return data as AppBalanceRow;

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
  if (amountCop <= 0) return getAppBalance(appId, environment);

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
      balance_cop: amountCop,
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
      balance_cop: current.balance_cop + amountCop,
      updated_at: now,
    },
  );
  if (error) throw new Error(error.message);

  return getAppBalance(appId, environment);
}
