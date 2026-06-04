import { z } from "zod";

export const catalogItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  /** COP o USD (con convertUsdToCop en la app) */
  currency: z.enum(["COP", "USD"]).default("COP"),
});

export const appConfigSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id: solo minúsculas, números y guiones"),
  name: z.string().min(1),
  /** API key que usan tus proyectos SaaS para llamar PayMatuByte */
  apiKey: z.string().min(8),
  enabled: z.boolean().default(true),

  /**
   * URL del frontend de ESTA app tras el pago (modal éxito/error).
   * Usa returnUrls para dev/prod; callbackUrl queda como alias de production.
   */
  returnUrls: z
    .object({
      development: z.string().url(),
      production: z.string().url(),
    })
    .optional(),
  /** @deprecated Usa returnUrls — se mantiene como fallback = production */
  callbackUrl: z.string().url().optional(),
  /** Imagen en checkout Bold (.png o .jpg https) */
  imageUrl: z.string().url().optional(),

  paymentMethods: z
    .array(z.enum(["CREDIT_CARD", "PSE", "BOTON_BANCOLOMBIA", "NEQUI", "DAVIPLATA"]))
    .default(["CREDIT_CARD", "PSE", "BOTON_BANCOLOMBIA", "NEQUI"]),

  /** Si currency USD en catálogo, convertir a COP antes de Bold (como fymapp countryCode 2) */
  convertUsdToCop: z.boolean().default(false),

  webhookUrl: z.string().url().optional(),
  catalog: z.array(catalogItemSchema).default([]),
}).refine((data) => data.returnUrls || data.callbackUrl, {
  message: "Define returnUrls (development + production) o callbackUrl",
});

export type AppConfigFile = z.infer<typeof appConfigSchema>;
export type CatalogItem = z.infer<typeof catalogItemSchema>;

export interface MatuByteApp extends AppConfigFile {
  configPath: string;
}
