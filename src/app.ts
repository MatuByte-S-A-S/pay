import Fastify from "fastify";
import cors from "@fastify/cors";
import { AppError } from "./shared/errors.js";
import { healthRoutes } from "./routes/health.routes.js";
import { paymentRoutes } from "./routes/payments.routes.js";
import { webhookRoutes } from "./routes/webhooks.routes.js";
import { demoRoutes } from "./routes/demo.routes.js";
import { returnRoutes } from "./routes/return.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code ?? "APP_ERROR",
        message: error.message,
      });
    }

    if (error && typeof error === "object" && "issues" in error) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Datos de entrada inválidos",
        details: error,
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: "INTERNAL_ERROR",
      message: "Error interno del servidor",
    });
  });

  app.get("/", async () => ({
    service: "PayMatuByte",
    company: "MatuByte S.A.S.",
    health: "/health",
    paymentReturn: "/v1/pay/return/:appId?reference=...",
  }));

  await app.register(healthRoutes);
  await app.register(returnRoutes);
  await app.register(paymentRoutes);
  await app.register(webhookRoutes);
  await app.register(demoRoutes);

  return app;
}
