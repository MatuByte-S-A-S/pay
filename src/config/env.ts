import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("file:./data/paymatubyte.db"),

  /** Igual que fymapp-api */
  URL_API_BOLD: z.string().url().default("https://integrations.api.bold.co/online/link/v1"),
  AUTHORIZATION_BOLD: z.string().min(10, "AUTHORIZATION_BOLD requerida (producción)"),
  AUTHORIZATION_BOLD_DEV: z.string().min(10, "AUTHORIZATION_BOLD_DEV requerida (pruebas)"),

  URL_API_EXCHANGERATE: z.string().url().optional(),
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

export const env = loadEnv();

export const isDevelopment = () => env.NODE_ENV === "development";
