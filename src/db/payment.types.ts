export interface PaymentRow {
  id: string;
  app_id: string;
  reference: string;
  bold_transaction_id: string | null;
  payment_link_id: string | null;
  checkout_url: string | null;
  product_id: string | null;
  status: string;
  amount_total: number;
  currency: string;
  payment_method: string;
  description: string | null;
  metadata: string | null;
  bold_event_type: string | null;
  bold_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEventRow {
  id: string;
  payment_id: string | null;
  type: string;
  payload: string;
  processed: boolean;
  created_at: string;
}

/** Formato API (compatible con respuestas anteriores de Prisma) */
export function paymentRowToApi(row: PaymentRow) {
  return {
    id: row.id,
    appId: row.app_id,
    reference: row.reference,
    boldTransactionId: row.bold_transaction_id,
    paymentLinkId: row.payment_link_id,
    checkoutUrl: row.checkout_url,
    productId: row.product_id,
    status: row.status,
    amountTotal: row.amount_total,
    currency: row.currency,
    paymentMethod: row.payment_method,
    description: row.description,
    metadata: row.metadata,
    boldEventType: row.bold_event_type,
    boldPaymentId: row.bold_payment_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
