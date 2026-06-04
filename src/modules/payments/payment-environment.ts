import { isDevelopment } from "../../config/env.js";

export type PaymentEnvironment = "live" | "sandbox";

/** En NODE_ENV=development usamos llave Bold dev → pagos de prueba. */
export function resolvePaymentEnvironment(): PaymentEnvironment {
  return isDevelopment() ? "sandbox" : "live";
}

export function environmentFromBoldSandbox(isSandbox?: boolean): PaymentEnvironment {
  if (isSandbox === true) return "sandbox";
  if (isSandbox === false) return "live";
  return resolvePaymentEnvironment();
}

export const PAID_STATUSES = new Set(["PAID", "APPROVED", "SALE_APPROVED"]);

export function isPaidStatus(status: string): boolean {
  return PAID_STATUSES.has(status.toUpperCase());
}
