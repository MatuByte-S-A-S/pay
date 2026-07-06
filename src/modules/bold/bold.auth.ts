import { env, isDevelopment } from "../../config/env.js";
import type { PaymentEnvironment } from "../payments/payment-environment.js";

/** Header completo tal como fymapp-api: `x-api-key <token>` */
export function getBoldAuthorizationHeaderForEnvironment(
  environment: PaymentEnvironment,
): string {
  return environment === "sandbox" ? env.AUTHORIZATION_BOLD_DEV : env.AUTHORIZATION_BOLD;
}

/** Llave según NODE_ENV al crear links (dev → sandbox, prod → live). */
export function getBoldAuthorizationHeader(): string {
  return getBoldAuthorizationHeaderForEnvironment(isDevelopment() ? "sandbox" : "live");
}
