import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors.js";

/** Conversión USD → COP como fymapp-api (countryCode 2 / licencia USA). */
export async function convertUsdToCop(amountUsd: number): Promise<number> {
  if (!env.URL_API_EXCHANGERATE) {
    throw new AppError("URL_API_EXCHANGERATE no configurada para conversión USD→COP", 500);
  }

  const res = await fetch(env.URL_API_EXCHANGERATE);
  if (!res.ok) throw new AppError("No se pudo obtener tasa de cambio", 502);

  const data = (await res.json()) as { conversion_rates?: { COP?: number } };
  const rate = data.conversion_rates?.COP ?? 4000;
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
