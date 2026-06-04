import type { FastifyInstance } from "fastify";
import type { BoldWebhookNotification } from "../modules/bold/bold-link.types.js";
import { webhookService } from "../modules/webhooks/webhook.service.js";
import { AppError } from "../shared/errors.js";

export async function webhookRoutes(app: FastifyInstance) {
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    done(null, body);
  });

  app.post("/webhooks/bold", async (request, reply) => {
    const rawBody = request.body as string;
    const signature = request.headers["x-bold-signature"] as string | undefined;

    if (!webhookService.verifySignature(rawBody, signature)) {
      throw new AppError("Firma de webhook inválida", 400, "INVALID_SIGNATURE");
    }

    const notification = JSON.parse(rawBody) as BoldWebhookNotification;

    reply.code(200).send({ received: true });

    setImmediate(() => {
      webhookService.processBoldEvent(notification).catch((err) => {
        console.error("[webhook] Error procesando evento:", err);
      });
    });
  });
}
