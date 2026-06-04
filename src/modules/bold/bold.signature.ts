import { createHmac, timingSafeEqual } from "node:crypto";
import { isDevelopment } from "../../config/env.js";

export function verifyBoldWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secretKey: string,
): boolean {
  if (!signatureHeader) return false;
  const encoded = Buffer.from(rawBody, "utf-8").toString("base64");
  const hashed = createHmac("sha256", secretKey).update(encoded).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hashed), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export function getWebhookSecretForEnv(configuredSecret: string): string {
  return isDevelopment() && !configuredSecret ? "" : configuredSecret;
}
