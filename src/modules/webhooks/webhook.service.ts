import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import type { BoldWebhookNotification } from "../bold/bold-link.types.js";
import { getWebhookSecretForEnv, verifyBoldWebhookSignature } from "../bold/bold.signature.js";
import { appRegistry } from "../apps/app.registry.js";

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
    const existing = await prisma.webhookEvent.findUnique({ where: { id: notification.id } });
    if (existing?.processed) return;

    await prisma.webhookEvent.upsert({
      where: { id: notification.id },
      create: {
        id: notification.id,
        type: notification.type,
        paymentId: notification.data.payment_id,
        payload: JSON.stringify(notification),
      },
      update: {
        type: notification.type,
        payload: JSON.stringify(notification),
      },
    });

    const reference = notification.data.metadata?.reference;
    if (!reference) {
      await this.markProcessed(notification.id);
      return;
    }

    const status = STATUS_MAP[notification.type] ?? notification.type;

    await prisma.payment.updateMany({
      where: { reference },
      data: {
        status,
        boldEventType: notification.type,
        boldPaymentId: notification.data.payment_id,
        updatedAt: new Date(),
      },
    });

    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (payment) {
      const app = appRegistry.getById(payment.appId);
      if (app?.webhookUrl) {
        await this.forwardToApp(app.webhookUrl, notification, payment.appId);
      }
    }

    await this.markProcessed(notification.id);
  }

  private async markProcessed(eventId: string) {
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { processed: true },
    });
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
