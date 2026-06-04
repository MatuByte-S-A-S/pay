import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAppAuth } from "../shared/auth.js";
import { resolveWalletAppId } from "../modules/apps/wallet-app.js";
import { getAppBalance } from "../repositories/balance.repository.js";
import { listPaymentsByAppAndEnvironment } from "../repositories/payment.repository.js";
import { paymentRowToApi } from "../db/payment.types.js";
import type { PaymentEnvironment } from "../modules/payments/payment-environment.js";

const envQuerySchema = z.enum(["live", "sandbox"]).optional();

function parseEnvironment(value: unknown): PaymentEnvironment | undefined {
  const parsed = envQuerySchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export async function walletRoutes(app: FastifyInstance) {
  /**
   * Saldo y transacciones por entorno (live / sandbox independientes).
   * ?environment=sandbox | live — sin query devuelve ambos.
   */
  app.get("/v1/wallet", async (request) => {
    const matuApp = requireAppAuth(request);
    const walletAppId = resolveWalletAppId(matuApp);
    const q = request.query as { environment?: string; limit?: string };
    const environment = parseEnvironment(q.environment);
    const limit = Math.min(Number(q.limit) || 50, 100);

    if (environment) {
      const balance = await getAppBalance(walletAppId, environment);
      const transactions = await listPaymentsByAppAndEnvironment(
        walletAppId,
        environment,
        limit,
      );
      return {
        status: "success",
        appId: walletAppId,
        environment,
        balanceCop: balance.balance_cop,
        currency: balance.currency,
        updatedAt: balance.updated_at,
        transactions: transactions.map(paymentRowToApi),
      };
    }

    const [liveBalance, sandboxBalance, liveTx, sandboxTx] = await Promise.all([
      getAppBalance(walletAppId, "live"),
      getAppBalance(walletAppId, "sandbox"),
      listPaymentsByAppAndEnvironment(walletAppId, "live", limit),
      listPaymentsByAppAndEnvironment(walletAppId, "sandbox", limit),
    ]);

    return {
      status: "success",
      appId: walletAppId,
      live: {
        balanceCop: liveBalance.balance_cop,
        currency: liveBalance.currency,
        updatedAt: liveBalance.updated_at,
        transactions: liveTx.map(paymentRowToApi),
      },
      sandbox: {
        balanceCop: sandboxBalance.balance_cop,
        currency: sandboxBalance.currency,
        updatedAt: sandboxBalance.updated_at,
        transactions: sandboxTx.map(paymentRowToApi),
      },
    };
  });
}
