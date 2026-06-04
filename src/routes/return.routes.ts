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
    const { reference } = request.query as { reference?: string };

    if (!reference) {
      return reply.status(400).send({ error: "reference requerido" });
    }

    try {
      const { returnUrl, payment } = await paymentLinkService.handlePaymentReturn(appId, reference);
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
