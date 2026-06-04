import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { appConfigSchema, type MatuByteApp } from "./app.types.js";
import { NotFoundError } from "../../shared/errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_APPS_DIR = path.resolve(__dirname, "../../../config/apps");

export class AppRegistry {
  private apps = new Map<string, MatuByteApp>();

  constructor(private readonly appsDir = process.env.APPS_CONFIG_DIR ?? DEFAULT_APPS_DIR) {}

  async load(): Promise<void> {
    this.apps.clear();
    let files: string[];
    try {
      files = await readdir(this.appsDir);
    } catch {
      console.warn(`[apps] Directorio no encontrado: ${this.appsDir}`);
      return;
    }

    for (const file of files) {
      if (!file.endsWith(".yaml") && !file.endsWith(".yml")) continue;
      const fullPath = path.join(this.appsDir, file);
      try {
        const raw = await readFile(fullPath, "utf-8");
        const parsed = parseYaml(raw);
        const config = appConfigSchema.parse(parsed);
        if (!config.enabled) continue;

        const app: MatuByteApp = { ...config, configPath: fullPath };
        this.apps.set(app.id, app);
      } catch (err) {
        console.error(`[apps] No se cargó ${file}:`, err instanceof Error ? err.message : err);
      }
    }

    const ids = [...this.apps.keys()].join(", ");
    console.info(`[apps] ${this.apps.size} aplicación(es) cargada(s): ${ids || "(ninguna)"}`);
  }

  getAll(): MatuByteApp[] {
    return [...this.apps.values()];
  }

  getById(id: string): MatuByteApp | undefined {
    return this.apps.get(id);
  }

  requireById(id: string): MatuByteApp {
    const app = this.getById(id);
    if (!app) throw new NotFoundError(`App '${id}' no está registrada`);
    return app;
  }

  findByApiKey(apiKey: string): MatuByteApp | null {
    for (const app of this.apps.values()) {
      if (app.apiKey === apiKey) return app;
    }
    return null;
  }

  getCatalogItem(app: MatuByteApp, productId: string) {
    const item = app.catalog.find((c) => c.id === productId);
    if (!item) throw new NotFoundError(`Producto '${productId}' no existe en app '${app.id}'`);
    return item;
  }
}

export const appRegistry = new AppRegistry();
