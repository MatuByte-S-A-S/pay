import type { PaymentRow } from "../../db/payment.types.js";
import { creditAppBalance } from "../../repositories/balance.repository.js";
import { notifyPaymentReceived } from "../push/push-notification.service.js";
import { isPaidStatus, type PaymentEnvironment } from "./payment-environment.js";

export async function applyPaymentToBalance(
  payment: PaymentRow,
  newStatus: string,
  previousStatus: string,
  environmentOverride?: PaymentEnvironment,
): Promise<void> {
  if (!isPaidStatus(newStatus) || isPaidStatus(previousStatus)) return;

  const environment = environmentOverride ?? (payment.environment as PaymentEnvironment) ?? "live";
  await creditAppBalance(payment.app_id, environment, payment.amount_total);

  notifyPaymentReceived(payment, environment).catch((err) => {
    console.error("[push] notifyPaymentReceived:", err);
  });
}
