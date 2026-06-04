import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors.js";

async function fetchCopPerUsd(): Promise<number> {
  const fallback = env.EXCHANGE_RATE_COP_PER_USD;

  if (!env.URL_API_EXCHANGERATE) {
    console.warn(
      `[currency] URL_API_EXCHANGERATE no configurada; usando EXCHANGE_RATE_COP_PER_USD=${fallback}`,
    );
    return fallback;
  }

  try {
    const res = await fetch(env.URL_API_EXCHANGERATE, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = (await res.json()) as { conversion_rates?: { COP?: number } };
    const rate = data.conversion_rates?.COP;
    if (rate != null && rate > 0) return rate;

    throw new Error("conversion_rates.COP ausente");
  } catch (err) {
    console.warn(
      `[currency] No se pudo obtener tasa en vivo (${err instanceof Error ? err.message : err}); usando ${fallback} COP/USD`,
    );
    return fallback;
  }
}

/** Conversión USD → COP como fymapp-api (countryCode 2 / licencia USA). */
export async function convertUsdToCop(amountUsd: number): Promise<number> {
  const rate = await fetchCopPerUsd();
  return Math.round(amountUsd * rate);
}

export async function resolveAmountCop(params: {
  amount: number;
  currency: string;
  convertUsdToCop?: boolean;
}): Promise<{ total_amount: number; currency: "COP" }> {
  const currency = params.currency.toUpperCase();

  if (currency === "COP") {
    return { total_amount: Math.round(params.amount), currency: "COP" };
  }

  if (currency === "USD" && params.convertUsdToCop) {
    return { total_amount: await convertUsdToCop(params.amount), currency: "COP" };
  }

  if (currency === "USD") {
    throw new AppError("Monto en USD requiere convertUsdToCop: true en la app", 400);
  }

  throw new AppError(`Moneda no soportada: ${currency}`, 400);
}
