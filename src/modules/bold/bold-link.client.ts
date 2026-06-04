import { env } from "../../config/env.js";
import { getBoldAuthorizationHeader } from "./bold.auth.js";
import { AppError } from "../../shared/errors.js";
import type {
  BoldCreateLinkRequest,
  BoldCreateLinkResponse,
  BoldLinkStatusResponse,
} from "./bold-link.types.js";

const DEFAULT_METHODS = ["CREDIT_CARD", "PSE", "BOTON_BANCOLOMBIA", "NEQUI"] as const;

/**
 * Cliente Bold API Link — mismo contrato que fymapp-api/controllers/paymentController.js
 * Base: URL_API_BOLD = https://integrations.api.bold.co/online/link/v1
 */
export class BoldLinkClient {
  constructor(private readonly baseUrl = env.URL_API_BOLD) {}

  private headers() {
    return {
      Authorization: getBoldAuthorizationHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private async parseError(res: Response, raw: Record<string, unknown>) {
    const errors = raw.errors as Array<{ message?: string; errors?: string }> | undefined;
    let message =
      errors?.[0]?.message ??
      errors?.[0]?.errors ??
      (raw.message as string) ??
      (raw.Message as string) ??
      `Bold API error (${res.status})`;

    if (res.status === 403 && /forbidden/i.test(message)) {
      message =
        "Bold rechazó la petición (403). Si usas localhost, configura PAYMATUBYTE_PUBLIC_URL con HTTPS (ngrok) o BOLD_DEV_NO_CALLBACK=true.";
    }

    throw new AppError(message, res.status, "BOLD_API_ERROR");
  }

  async getPaymentMethods() {
    const res = await fetch(`${this.baseUrl}/payment_methods`, { headers: this.headers() });
    const raw = (await res.json().catch(() => ({}))) as {
      payload?: { payment_methods: Record<string, { min: number; max: number }> };
      errors?: unknown[];
      message?: string;
    };
    if (!res.ok) await this.parseError(res, raw);

    const methods = raw.payload?.payment_methods ?? {};
    return Object.keys(methods).map((name) => ({ name, ...methods[name] }));
  }

  async createPaymentLink(body: BoldCreateLinkRequest) {
    const payload: Record<string, unknown> = {
      amount_type: "CLOSE" as const,
      amount: {
        currency: body.currency ?? "COP",
        tip_amount: 0,
        total_amount: body.total_amount,
      },
      description: body.description,
      payment_methods: body.payment_methods ?? [...DEFAULT_METHODS],
      reference: body.reference,
      image_url: body.image_url,
    };
    if (body.callback_url) payload.callback_url = body.callback_url;

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });

    const raw = (await res.json().catch(() => ({}))) as {
      payload?: BoldCreateLinkResponse;
      errors?: unknown[];
      message?: string;
    };
    if (!res.ok) await this.parseError(res, raw);

    const link = raw.payload;
    if (!link?.url || !link?.payment_link) {
      throw new AppError("Bold no devolvió link de pago", 502, "BOLD_INVALID_RESPONSE");
    }
    return link;
  }

  /** GET link status — respuesta en raíz (sin payload), igual que fymapp */
  async getPaymentLink(linkId: string): Promise<BoldLinkStatusResponse> {
    const res = await fetch(`${this.baseUrl}/${encodeURIComponent(linkId)}`, {
      headers: this.headers(),
    });
    const raw = (await res.json().catch(() => ({}))) as BoldLinkStatusResponse & {
      message?: string;
      errors?: unknown[];
    };
    if (!res.ok) await this.parseError(res, raw as unknown as Record<string, unknown>);
    return raw;
  }
}

export const boldLinkClient = new BoldLinkClient();
