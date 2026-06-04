import { env } from "../../config/env.js";
import type { BoldWebhookNotification } from "../bold/bold-link.types.js";
import { getWebhookSecretForEnv, verifyBoldWebhookSignature } from "../bold/bold.signature.js";
import { appRegistry } from "../apps/app.registry.js";
import {
  findPaymentByReference,
  updatePaymentsByReference,
} from "../../repositories/payment.repository.js";
import {
  findWebhookEvent,
  markWebhookProcessed,
  upsertWebhookEvent,
} from "../../repositories/webhook.repository.js";
import { applyPaymentToBalance } from "../payments/balance.service.js";

const STATUS_MAP: Record<string, string> = {
  SALE_APPROVED: "APPROVED",
  SALE_REJECTED: "REJECTED",
  VOID_APPROVED: "VOIDED",
  VOID_REJECTED: "VOID_REJECTED",
};

export class WebhookService {
  verifySignature(rawBody: string, signature?: string): boolean {
    const secret = getWebhookSecretForEnv(env.BOLD_WEBHOOK_SECRET ?? "");
    if (!secret) {
      return true;
    }
    return verifyBoldWebhookSignature(rawBody, signature, secret);
  }

  async processBoldEvent(notification: BoldWebhookNotification): Promise<void> {
    const existing = await findWebhookEvent(notification.id);
    if (existing?.processed) return;

    await upsertWebhookEvent({
      id: notification.id,
      type: notification.type,
      paymentId: notification.data.payment_id,
      payload: JSON.stringify(notification),
    });

    const reference = notification.data.metadata?.reference;
    if (!reference) {
      await markWebhookProcessed(notification.id);
      return;
    }

    const status = STATUS_MAP[notification.type] ?? notification.type;
    const paymentBefore = await findPaymentByReference(reference);
    const previousStatus = paymentBefore?.status ?? "";

    await updatePaymentsByReference(reference, {
      status,
      boldEventType: notification.type,
      boldPaymentId: notification.data.payment_id,
    });

    const payment = await findPaymentByReference(reference);
    if (payment) {
      await applyPaymentToBalance(payment, status, previousStatus);
    }
    if (payment) {
      const app = appRegistry.getById(payment.app_id);
      if (app?.webhookUrl) {
        await this.forwardToApp(app.webhookUrl, notification, payment.app_id);
      }
    }

    await markWebhookProcessed(notification.id);
  }

  private async forwardToApp(
    url: string,
    notification: BoldWebhookNotification,
    appId: string,
  ): Promise<void> {
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PayMatuByte-App": appId,
          "X-PayMatuByte-Event": notification.type,
        },
        body: JSON.stringify(notification),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      console.error(`[webhook] Error reenviando a app ${appId}:`, err);
    }
  }
}

export const webhookService = new WebhookService();
