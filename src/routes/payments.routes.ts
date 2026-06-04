import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAppAuth, requireMasterKey } from "../shared/auth.js";
import { paymentLinkService } from "../modules/payments/payment-link.service.js";
import { boldLinkClient } from "../modules/bold/bold-link.client.js";
import { appRegistry } from "../modules/apps/app.registry.js";
import { resolveAppReturnUrl } from "../modules/apps/return-url.js";
import { listPaymentsByAppAndEnvironment } from "../repositories/payment.repository.js";
import { paymentRowToApi } from "../db/payment.types.js";
import { resolveWalletAppId } from "../modules/apps/wallet-app.js";

const createLinkSchema = z.object({
  productId: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.enum(["COP", "USD"]).optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  license: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

export async function paymentRoutes(app: FastifyInstance) {
  app.get("/v1/catalog", async (request) => {
    const matuApp = requireAppAuth(request);
    return {
      status: "success",
      appId: matuApp.id,
      name: matuApp.name,
      returnUrl: resolveAppReturnUrl(matuApp),
      catalog: matuApp.catalog,
    };
  });

  /** Igual que fymapp: GET /payment/payment_methods */
  app.get("/v1/payment/payment_methods", async (request) => {
    requireAppAuth(request);
    const data = await boldLinkClient.getPaymentMethods();
    return { status: "success", data };
  });

  /** Igual que fymapp: POST /payment */
  app.post("/v1/payment", async (request) => {
    const matuApp = requireAppAuth(request);
    const body = createLinkSchema.parse(request.body);
    return paymentLinkService.createLink({ app: matuApp, ...body });
  });

  /** Alias histórico */
  app.post("/v1/payment-link", async (request) => {
    const matuApp = requireAppAuth(request);
    const body = createLinkSchema.parse(request.body);
    return paymentLinkService.createLink({ app: matuApp, ...body });
  });

  app.post("/v1/checkout", async (request) => {
    const matuApp = requireAppAuth(request);
    const body = createLinkSchema.parse(request.body);
    return paymentLinkService.createLink({ app: matuApp, ...body });
  });

  /** Igual que fymapp: GET /payment/link/:link_id */
  app.get("/v1/payment/link/:link_id", async (request) => {
    const matuApp = requireAppAuth(request);
    const { link_id } = request.params as { link_id: string };
    return paymentLinkService.getLinkStatus(link_id, matuApp.id);
  });

  app.get("/v1/payments/:reference", async (request) => {
    const matuApp = requireAppAuth(request);
    const { reference } = request.params as { reference: string };
    return paymentLinkService.getLinkStatus(reference, matuApp.id);
  });

  app.get("/v1/payments", async (request) => {
    const matuApp = requireAppAuth(request);
    const q = request.query as { environment?: string; limit?: string };
    const environment =
      q.environment === "sandbox" || q.environment === "live" ? q.environment : undefined;
    const limit = Math.min(Number(q.limit) || 30, 100);
    const walletAppId = resolveWalletAppId(matuApp);
    const payments = await listPaymentsByAppAndEnvironment(
      walletAppId,
      environment,
      limit,
    );
    return {
      status: "success",
      appId: walletAppId,
      environment: environment ?? "all",
      data: payments.map(paymentRowToApi),
    };
  });

  app.get("/v1/apps", async (request) => {
    requireMasterKey(request);
    return {
      apps: appRegistry.getAll().map((a) => ({
        id: a.id,
        name: a.name,
        returnUrl: resolveAppReturnUrl(a),
        products: a.catalog.length,
      })),
    };
  });
}
