import { isDevelopment } from "../../config/env.js";
import { tryParseAbsoluteUrl } from "../payments/callback-url.js";
import type { MatuByteApp } from "./app.types.js";

function normalizeReturnUrl(raw: string, label: string): string {
  const parsed = tryParseAbsoluteUrl(raw);
  if (!parsed) {
    throw new Error(`${label} inválida para app: ${raw}`);
  }
  return parsed.toString();
}

/** URL del frontend de la app donde el usuario ve el resultado (modal, etc.) */
export function resolveAppReturnUrl(app: MatuByteApp, override?: string): string {
  if (override) return normalizeReturnUrl(override, "returnUrl");

  if (app.returnUrls) {
    const raw = isDevelopment() ? app.returnUrls.development : app.returnUrls.production;
    return normalizeReturnUrl(raw, `returnUrls.${isDevelopment() ? "development" : "production"}`);
  }

  if (app.callbackUrl) return normalizeReturnUrl(app.callbackUrl, "callbackUrl");

  throw new Error(`App '${app.id}' sin returnUrls ni callbackUrl en config`);
}
