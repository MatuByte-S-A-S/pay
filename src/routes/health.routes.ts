import type { FastifyInstance } from "fastify";
import { env, isDevelopment } from "../config/env.js";
import { appRegistry } from "../modules/apps/app.registry.js";
import { checkBoldConnection } from "../modules/bold/bold.health.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    const bold = await checkBoldConnection();
    return {
      ok: bold.ok,
      service: "PayMatuByte",
      company: "MatuByte S.A.S.",
      nodeEnv: env.NODE_ENV,
      boldSandbox: isDevelopment(),
      boldApiUrl: env.URL_API_BOLD,
      boldConnection: bold,
      appsLoaded: appRegistry.getAll().length,
    };
  });
}
