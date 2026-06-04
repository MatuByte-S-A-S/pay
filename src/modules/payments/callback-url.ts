import { env, isDevelopment } from "../../config/env.js";
import { AppError } from "../../shared/errors.js";

export function getPayMatuPublicBaseUrl(): string {
  return env.PAYMATUBYTE_PUBLIC_URL.replace(/\/$/, "");
}

/** URL pública de PayMatuByte (Bold redirige aquí; luego reenviamos al frontend de cada app). */
export function buildBoldCallbackUrl(appId: string, reference: string): string {
  const params = new URLSearchParams({ reference });
  return `${getPayMatuPublicBaseUrl()}/v1/pay/return/${encodeURIComponent(appId)}?${params}`;
}

export function isHttpsCallbackUrl(callbackUrl: string): boolean {
  try {
    return new URL(callbackUrl).protocol === "https:";
  } catch {
    return false;
  }
}

const LOCALHOST_CALLBACK_MSG =
  "Bold no acepta callback_url con http://localhost. En local: (1) ngrok http 3000 y PAYMATUBYTE_PUBLIC_URL=https://TU-SUBDOMINIO.ngrok-free.app, o (2) BOLD_DEV_NO_CALLBACK=true en PayMatuByte/.env para probar solo tarjeta sin retorno automático.";

/** Bold exige HTTPS en callback_url; http://localhost devuelve 403 Forbidden. */
export function resolveBoldCallbackForApp(
  appId: string,
  reference: string,
): { callback_url?: string; payment_methods?: string[] } {
  const callback_url = buildBoldCallbackUrl(appId, reference);

  if (isHttpsCallbackUrl(callback_url)) {
    return { callback_url };
  }

  if (isDevelopment() && env.BOLD_DEV_NO_CALLBACK) {
    return {
      callback_url: undefined,
      payment_methods: ["CREDIT_CARD"],
    };
  }

  throw new AppError(LOCALHOST_CALLBACK_MSG, 400, "BOLD_CALLBACK_NOT_HTTPS");
}

export function buildAppReturnRedirect(
  returnBase: string,
  params: {
    reference: string;
    status: string;
    transactionId?: string | null;
    linkId?: string;
  },
): string {
  const url = new URL(returnBase);
  url.searchParams.set("reference", params.reference);
  url.searchParams.set("status", params.status);
  url.searchParams.set("paid", params.status === "PAID" ? "true" : "false");
  if (params.transactionId) url.searchParams.set("transaction_id", params.transactionId);
  if (params.linkId) url.searchParams.set("link_id", params.linkId);
  return url.toString();
}
