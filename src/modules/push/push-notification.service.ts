import type { PaymentRow } from "../../db/payment.types.js";
import type { PaymentEnvironment } from "../payments/payment-environment.js";
import { listPushDevicesByWalletApp } from "../../repositories/push-device.repository.js";
import { isFcmConfigured, sendFcmToToken } from "./fcm.client.js";

function formatCop(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function notifyPaymentReceived(
  payment: PaymentRow,
  environment: PaymentEnvironment,
): Promise<void> {
  if (!isFcmConfigured()) {
    return;
  }

  const devices = await listPushDevicesByWalletApp(payment.app_id);
  if (devices.length === 0) return;

  const envLabel = environment === "sandbox" ? " (prueba)" : "";
  const title = `Pago recibido${envLabel}`;
  const body = `${formatCop(payment.amount_total)} · ${payment.reference}`;
  const data: Record<string, string> = {
    type: "payment_received",
    reference: payment.reference,
    environment,
    amount: String(payment.amount_total),
    currency: payment.currency,
    appId: payment.app_id,
  };

  const results = await Promise.allSettled(
    devices.map((d) =>
      sendFcmToToken(d.fcm_token, { title, body, data }).catch((err) => {
        console.error(`[push] Error enviando a ${d.id}:`, err);
        throw err;
      }),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    console.warn(`[push] ${failed}/${devices.length} envíos fallaron para ${payment.app_id}`);
  } else {
    console.info(`[push] Notificación enviada (${devices.length}) · ${payment.reference}`);
  }
}
