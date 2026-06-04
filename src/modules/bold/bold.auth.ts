import { env, isDevelopment } from "../../config/env.js";

/** Header completo tal como fymapp-api: `x-api-key <token>` */
export function getBoldAuthorizationHeader(): string {
  return isDevelopment() ? env.AUTHORIZATION_BOLD_DEV : env.AUTHORIZATION_BOLD;
}
