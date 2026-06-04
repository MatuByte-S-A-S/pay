import { isDevelopment } from "../../config/env.js";
import type { MatuByteApp } from "./app.types.js";

/** URL del frontend de la app donde el usuario ve el resultado (modal, etc.) */
export function resolveAppReturnUrl(app: MatuByteApp, override?: string): string {
  if (override) return override;

  if (app.returnUrls) {
    return isDevelopment() ? app.returnUrls.development : app.returnUrls.production;
  }

  if (app.callbackUrl) return app.callbackUrl;

  throw new Error(`App '${app.id}' sin returnUrls ni callbackUrl en config`);
}
