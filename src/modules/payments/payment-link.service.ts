import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { boldLinkClient } from "../bold/bold-link.client.js";
import { AppError, NotFoundError } from "../../shared/errors.js";
import type { MatuByteApp } from "../apps/app.types.js";
import { appRegistry } from "../apps/app.registry.js";
import { resolveAmountCop } from "./currency.service.js";
import { resolveBoldCallbackForApp } from "./callback-url.js";
import { resolveAppReturnUrl } from "../apps/return-url.js";
import {
  findPaymentByLinkOrReference,
  findPaymentByReference,
  updatePaymentStatus,
  upsertPaymentByReference,
} from "../../repositories/payment.repository.js";
import {
  environmentFromBoldSandbox,
  resolvePaymentEnvironment,
  type PaymentEnvironment,
} from "./payment-environment.js";
import { applyPaymentToBalance } from "./balance.service.js";

export interface CreatePaymentLinkInput {
  app: MatuByteApp;
  productId?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  description?: string;
  license?: string;
  returnUrl?: string;
}

export class PaymentLinkService {
  async createLink(input: CreatePaymentLinkInput) {
    const { app } = input;
    const reference =
      input.reference ?? (input.license ? `${input.license}_${Date.now()}` : `ORD-${randomUUID()}`);

    let rawAmount: number;
    let rawCurrency: string;
    let productId: string | undefined;
    let description = input.description ?? "Pago MatuByte";

    if (input.productId) {
      const item = appRegistry.getCatalogItem(app, input.productId);
      rawAmount = item.amount;
      rawCurrency = item.currency;
      productId = item.id;
      description = input.description ?? item.description ?? item.name;
    } else if (input.amount != null) {
      rawAmount = input.amount;
      rawCurrency = input.currency ?? "COP";
    } else {
      throw new AppError("Envía productId o amount", 400, "AMOUNT_REQUIRED");
    }

    const { total_amount, currency } = await resolveAmountCop({
      amount: rawAmount,
      currency: rawCurrency,
      convertUsdToCop: app.convertUsdToCop,
    });

    const appReturnUrl = resolveAppReturnUrl(app, input.returnUrl);
    const boldCallback = resolveBoldCallbackForApp(app.id, reference);
    const payment_methods = boldCallback.payment_methods ?? app.paymentMethods;

    const link = await boldLinkClient.createPaymentLink({
      total_amount,
      currency,
      description,
      reference,
      callback_url: boldCallback.callback_url,
      image_url: app.imageUrl ?? env.BOLD_DEFAULT_IMAGE_URL,
      payment_methods,
    });

    const environment = resolvePaymentEnvironment();

    const payment = await upsertPaymentByReference({
      appId: app.id,
      reference,
      productId: productId ?? null,
      paymentLinkId: link.payment_link,
      checkoutUrl: link.url,
      status: "ACTIVE",
      amountTotal: total_amount,
      currency,
      paymentMethod: "PAYMENT_LINK",
      description,
      environment,
      isSandbox: environment === "sandbox",
      returnUrl: appReturnUrl,
    });

    return {
      status: "success",
      data: {
        url: link.url,
        link_id: link.payment_link,
        reference: payment.reference,
        amount: total_amount,
        currency,
        appId: app.id,
        environment,
        returnUrl: appReturnUrl,
        boldCallbackUrl: boldCallback.callback_url ?? null,
      },
    };
  }

  async handlePaymentReturn(appId: string, reference: string) {
    const app = appRegistry.getById(appId);
    if (!app) throw new NotFoundError(`App '${appId}' no registrada`);

    const statusResult = await this.getLinkStatus(reference);
    const { data } = statusResult;
    const paymentRow = await findPaymentByReference(reference);
    const storedReturnUrl = parseReturnUrlFromMetadata(paymentRow?.metadata ?? null);

    return {
      app,
      returnUrl: resolveAppReturnUrl(app, storedReturnUrl),
      payment: data,
    };
  }

  async getLinkStatus(linkId: string, appId?: string) {
    const payment = await findPaymentByLinkOrReference(linkId);
    if (!payment) throw new NotFoundError("Transacción no encontrada");
    if (appId && payment.app_id !== appId) throw new NotFoundError("Transacción no encontrada");

    const boldId = payment.payment_link_id ?? linkId;
    const data = await boldLinkClient.getPaymentLink(boldId);
    const environment = environmentFromBoldSandbox(data.is_sandbox) as PaymentEnvironment;
    const previousStatus = payment.status;

    await updatePaymentStatus(payment.id, {
      status: data.status,
      boldTransactionId: data.transaction_id ?? payment.bold_transaction_id,
      environment,
      isSandbox: data.is_sandbox ?? environment === "sandbox",
    });

    const updated = await findPaymentByReference(payment.reference);
    if (updated) {
      await applyPaymentToBalance(updated, data.status, previousStatus, environment);
    }

    return {
      status: "success",
      data: {
        status: data.status,
        is_sandbox: data.is_sandbox,
        environment,
        id: data.id,
        transaction_id: data.transaction_id,
        reference: payment.reference,
        appId: payment.app_id,
      },
    };
  }
}

function parseReturnUrlFromMetadata(metadata: string | null): string | undefined {
  if (!metadata) return undefined;
  try {
    const parsed = JSON.parse(metadata) as { returnUrl?: unknown };
    return typeof parsed.returnUrl === "string" ? parsed.returnUrl : undefined;
  } catch {
    return undefined;
  }
}

export const paymentLinkService = new PaymentLinkService();
