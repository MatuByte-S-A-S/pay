import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { appRegistry } from "./modules/apps/app.registry.js";
import { checkMatuDbConnection } from "./db/matu.js";

async function main() {
  await appRegistry.load();

  const matudb = await checkMatuDbConnection();
  if (!matudb.ok) {
    console.warn("[paymatubyte] MatuDB:", matudb.message ?? "no disponible");
  }

  const app = await buildApp();
  await app.listen({ port: env.PORT, host: env.HOST });
  console.info(`PayMatuByte escuchando en http://${env.HOST}:${env.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
