import type { MatuByteApp } from "./app.types.js";

export function resolveWalletAppId(app: MatuByteApp): string {
  return app.walletAppId ?? app.id;
}
