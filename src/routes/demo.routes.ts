import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { env } from "../config/env.js";
import { appRegistry } from "../modules/apps/app.registry.js";
import { checkBoldConnection } from "../modules/bold/bold.health.js";
import { isDevelopment } from "../config/env.js";
import { resolveAppReturnUrl } from "../modules/apps/return-url.js";
import { NotFoundError } from "../shared/errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_PUBLIC_DIR = path.resolve(__dirname, "../../public/demo");

export async function demoRoutes(app: FastifyInstance) {
  if (!env.DEMO_PAGE_ENABLED) return;

  await app.register(fastifyStatic, {
    root: DEMO_PUBLIC_DIR,
    prefix: "/demo/",
    decorateReply: false,
  });

  app.get("/api/demo/bold-status", async () => checkBoldConnection());

  app.get("/api/demo/session", async () => {
    const matuApp = appRegistry.getById(env.DEMO_APP_ID);
    if (!matuApp) {
      throw new NotFoundError(`App demo '${env.DEMO_APP_ID}' no encontrada`);
    }

    return {
      appId: matuApp.id,
      appName: matuApp.name,
      apiKey: matuApp.apiKey,
      boldSandbox: isDevelopment(),
      returnUrl: resolveAppReturnUrl(matuApp),
    };
  });

  app.get("/demo/pago-resultado", async (_request, reply) => {
    const html = await readFile(path.join(DEMO_PUBLIC_DIR, "pago-resultado.html"), "utf-8");
    return reply.type("text/html; charset=utf-8").send(html);
  });

  app.get("/favicon.ico", async (_request, reply) => {
    return reply.code(204).send();
  });

  const sendDemoPage = async (_request: unknown, reply: import("fastify").FastifyReply) => {
    const html = await readFile(path.join(DEMO_PUBLIC_DIR, "index.html"), "utf-8");
    return reply.type("text/html; charset=utf-8").send(html);
  };

  app.get("/demo", sendDemoPage);
}
