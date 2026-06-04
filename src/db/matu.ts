import { createClient, type MatuDBClient } from "@devjuanes/matuclient";
import { env } from "../config/env.js";

let adminClient: MatuDBClient | null = null;

export function getDb(): MatuDBClient {
  if (!adminClient) {
    const { matudbUrl, matudbProjectId, matudbApiKey } = env;

    if (!matudbProjectId || !matudbApiKey) {
      throw new Error("MATUDB_PROJECT_ID y MATUDB_API_KEY son requeridos");
    }

    adminClient = createClient({
      url: matudbUrl,
      projectId: matudbProjectId,
      apiKey: matudbApiKey,
      useSupabase: false,
    });
  }
  return adminClient;
}

export async function checkMatuDbConnection(): Promise<{ ok: boolean; message?: string }> {
  try {
    const db = getDb();
    const { error } = await db.from("paymatu_payments").select("id").limit(1);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "MatuDB error" };
  }
}
