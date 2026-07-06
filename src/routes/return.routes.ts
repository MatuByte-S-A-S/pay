import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../shared/errors.js";
import { paymentLinkService } from "../modules/payments/payment-link.service.js";
import { buildAppReturnRedirect } from "../modules/payments/callback-url.js";

/**
 * Bold redirige aquí tras el pago → consultamos estado → redirigimos al frontend de la app.
 * GET /v1/pay/return/:appId?reference=...
 */
export async function returnRoutes(app: FastifyInstance) {
  app.get("/v1/pay/return/:appId", async (request, reply) => {
    const { appId } = request.params as { appId: string };
    const query = request.query as {
      reference?: string;
      "bold-tx-status"?: string;
      "bold-order-id"?: string;
    };
    const { reference } = query;

    if (!reference) {
      return reply.type("text/html").send(
        `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>PayMatuByte</title></head><body style="font-family:system-ui;max-width:32rem;margin:2rem auto;padding:0 1rem"><h1>PayMatuByte</h1><p>Endpoint de retorno Bold para <strong>${appId}</strong>.</p><p>Falta <code>?reference=...</code> en la URL (Bold lo añade tras el pago).</p><p><a href="/health">/health</a></p></body></html>`,
      );
    }

    try {
      const { returnUrl, payment } = await paymentLinkService.handlePaymentReturn(appId, reference, {
        "bold-tx-status": query["bold-tx-status"],
        "bold-order-id": query["bold-order-id"],
      });
      const target = buildAppReturnRedirect(returnUrl, {
        reference: payment.reference ?? reference,
        status: payment.status,
        transactionId: payment.transaction_id,
        linkId: payment.id,
      });
      return reply.redirect(target);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return reply.status(404).send({ error: err.message });
      }
      throw err;
    }
  });
}
