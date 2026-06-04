import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAppAuth } from "../shared/auth.js";
import { resolveWalletAppId } from "../modules/apps/wallet-app.js";
import {
  deletePushDeviceByToken,
  upsertPushDevice,
} from "../repositories/push-device.repository.js";

const registerSchema = z.object({
  token: z.string().min(20),
  platform: z.enum(["android", "ios", "web"]).optional(),
});

export async function deviceRoutes(app: FastifyInstance) {
  app.post("/v1/devices/push-token", async (request) => {
    const matuApp = requireAppAuth(request);
    const body = registerSchema.parse(request.body);
    const walletAppId = resolveWalletAppId(matuApp);

    await upsertPushDevice({
      appId: matuApp.id,
      walletAppId,
      fcmToken: body.token,
      platform: body.platform,
    });

    return {
      status: "success",
      walletAppId,
      registered: true,
    };
  });

  app.delete("/v1/devices/push-token", async (request) => {
    requireAppAuth(request);
    const body = registerSchema.parse(request.body);
    await deletePushDeviceByToken(body.token);
    return { status: "success", removed: true };
  });
}
