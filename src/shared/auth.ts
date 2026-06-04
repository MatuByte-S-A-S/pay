import type { FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { UnauthorizedError } from "./errors.js";
import type { MatuByteApp } from "../modules/apps/app.types.js";
import { appRegistry } from "../modules/apps/app.registry.js";

export function extractApiKey(request: FastifyRequest): string | undefined {
  const header = request.headers.authorization;
  if (!header) return undefined;
  const [scheme, key] = header.split(" ");
  if (scheme?.toLowerCase() === "bearer" && key) return key;
  if (scheme?.toLowerCase() === "apikey" && key) return key;
  return header.startsWith("pk_") ? header : undefined;
}

export function resolveAppFromRequest(request: FastifyRequest): MatuByteApp | null {
  const apiKey = extractApiKey(request);
  if (!apiKey) return null;
  return appRegistry.findByApiKey(apiKey);
}

export function requireAppAuth(request: FastifyRequest): MatuByteApp {
  const app = resolveAppFromRequest(request);
  if (!app) throw new UnauthorizedError("API key de app inválida o ausente");
  return app;
}

export function requireMasterKey(request: FastifyRequest): void {
  const apiKey = extractApiKey(request);
  if (!env.PAYMATUBYTE_MASTER_KEY || apiKey !== env.PAYMATUBYTE_MASTER_KEY) {
    throw new UnauthorizedError("Se requiere master key");
  }
}

export function requireMasterOrApp(request: FastifyRequest, appId?: string): MatuByteApp {
  const apiKey = extractApiKey(request);
  if (!apiKey) throw new UnauthorizedError();

  if (env.PAYMATUBYTE_MASTER_KEY && apiKey === env.PAYMATUBYTE_MASTER_KEY) {
    if (!appId) throw new UnauthorizedError("appId requerido con master key");
    const app = appRegistry.getById(appId);
    if (!app) throw new UnauthorizedError(`App '${appId}' no registrada`);
    return app;
  }

  const app = appRegistry.findByApiKey(apiKey);
  if (!app) throw new UnauthorizedError();
  if (appId && app.id !== appId) {
    throw new UnauthorizedError("No puedes operar sobre otra aplicación");
  }
  return app;
}
