import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  MATUDB_URL: z.string().url().default("https://db.matudb.com"),
  MATUDB_PROJECT_ID: z.string().min(1, "MATUDB_PROJECT_ID requerido"),
  /** Llave del proyecto MatuDB (panel → API Keys). Ver MATUDB.md */
  MATUDB_API_KEY: z.string().min(1, "MATUDB_API_KEY requerida"),

  /** Igual que fymapp-api */
  URL_API_BOLD: z.string().url().default("https://integrations.api.bold.co/online/link/v1"),
  AUTHORIZATION_BOLD: z.string().min(10, "AUTHORIZATION_BOLD requerida (producción)"),
  AUTHORIZATION_BOLD_DEV: z.string().min(10, "AUTHORIZATION_BOLD_DEV requerida (pruebas)"),

  URL_API_EXCHANGERATE: z.string().url().optional(),
  /** COP por 1 USD si la API de cambio falla o no está configurada (Matu AI) */
  EXCHANGE_RATE_COP_PER_USD: z.coerce.number().positive().default(4200),
  BOLD_DEFAULT_IMAGE_URL: z.string().url().optional(),

  /** URL pública de este backend (Bold → aquí → frontend de cada app). Debe ser HTTPS para Bold. */
  PAYMATUBYTE_PUBLIC_URL: z.string().url().default("http://localhost:3000"),

  /**
   * Solo desarrollo: omitir callback_url y cobrar solo con tarjeta (Bold rechaza http://localhost).
   * Para flujo completo con PSE/retorno usa ngrok y PAYMATUBYTE_PUBLIC_URL=https://tu-tunnel.ngrok.app
   */
  BOLD_DEV_NO_CALLBACK: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),

  BOLD_WEBHOOK_SECRET: z.string().optional().default(""),
  PAYMATUBYTE_MASTER_KEY: z.string().optional(),
  DEMO_PAGE_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== "false" && v !== "0"),
  DEMO_APP_ID: z.string().default("paymatubyte"),

  /** Firebase Cloud Messaging (cuenta de servicio) — push MatuPay */
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Variables de entorno inválidas:\n${issues}`);
  }
  return parsed.data;
}

const loaded = loadEnv();

export const env = {
  ...loaded,
  matudbUrl: loaded.MATUDB_URL.replace(/\/$/, ""),
  matudbProjectId: loaded.MATUDB_PROJECT_ID,
  matudbApiKey: loaded.MATUDB_API_KEY,
};

export const isDevelopment = () => env.NODE_ENV === "development";
