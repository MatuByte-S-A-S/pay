import { randomUUID } from "node:crypto";
import { getDb } from "../db/matu.js";
import { matuUpdate } from "../lib/matu-query.js";

export interface PushDeviceRow {
  id: string;
  app_id: string;
  wallet_app_id: string;
  fcm_token: string;
  platform: string | null;
  created_at: string;
  updated_at: string;
}

export async function upsertPushDevice(input: {
  appId: string;
  walletAppId: string;
  fcmToken: string;
  platform?: string;
}): Promise<PushDeviceRow> {
  const now = new Date().toISOString();
  const db = getDb();

  const { data: existing, error: findErr } = await db
    .from("paymatu_push_devices")
    .select("*")
    .eq("fcm_token", input.fcmToken)
    .maybeSingle();

  if (findErr) throw new Error(findErr.message);

  if (existing) {
    const { error } = await matuUpdate(db, "paymatu_push_devices", { fcm_token: input.fcmToken }, {
      app_id: input.appId,
      wallet_app_id: input.walletAppId,
      platform: input.platform ?? existing.platform,
      updated_at: now,
    });
    if (error) throw new Error(error.message);
    const { data: updated } = await db
      .from("paymatu_push_devices")
      .select("*")
      .eq("fcm_token", input.fcmToken)
      .single();
    return updated as PushDeviceRow;
  }

  const row: PushDeviceRow = {
    id: randomUUID(),
    app_id: input.appId,
    wallet_app_id: input.walletAppId,
    fcm_token: input.fcmToken,
    platform: input.platform ?? null,
    created_at: now,
    updated_at: now,
  };

  const { error } = await db.from("paymatu_push_devices").insert(row);
  if (error) throw new Error(error.message);
  return row;
}

export async function deletePushDeviceByToken(fcmToken: string): Promise<void> {
  const { error } = await getDb().from("paymatu_push_devices").delete().eq("fcm_token", fcmToken);
  if (error) throw new Error(error.message);
}

export async function listPushDevicesByWalletApp(walletAppId: string): Promise<PushDeviceRow[]> {
  const { data, error } = await getDb()
    .from("paymatu_push_devices")
    .select("*")
    .eq("wallet_app_id", walletAppId);

  if (error) throw new Error(error.message);
  return (data ?? []) as PushDeviceRow[];
}
