import { boldLinkClient } from "./bold-link.client.js";

export interface BoldConnectionStatus {
  ok: boolean;
  message: string;
  docsUrl: string;
}

const DOCS = "https://developers.bold.co/pagos-en-linea/api-link-de-pagos";

export async function checkBoldConnection(): Promise<BoldConnectionStatus> {
  try {
    await boldLinkClient.getPaymentMethods();
    return { ok: true, message: "Conexión Bold API Link OK.", docsUrl: DOCS };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Error desconocido",
      docsUrl: DOCS,
    };
  }
}
