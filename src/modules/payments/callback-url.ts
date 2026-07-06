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

export function tryParseAbsoluteUrl(raw: string | undefined): URL | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!url.hostname) return null;
    return url;
  } catch {
    return null;
  }
}

export function isHttpsCallbackUrl(callbackUrl: string): boolean {
  try {
    return new URL(callbackUrl).protocol === "https:";
  } catch {
    return false;
  }
}

const LOCALHOST_CALLBACK_MSG =
  "Bold exige callback_url HTTPS. En local: ngrok http 3000 y PAYMATUBYTE_PUBLIC_URL=https://TU-ID.ngrok-free.app (o BOLD_DEV_NO_CALLBACK=true solo tarjeta, sin retorno automático).";

function buildFallbackBoldCallbackUrl(appId: string, reference: string): string | undefined {
  const base = env.PAYMATUBYTE_CALLBACK_FALLBACK_URL.replace(/\/$/, "");
  const params = new URLSearchParams({ reference });
  const url = `${base}/v1/pay/return/${encodeURIComponent(appId)}?${params}`;
  return isHttpsCallbackUrl(url) ? url : undefined;
}

/**
 * Bold usa callback_url para «Volver a la tienda». Debe ser URL absoluta HTTPS válida.
 */
export function resolveBoldCallbackForApp(
  appId: string,
  reference: string,
  appReturnUrl?: string,
): { callback_url?: string; payment_methods?: string[] } {
  const paymatuCallback = buildBoldCallbackUrl(appId, reference);

  if (isHttpsCallbackUrl(paymatuCallback)) {
    return { callback_url: paymatuCallback };
  }

  const appCallback = tryParseAbsoluteUrl(appReturnUrl);
  if (appCallback?.protocol === "https:") {
    return { callback_url: appCallback.toString() };
  }

  // Solo si se pide explícitamente: sin callback (el botón «Volver a la tienda» de Bold fallará).
  if (isDevelopment() && env.BOLD_DEV_NO_CALLBACK) {
    return { payment_methods: ["CREDIT_CARD"] };
  }

  const fallbackCallback = buildFallbackBoldCallbackUrl(appId, reference);
  if (fallbackCallback) {
    if (isDevelopment()) {
      console.warn(
        "[PayMatuByte] Callback Bold vía relay HTTPS:",
        fallbackCallback,
        "— para retorno local directo: ngrok en PAYMATUBYTE_PUBLIC_URL",
      );
    }
    return { callback_url: fallbackCallback };
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
  const parsed = tryParseAbsoluteUrl(returnBase);
  if (!parsed) {
    throw new AppError(`returnUrl inválida: ${returnBase}`, 500, "INVALID_RETURN_URL");
  }
  parsed.searchParams.set("reference", params.reference);
  parsed.searchParams.set("status", params.status);
  parsed.searchParams.set("paid", params.status === "PAID" ? "true" : "false");
  if (params.transactionId) parsed.searchParams.set("transaction_id", params.transactionId);
  if (params.linkId) parsed.searchParams.set("link_id", params.linkId);
  return parsed.toString();
}
