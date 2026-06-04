import { mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { appRegistry } from "./modules/apps/app.registry.js";

async function ensureDataDir() {
  const dbPath = env.DATABASE_URL.replace("file:", "");
  const dir = path.dirname(dbPath);
  await mkdir(dir, { recursive: true });
}

async function main() {
  await ensureDataDir();
  await appRegistry.load();

  const app = await buildApp();
  await app.listen({ port: env.PORT, host: env.HOST });
  console.info(`PayMatuByte escuchando en http://${env.HOST}:${env.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
