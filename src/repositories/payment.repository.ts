import { randomUUID } from "node:crypto";
import { getDb } from "../db/matu.js";
import type { PaymentRow } from "../db/payment.types.js";
import { matuUpdate } from "../lib/matu-query.js";

export interface UpsertPaymentInput {
  appId: string;
  reference: string;
  productId?: string | null;
  paymentLinkId: string;
  checkoutUrl: string;
  status: string;
  amountTotal: number;
  currency: string;
  paymentMethod: string;
  description?: string | null;
}

export async function findPaymentByReference(reference: string): Promise<PaymentRow | null> {
  const db = getDb();
  const { data, error } = await db
    .from("paymatu_payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as PaymentRow | null) ?? null;
}

export async function findPaymentByLinkOrReference(linkOrRef: string): Promise<PaymentRow | null> {
  const byRef = await findPaymentByReference(linkOrRef);
  if (byRef) return byRef;

  const db = getDb();
  const { data, error } = await db
    .from("paymatu_payments")
    .select("*")
    .eq("payment_link_id", linkOrRef)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as PaymentRow | null) ?? null;
}

export async function upsertPaymentByReference(input: UpsertPaymentInput): Promise<PaymentRow> {
  const now = new Date().toISOString();
  const existing = await findPaymentByReference(input.reference);

  if (existing) {
    const { error } = await matuUpdate(
      getDb(),
      "paymatu_payments",
      { id: existing.id },
      {
        payment_link_id: input.paymentLinkId,
        checkout_url: input.checkoutUrl,
        status: input.status,
        amount_total: input.amountTotal,
        currency: input.currency,
        product_id: input.productId ?? existing.product_id,
        description: input.description ?? existing.description,
        updated_at: now,
      },
    );
    if (error) throw new Error(error.message);
    const updated = await findPaymentByReference(input.reference);
    if (!updated) throw new Error("No se pudo actualizar el pago");
    return updated;
  }

  const row: PaymentRow = {
    id: randomUUID(),
    app_id: input.appId,
    reference: input.reference,
    bold_transaction_id: null,
    payment_link_id: input.paymentLinkId,
    checkout_url: input.checkoutUrl,
    product_id: input.productId ?? null,
    status: input.status,
    amount_total: input.amountTotal,
    currency: input.currency,
    payment_method: input.paymentMethod,
    description: input.description ?? null,
    metadata: null,
    bold_event_type: null,
    bold_payment_id: null,
    created_at: now,
    updated_at: now,
  };

  const { error } = await getDb().from("paymatu_payments").insert(row);
  if (error) throw new Error(error.message);
  return row;
}

export async function updatePaymentStatus(
  id: string,
  data: {
    status: string;
    boldTransactionId?: string | null;
    boldEventType?: string | null;
    boldPaymentId?: string | null;
  },
): Promise<void> {
  const { error } = await matuUpdate(getDb(), "paymatu_payments", { id }, {
    status: data.status,
    bold_transaction_id: data.boldTransactionId,
    bold_event_type: data.boldEventType,
    bold_payment_id: data.boldPaymentId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function updatePaymentsByReference(
  reference: string,
  data: {
    status: string;
    boldEventType?: string;
    boldPaymentId?: string;
  },
): Promise<void> {
  const payment = await findPaymentByReference(reference);
  if (!payment) return;

  const { error } = await matuUpdate(getDb(), "paymatu_payments", { reference }, {
    status: data.status,
    bold_event_type: data.boldEventType ?? payment.bold_event_type,
    bold_payment_id: data.boldPaymentId ?? payment.bold_payment_id,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function listPaymentsByApp(appId: string, limit = 30): Promise<PaymentRow[]> {
  const { data, error } = await getDb()
    .from("paymatu_payments")
    .select("*")
    .eq("app_id", appId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentRow[];
}
