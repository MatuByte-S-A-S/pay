import { getDb } from "../db/matu.js";
import type { WebhookEventRow } from "../db/payment.types.js";
import { matuUpdate } from "../lib/matu-query.js";

export async function findWebhookEvent(id: string): Promise<WebhookEventRow | null> {
  const { data, error } = await getDb()
    .from("paymatu_webhook_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as WebhookEventRow | null) ?? null;
}

export async function upsertWebhookEvent(input: {
  id: string;
  type: string;
  paymentId?: string;
  payload: string;
}): Promise<void> {
  const existing = await findWebhookEvent(input.id);
  if (existing) {
    const { error } = await matuUpdate(getDb(), "paymatu_webhook_events", { id: input.id }, {
      type: input.type,
      payment_id: input.paymentId ?? existing.payment_id,
      payload: input.payload,
    });
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await getDb().from("paymatu_webhook_events").insert({
    id: input.id,
    type: input.type,
    payment_id: input.paymentId ?? null,
    payload: input.payload,
    processed: false,
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function markWebhookProcessed(id: string): Promise<void> {
  const { error } = await matuUpdate(getDb(), "paymatu_webhook_events", { id }, { processed: true });
  if (error) throw new Error(error.message);
}
